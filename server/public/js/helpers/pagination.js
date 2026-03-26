function goToPage(p) {
  const currentURL = new URLSearchParams(window.location.search);

  currentURL.set("page", p);

  if (typeof loadProducts === "function") {
    loadProducts(currentURL.toString());
    return;
  }

  window.location.search = currentURL.toString();
}
