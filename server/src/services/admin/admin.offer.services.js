import Offer from "../../models/offer.model.js";

export const getAllOffers = async ({ page, limit, search, sort, filter }) => {
  const query = {};

  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  if (filter === "active") query.isActive = true;
  else if (filter === "inactive") query.isActive = false;

  let sortOptions = { createdAt: -1 };
  if (sort === "oldest") sortOptions = { createdAt: 1 };

  const total = await Offer.countDocuments(query);
  const skip = (page - 1) * limit;

  const offers = await Offer.find(query)
    .sort(sortOptions)
    .skip(skip)
    .limit(limit)
    .lean();

  return {
    offers,
    total,
  };
};

export const createOffer = async (offerData) => {
  const discountValue = Number(offerData.discountValue);

  if (discountValue > 100) {
    throw new Error("Percentage discount cannot exceed 100%");
  }

  if (discountValue <= 0) {
    throw new Error("Discount value must be greater than 0");
  }

  const offer = await Offer.create({
    ...offerData,
    discountValue,
  });

  return offer;
};

export const editOffer = async (offerId, offerData) => {
  const discountValue = Number(offerData.discountValue);

  if (discountValue > 100) {
    throw new Error("Percentage discount cannot exceed 100%");
  }

  const offer = await Offer.findByIdAndUpdate(
    offerId,
    {
      ...offerData,
      discountValue,
    },
    { new: true, runValidators: true },
  );

  if (!offer) {
    throw new Error("Offer not found");
  }

  return offer;
};

export const toggleOfferStatus = async (offerId) => {
  const offer = await Offer.findById(offerId);
  if (!offer) {
    throw new Error("Offer not found");
  }

  offer.isActive = !offer.isActive;
  await offer.save();

  return {
    offer,
    action: offer.isActive ? "activate" : "deactivate",
  };
};

export const getHighestOffer = async (
  productId,
  categoryId,
  currentDiscount,
) => {
  const result = await Offer.aggregate([
    {
      $match: {
        targetId: { $in: [productId, categoryId] },
      },
    },
    {
      $group: {
        _id: null,
        highestOffer: { $max: "$discountValue" },
      },
    },
  ]);

  const highestOfferFromDB = result.length ? result[0].highestOffer : 0;

  const highestOffer = Math.max(highestOfferFromDB, currentDiscount);

  return highestOffer;
};
