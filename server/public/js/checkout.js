const addAddressModal = document.getElementById("addAddressModal");
const editAddressModal = document.getElementById("editAddressModal");
const addAddressForm = document.getElementById("addAddressForm");
const editAddressForm = document.getElementById("editAddressForm");

function openAddModal() {
  addAddressModal.classList.add("active");
}

function closeAddModal() {
  addAddressForm.reset();
  addAddressModal.classList.remove("active");
}

function closeEditModal() {
  editAddressForm.reset();
  editAddressModal.classList.remove("active");
}

document.getElementById("closeAddModal").onclick = closeAddModal;
document.getElementById("closeEditModal").onclick = closeEditModal;

window.onclick = function (event) {
  if (event.target == addAddressModal) closeAddModal();
  if (event.target == editAddressModal) closeEditModal();
};

function openEditModalFromCard(id) {
  const card = document.querySelector(`.address-select-card[data-id="${id}"]`);
  if (!card) return;

  editAddressForm.dataset.id = id;
  editAddressForm.querySelector('[name="addressName"]').value = card
    .querySelector(".address-badge")
    .textContent.trim();
  editAddressForm.querySelector('[name="name"]').value = card
    .querySelector("strong")
    .textContent.trim();
  editAddressForm.querySelector('[name="street"]').value = card
    .querySelector(".address-street")
    .textContent.trim();
  editAddressForm.querySelector('[name="city"]').value = card
    .querySelector(".address-city")
    .textContent.trim();
  editAddressForm.querySelector('[name="pincode"]').value = card
    .querySelector(".address-pincode")
    .textContent.trim();
  editAddressForm.querySelector('[name="phone"]').value = card
    .querySelector(".address-phone")
    .textContent.trim();

  editAddressModal.classList.add("active");
}

addAddressForm.onsubmit = async (e) => {
  e.preventDefault();
  if (
    typeof FormValidator !== "undefined" &&
    !FormValidator.validateForm(addAddressForm)
  )
    return;

  const formData = new FormData(addAddressForm);
  const data = Object.fromEntries(formData.entries());

  try {
    const res = await fetch("/user/addresses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const result = await res.json();

    if (res.ok) {
      location.reload(); // Simplest way to reflect new address in checkout
    } else {
      showToast(result.message || "Failed to add address", "error");
    }
  } catch (err) {
    console.error(err);
  }
};

editAddressForm.onsubmit = async (e) => {
  e.preventDefault();
  if (
    typeof FormValidator !== "undefined" &&
    !FormValidator.validateForm(editAddressForm)
  )
    return;

  const id = editAddressForm.dataset.id;
  const formData = new FormData(editAddressForm);
  const data = Object.fromEntries(formData.entries());

  try {
    const res = await fetch(`/user/addresses/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (result.success || result.address) {
      location.reload();
    } else {
      showToast(result.message || "Failed to update address", "error");
    }
  } catch (err) {
    console.error(err);
  }
};
document.addEventListener("click", () => {
  document.querySelectorAll(".stock-reduction-badge").forEach((badge) => {
    badge.style.display = "none";
  });
});

async function placeOrder() {
  const selectedAddress = document
    .querySelector('input[name="selectedAddress"]:checked')
    ?.closest(".address-select-card")?.dataset.id;

  const paymentRadio = document.querySelector('input[name="payment"]:checked');
  const paymentMethod = paymentRadio?.value;

  if (!selectedAddress) {
    Swal.fire({
      icon: "warning",
      title: "Address Required",
      text: "Please add or select a shipping address before placing your order.",
      confirmButtonColor: "var(--primary)",
    });
    return;
  }

  if (paymentMethod === "wallet" && paymentRadio?.disabled) {
    Swal.fire({
      icon: "error",
      title: "Insufficient Wallet Balance",
      text: "You do not have enough funds in your wallet to cover this order.",
    });
    return;
  }

  const appliedCouponCard = document.querySelector(
    ".coupon-card.applied-coupon",
  );
  const couponId = appliedCouponCard
    ? appliedCouponCard
        .querySelector(".coupon-apply-btn")
        .getAttribute("onclick")
        .match(/'([^']+)'/)[1]
    : null;

  console.log(paymentMethod);

  const res = await fetch("/user/cart/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      selectedAddress,
      paymentMethod,
      couponId,
    }),
  });

  const result = await res.json();

  await placePaymentWithPopup(result);

  if (result.redirectUrl) {
    window.location.href = result.redirectUrl;
  } else {
    console.error(result.message);
  }
}

async function applyCoupon(couponId, element) {
  try {
    const res = await fetch(`/user/cart/checkout/${couponId}/toggle`, {
      method: "POST",
    });

    const result = await res.json();

    if (res.ok) {
      updateCheckoutAmount(result.newCalculations);

      // Remove applied state from all other coupons
      document.querySelectorAll(".coupon-card").forEach((card) => {
        card.classList.remove("applied-coupon");
        const btn = card.querySelector(".coupon-apply-btn");
        if (btn) btn.textContent = "Apply Coupon";
      });

      element.closest(".coupon-card").classList.add("applied-coupon");
      element.textContent = "Applied";
      showToast("Coupon applied successfully", "success");
    } else {
      showToast(result.message || "Failed to apply coupon", "error");
    }
  } catch (err) {
    console.log(err);
    showToast("Something went wrong while applying the coupon", "error");
  }
}

function updateCheckoutAmount(updatedAmount) {
  const priceCard = document.getElementById("order-summary-card");

  const discountPrice = priceCard.querySelector("#summary-discount span:last-child");
  const gstPrice = priceCard.querySelector("#summary-gst span:last-child");
  const totalPrice = priceCard.querySelector(".summary-total span:last-child");

  if (discountPrice) discountPrice.textContent = `₹${updatedAmount.discount}`;
  if (gstPrice) gstPrice.textContent = `₹${updatedAmount.gst || 0}`;
  if (totalPrice) totalPrice.textContent = `₹${updatedAmount.total}`;
}

function removeCoupon() {
  document.querySelectorAll(".coupon-card").forEach((card) => {
    card.classList.remove("applied-coupon");
    const btn = card.querySelector(".coupon-apply-btn");
    if (btn) btn.textContent = "Apply Coupon";
  });

  const priceCard = document.getElementById("order-summary-card");
  const originalDiscount = priceCard.getAttribute("data-original-discount");
  const originalTotal = priceCard.getAttribute("data-original-total");

  updateCheckoutAmount({
    discount: originalDiscount,
    total: originalTotal,
  });
}
