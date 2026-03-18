import * as adminOfferServices from "../../services/admin/admin.offer.services.js";
import Product from "../../models/products.model.js";
import Category from "../../models/categories.model.js";
import * as statusCodes from "../../constants/statusCodes.js";
import * as messages from "../../constants/messages.js";

export const getOffersPage = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 7,
      search = "",
      filter = "all",
      sort = "latest",
    } = req.query;

    page = Number(page);
    limit = Number(limit);

    const offersData = await adminOfferServices.getAllOffers({
      page,
      limit,
      search,
      sort,
      filter,
    });

    const products = await Product.find({ isActive: true }, "name").lean();
    const categories = await Category.find({ isActive: true }, "name").lean();

    const totalPages = Math.ceil(offersData.total / limit);

    res.render("admin/admin.offers.ejs", {
      title: "Offer Management - Admin Panel",
      page: "offers",
      ...offersData,
      products,
      categories,
      search,
      filter,
      sort,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error("Error in getOffersPage:", error);
    res.status(statusCodes.INTERNAL_SERVER_ERROR).render("500-internal-server-error");
  }
};

export const addOffer = async (req, res) => {
  try {
    await adminOfferServices.createOffer(req.body);
    return res.status(statusCodes.CREATED).json({ success: true, message: messages.OFFER_CREATED });
  } catch (error) {
    console.error("Error in addOffer:", error);
    return res.status(statusCodes.BAD_REQUEST).json({ success: false, message: error.message });
  }
};

export const editOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    await adminOfferServices.editOffer(offerId, req.body);
    return res.status(statusCodes.OK).json({ success: true, message: messages.OFFER_UPDATED });
  } catch (error) {
    console.error("Error in editOffer:", error);
    return res.status(statusCodes.BAD_REQUEST).json({ success: false, message: error.message });
  }
};

export const toggleOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { action } = await adminOfferServices.toggleOfferStatus(offerId);
    return res.status(statusCodes.OK).json({ success: true, message: `Offer ${action}d successfully!` });
  } catch (error) {
    console.error("Error in toggleOffer:", error);
    return res.status(statusCodes.BAD_REQUEST).json({ success: false, message: error.message });
  }
};
