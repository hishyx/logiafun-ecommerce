document.addEventListener("DOMContentLoaded", () => {
  const sortBy = document.getElementById("sortBy");
  const mobileSortBy = document.getElementById("mobile-sortBy");

  if (!sortBy) return;

  sortBy.addEventListener("change", () => {
    const params = new URLSearchParams(window.location.search);

    params.set("page", 1);
    params.set("sortBy", sortBy.value);

    if (mobileSortBy) mobileSortBy.value = sortBy.value;

    if (typeof loadProducts === "function") {
      loadProducts(params.toString());
      return;
    }

    window.location.search = params.toString();
  });
});
