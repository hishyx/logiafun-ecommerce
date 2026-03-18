import * as userCartServices from "../services/user.cart.services.js";
import { getProductVariantDetails } from "../services/user.product.services.js";
import * as statusCodes from "../constants/statusCodes.js";
import * as messages from "../constants/messages.js";

export const addToCart = async (req, res) => {
  try {
    if (!req.user || !req.user._id)
      throw new Error("Please login to add items to cart");

    req.body.quantity = Number(req.body.quantity);

    await userCartServices.addProductToCartService(req.body, req.user._id);

    const cartCount = await userCartServices.getCartCount(req.user._id);

    res.status(statusCodes.OK).json({ message: "Added to cart successfully", cartCount });
  } catch (err) {
    console.log(err);
    res.status(statusCodes.BAD_REQUEST).json({ message: err.message });
  }
};

export const cartPage = async (req, res) => {
  try {
    let cartItems;
    let calculations;

    if (req.user && req.user._id) {
      [cartItems, calculations] = await userCartServices.getCartItems(
        req.user._id,
      );

      for (const item of cartItems) {
        const { variantName } = await getProductVariantDetails(
          item.product._id,
          item.product.variants._id,
        );
        item.product.variantName = variantName;
      }
    } else cartItems = [];

    console.log("Cart items is : { ", cartItems);

    res.render("user/cart", { cartItems, calculations });
  } catch (err) {
    console.log(err);
  }
};

export const deleteCartItem = async (req, res) => {
  try {
    const itemId = req.params.itemId || "";
    const userId = req.user._id;

    await userCartServices.removeItemFromCart(userId, itemId);

    const [_, calculations] = await userCartServices.getCartItems(userId);
    const cartCount = await userCartServices.getCartCount(userId);

    return res
      .status(statusCodes.OK)
      .json({ message: "Item removed", cartCount, calculations });
  } catch (err) {
    console.log(err);
    res.status(statusCodes.INTERNAL_SERVER_ERROR).json({ message: messages.WISHLIST_REMOVE_FAIL });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const userId = req.user._id;

    const calculations = await userCartServices.updateCartItemService(
      userId,
      itemId,
      Number(quantity),
    );

    res.status(statusCodes.OK).json({
      message: "Cart updated successfully",
      calculations,
    });
  } catch (err) {
    console.log(err);
    res
      .status(statusCodes.BAD_REQUEST)
      .json({ message: err.message, newQuantity: err.newQuantity });
  }
};

export const clearAllItems = async (req, res) => {
  try {
    console.log("Inside clear all controller");
    await userCartServices.deleteAllItems(req.user._id);

    console.log("delted");

    res.sendStatus(statusCodes.OK);
  } catch (err) {
    console.log(err);
  }
};
