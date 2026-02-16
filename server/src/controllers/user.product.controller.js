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
