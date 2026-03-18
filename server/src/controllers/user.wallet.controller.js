import User from "../models/user.model.js";
import { getWalletByUserId } from "../services/user.wallet.services.js";
import * as statusCodes from "../constants/statusCodes.js";
import * as messages from "../constants/messages.js";

export const walletPage = async (req, res) => {
  try {
    const authInfo = await User.findById(req.user._id).select("googleId");

    const isGoogle = !!authInfo.googleId;

    const limit = 5;

    const wallet = await getWalletByUserId(req.user._id, limit);

    res.render("user/wallet", {
      wallet,
    });
  } catch (err) {
    console.error(err);
    res.status(statusCodes.INTERNAL_SERVER_ERROR).send(messages.ERROR);
  }
};

export const walletTransactionsPage = async (req, res) => {
  try {
    const wallet = await getWalletByUserId(req.user._id);

    res.render("user/wallet-transactions", {
      wallet,
    });
  } catch (err) {
    console.error(err);
    res.status(statusCodes.INTERNAL_SERVER_ERROR).send(messages.ERROR);
  }
};
