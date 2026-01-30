import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import TempUser from "../models/tempUser.model.js";

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

  // normalize email first
  const normalizedEmail = email.toLowerCase().trim();

  // block duplicate signup in progress
  const existingTemp = await TempUser.findOne({ email: normalizedEmail });

  if (existingTemp) {
    return existingTemp;
  }

  // create new temp user
  const tempUser = await TempUser.create({
    name,
    email: normalizedEmail,
    phone,
    password: hash,
  });

  return tempUser;
};

export const authenticateUser = async (body) => {
  console.log("EMAIL RECEIVED:", body.email);

  const user = await User.findOne({ email: body.email });

  if (!user) throw new Error("Account doesn't exist");

  if (user.role !== "user") {
    throw new Error("This account is not a user");
  }

  if (user.status !== "active") {
    throw new Error(`This account is ${user.status} please contact your admin`);
  }

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
