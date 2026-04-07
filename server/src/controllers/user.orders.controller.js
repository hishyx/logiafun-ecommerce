import * as userOrderServices from "../services/user.order.services.js";
import transitions from "../components/order.status.transitions.js";
import * as statusCodes from "../constants/statusCodes.js";
import * as messages from "../constants/messages.js";

export const orderPage = async (req, res) => {
  try {
    const limit = 5;

    const orders = await userOrderServices.getAllOrders(req.user._id, limit);

    res.render("user/orders", {
      orders,
    });
  } catch (err) {
    console.error(err);
    req.flash("error", err.message || "Failed to load orders");
    return res.redirect("/");
  }
};

export const ordersListPage = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = 8;
    const { orders, pagination } = await userOrderServices.getPaginatedOrders(
      req.user._id,
      page,
      limit,
    );

    res.render("user/orders-list", {
      orders,
      pagination,
    });
  } catch (err) {
    console.error(err);
    req.flash("error", err.message || "Failed to load orders");
    return res.redirect("/");
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
    console.error(err);
    req.flash("error", err.message || "Failed to load order success page");
    return res.redirect("/orders");
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
    res.status(statusCodes.INTERNAL_SERVER_ERROR).send(messages.INTERNAL_SERVER_ERROR);
  }
};

export const cancelOrderEntirely = async (req, res) => {
  try {
    if (!req.body.reason) throw new Error("Pls enter a valid reason");

    await userOrderServices.cancelEntireOrder(
      req.body.orderId,
      req.body.reason,
    );

    res.sendStatus(statusCodes.OK);
  } catch (err) {
    console.error(err);

    return res.status(statusCodes.BAD_REQUEST).json({
      success: false,
      message: err.message || "Failed to cancel order",
    });
  }
};

export const cancelSpecificItem = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { reason } = req.body;

    await userOrderServices.cancelSpecificOrderItem(orderId, itemId, reason);

    res.status(statusCodes.OK).json({
      success: true,
      message: "Item cancelled successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || messages.ERROR,
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
    res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: err.message || messages.ERROR,
    });
  }
};

export const returnSpecificItem = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { reason } = req.body;

    if (!reason) throw new Error("Pls enter a valid reason");

    await userOrderServices.returnSpecificOrderItem(orderId, itemId, reason);

    res.status(statusCodes.OK).json({
      success: true,
      message: "Item return request send",
    });
  } catch (error) {
    console.error(error);

    res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || messages.ERROR,
    });
  }
};

export const orderFailedPage = (req, res) => {
  try {
    const message =
      req.query.message || "Something went wrong while placing your order.";

    const isPaymentFailure = req.query.payment ? true : false;
    return res.render("user/order.failed.ejs", {
      errorMessage: message,
      isPaymentFailure,
      orderId: req.query.orderId,
    });
  } catch (err) {
    console.log(err);
    res.status(statusCodes.INTERNAL_SERVER_ERROR).send(messages.INTERNAL_SERVER_ERROR);
  }
};
