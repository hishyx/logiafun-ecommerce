import mongoose from "mongoose";

const productSnapshotSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Variant",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
  },
  { _id: false },
);

const addressSchema = new mongoose.Schema(
  {
    addressName: String,
    name: String,
    phone: String,
    street: String,
    city: String,
    pincode: String,
  },
  { _id: false },
);

const paymentSchema = new mongoose.Schema(
  {
    method: String,
    transactionId: String,
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
  },
  { _id: false },
);

const shippingSchema = new mongoose.Schema(
  {
    trackingNumber: String,
    carrier: String,
    shippedAt: Date,
    deliveredAt: Date,
  },
  { _id: false },
);

const orderItemSchema = new mongoose.Schema(
  {
    product: productSnapshotSchema,

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "shipped",
        "in_transit",
        "delivered",
        "cancelled",
        "returned",
      ],
      default: "pending",
      index: true,
    },

    shipping: shippingSchema,
  },
  { _id: true },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    checkoutId: {
      type: String,
      required: true,
      index: true,
    },
    orderStatus: {
      type: String,
      enum: [
        "pending",
        "processing",
        "shipped",
        "in_transit",
        "delivered",
        "cancelled",
        "returned",
      ],
      default: "pending",
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    items: {
      type: [orderItemSchema],
      required: true,
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    payment: paymentSchema,

    address: addressSchema,
  },
  { timestamps: true },
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
