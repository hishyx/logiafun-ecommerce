import User from "../models/user.model.js";

export const referralPage = async (req, res) => {
  try {
    const userWithReferral = await User.findById(req.user._id).select(
      "referralCode name email profileImage googleId",
    );

    const isGoogle = !!userWithReferral.googleId;

    res.render("user/referral", {
      user: userWithReferral,
      isGoogle,
      referralCode: userWithReferral.referralCode,
    });
  } catch (err) {
    console.error("Referral page error:", err);
    res.status(500).send("Something went wrong");
  }
};
