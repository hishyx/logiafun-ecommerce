import Order from "../../models/order.model.js";

export const getReportData = async ({
  period = "daily",
  startDate,
  endDate,
  page = 1,
}) => {
  // Decide date range based on selected filter
  let start = new Date();
  let end = new Date();

  if (period === "daily") {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (period === "weekly") {
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);

    start = new Date(start.setDate(diff));
    start.setHours(0, 0, 0, 0);

    end = new Date();
    end.setHours(23, 59, 59, 999);
  } else if (period === "monthly") {
    start = new Date(start.getFullYear(), start.getMonth(), 1);
    start.setHours(0, 0, 0, 0);

    end = new Date();
    end.setHours(23, 59, 59, 999);
  } else if (period === "yearly") {
    start = new Date(start.getFullYear(), 0, 1);
    start.setHours(0, 0, 0, 0);

    end = new Date();
    end.setHours(23, 59, 59, 999);
  } else if (period === "custom") {
    start = new Date(startDate);
    end = new Date(endDate);

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  }

  console.log("End is ", end);
  console.log("Start is ", start);

  // Include paid orders and COD orders, but ignore cancelled / returned ones
  const query = {
    $or: [
      { "payment.status": "paid" },
      { "payment.method": { $in: ["cod", "COD"] } },
    ],
    orderStatus: { $nin: ["cancelled", "returned"] },
    createdAt: { $gte: start, $lte: end },
  };

  const limit = 10;
  const skip = (page - 1) * limit;

  // Parallel execution for better performance
  const [summaryData, topProducts, statusData, orders] = await Promise.all([
    Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          grossSale: {
            $sum: { $ifNull: ["$payment.subtotal", "$payment.amount"] },
          },
          couponDiscount: { $sum: { $ifNull: ["$payment.discount", 0] } },
          netRevenue: { $sum: "$payment.amount" },
        },
      },
    ]),

    // 2. Top Selling Products Aggregation (Global for range)
    Order.aggregate([
      { $match: query },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product.productId",
          name: { $first: "$items.product.name" },
          revenue: {
            $sum: {
              $multiply: ["$items.product.discountedPrice", "$items.quantity"],
            },
          },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]),

    // 3. Status Breakdown Aggregation
    Order.aggregate([
      { $match: query },
      { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
    ]),

    // 4. Paginated Orders for Table
    Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "name")
      .lean(),
  ]);

  const summary = summaryData[0] || {
    totalOrders: 0,
    grossSale: 0,
    couponDiscount: 0,
    netRevenue: 0,
  };

  const totalPages = Math.ceil(summary.totalOrders / limit);

  return {
    orderCount: summary.totalOrders,
    grossSale: summary.grossSale,
    couponDiscount: summary.couponDiscount,
    netRevenue: summary.netRevenue,
    topProducts,
    statusData: statusData.map((s) => [s._id, s.count]), // Format for EJS Map
    orders,
    totalPages,
    currentPage: page,
  };
};
