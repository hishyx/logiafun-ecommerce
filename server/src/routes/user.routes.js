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
} from "../controllers/auth.controller.js";

import { homePage } from "../controllers/user.controller.js";

//Importing middlewares
import {
  isAuth,
  isUserGuest,
  checkUserStatus,
} from "../middlewares/auth.middleware.js";

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

router.use(isAuth);
router.use(checkUserStatus);

router.route("/home").get(homePage);

export default router;
