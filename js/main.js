/* ==========================================================================
   MAIN.JS
   Shared initialization logic that runs on EVERY page (loaded after all
   modules, before any page-specific script like home.js). Responsibilities
   that don't belong to any single page:
     - Initialize the header/mobile nav
     - Set the dynamic copyright year in the footer
     - Handle the newsletter signup form (present in the footer area of
       the homepage; other pages can reuse this same handler if they
       include the same form markup)

   Newsletter validation is simple enough (one email field) to handle
   inline here. Multi-field forms (checkout, login, register) will use a
   dedicated validation.js module, introduced when those pages are built.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  if (window.App.Nav) {
    window.App.Nav.init();
  }

  setCurrentYear();
  initNewsletterForm();
});

function setCurrentYear() {
  var yearEl = document.getElementById("current-year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
}

function initNewsletterForm() {
  var form = document.getElementById("newsletter-form");
  if (!form) return; // not every page will have this form

  var emailInput = document.getElementById("newsletter-email");
  var errorEl = document.getElementById("newsletter-error");
  var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var value = emailInput.value.trim();

    if (!EMAIL_PATTERN.test(value)) {
      showNewsletterError("Please enter a valid email address.");
      emailInput.setAttribute("aria-invalid", "true");
      emailInput.focus();
      return;
    }

    clearNewsletterError();

    // No real backend — simulate a successful subscription.
    if (window.App.Toast) {
      window.App.Toast.success("Thanks for subscribing! Check your inbox for 10% off.");
    }
    form.reset();
  });

  // Clear the error as soon as the user starts correcting it, rather
  // than making them re-submit to find out it's now valid.
  emailInput.addEventListener("input", function () {
    if (errorEl && !errorEl.hidden) {
      clearNewsletterError();
    }
  });

  function showNewsletterError(message) {
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.hidden = false;
  }

  function clearNewsletterError() {
    if (!errorEl) return;
    errorEl.hidden = true;
    errorEl.textContent = "";
    emailInput.removeAttribute("aria-invalid");
  }
}
