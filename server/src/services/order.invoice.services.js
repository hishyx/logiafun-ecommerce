import puppeteer from "puppeteer";
import invoiceTemplate from "../utils/order.invoice.template.js";
import Order from "../models/order.model.js";

export const generateInvoice = async (orderId) => {
  const order = await Order.findById(orderId).populate("userId");

  console.log("Order from invoice servuice", order);

  if (!order) {
    throw new Error("Order not found");
  }

  const html = invoiceTemplate(order);

  const browser = await puppeteer.launch({
    headless: "new",
  });

  const page = await browser.newPage();

  await page.setContent(html, {
    waitUntil: "networkidle0",
  });

  // Create PDF buffer
  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
  });

  await browser.close();

  // Return buffer
  return pdfBuffer;
};
