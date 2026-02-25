import { getAvailableCartItems } from "../services/user.cart.services.js";
import { getUserAddresses } from "../services/user.services.js";
import { createOrder } from "../services/user.order.services.js";

export const checkoutPage = async (req, res) => {
  try {
    let userAddresses = await getUserAddresses(req.user._id);

    let [cartItems, calculations] = await getAvailableCartItems(req.user._id);

    if (userAddresses && userAddresses.length) {
      userAddresses.sort((a, b) => b.isDefault - a.isDefault);
    }

    res.render("user/checkout", {
      addresses: userAddresses,
      cartItems,
      calculations,
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
