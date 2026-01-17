import { registerUser, aunthenticateUser } from "../services/auth.services.js";
import { createAndSendOTP, verifyOTP } from "../services/OTP.services.js";

//Public Pages

export const loginPage = (req, res) => {
  res.render("auth/login", { error: req.flash("error") });
};

export const signupPage = (req, res) => {
  res.render("auth/signup", { error: req.flash("error") });
};

export const verifyOTPPage = (req, res) => {
  res.render("auth/verify-otp", { error: req.flash("error") });
};

//Page works

export const signupUser = async (req, res) => {
  try {
    const user = await registerUser(req.body);

    const { password, ...safeUser } = user.toObject();

    req.session.user = safeUser;

    await createAndSendOTP(req.body.email);

    res.redirect("/signup/verify-otp");
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("/signup");
  }
};

export const loginUser = async (req, res) => {
  try {
    const user = await aunthenticateUser(req.body);

    const { password, ...safeUser } = user.toObject();

    req.session.user = safeUser;
    res.redirect("/home");
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("/login");
  }
};

export const verifyUserOTP = async (req, res) => {
  try {
    const email =
      req.session && req.session.user && req.session.user.email
        ? req.session.user.email
        : null;

    await verifyOTP(email, req.body.otp);

    req.session.user.isVerified = true;

    res.redirect("/home");
  } catch (err) {
    console.log(err);
    req.flash("error", err.message);
    res.redirect("/signup/verify-otp");
  }
};
