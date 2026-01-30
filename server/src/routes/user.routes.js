import express from "express";

import {
  homePage,
  profilePage,
  addressPage,
  cartPage,
  editProfile,
  resendEmailChangeOTP,
  changeEmail,
  emailChangeOTPVerification,
} from "../controllers/user.controller.js";

import { checkUserStatus, isAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(isAuth);
router.use(checkUserStatus);
router.get("/", (req, res) => res.redirect("/home"));
router.route("/home").get(homePage);
router.route("/user/profile").get(profilePage).patch(editProfile);
router.route("/user/addresses").get(addressPage);
router.route("/user/cart").get(cartPage);
router
  .route("/user/change-email")
  .post(changeEmail)
  .patch(emailChangeOTPVerification);
router.route("/user/change-email/resend").post(resendEmailChangeOTP);

export default router;
