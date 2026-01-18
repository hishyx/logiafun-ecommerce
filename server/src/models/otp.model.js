import mongoose from "mongoose";

const OTPSchema = mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  OTP: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 },
  },
});

const OTP = mongoose.model("OTP", OTPSchema);

export default OTP;
