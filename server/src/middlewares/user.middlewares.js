import { getCartCount } from "../services/user.cart.services.js";

export const setLocalVariables = async (req, res, next) => {
  try {
    res.locals.user = req.user || null;

    if (req.user) {
      res.locals.cartCount = (await getCartCount(req.user._id)) || 0;
    } else {
      res.locals.cartCount = 0;
    }

    next();
  } catch (err) {
    next(err);
  }
};
