import Order from "../../models/order.model.js";
import statusTransitions from "../../components/order.status.transitions.js";

export const getAllOrders = async ({ page, limit, sort, search, filter }) => {
  page = parseInt(page);
  limit = parseInt(limit);

  const skip = (page - 1) * limit;

  // Search by order number
  const query = {
    orderNumber: { $regex: search, $options: "i" },
  };

  // Filter by status
  if (filter !== "all") {
    query.orderStatus = filter;
  }

  // Sorting options
  let sortQuery = { createdAt: -1 };
  if (sort === "oldest") sortQuery = { createdAt: 1 };

  const result = await Order.aggregate([
    { $match: query },
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
    item.status = newStatus;
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

  order.returnStatus = "returned";
  order.orderStatus = "returned";

  order.items.forEach((item) => {
    if (item.returnStatus === "requested") {
      item.returnStatus = "returned";
      item.status = "returned";
    } else if (item.status === "delivered") {
      // If the whole order return is accepted, all delivered items should be marked as returned
      item.returnStatus = "returned";
      item.status = "returned";
    }
  });

  await order.save();
  return order;
};

export const acceptItemReturn = async (orderId, itemId) => {
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found");

  const item = order.items.id(itemId);
  if (!item) throw new Error("Item not found");

  if (item.returnStatus !== "requested") {
    throw new Error("No return request found for this item");
  }

  item.returnStatus = "returned";
  item.status = "returned";

  // Check if all items are now returned or cancelled
  const allReturnedOrCancelled = order.items.every(
    (i) => i.status === "returned" || i.status === "cancelled",
  );

  if (allReturnedOrCancelled) {
    order.returnStatus = "returned";
    order.orderStatus = "returned";
  }

  await order.save();
  return order;
};
