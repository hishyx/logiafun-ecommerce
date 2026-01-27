import {
  createTempUserForSignup,
  authenticateUser,
} from "../services/auth.services.js";
import {
  createAndSendSignupOTP,
  verifySignupOTP,
  getRemainingCooldown,
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

export const logoutUser = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.redirect("/auth/login");
    });
  });
};
