import Category from "../models/categories.model.js";
import Product from "../models/products.model.js";
import mongoose from "mongoose";

//Helper function for valid Product checking

export const checkProductAvailability = async (productId) => {
  productId = new mongoose.Types.ObjectId(productId);
  const result = await Product.aggregate([
    {
      $match: {
        _id: productId,
        isActive: true,
      },
    },
    {
      $lookup: {
        from: "categories",
        localField: "categoryId",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: "$category" },
    {
      $match: {
        "category.isActive": true,
      },
    },
  ]);

  return result[0];
};

export const getAllProducts = async ({
  search,
  page,
  limit,
  categoryIds,
  minPrice,
  maxPrice,
  sortBy,
}) => {
  //Sorting works

  let sort = { createdAt: -1 };

  if (sortBy == "price_asc") sort = { discountedPrice: 1 };
  if (sortBy == "price_desc") sort = { discountedPrice: -1 };
  if (sortBy == "popular") sort = { sold: -1 };

  const skip = (page - 1) * limit >= 0 ? (page - 1) * limit : 0;

  const priceConditions = [];

  //Chck whether max or min price exist

  if (minPrice)
    priceConditions.push({
      $gt: [
        {
          $round: [
            {
              $multiply: [
                { $arrayElemAt: ["$variants.price", 0] },
                { $subtract: [1, { $divide: ["$discount", 100] }] },
              ],
            },
            0,
          ],
        },
        minPrice,
      ],
    });

  if (maxPrice)
    priceConditions.push({
      $lt: [
        {
          $round: [
            {
              $multiply: [
                { $arrayElemAt: ["$variants.price", 0] },
                { $subtract: [1, { $divide: ["$discount", 100] }] },
              ],
            },
            0,
          ],
        },
        maxPrice,
      ],
    });

  const match = {
    isActive: true,
    name: { $regex: search || "", $options: "i" },
    $expr: {
      $and: priceConditions,
    },
  };

  // Check id there is any category selection

  if (categoryIds.length > 0) match.categoryId = { $in: categoryIds };

  const result = await Product.aggregate([
    {
      $match: match,
    },
    {
      $addFields: {
        discountedPrice: {
          $round: [
            {
              $multiply: [
                { $arrayElemAt: ["$variants.price", 0] },
                {
                  $subtract: [
                    1,
                    {
                      $divide: [{ $ifNull: ["$discount", 0] }, 100],
                    },
                  ],
                },
              ],
            },
            0,
          ],
        },
      },
    },
    { $sort: sort },
    {
      $lookup: {
        from: "categories",
        localField: "categoryId",
        foreignField: "_id",
        as: "category",
      },
    },
    {
      $unwind: "$category",
    },
    {
      $match: {
        "category.isActive": true,
      },
    },
    {
      $facet: {
        products: [{ $skip: skip }, { $limit: limit }],
        count: [{ $count: "total" }],
      },
    },
  ]);

  const products = result[0].products;
  const total = result[0].count[0]?.total || 0;

  console.log(result);

  return {
    products,
    total,
  };
};

export const getProductDetails = async (productId) => {
  const availableProduct = await checkProductAvailability(productId); // 1st DB call

  console.log("The product is  : ", availableProduct);
  if (!availableProduct) {
    throw new Error("Product not available or got blocked");
  }

  return availableProduct;
};

export const getRelatedProducts = async (categoryId, productId) => {
  const limit = 4;
  const relatedProducts = await Product.aggregate([
    {
      $match: {
        isActive: true,
        categoryId: categoryId,
        _id: { $ne: productId },
      },
    },
    {
      $lookup: {
        from: "categories",
        localField: "categoryId",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: "$category" },
    {
      $match: {
        "category.isActive": true,
      },
    },
    {
      $limit: limit,
    },
  ]);

  return relatedProducts;
};

export const reduceProductStock = async (
  productId,
  variantId,
  soldQuantity,
) => {
  const product = await Product.findById(productId);
  if (!product) throw new Error("Product not found");

  const variant = product.variants.id(variantId);
  if (!variant) throw new Error("Variant not found");

  variant.stock -= soldQuantity;

  await product.save();

  return product;
};
