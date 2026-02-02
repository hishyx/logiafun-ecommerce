// Initialization
document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  wireUserEvents();
});

function setupEventListeners() {
  const mobileToggle = document.querySelector(".mobile-toggle");
  const sidebar = document.querySelector(".sidebar");

  if (mobileToggle) {
    mobileToggle.addEventListener("click", () => {
      sidebar.classList.toggle("open");
    });
  }

  document.addEventListener("click", (e) => {
    if (
      window.innerWidth <= 1024 &&
      sidebar &&
      !sidebar.contains(e.target) &&
      mobileToggle &&
      !mobileToggle.contains(e.target) &&
      sidebar.classList.contains("open")
    ) {
      sidebar.classList.remove("open");
    }
  });
}

/* -------------------------
   URL based navigation
--------------------------*/

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

function wireUserEvents() {
  const searchInput = document.getElementById("userListSearch");
  const sortSelect = document.getElementById("sortBy");
  const filterSelect = document.getElementById("filterBy");

  // change = submit once, not on every keystroke
  if (searchInput) searchInput.addEventListener("change", onSearchInput);

  if (sortSelect) sortSelect.addEventListener("change", onSortChange);

  if (filterSelect) filterSelect.addEventListener("change", onFilterChange);
}

/* -------------------------
   Block / Unblock (AJAX)
--------------------------*/

function openBlockConfirm(userId) {
  toggleBlockUser(userId);
}

async function toggleBlockUser(userId) {
  try {
    const response = await fetch(`/admin/users/${userId}/block`, {
      method: "PATCH",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to update user status.");
    }

    // reload page to refresh server-rendered data
    window.location.reload();
  } catch (error) {
    console.error(error);
    alert(error.message || "Something went wrong. Please try again.");
  }
}
