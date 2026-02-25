import Order from "../models/order.model.js";
import { getAvailableCartItems, deleteAllItems } from "./user.cart.services.js";
import {
  generateCheckoutId,
  generateOrderNumber,
} from "../utils/order.helper.js";

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
