import Product from "../models/products.model.js";

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

  if (sortBy == "price_asc") sort = { firstVariantPrice: 1 };
  if (sortBy == "price_desc") sort = { firstVariantPrice: -1 };
  if (sortBy == "popular") sort = { sold: -1 };

  const skip = (page - 1) * limit >= 0 ? (page - 1) * limit : 0;

  const priceConditions = [];

  //Chck whether max or min price exist

  if (minPrice)
    priceConditions.push({
      $gt: [{ $arrayElemAt: ["$variants.price", 0] }, minPrice],
    });

  if (maxPrice)
    priceConditions.push({
      $lt: [{ $arrayElemAt: ["$variants.price", 0] }, maxPrice],
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
        firstVariantPrice: { $arrayElemAt: ["$variants.price", 0] },
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
