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

  await OTP.create({
    email: email,
    OTP: hashedOTP,
  });
};

export const verifyOTP = async (email, userOTP) => {
  const findOTP = await OTP.findOne({ email: email });

  if (!findOTP && !email) throw new Error("No OTP Found please resend");

  const realOTP = findOTP.OTP;

  const isValid = await bcrypt.compare(userOTP, realOTP);

  if (!isValid) throw new Error("OTP is invalid");

  await User.updateOne({ email: email }, { $set: { isVerified: true } });
};
