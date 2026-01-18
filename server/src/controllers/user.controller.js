export const homePage = (req, res) => {
  res.render("home.ejs", {
    name: req.user.name,
    profilePic: req.user.profileImage,
  });
};
