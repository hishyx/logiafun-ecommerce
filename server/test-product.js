import mongoose from 'mongoose';
import Product from './src/models/products.model.js';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  const prod = await Product.findOne().lean();
  console.log(JSON.stringify(prod, null, 2));
  mongoose.disconnect();
}
test();
