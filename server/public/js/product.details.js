/**
 * Premium Product Details Script
 * Custom glassmorphic variant selector implementation
 */
document.addEventListener("DOMContentLoaded", function () {
  const productEl = document.getElementById("productdetails");
  if (!productEl) return;

  const product = JSON.parse(productEl.dataset.product);
  const variants = product.variants || [];
  const discount = product.finalDiscount || 0;

  // Custom Selector Elements
  const selector = document.getElementById("customVariantSelector");
  const trigger = document.getElementById("selectorTrigger");
  const panel = document.getElementById("selectorPanel");
  const variantCards = document.querySelectorAll(".variant-card");

  // UI Sync Elements
  const mainImage = document.getElementById("main-image");
  const thumbList = document.querySelector(".thumbnail-list");
  const priceEl = document.getElementById("current-price");
  const oldPriceEl = document.getElementById("old-price");
  const stockIndicator = document.getElementById("stock-indicator");
  const addBtn = document.getElementById("addToCartBtn");
  const wishBtn = document.getElementById("addToWishListBtn");

  let activeVariant = null;

  /**
   * Main UI Sync Logic
   */
  function updateUI() {
    if (!activeVariant) return;

    // 1. Sync Trigger Display
    const triggerConfig = trigger.querySelector(".selected-config");
    const triggerPrice = trigger.querySelector(".selected-price");

    if (triggerConfig)
      triggerConfig.innerText = Object.values(activeVariant.attributes).join(
        " • ",
      );
    if (triggerPrice) triggerPrice.innerText = "₹" + activeVariant.price.toLocaleString();

    // 2. Sync Price Section
    const base = activeVariant.price;
    const final = Math.round(base - (discount / 100) * base);
    if (priceEl) priceEl.innerText = "₹" + final.toLocaleString();
    if (oldPriceEl) oldPriceEl.innerText = "₹" + base.toLocaleString();

    // 3. Sync Stock & Button
    if (activeVariant.stock > 0) {
      if (stockIndicator) {
        stockIndicator.innerHTML =
          '<i class="fa-solid fa-check-circle" style="color:#22c55e;margin-right:6px;"></i> In Stock';
      }
      if (addBtn) addBtn.disabled = false;
    } else {
      if (stockIndicator) {
        stockIndicator.innerHTML =
          '<i class="fa-solid fa-times-circle" style="color:#ef4444;margin-right:6px;"></i> Out of Stock';
      }
      if (addBtn) addBtn.disabled = true;
    }

    // 4. Sync Active Card Class
    variantCards.forEach((card) => {
      const isSelected = card.dataset.variantId === activeVariant._id;
      card.classList.toggle("active", isSelected);
    });

    // 5. Sync Images
    syncImages();
  }

  function syncImages() {
    if (!activeVariant.images?.length) return;

    // Update main image and lens
    mainImage.src = activeVariant.images[0];
    const lens = document.getElementById("zoom-lens");
    if (lens) lens.style.backgroundImage = `url(${activeVariant.images[0]})`;

    // Regenerate Thumbnails
    thumbList.innerHTML = "";
    activeVariant.images.forEach((img, i) => {
      const div = document.createElement("div");
      div.className = "thumbnail-item" + (i === 0 ? " active" : "");
      div.innerHTML = `<img src="${img}">`;

      div.onclick = () => {
        mainImage.src = img;
        if (lens) lens.style.backgroundImage = `url(${img})`;
        document
          .querySelectorAll(".thumbnail-item")
          .forEach((t) => t.classList.remove("active"));
        div.classList.add("active");
      };

      thumbList.appendChild(div);
    });
  }

  /**
   * Ripple Effect Micro-interaction
   */
  function createRipple(event, element) {
    const ripple = document.createElement("span");
    ripple.classList.add("ripple");
    element.appendChild(ripple);

    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    ripple.addEventListener("animationend", () => ripple.remove());
  }

  /**
   * Custom Selector Logic
   */
  function setupSelector() {
    // 1. Toggle Panel
    trigger?.addEventListener("click", () => {
      selector.classList.toggle("open");
    });

    // 2. Select Option
    variantCards.forEach((btn) => {
      btn.addEventListener("click", function (e) {
        createRipple(e, this);

        const id = this.dataset.variantId;
        activeVariant = variants.find((v) => String(v._id) === String(id));

        if (activeVariant) {
          updateUI();
          console.log("Selected Variant:", activeVariant);

          // Auto close after small delay for feel
          setTimeout(() => {
            selector.classList.remove("open");
          }, 150);
        }
      });
    });

    // 3. Outside Click Close
    window.addEventListener("click", (e) => {
      if (!selector.contains(e.target)) {
        selector.classList.remove("open");
      }
    });

    // 4. Keyboard Support (Escape key)
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") selector.classList.remove("open");
    });
  }

  /**
   * Action Handlers
   */
  function setupActions() {
    // Add To Cart
    addBtn?.addEventListener("click", async function () {
      if (!activeVariant) {
        if (typeof showToast === "function")
          showToast("Please select a variant");
        return;
      }

      try {
        const res = await fetch("/user/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: product._id,
            variantId: activeVariant._id,
            quantity: 1,
          }),
        });

        const data = await res.json();
        if (typeof showToast === "function") showToast(data.message);
      } catch (err) {
        console.error("Cart Request failed", err);
      }
    });

    // Wishlist
    wishBtn?.addEventListener("click", async function () {
      if (!activeVariant) {
        if (typeof showToast === "function")
          showToast("Please select a variant");
        return;
      }

      try {
        const res = await fetch("/user/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: product._id,
            variantId: activeVariant._id,
          }),
        });

        const data = await res.json();
        if (typeof showToast === "function") showToast(data.message);
      } catch (err) {
        console.error("Wishlist Request failed", err);
      }
    });
  }

  /**
   * Entry Point
   */
  function init() {
    if (!variants.length) return;

    setupSelector();
    setupActions();

    // Auto select default variant
    const defaultVid = product.defaultVariant?._id || product.defaultVariantId;
    activeVariant = variants.find(v => String(v._id) === String(defaultVid)) || variants[0];
    updateUI();
  }

  init();
});
