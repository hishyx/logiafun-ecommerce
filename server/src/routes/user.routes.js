import express from "express";

import {
  homePage,
  profilePage,
  addressPage,
  cartPage,
  editProfile,
} from "../controllers/user.controller.js";

import { checkUserStatus, isAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(isAuth);
router.use(checkUserStatus);

router.route("/home").get(homePage);
router.route("/user/profile").get(profilePage).patch(editProfile);
router.route("/user/addresses").get(addressPage);
router.route("/user/cart").get(cartPage);

export default router;
