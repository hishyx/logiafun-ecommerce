import OTP from "../models/otp.model.js";
import User from "../models/user.model.js";
import sendMailToTempUser from "../utils/mailer.js";
import TempUser from "../models/tempUser.model.js";
import crypto from "crypto";
import bcrypt from "bcrypt";

const OTP_EXPIRY_MS = 2 * 60 * 1000; // 5 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute
const MAX_ATTEMPTS = 5;

export const createAndSendSignupOTP = async (tempUserId, isResend) => {
  const now = new Date();

  const existing = await OTP.findOne({
    userId: tempUserId,
    purpose: "signup",
  });

  if (
    isResend &&
    existing &&
    existing.lastResentAt &&
    now - existing.lastResentAt < RESEND_COOLDOWN_MS
  ) {
    throw new Error("Please wait before requesting another OTP");
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  const hashedOTP = await bcrypt.hash(otp, 10);

  const otpDoc = await OTP.findOneAndUpdate(
    { userId: tempUserId, purpose: "signup" },
    {
      $setOnInsert: {
        userId: tempUserId,
        purpose: "signup",
        attempts: 0,
      },
      $set: {
        OTP: hashedOTP,
        expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
        lastResentAt: now,
      },
    },
    { upsert: true, new: true },
  );

  await sendMailToTempUser(tempUserId, otp);

  return otpDoc;
};

export const verifySignupOTP = async (tempUserId, inputOtp) => {
  const otpDoc = await OTP.findOne({
    userId: tempUserId,
    purpose: "signup",
    expiresAt: { $gt: new Date() },
  });

  if (!otpDoc) {
    throw new Error("OTP expired or not found");
  }

  // check brute force attempts
  if (otpDoc.attempts >= MAX_ATTEMPTS) {
    await OTP.deleteOne({ _id: otpDoc._id });
    throw new Error("Too many attempts. Please signup again.");
  }

  const isValid = await bcrypt.compare(inputOtp, otpDoc.OTP);

  if (!isValid) {
    await OTP.updateOne({ _id: otpDoc._id }, { $inc: { attempts: 1 } });

    throw new Error("Invalid OTP");
  }

  // OTP is valid → create real user
  const tempUser = await TempUser.findById(tempUserId);

  if (!tempUser) {
    throw new Error("Signup session expired");
  }

  const user = await User.create({
    name: tempUser.name,
    email: tempUser.email,
    phone: tempUser.phone,
    password: tempUser.password,
    profileImage: "/images/profile.jpg",
    isVerified: true,
  });

  // cleanup
  await TempUser.deleteOne({ _id: tempUserId });
  await OTP.deleteOne({ _id: otpDoc._id });

  return user;
};

export const getRemainingCooldown = async (tempUserId) => {
  const otp = await OTP.findOne({
    userId: tempUserId,
    purpose: "signup",
  });

  const COOLDOWN = 60;

  let remaining = 0;

  if (otp && otp.lastResentAt) {
    const elapsed = Math.floor(
      (Date.now() - otp.lastResentAt.getTime()) / 1000,
    );
    remaining = Math.max(COOLDOWN - elapsed, 0);
  }

  return remaining;
};
