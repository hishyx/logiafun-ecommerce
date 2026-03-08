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

    ordersData.orders = ordersData.orders.map((order) => {
      const transitionsForStatus = statusTransitions[order.orderStatus] || [];

      return {
        ...order,
        statusOptions: [
          order.orderStatus, // current status first
          ...transitionsForStatus, // allowed next statuses
        ],
      };
    });

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

    const orderDoc = await getOrderDetails(orderId);
    let order = orderDoc;
    if (orderDoc && orderDoc.toObject) {
      order = orderDoc.toObject();
    }

    // Add available status transitions for each item
    if (order && order.items) {
      order.items = order.items.map((item) => {
        const transitionsForStatus = statusTransitions[item.status] || [];

        return {
          ...item,
          statusOptions: [
            item.status, // current status first
            ...transitionsForStatus, // allowed next statuses
          ],
        };
      });
    }

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

export const updateAdminOrderItemStatus = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { newStatus } = req.body;

    await adminOrderServices.changeAdminOrderItemStatusService(
      orderId,
      itemId,
      newStatus
    );

    res.status(200).json({
      success: true,
      message: "Item status updated successfully",
    });
  } catch (err) {
    console.error("Error in updateAdminOrderItemStatus:", err);
    res.status(400).json({
      success: false,
      message: err.message || "Failed to update item status",
    });
  }
};
