import User from "../models/user.model.js";
import { getWalletByUserId } from "../services/user.wallet.services.js";

export const walletPage = async (req, res) => {
    try {
        const authInfo = await User.findById(req.user._id).select("googleId");

        const isGoogle = !!authInfo.googleId;

        const wallet = await getWalletByUserId(req.user._id);

        res.render("user/wallet", {
            user: req.user,
            isGoogle,
            wallet,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Something went wrong");
    }
};
