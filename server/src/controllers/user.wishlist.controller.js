import * as userWishListServices from "../services/user.wishlist.services.js";
import { getProductVariantDetails } from "../services/user.product.services.js";

export const wishlistPage = async (req, res) => {
  let wishlistItems;
  try {
    if (req.user && req.user._id) {
      wishlistItems = await userWishListServices.getWishlistItems(req.user._id);

      for (const item of wishlistItems) {
        const { variantName } = await getProductVariantDetails(
          item.productId,
          item.variantId,
        );
        item.variantName = variantName;
      }
    } else {
      wishlistItems = [];
    }

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
    if (!req.user || !req.user._id)
      throw new Error("Please login to add items to wishlist");

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
