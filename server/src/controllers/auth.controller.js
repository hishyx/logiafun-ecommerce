import {
  createTempUserForSignup,
  authenticateUser,
  setNewPassword,
  authenticateAdminLogin,
} from "../services/auth.services.js";
import {
  createAndSendSignupOTP,
  verifySignupOTP,
  getRemainingCooldown,
  createAndSendForgotPasswordOTP,
  verifyForgotPasswordOTP,
} from "../services/OTP.services.js";

import User from "../models/user.model.js";

//Public Pages

export const loginPage = (req, res) => {
  res.render("auth/login", { error: req.flash("error") });
};

export const signupPage = (req, res) => {
  res.render("auth/signup", { error: req.flash("error") });
};

export const verifyOTPPage = async (req, res) => {
  try {
    const otpId = req.session.OTPId;

    if (!otpId) {
      throw new Error("Session expired. Please try again.");
    }

    const resendCooldown = await getRemainingCooldown(otpId, "signup");

    return res.render("auth/verify-otp", {
      error: req.flash("error"),
      resendCooldown,
    });
  } catch (err) {
    console.error(err);
    req.flash("error", err.message);
    return res.redirect("/auth/signup");
  }
};

//Page works

export const signupUser = async (req, res) => {
  try {
    req.session.tempUser = req.session.tempUser
      ? req.session.tempUser
      : await createTempUserForSignup(req.body);

    const otpDoc = await createAndSendSignupOTP(
      req.session.OTPId,
      req.session.tempUser.email,
      false,
    );

    req.session.OTPId = otpDoc._id;

    return res.redirect("/auth/signup/verify-otp");
  } catch (err) {
    console.error(err);
    req.flash("error", err.message);
    return res.redirect("/auth/signup");
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const user = await authenticateUser(req.body);

    req.login(user, (err) => {
      if (err) return next(err); // 2. Handle potential serialization errors
      return res.redirect("/home"); // 3. Redirect now that req.user is active
    });
  } catch (err) {
    console.log(err);
    req.flash("error", err.message);
    res.redirect("/auth/login");
  }
};

export const verifyUserOTP = async (req, res, next) => {
  try {
    const otpId = req.session.OTPId; // <-- read once

    if (!otpId) {
      throw new Error("Session expired. Please try again.");
    }

    const pendingUser = req.session.tempUser;

    const user = await verifySignupOTP(otpId, req.body.otp, pendingUser);

    // cleanup session
    delete req.session.OTPId;
    delete req.session.tempUser;

    req.login(user, (err) => {
      if (err) return next(err);
      return res.redirect("/home");
    });
  } catch (err) {
    console.error(err);
    req.flash("error", err.message);
    return res.redirect("/auth/signup/verify-otp");
  }
};

export const resendSignupOTP = async (req, res) => {
  try {
    const otpId = req.session.OTPId;
    const pendingUser = req.session.tempUser;

    if (!otpId || !pendingUser) {
      throw new Error("Session expired. Please try again.");
    }

    const otp = await createAndSendSignupOTP(otpId, pendingUser.email, true);

    // make sure session keeps the latest otp id (in case it was created fresh)
    req.session.OTPId = otp._id;

    return res.json({ otpLastResend: otp.lastResentAt });
  } catch (err) {
    console.error(err);
    req.flash("error", err.message);
    return res.redirect("/auth/signup");
  }
};

export const forgotPasswordEmailPage = (req, res) => {
  res.render("auth/enter-forgot-email");
};

export const forgotPasswordOTPPage = async (req, res) => {
  try {
    const tempUserId = req.session.tempUserId;

    if (!tempUserId) {
      throw new Error("Session expired. Please try again.");
    }

    console.log("tempUserID : ", tempUserId);

    const resendCooldown = await getRemainingCooldown(
      tempUserId,
      "forgot_password",
    );

    console.log("resendCooldown : ", resendCooldown);

    return res.render("auth/verify-forgot-pass-otp", {
      error: req.flash("error"),
      resendCooldown,
    });
  } catch (err) {
    console.error(err);
    req.flash("error", err.message);
    return res.redirect("/auth/login");
  }
};

export const forgotPasswordOTPSend = async (req, res) => {
  try {
    const user = await createAndSendForgotPasswordOTP(req.body.email, false);

    req.session.tempUserId = user.userId;

    res.redirect("/auth/forgot-password/verify-otp");
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("/auth/forgot-password");
  }
};

export const verifyForgotPassword = async (req, res) => {
  try {
    if (!req.session.tempUserId) {
      throw new Error("Session expired. Please try again.");
    }

    const safeToken = await verifyForgotPasswordOTP(
      req.session.tempUserId,
      req.body.userOTP,
    );

    req.session.forgotToken = safeToken;
    res.redirect(`/auth/reset-password?token=${safeToken}`);
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("/auth/forgot-password/verify-otp");
  }
};

export const newPasswordPage = (req, res) => {
  res.render("auth/reset-password");
};

export const newPasswordSubmit = async (req, res) => {
  if (!req.session.forgotToken) {
    return res.redirect("/auth/login");
  }

  try {
    await setNewPassword(req.body.password, req.session.tempUserId);
    res.redirect("/auth/reset-password/success");
  } catch (err) {
    req.flash("error", err.message);
    console.log(err);
  }
};

export const resendForgotPassOTP = async (req, res) => {
  try {
    const tempUserId = req.session.tempUserId;

    console.log(tempUserId);
    if (!tempUserId) {
      throw new Error("Session expired. Please try again.");
    }

    const user = await User.findById(tempUserId);
    if (!user) throw new Error("User not found");

    const otp = await createAndSendForgotPasswordOTP(user.email, true);

    return res.json({ otpLastResend: otp.lastResentAt });
  } catch (err) {
    console.error(err);
    req.flash("error", err.message);
    return res.redirect("/auth/login");
  }
};

export const passwordResetSuccessPage = (req, res) => {
  if (!req.session.forgotToken) return res.redirect("/auth/login");

  delete req.session.forgotToken;
  return res.render("success-or-error", {
    status: "success",
    message: "Password reset successfully",
    returnLocation: "Login",
    returnLink: "/auth/login",
  });
};

export const logoutUser = (req, res, next) => {
  req.logout({ keepSessionInfo: true }, (err) => {
    if (err) return next(err);
    res.redirect("/auth/login");
  });
};

export const adminLoginPage = (req, res) => {
  res.render("auth/admin-login.ejs", { error: req.flash("error") });
};

export const loginAdmin = async (req, res) => {
  try {
    const admin = await authenticateAdminLogin(req.body);

    req.session.admin = admin;
    res.redirect("/admin/users");
  } catch (err) {
    console.log("error in admin login", err);
    req.flash("error", err.message);
    res.redirect("/admin/auth/login");
  }
};

export const logoutAdmin = (req, res) => {
  console.log("reached admin logout");
  delete req.session.admin;
  return res.redirect("/admin/auth/login");
};
