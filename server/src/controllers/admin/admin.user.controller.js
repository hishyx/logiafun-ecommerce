import {
  getAdminUsersService,
  blockOrUnblockUserToggle,
} from "../../services/admin/admin.user.services.js";
import * as statusCodes from "../../constants/statusCodes.js";
import * as messages from "../../constants/messages.js";

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

    const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    console.log(safeSearch);
    const userList = await getAdminUsersService({
      page,
      limit,
      search: safeSearch,
      sort,
      filter,
    });

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

    res.status(statusCodes.INTERNAL_SERVER_ERROR).send(messages.ERROR); // or simple res.send
  }
};

export const blockUnblockUser = async (req, res) => {
  try {
    const user = await blockOrUnblockUserToggle(req.params.userId);

    if (!user) {
      return res.status(statusCodes.NOT_FOUND).json({
        success: false,
        message: messages.USER_NOT_FOUND,
      });
    }

    return res.status(statusCodes.OK).json({
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

    return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Something went wrong while updating user status",
    });
  }
};
