import express from "express";

import * as userControllers from "../controllers/user.controller.js";

import { checkUserStatus, isAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(isAuth);
router.use(checkUserStatus);
router.get("/", (req, res) => res.redirect("/home"));
router.route("/home").get(userControllers.homePage);
router
  .route("/user/profile")
  .get(userControllers.profilePage)
  .patch(userControllers.editProfile);
router.route("/user/cart").get(userControllers.cartPage);
router
  .route("/user/change-email")
  .post(userControllers.changeEmail)
  .patch(userControllers.emailChangeOTPVerification);
router
  .route("/user/change-email/resend")
  .post(userControllers.resendEmailChangeOTP);

//Address related works

router
  .route("/user/addresses")
  .get(userControllers.addressPage)
  .post(userControllers.addAddress);

router
  .route("/user/addresses/:addressId")
  .delete(userControllers.deleteAddress)
  .patch(userControllers.editAddress);

router.patch("/addresses/:addressId/default", userControllers.setDefault);

export default router;
