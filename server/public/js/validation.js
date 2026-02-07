/**
 * LogiaFun Frontend Validation Utility
 * Usage: Include this script in your EJS file to access validation functions.
 */

const Validators = {
    isValidEmail: (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    },

    isValidPassword: (password) => {
        // At least 8 characters, one number, one special character
         //const re = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
        // For now, let's keep it simple: min 8 characters to avoid blocking users too aggressively
        return password && password.length >= 8;
    },
    
    isValidComplexPassword: (password) => {
         // More strict: Min 8 chars, 1 letter, 1 number
        const re = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
        return re.test(password);
    },

    isValidPhone: (phone) => {
        const re = /^\d{10}$/;
        return re.test(phone);
    },

    isValidName: (name) => {
        return name && name.trim().length >= 3;
    },

    isValidOTP: (otp) => {
        const re = /^\d{6}$/;
        return re.test(otp);
    },
    
    // Shows error message below an input field
    showError: (inputElement, message) => {
        // clear any existing error
        Validators.clearError(inputElement);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'validation-error';
        errorDiv.style.color = '#ef4444'; 
        errorDiv.style.fontSize = '0.85rem';
        errorDiv.style.marginTop = '4px';
        errorDiv.textContent = message;
        
        inputElement.style.borderColor = '#ef4444';
        
        // Insert after the parent if input is in a wrapper (like password), or directly after input
        const parent = inputElement.closest('.password-wrapper') || inputElement.parentElement;
        parent.appendChild(errorDiv);
        
        // Remove error on input
        inputElement.addEventListener('input', () => {
             Validators.clearError(inputElement);
        }, { once: true });
    },

    clearError: (inputElement) => {
         inputElement.style.borderColor = ''; // reset border
         const parent = inputElement.closest('.password-wrapper') || inputElement.parentElement;
         const existingError = parent.querySelector('.validation-error');
         if (existingError) {
             existingError.remove();
         }
    }
};

// Expose to window
window.Validators = Validators;
