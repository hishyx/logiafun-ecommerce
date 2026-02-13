const modal = document.getElementById("addCategoryModal");
const cropperModal = document.getElementById("cropperModal");
const imagePreview = document.getElementById("imagePreview");
const uploadIcon = document.querySelector(".upload-icon");
const uploadText = document.querySelector(".upload-text");
const fileInput = document.querySelector('input[name="image"]');

let cropper = null;
let croppedBlob = null;

function openModal() {
  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modal.classList.remove("active");
  document.body.style.overflow = "auto";
  // Reset form
  setTimeout(() => {
    const form = document.getElementById("addCategoryForm");
    form.reset();
    resetPreview();
    croppedBlob = null;
  }, 300);
}

function resetPreview() {
  imagePreview.style.display = "none";
  imagePreview.src = "#";
  uploadIcon.style.display = "block";
  uploadText.style.display = "block";
}

// Close modal when clicking outside
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    closeModal();
  }
});

// Handle file selection
fileInput.addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (!file) return;

  // Validation
  if (!file.type.startsWith("image/")) {
    Swal.fire("Error", "Please select an image file", "error");
    this.value = "";
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    // 5MB
    Swal.fire("Error", "Image size should be less than 5MB", "error");
    this.value = "";
    return;
  }

  // Open Cropper
  const reader = new FileReader();
  reader.onload = function (e) {
    document.getElementById("cropperImage").src = e.target.result;
    openCropperModal();
  };
  reader.readAsDataURL(file);
});

function openCropperModal() {
  cropperModal.classList.add("active");
  const image = document.getElementById("cropperImage");
  if (cropper) {
    cropper.destroy();
  }
  cropper = new Cropper(image, {
    aspectRatio: 1, // Square for category
    viewMode: 1,
  });
}

function closeCropperModal() {
  cropperModal.classList.remove("active");
  if (cropper) {
    cropper.destroy();
    cropper = null;
  }
  // If no cropped image, clear input
  if (!croppedBlob) {
    fileInput.value = "";
    resetPreview();
  }
}

function cropImage() {
  if (!cropper) return;

  cropper
    .getCroppedCanvas({
      width: 300,
      height: 300,
    })
    .toBlob(
      (blob) => {
        croppedBlob = blob;

        // Show preview
        const url = URL.createObjectURL(blob);
        imagePreview.src = url;
        imagePreview.style.display = "block";
        uploadIcon.style.display = "none";
        uploadText.style.display = "none";

        closeCropperModal();
      },
      "image/jpeg",
      0.9,
    );
}

// Don't use the old previewImage function as we use cropper now
function previewImage(input) {
  // Kept for compatibility if needed, but logic moved to event listener
}

// Edit Modal Variables
const editModal = document.getElementById("editCategoryModal");
const editImagePreview = document.getElementById("editImagePreview");
const editFileInput = document.getElementById("editImageInput");
const editFileUploadWrapper = document.getElementById("editFileUploadWrapper");
const editUploadIcon = editFileUploadWrapper?.querySelector(".upload-icon");
const editUploadText = editFileUploadWrapper?.querySelector(".upload-text");

// Functions for Edit Category Modal
function openEditModal(category) {
  editModal.classList.add("active");
  document.body.style.overflow = "hidden";

  // Populate form fields
  const form = document.getElementById("editCategoryForm");
  document.getElementById("editCategoryId").value = category.id;
  document.getElementById("editCategoryName").value = category.name;
  document.getElementById("editCategoryDescription").value =
    category.description || "";

  // Set initial image preview
  if (category.thumbnail) {
    editImagePreview.src = category.thumbnail;
    editImagePreview.style.display = "block";
    if (editUploadIcon) editUploadIcon.style.display = "none";
    if (editUploadText) editUploadText.style.display = "none";
  } else {
    resetEditPreview();
  }
}

function closeEditModal() {
  editModal.classList.remove("active");
  document.body.style.overflow = "auto";
  setTimeout(() => {
    document.getElementById("editCategoryForm").reset();
    resetEditPreview();
  }, 300);
}

