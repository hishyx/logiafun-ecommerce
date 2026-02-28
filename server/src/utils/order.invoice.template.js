const orderTemplate = (order) => {
  // calculate subtotal from ORIGINAL prices
  const subtotal = order.items.reduce(
    (sum, item) => sum + item.product.originalPrice * item.quantity,
    0,
  );

  // discount derived from stored final total
  const discount = subtotal - order.totalAmount;

  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td>
          <div class="product-cell">
            <img src="${item.product.image}" class="product-image"/>
            <div class="product-details">
              <div class="product-name">${item.product.name}</div>
              ${item.product.discountPercent > 0 ? `<div class="product-discount">${item.product.discountPercent}% OFF</div>` : ""}
            </div>
          </div>
        </td>
        <td class="text-center">${item.quantity}</td>
        <td>
          <div class="price-stack">
            ${item.product.discountPercent > 0 ? `<span class="original-price">₹${item.product.originalPrice}</span>` : ""}
            <span class="final-price">₹${item.product.price}</span>
          </div>
        </td>
        <td><span class="status-badge status-${item.status.toLowerCase()}">${item.status}</span></td>
        <td class="text-center">${item.returnStatus || "-"}</td>
        <td class="text-right font-bold">₹${item.product.price * item.quantity}</td>
      </tr>
    `,
    )
    .join("");

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600&family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet">
    <style>
      :root {
        --primary: #1e3a5f;
        --secondary: #f8b500;
        --accent: #4361ee;
        --white: #ffffff;
        --gray-light: #f8fafc;
        --gray-medium: #e2e8f0;
        --gray-dark: #64748b;
        --text-main: #1e293b;
        --radius: 12px;
        --shadow: 0 8px 30px rgba(0, 0, 0, 0.04);
      }

      * {
        box-sizing: border-box;
        -webkit-print-color-adjust: exact;
      }

      body {
        font-family: 'Poppins', sans-serif;
        color: var(--text-main);
        background-color: #fefefe;
        margin: 0;
        padding: 40px;
        line-height: 1.5;
        font-size: 14px;
      }

      h1, h2, h3, h4 {
        font-family: 'Fredoka', sans-serif;
        margin: 0;
      }

      /* Header Styling */
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 30px;
        background: var(--primary);
        border-radius: var(--radius);
        margin-bottom: 30px;
        color: var(--white);
        position: relative;
        overflow: hidden;
      }

      .header::after {
        content: "";
        position: absolute;
        top: 0;
        right: 0;
        width: 150px;
        height: 100%;
        background: var(--secondary);
        clip-path: polygon(25% 0%, 100% 0%, 100% 100%, 0% 100%);
        opacity: 0.1;
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 15px;
      }

      .logo-icon {
        width: 45px;
        height: 45px;
        background: var(--secondary);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Fredoka', sans-serif;
        font-weight: 600;
        font-size: 24px;
        color: var(--primary);
      }

      .brand h1 {
        font-size: 28px;
        letter-spacing: 1px;
      }

      .invoice-label {
        text-align: right;
      }

      .invoice-label h2 {
        font-size: 36px;
        color: var(--secondary);
        margin-bottom: 5px;
      }

      .invoice-label p {
        margin: 0;
        font-weight: 500;
        opacity: 0.8;
      }

      /* Grid Layout */
      .info-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
        margin-bottom: 30px;
      }

      .card {
        background: var(--white);
        padding: 24px;
        border-radius: var(--radius);
        box-shadow: var(--shadow);
        border: 1px solid var(--gray-medium);
      }

      .card-title {
        font-weight: 600;
        color: var(--primary);
        font-size: 16px;
        margin-bottom: 15px;
        display: flex;
        align-items: center;
        gap: 8px;
        border-bottom: 2px solid var(--gray-light);
        padding-bottom: 10px;
      }

      .card-title i {
        color: var(--accent);
      }

      .info-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
      }

      .info-label-text {
        font-weight: 500;
        color: var(--gray-dark);
      }

      .info-value-text {
        font-weight: 600;
        color: var(--primary);
      }

      .address-block p {
        margin: 4px 0;
        line-height: 1.4;
      }

      /* Table Styling */
      .table-container {
        background: var(--white);
        border-radius: var(--radius);
        box-shadow: var(--shadow);
        overflow: hidden;
        border: 1px solid var(--gray-medium);
        margin-bottom: 30px;
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      th {
        background: var(--primary);
        color: var(--white);
        font-family: 'Fredoka', sans-serif;
        font-weight: 500;
        text-align: left;
        padding: 15px 20px;
        font-size: 14px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      td {
        padding: 15px 20px;
        border-bottom: 1px solid var(--gray-light);
        vertical-align: middle;
      }

      .product-cell {
        display: flex;
        align-items: center;
        gap: 15px;
      }

      .product-image {
        width: 50px;
        height: 50px;
        object-fit: cover;
        border-radius: 8px;
        border: 1px solid var(--gray-medium);
        background: var(--gray-light);
      }

      .product-name {
        font-weight: 600;
        color: var(--primary);
      }

      .product-discount {
        font-size: 11px;
        color: #16a34a;
        font-weight: 600;
        background: #f0fdf4;
        padding: 2px 6px;
        border-radius: 4px;
        width: fit-content;
        margin-top: 4px;
      }

      .price-stack span {
        display: block;
      }

      .original-price {
        font-size: 12px;
        color: var(--gray-dark);
        text-decoration: line-through;
      }

      .final-price {
        font-weight: 700;
        color: var(--primary);
      }

      .status-badge {
        padding: 4px 10px;
        border-radius: 30px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
      }

      .status-delivered { background: #f0fdf4; color: #16a34a; }
      .status-pending { background: #fffbeb; color: #d97706; }
      .status-cancelled { background: #fef2f2; color: #dc2626; }

      /* Summary Section */
      .summary-section {
        display: flex;
        justify-content: flex-end;
      }

      .summary-card {
        width: 300px;
        background: var(--white);
        padding: 24px;
        border-radius: var(--radius);
        box-shadow: var(--shadow);
        border: 1px solid var(--gray-medium);
      }

      .summary-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 12px;
        color: var(--gray-dark);
        font-weight: 500;
      }

      .summary-row.discount {
        color: #16a34a;
      }

      .grand-total {
        margin-top: 20px;
        padding-top: 20px;
        border-top: 2px dashed var(--gray-medium);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .grand-total span:first-child {
        font-family: 'Fredoka', sans-serif;
        font-size: 18px;
        color: var(--primary);
        font-weight: 600;
      }

      .grand-total .total-amount {
        font-size: 24px;
        color: var(--secondary);
        font-weight: 700;
        background: var(--primary);
        padding: 8px 15px;
        border-radius: 8px;
      }

      .footer-note {
        margin-top: 40px;
        text-align: center;
        color: var(--gray-dark);
        font-size: 12px;
        padding-top: 20px;
        border-top: 1px solid var(--gray-light);
      }

      .text-center { text-align: center; }
      .text-right { text-align: right; }
      .font-bold { font-weight: 700; }
    </style>
  </head>
  <body>

    <!-- HEADER -->
    <div class="header">
      <div class="brand">
        <div class="logo-icon">L</div>
        <h1>LogiaFun</h1>
      </div>
      <div class="invoice-label">
        <h2>INVOICE</h2>
        <p>Order #${order.orderNumber}</p>
      </div>
    </div>

    <!-- MAIN INFO GRID -->
    <div class="info-grid">
      <!-- Order Card -->
      <div class="card">
        <div class="card-title">Order Information</div>
        <div class="info-row">
          <span class="info-label-text">Date:</span>
          <span class="info-value-text">${new Date(order.createdAt).toLocaleDateString()}</span>
        </div>
        <div class="info-row">
          <span class="info-label-text">Status:</span>
          <span class="info-value-text">${order.orderStatus}</span>
        </div>
        <div class="info-row">
          <span class="info-label-text">Payment Method:</span>
          <span class="info-value-text">${order.payment.method.toUpperCase()}</span>
        </div>
      </div>

      <!-- Customer Card -->
      <div class="card">
        <div class="card-title">Customer Information</div>
        <div class="info-row">
          <span class="info-label-text">Name:</span>
          <span class="info-value-text">${order.userId.name}</span>
        </div>
        <div class="info-row">
          <span class="info-label-text">Email:</span>
          <span class="info-value-text" style="font-size: 12px;">${order.userId.email}</span>
        </div>
        <div class="info-row">
          <span class="info-label-text">Phone:</span>
          <span class="info-value-text">${order.userId.phone}</span>
        </div>
      </div>

      <!-- Shipping Card -->
      <div class="card">
        <div class="card-title">Shipping Address</div>
        <div class="address-block">
          <div class="info-value-text">${order.address.addressName}</div>
          <p>${order.address.street}</p>
          <p>${order.address.city}, ${order.address.pincode}</p>
          <p>Phone: ${order.address.phone}</p>
        </div>
      </div>

      <!-- Payment Status Card -->
      <div class="card">
        <div class="card-title">Payment Status</div>
        <div class="info-row">
          <span class="info-label-text">Status:</span>
          <span class="info-value-text">${order.payment.status}</span>
        </div>
        <div class="info-row">
          <span class="info-label-text">Transaction ID:</span>
          <span class="info-value-text" style="font-size: 11px;">${order.payment.transactionId || "N/A"}</span>
        </div>
        <div class="info-row">
          <span class="info-label-text">Checkout ID:</span>
          <span class="info-value-text" style="font-size: 11px;">${order.checkoutId}</span>
        </div>
      </div>
    </div>

    <!-- PRODUCT TABLE -->
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th width="40%">Product</th>
            <th class="text-center" width="10%">Qty</th>
            <th width="15%">Price</th>
            <th width="10%">Status</th>
            <th class="text-center" width="10%">Return</th>
            <th class="text-right" width="15%">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
    </div>

    <!-- SUMMARY SECTION -->
    <div class="summary-section">
      <div class="summary-card">
        <div class="summary-row">
          <span>Subtotal</span>
          <span>₹${subtotal}</span>
        </div>
        <div class="summary-row discount">
          <span>Discount Applied</span>
          <span>-₹${discount}</span>
        </div>
        <div class="summary-row" style="color:var(--accent)">
          <span>Shipping</span>
          <span>FREE</span>
        </div>
        <div class="grand-total">
          <span>Grand Total</span>
          <span class="total-amount">₹${order.totalAmount}</span>
        </div>
      </div>
    </div>

    <div class="footer-note">
      <p>Thank you for shopping with LogiaFun! We hope you love your purchase.</p>
      <p>&copy; ${new Date().getFullYear()} LogiaFun E-commerce Store. All rights reserved.</p>
    </div>

  </body>
  </html>
  `;
};

export default orderTemplate;
