import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL);

    console.log("Mongo DB connected");
  } catch (err) {
    console.error("Database connection failed:", err);
    process.exit(1);
  }
};

export default connectDB;
