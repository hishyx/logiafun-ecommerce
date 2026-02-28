import express from "express";

import * as userControllers from "../controllers/user.controller.js";
import * as userProductControllers from "../controllers/user.product.controller.js";
import * as userCartControllers from "../controllers/user.cart.controller.js";
import * as userWishlistControllers from "../controllers/user.wishlist.controller.js";
import * as userCheckoutControllers from "../controllers/user.checkout.controller.js";
import * as userOrderControllers from "../controllers/user.orders.controller.js";
import * as orderFailedController from "../controllers/user/order.controller.js";

import { setLocalVariables } from "../middlewares/user.middlewares.js";

import { checkUserStatus, isAuth } from "../middlewares/auth.middleware.js";

import upload from "../config/multer.js";

const router = express.Router();

router.use(setLocalVariables);

router.use(isAuth);
router.use(checkUserStatus);
router.get("/", (req, res) => res.redirect("/home"));
router.route("/home").get(userControllers.homePage);
router
  .route("/user/profile")
  .get(userControllers.profilePage)
  .patch(userControllers.editProfile);
router
  .route("/user/cart")
  .get(userCartControllers.cartPage)
  .post(userCartControllers.addToCart);

router
  .route("/user/cart/checkout")
  .get(userCheckoutControllers.checkoutPage)
  .post(userCheckoutControllers.placeOrder);

router
  .route("/user/orders")
  .get(userOrderControllers.orderPage)
  .patch(userOrderControllers.cancelOrderEntirely);
router.patch("/user/orders/return", userOrderControllers.returnOrderEntirely);

router.patch(
  "/user/orders/:orderId/items/:itemId",
  userOrderControllers.cancelSpecificItem,
);
router.patch(
  "/user/orders/:orderId/items/:itemId/return",
  userOrderControllers.returnSpecificItem,
);

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

router.post(
  "/user/profile-image",
  upload.single("image"),
  userControllers.changeProfilePicture,
);

//Product related works

router.route("/products").get(userProductControllers.productListPage);

router
  .route("/products/:productId")
  .get(userProductControllers.productDetailsPage);

router.get(
  "/products/:productId/not-found",
  userProductControllers.productNotAvailablePage,
);

// Wishlist
router
  .route("/user/wishlist")
  .get(userWishlistControllers.wishlistPage)
  .post(userWishlistControllers.addToWishList);

router
  .route("/user/wishlist/:itemId")
  .delete(userWishlistControllers.removeWishlistItem);

router.delete("/user/cart/clearAll", userCartControllers.clearAllItems);

router
  .route("/user/cart/:itemId")
  .delete(userCartControllers.deleteCartItem)
  .patch(userCartControllers.updateCartItem);

router.get(
  "/order/success/:orderNumber",
  userOrderControllers.orderSuccessPage,
);

router.get("/user/orders/:orderId", userOrderControllers.orderDetailsPage);

router.get("/order/failed", orderFailedController.orderFailedPage);

export default router;
