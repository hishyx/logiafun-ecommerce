import express from "express";

import { checkAdminStatus, isAdmin } from "../middlewares/auth.middleware.js";

import * as adminUserControllers from "../controllers/admin.user.controller.js";

const router = express.Router();

router.use("/admin", isAdmin);
router.use("/admin", checkAdminStatus);

router.get("/admin/users", adminUserControllers.adminUserListPage);

//Send filtered user data

// router.get("/admin/users/list", adminUserControllers.getAdminUsers);

router.patch(
  "/admin/users/:userId/block",
  adminUserControllers.blockUnblockUser,
);

router.all("/admin/{*any}", (req, res) => {
  res.status(404).render("404-not-found");
});

export default router;
