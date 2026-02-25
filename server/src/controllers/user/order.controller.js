export const orderFailedPage = (req, res) => {
    try {
        const message = req.query.message || "Something went wrong while placing your order.";

        return res.render("user/order.failed.ejs", {
            errorMessage: message
        });
    } catch (err) {
        console.log(err);
        res.status(500).send("Internal Server Error");
    }
};
