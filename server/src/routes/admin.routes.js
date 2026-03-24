import express from "express";

import {
  checkAdminStatus,
  isAdmin,
  isAdminGuest,
} from "../middlewares/auth.middleware.js";
import upload from "../config/multer.js";

import * as statusCodes from "../constants/statusCodes.js";
import * as authControllers from "../controllers/auth.controller.js";
import * as adminUserControllers from "../controllers/admin/admin.user.controller.js";
import * as adminProductControllers from "../controllers/admin/admin.product.controller.js";
import * as adminCategoryControllers from "../controllers/admin/admin.categories.controller.js";
import * as adminOrderControllers from "../controllers/admin/admin.order.controller.js";
import * as adminCouponControllers from "../controllers/admin/admin.coupon.controller.js";
import * as adminOffersControllers from "../controllers/admin/admin.offers.controller.js";
import * as adminDashboardControllers from "../controllers/admin/admin.dashboard.controller.js";

const router = express.Router();

router.use("/admin/auth", isAdminGuest);

router
  .route("/admin/auth/login")
  .get(authControllers.adminLoginPage)
  .post(authControllers.loginAdmin);

router.use("/admin", isAdmin);
router.use("/admin", checkAdminStatus);

router.get("/admin", adminDashboardControllers.adminDashboardPage);
router.get("/admin/dashboard", adminDashboardControllers.adminDashboardPage);
router.get("/admin/analytics", adminDashboardControllers.adminAnalyticsPage);
router.get(
  "/admin/dashboard-stats",
  adminDashboardControllers.getDashboardSummaryStats,
);
router.get(
  "/admin/dashboard/chart",
  adminDashboardControllers.getDashboardChartData,
);
router.get(
  "/admin/dashboard/top-products",
  adminDashboardControllers.getDashboardTopProductsAPI,
);
router.get("/admin/analytics/excel", adminDashboardControllers.downloadExcel);
router.get("/admin/analytics/pdf", adminDashboardControllers.downloadPDF);

router.get("/admin/users", adminUserControllers.adminUserListPage);

router.get("/admin/orders", adminOrderControllers.adminOrderListPage);
router
  .route("/admin/orders/:orderId")
  .get(adminOrderControllers.adminOrderDetailsPage)
  .patch(adminOrderControllers.updateAdminOrderStatus);

router.patch(
  "/admin/orders/:orderId/accept-return",
  adminOrderControllers.acceptReturn,
);

router.patch(
  "/admin/orders/:orderId/items/:itemId/status",
  adminOrderControllers.updateAdminOrderItemStatus,
);

router
  .route("/admin/categories")
  .get(adminCategoryControllers.adminCategoryListPage)
  .post(upload.single("image"), adminCategoryControllers.addCategory);

router.patch(
  "/admin/users/:userId/toggle",
  adminUserControllers.blockUnblockUser,
);

router.patch(
  "/admin/categories/:categoryId/toggle",
  adminCategoryControllers.listUnlistCategory,
);

router.patch(
  "/admin/categories/:categoryId",
  upload.single("image"),
  adminCategoryControllers.editCategory,
);
router.get("/admin/categories", adminCategoryControllers.adminCategoryListPage);

router
  .route("/admin/products")
  .get(adminProductControllers.adminProductListPage)
  .post(upload.any(), adminProductControllers.addProduct)
  .patch(upload.any(), adminProductControllers.editProduct);

router.get("/admin/products/add", adminProductControllers.adminAddProductPage);
router.get(
  "/admin/products/:productId/edit",
  adminProductControllers.adminEditProductPage,
);

router
  .route("/admin/coupons")
  .get(adminCouponControllers.adminCouponListPage)
  .post(adminCouponControllers.addCoupon);

router.patch("/admin/coupons/:couponId", adminCouponControllers.editCoupon);
router.patch(
  "/admin/coupons/:couponId/toggle",
  adminCouponControllers.toggleCoupon,
);

router
  .route("/admin/offers")
  .get(adminOffersControllers.getOffersPage)
  .post(adminOffersControllers.addOffer);

router.patch("/admin/offers/:offerId", adminOffersControllers.editOffer);
router.patch(
  "/admin/offers/:offerId/toggle",
  adminOffersControllers.toggleOffer,
);

router.patch(
  "/admin/products/:productId/toggle",
  adminProductControllers.listUnlistProduct,
);

router.all("/admin/{*any}", (req, res) => {
  res.status(statusCodes.NOT_FOUND).render("404-not-found");
});

export default router;
