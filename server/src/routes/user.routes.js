import express from "express";

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

router.route("/login").get(isUserGuest, loginPage).post(loginUser);

router.route("/signup").get(isUserGuest, signupPage).post(signupUser);

router
  .route("/signup/verify-otp")
  .get(isUserGuest, verifyOTPPage)
  .post(verifyUserOTP);

router.use(isAuth);
router.use(checkUserStatus);

router.route("/home").get(homePage);

export default router;
