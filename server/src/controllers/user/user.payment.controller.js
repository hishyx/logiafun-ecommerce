import crypto from "crypto";
import { updatePaymentStatus } from "../../services/user.order.services.js";
import { deleteAllItems } from "../../services/user.cart.services.js";

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

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false });
    }

    await updatePaymentStatus(orderId, "paid", razorpay_payment_id);

    await deleteAllItems(userId);

    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false });
  }
};
