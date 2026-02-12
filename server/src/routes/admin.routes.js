import express from "express";

import { checkAdminStatus, isAdmin } from "../middlewares/auth.middleware.js";
import upload from "../config/multer.js";

import * as adminUserControllers from "../controllers/admin/admin.user.controller.js";
import * as adminProductControllers from "../controllers/admin/admin.product.controller.js";
import * as adminCategoryControllers from "../controllers/admin/admin.categories.controller.js";

const router = express.Router();

router.use("/admin", isAdmin);
router.use("/admin", checkAdminStatus);

router.get("/admin/users", adminUserControllers.adminUserListPage);
router.get("/admin/products", adminProductControllers.adminProductListPage);

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
router.all("/admin/{*any}", (req, res) => {
  res.status(404).render("404-not-found");
});

export default router;
