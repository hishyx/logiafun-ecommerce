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

  const limit = 4;

  //Filtering works

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
  });

  const totalPages = Math.ceil(productList.total / limit);

  const categories = await getAvailableCategories();

  const skip = (page - 1) * limit >= 0 ? (page - 1) * limit : 0;

  console.log(totalPages);

  console.log("SortBy : ", sortBy);
  console.log("Products : ", productList.products);

  res.render("user/product.list.page.ejs", {
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
  });
};

export const productDetailsPage = async (req, res) => {
  const productId = req.params.productId || "";

  try {
    const product = await userProductServices.getProductDetails(productId);
    const relatedProducts = await userProductServices.getRelatedProducts(
      product.categoryId,
      product._id,
    );

    console.log("the real product is : ".product);
    console.log("Related product is : ", relatedProducts);

    res.render("user/product.details.ejs", { product, relatedProducts });
  } catch (err) {
    // req.flash("error", err.message);
    req.flash("error", "Product not available or got blocked");
    res.redirect(`/products/:${productId}/not-found`);
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
