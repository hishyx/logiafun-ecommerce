import express from "express";
import * as invoiceControllers from "../controllers/order.invoice.controller.js";
import { checkAuthUniversaly } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get(
  "/order/invoice/:orderId",
  checkAuthUniversaly,
  invoiceControllers.downloadInvoice,
);

export default router;
