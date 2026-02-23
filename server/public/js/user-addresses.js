//Functions

function appendAddressCard(address) {
  const container = document.querySelector(".addresses-grid");

  const div = document.createElement("div");
  div.className = `address-card ${address.isDefault ? "default" : ""}`;
  div.dataset.id = address._id; // ✅ card level id

  div.innerHTML = `
  ${address.isDefault
      ? `<span class="address-type-badge">${address.addressName}(Default)</span>`
      : `<span class="address-type-badge">${address.addressName}</span>`
    }

  <div class="address-details">

    <span class="address-name">${address.name}</span><br>

    <span class="address-street">${address.street}</span><br>

    <span class="address-city">${address.city}</span> -
    <span class="address-pincode">${address.pincode}</span><br>

    Phone:
    <span class="address-phone">${address.phone}</span>
  </div>

  <div class="address-actions">
    <button class="btn-link edit-btn" data-id="${address._id}">
      Edit
    </button>

    ${address.isDefault
      ? ""
      : `
          <button class="btn-link default-btn" data-id="${address._id}">
            Set as Default
          </button>

          <button class="btn-link delete-btn" data-id="${address._id}">
            Delete
          </button>
        `
    }
  </div>
`;

  container.appendChild(div);
}

function updateAddressCard(address) {
  const card = document.querySelector(
    `.address-card[data-id="${address._id}"]`,
  );

  if (!card) return;

  // update badge (address name + default tag is handled elsewhere)
  const badge = card.querySelector(".address-type-badge");
  if (badge) {
    badge.textContent = address.isDefault
      ? `${address.addressName} (Default)`
      : address.addressName;
  }

  // person name
  card.querySelector(".address-name").textContent = address.name;
  card.querySelector(".address-street").textContent = address.street;
  card.querySelector(".address-city").textContent = address.city;
  card.querySelector(".address-pincode").textContent = address.pincode;
  card.querySelector(".address-phone").textContent = address.phone;
}

