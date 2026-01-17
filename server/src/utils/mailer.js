import nodemailer from "nodemailer";

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

export default sendMail;
