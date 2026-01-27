import nodemailer from "nodemailer";
import TempUser from "../models/tempUser.model.js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendMail = async (email, otp) => {
  const info = await transporter.sendMail({
    from: `logiaFun support ${process.env.EMAIL_USER}`,
    to: email,
    subject: "OTP for email verification",
    text: `Your verification OTP is ${otp}`,
    html: `<b>Your verification OTP is ${otp}</b>`,
  });
};

export const sendMailToTempUser = async (tempUserId, otp) => {
  const tempUser = await TempUser.findById(tempUserId);

  if (!tempUser) {
    throw new Error("Temp user not found while sending OTP");
  }

  await sendMail(tempUser.email, otp);
};

export const sendMailToNewEmail = async (email, otp) => {
  console.log("📧 Sending OTP to:", email);
  await sendMail(email, otp);
};
