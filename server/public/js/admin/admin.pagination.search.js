const searchInput = document.getElementById("listSearch");
const sortSelect = document.getElementById("sortBy");
const filterSelect = document.getElementById("filterBy");
const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");

// submit on type change/blur/enter
if (searchInput) {
  searchInput.addEventListener("change", applyFilters);
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") applyFilters();
  });
}

if (sortSelect) sortSelect.addEventListener("change", applyFilters);
if (filterSelect) filterSelect.addEventListener("change", applyFilters);
if (startDateInput) startDateInput.addEventListener("change", applyFilters);
if (endDateInput) endDateInput.addEventListener("change", applyFilters);

function applyFilters() {
  const params = new URLSearchParams(window.location.search);

  if (searchInput) params.set("search", searchInput.value.trim());
  if (sortSelect) params.set("sort", sortSelect.value);
  if (filterSelect) params.set("filter", filterSelect.value);
  if (startDateInput) params.set("startDate", startDateInput.value);
  if (endDateInput) params.set("endDate", endDateInput.value);

  params.set("page", 1);
  window.location.search = params.toString();
}

function goToPage(p) {
  const params = new URLSearchParams(window.location.search);
  params.set("page", p);
  window.location.search = params.toString();
}

// Clear search and filters
document.addEventListener("DOMContentLoaded", () => {
  const clearBtn = document.getElementById("clearSearchBtn");

  if (!clearBtn) return;

  clearBtn.addEventListener("click", () => {
    window.location.href = window.location.pathname; // Clear all query params
  });
});
