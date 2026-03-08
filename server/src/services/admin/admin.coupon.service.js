import Coupon from "../../models/coupon.model.js";
import { getAvailableCartItems } from "../user.cart.services.js";

export const getAllCoupons = async ({ page, limit, search, sort, filter }) => {
  const query = {};

  if (search) {
    query.$or = [
      { code: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  if (filter === "active") query.isActive = true;
  else if (filter === "inactive") query.isActive = false;
  else if (filter === "expired") query.expiryDate = { $lt: new Date() };

  let sortOptions = { createdAt: -1 };
  if (sort === "oldest") sortOptions = { createdAt: 1 };
  if (sort === "expiry_asc") sortOptions = { expiryDate: 1 };

  const total = await Coupon.countDocuments(query);
  const skip = (page - 1) * limit;

  const coupons = await Coupon.find(query)
    .sort(sortOptions)
    .skip(skip)
    .limit(limit);

  return {
    coupons,
    total,
  };
};

export const createCoupon = async (couponData) => {
  const discountValue = Number(couponData.discountValue);
  const maxDiscountAmount =
    Number(couponData.maxDiscountAmount) == 0
      ? Infinity
      : Number(couponData.maxDiscountAmount);
  const minPurchaseAmount = Number(couponData.minPurchaseAmount);
  const usageLimit = Number(couponData.usageLimit);

  if (Number.isNaN(discountValue) || discountValue <= 0) {
    throw new Error("Discount value must be greater than 0");
  }

  if (Number.isNaN(minPurchaseAmount) || minPurchaseAmount <= 0) {
    throw new Error("Minimum purchase amount must be greater than 0");
  }

  if (Number.isNaN(usageLimit) || usageLimit <= 0) {
    throw new Error("Usage limit must be greater than 0");
  }

  if (couponData.discountType === "fixed") {
    if (discountValue > minPurchaseAmount) {
      throw new Error("Discount cannot exceed minimum purchase amount");
    }

    if (
      couponData.discountType === "fixed" &&
      maxDiscountAmount > 0 &&
      maxDiscountAmount < discountValue
    ) {
      throw new Error("Max discount cannot be less than discount value");
    }

    if (minPurchaseAmount > maxDiscountAmount) {
      throw new Error("Min purchase cannot exceed max discount");
    }
  }

  const coupon = await Coupon.create(couponData);

  return coupon;
};

export const editCoupon = async (couponId, couponData) => {
  const discountValue = Number(couponData.discountValue);
  const maxDiscountAmount =
    Number(couponData.maxDiscountAmount) == 0
      ? Infinity
      : Number(couponData.maxDiscountAmount);
  const minPurchaseAmount = Number(couponData.minPurchaseAmount);
  const usageLimit = Number(couponData.usageLimit);

  if (Number.isNaN(discountValue) || discountValue <= 0) {
    throw new Error("Discount value must be greater than 0");
  }

  if (Number.isNaN(minPurchaseAmount) || minPurchaseAmount <= 0) {
    throw new Error("Minimum purchase amount must be greater than 0");
  }

  if (Number.isNaN(usageLimit) || usageLimit <= 0) {
    throw new Error("Usage limit must be greater than 0");
  }

  if (couponData.discountType === "fixed") {
    if (discountValue > minPurchaseAmount) {
      throw new Error("Discount cannot exceed minimum purchase amount");
    }

    if (
      couponData.discountType === "fixed" &&
      maxDiscountAmount > 0 &&
      maxDiscountAmount < discountValue
    ) {
      throw new Error("Max discount cannot be less than discount value");
    }

    if (minPurchaseAmount > maxDiscountAmount) {
      console.log("[COUPON DEBUG]", {
        minPurchaseAmount,
        maxDiscountAmount,
      });
      throw new Error("Min purchase cannot exceed max discount");
    }
  }

  const coupon = await Coupon.findByIdAndUpdate(couponId, couponData);

  return coupon;
};

export const toggleCouponStatus = async (couponId) => {
  const coupon = await Coupon.findById(couponId);
  if (!coupon) {
    throw new Error("Coupon not found");
  }

  coupon.isActive = !coupon.isActive;
  await coupon.save();

  return {
    coupon,
    action: coupon.isActive ? "activate" : "deactivate",
  };
};

export const getAvailableCoupons = async (orderPrice) => {
  console.log(orderPrice);
  const coupons = await Coupon.find({
    minPurchaseAmount: { $lte: orderPrice },
    isActive: true,
    startDate: { $lte: new Date() },
    expiryDate: { $gte: new Date() },
    $expr: { $lt: ["$usedCount", "$usageLimit"] },
  });

  console.log(coupons);
  return coupons;
};

export const applyCouponService = async (couponId, userId) => {
  const [, cartCalaculations] = await getAvailableCartItems(userId);

  const orderPrice = cartCalaculations.subtotal;

  const coupon = await Coupon.findOne({
    _id: couponId,
    minPurchaseAmount: { $lte: orderPrice },
    isActive: true,
    startDate: { $lte: new Date() },
    expiryDate: { $gte: new Date() },
    $expr: { $lt: ["$usedCount", "$usageLimit"] },
  });

  if (!coupon) throw new Error("Coupon not found");

  if (coupon.discountType == "fixed") {
    cartCalaculations.discount += coupon.discountValue;
    cartCalaculations.total -= coupon.discountValue;
  }

  console.log("Applying coupon is : ", coupon);

  console.log("Amounts before applying is : ", cartCalaculations);

  return cartCalaculations;
};
