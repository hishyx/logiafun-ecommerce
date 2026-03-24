import Order from "../../models/order.model.js";
import User from "../../models/user.model.js";
import Product from "../../models/products.model.js";

// excludes cancelled and returned orders regardless of payment status
const REVENUE_MATCH = {
  "payment.status": "paid",
  orderStatus: { $nin: ["cancelled", "returned"] },
};

// seeds every label key with 0, then fills in actual DB values
// ensures zero-filled output even for periods with no orders
function buildDataMap(labels, results) {
  const map = {};
  labels.forEach((l) => (map[l] = 0));
  results.forEach((r) => {
    if (r._id in map) {
      map[r._id] = r.total;
    }
  });
  return map;
}

function shiftDays(base, dayOffset) {
  const d = new Date(base);
  d.setDate(d.getDate() + dayOffset);
  return d.toISOString().slice(0, 10);
}

// forces UTC interpretation so local timezone offsets don't shift the date
function formatDayLabel(iso) {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

// KPI card totals — revenue, orders, users, active products
export async function getSummaryStats() {
  const [revenueAgg, totalUsers, totalProducts] = await Promise.all([
    Order.aggregate([
      { $match: REVENUE_MATCH },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$payment.amount" },
          totalOrders: { $sum: 1 },
        },
      },
    ]),
    User.countDocuments({ role: "user" }),
    Product.countDocuments({ isActive: true }),
  ]);

  return {
    totalRevenue: revenueAgg[0]?.totalRevenue || 0,
    totalOrders: revenueAgg[0]?.totalOrders || 0,
    totalUsers,
    totalProducts,
  };
}

// revenue time series with zero-filling for every supported frequency
export async function getRevenueSeries(frequency = "monthly") {
  const now = new Date();

  // daily: last 24 hours grouped by hour
  if (frequency === "daily") {
    // Truncate to the start of the current hour
    const startOfHour = new Date(now);
    startOfHour.setMinutes(0, 0, 0);
    startOfHour.setHours(startOfHour.getHours() - 23); // 24h window

    const results = await Order.aggregate([
      {
        $match: {
          ...REVENUE_MATCH,
          createdAt: { $gte: startOfHour },
        },
      },
      {
        $group: {
          _id: { $hour: "$createdAt" },
          total: { $sum: "$payment.amount" },
        },
      },
    ]);

    // Build hour labels: 24 hours starting from startOfHour.getHours()
    const startHour = startOfHour.getHours();
    const hourKeys = [];
    const displayLabels = [];
    for (let i = 0; i < 24; i++) {
      const h = (startHour + i) % 24;
      hourKeys.push(h);
      displayLabels.push(`${String(h).padStart(2, "0")}:00`);
    }

    const map = buildDataMap(hourKeys, results);
    return {
      labels: displayLabels,
      values: hourKeys.map((h) => map[h]),
    };
  }

  // weekly: last 7 days, one data point per day
  if (frequency === "weekly") {
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    const results = await Order.aggregate([
      {
        $match: {
          ...REVENUE_MATCH,
          createdAt: { $gte: start },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: "$payment.amount" },
        },
      },
    ]);

    const isoKeys = [];
    for (let i = 0; i < 7; i++) {
      isoKeys.push(shiftDays(start, i));
    }

    const map = buildDataMap(isoKeys, results);
    return {
      labels: isoKeys.map(formatDayLabel),
      values: isoKeys.map((k) => map[k]),
    };
  }

  // monthly: last 30 days, one data point per day
  if (frequency === "monthly") {
    const start = new Date(now);
    start.setDate(now.getDate() - 29);
    start.setHours(0, 0, 0, 0);

    const results = await Order.aggregate([
      {
        $match: {
          ...REVENUE_MATCH,
          createdAt: { $gte: start },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: "$payment.amount" },
        },
      },
    ]);

    const isoKeys = [];
    for (let i = 0; i < 30; i++) {
      isoKeys.push(shiftDays(start, i));
    }

    const map = buildDataMap(isoKeys, results);
    return {
      labels: isoKeys.map(formatDayLabel),
      values: isoKeys.map((k) => map[k]),
    };
  }

  // yearly: Jan–Dec of current calendar year
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const results = await Order.aggregate([
    {
      $match: {
        ...REVENUE_MATCH,
        createdAt: { $gte: yearStart },
      },
    },
    {
      $group: {
        _id: { $month: "$createdAt" },
        total: { $sum: "$payment.amount" },
      },
    },
  ]);

  const monthKeys = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const map = buildDataMap(monthKeys, results);

  return {
    labels: monthNames,
    values: monthKeys.map((m) => map[m]),
  };
}

// top 5 products by units sold across all qualifying orders
export async function getTopProducts() {
  const results = await Order.aggregate([
    { $match: REVENUE_MATCH },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.product.name",
        sold: { $sum: "$items.quantity" },
        revenue: {
          $sum: {
            $multiply: ["$items.product.discountedPrice", "$items.quantity"],
          },
        },
      },
    },
    { $sort: { sold: -1 } },
    { $limit: 5 },
  ]);

  const totalSold = results.reduce((acc, r) => acc + r.sold, 0);

  return results.map((r) => ({
    name: r._id || "Unknown",
    sold: r.sold,
    revenue: r.revenue,
    percentage: totalSold > 0 ? +((r.sold / totalSold) * 100).toFixed(1) : 0,
  }));
}

// top 5 categories by units sold
// order items store a product snapshot (no categoryId), so we join products → categories
export async function getTopCategories() {
  const results = await Order.aggregate([
    { $match: REVENUE_MATCH },
    { $unwind: "$items" },
    // Look up the live Product document to get its categoryId
    {
      $lookup: {
        from: "products",
        localField: "items.product.productId",
        foreignField: "_id",
        as: "productDoc",
      },
    },
    { $unwind: "$productDoc" },
    // Look up the Category name
    {
      $lookup: {
        from: "categories",
        localField: "productDoc.categoryId",
        foreignField: "_id",
        as: "categoryDoc",
      },
    },
    { $unwind: "$categoryDoc" },
    {
      $group: {
        _id: "$categoryDoc.name",
        sold: { $sum: "$items.quantity" },
      },
    },
    { $sort: { sold: -1 } },
    { $limit: 5 },
  ]);

  const totalSold = results.reduce((acc, r) => acc + r.sold, 0);

  return results.map((r) => ({
    name: r._id || "Unknown",
    sold: r.sold,
    percentage: totalSold > 0 ? +((r.sold / totalSold) * 100).toFixed(1) : 0,
  }));
}

// last 5 paid non-cancelled orders for the dashboard table
export async function getRecentOrders() {
  const orders = await Order.find(REVENUE_MATCH)
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("userId", "name email")
    .lean();

  return orders.map((o) => ({
    orderNumber: o.orderNumber,
    customer: o.userId?.name || "Guest",
    amount: o.payment.amount,
    status: o.orderStatus,
    date: new Date(o.createdAt).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  }));
}
