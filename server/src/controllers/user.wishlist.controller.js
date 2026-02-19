import * as userWishListServices from "../services/user.wishlist.services.js";

export const wishlistPage = async (req, res) => {
  try {
    const wishlistItems = await userWishListServices.getWishlistItems(
      req.user._id,
    );

    console.log(wishlistItems);

    res.render("user/wishlist", {
      wishlistItems,
      pageTitle: "My Wishlist",
    });
  } catch (err) {
    console.log(err);
    res.status(500).render("500");
  }
};

export const addToWishList = async (req, res) => {
  try {
    req.body.quantity = Number(req.body.quantity);
    await userWishListServices.addProductToWishListService(
      req.body,
      req.user._id,
    );

    res.status(200).json({ message: "Added to wishList successfully" });
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err.message });
  }
};

export const removeWishlistItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    await userWishListServices.removeProductFromWishlistService(
      req.user._id,
      itemId,
    );

    res.status(200).json({
      message: "Item removed from wishlist",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to remove item" });
  }
};
