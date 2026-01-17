import User from "../models/user.model.js";

export const isAuth = (req, res, next) => {
  if (req.session.user && req.session.user.isVerified) {
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
  if (req.session.user && req.session.user.isVerified) {
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
    const user = await User.findOne({ email: req.session.user.email });

    if (!user) {
      delete req.session.user;
      req.flash("error", "User doesn't exist");
    }

    if (user.status === "blocked") {
      delete req.session.user;
      req.flash("error", "User is blocked please contact admin");
    }

    if (!user.isVerified) {
      req.flash(
        "error",
        "Please verify your account first <a> Click here </a>",
      );
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
