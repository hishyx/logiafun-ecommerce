import User from "../models/user.model.js";

export const isAuth = (req, res, next) => {
  if (req.isAuthenticated() && req.user.isVerified) {
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
  if (req.isAuthenticated() && req.user.isVerified) {
    return res.redirect("/home");
  } else {
    next();
  }
};

export const isAdminGuest = (req, res, next) => {
  if (req.session.admin) {
    return res.redirect("/dashboard");
  } else {
    next();
  }
};

export const checkUserStatus = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      req.flash("error", "User doesn't exist");
      return res.redirect("/auth/login");
    }

    if (user.status === "blocked") {
      req.flash("error", "User is blocked please contact admin");
      return res.redirect("/auth/login");
    }

    if (!user.isVerified) {
      req.flash("error", "Please verify your account first");
      return res.redirect("/auth/login");
    }

    next();
  } catch (err) {
    console.log(err);
  }
};

export const checkAdminStatus = async (req, res, next) => {
  try {
    const isExist = await User.findOne({ email: req.session.admin.email });

    if (isExist && isExist.status !== "blocked") {
      next();
    } else {
      const error = !isExist ? "Admin doesn't exist" : "Admin is blocked";
      delete req.session.admin;
      req.flash("error", `error`);

      return res.redirect(`/admin/auth/login`);
    }
  } catch (err) {
    console.log(err);
  }
};
