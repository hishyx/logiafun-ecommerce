import Coupon from "../../models/coupon.model.js";
import { getAvailableCartItems } from "../user.cart.services.js";
import { couponUsage } from "../../models/coupon.model.js";

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
  const maxDiscountAmount = Number(couponData.maxDiscountAmount);
  const minPurchaseAmount = Number(couponData.minPurchaseAmount);
  const usageLimit = Number(couponData.usageLimit);
  const discountType = couponData.discountType;

  // ---- basic validations ----
  if (!["fixed", "percentage"].includes(discountType)) {
    throw new Error("Invalid discount type");
  }

  if (Number.isNaN(discountValue) || discountValue <= 0) {
    throw new Error("Discount value must be greater than 0");
  }

  if (Number.isNaN(minPurchaseAmount) || minPurchaseAmount <= 0) {
    throw new Error("Minimum purchase amount must be greater than 0");
  }

  if (!Number.isInteger(usageLimit) || usageLimit <= 0) {
    throw new Error("Usage limit must be a positive integer");
  }

  if (Number.isNaN(maxDiscountAmount) || maxDiscountAmount < 0) {
    throw new Error("Max discount cannot be negative");
  }

  // ---- fixed coupon rules ----
  if (discountType === "fixed") {
    if (discountValue > minPurchaseAmount) {
      throw new Error("Discount cannot exceed minimum purchase amount");
    }

    if (maxDiscountAmount > 0 && maxDiscountAmount < discountValue) {
      throw new Error("Max discount cannot be less than discount value");
    }
  }

  // ---- percentage coupon rules ----
  if (discountType === "percentage") {
    if (discountValue > 100) {
      throw new Error("Percentage discount cannot exceed 100");
    }

    // cap required in most real systems (optional — keep if business rule)
    if (maxDiscountAmount === 0) {
      throw new Error("Max discount amount required for percentage coupon");
    }

    // logical sanity: % discount at min purchase should not exceed cap
    const expectedDiscount = (minPurchaseAmount * discountValue) / 100;

    if (maxDiscountAmount > 0 && expectedDiscount > maxDiscountAmount) {
      throw new Error(
        "Max discount too small for given percentage and minimum purchase",
      );
    }
    if (maxDiscountAmount > 0 && maxDiscountAmount < discountValue) {
      throw new Error("Max discount cannot be less than discount value");
    }
  }

  const coupon = await Coupon.create({
    ...couponData,
    discountValue,
    maxDiscountAmount,
    minPurchaseAmount,
    usageLimit,
  });

  return coupon;
};

export const editCoupon = async (couponId, couponData) => {
  const discountValue = Number(couponData.discountValue);
  const maxDiscountAmount = Number(couponData.maxDiscountAmount);
  const minPurchaseAmount = Number(couponData.minPurchaseAmount);
  const usageLimit = Number(couponData.usageLimit);
  const discountType = couponData.discountType;

  // ---- basic validations ----
  if (!["fixed", "percentage"].includes(discountType)) {
    throw new Error("Invalid discount type");
  }

  if (Number.isNaN(discountValue) || discountValue <= 0) {
    throw new Error("Discount value must be greater than 0");
  }

  if (Number.isNaN(minPurchaseAmount) || minPurchaseAmount <= 0) {
    throw new Error("Minimum purchase amount must be greater than 0");
  }

  if (!Number.isInteger(usageLimit) || usageLimit <= 0) {
    throw new Error("Usage limit must be a positive integer");
  }

  if (Number.isNaN(maxDiscountAmount) || maxDiscountAmount < 0) {
    throw new Error("Max discount cannot be negative");
  }

  // ---- fixed coupon rules ----
  if (discountType === "fixed") {
    if (discountValue > minPurchaseAmount) {
      throw new Error("Discount cannot exceed minimum purchase amount");
    }

    if (maxDiscountAmount > 0 && maxDiscountAmount < discountValue) {
      throw new Error("Max discount cannot be less than discount value");
    }
  }

  // ---- percentage coupon rules ----
  if (discountType === "percentage") {
    if (discountValue > 100) {
      throw new Error("Percentage discount cannot exceed 100");
    }

    if (maxDiscountAmount === 0) {
      throw new Error("Max discount amount required for percentage coupon");
    }

    const expectedDiscount = (minPurchaseAmount * discountValue) / 100;

    if (maxDiscountAmount > 0 && expectedDiscount > maxDiscountAmount) {
      throw new Error(
        "Max discount too small for given percentage and minimum purchase",
      );
    }
  }

  const coupon = await Coupon.findByIdAndUpdate(
    couponId,
    {
      ...couponData,
      discountValue,
      maxDiscountAmount,
      minPurchaseAmount,
      usageLimit,
    },
    { new: true, runValidators: true },
  );

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

export const getAvailableCoupons = async (orderPrice, userId) => {
  // step 1 → get valid coupons
  const coupons = await Coupon.find({
    minPurchaseAmount: { $lte: orderPrice },
    isActive: true,
    startDate: { $lte: new Date() },
    expiryDate: { $gte: new Date() },
    $expr: { $lt: ["$usedCount", "$usageLimit"] },
  });

  // get coupons already used by this user
  const usedCoupons = await couponUsage.find({ userId });

  // convert used coupon ids to string array
  const usedCouponIds = usedCoupons.map((item) => item.couponId.toString());

  // step 4 → filter
  const availableCoupons = coupons.filter(
    (coupon) => !usedCouponIds.includes(coupon._id.toString()),
  );

  return availableCoupons;
};

export const applyCouponService = async (couponId, userId) => {
  const [, cartCalaculations] = await getAvailableCartItems(userId);

  const orderPrice = cartCalaculations.subtotal;

  const coupon = await Coupon.findById(couponId);

  if (!coupon) {
    throw new Error("Coupon not found");
  }

  const usedCoupon = await couponUsage.findOne({
    userId,
    couponId: coupon._id,
  });

  if (usedCoupon) throw new Error("This coupon is already used");

  if (!coupon.isActive) {
    throw new Error("This coupon is inactive");
  }

  if (coupon.startDate && coupon.startDate > new Date()) {
    throw new Error("This coupon is not active yet");
  }

  if (coupon.expiryDate && coupon.expiryDate < new Date()) {
    throw new Error("This coupon has expired");
  }

  if (coupon.usedCount >= coupon.usageLimit) {
    throw new Error("This coupon has reached its usage limit");
  }

  if (orderPrice < coupon.minPurchaseAmount) {
    throw new Error(
      `Minimum order amount for this coupon is Rs. ${coupon.minPurchaseAmount}`,
    );
  }

  let discount = 0;

  if (coupon.discountType === "fixed") {
    discount = coupon.discountValue;
  }

  if (coupon.discountType === "percentage") {
    discount = (orderPrice * coupon.discountValue) / 100;

    if (coupon.maxDiscountAmount > 0) {
      discount = Math.min(discount, coupon.maxDiscountAmount);
    }
  }

  discount = Math.round(Math.min(discount, orderPrice));

  // store coupon amount
  cartCalaculations.discount = discount;

  // do NOT touch subtotal
  cartCalaculations.netSubtotal = cartCalaculations.subtotal - discount;

  // GST always on net subtotal
  cartCalaculations.gst = Math.round(cartCalaculations.netSubtotal * 0.18);

  // Shipping ALWAYS on original subtotal
  cartCalaculations.shipping = cartCalaculations.subtotal >= 1000 ? 0 : 80;

  // Final total
  cartCalaculations.total =
    cartCalaculations.netSubtotal +
    cartCalaculations.gst +
    cartCalaculations.shipping;

  return cartCalaculations;
};
