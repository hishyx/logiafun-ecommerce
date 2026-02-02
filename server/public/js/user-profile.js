//Otp timer and all

let resendCooldown = 60; // seconds
let resendInterval = null;

function startResendCooldown() {
  let remaining = resendCooldown;

  resendOtpBtn.disabled = true;
  resendOtpBtn.textContent = `Resend in ${remaining}s`;

  resendInterval = setInterval(() => {
    remaining--;

    if (remaining <= 0) {
      clearInterval(resendInterval);
      resendInterval = null;
      resendOtpBtn.disabled = false;
      resendOtpBtn.textContent = "Resend code";
    } else {
      resendOtpBtn.textContent = `Resend in ${remaining}s`;
    }
  }, 1000);
}

//  Profile Editing

const editBtn = document.getElementById("editInfoButton");
const fieldset = document.getElementById("profileFieldset");
const form = document.querySelector(".profile-form");
const saveBtn = document.querySelector(".btn-save");
const changeEmailBtn = document.getElementById("changeEmailBtn");
const changePasswordButton = document.getElementById("changePasswordBtn");
const errorBox = document.getElementById("passwordError");

function showError(msg) {
  errorBox.textContent = msg;
}

let editing = false;

editBtn.addEventListener("click", () => {
  console.log("Edit button clicked");
  editing = !editing;
  fieldset.disabled = !editing;
  editBtn.textContent = editing ? "Cancel" : "Edit Information";

  form.querySelector('[name="email"]').disabled = true;
  changeEmailBtn.disabled = !editing;
  changePasswordButton.disabled = !editing;
});

//Profile Save
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Password validation removed from main profile update

  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";

  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  try {
    const res = await fetch("/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message);

    alert("Profile updated successfully ✅");

    fieldset.disabled = true;
    editing = false;
    editBtn.textContent = "Edit Information";
  } catch (err) {
    alert(err.message || "Update failed");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save Changes";
  }
});

//Email Change Modal
const emailModal = document.getElementById("emailModal");
const closeEmailModal = document.getElementById("closeEmailModal");
const emailStep1 = document.getElementById("emailStep1");
const emailStep2 = document.getElementById("emailStep2");
const newEmailInput = document.getElementById("newEmailInput");
const sendOtpBtn = document.getElementById("sendOtpBtn");
const verifyOtpBtn = document.getElementById("verifyOtpBtn");
const backToEmailBtn = document.getElementById("backToEmailBtn");
const displayNewEmail = document.getElementById("displayNewEmail");
const otpInputs = document.querySelectorAll(".otp-digit");
const resendOtpBtn = document.getElementById("resendOtpBtn");

changeEmailBtn.addEventListener("click", () => {
  console.log("Change email button clicked");
  emailModal.classList.add("active");
  resetModal();
});

closeEmailModal.addEventListener("click", () => {
  emailModal.classList.remove("active");
});

emailModal.addEventListener("click", (e) => {
  if (e.target === emailModal) emailModal.classList.remove("active");
});

function resetModal() {
  if (emailStep1) emailStep1.style.display = "block";
  if (emailStep2) emailStep2.style.display = "none";
  if (newEmailInput) newEmailInput.value = "";
  if (otpInputs) otpInputs.forEach((i) => (i.value = ""));
}

