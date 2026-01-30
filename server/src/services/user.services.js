import User from "../models/user.model.js";
import bcrypt from "bcrypt";

export const updateUser = async (userId, userData) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  if (!user.password) {
    user.password = await bcrypt.hash(userData.newPassword, 12);
    await user.save();

    return user;
  }

  const updateFields = {
    name: userData.name,
    phone: userData.phone,
  };

  //  If user wants to change password
  if (userData.currentPassword && userData.newPassword) {
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
