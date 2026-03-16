import Order from "../models/order.model.js";
import { getAvailableCartItems, deleteAllItems } from "./user.cart.services.js";
import {
  generateCheckoutId,
  generateOrderNumber,
} from "../utils/order.helper.js";

import statusTransitions from "../components/order.status.transitions.js";

import * as userWalletServices from "./user.wallet.services.js";

import { getAddressDetails } from "./user.services.js";

import {
  changeProductStock,
  getProductVariantDetails,
} from "./user.product.services.js";

import Coupon from "../models/coupon.model.js";

import { couponUsage } from "../models/coupon.model.js";
import razorpay from "../config/razorpay.js";

export const createOrder = async (userId, orderData) => {
  const [orderProducts, amounts] = await getAvailableCartItems(userId, true);

  if (!amounts.subtotal) throw new Error("Subtotal invalid");

  console.log("Got items btw ");
  let couponDiscountAmount = 0;
  let paymentSuccess;

  if (orderProducts.length == 0) throw new Error("The cart is empty");

  if (orderData.couponId) {
    const coupon = await Coupon.findOne({
      _id: orderData.couponId,
      minPurchaseAmount: { $lte: amounts.subtotal },
      isActive: true,
      startDate: { $lte: new Date() },
      expiryDate: { $gte: new Date() },
      $expr: { $lt: ["$usedCount", "$usageLimit"] },
    });

    if (coupon) {
      let discount = 0;

      // FIXED COUPON
      if (coupon.discountType === "fixed") {
        discount = coupon.discountValue;
      }

      // PERCENTAGE COUPON
      if (coupon.discountType === "percentage") {
        discount = (amounts.total * coupon.discountValue) / 100;
      }

      // prevent discount more than total
      if (discount > amounts.total) {
        discount = amounts.total;
      }

      // apply discount
      amounts.total = amounts.total - discount;
      couponDiscountAmount = discount;

      const usedCoupon = await couponUsage.findOne({
        userId,
        couponId: coupon._id,
      });

      if (!usedCoupon) {
        await couponUsage.create({
          couponId: coupon._id,
          userId,
        });

        // increase used count
        await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } });
      }
    }
  }
  console.log("orderData.selectedAddress is : ", orderData.selectedAddress);

  const orderAddress = await getAddressDetails(
    userId,
    orderData.selectedAddress,
  );

  const paymentMethod = orderData.paymentMethod;

  const checkoutId = generateCheckoutId();

  const items = [];

  console.log("ORDER PRODUCTS LENGTH:", orderProducts.length);

  for (const orderProduct of orderProducts) {
    if (!orderProduct.product || !orderProduct.product.variants) {
      console.log("BROKEN ITEM:", orderProduct);
      continue;
    }
    const productId = orderProduct.product._id;
    const variantId = orderProduct.product.variants._id;
    const quantity = Number(orderProduct?.items?.quantity);
    const unitPrice = Number(orderProduct.discountedPrice);

    const itemTotal = unitPrice * quantity;

    const itemShare = itemTotal / amounts.subtotal;

    const itemCouponDiscount = itemShare * couponDiscountAmount;

    const finalItemTotal = Math.round(itemTotal - itemCouponDiscount);

    const finalUnitPrice = Math.round(finalItemTotal / quantity);

    items.push({
      product: {
        productId,
        variantId,
        name: orderProduct?.product?.name,
        image: orderProduct?.product?.variants?.images[0],
        originalPrice: unitPrice,
        discountedPrice: finalUnitPrice,
      },
      quantity,
      status: "pending",
      shipping: {
        trackingNumber: null,
        carrier: null,
        shippedAt: null,
        deliveredAt: null,
      },
    });

    await changeProductStock(productId, variantId, quantity, "decrease");
  }

  console.log("Order pushing done");

  //Payment operation

  const orderNumber = generateOrderNumber();

  //Create temp order

  const newOrder = await Order.create({
    orderNumber,
    checkoutId,
    userId,
    items,
    totalAmount: amounts?.total,
    payment: {
      method: paymentMethod,
      transactionId: null,
      status: "pending",

      amount: amounts?.total,
      subtotal: amounts?.subtotal,
      discount: couponDiscountAmount,
      shipping: amounts?.shipping,
      gst: amounts?.gst,
    },
    address: orderAddress,
  });

  console.log("Order creating done");

  if (paymentMethod == "cod") paymentSuccess = true;

  if (paymentMethod == "wallet") {
    paymentSuccess = await userWalletServices.payWithWallet(
      userId,
      amounts?.total,
      orderNumber,
    );
  }

  if (paymentMethod == "razorpay") {
    const razorpayOrder = await razorpay.orders.create({
      amount: amounts?.total * 100,
      currency: "INR",
      receipt: orderNumber,
    });

    return {
      razorpay: true,
      orderId: newOrder._id,
      orderNumber: newOrder.orderNumber,
      userId: newOrder.userId,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      key: process.env.RAZORPAY_KEY_ID,
    };
  }

  if (!paymentSuccess) throw new Error("Something went wrong");

  // console.log("order done");

  //Update payment status

  newOrder.payment.status = "paid";
  newOrder.save();

  await deleteAllItems(userId);

  return newOrder;
};

export const getAllOrders = async (userId, limit) => {
  const query = Order.find({ userId }).sort({ createdAt: -1 }); // latest first

  if (limit) {
    query.limit(limit);
  }

  return await query.lean();
};

