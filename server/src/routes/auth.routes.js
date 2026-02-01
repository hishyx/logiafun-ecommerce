import express from "express";
import passport from "../config/passport.js";
//importing Controllers

import * as authControllers from "../controllers/auth.controller.js";

//Importing middlewares
import {
  isUserGuest,
  safeTokenMatches,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

router
  .route("/auth/login")
  .get(isUserGuest, authControllers.loginPage)
  .post(authControllers.loginUser);

router
  .route("/auth/signup")
  .get(isUserGuest, authControllers.signupPage)
  .post(authControllers.signupUser);

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
  .get(isUserGuest, authControllers.verifyOTPPage)
  .post(authControllers.verifyUserOTP);

router.post("/auth/signup/resend-otp", authControllers.resendSignupOTP);

router
  .route("/auth/forgot-password")
  .get(isUserGuest, authControllers.forgotPasswordEmailPage)
  .post(authControllers.forgotPasswordOTPSend);

router
  .route("/auth/forgot-password/verify-otp")
  .get(authControllers.forgotPasswordOTPPage)
  .post(authControllers.verifyForgotPassword);

router
  .route("/auth/reset-password")
  .get(safeTokenMatches, authControllers.newPasswordPage)
  .post(authControllers.newPasswordSubmit);

router.post(
  "/auth/forgot-password/resend-otp",
  authControllers.resendForgotPassOTP,
);

router.get(
  "/auth/reset-password/success",
  authControllers.passwordResetSuccessPage,
);

router.post("/user/logout", authControllers.logoutUser);

export default router;
