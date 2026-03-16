import Order from "../../models/order.model.js";
import statusTransitions from "../../components/order.status.transitions.js";
import { changeProductStock } from "../user.product.services.js";
import { addRefundToWallet } from "../user.wallet.services.js";

export const getAllOrders = async ({
  page,
  limit,
  sort,
  search,
  filter,
  startDate,
  endDate,
}) => {
  page = parseInt(page);
  limit = parseInt(limit);

  const skip = (page - 1) * limit;

  // Search by order number or customer name
  const query = {
    $or: [
      { orderNumber: { $regex: search, $options: "i" } },
      { "address.name": { $regex: search, $options: "i" } },
    ],
  };

  // Filter by status
  if (filter !== "all") {
    query.orderStatus = filter;
  }

  // Filter by date range
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include the entire end date
      query.createdAt.$lte = end;
    }
  }

  // Sorting options
  let sortQuery = { createdAt: -1, _id: -1 };
  if (sort === "oldest") sortQuery = { createdAt: 1, _id: -1 };

  const result = await Order.aggregate([
    { $match: query },
    { $match: { "payment.status": "paid" } },
    {
      $facet: {
        orders: [
          { $sort: sortQuery },
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "user",
            },
          },
          {
            $unwind: {
              path: "$user",
              preserveNullAndEmptyArrays: true,
            },
          },
        ],
        total: [{ $count: "count" }],
      },
    },
  ]);

  const orders = result[0].orders;
  const total = result[0].total[0]?.count || 0;

  console.log("orders from getAllOrdersAdmin : ", orders);

  return {
    orders,
    total,
  };
};

export const changeAdminOrderStatusService = async (orderId, newStatus) => {
  const order = await Order.findById(orderId);

  const availableTransitions = statusTransitions[order.orderStatus];

  if (!availableTransitions.includes(newStatus))
    throw new Error("Can't change the status bcz its invalid");

  order.items.forEach((item) => {
    if (item.status !== "cancelled") item.status = newStatus;
  });

  order.orderStatus = newStatus;
  await order.save();
};

export const acceptOrderReturn = async (orderId, stockIncreaseItems) => {
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found");

  if (order.payment.status != "paid")
    throw new Error("The payment isn't done for the order");

  if (order.returnStatus !== "requested") {
    throw new Error("No return request found for this order");
  }

  for (let item of order.items) {
    const doIncreaseStock = stockIncreaseItems.includes(item._id.toString())
      ? true
      : false;
    await acceptItemReturn(order._id, item._id, doIncreaseStock, true);
  }

  order.returnStatus = "returned";
  order.orderStatus = "returned";

  await order.save();

  order.refundSummary.totalRefundedAmount =
    order.refundSummary.totalRefundedAmount || 0;

  const remainingRefund =
    order.payment.amount - order.refundSummary.totalRefundedAmount;

  const transactionData = {
    userId: order.userId,
    amount: remainingRefund,
    orderNumber: order.orderNumber,
    status: "returned",
  };

  await addRefundToWallet(transactionData);

  order.refundSummary.totalRefundedAmount = order.payment.amount;

  order.save();
  return order;
};

export const acceptItemReturn = async (
  orderId,
  itemId,
  doIncreaseStock,
  isEntireReturn,
) => {
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found");

  if (order.payment.status != "paid")
    throw new Error("The payment isn't done for the order");

  const item = order.items.id(itemId);
  if (!item) throw new Error("Item not found");

  if (item.returnStatus !== "requested" && order.returnStatus !== "requested") {
    throw new Error("No return request found for this item");
  }

  //Setting all return if all are returned

  item.returnStatus = "returned";
  item.status = "returned";

  const allItemsReturned =
    order.items.length > 0 &&
    order.items.every((item) => item.status === "returned");

  if (allItemsReturned) {
    order.returnStatus = "returned";
    order.orderStatus = "returned";
    order.statusChangeReason = "All items returned individually";
  }

  console.log("doIncreaseStock is : ", doIncreaseStock);

  if (doIncreaseStock) {
    await changeProductStock(
      item.product.productId,
      item.product.variantId,
      item.quantity,
      "increase",
    );
  }

  if (!isEntireReturn) {
    const transactionData = {
      userId: order.userId,
      amount: item.product.discountedPrice * item.quantity,
      orderNumber: order.orderNumber,
      status: "returned",
      itemName: item.product.name,
    };
    await addRefundToWallet(transactionData);

    order.refundSummary.totalRefundedAmount =
      order.refundSummary.totalRefundedAmount || 0;

    order.refundSummary.totalRefundedAmount +=
      item.product.discountedPrice * item.quantity;
  }

  await order.save();
  return order;
};

export const changeAdminOrderItemStatusService = async (
  orderId,
  itemId,
  newStatus,
) => {
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found");

  const item = order.items.id(itemId);
  if (!item) throw new Error("Item not found");

  const availableTransitions = statusTransitions[item.status];

  if (!availableTransitions || !availableTransitions.includes(newStatus)) {
    throw new Error(
      `Invalid status transition from ${item.status} to ${newStatus}`,
    );
  }

  item.status = newStatus;

  // Sync overall order status if necessary.
  // If all non-cancelled items are successfully delivered, the order might be considered delivered.
  // Or handle differently based on your store's logic. Simplest is to let item statuses be independent
  // until we need to evaluate the whole order.

  // Optionally update overall order status logic here:
  const activeItems = order.items.filter(
    (i) => i.status !== "cancelled" && i.status !== "returned",
  );

  if (activeItems.length > 0) {
    // If all active items are delivered
    const allDelivered = activeItems.every((i) => i.status === "delivered");
    if (allDelivered) {
      order.orderStatus = "delivered";
    }
    // If all active items are shipped or delivered
    else if (
      activeItems.every(
        (i) => i.status === "shipped" || i.status === "delivered",
      )
    ) {
      order.orderStatus = "shipped";
    }
  }

  await order.save();
  return order;
};
