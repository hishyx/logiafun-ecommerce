const discountSummary = document.getElementById("discount");
const totalSummary = document.getElementById("total");
const subtotalSummary = document.getElementById("subtotal");

function showToast(message) {
  Toastify({
    text: message,
    duration: 3000,
    gravity: "top",
    position: "right",
    close: true,
  }).showToast();
}

async function removeFromCart(e, itemId) {
  console.log(itemId);
  console.log("Reached cliked");
  const response = await fetch(`/user/cart/${itemId.trim()}`, {
    method: "DELETE",
  });

  console.log(response);
  if (response.ok) {
    const result = await response.json();
    showToast("Item removed");

    if (result.cartCount === 0) {
      location.reload();
      return;
    }

    // Update DOM
    const badge = document.querySelector(".cart-badge");
    if (badge) badge.innerText = result.cartCount;

    // Remove row
    const btn = e.target.closest(".remove-btn");
    if (btn) {
      const row = btn.closest(".cart-item");
      if (row) row.remove();
    }

    // Update header count text
    const headerCount = document.querySelector(".cart-header p");
    if (headerCount)
      headerCount.innerText = `You have ${result.cartCount} items in your cart`;

    // Update summaries
    if (result.calculations) {
      const subtotalEl = document.getElementById("subtotal");
      const discountEl = document.getElementById("discount");
      const totalEl = document.getElementById("total");

      if (subtotalEl) subtotalEl.innerText = `₹${result.calculations.subtotal}`;
      if (discountEl) discountEl.innerText = `₹${result.calculations.discount}`;
      if (totalEl) totalEl.innerText = `₹${result.calculations.total}`;
    }
  } else {
    console.log("Something went wrong");
    showToast("Failed to remove item");
  }
}

//Cart related works

const addToCartButton = document.getElementById("addToCartBtn");
// const quantityBox = document.getElementById("qty-input");

if (addToCartButton) {
  addToCartButton.addEventListener("click", async (e) => {
    const activeVariant = getActiveVariant();

    if (!activeVariant) {
      showToast("Please select a valid variant option");
      return;
    }

    const productId = addToCartButton.dataset.productId;
    const variantId = activeVariant._id;
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
      console.log("Not added")
      showToast(addToCartResult.message);
    }
  });
}

// Quantity Update Logic

const quantityControls = document.querySelectorAll(".quantity-control");
let debounceTimer;

async function updateCartQuantity(itemId, change, inputElement) {
  let currentQuantity = parseInt(inputElement.value);
  let newQuantity = currentQuantity + change;

  if (newQuantity < 1) {
    return;
  }

  // Optimistic UI update
  inputElement.value = newQuantity;

  // Debounce API call
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    try {
      const response = await fetch(`/user/cart/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quantity: newQuantity,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Update summary
        document.getElementById("subtotal").innerText =
          `₹${result.calculations.subtotal}`;
        document.getElementById("discount").innerText =
          `₹${result.calculations.discount}`;
        document.getElementById("total").innerText =
          `₹${result.calculations.total}`;
        showToast("Cart updated");
      } else {
        showToast(result.message || "Failed to update cart");
        // Revert on failure
        inputElement.value = currentQuantity;
      }
    } catch (error) {
      console.error("Error updating cart:", error);
      showToast("Something went wrong");
      inputElement.value = currentQuantity;
    }
  }, 500); // 500ms debounce
}

quantityControls.forEach((control) => {
  const decreaseBtn = control.querySelector(".qty-btn"); // First one is decrease
  const increaseBtn = control.querySelectorAll(".qty-btn")[1]; // Second one is increase
  const input = control.querySelector(".qty-input");
  // The data-item-id is on the control div itself now
  const itemId = control.dataset.itemId;

  if (decreaseBtn && increaseBtn && input && itemId) {
    decreaseBtn.addEventListener("click", () =>
      updateCartQuantity(itemId, -1, input),
    );
    increaseBtn.addEventListener("click", () =>
      updateCartQuantity(itemId, 1, input),
    );
  }
});
