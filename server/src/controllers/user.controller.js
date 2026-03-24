import {
  updateUser,
  getUserAddresses,
  createNewAddress,
  deleteOneAddress,
  updateAddress,
  changeDefaultAddress,
  UploadProfilePic,
} from "../services/user.services.js";
import {
  createAndSendEmailChangeOTP,
  verifyEmailChangeOTP,
} from "../services/OTP.services.js";

import User from "../models/user.model.js";
import { getAvailableCategories } from "../services/admin/admin.category.services.js";
import { getSelectedProductForHomePage } from "../services/admin/admin.product.services.js";
import * as statusCodes from "../constants/statusCodes.js";
import * as messages from "../constants/messages.js";

export const homePage = async (req, res) => {
  console.log(req.user);
  try {
    const categories = await getAvailableCategories();

    const products = await getSelectedProductForHomePage();

    res.render("user/home.ejs", {
      user: req.user,
      categories,
      ...products,
    });
  } catch (err) {
    console.error("Home page error:", err);
    res.status(statusCodes.INTERNAL_SERVER_ERROR).render("404-not-found");
  }
};

export const profilePage = async (req, res) => {
  try {
    const authInfo = await User.findById(req.user._id).select("googleId");

    const isGoogle = !!authInfo.googleId;

    res.render("user/profile", {
      user: req.user, // safe object from passport
      isGoogle,
    });
  } catch (err) {
    console.error(err);
    res.status(statusCodes.INTERNAL_SERVER_ERROR).send(messages.ERROR);
  }
};
export const editProfile = async (req, res) => {
  try {
    const { name, phone, newPassword, currentPassword } = req.body;

    const userData = { name, phone, newPassword, currentPassword };

    const updatedUser = await updateUser(req.user._id, userData);

    res.json({
      success: true,
      user: {
        name: updatedUser.name,
        phone: updatedUser.phone,
      },
    });
  } catch (err) {
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: err.message });
  }
};

export const changeEmail = async (req, res) => {
  try {
    console.log("The req body is:", req.body);

    await createAndSendEmailChangeOTP(req.user._id, req.body.newEmail, false);

    req.session.newMail = req.body.newEmail;
    return res.status(statusCodes.OK).json({
      success: true,
      message: "OTP sent to your new email address",
    });
  } catch (err) {
    console.error("Change email error:", err);

    return res.status(statusCodes.BAD_REQUEST).json({
      success: false,
      message: err.message || "Failed to send OTP",
    });
  }
};

export const resendEmailChangeOTP = async (req, res) => {
  try {
    const userId = req.user._id;
    const tempNewMail = req.session.newMail;

    const otp = await createAndSendEmailChangeOTP(userId, tempNewMail, true);

    return res.json({
      success: true,
      otpLastResend: otp.lastResentAt,
    });
  } catch (err) {
    console.error("Resend email change OTP error:", err);

    return res.status(statusCodes.BAD_REQUEST).json({
      success: false,
      message: err.message || "Failed to resend OTP",
    });
  }
};

export const emailChangeOTPVerification = async (req, res) => {
  try {
    await verifyEmailChangeOTP(
      req.user._id,
      req.body.userOTP,
      req.body.newEmail,
    );

    delete req.session.newEmail;
    res.redirect("/user/profile");
  } catch (err) {
    res.status(statusCodes.BAD_REQUEST).json({ message: err.message });
  }
};

//Address page works

export const addressPage = async (req, res) => {
  let userAddresses = await getUserAddresses(req.user._id);

  if (userAddresses && userAddresses.length) {
    userAddresses.sort((a, b) => b.isDefault - a.isDefault);
  }

  res.render("user/addresses", {
    user: req.user,
    addresses: userAddresses,
  });
};

export const addAddress = async (req, res) => {
  try {
    const newAddress = await createNewAddress(req.user._id, req.body);

    return res.status(statusCodes.OK).json({
      success: true,
      address: newAddress,
    });
  } catch (err) {
    console.error(err);

    return res.status(statusCodes.BAD_REQUEST).json({
      success: false,
      message: err.message || "Failed to add address",
    });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    await deleteOneAddress(req.user._id, req.params.addressId);

    res.status(statusCodes.CREATED).json({
      success: true,
    });
  } catch (err) {
    console.error(err);

    return res.status(statusCodes.BAD_REQUEST).json({
      success: false,
      message: err.message || "Failed to delete address",
    });
  }
};

export const editAddress = async (req, res) => {
  try {
    const editedAddress = await updateAddress(
      req.user._id,
      req.params.addressId,
      req.body,
    );

    res.status(statusCodes.CREATED).json({
      address: editedAddress,
    });
  } catch (err) {
    console.error(err);

    return res.status(statusCodes.BAD_REQUEST).json({
      success: false,
      message: err.message || "Failed to update address",
    });
  }
};

export const setDefault = async (req, res) => {
  try {
    console.log("Reached default set controller");

    const editedAddress = await changeDefaultAddress(
      req.user._id,
      req.params.addressId,
    );

    res.sendStatus(statusCodes.NO_CONTENT);
  } catch (err) {
    console.error(err);

    return res.status(statusCodes.BAD_REQUEST).json({
      success: false,
      message: err.message || "Failed to set default address",
    });
  }
};

export const changeProfilePicture = async (req, res) => {
  try {
    console.log("FILE =>", req.file);
    const uploadedUrl = await UploadProfilePic(req.file, req.user._id);

    res.json({
      imageUrl: uploadedUrl,
    });
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: err.message });
  }
};

export const orderPage = async (req, res) => {
  res.render("user/orders", {
    user: req.user,
  });
};
