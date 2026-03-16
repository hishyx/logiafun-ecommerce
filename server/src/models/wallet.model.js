import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["credit", "debit"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    orderNumber: {
      type: String,
      ref: "Order",
      required: false,
    },
    itemName: {
      type: String,
      ref: "Order",
      required: false,
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "success",
      required: true,
    },
  },
  { timestamps: true },
);

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // One wallet per user
    },
    balance: {
      type: Number,
      default: 0,
      required: true,
      min: 0,
    },
    transactions: [transactionSchema],
  },
  { timestamps: true },
);

const Wallet = mongoose.model("Wallet", walletSchema);

export default Wallet;
