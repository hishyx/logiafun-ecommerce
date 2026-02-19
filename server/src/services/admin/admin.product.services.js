import Product from "../../models/products.model.js";
import uploadImageToCloudinary from "../../utils/cloudinary.upload.js";
import cloudinaryFolders from "../../components/cloudinary.folders.js";

export const getAllProducts = async ({ page, limit, sort, search, filter }) => {
  page = parseInt(page);
  limit = parseInt(limit);

  const skip = (page - 1) * limit;

  // Search by product name
  const query = {
    name: { $regex: search, $options: "i" },
  };

  // Filter by status
  if (filter === "active") query.isActive = true;
  if (filter === "blocked") query.isActive = false;

  // Sorting options
  let sortQuery = { createdAt: -1 };

  if (sort === "oldest") sortQuery = { createdAt: 1 };
  if (sort === "name_asc") sortQuery = { name: 1 };
  if (sort === "name_desc") sortQuery = { name: -1 };
  // if (sort === "price_asc") sortQuery = { price: 1 };
  // if (sort === "price_desc") sortQuery = { price: -1 };

  const result = await Product.aggregate([
    { $match: query },

    {
      $facet: {
        products: [
          { $sort: sortQuery },
          { $skip: skip },
          { $limit: limit },

          {
            $lookup: {
              from: "categories",
              localField: "categoryId",
              foreignField: "_id",
              as: "category",
            },
          },
          {
            $unwind: {
              path: "$category",
              preserveNullAndEmptyArrays: true,
            },
          },
        ],

        total: [{ $count: "count" }],
      },
    },
  ]);

  const products = result[0].products;
  const total = result[0].total[0]?.count || 0;

  return {
    products,
    total,
  };
};

export const createProduct = async (productData, productImages) => {
  //Combining the product images with the productData

  productData.variants.forEach((variant) => {
    variant.images = [];
  });

  for (let image of productImages) {
    const index = image.fieldname.split("[")[1].split("]")[0];

    productData.variants[index].images.push(
      await uploadImageToCloudinary(image, cloudinaryFolders.PRODUCT),
    );
  }

  console.log(productData);

  productData.variants.forEach((variant) => {
    variant.price = Number(variant.price);
    variant.stock = Number(variant.stock);
  });

  productData.variants = productData.variants.map((v) => ({
    price: Number(v.price),
    stock: Number(v.stock),
    attributes: { ...v.values }, // 👈 THIS FIX
    images: v.images,
  }));

  // VALIDATION: Check each variant before creation
  productData.variants.forEach((v, index) => {
    if (v.price <= 0) {
      throw new Error(`Variant ${index + 1}: Price must be greater than 0`);
    }
    if (v.stock < 0) {
      throw new Error(`Variant ${index + 1}: Stock cannot be negative`);
    }
    if (!v.images || v.images.length < 3) {
      throw new Error(`Variant ${index + 1}: Must have at least 3 images`);
    }
  });

  const newProduct = await Product.create(productData);

  return newProduct;
};

export const updateProduct = async (productData, productImages) => {
  console.log("The product data is : [] \n ", productData, "\n ]");
  const product = await Product.findById(productData.id);

  if (!product) {
    throw new Error("Product not found");
  }

  product.name = productData.name;
  product.categoryId = productData.categoryId;
  product.description = productData.description;
  product.attributes = productData.attributes || [];
  product.discount = productData.discount;

  const updatedVariants = [];

  for (const incoming of productData.variants) {
    let existingVariant = null;

    if (incoming._id) {
      existingVariant = product.variants.id(incoming._id);
    }

    const oldImages = existingVariant?.images || [];
    let finalImages = [...oldImages];

    if (incoming.deletedImages) {
      const deleted = Array.isArray(incoming.deletedImages)
        ? incoming.deletedImages
        : [incoming.deletedImages];

      finalImages = finalImages.filter((img) => !deleted.includes(img));
    }

    updatedVariants.push({
      _id: incoming._id, // preserve id
      price: Number(incoming.price),
      stock: Number(incoming.stock),
      attributes: { ...incoming.values },
      images: finalImages,
    });
  }

  // 2️ Add newly uploaded images
  // 2️⃣ Add newly uploaded images safely
  if (productImages && productImages.length > 0) {
    for (const file of productImages) {
      const match = file.fieldname.match(/variants\[(\d+)\]/);
      if (!match) continue;

      const index = parseInt(match[1]);
      if (!updatedVariants[index]) continue;

      const imageUrl = await uploadImageToCloudinary(file);

      updatedVariants[index].images.push(imageUrl);
    }
  }

  updatedVariants.forEach((variant, i) => {
    console.log(`Variant ${i + 1} final images count:`, variant.images?.length);
  });

  // Validate Variants
  updatedVariants.forEach((variant, i) => {
    // 1. Validate Price
    if (variant.price <= 0) {
      throw new Error(`Variant ${i + 1}: Price must be greater than 0`);
    }

    // 2. Validate Stock
    if (variant.stock < 0) {
      throw new Error(`Variant ${i + 1}: Stock cannot be negative`);
    }

    // 3. Validate Images (Min 3)
    if (!variant.images || variant.images.length < 3) {
      throw new Error(`Variant ${i + 1} must have at least 3 images`);
    }
  });

  product.variants = updatedVariants;

  await product.save();

  return product;
};

export const toggleListUnlistProduct = async (productId) => {
  const product = await Product.findById(productId);

  if (!product) throw new Error("Product not found");

  product.isActive = product.isActive ? false : true;
  await product.save();

  return product;
};
