import Order from "../models/order.model.js";
import { getAvailableCartItems, deleteAllItems } from "./user.cart.services.js";
import {
  generateCheckoutId,
  generateOrderNumber,
} from "../utils/order.helper.js";

import statusTransitions from "../components/order.status.transitions.js";

import { getAddressDetails } from "./user.services.js";

import { reduceProductStock } from "./user.product.services.js";

export const createOrder = async (userId, orderData) => {
  const [orderProducts, amounts] = await getAvailableCartItems(userId, true);

  console.log("orderData.selectedAddress is : ", orderData.selectedAddress);

  const orderAddress = await getAddressDetails(
    userId,
    orderData.selectedAddress,
  );

  const paymentMethod = orderData.paymentMethod;

  const checkoutId = generateCheckoutId();

  const items = [];

  for (const orderProduct of orderProducts) {
    const originalPrice = orderProduct?.product?.variants?.price;
    const discountPercent = orderProduct.discount || 0;

    const currentPrice = Math.round(
      originalPrice * (1 - discountPercent / 100),
    );

    const productId = orderProduct?.items?.productId;
    const variantId = orderProduct?.items?.variantId;
    const quantity = Number(orderProduct?.items?.quantity);

    items.push({
      product: {
        productId,
        variantId,
        name: orderProduct?.product?.name,
        image: orderProduct?.product?.variants?.images[0],
        originalPrice,
        discountPercent,
        price: currentPrice,
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

    await reduceProductStock(productId, variantId, quantity);
  }

  const newOrder = await Order.create({
    orderNumber: generateOrderNumber(),
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

  console.log("order done");

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

  console.log("Order result:", order);

  return order;
};

export const cancelEntireOrder = async (orderId, reason) => {
  const order = await Order.findById(orderId);

  if (!order) throw new Error("Order not found");

  const availableTransitions = statusTransitions[order.orderStatus];

  if (!availableTransitions?.includes("cancelled")) {
    throw new Error("Can't change the status because it's invalid");
  }

  order.items.forEach((item) => {
    const itemTransitions = statusTransitions[item.status];

    if (itemTransitions?.includes("cancelled")) {
      item.status = "cancelled";
      item.statusChangeReason = reason;
    }
  });

  // update order status
  order.orderStatus = "cancelled";
  order.statusChangeReason = reason;

  await order.save();
};

export const cancelSpecificOrderItem = async (orderId, itemId, reason) => {
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
