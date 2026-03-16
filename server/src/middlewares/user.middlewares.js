import { getCartCount } from "../services/user.cart.services.js";
import { getWishlistCount } from "../services/user.wishlist.services.js";

export const setLocalVariables = async (req, res, next) => {
  try {
    res.locals.user = req.user || null;

    if (req.user) {
      res.locals.cartCount = (await getCartCount(req.user._id)) || 0;
      res.locals.wishlistCount = (await getWishlistCount(req.user._id)) || 0;
    } else {
      res.locals.cartCount = 0;
      res.locals.wishlistCount = 0;
    }

    next();
  } catch (err) {
    next(err);
  }
};
