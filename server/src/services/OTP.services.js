import OTP from "../models/otp.model.js";
import User from "../models/user.model.js";
import * as mailUtil from "../utils/mailer.js";
import crypto from "crypto";
import bcrypt from "bcrypt";

const OTP_EXPIRY_MS = 2 * 60 * 1000; // 5 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute
const MAX_ATTEMPTS = 5;

export const createAndSendSignupOTP = async (otpId, email, isResend) => {
  const now = new Date();

  const existing = otpId ? await OTP.findById(otpId) : null;

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

  let otpDoc;

  if (existing) {
    otpDoc = await OTP.findByIdAndUpdate(
      existing._id,
      {
        $set: {
          OTP: hashedOTP,
          expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
          lastResentAt: now,
        },
      },
      { new: true },
    );
  } else {
    otpDoc = await OTP.create({
      purpose: "signup",
      OTP: hashedOTP,
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
      lastResentAt: now,
      attempts: 0,
    });
  }

  await mailUtil.sendMailToTempUser(email, otp);

  return otpDoc;
};

export const verifySignupOTP = async (otpId, inputOtp, pendingUser) => {
  const otpDoc = await OTP.findOne({
    _id: otpId,
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

  // OTP is valid → create real user from session data
  if (!pendingUser) {
    throw new Error("Signup session expired");
  }

  const user = await User.create({
    name: pendingUser.name,
    email: pendingUser.email,
    phone: pendingUser.phone,
    password: pendingUser.password,
    isVerified: true,
  });

  // cleanup
  await OTP.deleteOne({ _id: otpDoc._id });

  return user;
};

export const getRemainingCooldown = async (id, purpose) => {
  const otp =
    purpose === "signup"
      ? await OTP.findOne({ _id: id, purpose })
      : await OTP.findOne({ userId: id, purpose });

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

export const createAndSendEmailChangeOTP = async (userId, email, isResend) => {
  const emailExist = await User.findOne({ email });

  if (emailExist) throw new Error("User with same email already exists");

  const now = new Date();

  const existing = await OTP.findOne({
    userId,
    purpose: "email_change",
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
    { userId: userId, purpose: "email_change" },
    {
      $setOnInsert: {
        userId: userId,
        purpose: "email_change",
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

  await mailUtil.sendMailToNewEmail(email, otp);

  return otpDoc;
};

export const verifyEmailChangeOTP = async (userId, inputOtp, tempNewMail) => {
  const otpDoc = await OTP.findOne({
    userId,
    purpose: "email_change",
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

  console.log("Updating email to:", tempNewMail);
  console.log("User ID:", otpDoc.userId);

  // OTP is valid → change user email

  await User.findByIdAndUpdate(
    otpDoc.userId,
    {
      email: tempNewMail,
      $unset: { googleId: 1 },
    },
    { new: true },
  );

  // cleanup
  await OTP.deleteOne({ _id: otpDoc._id });
};

export const createAndSendForgotPasswordOTP = async (email, isResend) => {
  const user = await User.findOne({ email });

  if (!user) throw new Error("User not found");

  const userId = user._id;

  const now = new Date();

  const existing = await OTP.findOne({
    userId,
    purpose: "forgot_password",
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
    { userId: userId, purpose: "forgot_password" },
    {
      $setOnInsert: {
        userId: userId,
        purpose: "forgot_password",
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

  await mailUtil.sendMailToForgotPasswordEmail(email, otp);

  return otpDoc;
};

export const verifyForgotPasswordOTP = async (userId, inputOtp) => {
  const otpDoc = await OTP.findOne({
    userId,
    purpose: "forgot_password",
    expiresAt: { $gt: new Date() },
  });

  if (!otpDoc) {
    throw new Error("OTP expired or not found");
  }

  // check brute force attempts
  if (otpDoc.attempts >= MAX_ATTEMPTS) {
    await OTP.deleteOne({ _id: otpDoc._id });
    throw new Error("Too many attempts. Please try again.");
  }

  const isValid = await bcrypt.compare(inputOtp, otpDoc.OTP);

  if (!isValid) {
    await OTP.updateOne({ _id: otpDoc._id }, { $inc: { attempts: 1 } });

    throw new Error("Invalid OTP");
  }

  //Generate a random toke string

  return crypto.randomBytes(64).toString("base64url");
};
