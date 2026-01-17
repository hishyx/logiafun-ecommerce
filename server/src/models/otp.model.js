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
});

const OTP = mongoose.model("OTP", OTPSchema);

export default OTP;
