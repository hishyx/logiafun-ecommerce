const currentPriceEl = document.getElementById("current-price");
const oldPriceEl = document.getElementById("old-price");
const discount =
  JSON.parse(document.getElementById("productdetails").dataset.product)
    .discount || 0;

const mainImage = document.getElementById("main-image");

const thumnailList = document.getElementsByClassName("thumbnail-list")[0];

// Simple interactions for the static page
function changeImage(src, element) {
  document.getElementById("main-image").src = src;

  // Update active class
  document
    .querySelectorAll(".thumbnail-item")
    .forEach((item) => item.classList.remove("active"));
  element.classList.add("active");
}

// const lens = document.getElementById("zoom-lens");
// if (lens) {
//   lens.style.backgroundImage = `url(${url})`;
// }

function updateQty(change) {
  const input = document.getElementById("qty-input");
  let val = parseInt(input.value);
  val += change;
  if (val < 1) val = 1;
  if (val > 10) val = 10; // limit
  input.value = val;
}

// Color selection
document.querySelectorAll(".color-option").forEach((option) => {
  option.addEventListener("click", () => {
    document
      .querySelectorAll(".color-option")
      .forEach((o) => o.classList.remove("active"));
    option.classList.add("active");
  });
});

// Option selection
document.querySelectorAll(".size-option").forEach((option) => {
  option.addEventListener("click", () => {
    document
      .querySelectorAll(".size-option")
      .forEach((o) => o.classList.remove("active"));
    option.classList.add("active");
  });
});
//Under this my logic

const variantOptions = document.getElementsByClassName("variant-option");

for (let variantOption of variantOptions) {
  variantOption.addEventListener("click", onOptionClick);
}
function onOptionClick(e) {
  const section = e.target.closest(".variant-section");

  if (!section) return;

  const options = section.querySelectorAll(".variant-option");

  options.forEach((option) => option.classList.remove("active"));

  e.target.classList.add("active");
  availableAttribute();

  const changedAttribute = section
    .querySelector(".variant-label")
    .textContent.trim();
  availableAttribute(changedAttribute);
}

const variants = JSON.parse(
  document.getElementById("productdetails").dataset.product,
).variants;

function availableAttribute(changedAttribute = null) {
  let selectedAttributes = {};

  // 1. Get ALL currently selected attributes
  document.querySelectorAll(".variant-section").forEach((section) => {
    const attribute = section
      .querySelector(".variant-label")
      .textContent.trim();

    const activeOption = section.querySelector(".variant-option.active");

    if (activeOption) {
      selectedAttributes[attribute] = activeOption.textContent.trim();
    }
  });

  // 2. Auto-Correction Logic
  const validVariant = variants.find((variant) => {
    return Object.keys(selectedAttributes).every((attr) => {
      return variant.attributes[attr] === selectedAttributes[attr];
    });
  });

  if (!validVariant && changedAttribute) {
    // Logic: User just changed 'changedAttribute'.
    // We must keep that value. We should find a variant that matches it.
    // We should try to find a variant that matches as many other attributes as possible,
    // but for now, just finding the FIRST valid variant with this new attribute value is enough to fix the state.

    const potentialVariant = variants.find(
      (v) =>
        v.attributes[changedAttribute] === selectedAttributes[changedAttribute],
    );

    if (potentialVariant) {
      // Update UI to match this potential variant
      document.querySelectorAll(".variant-section").forEach((section) => {
        const attribute = section
          .querySelector(".variant-label")
          .textContent.trim();

        if (attribute !== changedAttribute) {
          const newValue = potentialVariant.attributes[attribute];

          // Find button for this value and select it
          const options = section.querySelectorAll(".variant-option");
          options.forEach((opt) => {
            if (opt.textContent.trim() === newValue) {
              // Deselect others
              options.forEach((o) => o.classList.remove("active"));
              // Select this
              opt.classList.add("active");
            }
          });
          // Update local state for step 3
          selectedAttributes[attribute] = newValue;
        }
      });
    }
  }

  // 3. Mark options as disabled/enabled based on potentially corrected selection
  document.querySelectorAll(".variant-section").forEach((section) => {
    const attribute = section
      .querySelector(".variant-label")
      .textContent.trim();

    const buttons = section.querySelectorAll(".variant-option");

    buttons.forEach((button) => {
      const value = button.textContent.trim();

      const hypotheticalSelection = {
        ...selectedAttributes,
        [attribute]: value,
      };

      const exists = variants.some((variant) => {
        return Object.keys(hypotheticalSelection).every((attr) => {
          return variant.attributes[attr] === hypotheticalSelection[attr];
        });
      });

      if (!exists) {
        button.classList.add("disabled");
      } else {
        button.classList.remove("disabled");
      }
    });
  });

  updateImagesUI();
}

