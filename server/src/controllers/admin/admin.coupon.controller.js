import * as adminCouponServices from "../../services/admin/admin.coupon.service.js";

export const adminCouponListPage = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      search = "",
      filter = "all",
      sort = "latest",
    } = req.query;

    page = Number(page);
    limit = Number(limit);

    const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const couponsData = await adminCouponServices.getAllCoupons({
      page,
      limit,
      search: safeSearch,
      sort,
      filter,
    });

    const totalPages = Math.ceil(couponsData.total / limit);

    res.render("admin/admin.coupons.ejs", {
      ...couponsData,
      search,
      filter,
      sort,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error("Error in adminCouponListPage:", error);
    res.status(500).render("500-internal-server-error");
  }
};

export const addCoupon = async (req, res) => {
  try {
    const couponData = req.body;

    console.log("Creating coupon with data:", couponData);

    const coupon = await adminCouponServices.createCoupon(couponData);

    return res
      .status(201)
      .json({ success: true, message: "Coupon created successfully!" });
  } catch (error) {
    console.error("Error in addCoupon:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to create coupon" });
  }
};

export const editCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;
    const couponData = req.body;

    const coupon = await adminCouponServices.editCoupon(couponId, couponData);
    console.log("Updated coupon with data:", couponData);

    return res
      .status(200)
      .json({ success: true, message: "Coupon updated successfully!", coupon });
  } catch (error) {
    console.error("Error in editCoupon:", error);
    return res
      .status(500)
      .json({ success: false, message: error.message || "Failed to update coupon" });
  }
};

export const toggleCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;
    const { coupon, action } = await adminCouponServices.toggleCouponStatus(couponId);

    return res.status(200).json({
      success: true,
      message: `Coupon ${action}d successfully.`,
      coupon
    });
  } catch (error) {
    console.error("Error in toggleCoupon:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to toggle coupon status." });
  }
};
