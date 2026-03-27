import * as adminOrderServices from "../../services/admin/admin.order.services.js";

import statusTransitions from "../../components/order.status.transitions.js";
import { getOrderDetails } from "../../services/user.order.services.js";
import * as statusCodes from "../../constants/statusCodes.js";
import * as messages from "../../constants/messages.js";

export const adminOrderListPage = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 7,
      search = "",
      filter = "all",
      sort = "latest",
      startDate = "",
      endDate = "",
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
      startDate,
      endDate,
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
      startDate,
      endDate,
    });
  } catch (err) {
    console.error("Error in adminOrderListPage:", err);
    res.status(statusCodes.INTERNAL_SERVER_ERROR).send(messages.INTERNAL_SERVER_ERROR);
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

    res.sendStatus(statusCodes.OK);
  } catch (err) {
    console.log(err);
  }
};

export const acceptReturn = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { returnAll, stockIncreaseItems, itemId, doIncreaseStock } = req.body;

    if (returnAll) {
      await adminOrderServices.acceptOrderReturn(
        orderId,
        stockIncreaseItems || [],
      );
    } else if (itemId) {
      await adminOrderServices.acceptItemReturn(
        orderId,
        itemId,
        doIncreaseStock,
      );
    } else {
      return res.status(statusCodes.BAD_REQUEST).json({
        success: false,
        message: "Invalid return request",
      });
    }

    res.status(statusCodes.OK).json({
      success: true,
      message: "Return accepted successfully",
    });
  } catch (err) {
    console.error("Error in acceptReturn:", err);
    res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: err.message || messages.INTERNAL_SERVER_ERROR,
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
      newStatus,
    );

    res.status(statusCodes.OK).json({
      success: true,
      message: "Item status updated successfully",
    });
  } catch (err) {
    console.error("Error in updateAdminOrderItemStatus:", err);
    res.status(statusCodes.BAD_REQUEST).json({
      success: false,
      message: err.message || "Failed to update item status",
    });
  }
};

export const updateAdminPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await adminOrderServices.markOrderPaymentAsPaidService(orderId);

    res.status(statusCodes.OK).json({
      success: true,
      message: "Payment status updated successfully",
      payment: order.payment,
    });
  } catch (err) {
    console.error("Error in updateAdminPaymentStatus:", err);
    res.status(statusCodes.BAD_REQUEST).json({
      success: false,
      message: err.message || "Failed to update payment status",
    });
  }
};