//Settting first varaint as selected

// Set first option active in each section
document.querySelectorAll(".variant-section").forEach((section) => {
  const firstOption = section.querySelector(".variant-option");
  if (firstOption) {
    firstOption.classList.add("active");
  }
});

// Do NOT run filtering here
updateImagesUI();

//My works ui updates

function getActiveVariant() {
  const selectedAttributes = {};

  document.querySelectorAll(".variant-section").forEach((section) => {
    const attribute = section
      .querySelector(".variant-label")
      .textContent.trim();

    const activeOption = section.querySelector(".variant-option.active");

    if (activeOption) {
      selectedAttributes[attribute] = activeOption.textContent.trim();
    }
  });

  // Count total attribute types
  const totalAttributes = document.querySelectorAll(".variant-section").length;

  // If not all selected, do NOT update image
  if (Object.keys(selectedAttributes).length !== totalAttributes) {
    return null;
  }

  return variants.find((variant) => {
    return Object.keys(selectedAttributes).every((attr) => {
      return variant.attributes[attr] === selectedAttributes[attr];
    });
  });
}

function updateImagesUI() {
  const activeVariant = getActiveVariant();
  if (!activeVariant) return;

  const basePrice = activeVariant.price;

  const discountedPrice = discount
    ? basePrice - (discount / 100) * basePrice
    : basePrice;

  currentPriceEl.textContent = "₹" + discountedPrice.toFixed(2);
  if (oldPriceEl) oldPriceEl.textContent = "₹" + basePrice.toFixed(2);

  const images = activeVariant.images;

  // Update main image
  mainImage.src = images[0];

  // Clear thumbnails
  thumnailList.innerHTML = "";

  // Rebuild thumbnails
  images.forEach((imgSrc, index) => {
    const thumb = document.createElement("img");
    thumb.src = imgSrc;
    thumb.classList.add("thumbnail-item");

    if (index === 0) {
      thumb.classList.add("active");
    }

    thumb.addEventListener("click", function () {
      mainImage.src = imgSrc;

      document
        .querySelectorAll(".thumbnail-item")
        .forEach((t) => t.classList.remove("active"));

      thumb.classList.add("active");
    });

    thumnailList.appendChild(thumb);
  });
}

// Wishlist Logic
const addToWishListBtn = document.getElementById("addToWishListBtn");

if (addToWishListBtn) {
  addToWishListBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const activeVariant = getActiveVariant();
    if (!activeVariant) {
      showToast("Please select a variant option");
      return;
    }

    const productId = addToWishListBtn.dataset.productId;
    const variantId = activeVariant._id;
    const quantity = 1;

    try {
      const response = await fetch("/user/wishlist", {
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

      const result = await response.json();

      if (response.ok) {
        showToast(result.message || "Added to wishlist");
        // Update header count if returned, or simple UI feedback
      } else {
        showToast(result.message || "Failed to add to wishlist");
      }
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      showToast("Something went wrong");
    }
  });
}
