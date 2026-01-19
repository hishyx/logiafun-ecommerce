import { registerUser, aunthenticateUser } from "../services/auth.services.js";
import {
  createAndSendOTP,
  verifyOTP,
  getRemainingTime,
  OTPExists,
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
    const remainingS = await getRemainingTime(req.session.tempOTPMail);
    res.render("auth/verify-otp", {
      error: req.flash("error"),
      remaining: remainingS,
    });
  } catch (err) {
    req.flash("error", err.message);
    return res.redirect(`/auth/login`);
  }
};

//Page works

export const signupUser = async (req, res) => {
  try {
    const OTPExistInDB = await OTPExists(req.body.email);

    if (!OTPExistInDB) {
      const user = await registerUser(req.body);

      req.session.tempOTPMail = user.email;

      await createAndSendOTP(user.email);
    }

    return res.redirect("/auth/signup/verify-otp");
  } catch (err) {
    console.log(err);
    req.flash("error", err.message);
    res.redirect("/auth/signup");
  }
};

export const loginUser = async (req, res) => {
  try {
    const user = await aunthenticateUser(req.body);

    req.login(user, (err) => {
      if (err) return next(err); // 2. Handle potential serialization errors
      return res.redirect("/home"); // 3. Redirect now that req.user is active
    });
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("/auth/login");
  }
};

export const verifyUserOTP = async (req, res) => {
  try {
    const email =
      req.session && req.session.tempOTPMail ? req.session.tempOTPMail : null;

    const user = await verifyOTP(email, req.body.otp);

    delete req.session.tempOTPMail;

    req.login(user, (err) => {
      if (err) return next(err); // 2. Handle potential serialization errors
      return res.redirect("/home"); // 3. Redirect now that req.user is active
    });

    res.redirect("/home");
  } catch (err) {
    console.log(err);
    req.flash("error", err.message);
    res.redirect("/auth/signup/verify-otp");
  }
};
