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
      alert(result.message || "Failed to add address");
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
      alert(result.message || "Failed to update address");
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

  const paymentMethod = document.querySelector(
    'input[name="payment"]:checked',
  )?.value;

  console.log(paymentMethod);

  const res = await fetch("/user/cart/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      selectedAddress,
      paymentMethod,
    }),
  });

  const result = await res.json();

  if (result.redirectUrl) {
    window.location.href = result.redirectUrl;
  } else {
    console.error(result.message);
  }
}
