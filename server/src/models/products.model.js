import mongoose from "mongoose";

const variantSchema = mongoose.Schema({
  price: {
    type: Number,
    required: true,
  },
  stock: {
    type: Number,
    required: true,
  },
  images: {
    type: [String],
    validate: {
      validator: (v) => v.length >= 0,
      message: "At least 3 image is required",
    },
  },
  attributes: {
    type: Map,
    of: String,
    default: {},
  },
});

const productSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    discount: {
      type: Number,
      required: false,
    },
    attributes: [String],
    ageGroup: {
      type: Number,
      required: true,
      default: 0,
    },
    sold: {
      type: Number,
      required: true,
      default: 0,
    },
    rating: {
      type: Number,
      required: true,
      default: 0,
    },
    reviewCount: {
      type: Number,
      required: true,
      default: 0,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    description: {
      type: String,
      required: true,
    },
    variants: [variantSchema],
  },
  { timestamps: true },
);

const Product = mongoose.model("Product", productSchema);

export default Product;
