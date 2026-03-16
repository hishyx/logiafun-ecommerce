import express from "express";
import passport from "../config/passport.js";

import * as authControllers from "../controllers/auth.controller.js";
import * as userControllers from "../controllers/user.controller.js";
import * as userProductControllers from "../controllers/user.product.controller.js";
import * as userCartControllers from "../controllers/user.cart.controller.js";
import * as userWishlistControllers from "../controllers/user.wishlist.controller.js";
import * as userCheckoutControllers from "../controllers/user.checkout.controller.js";
import * as userOrderControllers from "../controllers/user.orders.controller.js";
import * as userWalletControllers from "../controllers/user.wallet.controller.js";
import * as userReferralControllers from "../controllers/user.referral.controller.js";
import * as invoiceControllers from "../controllers/order.invoice.controller.js";
import * as userPaymentControllers from "../controllers/user/user.payment.controller.js";

import { setLocalVariables } from "../middlewares/user.middlewares.js";
import { checkAuthUniversaly } from "../middlewares/auth.middleware.js";

import {
  checkUserStatus,
  isAuth,
  safeTokenMatches,
  isUserGuest,
} from "../middlewares/auth.middleware.js";

import upload from "../config/multer.js";

const router = express.Router();

//Invoice

router.get(
  "/order/invoice/:orderId",
  checkAuthUniversaly,
  invoiceControllers.downloadInvoice,
);

router.use("/auth", isUserGuest);

//Authentication related stuffs

router
  .route("/auth/login")
  .get(authControllers.loginPage)
  .post(authControllers.loginUser);

router
  .route("/auth/signup")
  .get(authControllers.signupPage)
  .post(authControllers.signupUser);

//Google related

router.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/auth/login",
    keepSessionInfo: true,
  }),
  (req, res) => {
    res.set("Cache-Control", "no-store");
    res.redirect(303, "/home");
  },
);

//GOOGLE RELATED END

router
  .route("/auth/signup/verify-otp")
  .get(authControllers.verifyOTPPage)
  .post(authControllers.verifyUserOTP);

router.post("/auth/signup/resend-otp", authControllers.resendSignupOTP);

router
  .route("/auth/forgot-password")
  .get(authControllers.forgotPasswordEmailPage)
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

//Authentication related stuffs end

router.use(setLocalVariables);

router.get("/", (req, res) => res.redirect("/home"));

router.route("/home").get(userControllers.homePage);

router
  .route("/user/cart")
  .get(userCartControllers.cartPage)
  .post(userCartControllers.addToCart);

router
  .route("/user/wishlist")
  .get(userWishlistControllers.wishlistPage)
  .post(userWishlistControllers.addToWishList);

router.route("/products").get(userProductControllers.productListPage);

router
  .route("/products/:productId")
  .get(userProductControllers.productDetailsPage);

router.get(
  "/products/:productId/not-found",
  userProductControllers.productNotAvailablePage,
);

router.use(isAuth);
router.use(checkUserStatus);

router.post("/newuser/referral-code", authControllers.referralForGoogleUser);

router
  .route("/user/profile")
  .get(userControllers.profilePage)
  .patch(userControllers.editProfile);

router
  .route("/user/cart/checkout")
  .get(userCheckoutControllers.checkoutPage)
  .post(userCheckoutControllers.placeOrder);

router.post(
  "/user/cart/checkout/:couponId/toggle",
  userCheckoutControllers.applyCouponInCheckout,
);

router
  .route("/user/orders")
  .get(userOrderControllers.orderPage)
  .patch(userOrderControllers.cancelOrderEntirely);
router.route("/user/orders/list").get(userOrderControllers.ordersListPage);
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

// Wallet
router.route("/user/wallet").get(userWalletControllers.walletPage);
router
  .route("/user/wallet/transactions")
  .get(userWalletControllers.walletTransactionsPage);
router.get("/user/referral", userReferralControllers.referralPage);

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

router.get("/order/failed", userOrderControllers.orderFailedPage);

//payment

router.post("/verify-razorpay", userPaymentControllers.verifyRazorPayPayment);
router.post("/payment-failed", userPaymentControllers.paymentFailed);
router.post("/retry-payment", userPaymentControllers.retryPayment);

export default router;
