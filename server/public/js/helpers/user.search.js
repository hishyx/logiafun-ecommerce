const searchInput = document.getElementById("searchBox");
const clearSearchBtn = document.getElementById("clearSearchBtn");

function toggleClearBtn() {
  if (!searchInput || !clearSearchBtn) return;

  clearSearchBtn.style.display =
    searchInput.value.trim() !== "" ? "flex" : "none";
}

function onSearchInput(e) {
  console.log("Searched");

  const params = new URLSearchParams(window.location.search);
  const value = e.target.value.trim();

  if (value === "") {
    params.delete("search");
  } else {
    params.set("search", value);
  }

  params.set("page", 1);
  window.location.href = "/products?" + params.toString();
}

document.addEventListener("DOMContentLoaded", () => {
  if (searchInput) {
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        onSearchInput(e);
      }
    });
    searchInput.addEventListener("input", toggleClearBtn); // Show/hide immediately on typing
  }

  toggleClearBtn();
  if (!clearSearchBtn) return;

  clearSearchBtn.addEventListener("click", () => {
    const currentPath = window.location.pathname;

    // Clear input field visually
    searchInput.value = "";
    toggleClearBtn();

    // If already on products page → reload without search param
    if (currentPath === "/products") {
      const params = new URLSearchParams(window.location.search);
      params.delete("search");
      params.set("page", 1);

      window.location.href = "/products?" + params.toString();
    }

    // If NOT on /products → do nothing (just clears input)
  });
});
