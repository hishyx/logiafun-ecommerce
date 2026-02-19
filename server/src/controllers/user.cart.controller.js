import * as userCartServices from "../services/user.cart.services.js";

export const addToCart = async (req, res) => {
  try {
    req.body.quantity = Number(req.body.quantity);
    await userCartServices.addProductToCartService(req.body, req.user._id);

    const cartCount = await userCartServices.getCartCount(req.user._id);

    res.status(200).json({ message: "Added to cart successfully", cartCount });
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err.message });
  }
};

export const cartPage = async (req, res) => {
  try {
    const [cartItems, calculations] = await userCartServices.getCartItems(
      req.user._id,
    );

    console.log("cartItems is : ", cartItems);
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
      .status(200)
      .json({ message: "Item removed", cartCount, calculations });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to remove item" });
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
      Number(quantity)
    );

    res.status(200).json({
      message: "Cart updated successfully",
      calculations,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err.message });
  }
};

