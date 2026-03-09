import { getAvailableCartItems } from "../services/user.cart.services.js";
import { getUserAddresses } from "../services/user.services.js";
import { createOrder } from "../services/user.order.services.js";
import {
  getAvailableCoupons,
  applyCouponService,
} from "../services/admin/admin.coupon.service.js";
import { getWalletByUserId } from "../services/user.wallet.services.js";

export const checkoutPage = async (req, res) => {
  try {
    let userAddresses = await getUserAddresses(req.user._id);

    let [cartItems, calculations] = await getAvailableCartItems(req.user._id);

    const coupons = await getAvailableCoupons(calculations.total);

    const wallet = await getWalletByUserId(req.user._id);
    const walletBalance = wallet ? wallet.balance : 0;

    if (userAddresses && userAddresses.length) {
      userAddresses.sort((a, b) => b.isDefault - a.isDefault);
    }

    res.render("user/checkout", {
      addresses: userAddresses,
      cartItems,
      calculations,
      coupons,
      walletBalance,
    });
  } catch (err) {
    console.log(err);
  }
};

export const placeOrder = async (req, res) => {
  try {
    console.log(req.body);

    const order = await createOrder(req.user._id, req.body);

    console.log(order.orderNumber);

    return res.status(200).json({
      success: true,
      orderId: order.orderNumber,
      redirectUrl: `/order/success/${order.orderNumber}`,
    });
  } catch (err) {
    console.error(err);

    const message =
      err.message || "Something went wrong while placing your order.";

    return res.status(400).json({
      success: false,
      message,
      redirectUrl: `/order/failed?message=${encodeURIComponent(message)}`,
    });
  }
};

export const applyCouponInCheckout = async (req, res) => {
  try {
    const couponId = req.params.couponId;

    console.log("Reached apply coupon controller");

    const appliedCalculations = await applyCouponService(
      couponId,
      req.user._id,
    );

    res.status(200).json({ newCalculations: appliedCalculations });
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err.message });
  }
};
