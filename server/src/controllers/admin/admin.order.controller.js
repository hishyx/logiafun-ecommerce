import * as adminOrderServices from "../../services/admin/admin.order.services.js";

import statusTransitions from "../../components/order.status.transitions.js";
import { getOrderDetails } from "../../services/user.order.services.js";

export const adminOrderListPage = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 7,
      search = "",
      filter = "all",
      sort = "latest",
    } = req.query;

    page = Number(page);
    limit = Number(limit);

    const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const ordersData = await adminOrderServices.getAllOrders({
      page,
      limit,
      search: safeSearch,
      sort,
      filter,
    });

    const totalPages = Math.ceil(ordersData.total / limit);

    res.render("admin/admin.orders.ejs", {
      ...ordersData,
      search,
      filter,
      sort,
      page,
      limit,
      totalPages,
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

export const acceptReturn = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { itemId } = req.body;

    if (itemId) {
      await adminOrderServices.acceptItemReturn(orderId, itemId);
    } else {
      await adminOrderServices.acceptOrderReturn(orderId);
    }

    res.status(200).json({
      success: true,
      message: "Return accepted successfully",
    });
  } catch (err) {
    console.error("Error in acceptReturn:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
};
