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
      if (coupon.discountType == "fixed") {
        amounts.total -= coupon.discountValue;
        couponDiscountAmount = coupon.discountValue;
      }

      // Increment coupon used count
      await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } });
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

export const getAllOrders = async (userId) => {
  return await Order.find({ userId });
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

  const transactionData = {
    userId: order.userId,
    amount: order.totalAmount,
    orderNumber: order.orderNumber,
    status: "cancelled",
  };

  console.log("The transction data for cencellation is : ", transactionData);

  await userWalletServices.addRefundToWallet(transactionData);
};

export const cancelSpecificOrderItem = async (
  orderId,
  itemId,
  reason,
  isEntireCancel,
) => {
  console.log("Order id is : ", orderId);

  const order = await Order.findById(orderId);

  console.log("order from service is : ", order);

  const item = order.items.id(itemId);

  if (statusTransitions[item.status].includes("cancelled")) {
    item.status = "cancelled";
    item.statusChangeReason = reason;

    const allItemsCancelled =
      order.items.length > 0 &&
      order.items.every((item) => item.status === "cancelled");

    if (allItemsCancelled) {
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
    await userWalletServices.addRefundToWallet(transactionData);
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

export const updatePaymentStatus = async (orderId, status, transactionId) => {
  console.log("Reached ststaus updater");
  await Order.findByIdAndUpdate(orderId, {
    "payment.status": status,
    "payment.transactionId": transactionId,
  });
};
