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

export const homePage = (req, res) => {
  console.log(req.user);
  res.render("user/home.ejs", {
    user: req.user,
  });
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
    res.status(500).send("Something went wrong");
  }
};

export const cartPage = (req, res) => {
  res.render("user/cart", { user: req.user });
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
  } catch (err) {}
};

export const changeEmail = async (req, res) => {
  try {
    console.log("The req body is:", req.body);

    await createAndSendEmailChangeOTP(req.user._id, req.body.newEmail, false);

    req.session.newMail = req.body.newEmail;
    return res.status(200).json({
      success: true,
      message: "OTP sent to your new email address",
    });
  } catch (err) {
    console.error("Change email error:", err);

    return res.status(400).json({
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

    return res.status(400).json({
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
    res.status(400).json({ message: err.message });
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

    res.status(201).json({
      address: newAddress,
    });
  } catch (err) {
    console.log(err);
  }
};

export const deleteAddress = async (req, res) => {
  try {
    await deleteOneAddress(req.user._id, req.params.addressId);

    res.status(201).json({
      success: true,
    });
  } catch (err) {
    console.log(err);
  }
};

export const editAddress = async (req, res) => {
  try {
    const editedAddress = await updateAddress(
      req.user._id,
      req.params.addressId,
      req.body,
    );

    res.status(201).json({
      address: editedAddress,
    });
  } catch (err) {
    console.log(err);
  }
};

export const setDefault = async (req, res) => {
  try {
    const editedAddress = await changeDefaultAddress(
      req.user._id,
      req.params.addressId,
    );

    // res.status(201).json({
    //   address: editedAddress,
    // });

    res.sendStatus(204);
  } catch (err) {
    console.log(err);
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
    res.status(500).json({ message: err.message });
  }
};

// getdefaultadress=()=>{
//   const addresses=await Addresses.find({isDefault:true})
// }
