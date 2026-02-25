import * as adminOrderServices from "../../services/admin/admin.order.services.js";

import statusTransitions from "../../components/order.status.transitions.js";
import { getOrderDetails } from "../../services/user.order.services.js";

export const adminOrderListPage = async (req, res) => {
  try {
    const orders = await adminOrderServices.getAllOrders();

    for (let order of orders) {
      order.statusTransitions = statusTransitions[order.orderStatus];
    }

    res.render("admin/admin.orders.ejs", {
      orders,
    });
  } catch (err) {
    console.error("Error in adminOrderListPage:", err);
    res.status(500).send("Internal Server Error");
  }
};

export const adminOrderDetailsPage = async (req, res) => {
  try {
    const orderId = req.params.orderId || "";

    const order = await getOrderDetails(orderId);
    console.log("The order is : ", order);

    res.render("admin/admin.order.details.ejs", { order });
  } catch (err) {
    console.log(err);
  }
};

export const updateAdminOrderStatus = async (req, res) => {
  const availableTransitions = statusTransitions[req.body.newStatus];

  try {
    const done = await adminOrderServices.changeAdminOrderStatusService(
      req.body.orderId,
      req.body.newStatus,
    );

    res.sendStatus(200);
  } catch (err) {
    console.log(err);
  }
};
