import { generateInvoice } from "../services/order.invoice.services.js";
import * as statusCodes from "../constants/statusCodes.js";
import * as messages from "../constants/messages.js";

export const downloadInvoice = async (req, res) => {
  console.log("Unversal prevent controller reached");

  try {
    const pdfBuffer = await generateInvoice(req.order._id);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=invoice-${req.order._id}.pdf`,
    });

    return res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    return res.status(statusCodes.INTERNAL_SERVER_ERROR).send(messages.INVOICE_GEN_FAIL);
  }
};
