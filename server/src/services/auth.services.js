import bcrypt from "bcrypt";
import User from "../models/user.model.js";

export const registerUser = async (body) => {
  const { name, email, phone, password, confirm_password } = body;

  if (password !== confirm_password) {
    throw new Error("Password's doesn't match");
  }

  const emailExist = await User.findOne({ email: email });
  const phoneExist = await User.findOne({ phone: phone });

  if (emailExist) throw new Error("User with same email already exists");
  else if (phoneExist) throw new Error("User with same phone already exists");

  //Creation begins

  const newUser = await User.create({
    name: name,
    email: email,
    phone: phone,
    profileImage: "/images/profile.jpg",
    password: await bcrypt.hash(password, 10),
  });

  return newUser;
};

export const aunthenticateUser = async (body) => {
  const user = await User.findOne({ email: body.email });

  if (!user) throw new Error("Account doesn't exist");

  if (user.role !== "user") {
    throw new Error("This account is not a user");
  }

  if (user.status !== "active") {
    throw new Error(`This account is ${user.status} please contact your admin`);
  }

  if (!user.isVerified) {
    throw new Error(
      `This account is not verified
`,
    );
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
