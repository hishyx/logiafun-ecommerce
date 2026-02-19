import Wishlist from "../models/wishlist.model.js";
import { checkProductAvailability } from "./user.product.services.js";

export const addProductToWishListService = async (productData, userId) => {
  const validProduct = await checkProductAvailability(productData.productId);

  if (!validProduct) throw new Error("Product not found or blocked");

  let wishlist = await Wishlist.findOne({ userId });

  if (!wishlist) {
    wishlist = await Wishlist.create({
      userId,
      items: [],
    });
  }

  // Check if item already exists
  const existingItem = wishlist.items.find((item) => {
    return (
      item.variantId.toString() === productData.variantId.toString() &&
      item.productId.toString() === productData.productId.toString()
    );
  });

  if (existingItem) {
    throw new Error("Product already in wishlist");
  } else {
    wishlist.items.push({
      productId: productData.productId,
      variantId: productData.variantId,
    });
  }

  await wishlist.save();
};

export const getWishlistItems = async (userId) => {
  const wishlist = await Wishlist.aggregate([
    {
      $match: {
        userId: userId,
      },
    },

    { $unwind: "$items" },

    {
      $lookup: {
        from: "products",
        localField: "items.productId",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },

    {
      $lookup: {
        from: "categories",
        localField: "product.categoryId",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: "$category" },

    { $unwind: "$product.variants" },

    {
      $match: {
        $expr: {
          $eq: ["$items.variantId", "$product.variants._id"],
        },
      },
    },

    {
      $addFields: {
        "items.name": "$product.name",
        "items.price": "$product.variants.price",
        "items.image": { $arrayElemAt: ["$product.variants.images", 0] },
        "items.variantId": "$product.variants._id", // ✅ ADD THIS
        "items._id": "$items._id",
        "items.product_id": "$product._id",
        "items.slug": "$product.slug",
      },
    },

    {
      $project: {
        _id: "$items._id",
        name: "$product.name",
        price: "$product.variants.price",
        image: { $arrayElemAt: ["$product.variants.images", 0] },
        productId: "$product._id",
        variantId: "$product.variants._id", // ✅ RETURN IT
        stock: "$product.variants.stock",
      },
    },
  ]);

  return wishlist || [];
};

export const removeProductFromWishlistService = async (userId, itemId) => {
  const result = await Wishlist.findOneAndUpdate(
    { userId },
    { $pull: { items: { _id: itemId } } },
    { new: true },
  );
  return result;
};
