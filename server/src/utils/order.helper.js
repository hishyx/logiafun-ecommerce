export const generateOrderNumber = () => {
  const now = new Date();

  const datePart =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");

  const timePart =
    String(now.getHours()).padStart(2, "0") +
    String(now.getMinutes()).padStart(2, "0") +
    String(now.getSeconds()).padStart(2, "0");

  const randomPart = Math.floor(1000 + Math.random() * 9000); // 4-digit random

  return `LF-${datePart}-${timePart}-${randomPart}`;
};

export const generateCheckoutId = () => {
  const timestamp = Date.now(); // milliseconds
  const randomPart = Math.floor(100 + Math.random() * 900);

  return `CHK-${timestamp}-${randomPart}`;
};

export const calculateProportionalRefund = (order, itemBaseTotal) => {
  const totalPaid = order.payment.amount;

  const subtotalAfterDiscount = order.payment.subtotal - order.payment.discount;

  const alreadyRefunded = order.refundSummary?.totalRefundedAmount || 0;

  const remainingRefundable = totalPaid - alreadyRefunded;

  // full remaining refund protection
  if (subtotalAfterDiscount <= 0) {
    return remainingRefundable > 0 ? remainingRefundable : 0;
  }

  let refundAmount = Math.round(
    (itemBaseTotal / subtotalAfterDiscount) * totalPaid,
  );

  // drift protection
  if (refundAmount > remainingRefundable) {
    refundAmount = remainingRefundable;
  }

  if (refundAmount < 0) refundAmount = 0;

  return refundAmount;
};
