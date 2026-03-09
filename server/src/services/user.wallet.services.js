import Wallet from "../models/wallet.model.js";

export const getWalletByUserId = async (userId) => {
  try {
    return await Wallet.findOne({ userId });
  } catch (error) {
    throw new Error(`Error fetching wallet: ${error.message}`);
  }
};

export const addRefundToWallet = async ({
  userId,
  amount,
  orderNumber,
  status,
}) => {
  let description;

  if (status == "cancelled")
    description = `Order cancellation of ${orderNumber}`;
  if (status == "returned") description = `Order returning of ${orderNumber}`;

  const transaction = {
    type: "debit",
    amount,
    description,
    orderNumber,
  };

  const wallet = await Wallet.findOne({ userId });

  if (!wallet) {
    await Wallet.create({
      userId,
      balance: transaction.amount,
      transactions: [transaction],
    });

    return;
  }

  wallet.transactions.push(transaction);

  wallet.balance += transaction.amount;

  wallet.save();
};

export const payWithWallet = async (userId, amount, orderNumber) => {
  const wallet = await Wallet.findOne({ userId });

  if (!wallet || wallet.balance < amount)
    throw new Error("Wallet Balance is very low ");

  wallet.balance -= amount;

  const description = `Payed for the order ${orderNumber}`;

  const transaction = {
    type: "debit",
    amount,
    description,
  };

  wallet.transactions.push(transaction);

  await wallet.save();

  return true;
};

export const addReferralBonus = async (userId, amount, description) => {
  const transaction = {
    type: "credit",
    amount,
    description,
  };

  const wallet = await Wallet.findOne({ userId });

  if (!wallet) {
    await Wallet.create({
      userId,
      balance: amount,
      transactions: [transaction],
    });
    return;
  }

  wallet.transactions.push(transaction);
  wallet.balance += amount;
  await wallet.save();
};
