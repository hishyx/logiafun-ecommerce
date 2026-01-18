import OTP from "../models/otp.model.js";
import User from "../models/user.model.js";
import sendMail from "../utils/mailer.js";
import crypto from "crypto";
import bcrypt from "bcrypt";

export const createAndSendOTP = async (email) => {
  const findOTP = await OTP.findOne({ email: email });

  if (findOTP) return;

  const otp = crypto.randomInt(1000, 10000).toString();

  const hashedOTP = await bcrypt.hash(otp, 10);

  await sendMail(email, otp);

  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await OTP.create({
    email: email,
    OTP: hashedOTP,
    expiresAt,
  });
};

export const verifyOTP = async (email, userOTP) => {
  const findOTP = await OTP.findOne({ email: email });

  if (!findOTP && !email) throw new Error("No OTP Found please resend");

  const realOTP = findOTP.OTP;

  const isValid = await bcrypt.compare(userOTP, realOTP);

  if (!isValid) throw new Error("OTP is invalid");

  const user = await User.findOneAndUpdate(
    { email },
    { $set: { isVerified: true } },
    { new: true },
  );

  return user;
};

export const getRemainingTime = async (email) => {
  const otp = await OTP.findOne({ email });

  if (!otp) throw new Error("No otp found");

  const now = Date.now();
  const expiresAt = otp.expiresAt.getTime();

  const remainingMs = Math.max(0, expiresAt - now);

  const remainingSeconds = Math.floor(remainingMs / 1000);

  return remainingSeconds;
};
