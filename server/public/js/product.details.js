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
}

const variants = JSON.parse(
  document.getElementById("productdetails").dataset.product,
).variants;

function availableAttribute() {
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

  // Reset all disabled states first
  document
    .querySelectorAll(".variant-option")
    .forEach((btn) => btn.classList.remove("disabled"));

  // For EACH attribute section, filter separately
  document.querySelectorAll(".variant-section").forEach((section) => {
    const attribute = section
      .querySelector(".variant-label")
      .textContent.trim();

    const buttons = section.querySelectorAll(".variant-option");

    // Copy selected attributes and remove current attribute
    const otherSelected = { ...selectedAttributes };
    delete otherSelected[attribute];

    // Filter variants using OTHER attributes only
    const filteredVariants = variants.filter((variant) => {
      return Object.keys(otherSelected).every((attr) => {
        return variant.attributes[attr] === otherSelected[attr];
      });
    });

    const allowedValues = new Set(
      filteredVariants.map((v) => v.attributes[attribute]),
    );

    buttons.forEach((button) => {
      const value = button.textContent.trim();

      if (!allowedValues.has(value)) {
        button.classList.add("disabled");
      }
    });
  });

  // Fix active states if disabled
  document.querySelectorAll(".variant-section").forEach((section) => {
    const activeButton = section.querySelector(".variant-option.active");

    if (activeButton && activeButton.classList.contains("disabled")) {
      activeButton.classList.remove("active");

      const firstAvailable = section.querySelector(
        ".variant-option:not(.disabled)",
      );

      if (firstAvailable) {
        firstAvailable.classList.add("active");
      }
    }
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

  const discountedPrice = basePrice - (discount / 100) * basePrice;

  currentPriceEl.textContent = "₹" + discountedPrice.toFixed(2);
  oldPriceEl.textContent = "₹" + basePrice.toFixed(2);

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
