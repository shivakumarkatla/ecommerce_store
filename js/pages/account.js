/* ==========================================================================
   PAGES/ACCOUNT.JS
   Handles login.html, register.html, and account.html — three pages
   that share this single script. On each page, the script detects which
   form/elements are present and runs only the relevant logic.

   Auth state is stored in localStorage under App.Storage.KEYS.SESSION
   as a plain object { email, firstName, lastName }. No real passwords
   are stored — this is a UI-only simulation. In a real app this would
   be replaced by a backend JWT flow.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  var V       = window.App.Validation;
  var Storage = window.App.Storage;

  function getSession() {
    return Storage.get(Storage.KEYS.SESSION, null);
  }

  function saveSession(user) {
    Storage.set(Storage.KEYS.SESSION, user);
  }

  function clearSession() {
    Storage.remove(Storage.KEYS.SESSION);
  }

  /* ---- LOGIN PAGE ---- */
  var loginForm = document.getElementById("login-form");
  if (loginForm) {
    // If already logged in, skip straight to account dashboard
    if (getSession()) {
      window.location.href = "account.html";
      return;
    }

    var loginError = document.getElementById("login-error");

    loginForm.addEventListener("submit", function (event) {
      event.preventDefault();

      var emailEl    = document.getElementById("login-email");
      var passwordEl = document.getElementById("login-password");

      var valid = V.validateSection([
        { fieldEl: emailEl,    errorEl: document.getElementById("login-email-error"),    validator: V.validateEmail },
        { fieldEl: passwordEl, errorEl: document.getElementById("login-password-error"), validator: V.validatePassword },
      ]);

      if (!valid) return;

      // Mock auth: accept any well-formed email + password >= 8 chars.
      // A real implementation would POST credentials to an API here.
      var user = {
        email: emailEl.value.trim(),
        firstName: emailEl.value.split("@")[0],
        lastName: "",
      };

      saveSession(user);
      window.App.Toast.success("Welcome back, " + user.firstName + "!");

      // Short delay so the toast is visible before redirect
      window.setTimeout(function () {
        window.location.href = "account.html";
      }, 800);
    });
  }

  /* ---- REGISTER PAGE ---- */
  var registerForm = document.getElementById("register-form");
  if (registerForm) {
    if (getSession()) {
      window.location.href = "account.html";
      return;
    }

    registerForm.addEventListener("submit", function (event) {
      event.preventDefault();

      var firstNameEl       = document.getElementById("reg-first-name");
      var lastNameEl        = document.getElementById("reg-last-name");
      var emailEl           = document.getElementById("reg-email");
      var passwordEl        = document.getElementById("reg-password");
      var confirmPasswordEl = document.getElementById("reg-confirm-password");

      var valid = V.validateSection([
        { fieldEl: firstNameEl,       errorEl: document.getElementById("reg-first-name-error"),       validator: function(v){ return V.validateRequired(v, "First name"); } },
        { fieldEl: lastNameEl,        errorEl: document.getElementById("reg-last-name-error"),        validator: function(v){ return V.validateRequired(v, "Last name"); } },
        { fieldEl: emailEl,           errorEl: document.getElementById("reg-email-error"),           validator: V.validateEmail },
        { fieldEl: passwordEl,        errorEl: document.getElementById("reg-password-error"),        validator: V.validatePassword },
        { fieldEl: confirmPasswordEl, errorEl: document.getElementById("reg-confirm-password-error"), validator: function(v) {
          if (!v) return "Please confirm your password.";
          if (v !== passwordEl.value) return "Passwords do not match.";
          return "";
        }},
      ]);

      if (!valid) return;

      var user = {
        email: emailEl.value.trim(),
        firstName: firstNameEl.value.trim(),
        lastName: lastNameEl.value.trim(),
      };

      saveSession(user);
      window.App.Toast.success("Account created! Welcome, " + user.firstName + ".");

      window.setTimeout(function () {
        window.location.href = "account.html";
      }, 800);
    });
  }

  /* ---- ACCOUNT DASHBOARD PAGE ---- */
  var accountName  = document.getElementById("account-name");
  var accountEmail = document.getElementById("account-email");
  var signoutBtn   = document.getElementById("signout-btn");

  if (accountName || signoutBtn) {
    var session = getSession();
    if (!session) {
      // Not logged in — redirect to login
      window.location.href = "login.html";
      return;
    }

    if (accountName) {
      accountName.textContent = session.firstName
        ? (session.firstName + (session.lastName ? " " + session.lastName : ""))
        : "—";
    }
    if (accountEmail) {
      accountEmail.textContent = session.email || "—";
    }

    if (signoutBtn) {
      signoutBtn.addEventListener("click", function () {
        clearSession();
        window.App.Toast.info("You've been signed out.");
        window.setTimeout(function () {
          window.location.href = "index.html";
        }, 600);
      });
    }
  }
});
