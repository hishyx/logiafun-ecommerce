const orderTemplate = (order) => {
  // Merchandise Subtotal (Before Coupon)
  const merchandiseSubtotal = order.payment.subtotal;
  const couponDiscount = order.payment.discount;
  const netMerchandiseValue = merchandiseSubtotal - couponDiscount;
  const gst = order.payment.gst;
  const shippingCharge = order.payment.shipping;
  const totalPaid = order.payment.amount;
  const totalRefunded = order.refundSummary ? (order.refundSummary.totalRefundedAmount || 0) : 0;

  const itemsHtml = order.items
    .map(
      (item) => {
        let statusClass = 'pending';
        if (item.status === 'delivered') statusClass = 'delivered';
        if (item.status === 'cancelled') statusClass = 'cancelled';
        if (item.status === 'returned') statusClass = 'returned';

        return `
      <tr>
        <td>
          <div class="product-cell">
            <img src="${item.product.image}" class="product-image"/>
            <div class="product-info">
              <div class="product-name">${item.product.name}</div>
              <div class="product-variant">${item.product.variantName || "-"}</div>
            </div>
          </div>
        </td>
        <td class="text-center">${item.quantity}</td>
        <td>
          <div class="price-stack">
            ${item.product.originalPrice > item.product.discountedPrice ? `<span class="original-price">₹${item.product.originalPrice}</span>` : ""}
            <span class="final-price">₹${item.product.discountedPrice}</span>
          </div>
        </td>
        <td class="text-center">
          <span class="status-text status-${statusClass}">${item.status}</span>
        </td>
        <td class="text-right font-bold">₹${item.product.discountedPrice * item.quantity}</td>
      </tr>
    `;
      }
    )
    .join("");

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <style>
      @page {
        size: A4;
        margin: 0;
      }
      * {
        box-sizing: border-box;
        -webkit-print-color-adjust: exact;
      }
      body {
        font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        color: #334155;
        background-color: #fff;
        margin: 0;
        padding: 40px;
        line-height: 1.4;
        font-size: 13px;
      }
      .container {
        max-width: 800px;
        margin: 0 auto;
      }
      /* Header Styling */
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding-bottom: 20px;
        border-bottom: 2px solid #e2e8f0;
        margin-bottom: 25px;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .logo-icon {
        width: 40px;
        height: 40px;
        background: #1e293b;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 20px;
        color: white;
      }
      .brand-name {
        font-size: 24px;
        font-weight: 700;
        color: #1e293b;
        margin: 0;
      }
      .invoice-meta {
        text-align: right;
      }
      .invoice-title {
        font-size: 28px;
        font-weight: 800;
        color: #1e293b;
        margin: 0;
        letter-spacing: -0.5px;
      }
      .invoice-num {
        font-weight: 600;
        color: #64748b;
        margin-top: 5px;
      }

      /* Info Grid */
      .info-grid {
        display: grid;
        grid-template-columns: 1.2fr 1fr;
        gap: 40px;
        margin-bottom: 25px;
      }
      .section-title {
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        color: #94a3b8;
        letter-spacing: 1px;
        margin-bottom: 10px;
        border-bottom: 1px solid #f1f5f9;
        padding-bottom: 5px;
      }
      .info-block {
        margin-bottom: 15px;
      }
      .info-row {
        display: flex;
        margin-bottom: 4px;
      }
      .info-label {
        width: 120px;
        color: #64748b;
        font-weight: 500;
      }
      .info-value {
        font-weight: 600;
        color: #1e293b;
      }

      /* Address */
      .shipping-section {
        margin-bottom: 25px;
        padding: 15px;
        background: #f8fafc;
        border-radius: 8px;
        border: 1px solid #f1f5f9;
      }
      .address-details {
        font-style: normal;
        line-height: 1.6;
      }
      .address-name {
        font-weight: 700;
        font-size: 14px;
        color: #1e293b;
        margin-bottom: 2px;
      }

      /* Table Styling */
      .table-wrapper {
        margin-bottom: 25px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th {
        background: #f8fafc;
        color: #475569;
        font-weight: 700;
        text-align: left;
        padding: 10px 12px;
        border-bottom: 2px solid #e2e8f0;
        font-size: 11px;
        text-transform: uppercase;
      }
      td {
        padding: 10px 12px;
        border-bottom: 1px solid #f1f5f9;
        vertical-align: middle;
      }
      .product-cell {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .product-image {
        width: 40px;
        height: 40px;
        object-fit: cover;
        border-radius: 4px;
        border: 1px solid #e2e8f0;
      }
      .product-name {
        font-weight: 600;
        color: #1e293b;
      }
      .product-variant {
        font-size: 11px;
        color: #64748b;
      }
      .price-stack span {
        display: block;
      }
      .original-price {
        font-size: 11px;
        color: #94a3b8;
        text-decoration: line-through;
      }
      .final-price {
        font-weight: 600;
      }
      .status-text {
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        padding: 2px 8px;
        border-radius: 4px;
      }
      .status-delivered { background: #f0fdf4; color: #16a34a; }
      .status-pending { background: #fffbeb; color: #d97706; }
      .status-cancelled { background: #fef2f2; color: #dc2626; }
      .status-returned { background: #f8fafc; color: #64748b; }
      .refund-notice {
        margin-top: 20px;
        padding: 12px;
        background: #fdf2f2;
        border: 1px dashed #fecaca;
        border-radius: 6px;
      }
      .refund-title {
        color: #dc2626;
        font-weight: 700;
        font-size: 11px;
        text-transform: uppercase;
        margin-bottom: 5px;
      }
      .refund-amount {
        font-size: 16px;
        font-weight: 800;
        color: #dc2626;
      }
      .refund-note {
        font-size: 10px;
        color: #b91c1c;
        margin-top: 4px;
        font-style: italic;
      }

      /* Totals */
      .totals-container {
        display: flex;
        justify-content: flex-end;
      }
      .totals-table {
        width: 250px;
      }
      .total-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 13px;
      }
      .total-row.discount {
        color: #16a34a;
        font-weight: 500;
      }
      .grand-total-row {
        display: flex;
        justify-content: space-between;
        margin-top: 15px;
        padding-top: 15px;
        border-top: 2px solid #1e293b;
        font-size: 18px;
        font-weight: 800;
        color: #1e293b;
      }

      /* Footer */
      .footer {
        margin-top: 50px;
        text-align: center;
        padding-top: 20px;
        border-top: 1px solid #f1f5f9;
        color: #94a3b8;
        font-size: 11px;
      }
      .thank-you {
        font-weight: 600;
        color: #64748b;
        margin-bottom: 5px;
        font-size: 13px;
      }
      .text-center { text-align: center; }
      .text-right { text-align: right; }
      .font-bold { font-weight: 700; }
    </style>
  </head>
  <body>
    <div class="container">
      <!-- HEADER -->
      <div class="header">
        <div class="brand">
          <div class="logo-icon">L</div>
          <h1 class="brand-name">LogiaFun</h1>
        </div>
        <div class="invoice-meta">
          <h2 class="invoice-title">INVOICE</h2>
          <div class="invoice-num">#${order.orderNumber}</div>
        </div>
      </div>

      <!-- INFO GRID -->
      <div class="info-grid">
        <div class="info-block">
          <div class="section-title">Order Information</div>
          <div class="info-row">
            <span class="info-label">Order Date</span>
            <span class="info-value">${new Date(order.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Order Status</span>
            <span class="info-value">${order.orderStatus}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Payment Type</span>
            <span class="info-value">${order.payment.method.toUpperCase()}</span>
          </div>
        </div>

        <div class="info-block">
          <div class="section-title">Customer Details</div>
          <div class="info-row">
            <span class="info-label">Name</span>
            <span class="info-value">${order.userId.name}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Email</span>
            <span class="info-value" style="font-size: 12px;">${order.userId.email}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Phone</span>
            <span class="info-value">${order.userId.phone}</span>
          </div>
        </div>
      </div>

      <!-- SHIPPING -->
      <div class="shipping-section">
        <div class="section-title">Shipping Address</div>
        <div class="address-details">
          <div class="address-name">${order.address.name}</div>
          <div>${order.address.street}</div>
          <div>${order.address.city}, ${order.address.pincode}</div>
          <div>Phone: ${order.address.phone}</div>
        </div>
      </div>

      <!-- PRODUCT TABLE -->
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th width="45%">Product</th>
              <th class="text-center" width="10%">Qty</th>
              <th width="15%">Price</th>
              <th class="text-center" width="15%">Status</th>
              <th class="text-right" width="15%">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
      </div>

      <!-- TOTALS -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-top: 10px;">
        <div style="flex: 1;">
          ${totalRefunded > 0 ? `
            <div class="refund-notice">
              <div class="refund-title">Refund Summary</div>
              <div class="refund-amount">Total Refunded: ₹${totalRefunded}</div>
              <div style="font-weight: 600; color: #dc2626; margin-top: 2px;">Refund Method: Wallet</div>
              <div class="refund-note">* Includes proportional tax & shipping share.</div>
            </div>
          ` : ''}
        </div>
        <div class="totals-table">
          <div class="total-row">
            <span>Merchandise Value</span>
            <span>₹${merchandiseSubtotal}</span>
          </div>
          ${couponDiscount > 0 ? `
            <div class="total-row discount">
              <span>Coupon Discount</span>
              <span>-₹${couponDiscount}</span>
            </div>
            <div class="total-row" style="font-weight: 600; color: #1e293b; padding: 4px 0; border-top: 1px solid #f1f5f9;">
              <span>Net Merchandise Value</span>
              <span>₹${netMerchandiseValue}</span>
            </div>
          ` : ''}
          <div class="total-row" style="margin-top: 5px;">
            <span>GST Charged</span>
            <span>₹${gst}</span>
          </div>
          <div class="total-row">
            <span>Shipping Fee</span>
            <span style="color: #16a34a; font-weight: 600;">${shippingCharge > 0 ? '₹' + shippingCharge : 'FREE'}</span>
          </div>
          <div class="grand-total-row">
            <span>Final Amount Paid</span>
            <span>₹${totalPaid}</span>
          </div>
        </div>
      </div>

      <!-- FOOTER -->
      <div class="footer">
        <div class="thank-you">Thank you for shopping with LogiaFun!</div>
        <div>We appreciate your business. If you have any questions about this invoice, please contact us.</div>
        <div style="margin-top: 15px;">&copy; ${new Date().getFullYear()} LogiaFun E-commerce Store. All rights reserved.</div>
      </div>
    </div>
  </body>
  </html>
  `;
};

export default orderTemplate;
