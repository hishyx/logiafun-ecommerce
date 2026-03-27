import Cart from "../models/cart.model.js";
import Product from "../models/products.model.js";
import { checkProductAvailability } from "./user.product.services.js";
import { StringIdToObjectId } from "../utils/convert.to.objectId.js";
import AppError from "../utils/app.error.js";
import { getHighestOffer } from "./admin/admin.offer.services.js";

const buildCartItemKey = (item) =>
  `${item.productId.toString()}:${item.variantId.toString()}`;

const mergeCartItems = (items = []) => {
  const mergedItems = new Map();

  for (const item of items) {
    const key = buildCartItemKey(item);
    const existingItem = mergedItems.get(key);

    if (existingItem) {
      existingItem.quantity += Number(item.quantity) || 0;
      continue;
    }

    mergedItems.set(key, {
      productId: item.productId,
      variantId: item.variantId,
      quantity: Number(item.quantity) || 0,
    });
  }

  return Array.from(mergedItems.values());
};

const normalizeUserCart = async (userId) => {
  const carts = await Cart.find({ userId }).sort({ createdAt: 1 });

  if (carts.length === 0) return null;

  const [primaryCart, ...extraCarts] = carts;
  const mergedItems = mergeCartItems(carts.flatMap((cart) => cart.items));

  const needsPrimaryUpdate =
    extraCarts.length > 0 ||
    primaryCart.items.length !== mergedItems.length ||
    primaryCart.items.some((item, index) => {
      const mergedItem = mergedItems[index];

      if (!mergedItem) return true;

      return (
        item.productId.toString() !== mergedItem.productId.toString() ||
        item.variantId.toString() !== mergedItem.variantId.toString() ||
        Number(item.quantity) !== Number(mergedItem.quantity)
      );
    });

  if (needsPrimaryUpdate) {
    primaryCart.items = mergedItems;
    await primaryCart.save();
  }

  if (extraCarts.length > 0) {
    await Cart.deleteMany({
      _id: { $in: extraCarts.map((cart) => cart._id) },
    });
  }

  return primaryCart;
};

export const addProductToCartService = async (productData, userId) => {
  console.log(productData);
  const validProduct = await checkProductAvailability(productData.productId);

  if (!validProduct) throw new Error("product not found or blocked");

  const normalizedProduct = {
    productId: StringIdToObjectId(productData.productId),
    variantId: StringIdToObjectId(productData.variantId),
    quantity: Number(productData.quantity) || 1,
  };

  if (normalizedProduct.quantity < 1)
    throw new Error("Quantity must be at least 1");

  await normalizeUserCart(userId);

  const incrementExistingItemResult = await Cart.updateOne(
    {
      userId,
      "items.productId": normalizedProduct.productId,
      "items.variantId": normalizedProduct.variantId,
    },
    {
      $inc: {
        "items.$.quantity": normalizedProduct.quantity,
      },
    },
  );

  if (incrementExistingItemResult.modifiedCount > 0) {
    await normalizeUserCart(userId);
    return;
  }

  const pushNewItemResult = await Cart.updateOne(
    {
      userId,
      items: {
        $not: {
          $elemMatch: {
            productId: normalizedProduct.productId,
            variantId: normalizedProduct.variantId,
          },
        },
      },
    },
    {
      $push: {
        items: normalizedProduct,
      },
    },
  );

  if (pushNewItemResult.modifiedCount > 0) {
    await normalizeUserCart(userId);
    return;
  }

  try {
    await Cart.create({
      userId,
      items: [normalizedProduct],
    });
  } catch (error) {
    if (error?.code !== 11000) throw error;

    const retryIncrementResult = await Cart.updateOne(
      {
        userId,
        "items.productId": normalizedProduct.productId,
        "items.variantId": normalizedProduct.variantId,
      },
      {
        $inc: {
          "items.$.quantity": normalizedProduct.quantity,
        },
      },
    );

    if (retryIncrementResult.modifiedCount === 0) {
      await Cart.updateOne(
        {
          userId,
          items: {
            $not: {
              $elemMatch: {
                productId: normalizedProduct.productId,
                variantId: normalizedProduct.variantId,
              },
            },
          },
        },
        {
          $push: {
            items: normalizedProduct,
          },
        },
      );
    }
  }

  await normalizeUserCart(userId);
};

export const getCartItems = async (userId, isOrder) => {
  await normalizeUserCart(userId);

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
  ]);

  //Prevnt if discount is null

  if (!cart.length) return [[], {}];

  const calculations = {
    subtotal: 0,
    discount: 0,
    total: 0,
  };

  for (let item of cart) {
    console.log("The real item of cart is : ", item);

    item.discount = await getHighestOffer(
      item.items.productId,
      item.category._id,
      Number(item.product.discount) || 0,
    );

    console.log("item.discount is : ", item.discount);

    const originalPrice = item.product.variants.price;

    const discountedPrice = originalPrice * (1 - item.discount / 100);

    item.discountedPrice = discountedPrice;

    const finalPrice = discountedPrice;

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

    //Calculations

    calculations.subtotal += finalPrice * quantity;

    calculations.discount = 0;
  }

  calculations.subtotal = Math.round(calculations.subtotal);

  calculations.gst = Math.round(calculations.subtotal * 0.18);

  calculations.shipping = calculations.subtotal >= 1000 ? 0 : 80;

  calculations.total =
    calculations.subtotal + calculations.gst + calculations.shipping;

  const cartItems = cart;

  console.log("Cart items is : { ", cartItems);

  return [cartItems, calculations];
};

export const getCartCount = async (userId) => {
  await normalizeUserCart(userId);
  const cart = await Cart.findOne({ userId });
  if (cart) return cart.items.length;
};

export const removeItemFromCart = async (userId, itemId) => {
  await normalizeUserCart(userId);

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
  await normalizeUserCart(userId);

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
  console.log("Iam gonna log isorder her");
  console.log("isOrder is ,", isOrder);
  const [cartItems, calculations] = await getCartItems(userId, isOrder);

  console.log("An erro occured broiiii");

  const availableCartItems = cartItems.filter(
    (item) =>
      item.product.isActive &&
      item.category.isActive &&
      item.product.variants.stock != 0,
  );

  return [availableCartItems, calculations];
};
