const searchInput = document.getElementById("listSearch");
const sortSelect = document.getElementById("sortBy");
const filterSelect = document.getElementById("filterBy");

// change = submit once, not on every keystroke
if (searchInput) searchInput.addEventListener("change", onSearchInput);

if (sortSelect) sortSelect.addEventListener("change", onSortChange);

if (filterSelect) filterSelect.addEventListener("change", onFilterChange);

//Navigation URL based

function goToPage(p) {
  const params = new URLSearchParams(window.location.search);
  params.set("page", p);
  window.location.search = params.toString();
}

function onSearchInput(e) {
  const params = new URLSearchParams(window.location.search);
  params.set("search", e.target.value.trim());
  params.set("page", 1);
  window.location.search = params.toString();
}

function onSortChange(e) {
  const val = e.target.value === "newest" ? "latest" : e.target.value;

  const params = new URLSearchParams(window.location.search);
  params.set("sort", val);
  params.set("page", 1);
  window.location.search = params.toString();
}

function onFilterChange(e) {
  const params = new URLSearchParams(window.location.search);
  params.set("filter", e.target.value);
  params.set("page", 1);
  window.location.search = params.toString();
}
//Clear search button

document.addEventListener("DOMContentLoaded", () => {
  const clearBtn = document.getElementById("clearSearchBtn");

  if (!clearBtn) return;

  clearBtn.addEventListener("click", () => {
    const url = new URL(window.location.href);

    url.searchParams.set("search", "");
    url.searchParams.set("page", "1");

    window.location.href = url.toString();
  });
});
