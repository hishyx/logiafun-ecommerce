import Order from "../../models/order.model.js";
import User from "../../models/user.model.js";
import Product from "../../models/products.model.js";
import Category from "../../models/categories.model.js";
import * as adminAnalyticsServices from "../../services/admin/admin.analytics.services.js";
import ExcelJS from "exceljs";
import puppeteer from "puppeteer";

export const adminDashboardPage = async (req, res) => {
  try {
    // 1. Total Revenue (sum of all paid orders)
    const revenueData = await Order.aggregate([
      { 
        $match: { 
          "payment.status": "paid",
          orderStatus: { $nin: ["cancelled", "returned"] }
        } 
      },
      { $group: { _id: null, totalRevenue: { $sum: "$payment.amount" } } }
    ]);
    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    // 2. Total Orders
    const totalOrders = await Order.countDocuments({ 
      "payment.status": "paid",
      orderStatus: { $nin: ["cancelled", "returned"] }
    });

    // 3. Total Users (excluding admins)
    const totalUsers = await User.countDocuments({ role: "user" });

    // 4. Total Products
    const totalProducts = await Product.countDocuments();

    // 5. Recent Orders
    const recentOrders = await Order.find({ 
      "payment.status": "paid",
      orderStatus: { $nin: ["cancelled", "returned"] }
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("userId", "name email");

    // 6. Sales for Chart (Last 7 days)
    const last7Days = new Array(7).fill(0).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      return d;
    }).reverse();

    const chartData = await Order.aggregate([
      {
        $match: {
          "payment.status": "paid",
          orderStatus: { $nin: ["cancelled", "returned"] },
          createdAt: { $gte: last7Days[0] }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: "$payment.amount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Fill in missing days with 0
    const chartMap = new Map(chartData.map(d => [d._id, d.total]));
    const finalLabels = [];
    const finalValues = [];

    last7Days.forEach(date => {
      const dateStr = date.toISOString().split('T')[0];
      finalLabels.push(dateStr);
      finalValues.push(chartMap.get(dateStr) || 0);
    });

    res.render("admin/admin.dashboard.ejs", {
      totalRevenue,
      totalOrders,
      totalUsers,
      totalProducts,
      recentOrders,
      chartLabels: JSON.stringify(finalLabels),
      chartValues: JSON.stringify(finalValues),
    });
  } catch (err) {
    console.error("Error in adminDashboardPage:", err);
    res.status(500).send("Internal Server Error");
  }
};

export const adminAnalyticsPage = async (req, res) => {
  try {
    const { period = "daily", startDate, endDate } = req.query;

    // 1. Category-wise sales
    const categorySales = await Order.aggregate([
      { 
        $match: { 
          "payment.status": "paid",
          orderStatus: { $nin: ["cancelled", "returned"] }
        } 
      },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product.productId",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      { $unwind: "$productDetails" },
      {
        $lookup: {
          from: "categories",
          localField: "productDetails.categoryId",
          foreignField: "_id",
          as: "categoryDetails"
        }
      },
      { $unwind: "$categoryDetails" },
      {
        $group: {
          _id: "$categoryDetails.name",
          totalSales: { $sum: { $multiply: ["$items.product.discountedPrice", "$items.quantity"] } }
        }
      }
    ]);

    // 2. Top Performing Products
    const topProducts = await Order.aggregate([
      { 
        $match: { 
          "payment.status": "paid",
          orderStatus: { $nin: ["cancelled", "returned"] }
        } 
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product.productId",
          name: { $first: "$items.product.name" },
          image: { $first: "$items.product.image" },
          totalSold: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.product.discountedPrice", "$items.quantity"] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]);

    // 3. Payment Method Distribution
    const paymentMethods = await Order.aggregate([
      { 
        $match: { 
          "payment.status": "paid",
          orderStatus: { $nin: ["cancelled", "returned"] }
        } 
      },
      {
        $group: {
          _id: "$payment.method",
          count: { $sum: 1 }
        }
      }
    ]);

    // 4. Sales Report Data
    const reportData = await adminAnalyticsServices.getSalesReport({ period, startDate, endDate });

    res.render("admin/admin.analytics.ejs", {
      categoryLabels: JSON.stringify(categorySales.map(c => c._id)),
      categoryValues: JSON.stringify(categorySales.map(c => c.totalSales)),
      topProducts,
      paymentLabels: JSON.stringify(paymentMethods.map(p => p._id)),
      paymentValues: JSON.stringify(paymentMethods.map(p => p.count)),
      ...reportData,
      period,
      startDate,
      endDate
    });
  } catch (err) {
    console.error("Error in adminAnalyticsPage:", err);
    res.status(500).send("Internal Server Error");
  }
};

export const downloadExcel = async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    const { orders, reportSummary } = await adminAnalyticsServices.getSalesReport({ period, startDate, endDate });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sales Report");

    worksheet.columns = [
      { header: "Order ID", key: "orderNumber", width: 20 },
      { header: "Date", key: "date", width: 15 },
      { header: "Customer", key: "customer", width: 25 },
      { header: "Subtotal", key: "subtotal", width: 15 },
      { header: "Offer Discount", key: "offerDiscount", width: 15 },
      { header: "Coupon", key: "coupon", width: 15 },
      { header: "Paid Amount", key: "amount", width: 15 },
      { header: "Status", key: "status", width: 15 },
    ];

    orders.forEach(order => {
      const offerDiscount = order.items.reduce((acc, item) => acc + (item.product.originalPrice - item.product.discountedPrice) * item.quantity, 0);
      worksheet.addRow({
        orderNumber: order.orderNumber,
        date: new Date(order.createdAt).toLocaleDateString(),
        customer: order.userId?.name || "Guest",
        subtotal: `₹${(order.payment.subtotal || order.payment.amount).toLocaleString()}`,
        offerDiscount: `₹${offerDiscount.toLocaleString()}`,
        coupon: `₹${(order.payment.discount || 0).toLocaleString()}`,
        amount: `₹${order.payment.amount.toLocaleString()}`,
        status: order.orderStatus
      });
    });

    worksheet.addRow([]);
    worksheet.addRow({ 
      orderNumber: "TOTALS", 
      subtotal: `₹${reportSummary.totalSubtotal.toLocaleString()}`,
      offerDiscount: `₹${reportSummary.totalOfferDiscount.toLocaleString()}`,
      coupon: `₹${reportSummary.totalCouponDiscount.toLocaleString()}`,
      amount: `₹${reportSummary.totalRevenue.toLocaleString()}`, 
      status: `${reportSummary.totalSalesCount} Orders` 
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=sales-report-${period}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Excel download error:", error);
    res.status(500).send("Failed to generate Excel report");
  }
};

export const downloadPDF = async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    const { orders, reportSummary } = await adminAnalyticsServices.getSalesReport({ period, startDate, endDate });

    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    let ordersHtml = orders.map(order => {
      const offerDiscount = order.items.reduce((acc, item) => acc + (item.product.originalPrice - item.product.discountedPrice) * item.quantity, 0);
      return `
      <tr>
        <td>${order.orderNumber}</td>
        <td>${new Date(order.createdAt).toLocaleDateString()}</td>
        <td>₹${(order.payment.subtotal || order.payment.amount).toLocaleString()}</td>
        <td>₹${offerDiscount.toLocaleString()}</td>
        <td>₹${(order.payment.discount || 0).toLocaleString()}</td>
        <td>₹${order.payment.amount.toLocaleString()}</td>
        <td>${order.orderStatus}</td>
      </tr>
    `}).join("");

    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; color: #333; }
            .summary { margin-bottom: 30px; padding: 20px; background: #f9f9f9; border-radius: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f2f2f2; }
            .totals { font-weight: bold; background: #eee; }
          </style>
        </head>
        <body>
          <h1>Sales Report (${period})</h1>
          <div class="summary">
            <p><strong>Total Orders:</strong> ${reportSummary.totalSalesCount}</p>
            <p><strong>Total Subtotal:</strong> ₹${reportSummary.totalSubtotal.toLocaleString()}</p>
            <p><strong>Total Offer Discounts:</strong> ₹${reportSummary.totalOfferDiscount.toLocaleString()}</p>
            <p><strong>Total Coupons:</strong> ₹${reportSummary.totalCouponDiscount.toLocaleString()}</p>
            <p><strong>Final Revenue:</strong> ₹${reportSummary.totalRevenue.toLocaleString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Subtotal</th>
                <th>Offer Disc.</th>
                <th>Coupon</th>
                <th>Final Amt</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${ordersHtml}
            </tbody>
          </table>
        </body>
      </html>
    `;

    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=sales-report-${period}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error("PDF download error:", error);
    res.status(500).send("Failed to generate PDF report");
  }
};
