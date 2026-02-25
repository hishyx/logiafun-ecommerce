import * as userOrderServices from "../services/user.order.services.js";

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
    });
  } catch (err) {
    console.log("Error in orderDetailsPage:", err);
    res.status(500).send("Internal Server Error");
  }
};
