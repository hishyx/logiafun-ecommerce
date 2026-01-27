import mongoose from "mongoose";

const tempUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, sparse: true },
    password: { type: String, required: true }, // already hashed
  },
  { timestamps: true },
);

// Optional TTL cleanup after 24h
tempUserSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 });

const TempUser = mongoose.model("TempUser", tempUserSchema);

export default TempUser;
