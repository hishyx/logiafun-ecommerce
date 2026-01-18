export const homePage = (req, res) => {
  res.render("user/home.ejs", {
    user: req.user,
  });
};
