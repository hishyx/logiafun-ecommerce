document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const editBtn = document.getElementById("editInfoButton");
  const fieldset = document.getElementById("profileFieldset");
  const form = document.querySelector(".profile-form");
  const saveBtn = document.querySelector(".btn-save");
  const changeEmailBtn = document.getElementById("changeEmailBtn");
  const changePasswordButton = document.getElementById("changePasswordBtn");
  const errorBox = document.getElementById("passwordError");

  // --- Profile Editing ---
  let editing = false;

  if (editBtn) {
    editBtn.addEventListener("click", () => {
      editing = !editing;

      if (fieldset) fieldset.disabled = !editing;
      editBtn.textContent = editing ? "Cancel" : "Edit Information";

      if (form) {
        const emailInput = form.querySelector('[name="email"]');
        if (emailInput) emailInput.disabled = true; // Always keep email disabled
      }

      if (changeEmailBtn) changeEmailBtn.disabled = !editing;
      if (changePasswordButton) changePasswordButton.disabled = !editing;
    });
  }

  // --- Profile Save ---
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      // RUN VALIDATION
      if (typeof FormValidator !== 'undefined' && !FormValidator.validateForm(form)) {
        return;
      }

      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = "Saving...";
      }

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

        showToast("Profile updated successfully", "success");

        if (fieldset) fieldset.disabled = true;
        editing = false;
        if (editBtn) editBtn.textContent = "Edit Information";

        // Re-disable conditionally disabled buttons
        if (changeEmailBtn) changeEmailBtn.disabled = true;
        if (changePasswordButton) changePasswordButton.disabled = true;
      } catch (err) {
        showToast(err.message || "Update failed", "error");
      } finally {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = "Save Changes";
        }
      }
    });
  }

  // --- Email Change Modal & Logic ---
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

  if (changeEmailBtn) {
    changeEmailBtn.addEventListener("click", () => {
      if (emailModal) {
        emailModal.classList.add("active");
        resetEmailModal();
      }
    });
  }

  if (closeEmailModal && emailModal) {
    closeEmailModal.addEventListener("click", () => {
      emailModal.classList.remove("active");
    });
  }

  if (emailModal) {
    emailModal.addEventListener("click", (e) => {
      if (e.target === emailModal) emailModal.classList.remove("active");
    });
  }

  function resetEmailModal() {
    if (emailStep1) emailStep1.style.display = "block";
    if (emailStep2) emailStep2.style.display = "none";
    if (newEmailInput) newEmailInput.value = "";
    if (otpInputs) otpInputs.forEach((i) => (i.value = ""));
  }

  // OTP Timer Logic
  let resendCooldown = 60;
  let resendInterval = null;

  function startResendCooldown() {
    if (!resendOtpBtn) return;

    let remaining = resendCooldown;
    resendOtpBtn.disabled = true;
    resendOtpBtn.textContent = `Resend in ${remaining}s`;

    if (resendInterval) clearInterval(resendInterval);

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

  if (sendOtpBtn) {
    sendOtpBtn.addEventListener("click", async () => {
      const newEmail = newEmailInput ? newEmailInput.value.trim() : "";

      if (!newEmail || !newEmail.includes("@")) {
        showToast("Please enter a valid email", "error");
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

        if (displayNewEmail) displayNewEmail.textContent = newEmail;
        if (emailStep1) emailStep1.style.display = "none";
        if (emailStep2) emailStep2.style.display = "block";
        if (otpInputs.length > 0) otpInputs[0].focus();

        startResendCooldown();
      } catch (err) {
        showToast(err.message || "Failed to send OTP", "error");
      } finally {
        sendOtpBtn.disabled = false;
        sendOtpBtn.textContent = "Proceed";
      }
    });
  }

  if (resendOtpBtn) {
    resendOtpBtn.addEventListener("click", async () => {
      resendOtpBtn.disabled = true;
      resendOtpBtn.textContent = "Resending...";

      try {
        const res = await fetch("/user/change-email/resend", {
          method: "POST",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        showToast("OTP resent successfully", "success");
        startResendCooldown();
      } catch (err) {
        showToast(err.message || "Failed to resend OTP", "error");
      } finally {
        resendOtpBtn.disabled = false;
        resendOtpBtn.textContent = "Resend code";
      }
    });
  }

  // OTP Inputs Navigation
  if (otpInputs) {
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
  }

  if (verifyOtpBtn) {
    verifyOtpBtn.addEventListener("click", async () => {
      const otp = Array.from(otpInputs)
        .map((i) => i.value)
        .join("");
      const newEmail = newEmailInput ? newEmailInput.value.trim() : "";

      if (otp.length !== 6) {
        showToast("Enter the full 6-digit OTP", "error");
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

        showToast("Email updated successfully", "success");
        window.location.reload();
      } catch (err) {
        showToast(err.message || "OTP verification failed", "error");
      } finally {
        verifyOtpBtn.disabled = false;
        verifyOtpBtn.textContent = "Verify & Update";
      }
    });
  }

  if (backToEmailBtn) {
    backToEmailBtn.addEventListener("click", () => {
      if (emailStep1) emailStep1.style.display = "block";
      if (emailStep2) emailStep2.style.display = "none";
    });
  }

  // --- Password Change Modal ---
  const passwordModal = document.getElementById("passwordModal");
  const closePasswordModal = document.getElementById("closePasswordModal");
  const passwordChangeForm = document.getElementById("passwordChangeForm");
  const modalPasswordError = document.getElementById("modalPasswordError");

  if (changePasswordButton) {
    changePasswordButton.addEventListener("click", () => {
      if (passwordModal) {
        passwordModal.classList.add("active");
        if (passwordChangeForm) passwordChangeForm.reset();
        if (modalPasswordError) modalPasswordError.textContent = "";
      }
    });
  }

  if (closePasswordModal && passwordModal) {
    closePasswordModal.addEventListener("click", () => {
      passwordModal.classList.remove("active");
    });
  }

  if (passwordModal) {
    passwordModal.addEventListener("click", (e) => {
      if (e.target === passwordModal) passwordModal.classList.remove("active");
    });
  }

  if (passwordChangeForm) {
    passwordChangeForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // RUN VALIDATION
      if (typeof FormValidator !== 'undefined' && !FormValidator.validateForm(passwordChangeForm)) {
        return;
      }

      const submitBtn = passwordChangeForm.querySelector(
        'button[type="submit"]',
      );
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Updating...";
      }

      try {
        const res = await fetch("/user/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentPassword: passwordChangeForm.currentPassword.value.trim(),
            newPassword: passwordChangeForm.newPassword.value.trim(),
            confirmPassword: passwordChangeForm.confirmPassword.value.trim(),
          }),
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.message);

        showToast("Profile updated successfully", "success");
        if (passwordModal) passwordModal.classList.remove("active");
        passwordChangeForm.reset();
        location.reload();
      } catch (err) {
        if (modalPasswordError)
          modalPasswordError.textContent =
            err.message || "Failed to update password";
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Update Password";
        }
      }
    });
  }

  // --- Image Cropping Logic ---
  const fileInput = document.getElementById("fileInput");
  const cropperModal = document.getElementById("cropperModal");
  const closeCropperModalBtn = document.getElementById("closeCropperModal");
  const cancelCropBtn = document.getElementById("cancelCropBtn");
  const cropImageBtn = document.getElementById("cropImageBtn");
  const imageToCrop = document.getElementById("imageToCrop");
  const profileImage = document.querySelector(".profile-avatar-large img");

  let cropper;

  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        const file = files[0];

        if (!file.type.startsWith("image/")) {
          showToast("Please select an image file", "error");
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          if (imageToCrop) {
            imageToCrop.src = event.target.result;
            if (cropperModal) cropperModal.classList.add("active");

            if (cropper) {
              cropper.destroy();
            }

            cropper = new Cropper(imageToCrop, {
              aspectRatio: 1,
              viewMode: 1,
              autoCropArea: 1,
              responsive: true,
            });
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  function closeCropper() {
    if (cropperModal) cropperModal.classList.remove("active");
    if (cropper) {
      cropper.destroy();
      cropper = null;
    }
    if (fileInput) fileInput.value = "";
  }

  if (closeCropperModalBtn) {
    closeCropperModalBtn.addEventListener("click", closeCropper);
  }

  if (cancelCropBtn) {
    cancelCropBtn.addEventListener("click", closeCropper);
  }

  if (cropImageBtn) {
    cropImageBtn.addEventListener("click", async () => {
      if (!cropper) return;

      const canvas = cropper.getCroppedCanvas({
        width: 300,
        height: 300,
      });

      canvas.toBlob(async (blob) => {
        const formData = new FormData();
        formData.append("image", blob, "profile.png");

        try {
          cropImageBtn.textContent = "Uploading";
          if (cancelCropBtn) cancelCropBtn.style.display = "none";

          const res = await fetch("/user/profile-image", {
            method: "POST",
            body: formData,
          });

          const data = await res.json();

          if (profileImage) {
            profileImage.src = data.imageUrl;
          }

          showToast("Photo updated", "success");
          closeCropper();
        } catch (err) {
          console.error("Upload failed", err);
          showToast("Upload failed", "error");
        } finally {
          if (cropImageBtn) cropImageBtn.textContent = "Done";
          if (cancelCropBtn) cancelCropBtn.style.display = "inline-block";
        }
      }, "image/png");
    });
  }

  if (cropperModal) {
    cropperModal.addEventListener("click", (e) => {
      if (e.target === cropperModal) {
        closeCropper();
      }
    });
  }

  // --- Helpers ---
  function showToast(message, type = "success") {
    if (typeof Swal !== "undefined") {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: type,
        title: message,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    } else {
      // Fallback if sweetalert is missing
      alert(message);
    }
  }
});
