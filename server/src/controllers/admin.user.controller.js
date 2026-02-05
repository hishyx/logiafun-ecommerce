import {
  getAdminUsersService,
  blockOrUnblockUserToggle,
} from "../services/admin.user.services.js";

export const adminUserListPage = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 7,
      search = "",
      sort = "latest",
      filter = "all",
    } = req.query;

    page = Number(page);
    limit = Number(limit);

    const userList = await getAdminUsersService(
      page,
      limit,
      search,
      sort,
      filter,
    );

    res.render("admin/admin.users.ejs", {
      users: userList.users,
      total: userList.total,
      page,
      limit,
      search,
      sort,
      filter,
      totalPages: Math.ceil(userList.total / limit),
    });
  } catch (err) {
    console.error("adminUserListPage error:", err);

    res.status(500).render("error/500"); // or simple res.send
  }
};

// export const getAdminUsers = async (req, res) => {
//   try {
//     let {
//       page = 1,
//       limit = 10,
//       search = "",
//       sort = "latest",
//       filter = "all",
//     } = req.query;

//     const userList = await getAdminUsersService(
//       page,
//       limit,
//       search,
//       sort,
//       filter,
//     );

//     res.json({
//       userList,
//     });
//   } catch (err) {
//     console.error("getAdminUsers error:", err);
//     res.status(500).json({ message: "Failed to fetch users" });
//   }
// };

export const blockUnblockUser = async (req, res) => {
  try {
    const user = await blockOrUnblockUserToggle(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: user.isBlocked
        ? "User blocked successfully"
        : "User unblocked successfully",
      data: {
        _id: user._id,
        isBlocked: user.isBlocked,
      },
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating user status",
    });
  }
};
