import Order from "../../models/order.model.js";
import statusTransitions from "../../components/order.status.transitions.js";

export const getAllOrders = async () => {
  const orders = await Order.find({});

  return orders;
};

export const changeAdminOrderStatusService = async (orderId, newStatus) => {
  const order = await Order.findById(orderId);

  const availableTransitions = statusTransitions[order.orderStatus];

  if (!availableTransitions.includes(newStatus))
    throw new Error("Can't change the status bcz its invalid");

  order.orderStatus = newStatus;

  await order.save();
};
