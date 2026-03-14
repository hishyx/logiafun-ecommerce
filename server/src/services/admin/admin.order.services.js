import Order from "../../models/order.model.js";
import statusTransitions from "../../components/order.status.transitions.js";
import { changeProductStock } from "../user.product.services.js";
import { addRefundToWallet } from "../user.wallet.services.js";

export const getAllOrders = async ({ page, limit, sort, search, filter }) => {
  page = parseInt(page);
  limit = parseInt(limit);

  const skip = (page - 1) * limit;

  // Search by order number
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

export const acceptOrderReturn = async (orderId) => {
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found");

  if (order.returnStatus !== "requested") {
    throw new Error("No return request found for this order");
  }

  for (let item of order.items) {
    await acceptItemReturn(order._id, item._id, true);
  }

  order.returnStatus = "returned";
  order.orderStatus = "returned";

  await order.save();

  const totalItemReturnedAmount = order.items
    .filter((item) => item.status === "returned")
    .reduce(
      (total, item) => total + item.product.discountedPrice * item.quantity,
      0,
    );

  const transactionData = {
    userId: order.userId,
    amount: order.totalAmount - totalItemReturnedAmount,
    orderNumber: order.orderNumber,
    status: "returned",
  };

  await addRefundToWallet(transactionData);
  return order;
};

export const acceptItemReturn = async (orderId, itemId, isEntireReturn) => {
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found");

  const item = order.items.id(itemId);
  if (!item) throw new Error("Item not found");

  if (item.returnStatus !== "requested" && order.returnStatus !== "requested") {
    throw new Error("No return request found for this item");
  }

  //Setting all return if all are returned

  item.status = "returned";

  const allItemsReturned =
    order.items.length > 0 &&
    order.items.every((item) => item.status === "returned");

  if (allItemsReturned) {
    order.returnStatus = "returned";
    order.orderStatus = "returned";
    order.statusChangeReason = "All items returned individually";
  }

  item.returnStatus = "returned";
  item.status = "returned";

  await changeProductStock(
    item.product.productId,
    item.product.variantId,
    item.quantity,
    "increase",
  );

  if (!isEntireReturn) {
    const transactionData = {
      userId: order.userId,
      amount: item.product.discountedPrice * item.quantity,
      orderNumber: order.orderNumber,
      status: "returned",
      itemName: item.product.name,
    };
    await addRefundToWallet(transactionData);
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
