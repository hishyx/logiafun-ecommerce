import Wallet from "../models/wallet.model.js";

export const getWalletByUserId = async (userId, limit) => {
  try {
    const wallet = await Wallet.findOne({ userId });

    if (!wallet) return null;

    if (limit) {
      wallet.transactions = wallet.transactions
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit);
    }

    return wallet;
  } catch (error) {
    throw new Error(`Error fetching wallet: ${error.message}`);
  }
};

export const addRefundToWallet = async ({
  userId,
  amount,
  orderNumber,
  status,
  itemName,
}) => {
  const refundAmount = Number(amount);

  if (!refundAmount || isNaN(refundAmount)) {
    throw new Error("Invalid refund amount");
  }

  let description;

  if (itemName && status === "cancelled") {
    description = `Order cancellation of ${itemName}`;
  } else if (itemName && status === "returned") {
    description = `Order returning of ${itemName}`;
  } else if (status === "cancelled") {
    description = `Order cancellation of ${orderNumber}`;
  } else if (status === "returned") {
    description = `Order returning of ${orderNumber}`;
  }

  const wallet = await Wallet.findOne({ userId });

  if (!wallet) {
    await Wallet.create({
      userId,
      balance: refundAmount,
      transactions: [
        {
          type: "credit",
          amount: refundAmount,
          description,
          orderNumber,
          itemName,
        },
      ],
    });

    return;
  }

  const currentBalance = Number(wallet.balance) || 0;

  wallet.transactions.push({
    type: "credit",
    amount: refundAmount,
    description,
    orderNumber,
    itemName,
  });

  wallet.balance = currentBalance + refundAmount;

  await wallet.save();
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
