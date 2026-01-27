import { updateUser } from "../services/user.services.js";

export const homePage = (req, res) => {
  res.render("user/home.ejs", {
    user: req.user,
  });
};

export const profilePage = (req, res) => {
  res.render("user/profile", {
    user: req.user,
  });
};

export const addressPage = (req, res) => {
  res.render("user/addresses", {
    user: req.user,
  });
};

export const cartPage = (req, res) => {
  res.render("user/cart", { user: req.user });
};

export const editProfile = async (req, res) => {
  try {
    const { name, email, phone, newPassword, currentPassword } = req.body;

    const userData = { name, email, phone, newPassword, currentPassword };

    const updatedUser = await updateUser(req.user._id, userData);

    res.json({
      success: true,
      user: {
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
      },
    });
  } catch (err) {}
};
