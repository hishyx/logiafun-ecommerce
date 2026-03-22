import * as userWishListServices from "../services/user.wishlist.services.js";
import { getProductVariantDetails } from "../services/user.product.services.js";
import * as statusCodes from "../constants/statusCodes.js";
import * as messages from "../constants/messages.js";

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
    res.status(statusCodes.INTERNAL_SERVER_ERROR).render("500");
  }
};

export const addToWishList = async (req, res) => {
  try {
    console.log("reached wishlist");

    console.log(req.body);
    if (!req.user || !req.user._id)
      throw new Error("Please login to add items to wishlist");

    await userWishListServices.addProductToWishListService(
      req.body,
      req.user._id,
    );

    res.status(statusCodes.OK).json({ message: messages.WISHLIST_ADD_SUCCESS });
  } catch (err) {
    console.log(err);
    res.status(statusCodes.BAD_REQUEST).json({ message: err.message });
  }
};

export const removeWishlistItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    await userWishListServices.removeProductFromWishlistService(
      req.user._id,
      itemId,
    );

    res.status(statusCodes.OK).json({
      message: messages.WISHLIST_REMOVE_SUCCESS,
    });
  } catch (err) {
    console.log(err);
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: messages.WISHLIST_REMOVE_FAIL });
  }
};
