import mongoose from "mongoose";

const wishlistItemsSchema = mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Product",
    },
    variantId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    addedAt: {
        type: Date,
        default: Date.now,
    },
});

const wishlistSchema = mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
        items: [wishlistItemsSchema],
    },
    { timestamps: true },
);

const Wishlist = mongoose.model("Wishlist", wishlistSchema);

export default Wishlist;
