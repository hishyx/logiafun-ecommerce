import Order from "../../models/order.model.js";

export const getSalesReport = async ({ period, startDate, endDate }) => {
  let start = new Date();
  let end = new Date();

  if (period === "daily") {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (period === "weekly") {
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
  } else if (period === "yearly") {
    start = new Date(start.getFullYear(), 0, 1);
    start.setHours(0, 0, 0, 0);
  } else if (period === "custom") {
    start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
  }

  const query = {
    "payment.status": "paid",
    orderStatus: { $nin: ["cancelled", "returned"] },
    createdAt: { $gte: start, $lte: end },
  };

  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .populate("userId", "name email")
    .lean();

  const summary = await Order.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalSalesCount: { $sum: 1 },
        totalRevenue: { $sum: "$payment.amount" },
        totalCouponDiscount: { $sum: { $ifNull: ["$payment.discount", 0] } },
        totalOfferDiscount: { 
          $sum: { 
            $reduce: {
              input: "$items",
              initialValue: 0,
              in: { 
                $add: [
                  "$$value", 
                  { $multiply: [ { $subtract: ["$$this.product.originalPrice", "$$this.product.discountedPrice"] }, "$$this.quantity" ] }
                ] 
              }
            }
          }
        },
        totalSubtotal: { $sum: { $ifNull: ["$payment.subtotal", "$payment.amount"] } },
      },
    }
  ]);

  const reportSummary = summary.length > 0 ? summary[0] : {
    totalSalesCount: 0,
    totalRevenue: 0,
    totalCouponDiscount: 0,
    totalOfferDiscount: 0,
    totalSubtotal: 0,
  };

  return {
    orders,
    reportSummary,
    period,
    startDate: start,
    endDate: end,
  };
};
