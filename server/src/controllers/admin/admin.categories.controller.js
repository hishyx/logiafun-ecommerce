import * as categoryServices from "../../services/admin/admin.category.services.js";
import uploadImageToCloudinary from "../../utils/cloudinary.upload.js";
import * as statusCodes from "../../constants/statusCodes.js";
import * as messages from "../../constants/messages.js";

export const adminCategoryListPage = async (req, res) => {
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

    const categoriesList = await categoryServices.getProductCategories({
      page,
      limit,
      search: safeSearch,
      sort,
      filter,
    });

    res.render("admin/admin.categories.ejs", {
      ...categoriesList,
      search,
      filter,
      sort,
      page,
      limit,
      totalPages: Math.ceil(categoriesList.total / limit),
    });
  } catch (err) {
    console.log(err);
  }
};

export const addCategory = async (req, res) => {
  try {
    const categoryInfo = {
      name: req.body.name,
      description: req.body.description,
      thumbnail: req.file || null,
    };

    const newCategory = await categoryServices.addCategory(categoryInfo);

    res.status(statusCodes.CREATED).json({
      message: messages.CATEGORY_ADDED,
      category: newCategory,
    });
  } catch (error) {
    console.error("Error adding category:", error);
    res.status(statusCodes.BAD_REQUEST).json({
      success: false,
      message: error.message || messages.ERROR
    });
  }
};

export const listUnlistCategory = async (req, res) => {
  try {
    const result = await categoryServices.toggleListUnlistCategory(
      req.params.categoryId,
    );

    return res.status(statusCodes.OK).json({
      category: result,
    });
  } catch (err) {
    res.status(statusCodes.BAD_REQUEST).json({
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
    return res.status(statusCodes.BAD_REQUEST).json({ message: err.message });
  }
};
