import cloudinaryFolders from "../../components/cloudinary.folders.js";
import Category from "../../models/categories.model.js";
import uploadImageToCloudinary from "../../utils/cloudinary.upload.js";

export const getProductCategories = async ({
  page,
  limit,
  sort,
  search,
  filter,
}) => {
  page = parseInt(page);
  limit = parseInt(limit);

  const skip = (page - 1) * limit;

  const query = { name: { $regex: search, $options: "i" } };

  if (filter == "active") query.isActive = true;
  if (filter == "blocked") query.isActive = false;

  let sortQuery = { createdAt: -1 };

  if (sort === "oldest") sortQuery = { createdAt: 1 };
  if (sort === "name_asc") sortQuery = { name: 1 };
  if (sort === "name_desc") sortQuery = { name: -1 };

  const result = await Category.aggregate([
    { $match: query },
    {
      $facet: {
        categories: [
          { $sort: sortQuery },
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              password: 0,
              googleId: 0,
            },
          },
        ],

        total: [{ $count: "count" }],
      },
    },
  ]);

  const categories = result[0].categories;
  const total = result[0].total[0]?.count || 0;

  return {
    categories,
    total,
  };
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

export const getAvailableCategories = async () => {
  const categories = await Category.find({ isActive: true });

  return categories;
};
