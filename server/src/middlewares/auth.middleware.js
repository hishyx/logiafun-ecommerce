import User from "../models/user.model.js";
import Order from "../models/order.model.js";

export const isAuth = (req, res, next) => {
  console.log("isAuth hit:", req.originalUrl);

  if (req.isAuthenticated()) {
    next();
  } else {
    return res.redirect("/auth/login");
  }
};

export const isAdmin = (req, res, next) => {
  if (req.session.admin) {
    next();
  } else {
    return res.redirect("/admin/auth/login");
  }
};

export const isUserGuest = (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.redirect("/home");
  } else {
    next();
  }
};

export const isAdminGuest = (req, res, next) => {
  if (req.session.admin) {
    return res.redirect("/admin/users");
  }
  next();
};

export const checkUserStatus = async (req, res, next) => {
  if (!req.user) return next();

  // Only affect normal users
  if (req.user.role === "user" && req.user.isBlocked) {
    return req.logout({ keepSessionInfo: true }, (err) => {
      if (err) return next(err);
      req.flash("error", "User is blocked please contact your admin");

      return res.redirect("/auth/login");
    });
  }

  next();
};

export const checkAdminStatus = async (req, res, next) => {
  try {
    if (!req.session.admin?.email) {
      return res.redirect("/admin/auth/login");
    }

    const admin = await User.findOne({
      email: req.session.admin.email,
      role: "admin",
    });

    if (!admin) {
      delete req.session.admin;
      req.flash("error", "Admin doesn't exist");
      return res.redirect("/admin/auth/login");
    }

    // to block admin when needed
    if (admin.isBlocked) {
      delete req.session.admin;
      req.flash("error", "Admin is blocked");
      return res.redirect("/admin/auth/login");
    }

    next();
  } catch (err) {
    console.log(err);
    return res.redirect("/admin/auth/login");
  }
};

export const safeTokenMatches = (req, res, next) => {
  const safeUser = req.query.token || "";

  if (safeUser != req.session.forgotToken) {
    return res.redirect("/auth/login");
  }

  next();
};

export const checkAuthUniversaly = async (req, res, next) => {
  console.log("Unversal prevent middleware reached");
  try {
    console.log("orderId received:", req.params.orderId);
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    console.log("req.user:", req.user);
    console.log("order.userId:", order.userId.toString());

    if (!order) {
      return res.status(404).send("Order not found");
    }

    // Allow admin
    if (req.session?.admin) {
      req.order = order;
      return next();
    }

    // Allow owner
    if (req.user && order.userId.toString() === req.user._id.toString()) {
      req.order = order;
      return next();
    }

    return res.status(403).send("Unauthorized");
  } catch (err) {
    console.error(err);
    res.status(500).send("Authorization failed");
  }
};
