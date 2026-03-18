import crypto from "crypto";
import {
  updatePaymentStatus,
  updateStockOnPaymentFailure,
  retryOrderPayment,
} from "../../services/user.order.services.js";
import { deleteAllItems } from "../../services/user.cart.services.js";
import * as statusCodes from "../../constants/statusCodes.js";

export const verifyRazorPayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
      userId,
    } = req.body;

    console.log("User id is : ", userId);

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body.toString())
      .digest("hex");

    console.log("Reached verify ctroler");

    if (expectedSignature !== razorpay_signature) {
      return res.status(statusCodes.BAD_REQUEST).json({ success: false });
    }

    await updatePaymentStatus(orderId, "paid", razorpay_payment_id);

    await deleteAllItems(userId);

    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.status(statusCodes.INTERNAL_SERVER_ERROR).json({ success: false });
  }
};

export const paymentFailed = async (req, res) => {
  try {
    const { orderId, reason } = req.body;

    await updatePaymentStatus(orderId, "failed", null, reason);

    await updateStockOnPaymentFailure(orderId);

    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.status(statusCodes.INTERNAL_SERVER_ERROR).json({ success: false });
  }
};

export const retryPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await retryOrderPayment(orderId, req.user._id);

    if (order.razorpay) return res.status(statusCodes.OK).json(order);
  } catch (err) {
    console.log(err);
    res.status(statusCodes.INTERNAL_SERVER_ERROR).json({ success: false });
  }
};
