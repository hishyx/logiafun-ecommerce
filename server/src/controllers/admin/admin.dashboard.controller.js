import * as adminAnalyticsServices from "../../services/admin/admin.analytics.services.js";
import * as dashboardService from "../../services/admin/admin.dashboard.service.js";
import ExcelJS from "exceljs";
import puppeteer from "puppeteer";
import * as statusCodes from "../../constants/statusCodes.js";
import * as messages from "../../constants/messages.js";

// render dashboard — all data fetched in parallel to minimise latency
export const adminDashboardPage = async (req, res) => {
  try {
    const defaultFrequency = "monthly";

    const [summary, chartData, topProducts, topCategories, recentOrders] =
      await Promise.all([
        dashboardService.getSummaryStats(),
        dashboardService.getRevenueSeries(defaultFrequency),
        dashboardService.getTopProducts(),
        dashboardService.getTopCategories(),
        dashboardService.getRecentOrders(),
      ]);

    res.render("admin/admin.dashboard.ejs", {
      summary,
      // stringify so EJS can embed as JS literals without XSS risk
      chartLabels: JSON.stringify(chartData.labels),
      chartValues: JSON.stringify(chartData.values),
      defaultFrequency,
      topProducts,
      topCategories,
      recentOrders,
    });
  } catch (err) {
    console.error("Dashboard page error:", err);
    res.status(statusCodes.INTERNAL_SERVER_ERROR).send("Server Error");
  }
};

// GET /admin/dashboard/chart?frequency=daily|weekly|monthly|yearly
export const getDashboardChartData = async (req, res) => {
  try {
    const { frequency = "monthly" } = req.query;
    const validFrequencies = ["daily", "weekly", "monthly", "yearly"];

    if (!validFrequencies.includes(frequency)) {
      return res
        .status(statusCodes.BAD_REQUEST)
        .json({
          message: "Invalid frequency. Use: daily, weekly, monthly, yearly.",
        });
    }

    const data = await dashboardService.getRevenueSeries(frequency);
    res.status(statusCodes.OK).json(data);
  } catch (err) {
    console.error("Dashboard chart data error:", err);
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Failed to load chart data." });
  }
};

export const getDashboardSummaryStats = async (req, res) => {
  try {
    const data = await dashboardService.getSummaryStats();
    res.status(statusCodes.OK).json(data);
  } catch (err) {
    console.error("Dashboard summary stats error:", err);
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Failed to load stats." });
  }
};

export const getDashboardTopProductsAPI = async (req, res) => {
  try {
    const data = await dashboardService.getTopProducts();
    res.status(statusCodes.OK).json(data);
  } catch (err) {
    console.error("Dashboard top products error:", err);
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Failed to load top products." });
  }
};

// analytics page + download handlers — untouched, owned by the reports module

export const adminAnalyticsPage = async (req, res) => {
  try {
    const { period = "daily", startDate, endDate, page = 1 } = req.query;

    const analyticsData = await adminAnalyticsServices.getReportData({
      period,
      startDate,
      endDate,
      page: parseInt(page),
    });

    res.render("admin/admin.analytics.ejs", {
      ...analyticsData,
      period,
      startDate,
      endDate,
    });
  } catch (err) {
    console.error("Error in adminAnalyticsPage:", err);
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .send(messages.INTERNAL_SERVER_ERROR);
  }
};

export const downloadExcel = async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    const { orders, orderCount, grossSale, couponDiscount, netRevenue } =
      await adminAnalyticsServices.getReportData({
        period,
        startDate,
        endDate,
        page: 1,
      });

    const reportSummary = {
      totalSubtotal: grossSale,
      totalCouponDiscount: couponDiscount,
      totalRevenue: netRevenue,
      totalSalesCount: orderCount,
    };

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sales Report");

    worksheet.columns = [
      { header: "Order ID", key: "orderNumber", width: 20 },
      { header: "Date", key: "date", width: 15 },
      { header: "Customer", key: "customer", width: 25 },
      { header: "Subtotal", key: "subtotal", width: 15 },
      { header: "Coupon", key: "coupon", width: 15 },
      { header: "Paid Amount", key: "amount", width: 15 },
      { header: "Status", key: "status", width: 15 },
    ];

    orders.forEach((order) => {
      worksheet.addRow({
        orderNumber: order.orderNumber,
        date: new Date(order.createdAt).toLocaleDateString(),
        customer: order.userId?.name || "Guest",
        subtotal: `₹${(order.payment.subtotal || order.payment.amount).toLocaleString()}`,
        coupon: `₹${(order.payment.discount || 0).toLocaleString()}`,
        amount: `₹${order.payment.amount.toLocaleString()}`,
        status: order.orderStatus,
      });
    });

    worksheet.addRow([]);
    worksheet.addRow({
      orderNumber: "TOTALS",
      subtotal: `₹${reportSummary.totalSubtotal.toLocaleString()}`,
      coupon: `₹${reportSummary.totalCouponDiscount.toLocaleString()}`,
      amount: `₹${reportSummary.totalRevenue.toLocaleString()}`,
      status: `${reportSummary.totalSalesCount} Orders`,
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=sales-report-${period}.xlsx`,
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Excel download error:", error);
    res.status(statusCodes.INTERNAL_SERVER_ERROR).send(messages.EXCEL_GEN_FAIL);
  }
};

export const downloadPDF = async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    const { orders, orderCount, grossSale, couponDiscount, netRevenue } =
      await adminAnalyticsServices.getReportData({
        period,
        startDate,
        endDate,
        page: 1,
      });

    const reportSummary = {
      totalSubtotal: grossSale,
      totalCouponDiscount: couponDiscount,
      totalRevenue: netRevenue,
      totalSalesCount: orderCount,
    };

    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    let ordersHtml = orders
      .map((order) => {
        return `
        <tr>
          <td>${order.orderNumber}</td>
          <td>${new Date(order.createdAt).toLocaleDateString()}</td>
          <td>₹${(order.payment.subtotal || order.payment.amount).toLocaleString()}</td>
          <td>₹${(order.payment.discount || 0).toLocaleString()}</td>
          <td>₹${order.payment.amount.toLocaleString()}</td>
          <td>${order.orderStatus}</td>
        </tr>`;
      })
      .join("");

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
          </style>
        </head>
        <body>
          <h1>Sales Report (${period})</h1>
          <div class="summary">
            <p><strong>Total Orders:</strong> ${reportSummary.totalSalesCount}</p>
            <p><strong>Final Revenue:</strong> ₹${reportSummary.totalRevenue.toLocaleString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Order ID</th><th>Date</th><th>Subtotal</th>
                <th>Coupon</th><th>Final Amt</th><th>Status</th>
              </tr>
            </thead>
            <tbody>${ordersHtml}</tbody>
          </table>
        </body>
      </html>`;

    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=sales-report-${period}.pdf`,
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error("PDF download error:", error);
    res.status(statusCodes.INTERNAL_SERVER_ERROR).send(messages.PDF_GEN_FAIL);
  }
};
