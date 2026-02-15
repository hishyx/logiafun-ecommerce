import User from "../../models/user.model.js";

export const getAdminUsersService = async ({
  page,
  limit,
  search,
  sort,
  filter,
}) => {
  page = parseInt(page);
  limit = parseInt(limit);

  const skip = (page - 1) * limit;

  const query = { role: "user" };

  // search
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  //  filter
  if (filter === "active") {
    query.isBlocked = false;
  }

  if (filter === "blocked") {
    query.isBlocked = true;
  }

  //  sort
  let sortQuery = { createdAt: -1 };

  if (sort === "oldest") sortQuery = { createdAt: 1 };
  if (sort === "name_asc") sortQuery = { name: 1 };
  if (sort === "name_desc") sortQuery = { name: -1 };

  const [users, total] = await Promise.all([
    User.find(query)
      .select("-password -googleId")
      .sort(sortQuery)
      .skip(skip)
      .limit(limit)
      .lean(),

    User.countDocuments(query),
  ]);

  return {
    users,
    total,
  };
};

export const blockOrUnblockUserToggle = async (userId) => {
  const user = await User.findOneAndUpdate(
    { _id: userId, role: "user" },
    [{ $set: { isBlocked: { $not: "$isBlocked" } } }],
    { new: true, updatePipeline: true },
  );

  return user;
};
