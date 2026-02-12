import * as categoryServices from "../../services/admin/admin.category.services.js";
import uploadImageToCloudinary from "../../utils/cloudinary.upload.js";

export const adminCategoryListPage = async (req, res) => {
  const categories = await categoryServices.getProductCategories();
  res.render("admin/admin.categories.ejs", {
    categories,
  });
};

export const addCategory = async (req, res) => {
  try {
    const categoryInfo = {
      name: req.body.name,
      description: req.body.description,
      thumbnail: req.file || null,
    };

    const newCategory = await categoryServices.addCategory(categoryInfo);

    res.status(201).json({
      message: "Category added successfully",
      category: newCategory,
    });
  } catch (error) {
    console.error("Error adding category:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const listUnlistCategory = async (req, res) => {
  try {
    const result = await categoryServices.toggleListUnlistCategory(
      req.params.categoryId,
    );

    return res.status(200).json({
      category: result,
    });
  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
};

export const editCategory = async (req, res) => {
  try {
    const updatedCategory = await categoryServices.updateCategory(
      req.params.categoryId,
      {
        name: req.body.name,
        description: req.body.description,
        thumbnail: req.file,
      },
    );

    return res.json({
      category: updatedCategory,
    });
  } catch (err) {
    console.log(err);
    return res.status(400).json({ message: err.message });
  }
};
