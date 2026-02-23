/**
 * LogiaFun Global Form Validator
 * Modern, non-intrusive inline validation system.
 */

const FormValidator = {
    // Configuration
    config: {
        errorClass: 'is-invalid',
        errorElement: 'div',
        errorElementClass: 'invalid-feedback',
        scrollPadding: 100
    },

    // Validation Rules (Base logic)
    rules: {
        required: (value) => value !== null && value !== undefined && value.trim().length > 0,
        email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()),
        password: (value) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(value),
        number: (value) => value.trim() !== '' && !isNaN(value),
        digits: (value) => /^\d+$/.test(value),
        match: (value, otherValue) => value === otherValue,
        minlength: (value, min) => value.trim().length >= parseInt(min),
        maxlength: (value, max) => value.trim().length <= parseInt(max),
        min: (value, min) => parseFloat(value) >= parseFloat(min),
        max: (value, max) => parseFloat(value) <= parseFloat(max),
        pattern: (value, regex) => new RegExp(regex).test(value)
    },

    // Default Error Messages
    messages: {
        required: "This field is required",
        email: "Please enter a valid email address",
        password: "Password must be at least 8 characters (including A-Z, a-z, 0-9)",
        number: "Please enter a valid number",
        digits: "Must contain only digits",
        match: "Values do not match",
        minlength: (min) => `Must be at least ${min} characters`,
        maxlength: (max) => `Cannot exceed ${max} characters`,
        min: (min) => `Value must be at least ${min}`,
        max: (max) => `Value cannot exceed ${max}`,
        pattern: "Invalid format"
    },

    /**
     * Initialize all forms on the page
     */
    init: function () {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            // Only attach if not already initialized
            if (form.dataset.validatorInitialized) return;

            form.setAttribute('novalidate', true);
            form.addEventListener('submit', (e) => this.handleSubmit(e, form));

            // Attach listeners to all inputs
            const inputs = form.querySelectorAll('input, select, textarea');
            inputs.forEach(input => this.attachInputListeners(input));

            form.dataset.validatorInitialized = "true";
        });
    },

    /**
     * Attach blur and input listeners for real-time feedback
     */
    attachInputListeners: function (input) {
        input.addEventListener('blur', () => this.validateField(input));
        input.addEventListener('input', () => {
            if (input.classList.contains(this.config.errorClass)) {
                this.validateField(input); // Re-validate on input if already invalid
            }
        });
    },

    /**
     * Handle form submission
     */
    handleSubmit: function (e, form) {
        if (!this.validateForm(form)) {
            e.preventDefault();
            e.stopPropagation();

            // Focus and scroll to first error
            const firstError = form.querySelector(`.${this.config.errorClass}`);
            if (firstError) {
                firstError.focus();
                const rect = firstError.getBoundingClientRect();
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                window.scrollTo({
                    top: rect.top + scrollTop - this.config.scrollPadding,
                    behavior: 'smooth'
                });
            }
        }
    },

    /**
     * Validate an entire form
     */
    validateForm: function (form) {
        let isValid = true;
        const inputs = form.querySelectorAll('input, select, textarea');

        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        return isValid;
    },

    /**
     * Validate a single industrial field based on attributes
     */
    validateField: function (input) {
        const value = input.value;
        const type = input.type;
        const name = input.name;

        // Skip hidden/disabled
        if (type === 'hidden' || input.disabled || input.readOnly) return true;

        this.clearError(input);

        // 1. Required attribute
        if (input.hasAttribute('required') && !this.rules.required(value)) {
            return this.showError(input, input.dataset.msgRequired || this.messages.required);
        }

        // Only run subsequent rules if there's a value (unless it was already required)
        if (value.trim().length === 0) return true;

        // 2. Email type
        if (type === 'email' && !this.rules.email(value)) {
            return this.showError(input, input.dataset.msgEmail || this.messages.email);
        }

        // 3. Password specific (if name is password or newPassword)
        if (type === 'password' && (name === 'password' || name === 'newPassword') && !input.hasAttribute('data-skip-strength')) {
            if (!this.rules.password(value)) {
                return this.showError(input, input.dataset.msgPassword || this.messages.password);
            }
        }

        // 4. Minlength / Maxlength
        if (input.hasAttribute('minlength')) {
            const min = input.getAttribute('minlength');
            if (!this.rules.minlength(value, min)) {
                return this.showError(input, input.dataset.msgMinlength || this.messages.minlength(min));
            }
        }
        if (input.hasAttribute('maxlength')) {
            const max = input.getAttribute('maxlength');
            if (!this.rules.maxlength(value, max)) {
                return this.showError(input, input.dataset.msgMaxlength || this.messages.maxlength(max));
            }
        }

        // 5. Number / Range
        if (type === 'number') {
            if (!this.rules.number(value)) {
                return this.showError(input, this.messages.number);
            }
            if (input.hasAttribute('min')) {
                const min = input.getAttribute('min');
                if (!this.rules.min(value, min)) {
                    return this.showError(input, input.dataset.msgMin || this.messages.min(min));
                }
            }
            if (input.hasAttribute('max')) {
                const max = input.getAttribute('max');
                if (!this.rules.max(value, max)) {
                    return this.showError(input, input.dataset.msgMax || this.messages.max(max));
                }
            }
        }

        // 6. Match attribute (for confirm password)
        const matchSelector = input.getAttribute('data-match');
        if (matchSelector) {
            const other = document.querySelector(matchSelector);
            if (other && !this.rules.match(value, other.value)) {
                return this.showError(input, input.dataset.msgMatch || this.messages.match);
            }
        }

        // 7. Pattern attribute
        if (input.hasAttribute('pattern')) {
            const pattern = input.getAttribute('pattern');
            if (!this.rules.pattern(value, pattern)) {
                return this.showError(input, input.dataset.msgPattern || this.messages.pattern);
            }
        }

        // 8. Custom data-digits attribute
        if (input.hasAttribute('data-digits') && !this.rules.digits(value)) {
            return this.showError(input, this.messages.digits);
        }

        return true;
    },

    /**
     * Show inline error message
     */
    showError: function (input, message) {
        input.classList.add(this.config.errorClass);
        input.style.borderColor = '#ef4444';

        const error = document.createElement(this.config.errorElement);
        error.className = `error-text ${this.config.errorElementClass}`;
        error.style.color = '#ef4444';
        error.style.fontSize = '0.8rem';
        error.style.marginTop = '4px';
        error.style.display = 'block';
        error.textContent = message;

        // Smart positioning
        const parent = input.closest('.input-group') || input.closest('.form-group') || input.parentElement;
        const wrapper = parent.querySelector('.password-wrapper') || parent.querySelector('.input-wrapper');

        if (wrapper) {
            wrapper.after(error);
        } else {
            input.after(error);
        }

        return false;
    },

    /**
     * Remove error indicators
     */
    clearError: function (input) {
        input.classList.remove(this.config.errorClass);
        input.style.borderColor = '';
        const parent = input.closest('.input-group') || input.closest('.form-group') || input.parentElement;
        parent.querySelectorAll(`.${this.config.errorElementClass}`).forEach(el => el.remove());
    }
};

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => FormValidator.init());
} else {
    FormValidator.init();
}

// Expose to window for manual trigger if needed
window.FormValidator = FormValidator;
