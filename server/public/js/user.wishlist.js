function showToast(message) {
  Toastify({
    text: message,
    duration: 3000,
    gravity: "top",
    position: "right",
    close: true,
  }).showToast();
}

async function removeFromWishlist(e, itemId, isCarted) {
  console.log(itemId);
  const response = await fetch(`/user/wishlist/${itemId.trim()}`, {
    method: "DELETE",
  });

  if (response.ok) {
    const result = await response.json();

    // Update Header Count
    // Removed as requested

    // Remove row

    if (isCarted) {
      const row = e;
      if (row) {
        row.remove();

        // If wishlist is empty, reload to show empty secion
        if (result.wishlistCount === 0) {
          location.reload();
        }
      }
    } else {
      showToast("Item removed from wishlist");
    }
    const btn =
      e.target.closest(".remove-wishlist-item-btn") ||
      e.target.closest(".remove-btn");
    if (btn) {
      const row = btn.closest(".wishlist-item");
      if (row) {
        row.remove();

        // If wishlist is empty, reload to show empty state
        if (result.wishlistCount === 0) {
          location.reload();
        }
      }
    }
  } else {
    console.log("Something went wrong");
    showToast("Failed to remove item");
  }
}

async function addToCartFromWishList(e) {
  const productId = e.target.dataset.productId;
  const variantId = e.target.dataset.variantId;
  const quantity = 1;

  const addToCartRes = await fetch("/user/cart", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      productId,
      variantId,
      quantity,
    }),
  });

  const addToCartResult = await addToCartRes.json();
  console.log(addToCartResult.message);

  if (addToCartRes.ok) {
    showToast(addToCartResult.message);
    const badge = document.querySelector(".cart-badge");
    if (badge && addToCartResult.cartCount !== undefined) {
      badge.innerText = addToCartResult.cartCount;
    }
  } else {
    showToast(addToCartResult.message);
  }

  const wishListItem = document.getElementById("wishlist-item");

  const itemId = wishListItem.dataset.itemId;

  removeFromWishlist(wishListItem, itemId, true);
}
