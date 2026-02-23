import * as adminProductServices from "../../services/admin/admin.product.services.js";
import * as adminCategoryServices from "../../services/admin/admin.category.services.js";

export const adminProductListPage = async (req, res) => {
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

    const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const productsList = await adminProductServices.getAllProducts({
      page,
      limit,
      search: safeSearch,
      sort,
      filter,
    });

    const categories = await adminCategoryServices.getAvailableCategories();

    const totalPages = Math.ceil(productsList.total / limit);

    res.render("admin/admin.products.ejs", {
      ...productsList,
      categories,
      search,
      filter,
      sort,
      page,
      limit,
      totalPages,
    });
  } catch (err) {
    console.error("Error in adminProductListPage:", err);
    res.status(500).render("404-not-found");
  }
};

export const adminAddProductPage = async (req, res) => {
  try {
    const categories = await adminCategoryServices.getAvailableCategories();
    res.render("admin/add-product.ejs", { categories });
  } catch (err) {
    console.error("Error in adminAddProductPage:", err);
    res.status(500).render("404-not-found");
  }
};

export const adminEditProductPage = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await adminProductServices.getProductById(productId);
    const categories = await adminCategoryServices.getAvailableCategories();

    if (!product) {
      return res.status(404).render("404-not-found");
    }

    console.log(product);

    res.render("admin/edit-product.ejs", { product, categories });
  } catch (err) {
    console.error("Error in adminEditProductPage:", err);
    res.status(500).render("404-not-found");
  }
};

export const addProduct = async (req, res) => {
  try {
    const product = req.body;

    const newProduct = await adminProductServices.createProduct(
      product,
      req.files,
    );

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      product: newProduct,
    });
  } catch (error) {
    console.error("Error adding product:", error);
    // Return 400 for validation errors
    res.status(400).json({
      success: false,
      message: error.message || "Failed to add product",
    });
  }
};

export const editProduct = async (req, res) => {
  try {
    const newData = req.body;

    const updatedData = await adminProductServices.updateProduct(
      newData,
      req.files,
    );

    return res.json({
      success: true,
      message: "Product updated successfully",
      product: updatedData,
    });
  } catch (err) {
    console.log(err);
    return res.status(400).json({
      success: false,
      message: err.message || "Failed to update product",
    });
  }
};

export const listUnlistProduct = async (req, res) => {
  try {
    const result = await adminProductServices.toggleListUnlistProduct(
      req.params.productId,
    );

    return res.status(200).json({
      success: true,
      message: "Product status updated",
      product: result,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message || "Failed to toggle product status",
    });
  }
};
