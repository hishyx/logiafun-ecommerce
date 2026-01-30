import mongoose from "mongoose";

const OTPSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "TempUser",
    },

    OTP: {
      type: String,
      required: true,
    },

    purpose: {
      type: String,
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL
    },

    attempts: {
      type: Number,
      default: 0,
    },
    resendAttempts: {
      type: Number,
      default: 0,
    },

    lastResentAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// Prevent duplicate OTPs for same temp user + purpose
OTPSchema.index(
  { userId: 1, purpose: 1 },
  {
    unique: true,
    partialFilterExpression: { userId: { $exists: true } },
  },
);

const OTP = mongoose.model("OTP", OTPSchema);

export default OTP;
