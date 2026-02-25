import Cart from "../models/cart.model.js";
import Product from "../models/products.model.js";
import { checkProductAvailability } from "./user.product.services.js";
import { StringIdToObjectId } from "../utils/convert.to.objectId.js";
import AppError from "../utils/app.error.js";

export const addProductToCartService = async (productData, userId) => {
  console.log(productData);
  const validProduct = await checkProductAvailability(productData.productId);

  if (!validProduct) throw new Error("product not found or blocked");

  let cart = await Cart.findOne({ userId });

  if (!cart) {
    cart = await Cart.create({
      userId,
      items: [],
    });
  }

  const existingItem = cart.items.find((item) => {
    return (
      item.variantId.toString() === productData.variantId.toString() &&
      item.productId.toString() === productData.productId.toString()
    );
  });

  if (existingItem) {
    existingItem.quantity += productData.quantity;
  } else {
    cart.items.push(productData);
  }

  await cart.save();
};

export const getCartItems = async (userId, isOrder) => {
  console.log("user id is : ", userId);
  const cart = await Cart.aggregate([
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
        discountedPrice: {
          $round: [
            {
              $multiply: [
                "$product.variants.price",
                { $subtract: [1, { $divide: ["$product.discount", 100] }] },
              ],
            },
            0,
          ],
        },
      },
    },
  ]);

  if (!cart) return [];

  const calculations = {
    subtotal: 0,
    discount: 0,
    total: 0,
  };

  for (let item of cart) {
    if (
      item.product.variants.stock == 0 ||
      !item.product.isActive ||
      !item.category.isActive
    )
      continue;

    //Count and quantity check

    item.items.quantityChange = false;

    if (item.items.quantity > item.product.variants.stock) {
      if (isOrder)
        throw new Error(
          "One of the product you have ordered is out of stock pls check again",
        );

      item.items.quantity = item.product.variants.stock;
      item.items.quantityChange = true;

      await Cart.findOneAndUpdate(
        {
          userId,
          "items.productId": item.items.productId,
          "items.variantId": item.items.variantId,
        },
        {
          $set: {
            "items.$.quantity": item.product.variants.stock,
          },
        },
      );
    }

    const quantity = item.items.quantity;
    const originalPrice = item.product.variants.price;
    const finalPrice = item.discountedPrice || originalPrice;

    //Calculations

    calculations.subtotal += Math.round(originalPrice * quantity);
    calculations.total += Math.round(finalPrice * quantity);

    calculations.discount += Math.round(
      (originalPrice - finalPrice) * quantity,
    );
  }

  const cartItems = cart;

  return [cartItems, calculations];
};

export const getCartCount = async (userId) => {
  const cart = await Cart.findOne({ userId });
  if (cart) return cart.items.length;
};

export const removeItemFromCart = async (userId, itemId) => {
  userId = StringIdToObjectId(userId);
  itemId = StringIdToObjectId(itemId);

  console.log("itemId:", itemId);

  console.log("before delteed");

  const deleted = await Cart.findOneAndUpdate(
    { userId },
    { $pull: { items: { _id: itemId } } },
    { new: true },
  );

  console.log("delteed");
};

export const updateCartItemService = async (userId, itemId, newQuantity) => {
  userId = StringIdToObjectId(userId);
  itemId = StringIdToObjectId(itemId);

  if (newQuantity < 1) throw new Error("Quantity must be at least 1");

  const cart = await Cart.findOne({ userId });
  if (!cart) throw new Error("Cart not found");

  const itemIndex = cart.items.findIndex(
    (item) => item._id.toString() === itemId.toString(),
  );

  if (itemIndex === -1) throw new Error("Item not found in cart");

  const item = cart.items[itemIndex];

  // Check stock availability
  const productAvailability = await checkProductAvailability(item.productId);
  if (!productAvailability) throw new Error("Product not available");

  const product = await Product.findById(item.productId);
  const variant = product.variants.id(item.variantId);
  if (variant.stock < newQuantity) {
    throw new AppError("Insufficient stock", 400, {
      newQuantity: variant.stock,
    });
  }

  cart.items[itemIndex].quantity = newQuantity;
  await cart.save();

  // Return new calculations
  const [_, calculations] = await getCartItems(userId);
  return calculations;
};

export const deleteAllItems = async (userId) => {
  console.log("Inside clear all service");

  await Cart.deleteMany({ userId });
};

export const getAvailableCartItems = async (userId, isOrder) => {
  const [cartItems, calculations] = await getCartItems(userId, isOrder);

  console.log(cartItems);

  const availableCartItems = cartItems.filter(
    (item) =>
      item.product.isActive &&
      item.category.isActive &&
      item.product.variants.stock != 0,
  );

  return [availableCartItems, calculations];
};
