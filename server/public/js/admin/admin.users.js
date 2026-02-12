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

function wireUserEvents() {
  const searchInput = document.getElementById("userListSearch");
  const sortSelect = document.getElementById("sortBy");
  const filterSelect = document.getElementById("filterBy");

  // change = submit once, not on every keystroke
  if (searchInput) searchInput.addEventListener("change", onSearchInput);

  if (sortSelect) sortSelect.addEventListener("change", onSortChange);

  if (filterSelect) filterSelect.addEventListener("change", onFilterChange);
}

//Block / Unblock (AJAX)

async function toggleUser(userId, isBlocked) {
  try {
    const res = await fetch(`/admin/users/${userId}/toggle`, {
      method: "PATCH",
    });

    if (!res.ok) {
      alert("Request failed");
      return;
    }

    const data = await res.json();

    if (!data.success) {
      alert("Failed to update user");
      return;
    }

    const statusEl = document.getElementById(`status-${userId}`);
    const btn = document.getElementById(`btn-${userId}`);

    if (!statusEl || !btn) return;

    // because backend toggled it
    const nowBlocked = !isBlocked;

    if (nowBlocked) {
      statusEl.classList.remove("status-active");
      statusEl.classList.add("status-blocked");
      statusEl.lastChild.textContent = "Blocked";

      btn.classList.remove("btn-block");
      btn.classList.add("btn-unblock");
      btn.innerHTML = `<i class="fa-solid fa-check"></i> Unblock`;
      btn.setAttribute("onclick", `toggleUser('${userId}', true)`);
    } else {
      statusEl.classList.remove("status-blocked");
      statusEl.classList.add("status-active");
      statusEl.lastChild.textContent = "Active";

      btn.classList.remove("btn-unblock");
      btn.classList.add("btn-block");
      btn.innerHTML = `<i class="fa-solid fa-ban"></i> Block`;
      btn.setAttribute("onclick", `toggleUser('${userId}', false)`);
    }
  } catch (err) {
    console.error(err);
    alert("Something went wrong");
  }
}

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
