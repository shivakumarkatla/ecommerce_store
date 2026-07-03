/* ==========================================================================
   PAGES/CHECKOUT.JS
   Multi-step checkout: Shipping (step 1) → Payment (step 2) →
   Confirmation (step 3). Each step validates its own fields before
   allowing progression. On confirmation, the cart is cleared and a
   mock order number is generated.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  var V = window.App.Validation;
  var FREE_SHIPPING_THRESHOLD = 50;
  var FLAT_SHIPPING_RATE = 5.99;
  var TAX_RATE = 0.08;

  var currentStep = 1;

  var steps = {
    1: document.getElementById("step-1"),
    2: document.getElementById("step-2"),
    3: document.getElementById("step-3"),
  };

  var indicators = {
    1: document.getElementById("step-indicator-1"),
    2: document.getElementById("step-indicator-2"),
    3: document.getElementById("step-indicator-3"),
  };

  /* ---- Step navigation ---- */
  function goToStep(newStep) {
    Object.keys(steps).forEach(function (n) {
      var num = parseInt(n, 10);
      steps[num].hidden = num !== newStep;

      var ind = indicators[num];
      if (!ind) return;
      ind.removeAttribute("aria-current");
      ind.classList.remove("checkout-step--active", "checkout-step--complete");

      if (num === newStep) {
        ind.classList.add("checkout-step--active");
        ind.setAttribute("aria-current", "step");
      } else if (num < newStep) {
        ind.classList.add("checkout-step--complete");
        // Replace number with checkmark for completed steps
        var numEl = ind.querySelector(".checkout-step__number");
        if (numEl) numEl.textContent = "✓";
      }
    });

    currentStep = newStep;
    // Move focus to the panel heading for screen reader orientation
    var heading = steps[newStep] && steps[newStep].querySelector("h1, h2");
    if (heading) {
      heading.setAttribute("tabindex", "-1");
      heading.focus();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---- Order summary sidebar ---- */
  function renderSummary() {
    var items = window.App.Cart.getItems();
    var subtotal = window.App.Cart.getSubtotal();
    var shipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : FLAT_SHIPPING_RATE;
    var tax = subtotal * TAX_RATE;
    var total = subtotal + shipping + tax;

    var summaryItems = document.getElementById("checkout-summary-items");
    if (summaryItems) {
      summaryItems.innerHTML = "";
      items.forEach(function (item) {
        var el = document.createElement("div");
        el.className = "checkout-summary-item";
        el.innerHTML =
          '<img class="checkout-summary-item__image" src="' + item.image + '" alt="" />' +
          '<span class="checkout-summary-item__name">' + escapeHtml(item.name) +
          (item.quantity > 1 ? " ×" + item.quantity : "") + "</span>" +
          '<span class="checkout-summary-item__price">$' + (item.price * item.quantity).toFixed(2) + "</span>";
        summaryItems.appendChild(el);
      });
    }

    setText("co-subtotal", "$" + subtotal.toFixed(2));
    setText("co-shipping", shipping === 0 ? "Free" : "$" + shipping.toFixed(2));
    setText("co-tax", "$" + tax.toFixed(2));
    setText("co-total", "$" + total.toFixed(2));
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  /* ---- Step 1: Shipping form ---- */
  var shippingForm = document.getElementById("shipping-form");
  if (shippingForm) {
    shippingForm.addEventListener("submit", function (event) {
      event.preventDefault();

      var valid = V.validateSection([
        { fieldEl: document.getElementById("first-name"),  errorEl: document.getElementById("first-name-error"),  validator: function(v){ return V.validateRequired(v, "First name"); } },
        { fieldEl: document.getElementById("last-name"),   errorEl: document.getElementById("last-name-error"),   validator: function(v){ return V.validateRequired(v, "Last name"); } },
        { fieldEl: document.getElementById("email"),       errorEl: document.getElementById("email-error"),       validator: V.validateEmail },
        { fieldEl: document.getElementById("address"),     errorEl: document.getElementById("address-error"),     validator: function(v){ return V.validateRequired(v, "Street address"); } },
        { fieldEl: document.getElementById("city"),        errorEl: document.getElementById("city-error"),        validator: function(v){ return V.validateRequired(v, "City"); } },
        { fieldEl: document.getElementById("zip"),         errorEl: document.getElementById("zip-error"),         validator: V.validateZip },
        { fieldEl: document.getElementById("country"),     errorEl: document.getElementById("country-error"),     validator: function(v){ return V.validateRequired(v, "Country"); } },
      ]);

      if (valid) goToStep(2);
    });
  }

  /* ---- Step 2: Payment form ---- */
  var paymentBackBtn = document.getElementById("payment-back-btn");
  if (paymentBackBtn) {
    paymentBackBtn.addEventListener("click", function () { goToStep(1); });
  }

  var paymentForm = document.getElementById("payment-form");
  if (paymentForm) {
    paymentForm.addEventListener("submit", function (event) {
      event.preventDefault();

      var valid = V.validateSection([
        { fieldEl: document.getElementById("name-on-card"), errorEl: document.getElementById("name-on-card-error"), validator: function(v){ return V.validateRequired(v, "Name on card"); } },
        { fieldEl: document.getElementById("card-number"),  errorEl: document.getElementById("card-number-error"),  validator: V.validateCardNumber },
        { fieldEl: document.getElementById("expiry"),       errorEl: document.getElementById("expiry-error"),       validator: V.validateExpiry },
        { fieldEl: document.getElementById("cvv"),          errorEl: document.getElementById("cvv-error"),          validator: V.validateCVV },
      ]);

      if (!valid) return;

      // Mock order confirmation
      var orderNum = "NW-" + Date.now().toString(36).toUpperCase().slice(-6);
      var emailEl = document.getElementById("email");
      var confirmEmail = document.getElementById("confirm-email");
      var confirmOrderNum = document.getElementById("confirm-order-num");

      if (confirmEmail && emailEl) confirmEmail.textContent = emailEl.value;
      if (confirmOrderNum) confirmOrderNum.textContent = orderNum;

      window.App.Cart.clearCart();
      goToStep(3);
    });
  }

  /* ---- Card number auto-formatting (groups of 4 digits) ---- */
  var cardInput = document.getElementById("card-number");
  if (cardInput) {
    cardInput.addEventListener("input", function () {
      var digits = cardInput.value.replace(/\D/g, "").slice(0, 16);
      var formatted = digits.match(/.{1,4}/g);
      cardInput.value = formatted ? formatted.join(" ") : digits;
    });
  }

  /* ---- Expiry auto-formatting (MM/YY) ---- */
  var expiryInput = document.getElementById("expiry");
  if (expiryInput) {
    expiryInput.addEventListener("input", function () {
      var digits = expiryInput.value.replace(/\D/g, "").slice(0, 4);
      if (digits.length >= 3) {
        expiryInput.value = digits.slice(0, 2) + "/" + digits.slice(2);
      } else {
        expiryInput.value = digits;
      }
    });
  }

  // Initial render
  renderSummary();
  goToStep(1);
});
