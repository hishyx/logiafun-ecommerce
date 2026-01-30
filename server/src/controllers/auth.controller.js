import {
  createTempUserForSignup,
  authenticateUser,
  setNewPassword,
} from "../services/auth.services.js";
import {
  createAndSendSignupOTP,
  verifySignupOTP,
  getRemainingCooldown,
  createAndSendForgotPasswordOTP,
  verifyForgotPasswordOTP,
} from "../services/OTP.services.js";

//Public Pages

export const loginPage = (req, res) => {
  res.render("auth/login", { error: req.flash("error") });
};

export const signupPage = (req, res) => {
  res.render("auth/signup", { error: req.flash("error") });
};

export const verifyOTPPage = async (req, res) => {
  try {
    const tempUserId = req.session.tempUserId;

    if (!tempUserId) {
      throw new Error("Signup session expired. Please signup again.");
    }

    const resendCooldown = await getRemainingCooldown(tempUserId, "signup");

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
    const tempUser = await createTempUserForSignup(req.body);

    // store temp user id in session for verification binding
    req.session.tempUserId = tempUser._id.toString();

    await createAndSendSignupOTP(tempUser._id, false);

    return res.redirect("/auth/signup/verify-otp");
  } catch (err) {
    console.error(err);
    req.flash("error", err.message);
    return res.redirect("/auth/signup");
  }
};

export const loginUser = async (req, res) => {
  try {
    const user = await authenticateUser(req.body);

    req.login(user, (err) => {
      if (err) return next(err); // 2. Handle potential serialization errors
      return res.redirect("/home"); // 3. Redirect now that req.user is active
    });
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("/auth/login");
  }
};

export const verifyUserOTP = async (req, res, next) => {
  try {
    const tempUserId = req.session.tempUserId;

    if (!tempUserId) {
      throw new Error("Signup session expired. Please signup again.");
    }

    const user = await verifySignupOTP(tempUserId, req.body.otp);

    // cleanup session
    delete req.session.tempUserId;

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
    const { tempUserId } = req.session;

    const otp = await createAndSendSignupOTP(tempUserId, true);

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
      throw new Error("Signup session expired. Please signup again.");
    }

    const resendCooldown = await getRemainingCooldown(
      tempUserId,
      "password_reset",
    );

    return res.render("auth/verify-forgot-pass-otp", {
      error: req.flash("error"),
      resendCooldown,
    });
  } catch (err) {
    console.error(err);
    req.flash("error", err.message);
    return res.redirect("/auth/signup");
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
    const safeToken = await verifyForgotPasswordOTP(
      req.session.tempUserId,
      req.body.userOTP,
    );

    req.session.forgotToken = safeToken;
    res.redirect(`/auth/reset-password?token=${safeToken}`);
  } catch (err) {
    console.log(`${err} from fogotpaasscontroller`);
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

export const passwordResetSuccessPage = (req, res) => {
  if (!req.session.forgotToken) return res.redirect("/auth/login");

  delete req.session.forgotToken;
  return res.render("success-page", {
    successMessage: "Password reset successfully",
    returnLocation: "Login",
    returnLink: "/auth/login",
  });
};

export const logoutUser = (req, res) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.redirect("/auth/login");
    });
  });
};
