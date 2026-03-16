import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// const sendMail = async (email, otp) => {
//   const info = await transporter.sendMail({
//     from: `logiaFun support ${process.env.EMAIL_USER}`,
//     to: email,
//     subject: "OTP for email verification",
//     text: `Your verification OTP is ${otp}`,
//     html: `<b>Your verification OTP is ${otp}</b>`,
//   });
// };

const sendMail = async (email, otp) => {
  console.log("Sending OTP is : ", otp);
  const info = await transporter.sendMail({
    from: `"logiaFun Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your logiaFun Verification Code",
    html: `
<!DOCTYPE html>
<html lang="en">
  <body style="margin:0; padding:0; background-color:#f0f4f8; font-family:Arial, Helvetica, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.15);">

            <!-- Header -->
            <tr>
              <td style="background:#1e3a5f; padding:20px; text-align:center;">
                <h1 style="margin:0; font-size:22px; letter-spacing:0.5px;">
                  <span style="color:#f8b500;">logia</span><span style="color:#ffffff;">Fun</span>
                </h1>
                <p style="margin:6px 0 0; color:#cbd5e1; font-size:13px;">
                  Secure Email Verification
                </p>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding:28px; color:#0f172a;">
                <p style="margin:0 0 14px; font-size:15px;">
                  Hey 👋
                </p>

                <p style="margin:0 0 22px; font-size:15px; line-height:1.6; color:#334155;">
                  Use the verification code below to complete your login to
                  <strong>logiaFun</strong>.
                  This code is valid for <strong>5 minutes</strong>.
                </p>

                <!-- OTP Box -->
                <div style="text-align:center; margin:28px 0;">
                  <span style="
                    display:inline-block;
                    background:#1e3a5f;
                    color:#f8b500;
                    font-size:30px;
                    font-weight:bold;
                    letter-spacing:8px;
                    padding:14px 26px;
                    border-radius:10px;
                  ">
                    ${otp}
                  </span>
                </div>

                <p style="margin:24px 0 0; font-size:13px; color:#64748b;">
                  If you didn’t request this code, you can safely ignore this email.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background:#f8fafc; padding:16px; text-align:center; border-top:1px solid #e2e8f0;">
                <p style="margin:0; font-size:12px; color:#64748b;">
                  © 2026 <strong>logiaFun</strong>. All rights reserved.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
    `,
  });
};

export const sendMailToTempUser = async (email, otp) => {
  if (!email) {
    throw new Error("email not found while sending OTP");
  }

  await sendMail(email, otp);
};

export const sendMailToNewEmail = async (email, otp) => {
  await sendMail(email, otp);
};

export const sendMailToForgotPasswordEmail = async (email, otp) => {
  await sendMail(email, otp);
};
