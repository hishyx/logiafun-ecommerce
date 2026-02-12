import cloudinaryFolders from "../../components/cloudinary.folders.js";
import Category from "../../models/categories.model.js";
import uploadImageToCloudinary from "../../utils/cloudinary.upload.js";

export const getProductCategories = async (req, res) => {
  const categories = await Category.find({});

  return categories;
};

export const addCategory = async (categoryInfo) => {
  const category = await Category.create({
    name: categoryInfo.name,
    description: categoryInfo.description,
    thumbnail: await uploadImageToCloudinary(categoryInfo.thumbnail),
  });

  return category;
};

export const toggleListUnlistCategory = async (categoryId) => {
  const category = await Category.findById(categoryId);

  if (!category) throw new Error("Category not found");

  category.isActive = category.isActive ? false : true;
  await category.save();

  return category;
};
export const updateCategory = async (categoryId, newData) => {
  const update = {
    name: newData.name,
    description: newData.description,
  };

  if (newData.thumbnail) {
    update.thumbnail = await uploadImageToCloudinary(
      newData.thumbnail,
      cloudinaryFolders.CATEGORY,
    );
  }

  const updatedCategory = await Category.findByIdAndUpdate(categoryId, update, {
    new: true,
  });

  return updatedCategory;
};
