import express from "express";

import { checkAdminStatus, isAdmin } from "../middlewares/auth.middleware.js";

import * as adminUserControllers from "../controllers/admin.user.controller.js";

const router = express.Router();

router.use("/admin", isAdmin);
router.use("/admin", checkAdminStatus);

router.get("/admin/user", adminUserControllers.adminUserListPage);

router.all("/admin/{*any}", (req, res) => {
  res.status(404).render("404-not-found");
});

export default router;
