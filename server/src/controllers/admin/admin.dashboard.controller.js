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

    // 1. Add report header
    worksheet.mergeCells("A1:G1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = "LogiaFun - Sales Report";
    titleCell.font = { name: "Arial", size: 16, bold: true, color: { argb: "FF1E293B" } };
    titleCell.alignment = { horizontal: "center" };

    worksheet.mergeCells("A2:G2");
    const rangeText = startDate && endDate 
      ? `Period: ${new Date(startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} - ${new Date(endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
      : `Period: ${period.charAt(0).toUpperCase() + period.slice(1)}`;
    const subtitleCell = worksheet.getCell("A2");
    subtitleCell.value = rangeText;
    subtitleCell.alignment = { horizontal: "center" };
    subtitleCell.font = { name: "Arial", size: 11, color: { argb: "FF64748B" } };

    worksheet.mergeCells("A3:G3");
    const generatedCell = worksheet.getCell("A3");
    generatedCell.value = `Generated on: ${new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
    generatedCell.alignment = { horizontal: "center" };
    generatedCell.font = { name: "Arial", size: 10, italic: true, color: { argb: "FF94A3B8" } };

    worksheet.addRow([]); // Blank row

    // 2. Define Columns with Keys
    worksheet.columns = [
      { header: "Order ID", key: "orderNumber", width: 22 },
      { header: "Date", key: "date", width: 15 },
      { header: "Customer", key: "customer", width: 25 },
      { header: "Subtotal", key: "subtotal", width: 15 },
      { header: "Coupon", key: "coupon", width: 15 },
      { header: "Paid Amount", key: "amount", width: 15 },
      { header: "Status", key: "status", width: 15 },
    ];

    // 3. Style Header Row (Row 5 because of headers above)
    const headerRow = worksheet.getRow(5);
    headerRow.font = { bold: true, color: { argb: "FF475569" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF1F5F9" },
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.height = 25;

    // 4. Add Data Rows
    orders.forEach((order, index) => {
      const row = worksheet.addRow({
        orderNumber: order.orderNumber,
        date: new Date(order.createdAt).toLocaleDateString('en-GB', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric' 
        }),
        customer: order.userId?.name || "Guest",
        subtotal: order.payment.subtotal || order.payment.amount,
        coupon: order.payment.discount || 0,
        amount: order.payment.amount,
        status: order.orderStatus,
      });

      // Alternating Row Color (Zebra Striping)
      if (index % 2 === 1) {
        row.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF8FAFC" },
        };
      }

      // 5. Currency Formatting & Alignment
      ["D", "E", "F"].forEach(col => {
        const cell = row.getCell(col);
        cell.numFmt = "₹#,##0.00";
        cell.alignment = { horizontal: "right" };
      });

      // 6. Status Color Coding
      const statusCell = row.getCell("G");
      statusCell.alignment = { horizontal: "center" };
      const statusValue = order.orderStatus.toLowerCase();
      if (statusValue === "delivered") statusCell.font = { color: { argb: "FF16A34A" }, bold: true };
      else if (statusValue === "pending") statusCell.font = { color: { argb: "FFD97706" }, bold: true };
      else if (statusValue === "cancelled") statusCell.font = { color: { argb: "FFDC2626" }, bold: true };
      
      // All cells border
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } },
        };
      });
    });

    // Add border to header
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFCBD5E1" } },
        left: { style: "thin", color: { argb: "FFCBD5E1" } },
        bottom: { style: "medium", color: { argb: "FF94A3B8" } },
        right: { style: "thin", color: { argb: "FFCBD5E1" } },
      };
    });

    // 7. Summary Section
    worksheet.addRow([]); // Spacer
    const summaryStartRow = worksheet.lastRow.number + 1;

    const summaryData = [
      ["Total Orders", reportSummary.totalSalesCount],
      ["Gross Merchandise Value", reportSummary.totalSubtotal],
      ["Total Coupon Discount", reportSummary.totalCouponDiscount],
      ["Net Revenue", reportSummary.totalRevenue],
    ];

    summaryData.forEach((item, idx) => {
      const row = worksheet.addRow(["", "", "", "", "", item[0], item[1]]);
      const labelCell = row.getCell(6);
      const valueCell = row.getCell(7);

      labelCell.font = { bold: true, color: { argb: "FF475569" } };
      valueCell.font = { bold: true };
      
      if (item[0] === "Net Revenue") {
        valueCell.font = { bold: true, color: { argb: "FF16A34A" }, size: 12 };
      }

      if (idx > 0) { // Currency formatting for values except "Total Orders"
        valueCell.numFmt = "₹#,##0.00";
      }
      valueCell.alignment = { horizontal: "right" };
    });

    // 8. Auto-fit column widths (rough estimation)
    worksheet.columns.forEach(column => {
      let maxColumnLength = 0;
      column.eachCell({ includeEmpty: true }, cell => {
        const currCellLen = cell.value ? cell.value.toString().length : 0;
        maxColumnLength = Math.max(maxColumnLength, currCellLen);
      });
      column.width = Math.max(column.width, maxColumnLength + 5);
    });

    // 9. Freeze Header Row
    worksheet.views = [
      { state: 'frozen', xSplit: 0, ySplit: 5, activePane: 'bottomLeft' }
    ];

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=sales-report-${period}-${new Date().toISOString().split('T')[0]}.xlsx`,
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

    const rangeText = startDate && endDate 
      ? `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
      : period.charAt(0).toUpperCase() + period.slice(1);

    const ordersHtml = orders
      .map((order, index) => {
        const rowClass = index % 2 === 0 ? 'even' : 'odd';
        return `
        <tr class="${rowClass}">
          <td>${order.orderNumber}</td>
          <td>${new Date(order.createdAt).toLocaleDateString()}</td>
          <td class="text-right">₹${(order.payment.subtotal || order.payment.amount).toLocaleString()}</td>
          <td class="text-right">₹${(order.payment.discount || 0).toLocaleString()}</td>
          <td class="text-right font-bold">₹${order.payment.amount.toLocaleString()}</td>
          <td class="text-center">
            <span class="status-badge status-${order.orderStatus.toLowerCase()}">${order.orderStatus}</span>
          </td>
        </tr>`;
      })
      .join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            @page { margin: 40px; }
            body { font-family: 'Helvetica', 'Arial', sans-serif; color: #334155; margin: 0; padding: 0; font-size: 11px; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 25px; }
            .brand h1 { font-size: 24px; font-weight: 800; color: #1e293b; margin: 0; }
            .brand p { color: #64748b; margin: 5px 0 0; font-size: 12px; }
            .report-meta { text-align: right; }
            .report-meta h2 { font-size: 18px; font-weight: 700; color: #1e293b; margin: 0; }
            .report-meta p { color: #64748b; margin: 4px 0 0; }
            
            .summary-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
            .card { padding: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; }
            .card-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 8px; letter-spacing: 0.5px; }
            .card-value { font-size: 16px; font-weight: 800; color: #0f172a; }
            
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f1f5f9; color: #475569; font-weight: 700; text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px; padding: 12px 10px; border-bottom: 2px solid #e2e8f0; text-align: left; }
            td { padding: 10px; border-bottom: 1px solid #f1f5f9; }
            tr.even { background: #ffffff; }
            tr.odd { background: #fbfcfe; }
            
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .font-bold { font-weight: 700; }
            
            .status-badge { font-size: 9px; font-weight: 700; text-transform: uppercase; padding: 3px 8px; border-radius: 12px; }
            .status-delivered { background: #f0fdf4; color: #16a34a; }
            .status-cancelled { background: #fef2f2; color: #dc2626; }
            .status-returned { background: #f8fafc; color: #64748b; }
            .status-pending { background: #fffbeb; color: #d97706; }
            
            .footer { position: fixed; bottom: 0; width: 100%; border-top: 1px solid #e2e8f0; padding-top: 15px; display: flex; justify-content: space-between; color: #94a3b8; font-size: 9px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">
              <h1>LogiaFun</h1>
              <p>Premium Ecommerce Solutions</p>
            </div>
            <div class="report-meta">
              <h2>SALES REPORT</h2>
              <p><strong>Range:</strong> ${rangeText}</p>
              <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            </div>
          </div>

          <div class="summary-cards">
            <div class="card">
              <div class="card-label">Total Orders</div>
              <div class="card-value">${reportSummary.totalSalesCount}</div>
            </div>
            <div class="card">
              <div class="card-label">Gross Revenue</div>
              <div class="card-value">₹${reportSummary.totalSubtotal.toLocaleString()}</div>
            </div>
            <div class="card" style="border-left: 4px solid #ef4444;">
              <div class="card-label">Coupon Savings</div>
              <div class="card-value" style="color: #ef4444;">-₹${reportSummary.totalCouponDiscount.toLocaleString()}</div>
            </div>
            <div class="card" style="border-left: 4px solid #16a34a; background: #f0fdf4;">
              <div class="card-label">Net Sales</div>
              <div class="card-value" style="color: #16a34a;">₹${reportSummary.totalRevenue.toLocaleString()}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th width="20%">Order ID</th>
                <th width="15%">Date</th>
                <th width="15%" class="text-right">Merch Value</th>
                <th width="15%" class="text-right">Coupon</th>
                <th width="15%" class="text-right">Paid Amt</th>
                <th width="20%" class="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              ${ordersHtml}
            </tbody>
          </table>

          <div class="footer">
            <div>This is a system generated report and does not require a signature.</div>
            <div>Generated by LogiaFun Admin Panel</div>
          </div>
        </body>
      </html>`;

    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({ 
      format: "A4", 
      printBackground: true,
      margin: { top: '40px', bottom: '60px', left: '40px', right: '40px' }
    });
    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=sales-report-${period}-${new Date().toISOString().split('T')[0]}.pdf`,
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error("PDF download error:", error);
    res.status(statusCodes.INTERNAL_SERVER_ERROR).send(messages.PDF_GEN_FAIL);
  }
};
