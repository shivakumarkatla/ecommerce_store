/* ==========================================================================
   TOAST.JS
   Global notification system. Renders into the #toast-container element
   (present on every page, aria-live="assertive" so screen readers announce
   new toasts automatically — no extra ARIA roles needed per-toast).

   Usage:
     App.Toast.success("Added to cart");
     App.Toast.error("Something went wrong");
     App.Toast.show("Custom message", { type: "info", duration: 5000 });
   ========================================================================== */

window.App = window.App || {};

window.App.Toast = (function () {
  "use strict";

  var DEFAULT_DURATION = 4000;
  var EXIT_ANIMATION_MS = 250; // matches --transition-base in base.css

  // Lazily resolved and cached on first use, rather than at script-load
  // time, so this module doesn't depend on exact <script> placement
  // relative to the #toast-container element in the DOM.
  var containerEl = null;

  function getContainer() {
    if (containerEl && document.body.contains(containerEl)) {
      return containerEl;
    }
    containerEl = document.getElementById("toast-container");
    if (!containerEl) {
      console.error(
        "App.Toast: #toast-container not found in the DOM. " +
          "Every page must include it (see index.html) for toasts to render."
      );
    }
    return containerEl;
  }

  /**
   * Show a toast notification.
   * @param {string} message - plain text message (never HTML — set via
   *   textContent to avoid any injection risk from dynamic content).
   * @param {Object} [options]
   * @param {"info"|"success"|"error"} [options.type="info"]
   * @param {number} [options.duration=4000] - ms before auto-dismiss
   */
  function show(message, options) {
    options = options || {};
    var type = options.type || "info";
    var duration = typeof options.duration === "number" ? options.duration : DEFAULT_DURATION;

    var container = getContainer();
    if (!container) return null;

    var toastEl = document.createElement("div");
    toastEl.className = "toast" + (type !== "info" ? " toast--" + type : "");
    toastEl.textContent = message;

    container.appendChild(toastEl);

    var timeoutId = window.setTimeout(function () {
      dismiss(toastEl);
    }, duration);

    // Store the timeout id on the element so dismiss() can clear it if
    // the toast is removed early (e.g. programmatically, or a future
    // "dismiss on click" feature).
    toastEl._dismissTimeoutId = timeoutId;

    return toastEl;
  }

  function dismiss(toastEl) {
    if (!toastEl || !toastEl.parentNode) return;

    if (toastEl._dismissTimeoutId) {
      window.clearTimeout(toastEl._dismissTimeoutId);
    }

    toastEl.classList.add("is-leaving");

    // Remove from DOM after the exit animation finishes. A fixed timeout
    // (rather than relying solely on 'animationend') keeps this reliable
    // even if animations are disabled via prefers-reduced-motion, since
    // components.css sets animation: none in that case and 'animationend'
    // would never fire.
    window.setTimeout(function () {
      if (toastEl.parentNode) {
        toastEl.parentNode.removeChild(toastEl);
      }
    }, EXIT_ANIMATION_MS);
  }

  return {
    show: show,
    success: function (message, options) {
      return show(message, Object.assign({}, options, { type: "success" }));
    },
    error: function (message, options) {
      return show(message, Object.assign({}, options, { type: "error" }));
    },
    info: function (message, options) {
      return show(message, Object.assign({}, options, { type: "info" }));
    },
  };
})();
