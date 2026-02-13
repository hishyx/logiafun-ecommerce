// Initialization
document.addEventListener("DOMContentLoaded", () => {
  // setupEventListeners();
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
