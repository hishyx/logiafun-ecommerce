document.addEventListener("DOMContentLoaded", () => {
  const refineSearchButton = document.getElementById("refine-btn");
  const desktopCategories = document.querySelectorAll(".category-checkboxes");
  const desktopMinPrice = document.getElementById("min-price");
  const desktopMaxPrice = document.getElementById("max-price");
  const desktopSortSelect = document.getElementById("sortBy");

  const mobileCategories = document.querySelectorAll(".mobile-category-checkboxes");
  const mobileMinPrice = document.getElementById("mobile-min-price");
  const mobileMaxPrice = document.getElementById("mobile-max-price");
  const mobileSortSelect = document.getElementById("mobile-sortBy");

  const filterBtn = document.querySelector(".filter-btn");
  const sheet = document.querySelector(".filter-sheet");
  const overlay = document.querySelector(".filter-sheet-overlay");
  const closeBtn = document.querySelector(".close-sheet");
  const clearBtn = document.querySelector(".clear-filter");
  const applyBtn = document.querySelector(".apply-filter");

  const applyFilters = ({ categories, minPrice, maxPrice, sortBy }) => {
    const params = new URLSearchParams(window.location.search);

    if (minPrice) params.set("minPrice", minPrice);
    else params.delete("minPrice");

    if (maxPrice) params.set("maxPrice", maxPrice);
    else params.delete("maxPrice");

    params.delete("category");
    categories.forEach((categoryId) => {
      params.append("category", categoryId);
    });

    if (sortBy) params.set("sortBy", sortBy);
    else params.delete("sortBy");

    params.set("page", 1);

    if (desktopSortSelect && sortBy) {
      desktopSortSelect.value = sortBy;
    }

    if (mobileSortSelect && sortBy) {
      mobileSortSelect.value = sortBy;
    }

    if (typeof loadProducts === "function") {
      loadProducts(params.toString());
      closeSheet();
      return;
    }

    window.location.search = params.toString();
  };

  const openSheet = () => {
    if (!sheet || !overlay) return;
    sheet.classList.add("open");
    overlay.classList.add("active");
    document.body.style.overflow = "hidden";
  };

  const closeSheet = () => {
    if (!sheet || !overlay) return;
    sheet.classList.remove("open");
    overlay.classList.remove("active");
    document.body.style.overflow = "";
  };

  if (refineSearchButton) {
    refineSearchButton.addEventListener("click", () => {
      const categories = Array.from(desktopCategories)
        .filter((option) => option.checked)
        .map((option) => option.value);

      applyFilters({
        categories,
        minPrice: desktopMinPrice?.value?.trim() || "",
        maxPrice: desktopMaxPrice?.value?.trim() || "",
        sortBy: desktopSortSelect?.value || "",
      });
    });
  }

  if (filterBtn) {
    filterBtn.addEventListener("click", openSheet);
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", closeSheet);
  }

  if (overlay) {
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        closeSheet();
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      mobileCategories.forEach((checkbox) => {
        checkbox.checked = false;
      });

      if (mobileMinPrice) mobileMinPrice.value = "";
      if (mobileMaxPrice) mobileMaxPrice.value = "";
      if (mobileSortSelect) mobileSortSelect.value = "newest";
    });
  }

  if (applyBtn) {
    applyBtn.addEventListener("click", () => {
      const categories = Array.from(mobileCategories)
        .filter((option) => option.checked)
        .map((option) => option.value);

      applyFilters({
        categories,
        minPrice: mobileMinPrice?.value?.trim() || "",
        maxPrice: mobileMaxPrice?.value?.trim() || "",
        sortBy: mobileSortSelect?.value || "",
      });
    });
  }
});
