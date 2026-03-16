import Category from "../models/categories.model.js";
import Product from "../models/products.model.js";
import mongoose from "mongoose";
import { getHighestOffer } from "./admin/admin.offer.services.js";

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

    // category join
    {
      $lookup: {
        from: "categories",
        localField: "categoryId",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: "$category" },

    // category must be active
    {
      $match: {
        "category.isActive": true,
      },
    },

    // remove variants with stock = 0
    {
      $addFields: {
        variants: {
          $filter: {
            input: "$variants",
            as: "variant",
            cond: { $gt: ["$$variant.stock", 0] },
          },
        },
      },
    },

    //  ensure at least one variant remains
    {
      $match: {
        "variants.0": { $exists: true },
      },
    },
  ]);

  return result[0] || null;
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
      $match: {
        variants: { $elemMatch: { stock: { $gt: 0 } } },
      },
    },

    {
      $lookup: {
        from: "offers",
        let: {
          productId: "$_id",
          categoryId: "$categoryId",
          productDiscount: { $ifNull: ["$discount", 0] },
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $in: ["$targetId", ["$$productId", "$$categoryId"]],
              },
            },
          },
          {
            $group: {
              _id: null,
              dbMax: { $max: "$discountValue" },
            },
          },
          {
            $project: {
              finalDiscount: {
                $max: ["$dbMax", "$$productDiscount"],
              },
            },
          },
        ],
        as: "offer",
      },
    },
    {
      $addFields: {
        finalDiscount: {
          $ifNull: [
            { $arrayElemAt: ["$offer.finalDiscount", 0] },
            { $ifNull: ["$discount", 0] },
          ],
        },
      },
    },
    {
      $addFields: {
        discountedPrice: {
          $round: [
            {
              $multiply: [
                { $arrayElemAt: ["$variants.price", 0] },
                { $subtract: [1, { $divide: ["$finalDiscount", 100] }] },
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
      $addFields: {
        variants: {
          $filter: {
            input: "$variants",
            as: "variant",
            cond: { $gt: ["$$variant.stock", 0] },
          },
        },
      },
    },

    //  ensure at least one variant remains
    {
      $match: {
        "variants.0": { $exists: true },
      },
    },
    {
      $project: {
        offer: 0,
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

  console.log("Here it is ");

  console.log(result);

  return {
    products,
    total,
  };
};

export const getProductDetails = async (productId) => {
  const product = await checkProductAvailability(productId);

  console.log("product is ", product);

  if (!product) {
    throw new Error("Product not available or got blocked");
  }

  const defaultVariant =
    product.variants?.find((v) => v.stock > 0) || product.variants?.[0] || null;

  const basePrice = defaultVariant?.price || 0;

  const finalDiscount = await getHighestOffer(
    product._id,
    product.categoryId,
    Number(product.discount) || 0,
  );

  const finalPrice = Math.round(basePrice * (1 - finalDiscount / 100));

  const variantMap = {};

  (product.attributes || []).forEach((attr) => {
    variantMap[attr] = [
      ...new Set(
        (product.variants || [])
          .map((v) => v.attributes?.[attr])
          .filter(Boolean),
      ),
    ].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  });

  console.log("Reached end");

  return {
    ...product,
    defaultVariant,
    finalDiscount,
    hasDiscount: finalDiscount > 0,
    originalPrice: basePrice,
    finalPrice,
    variantMap,
    inStock: (product.variants || []).some((v) => v.stock > 0),
  };
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
      $addFields: {
        variants: {
          $filter: {
            input: "$variants",
            as: "variant",
            cond: { $gt: ["$$variant.stock", 0] },
          },
        },
      },
    },

    //  ensure at least one variant remains
    {
      $match: {
        "variants.0": { $exists: true },
      },
    },
    {
      $limit: limit,
    },
  ]);

  return relatedProducts;
};

export const changeProductStock = async (
  productId,
  variantId,
  quantity,
  type,
) => {
  const product = await Product.findById(productId);
  if (!product) throw new Error("Product not found");

  const variant = product.variants.id(variantId);
  if (!variant) throw new Error("Variant not found");

  if (type == "decrease") variant.stock -= quantity;
  else if (type == "increase") variant.stock += quantity;

  await product.save();

  return product;
};

export const getProductVariantDetails = async (productId, variantId) => {
  const product = await Product.findOne(
    {
      _id: productId,
      "variants._id": variantId,
    },
    {
      "variants.$": 1,
    },
  );

  const variant = product.variants[0];

  if (!product) throw new Error("No product Found");

  console.log(variant);

  const variantName = [...variant.attributes.entries()]
    .map(([key, value]) => `${key} - ${value}`)
    .join("/ ");

  return { variantName };
};
