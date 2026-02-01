import bcrypt from "bcrypt";
import User from "../models/user.model.js";

export const createTempUserForSignup = async (body) => {
  const { name, email, phone, password, confirm_password } = body;

  if (password !== confirm_password) {
    throw new Error("Passwords do not match");
  }

  const emailExist = await User.findOne({ email });

  let phoneExist = null;
  if (phone) {
    phoneExist = await User.findOne({ phone });
  }

  if (emailExist) throw new Error("User with same email already exists");
  if (phoneExist) throw new Error("User with same phone already exists");

  const hash = await bcrypt.hash(password, 10);

  const normalizedEmail = email.trim();
  // create new temp user
  return {
    name,
    email: normalizedEmail,
    phone,
    password: hash,
  };
};

export const authenticateUser = async (body) => {
  const user = await User.findOne({ email: body.email });

  if (!user.password)
    throw new Error(
      "This account was created using Google. Please sign in with Google instead.",
    );

  if (!user) throw new Error("Account doesn't exist");

  if (user.role !== "user") {
    throw new Error("This account is not a user");
  }

  if (user.status !== "active") {
    throw new Error(`This account is ${user.status} please contact your admin`);
  }

  console.log(`body.password is ${body.password}`);
  console.log(`user.password is ${user.password}`);

  const isMatch = await bcrypt.compare(body.password, user.password);

  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  return user;
};

export const googleUserExist = async (googleUser) => {
  const user = await User.findOne({
    googleId: googleUser.id,
  });

  if (user) return user;

  const nonGoogleUser = await User.findOne({
    email: googleUser.emails[0].value,
  });

  if (nonGoogleUser) {
    nonGoogleUser.googleId = googleUser.id;
    nonGoogleUser.isVerified = true;
    await nonGoogleUser.save();

    return nonGoogleUser;
  }

  const newUser = await User.create({
    name: googleUser.displayName,
    googleId: googleUser.id,
    email: googleUser.emails[0].value,
    profileImage: googleUser.photos[0].value,
    isVerified: true,
  });

  return newUser;
};

export const setNewPassword = async (password, userId) => {
  console.log("New pass set forgot reached");
  await User.findByIdAndUpdate(userId, {
    password: await bcrypt.hash(password, 10),
  });
};

export const authenticateAdminLogin = async (adminData) => {
  const admin = await User.findOne({ role: "admin", email: adminData.email });

  if (!admin) throw new Error("Admin not found");

  const isMatch = await bcrypt.compare(adminData.password, admin.password);

  if (!isMatch) throw new Error("Invalid credentials");

  const { password, ...safeAdmin } = admin.toObject();

  return safeAdmin;
};
