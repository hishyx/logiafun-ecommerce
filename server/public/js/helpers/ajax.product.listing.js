async function loadProducts(queryString) {
  try {
    const res = await fetch("/products?" + queryString, {
      headers: {
        "X-Requested-With": "XMLHttpRequest",
      },
    });

    if (!res.ok) {
      throw new Error("Failed to load products");
    }

    const html = await res.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const newGrid = doc.getElementById("productsGrid");
    const newPagination = doc.getElementById("paginationWrapper");
    const newResultsCount = doc.getElementById("newResultsCount");

    if (!newGrid || !newPagination) {
      console.error("Partial HTML not found in response");
      return;
    }

    // Update the main page elements
    const productsGrid = document.getElementById("productsGrid");
    const paginationWrapper = document.getElementById("paginationWrapper");
    const resultsCount = document.getElementById("resultsCount");

    if (productsGrid) productsGrid.innerHTML = newGrid.innerHTML;
    if (paginationWrapper) paginationWrapper.innerHTML = newPagination.innerHTML;
    if (resultsCount && newResultsCount) {
      resultsCount.innerHTML = newResultsCount.innerHTML;
    }

    window.history.pushState({}, "", "/products?" + queryString);

    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (err) {
    console.error("AJAX product load failed:", err);
    if (typeof showToast !== "undefined") {
      showToast("Failed to load products. Please try again.", "error");
    } else {
      alert("Failed to load products. Please try again.");
    }
  }
}