//Send OTP
if (sendOtpBtn) {
  sendOtpBtn.addEventListener("click", async () => {
    const newEmail = newEmailInput.value.trim();

    if (!newEmail || !newEmail.includes("@")) {
      alert("Please enter a valid email address");
      return;
    }

    sendOtpBtn.disabled = true;
    sendOtpBtn.textContent = "Sending...";

    try {
      const res = await fetch("/user/change-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      displayNewEmail.textContent = newEmail;
      emailStep1.style.display = "none";
      emailStep2.style.display = "block";
      otpInputs[0].focus();

      startResendCooldown();
    } catch (err) {
      alert(err.message || "Failed to send OTP");
    } finally {
      sendOtpBtn.disabled = false;
      sendOtpBtn.textContent = "Proceed";
    }
  });
}

//Resend OTP
if (resendOtpBtn) {
  resendOtpBtn.addEventListener("click", async () => {
    resendOtpBtn.disabled = true;
    resendOtpBtn.textContent = "Resending...";

    try {
      const res = await fetch("/user/change-email/resend", { method: "POST" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      alert("OTP resent successfully");
      startResendCooldown();
    } catch (err) {
      alert(err.message || "Failed to resend OTP");
    } finally {
      resendOtpBtn.disabled = false;
      resendOtpBtn.textContent = "Resend code";
    }
  });
}

//OTP Inputs UX
otpInputs.forEach((input, index) => {
  input.addEventListener("input", () => {
    if (input.value && index < otpInputs.length - 1) {
      otpInputs[index + 1].focus();
    }
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && !input.value && index > 0) {
      otpInputs[index - 1].focus();
    }
  });
});

//Verify OTP
if (verifyOtpBtn) {
  verifyOtpBtn.addEventListener("click", async () => {
    const otp = Array.from(otpInputs)
      .map((i) => i.value)
      .join("");
    const newEmail = newEmailInput.value.trim();

    if (otp.length !== 6) {
      alert("Enter the full 6-digit OTP");
      return;
    }

    verifyOtpBtn.disabled = true;
    verifyOtpBtn.textContent = "Verifying...";

    try {
      const res = await fetch("/user/change-email", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userOTP: otp, newEmail }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      alert("Email updated successfully ✅");

      document.querySelector('[name="email"]').value = newEmail;
      document.getElementById("sidebarEmail").textContent = newEmail;

      // emailModal.classList.remove("active");
      window.location.reload();
    } catch (err) {
      alert(err.message || "OTP verification failed");
    } finally {
      verifyOtpBtn.disabled = false;
      verifyOtpBtn.textContent = "Verify & Update";
    }
  });
}

//Back Button

if (backToEmailBtn) {
  backToEmailBtn.addEventListener("click", () => {
    emailStep1.style.display = "block";
    emailStep2.style.display = "none";
  });
}

// Password Change Modal
const passwordModal = document.getElementById("passwordModal");
const closePasswordModal = document.getElementById("closePasswordModal");
const changePasswordBtn = document.getElementById("changePasswordBtn");
const passwordChangeForm = document.getElementById("passwordChangeForm");
const modalPasswordError = document.getElementById("modalPasswordError");

if (changePasswordBtn) {
  changePasswordBtn.addEventListener("click", () => {
    console.log("Change password button clicked");
    passwordModal.classList.add("active");
    passwordChangeForm.reset();
    modalPasswordError.textContent = "";
  });
}

if (closePasswordModal) {
  closePasswordModal.addEventListener("click", () => {
    passwordModal.classList.remove("active");
  });
}

passwordModal.addEventListener("click", (e) => {
  if (e.target === passwordModal) passwordModal.classList.remove("active");
});

passwordChangeForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const currentPassword = passwordChangeForm.currentPassword.value.trim();
  const newPassword = passwordChangeForm.newPassword.value.trim();
  const confirmPassword = passwordChangeForm.confirmPassword.value.trim();

  modalPasswordError.textContent = "";

  if (newPassword.length < 8) {
    modalPasswordError.textContent =
      "New password must be at least 8 characters";
    return;
  }

  if (newPassword !== confirmPassword) {
    modalPasswordError.textContent = "Passwords do not match";
    return;
  }

  const submitBtn = passwordChangeForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = "Updating...";

  try {
    const res = await fetch("/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword,
        newPassword,
        confirmPassword,
      }),
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message);

    alert("Password updated successfully ✅");
    passwordModal.classList.remove("active");
    passwordChangeForm.reset();
  } catch (err) {
    modalPasswordError.textContent = err.message || "Failed to update password";
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Update Password";
  }
});

const passTriggerFromEmail = document.getElementById(
  "triggerPasswordFromEmail",
);

if (passTriggerFromEmail) {
  passTriggerFromEmail.addEventListener("click", () => {
    console.log("Set password from email button clicked");
    emailModal.classList.remove("active"); // Open password modal, ensure email modal is closed
    passwordModal.classList.add("active");
    passwordChangeForm.reset();
    modalPasswordError.textContent = "";
  });
}