export const getOrderDetails = async (orderId, orderNumber) => {
  console.log("getOrderDetails called");
  console.log("orderId:", orderId);
  console.log("orderNumber:", orderNumber);

  let order;

  if (orderNumber) {
    console.log("Searching by orderNumber...");
    order = await Order.findOne({ orderNumber }).populate("userId");
  } else {
    console.log("Searching by orderId...");
    order = await Order.findById(orderId).populate("userId");
  }

  order = order.toObject();

  for (const item of order.items) {
    const { variantName } = await getProductVariantDetails(
      item.product.productId,
      item.product.variantId,
    );

    console.log("variantName is:", variantName);

    item.product.variantName = variantName;
  }
  console.log("Order is:\n", JSON.stringify(order, null, 2));

  return order;
};

export const cancelEntireOrder = async (orderId, reason) => {
  const order = await Order.findById(orderId);

  if (!order) throw new Error("Order not found");

  if (order.payment.status != "paid")
    throw new Error("The payment isn't done for the order");

  const availableTransitions = statusTransitions[order.orderStatus];

  if (!availableTransitions?.includes("cancelled")) {
    throw new Error("Can't change the status because it's invalid");
  }

  for (let item of order.items) {
    await cancelSpecificOrderItem(orderId, item._id, reason, true);
  }

  // update order status
  order.orderStatus = "cancelled";
  order.statusChangeReason = reason;

  await order.save();

  order.refundSummary.totalRefundedAmount =
    order.refundSummary.totalRefundedAmount || 0;

  const remainingRefund =
    order.payment.amount - order.refundSummary.totalRefundedAmount;

  const transactionData = {
    userId: order.userId,
    amount: remainingRefund,
    orderNumber: order.orderNumber,
    status: "cancelled",
  };

  console.log("The transction data for cencellation is : ", transactionData);

  await userWalletServices.addRefundToWallet(transactionData);

  order.refundSummary.totalRefundedAmount = order.payment.amount;
};

export const cancelSpecificOrderItem = async (
  orderId,
  itemId,
  reason,
  isEntireCancel,
) => {
  console.log("Order id is : ", orderId);

  const order = await Order.findById(orderId);

  if (order.payment.status != "paid")
    throw new Error("The payment isn't done for the order");

  console.log("order from service is : ", order);

  const item = order.items.id(itemId);

  if (item.status == "cancelled") return;

  if (statusTransitions[item.status].includes("cancelled")) {
    item.status = "cancelled";
    item.statusChangeReason = reason;

    const allItemsCancelled =
      order.items.length > 0 &&
      order.items.every((item) => item.status === "cancelled");

    if (allItemsCancelled && !isEntireCancel) {
      order.orderStatus = "cancelled";
      order.statusChangeReason = "All items cancelled individually";
    }
  } else {
    throw new Error("Invalid status");
  }

  await changeProductStock(
    item.product.productId,
    item.product.variantId,
    item.quantity,
    "increase",
  );

  if (!isEntireCancel) {
    const transactionData = {
      userId: order.userId,
      amount: item.product.discountedPrice * item.quantity,
      orderNumber: order.orderNumber,
      status: "cancelled",
      itemName: item.product.name,
    };

    console.log("Refunded");
    await userWalletServices.addRefundToWallet(transactionData);

    order.refundSummary.totalRefundedAmount +=
      item.product.discountedPrice * item.quantity;
  }

  await order.save();
};

export const returnEntireOrder = async (orderId, reason) => {
  const order = await Order.findById(orderId);

  if (!order) throw new Error("Order not found");

  const availableTransitions = statusTransitions[order.orderStatus];

  if (!availableTransitions?.includes("returned")) {
    throw new Error("Can't return the order because it's not delivered");
  }

  order.items.forEach((item) => {
    const itemTransitions = statusTransitions[item.status];

    if (itemTransitions?.includes("returned")) {
      item.returnStatus = "requested";
      item.statusChangeReason = reason; // reusing field for return reason
    }
  });

  // update order status
  order.returnStatus = "requested";
  order.statusChangeReason = reason;

  await order.save();
};

export const returnSpecificOrderItem = async (orderId, itemId, reason) => {
  const order = await Order.findById(orderId);

  if (!order) throw new Error("Order not found");

  const item = order.items.id(itemId);

  if (statusTransitions[item.status].includes("returned")) {
    item.returnStatus = "requested";
    item.statusChangeReason = reason;

    const allItemsReturned =
      order.items.length > 0 &&
      order.items.every(
        (item) =>
          item.status === "returned" ||
          item.status === "cancelled" ||
          item.returnStatus === "requested",
      );

    if (allItemsReturned) {
      order.statusChangeReason =
        order.items.length == 1 ? reason : "All items returned or cancelled";
    }
  } else {
    throw new Error("Invalid status for return");
  }

  await order.save();
};

export const updatePaymentStatus = async (
  orderId,
  status,
  transactionId,
  reason,
) => {
  console.log("Reached ststaus updater");

  const order = await Order.findById(orderId);

  console.log("order from pdate paymenet staustus  ", order);
  order.payment.status = status;

  if (reason) order.payment.failureReason = reason;
  else if (transactionId) order.payment.transactionId = transactionId;

  order.save();
};

export const updateStockOnPaymentFailure = async (orderId) => {
  const order = await Order.findById(orderId);

  for (let item of order.items) {
    await changeProductStock(
      item.product.productId,
      item.product.variantId,
      item.quantity,
      "increase",
    );
  }
};

export const retryOrderPayment = async (orderId, userId) => {
  const order = await Order.findById(orderId);

  // if (order.userId != userId) throw new Error("This order is not this users");

  if (order.payment.status == "paid")
    throw new Error("Order amount is already paid");

  const paymentMethod = order.payment.method;

  const amount = order.totalAmount;

  if (paymentMethod == "razorpay") {
    const razorpayOrder = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: order.orderNumber,
    });

    return {
      razorpay: true,
      orderId: order._id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      key: process.env.RAZORPAY_KEY_ID,
    };
  }
};
