import { updateUser } from "../services/user.services.js";
import {
  createAndSendEmailChangeOTP,
  verifyEmailChangeOTP,
  getRemainingCooldown,
} from "../services/OTP.services.js";

export const homePage = (req, res) => {
  res.render("user/home.ejs", {
    user: req.user,
  });
};

export const profilePage = async (req, res) => {
  res.render("user/profile", {
    user: req.user,
  });
};

export const addressPage = (req, res) => {
  res.render("user/addresses", {
    user: req.user,
  });
};

export const cartPage = (req, res) => {
  res.render("user/cart", { user: req.user });
};

export const editProfile = async (req, res) => {
  try {
    const { name, phone, newPassword, currentPassword } = req.body;

    const userData = { name, phone, newPassword, currentPassword };

    const updatedUser = await updateUser(req.user._id, userData);

    res.json({
      success: true,
      user: {
        name: updatedUser.name,
        phone: updatedUser.phone,
      },
    });
  } catch (err) {}
};

export const changeEmail = async (req, res) => {
  try {
    console.log("The req body is:", req.body);

    await createAndSendEmailChangeOTP(req.user._id, req.body.newEmail, false);

    req.session.newMail = req.body.newEmail;
    return res.status(200).json({
      success: true,
      message: "OTP sent to your new email address",
    });
  } catch (err) {
    console.error("Change email error:", err);

    return res.status(400).json({
      success: false,
      message: err.message || "Failed to send OTP",
    });
  }
};

export const resendEmailChangeOTP = async (req, res) => {
  try {
    const userId = req.user._id;
    const tempNewMail = req.session.newMail;

    const otp = await createAndSendEmailChangeOTP(userId, tempNewMail, true);

    return res.json({
      success: true,
      otpLastResend: otp.lastResentAt,
    });
  } catch (err) {
    console.error("Resend email change OTP error:", err);

    return res.status(400).json({
      success: false,
      message: err.message || "Failed to resend OTP",
    });
  }
};

export const emailChangeOTPVerification = async (req, res) => {
  try {
    await verifyEmailChangeOTP(
      req.user._id,
      req.body.userOTP,
      req.body.newEmail,
    );

    delete req.session.newEmail;
    res.redirect("/user/profile");
  } catch (err) {
    console.log("email change error is :" + err);
  }
};
