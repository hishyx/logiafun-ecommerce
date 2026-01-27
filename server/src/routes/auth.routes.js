import express from "express";
import passport from "../config/passport.js";
//importing Controllers

import {
  loginPage,
  signupPage,
  signupUser,
  loginUser,
  verifyOTPPage,
  verifyUserOTP,
  resendSignupOTP,
  logoutUser,
} from "../controllers/auth.controller.js";

//Importing middlewares
import { isUserGuest } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.route("/auth/login").get(isUserGuest, loginPage).post(loginUser);

router.route("/auth/signup").get(isUserGuest, signupPage).post(signupUser);

//Google related

router.get(
  "/auth/google",
  isUserGuest,
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
);

router.get(
  "/auth/google/callback",
  isUserGuest,
  passport.authenticate("google", {
    failureRedirect: "/auth/login",
  }),
  (req, res) => {
    res.set("Cache-Control", "no-store");
    res.redirect(303, "/home");
  },
);

//GOOGLE RELATED END

router
  .route("/auth/signup/verify-otp")
  .get(isUserGuest, verifyOTPPage)
  .post(verifyUserOTP);

router.post("/auth/signup/resend-otp", resendSignupOTP);

router.post("/user/logout", logoutUser);

export default router;