document.addEventListener("DOMContentLoaded", () => {
  // --- Add Address Modal ---
  const addAddressModal = document.getElementById("addAddressModal");
  const openAddModalBtn = document.querySelector(".add-address-card"); // The big "Add Address" card
  const headerAddBtn = document.querySelector(".profile-header .btn-secondary"); // The button in header
  const closeAddModalBtn = document.getElementById("closeAddModal");

  function openAddModal() {
    addAddressModal.classList.add("active");
  }

  function closeAddModal() {
    if (addForm) {
      addForm.reset(); // 👈 clear all fields
    }
    addAddressModal.classList.remove("active");
  }

  if (openAddModalBtn) openAddModalBtn.addEventListener("click", openAddModal);
  if (headerAddBtn) headerAddBtn.addEventListener("click", openAddModal);
  if (closeAddModalBtn)
    closeAddModalBtn.addEventListener("click", closeAddModal);

  // --- Edit Address Modal ---
  const editAddressModal = document.getElementById("editAddressModal");
  const closeEditModalBtn = document.getElementById("closeEditModal");
  // Selector logic handled in loop below to avoid :contains error

  function openEditModal() {
    editAddressModal.classList.add("active");
  }

  function closeEditModal() {
    editAddressModal.classList.remove("active");
  }

  if (closeEditModalBtn)
    closeEditModalBtn.addEventListener("click", closeEditModal);

  // --- Delete Confirmation Modal ---
  const deleteModal = document.getElementById("deleteConfirmationModal");
  const closeDeleteModalBtn = document.getElementById("closeDeleteModal");
  const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

  function openDeleteModal() {
    deleteModal.classList.add("active");
  }

  function closeDeleteModal() {
    deleteModal.classList.remove("active");
  }

  if (closeDeleteModalBtn)
    closeDeleteModalBtn.addEventListener("click", closeDeleteModal);
  if (cancelDeleteBtn)
    cancelDeleteBtn.addEventListener("click", closeDeleteModal);

  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", async () => {
      const addressId = confirmDeleteBtn.dataset.id;

      const res = await fetch(`/user/addresses/${addressId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        const card = document.querySelector(
          `.address-card[data-id="${addressId}"]`,
        );
        if (card) card.remove();
      }

      closeDeleteModal();
    });
  }

  // --- Set Default Confirmation Modal ---
  const defaultModal = document.getElementById("defaultConfirmationModal");
  const closeDefaultModalBtn = document.getElementById("closeDefaultModal");
  const cancelDefaultBtn = document.getElementById("cancelDefaultBtn");
  const confirmDefaultBtn = document.getElementById("confirmDefaultBtn");

  function openDefaultModal() {
    defaultModal.classList.add("active");
  }

  function closeDefaultModal() {
    defaultModal.classList.remove("active");
  }

  if (closeDefaultModalBtn)
    closeDefaultModalBtn.addEventListener("click", closeDefaultModal);
  if (cancelDefaultBtn)
    cancelDefaultBtn.addEventListener("click", closeDefaultModal);

  if (confirmDefaultBtn) {
    confirmDefaultBtn.addEventListener("click", async () => {
      const addressId = confirmDefaultBtn.dataset.id;
      if (!addressId) return;

      confirmDefaultBtn.disabled = true;

      try {
        const res = await fetch(`/addresses/${addressId}/default`, {
          method: "PATCH",
        });

        if (!res.ok) {
          throw new Error("Failed");
        }

        closeDefaultModal();

        // clean solution for your EJS app
        window.location.reload();
      } catch (err) {
        console.error(err);
        alert("Failed to set default address");
        confirmDefaultBtn.disabled = false;
      }
    });
  }

  // --- Close modals when clicking outside ---
  window.addEventListener("click", (e) => {
    if (e.target === addAddressModal) closeAddModal();
    if (e.target === editAddressModal) closeEditModal();
    if (e.target === deleteModal) closeDeleteModal();
    if (e.target === defaultModal) closeDefaultModal();
  });

  // --- Handle Forms ---
  const addForm = document.getElementById("addAddressForm");

  if (addForm) {
    addForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // RUN VALIDATION
      if (typeof FormValidator !== 'undefined' && !FormValidator.validateForm(addForm)) {
        return;
      }

      console.log("Add address form submitted");

      const formData = new FormData(addForm);
      const dataOfForm = Object.fromEntries(formData.entries());

      const res = await fetch("/user/addresses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataOfForm),
      });

      const data = await res.json();

      console.log(data);

      appendAddressCard(data.address); // update UI only

      closeAddModal();
    });
  }

  const editForm = document.getElementById("editAddressForm");

  if (editForm) {
    editForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // RUN VALIDATION
      if (typeof FormValidator !== 'undefined' && !FormValidator.validateForm(editForm)) {
        return;
      }

      const addressId = editForm.dataset.id;

      const formData = new FormData(editForm);
      const dataOfForm = Object.fromEntries(formData.entries());

      const res = await fetch(`/user/addresses/${addressId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataOfForm),
      });

      const data = await res.json();

      if (data.address) {
        updateAddressCard(data.address);
        alert("Address updated successfully");
        closeEditModal();
      }
    });
  }

  //edit ,deafult,deleet

  document.addEventListener("click", (e) => {
    const deleteBtn = e.target.closest(".delete-btn");
    if (deleteBtn) {
      confirmDeleteBtn.dataset.id = deleteBtn.dataset.id;
      openDeleteModal();
      return;
    }

    const defaultBtn = e.target.closest(".default-btn");
    if (defaultBtn) {
      confirmDefaultBtn.dataset.id = defaultBtn.dataset.id;
      openDefaultModal();
      return;
    }

    const editBtn = e.target.closest(".edit-btn");
    if (editBtn) {
      const card = editBtn.closest(".address-card");

      editForm.dataset.id = editBtn.dataset.id;

      const badgeText = card
        .querySelector(".address-type-badge")
        .textContent.trim();

      editForm.querySelector('[name="addressName"]').value = badgeText
        .replace("(Default)", "")
        .trim();

      editForm.querySelector('[name="name"]').value = card
        .querySelector(".address-name")
        .textContent.trim();

      editForm.querySelector('[name="street"]').value = card
        .querySelector(".address-street")
        .textContent.trim();

      editForm.querySelector('[name="city"]').value = card
        .querySelector(".address-city")
        .textContent.trim();

      editForm.querySelector('[name="pincode"]').value = card
        .querySelector(".address-pincode")
        .textContent.trim();

      editForm.querySelector('[name="phone"]').value = card
        .querySelector(".address-phone")
        .textContent.trim();

      openEditModal();
      return;
    }
  });
});
