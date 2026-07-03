/* ==========================================================================
   MODULES/VALIDATION.JS
   Reusable form validation utilities. Pure functions (validate*) plus a
   DOM helper (showFieldError / clearFieldError) that pairs errors with
   fields via aria-describedby — matching the .form-error pattern already
   defined in components.css.

   Usage:
     var err = App.Validation.validateEmail(value);
     if (err) App.Validation.showFieldError(inputEl, errorEl, err);
     else      App.Validation.clearFieldError(inputEl, errorEl);
   ========================================================================== */

window.App = window.App || {};

window.App.Validation = (function () {
  "use strict";

  /* --------------------------------------------------------------------------
     PURE VALIDATORS — return an error string on failure, "" on pass.
     -------------------------------------------------------------------------- */

  function validateRequired(value, label) {
    if (!value || !String(value).trim()) {
      return (label || "This field") + " is required.";
    }
    return "";
  }

  function validateEmail(value) {
    if (!value || !String(value).trim()) return "Email address is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value).trim())) {
      return "Please enter a valid email address.";
    }
    return "";
  }

  function validatePassword(value) {
    if (!value) return "Password is required.";
    if (String(value).length < 8) return "Password must be at least 8 characters.";
    return "";
  }

  function validateZip(value) {
    if (!value || !String(value).trim()) return "ZIP / postal code is required.";
    // Accepts US ZIP (5 or 9 digit) and common international formats
    if (!/^[A-Z0-9][A-Z0-9\s\-]{2,9}$/i.test(String(value).trim())) {
      return "Please enter a valid ZIP or postal code.";
    }
    return "";
  }

  /**
   * Luhn algorithm check — catches the majority of card number typos
   * without a real payment processor. Never a security measure; purely
   * UX feedback before a real gateway would validate properly.
   */
  function luhn(value) {
    var digits = String(value).replace(/\D/g, "");
    if (digits.length < 13 || digits.length > 19) return false;
    var sum = 0;
    var isEven = false;
    for (var i = digits.length - 1; i >= 0; i--) {
      var d = parseInt(digits[i], 10);
      if (isEven) {
        d *= 2;
        if (d > 9) d -= 9;
      }
      sum += d;
      isEven = !isEven;
    }
    return sum % 10 === 0;
  }

  function validateCardNumber(value) {
    var digits = String(value || "").replace(/\D/g, "");
    if (!digits) return "Card number is required.";
    if (!luhn(digits)) return "Please enter a valid card number.";
    return "";
  }

  function validateExpiry(value) {
    var clean = String(value || "").replace(/\s/g, "");
    if (!clean) return "Expiry date is required.";
    var match = clean.match(/^(\d{1,2})[\/\-](\d{2,4})$/);
    if (!match) return "Please use MM/YY format.";
    var month = parseInt(match[1], 10);
    var year  = parseInt(match[2].length === 2 ? "20" + match[2] : match[2], 10);
    if (month < 1 || month > 12) return "Month must be between 01 and 12.";
    var now = new Date();
    var expiry = new Date(year, month); // first day of month AFTER expiry
    if (expiry <= now) return "This card has expired.";
    return "";
  }

  function validateCVV(value) {
    var digits = String(value || "").replace(/\D/g, "");
    if (!digits) return "Security code is required.";
    if (digits.length < 3 || digits.length > 4) return "CVV must be 3 or 4 digits.";
    return "";
  }

  /* --------------------------------------------------------------------------
     DOM HELPERS — link error messages to fields via ARIA
     -------------------------------------------------------------------------- */

  /**
   * Marks a field as invalid and shows the associated error element.
   * @param {HTMLElement} fieldEl   - the <input>, <select>, or <textarea>
   * @param {HTMLElement} errorEl   - the companion .form-error element
   * @param {string}      message   - plain-text error copy
   */
  function showFieldError(fieldEl, errorEl, message) {
    if (!fieldEl || !errorEl) return;
    fieldEl.setAttribute("aria-invalid", "true");
    if (!fieldEl.getAttribute("aria-describedby") ||
        fieldEl.getAttribute("aria-describedby").indexOf(errorEl.id) === -1) {
      var existing = fieldEl.getAttribute("aria-describedby") || "";
      fieldEl.setAttribute("aria-describedby", (existing + " " + errorEl.id).trim());
    }
    errorEl.textContent = message;
    errorEl.hidden = false;
  }

  function clearFieldError(fieldEl, errorEl) {
    if (!fieldEl || !errorEl) return;
    fieldEl.removeAttribute("aria-invalid");
    errorEl.hidden = true;
    errorEl.textContent = "";
  }

  /**
   * Validates an entire form section at once. Takes an array of field
   * descriptors and returns true if ALL pass (and has side-effected
   * showFieldError / clearFieldError on each pair).
   *
   * @param {Array<{fieldEl, errorEl, validator: function(value):string}>} fields
   * @returns {boolean} true if the section is valid
   */
  function validateSection(fields) {
    var firstInvalid = null;
    var allValid = true;

    fields.forEach(function (descriptor) {
      var value = descriptor.fieldEl ? descriptor.fieldEl.value : "";
      var error = descriptor.validator(value);
      if (error) {
        showFieldError(descriptor.fieldEl, descriptor.errorEl, error);
        if (!firstInvalid) firstInvalid = descriptor.fieldEl;
        allValid = false;
      } else {
        clearFieldError(descriptor.fieldEl, descriptor.errorEl);
      }
    });

    // Move focus to the first invalid field so keyboard/screen-reader
    // users land exactly where they need to correct their input.
    if (firstInvalid) firstInvalid.focus();
    return allValid;
  }

  return {
    validateRequired: validateRequired,
    validateEmail: validateEmail,
    validatePassword: validatePassword,
    validateZip: validateZip,
    validateCardNumber: validateCardNumber,
    validateExpiry: validateExpiry,
    validateCVV: validateCVV,
    showFieldError: showFieldError,
    clearFieldError: clearFieldError,
    validateSection: validateSection,
    luhn: luhn,
  };
})();
