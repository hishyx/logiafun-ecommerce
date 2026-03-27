import * as userProductServices from "../services/user.product.services.js";
import { getAvailableCategories } from "../services/admin/admin.category.services.js";
import { ArrayStringsToObjectId } from "../utils/convert.to.objectId.js";

export const productListPage = async (req, res) => {
  let {
    search = "",
    page = 1,
    minPrice,
    maxPrice,
    category,
    sortBy,
  } = req.query;

  page = Number(page);
  minPrice = minPrice !== undefined ? Number(minPrice) : null;
  maxPrice = maxPrice !== undefined ? Number(maxPrice) : null;

  const limit = 6;

  let categoryIds = [];

  if (category) {
    if (!Array.isArray(category)) category = [category];
    categoryIds = ArrayStringsToObjectId(category);
  }

  const productList = await userProductServices.getAllProducts({
    search,
    page,
    limit,
    categoryIds,
    minPrice,
    maxPrice,
    sortBy,
    userId: req.user?._id || null,
  });

  const totalPages = Math.ceil(productList.total / limit);

  const categories = await getAvailableCategories();

  const skip = (page - 1) * limit >= 0 ? (page - 1) * limit : 0;

  const viewData = {
    products: productList.products,
    searchValue: search,
    currentPage: page,
    totalPages,
    totalProducts: productList.total,
    categories,
    minPrice,
    maxPrice,
    skip,
    sortBy,
    selectedCategoryIds: category || [],
  };

  res.render("user/product.list.page.ejs", viewData);
};

export const productDetailsPage = async (req, res) => {
  const productId = req.params.productId || "";

  try {
    const product = await userProductServices.getProductDetails(
      productId,
      req.user?._id || null,
    );

    const relatedProducts = await userProductServices.getRelatedProducts(
      product.categoryId,
      product._id,
      req.user?._id || null,
    );

    res.render("user/product.details.ejs", { product, relatedProducts });
  } catch (err) {
    req.flash("error", err.message);
    console.log(err);
    res.redirect(`/products/${productId}/not-found`);
  }
};

export const productNotAvailablePage = (req, res) => {
  res.render("success-or-error", {
    status: "error",
    message: req.flash("error"),
    returnLocation: "back",
    returnLink: "javascript:history.back()",
  });
};
