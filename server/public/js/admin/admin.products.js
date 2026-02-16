/**
 * Admin Products Management Script
 * Refactored for readability and modularity.
 */

document.addEventListener("DOMContentLoaded", () => {
  // ==========================================
  // 1. GLOBAL STATE
  // ==========================================
  const State = {
    // Stores File objects for uploading: key="mode-index", value=[File, File]
    images: new Map(),
    // Stores URLs of images to delete in Edit mode: key="mode-index", value=[url, url]
    existingImagesToDelete: new Map(),
    // Stores product-level attributes (e.g. ['Color', 'Size'])
    attributes: {
      add: [],
      edit: [],
    },
    // Counters for generating unique IDs for variants
    counters: {
      add: 0,
      edit: 0,
    },
    // Track current cropping session
    cropping: {
      mode: null,
      variantIndex: null,
      currentFile: null,
    },
  };

  let cropper = null;

  // ==========================================
  // 2. DOM UTILITIES
  // ==========================================
  const DOM = {
    get: (id) => document.getElementById(id),
    getAll: (selector) => document.querySelectorAll(selector),

    // Helper to create an element with class and innerHTML
    create: (tag, className, html) => {
      const el = document.createElement(tag);
      if (className) el.className = className;
      if (html) el.innerHTML = html;
      return el;
    },
  };

  // ==========================================
  // 3. MODAL MANAGEMENT
  // ==========================================
  const Modals = {
    open: (modal) => {
      if (typeof modal === "string") modal = DOM.get(modal);
      if (modal) modal.classList.add("active");
    },

    close: (modal) => {
      if (typeof modal === "string") modal = DOM.get(modal);
      if (modal) modal.classList.remove("active");
    },

    init: () => {
      // Close buttons
      DOM.getAll(".close-modal-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          const modal = btn.closest(".modal-overlay");
          Modals.close(modal);
        });
      });

      // Click outside to close
      window.addEventListener("click", (e) => {
        if (e.target.classList.contains("modal-overlay")) {
          Modals.close(e.target);
        }
      });

      // Special helper logic for Add Product button
      const addBtn = DOM.get("addProductBtn");
      if (addBtn) {
        addBtn.addEventListener("click", () => {
          State.attributes.add = [];
          State.images.clear();
          Attributes.render("add");
          // Reset logic could go here
          Modals.open("addProductModal");
        });
      }
    },
  };

  // ==========================================
  // 4. PRODUCT ATTRIBUTE LOGIC
  // ==========================================
  const Attributes = {
    add: (mode, name) => {
      if (!name) return;
      // Prevent duplicates
      if (State.attributes[mode].includes(name)) return;

      State.attributes[mode].push(name);
      Attributes.render(mode);
      Variants.syncAttributes(mode);
    },

    remove: (mode, index) => {
      State.attributes[mode].splice(index, 1);
      Attributes.render(mode);
      Variants.syncAttributes(mode);
    },

    render: (mode) => {
      const containerId =
        mode === "add" ? "addProductAttributes" : "editProductAttributes";
      const container = DOM.get(containerId);
      if (!container) return;

      container.innerHTML = "";
      State.attributes[mode].forEach((attr, i) => {
        // Use the new CSS class .attribute-badge
        const span = DOM.create(
          "span",
          "attribute-badge",
          `
            ${attr}
            <i class="fa-solid fa-times remove-prod-attr-btn" 
               data-mode="${mode}" 
               data-index="${i}"></i>
        `,
        );
        container.appendChild(span);
      });
    },

    init: () => {
      // Add Attribute Buttons
      ["add", "edit"].forEach((mode) => {
        const btn = DOM.get(`${mode}ProdAttrBtn`);
        const input = DOM.get(`${mode}AttrInput`);

        if (btn && input) {
          btn.addEventListener("click", () => {
            const val = input.value.trim();
            if (val) {
              Attributes.add(mode, val);
              input.value = "";
            }
          });
        }
      });

      // Remove Attribute (Delegation)
      document.addEventListener("click", (e) => {
        if (e.target.classList.contains("remove-prod-attr-btn")) {
          const { mode, index } = e.target.dataset;
          Attributes.remove(mode, parseInt(index));
        }
      });
    },
  };

  // ==========================================
  // 5. VARIANT LOGIC
  // ==========================================
  const Variants = {
    add: (mode, data = null) => {
      const index = State.counters[mode]++;
      const wrapperId =
        mode === "add" ? "addVariantsWrapper" : "editVariantsWrapper";
      const wrapper = DOM.get(wrapperId);

      // Initialize image state for this variant
      State.images.set(`${mode}-${index}`, []);

      const variantEl = DOM.create("div", "variant-item");
      variantEl.dataset.index = index;

      const price = data ? data.price : "";
      const stock = data ? data.stock : "";

      // Generate HTML
      const deleteBtnHTML =
        index > 0
          ? `<button type="button" class="remove-variant-btn" data-mode="${mode}" data-index="${index}">
             <i class="fa-solid fa-trash"></i>
           </button>`
          : "";

      const hiddenIdInput =
        data && data._id
          ? `<input type="hidden" name="variants[${index}][_id]" value="${data._id}">`
          : "";

      // Existing Images HTML (if editing)
      const existingImagesHTML =
        data && data.images
          ? Images.generateExistingPreviewsHTML(data.images, mode, index)
          : "";

      variantEl.innerHTML = `
        ${deleteBtnHTML}
        ${hiddenIdInput}
        
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 15px; margin-bottom: 15px; padding-right: 30px;">
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">Price</label>
            <input type="number" class="form-control" name="variants[${index}][price]" value="${price}" step="0.01" required placeholder="0.00">
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">Stock</label>
            <input type="number" class="form-control" name="variants[${index}][stock]" value="${stock}" required placeholder="0">
          </div>
          <!-- Dynamic Attribute Values Container -->
          <div class="variant-defined-attributes" style="display: contents;">
              <!-- Inserted by syncAttributes() later, 
                   but we can pre-populate if data exists to avoid flicker -->
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Images</label>
          <div class="image-upload-container" id="container-${mode}-${index}">
            <div class="existing-previews gap-2 flex flex-wrap mb-2" style="display: flex; gap: 10px; flex-wrap: wrap;">
               ${existingImagesHTML}
            </div>
            <div class="new-previews gap-2 flex flex-wrap mb-2" style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px;"></div>
            
            <input type="file" class="form-control file-selector" accept="image/*" data-index="${index}" data-mode="${mode}" style="margin-top: 10px;">
          </div>
        </div>
      `;

      wrapper.appendChild(variantEl);

      // Now sync attributes for this new row (and populate values if editing)
      Variants.syncSingleRow(variantEl, mode, data ? data.attributes : null);
    },

    remove: (btn) => {
      const variantItem = btn.closest(".variant-item");
      const { mode, index } = btn.dataset;
      const key = `${mode}-${index}`;

      State.images.delete(key);
      State.existingImagesToDelete.delete(key);
      variantItem.remove();
    },

    // Sync all rows
    syncAttributes: (mode) => {
      const wrapperId =
        mode === "add" ? "addVariantsWrapper" : "editVariantsWrapper";
      const rows = DOM.get(wrapperId).querySelectorAll(".variant-item");
      rows.forEach((row) => Variants.syncSingleRow(row, mode));
    },

    // Sync a single row updates inputs to match global attributes
    syncSingleRow: (row, mode, existingValues = null) => {
      const index = row.dataset.index;
      const container = row.querySelector(".variant-defined-attributes");

      // 1. Capture current values from inputs in DOM
      const currentVals = existingValues || {};
      if (!existingValues) {
        container.querySelectorAll("input").forEach((input) => {
          currentVals[input.dataset.attrKey] = input.value;
        });
      }

      // 2. Clear
      container.innerHTML = "";

      // 3. Re-render based on State.attributes
      State.attributes[mode].forEach((attr) => {
        const isAvailable = currentVals.hasOwnProperty(attr); // Was this val set?
        const val = isAvailable ? currentVals[attr] : "";

        const div = DOM.create("div", "form-group col-span-1");
        div.style.marginBottom = "0";
        div.innerHTML = `
             <label class="form-label" style="font-size: 0.8em; color: #64748b;">${attr}</label>
             <input type="text" class="form-control" 
                name="variants[${index}][values][${attr}]" 
                data-attr-key="${attr}"
                value="${val}" 
                placeholder="${attr} value" 
                required>
            `;
        container.appendChild(div);
      });
    },

    init: () => {
      // Add Variant Buttons
      ["add", "edit"].forEach((mode) => {
        const btn = DOM.get(
          `${mode === "add" ? "addVariantBtn" : "editAddVariantBtn"}`,
        );
        if (btn) btn.addEventListener("click", () => Variants.add(mode));
      });

      // Remove Variant (Delegation)
      document.addEventListener("click", (e) => {
        const btn = e.target.closest(".remove-variant-btn");
        if (btn) Variants.remove(btn);
      });

      // Initialize Add Form with one variant
      if (DOM.get("addVariantsWrapper")) {
        Variants.add("add");
      }
    },
  };

  // ==========================================
  // 6. CROPPER LOGIC
  // ==========================================
  const CropperManager = {
    init: () => {
      const cropBtn = DOM.get("cropImageBtn");
      if (cropBtn) {
        cropBtn.addEventListener("click", () => CropperManager.crop());
      }

      // Close cropper modal action
      const cropperModal = DOM.get("cropperModal");
      if (cropperModal) {
        const closeBtns = cropperModal.querySelectorAll(".close-modal-btn");
        closeBtns.forEach((btn) => {
          btn.addEventListener("click", () => CropperManager.close());
        });
      }
    },

    open: (file, mode, variantIndex) => {
      State.cropping.mode = mode;
      State.cropping.variantIndex = variantIndex;
      State.cropping.currentFile = file;

      const image = DOM.get("cropperImage");
      if (!image) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        image.src = e.target.result;

        // Open Modal manually
        const modal = DOM.get("cropperModal");
        if (modal) modal.classList.add("active");

        // Destroy existing
        if (cropper) {
          cropper.destroy();
        }

        // Init Cropper
        cropper = new Cropper(image, {
          aspectRatio: 1, // Fixed Square
          viewMode: 2, // Restrict crop box to not exceed canvas
          autoCropArea: 1,
          responsive: true,
          background: false, // Cleaner look
        });
      };
      reader.readAsDataURL(file);
    },

    close: () => {
      const modal = DOM.get("cropperModal");
      if (modal) modal.classList.remove("active");

      if (cropper) {
        cropper.destroy();
        cropper = null;
      }

      // Clear input state
      State.cropping = { mode: null, variantIndex: null, currentFile: null };
    },

    crop: () => {
      if (!cropper) return;

      cropper
        .getCroppedCanvas({
          // Optional limits can go here
        })
        .toBlob(
          (blob) => {
            if (!blob) return;

            const { mode, variantIndex, currentFile } = State.cropping;
            if (!mode || !variantIndex) return;

            const key = `${mode}-${variantIndex}`;

            if (!State.images.has(key)) State.images.set(key, []);

            // Reconstruct filename
            const originalName = currentFile ? currentFile.name : "image.jpg";
            const fileName = `cropped-${originalName}`;

            const croppedFile = new File([blob], fileName, {
              type: "image/jpeg",
            });

            State.images.get(key).push(croppedFile);

            Images.renderPreviews(mode, variantIndex);
            CropperManager.close();
          },
          "image/jpeg",
          0.9,
        );
    },
  };

  // ==========================================
  // 7. IMAGE MANAGEMENT LOGIC
  // ==========================================
  const Images = {
    handleSelect: (e) => {
      const input = e.target;
      const { mode, index } = input.dataset;

      if (input.files && input.files.length > 0) {
        const file = input.files[0];

        // Validate type
        if (!file.type.startsWith("image/")) {
          Swal.fire("Error", "Please select an image file", "error");
          input.value = "";
          return;
        }

        // Open Cropper instead of adding directly
        CropperManager.open(file, mode, index);
      }

      input.value = ""; // Clear input to allow re-selecting same file
    },

    remove: (btn) => {
      const { mode, variantIndex, imageType, index, url } = btn.dataset; // data-variant-index !!
      const key = `${mode}-${variantIndex}`;

      if (imageType === "new") {
        const images = State.images.get(key);
        if (images) {
          images.splice(parseInt(index), 1);
          Images.renderPreviews(mode, variantIndex);
        }
      } else if (imageType === "existing") {
        const deleteKey = `${mode}-${variantIndex}`;
        if (!State.existingImagesToDelete.has(deleteKey)) {
          State.existingImagesToDelete.set(deleteKey, []);
        }
        State.existingImagesToDelete.get(deleteKey).push(url);
        btn.closest(".variant-preview-item").remove(); // Remove from DOM
      }
    },

    renderPreviews: (mode, index) => {
      const key = `${mode}-${index}`;
      const wrapper = DOM.get(`container-${mode}-${index}`);
      if (!wrapper) return;
      const container = wrapper.querySelector(".new-previews");
      if (!container) return;

      const images = State.images.get(key) || [];
      container.innerHTML = "";

      images.forEach((file, i) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const div = DOM.create("div", "variant-preview-item");
          div.innerHTML = `
                <img src="${e.target.result}" alt="Preview">
                <button type="button" class="remove-image-btn"
                  data-mode="${mode}" 
                  data-variant-index="${index}" 
                  data-image-type="new" 
                  data-index="${i}">
                  <i class="fa-solid fa-times"></i>
                </button>
             `;
          container.appendChild(div);
        };
        reader.readAsDataURL(file);
      });
    },

    generateExistingPreviewsHTML: (images, mode, index) => {
      return images
        .map(
          (url) => `
        <div class="variant-preview-item">
            <img src="${url}" alt="Existing">
            <button type="button" class="remove-image-btn"
              data-mode="${mode}" 
              data-variant-index="${index}" 
              data-image-type="existing" 
              data-url="${url}">
              <i class="fa-solid fa-times"></i>
            </button>
        </div>
       `,
        )
        .join("");
    },

    init: () => {
      // File Selection (Delegation)
      document.addEventListener("change", (e) => {
        if (e.target.classList.contains("file-selector")) {
          Images.handleSelect(e);
        }
      });

      // Remove Image (Delegation)
      document.addEventListener("click", (e) => {
        const btn = e.target.closest(".remove-image-btn");
        if (btn) Images.remove(btn);
      });
    },
  };

  // ==========================================
  // 7. FORM SUBMISSION LOGIC
  // ==========================================
  const Validations = {
    validateProductForm: (formData, mode) => {
      const errors = [];

      // 1. Basic Fields
      const name = formData.get("name");
      const category = formData.get("categoryId");
      const description = formData.get("description");

      if (!name || name.trim() === "") errors.push("Product Name is required");
      if (!category || category === "") errors.push("Category is required");
      if (!description || description.trim() === "")
        errors.push("Description is required");

      // 2. Variants
      // We need to check how many variants are being submitted.
      // Since formData has keys like "variants[0][price]", we can extract indices.
      const variantIndices = new Set();
      for (const key of formData.keys()) {
        const match = key.match(/variants\[(\d+)\]/);
        if (match) variantIndices.add(match[1]);
      }

      if (variantIndices.size === 0) {
        errors.push("At least one variant is required");
      }

      variantIndices.forEach((index) => {
        const price = parseFloat(formData.get(`variants[${index}][price]`));
        const stock = parseFloat(formData.get(`variants[${index}][stock]`));

        if (isNaN(price) || price <= 0) {
          errors.push(
            `Variant ${parseInt(index) + 1}: Price must be greater than 0`,
          );
        }
        if (isNaN(stock) || stock < 0) {
          errors.push(
            `Variant ${parseInt(index) + 1}: Stock must be 0 or greater`,
          );
        }

        const key = `${mode}-${index}`;

        // 3. Images (Min 3)
        // We need to check State.images for NEW images
        // AND potentially existing images if in edit mode (though logic gets complex with deletions)
        // For 'add' mode, it's simple: check State.images.

        // Count total visible images in UI
        const container = document.querySelector(`#container-${mode}-${index}`);

        if (container) {
          const totalImages = container.querySelectorAll(
            ".variant-preview-item",
          ).length;

          if (totalImages < 3) {
            errors.push(
              `Variant ${parseInt(index) + 1}: Must have at least 3 images`,
            );
          }
        }

        // Check file types for new images
        if (State.images.has(key)) {
          const files = State.images.get(key);
          const validTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/jpg",
          ];
          files.forEach((file) => {
            if (!validTypes.includes(file.type)) {
              errors.push(
                `Variant ${parseInt(index) + 1}: Invalid file type ${file.name}. Only JPG, PNG, WEBP allowed.`,
              );
            }
          });
        }
      });

      return errors;
    },
  };

  const Forms = {
    submit: async (e, mode) => {
      e.preventDefault();
      const form = e.target;
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;

      // Prepare FormData first to pass to validation
      const formData = new FormData(form);

      // 1. Append Attributes (backend expects array of strings)
      State.attributes[mode].forEach((attr, i) => {
        formData.append(`attributes[${i}]`, attr);
      });

      // 2. Append New Images (needed for validation check on file types/counts if we were looking at formData, but we look at State)
      // We'll append them to formData AFTER validation to ensure we don't send invalid data,
      // BUT our validation function typically inspects State for images anyway.

      // Run Validation
      const validationErrors = Validations.validateProductForm(formData, mode);

      if (validationErrors.length > 0) {
        Swal.fire({
          title: "Validation Error",
          html: validationErrors.join("<br>"),
          icon: "error",
        });
        return;
      }

      // Loading State
      submitBtn.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
      submitBtn.disabled = true;

      try {
        // formData already created above

        // 2. Append New Images (Now we actually append them for sending)
        for (const [key, files] of State.images) {
          if (key.startsWith(`${mode}-`)) {
            const index = key.split("-")[1];
            files.forEach((file) => {
              formData.append(`variants[${index}][images]`, file);
            });
          }
        }

        // 3. Append Deleted Images (Edit mode only)
        if (mode === "edit") {
          for (const [key, urls] of State.existingImagesToDelete) {
            if (key.startsWith(`${mode}-`)) {
              const index = key.split("-")[1];
              urls.forEach((url) => {
                formData.append(`variants[${index}][deletedImages][]`, url);
              });
            }
          }
        }

        // Submit
        const action = form.getAttribute("action");
        const method = form.getAttribute("method");

        const response = await fetch(action, {
          method,
          body: formData,
        });

        const data = await response.json();

        if (response.ok) {
          if (mode === "add") {
            // Add new row
            addProductRow(data.product);
            Modals.close("addProductModal");
            Swal.fire({
              toast: true,
              position: "top-end",
              icon: "success",
              title: "Product added successfully",
              showConfirmButton: false,
              timer: 3000,
            });
          } else {
            // Update existing row
            updateProductRow(data.product);
            Modals.close("editProductModal");
            Swal.fire({
              toast: true,
              position: "bottom-end",
              icon: "success",
              title: "Product updated successfully",
              showConfirmButton: false,
              timer: 3000,
            });
          }
        } else {
          // THROW ERROR TO BE CAUGHT BELOW
          throw new Error(data.message || "Failed to save product");
        }
      } catch (err) {
        console.error(err);
        // DISPLAY ERROR TO USER
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err.message || "An unexpected error occurred",
        });
      } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    },

    init: () => {
      const addForm = DOM.get("addProductForm");
      if (addForm)
        addForm.addEventListener("submit", (e) => Forms.submit(e, "add"));

      const editForm = DOM.get("editProductForm");
      if (editForm)
        editForm.addEventListener("submit", (e) => Forms.submit(e, "edit"));

      // Init Cropper
      if (typeof CropperManager !== "undefined") {
        CropperManager.init();
      }
    },
  };

  // ==========================================
  // 11. DYNAMIC UI UPDATES (Replicated from Categories)
  // ==========================================

  function addProductRow(product) {
    const tbody = document.querySelector("table.data-table tbody");
    const emptyState = document.getElementById("emptyState");
    if (emptyState) {
      emptyState.style.display = "none";
    }

    const tr = document.createElement("tr");
    tr.innerHTML = generateProductRowHTML(product);
    tr.style.animation = "fadeIn 0.5s ease";

    // Insert at top
    tbody.insertBefore(tr, tbody.firstChild);
  }

  function updateProductRow(product) {
    const editBtn = document.querySelector(
      `.edit-product-btn[data-id="${product._id}"]`,
    );
    if (!editBtn) return;

    const row = editBtn.closest("tr");

    const imgParam =
      product.variants &&
      product.variants.length > 0 &&
      product.variants[0].images &&
      product.variants[0].images.length > 0
        ? product.variants[0].images[0]
        : "https://placehold.co/40x40";

    const catName = product.category
      ? product.category.name || "Uncategorized"
      : "Uncategorized";

    const priceText =
      product.variants && product.variants.length > 0
        ? `$${Number(product.variants[0].price).toFixed(2)}`
        : "-";

    const totalStock = product.variants
      ? product.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
      : 0;

    let stockHTML = "";
    if (totalStock > 10) {
      stockHTML = `<span class="badge-stock stock-in">${totalStock} In Stock</span>`;
    } else if (totalStock > 0) {
      stockHTML = `<span class="badge-stock stock-low">${totalStock} Left</span>`;
    } else {
      stockHTML = `<span class="badge-stock stock-out">Out of Stock</span>`;
    }

    // 0 → Product column
    row.querySelector(".product-img").src = imgParam;
    row.querySelector(".product-info span").textContent = product.name;
    row.querySelector(".product-info small").textContent = catName;

    // 1 → Category
    row.cells[1].textContent = catName;

    // 2 → Price
    row.cells[2].textContent = priceText;

    // 3 → Stock
    row.cells[3].innerHTML = stockHTML;

    // 4 → Status
    row.cells[4].innerHTML = product.isActive
      ? `<span class="status-badge status-active"><span class="status-indicator"></span> Active</span>`
      : `<span class="status-badge status-blocked"><span class="status-indicator"></span> Inactive</span>`;

    // 5 → Actions
    const newEditBtn = row.querySelector(".edit-product-btn");
    newEditBtn.dataset.product = JSON.stringify(product).replace(/'/g, "&#39;");

    const toggleBtn = row.querySelector(".toggle-product-btn");
    if (toggleBtn) {
      toggleBtn.dataset.id = product._id;
      toggleBtn.dataset.active = product.isActive;
      toggleBtn.title = product.isActive ? "Unlist" : "List";
      toggleBtn.style.color = product.isActive ? "#ef4444" : "#10b981";

      const icon = toggleBtn.querySelector("i");
      icon.className = `fa-solid ${
        product.isActive ? "fa-eye-slash" : "fa-eye"
      }`;
    }
  }

  function generateProductRowHTML(product) {
    const imgParam =
      product.variants &&
      product.variants.length > 0 &&
      product.variants[0].images &&
      product.variants[0].images.length > 0
        ? product.variants[0].images[0]
        : "https://placehold.co/40x40";

    const priceText =
      product.variants && product.variants.length > 0
        ? `$${Number(product.variants[0].price).toFixed(2)}`
        : "-";

    const totalStock = product.variants
      ? product.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
      : 0;

    let stockHTML = "";
    if (totalStock > 10) {
      stockHTML = `<span class="badge-stock stock-in">${totalStock} In Stock</span>`;
    } else if (totalStock > 0) {
      stockHTML = `<span class="badge-stock stock-low">${totalStock} Left</span>`;
    } else {
      stockHTML = `<span class="badge-stock stock-out">Out of Stock</span>`;
    }

    const catName = product.category
      ? product.category.name || "Uncategorized"
      : "Uncategorized";

    return `
    <!-- Product Column -->
    <td>
      <div class="product-cell">
        <img
          src="${imgParam}"
          alt="Product"
          class="product-img"
          onerror="this.src='https://placehold.co/40x40'"
        />
        <div class="product-info">
          <span>${product.name}</span>
          <small>ID: ${product._id}</small>
        </div>
      </div>
    </td>

    <!-- Category Column -->
    <td>${catName}</td>

    <!-- Price Column -->
    <td>${priceText}</td>

    <!-- Stock Column -->
    <td>${stockHTML}</td>

    <!-- Status Column -->
    <td>
      ${
        product.isActive
          ? `<span class="status-badge status-active"><span class="status-indicator"></span> Active</span>`
          : `<span class="status-badge status-blocked"><span class="status-indicator"></span> Inactive</span>`
      }
    </td>

    <!-- Actions Column -->
    <td>
      <div class="actions">
        <button
          class="action-btn edit-product-btn"
          title="Edit"
          data-id="${product._id}"
          data-product='${JSON.stringify(product).replace(/'/g, "&#39;")}'
        >
          <i class="fa-regular fa-pen-to-square"></i>
        </button>

        <button
          class="action-btn toggle-product-btn"
          title="${product.isActive ? "Unlist" : "List"}"
          data-id="${product._id}"
          data-active="${product.isActive}"
          style="color: ${product.isActive ? "#ef4444" : "#10b981"}"
        >
          <i class="fa-solid ${
            product.isActive ? "fa-eye-slash" : "fa-eye"
          }"></i>
        </button>
      </div>
    </td>
  `;
  }

  // ==========================================
  // 8. EDIT MODAL POPULATION
  // ==========================================
  const EditMode = {
    populate: (product) => {
      console.log("Full product from backend:", product);
      console.log("Variants:", product.variants);
      console.log("First variant _id:", product.variants[0]?._id);

      // 1. Basic Fields
      DOM.get("editProductId").value = product._id;
      DOM.get("editName").value = product.name;
      DOM.get("editDescription").value = product.description;

      // 2. Category
      const catSelect = DOM.get("editCategory");
      const catId = product.category?._id || product.category;
      Array.from(catSelect.options).forEach((opt) => {
        opt.selected = opt.value === catId;
      });

      // 3. Reset State
      State.images.clear();
      State.existingImagesToDelete.clear();
      State.counters.edit = 0;

      // 4. Attributes
      // Handle both old format [{name: 'Color'}] and new format ['Color']
      State.attributes.edit = product.attributes
        ? product.attributes.map((a) => (typeof a === "object" ? a.name : a))
        : [];
      Attributes.render("edit");

      // 5. Variants
      const wrapper = DOM.get("editVariantsWrapper");
      wrapper.innerHTML = ""; // Clear existing

      if (product.variants && product.variants.length > 0) {
        product.variants.forEach((variant) => Variants.add("edit", variant));
      } else {
        Variants.add("edit");
      }

      Modals.open("editProductModal");
    },

    init: () => {
      DOM.getAll(".edit-product-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const product = JSON.parse(btn.dataset.product);
          EditMode.populate(product);
        });
      });
    },
  };

  // ==========================================
  // 10. PRODUCT TOGGLE LOGIC (Copied from Categories)
  // ==========================================
  const productTableBody = document.querySelector(".data-table tbody");

  if (productTableBody) {
    productTableBody.addEventListener("click", async function (e) {
      const toggleBtn = e.target.closest(".toggle-product-btn");
      if (toggleBtn) {
        e.preventDefault();
        const id = toggleBtn.dataset.id;
        const currentActive = toggleBtn.dataset.active === "true";
        const action = currentActive ? "unlist" : "list";

        const result = await Swal.fire({
          title: `Are you sure?`,
          text: `Do you want to ${action} this product?`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: currentActive ? "#ef4444" : "#10b981",
          cancelButtonColor: "#64748b",
          confirmButtonText: `Yes, ${action} it!`,
        });

        if (!result.isConfirmed) return;

        try {
          const response = await fetch(`/admin/products/${id}/toggle`, {
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
              title: newStatus ? "Product listed" : "Product unlisted",
            });
          } else {
            Swal.fire(
              "Error",
              data.message || "Failed to update product",
              "error",
            );
          }
        } catch (error) {
          console.error(error);
          Swal.fire("Error", "Something went wrong", "error");
        }
      }
    });
  }

  // ==========================================
  // 9. INITIALIZATION
  // ==========================================

  // Initialize all modules
  Modals.init();
  Attributes.init();
  Variants.init();
  Images.init();
  Forms.init();
  EditMode.init();
});
