import User from "../models/user.model.js";
import Address from "../models/addresses.model.js";
import bcrypt from "bcrypt";
import uploadImageToCloudinary from "../utils/cloudinary.upload.js";
import cloudinaryFolders from "../components/cloudinary.folders.js";

export const updateUser = async (userId, userData) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const updateFields = {
    name: userData.name,
    phone: userData.phone,
  };

  //  If user wants to change password
  if (userData.currentPassword && userData.newPassword && !user.googleId) {
    const isMatch = await bcrypt.compare(
      userData.currentPassword,
      user.password,
    );

    if (!isMatch) {
      throw new Error("Current password is incorrect");
    }

    const hashedPassword = await bcrypt.hash(userData.newPassword, 12);
    updateFields.password = hashedPassword;
  }

  const updatedUser = await User.findByIdAndUpdate(userId, updateFields, {
    new: true,
  });

  return updatedUser;
};

//Address related works

export const getUserAddresses = async (userId) => {
  const addresses = await Address.find({ userId });

  if (!addresses) throw new Error("No addresses found");

  return addresses;
};

export const createNewAddress = async (userId, addressData) => {
  const count = await Address.countDocuments({ userId });

  const newAddress = await Address.create({
    userId,
    ...addressData,
    isDefault: count === 0,
  });

  return newAddress;
};

export const deleteOneAddress = async (userId, addressId) => {
  await Address.findOneAndDelete({
    _id: addressId,
    userId: userId,
  });
};

export const updateAddress = async (userId, addressId, newAddressData) => {
  return await Address.findOneAndUpdate(
    { _id: addressId, userId: userId },
    { $set: newAddressData },
    { new: true },
  );
};

export const changeDefaultAddress = async (userId, addressId) => {
  const currentDefault = await Address.findOne({ userId, isDefault: true });

  currentDefault.isDefault = false;
  await currentDefault.save();

  return await Address.findOneAndUpdate(
    { _id: addressId, userId: userId },
    { $set: { isDefault: true } },
    { new: true },
  );
};

export const getAddressDetails = async (userId, addressId) => {
  const address = await Address.findOne(
    { _id: addressId, userId }, // filter
    {
      addressName: 1,
      name: 1,
      phone: 1,
      street: 1,
      city: 1,
      pincode: 1,
      _id: 0, // exclude mongo _id
    },
  ).lean();

  if (!address) {
    throw new Error("Address not found");
  }

  return address;
};

export const UploadProfilePic = async (imageFile, userId) => {
  // 1. multer puts the file here
  if (!imageFile) {
    throw new Error("No image recieved");
  }

  const uploadedURL = await uploadImageToCloudinary(imageFile, {
    folder: cloudinaryFolders.PROFILE,
  });

  // 3. save url in DB
  await User.findByIdAndUpdate(userId, {
    profileImage: uploadedURL,
  });

  // 4. return url
  return uploadedURL;
};
