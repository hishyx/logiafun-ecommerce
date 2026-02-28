import * as userOrderServices from "../services/user.order.services.js";
import transitions from "../components/order.status.transitions.js";

export const orderPage = async (req, res) => {
  try {
    const orders = await userOrderServices.getAllOrders(req.user._id);
    res.render("user/orders", {
      user: req.user,
      orders,
    });
  } catch (err) {
    console.log(err);
  }
};

export const orderSuccessPage = async (req, res) => {
  try {
    console.log("SUCCESS PAGE CONTROLLER HIT");
    const orderNumber = req.params.orderNumber || "";

    console.log(orderNumber);

    const order = await userOrderServices.getOrderDetails("", orderNumber);

    return res.render("user/order.success.ejs", {
      orderNumber,
      orderId: order._id,
    });
  } catch (err) {
    console.log(err);
  }
};

export const orderDetailsPage = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await userOrderServices.getOrderDetails(orderId);

    res.render("user/order.details.ejs", {
      user: req.user,
      order,
      transitions,
    });
  } catch (err) {
    console.log("Error in orderDetailsPage:", err);
    res.status(500).send("Internal Server Error");
  }
};

export const cancelOrderEntirely = async (req, res) => {
  try {
    if (!req.body.reason) throw new Error("Pls enter a valid reason");

    await userOrderServices.cancelEntireOrder(
      req.body.orderId,
      req.body.reason,
    );

    res.sendStatus(200);
  } catch (err) {
    console.log(err);
  }
};

export const cancelSpecificItem = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { reason } = req.body;

    await userOrderServices.cancelSpecificOrderItem(orderId, itemId, reason);

    res.status(200).json({
      success: true,
      message: "Item cancelled successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to cancel item",
    });
  }
};

export const returnOrderEntirely = async (req, res) => {
  try {
    const { orderId, reason } = req.body;
    if (!reason) throw new Error("Pls enter a valid reason");

    await userOrderServices.returnEntireOrder(orderId, reason);

    res.sendStatus(200);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to return order",
    });
  }
};

export const returnSpecificItem = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { reason } = req.body;

    if (!reason) throw new Error("Pls enter a valid reason");

    await userOrderServices.returnSpecificOrderItem(orderId, itemId, reason);

    res.status(200).json({
      success: true,
      message: "Item returned successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to return item",
    });
  }
};