function resetEditPreview() {
  editImagePreview.style.display = "none";
  editImagePreview.src = "#";
  if (editUploadIcon) editUploadIcon.style.display = "block";
  if (editUploadText) editUploadText.style.display = "block";
  editFileInput.value = "";
}

// Close edit modal when clicking outside
if (editModal) {
  editModal.addEventListener("click", (e) => {
    if (e.target === editModal) {
      closeEditModal();
    }
  });

  // Handle file selection for edit form
  editFileInput.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      Swal.fire("Error", "Please select an image file", "error");
      this.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      editImagePreview.src = e.target.result;
      editImagePreview.style.display = "block";
      if (editUploadIcon) editUploadIcon.style.display = "none";
      if (editUploadText) editUploadText.style.display = "none";
    };
    reader.readAsDataURL(file);
  });
}

// Event Delegation for Category Toggle & Edit
document.querySelector("tbody").addEventListener("click", async function (e) {
  // Toggle Logic
  const toggleBtn = e.target.closest(".toggle-category-btn");
  if (toggleBtn) {
    const id = toggleBtn.dataset.id;
    const currentActive = toggleBtn.dataset.active === "true";
    const action = currentActive ? "unlist" : "list";

    const result = await Swal.fire({
      title: `Are you sure?`,
      text: `Do you want to ${action} this category?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: currentActive ? "#ef4444" : "#10b981",
      cancelButtonColor: "#64748b",
      confirmButtonText: `Yes, ${action} it!`,
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`/admin/categories/${id}/toggle`, {
        method: "PATCH",
      });

      const data = await response.json();

      if (response.ok) {
        // Update Local DOM State
        const newStatus = !currentActive;
        toggleBtn.dataset.active = newStatus;
        toggleBtn.title = newStatus ? "Unlist" : "List";
        toggleBtn.style.color = newStatus ? "#ef4444" : "#10b981";

        const icon = toggleBtn.querySelector("i");
        icon.className = `fa-solid ${newStatus ? "fa-eye-slash" : "fa-eye"}`;

        // Update Status Badge
        const row = toggleBtn.closest("tr");
        const statusCell = row.cells[4];

        if (statusCell) {
          statusCell.innerHTML = newStatus
            ? `<span class="status-badge status-active"><span class="status-indicator"></span> Active</span>`
            : `<span class="status-badge status-blocked"><span class="status-indicator"></span> Inactive</span>`;
        }

        const Toast = Swal.mixin({
          toast: true,
          position: "bottom-end",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });

        Toast.fire({
          icon: "success",
          title: newStatus ? "Category listed" : "Category unlisted",
        });
      } else {
        Swal.fire(
          "Error",
          data.message || "Failed to update category",
          "error",
        );
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Something went wrong", "error");
    }
  }

  // Edit Logic
  const editBtn = e.target.closest(".edit-category-btn"); // More specific selector
  if (editBtn) {
    const id = editBtn.dataset.id;
    const name = editBtn.dataset.name;
    const description = editBtn.dataset.description;
    const thumbnail = editBtn.dataset.thumbnail;

    openEditModal({ id, name, description, thumbnail });
  }
});

async function submitCategory(event) {
  event.preventDefault();

  if (!croppedBlob) {
    Swal.fire("Error", "Please upload and crop an image", "error");
    return;
  }

  const form = event.target;
  const formData = new FormData(form);

  // Replace the file input with the cropped blob
  formData.set("image", croppedBlob, "category-image.jpg");

  const submitBtn = form.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.innerHTML;

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML =
      '<i class="fa-solid fa-spinner fa-spin"></i> Adding...';

    const response = await fetch("/admin/categories", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (response.ok) {
      addCategoryRow(data.category);
      closeModal();
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Category added successfully",
        showConfirmButton: false,
        timer: 3000,
      });
    } else {
      Swal.fire("Error", data.message || "Failed to add category", "error");
    }
  } catch (error) {
    console.error("Error:", error);
    Swal.fire("Error", "An error occurred while adding the category", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnText;
  }
}

async function submitEditCategory(event) {
  event.preventDefault();

  const form = event.target;
  const formData = new FormData(form);
  const id = formData.get("categoryId");

  const submitBtn = form.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.innerHTML;

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML =
      '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

    // Note: This endpoint likely doesn't exist on backend based on instructions
    const response = await fetch(`/admin/categories/${id}`, {
      method: "PATCH",
      body: formData,
    });

    // Check content type since backend might return HTML error page
    const contentType = response.headers.get("content-type");
    let data;
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      throw new Error("Backend endpoint unavailable");
    }

    if (response.ok) {
      Swal.fire({
        toast: true,
        position: "bottom-end",
        icon: "success",
        title: "Category updated successfully",
        showConfirmButton: false,
        timer: 3000,
      });

      // update the row in-place
      const row = document
        .querySelector(`.edit-category-btn[data-id="${id}"]`)
        ?.closest("tr");

      if (row && data.category) {
        row.querySelector(".product-info span").textContent =
          data.category.name;

        const editBtn = row.querySelector(".edit-category-btn");
        editBtn.dataset.name = data.category.name;
        editBtn.dataset.description = data.category.description || "";

        if (data.category.thumbnail) {
          row.querySelector(".product-img").src = data.category.thumbnail;
          editBtn.dataset.thumbnail = data.category.thumbnail;
        }
      }

      closeEditModal();
    } else {
      Swal.fire("Error", data.message || "Failed to update category", "error");
    }
  } catch (error) {
    console.error("Error:", error);
    // User friendly message about limitation
    Swal.fire({
      icon: "error",
      title: "Update Failed",
      text: "Could not update category. (This feature requires backend support)",
    });
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnText;
  }
}

function addCategoryRow(category) {
  const tbody = document.querySelector("table.data-table tbody");
  const emptyState = document.getElementById("emptyState");
  if (emptyState) {
    emptyState.remove();
  }

  const tr = document.createElement("tr");
  tr.innerHTML = `
            <td>
                <div class="product-cell">
                    <img src="${category.thumbnail}" alt="Category" class="product-img" onerror="this.src='https://placehold.co/40x40'" />
                    <div class="product-info">
                        <span>${category.name}</span>
                        <small>ID: ${category._id}</small>
                    </div>
                </div>
            </td>
            <td>${category.description}</td>
            <td>${category.sold} Sold</td>
            <td>
                ${
                  category.stock > 10
                    ? `<span class="badge-stock stock-in">${category.stock} In Stock</span>`
                    : category.stock > 0
                      ? `<span class="badge-stock stock-low">${category.stock} Left</span>`
                      : `<span class="badge-stock stock-out">Out of Stock</span>`
                }
            </td>
            <td>
                ${
                  category.isActive
                    ? `<span class="status-badge status-active"><span class="status-indicator"></span> Active</span>`
                    : `<span class="status-badge status-blocked"><span class="status-indicator"></span> Inactive</span>`
                }
            </td>
            <td>
                <button class="action-btn edit-category-btn"
                          title="Edit"
                          data-id="${category._id}"
                          data-name="${category.name}"
                          data-description="${category.description}"
                          data-thumbnail="${category.thumbnail}">
                    <i class="fa-regular fa-pen-to-square"></i>
                </button>
                <button class="action-btn toggle-category-btn" 
                            title="${category.isActive ? "Unlist" : "List"}" 
                            data-id="${category._id}"
                            data-active="${category.isActive}"
                            style="color: ${category.isActive ? "#ef4444" : "#10b981"}">
                      <i class="fa-solid ${category.isActive ? "fa-eye-slash" : "fa-eye"}"></i>
                </button>
            </td>
        `;

  // Add animation class if you have one, or just prepend
  tr.style.animation = "fadeIn 0.5s ease";
  // tbody.insertBefore(tr, tbody.firstChild);
  tbody.append(tr);
}

//Pagination
