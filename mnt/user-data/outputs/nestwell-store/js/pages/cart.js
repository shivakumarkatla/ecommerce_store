/* ==========================================================================
   PAGES/CART.JS
   Renders the cart page from App.Cart's stored line items (already
   snapshotted with name/price/image — no catalog fetch needed here).
   Re-renders on every "cart:updated" event, so this page also reflects
   changes made anywhere else on the site.

   Pure functions (getPromoDiscountRate, calculateSummary) are separated
   from DOM logic at the top of the file for independent testability.
   ========================================================================== */

var FREE_SHIPPING_THRESHOLD = 50;
var FLAT_SHIPPING_RATE = 5.99;
var TAX_RATE = 0.08;

var PROMO_CODES = {
  WELCOME10: 0.10,
  SAVE20: 0.20,
};

function getPromoDiscountRate(code) {
  if (!code) return 0;
  return PROMO_CODES[code.trim().toUpperCase()] || 0;
}

/**
 * Pure calculation — returns a full order summary breakdown.
 * Shipping is free when the discounted subtotal meets the threshold
 * OR when the cart is empty (subtotal === 0 avoids showing "$5.99"
 * shipping on an empty order summary).
 */
function calculateSummary(subtotal, discountRate) {
  var discount = subtotal * discountRate;
  var discountedSubtotal = subtotal - discount;
  var shipping =
    discountedSubtotal >= FREE_SHIPPING_THRESHOLD || discountedSubtotal === 0
      ? 0
      : FLAT_SHIPPING_RATE;
  var tax = discountedSubtotal * TAX_RATE;
  var total = discountedSubtotal + shipping + tax;
  return { subtotal: subtotal, discount: discount, shipping: shipping, tax: tax, total: total };
}

/* --------------------------------------------------------------------------
   DOM WIRING
   -------------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  var emptyState  = document.getElementById("cart-empty-state");
  var cartLayout  = document.getElementById("cart-layout");
  var itemsList   = document.getElementById("cart-items-list");
  var promoForm   = document.getElementById("promo-form");
  var promoInput  = document.getElementById("promo-input");
  var promoMsg    = document.getElementById("promo-message");

  if (!itemsList) return;

  var appliedPromoCode = "";

  function fmt(n) { return "$" + n.toFixed(2); }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  /* ---- Main render ---- */
  function render() {
    var items = window.App.Cart.getItems();

    if (items.length === 0) {
      emptyState.hidden = false;
      cartLayout.hidden = true;
      return;
    }

    emptyState.hidden = true;
    cartLayout.hidden = false;
    renderItems(items);
    renderSummary();
  }

  /* ---- Line items ---- */
  function renderItems(items) {
    itemsList.innerHTML = "";
    var fragment = document.createDocumentFragment();

    items.forEach(function (item) {
      var row = document.createElement("article");
      row.className = "cart-item";
      row.dataset.lineId = item.lineId;

      // Flatten variant object into a human-readable string ("Black / M")
      var variantText = Object.keys(item.variant || {})
        .map(function (k) { return item.variant[k]; })
        .join(" / ");

      row.innerHTML =
        '<img class="cart-item__image" src="' + escapeHtml(item.image) + '" alt="" />' +
        '<div class="cart-item__details">' +
          '<h3 class="cart-item__name">' +
            '<a href="product.html?slug=' + encodeURIComponent(item.slug) + '">' + escapeHtml(item.name) + "</a>" +
          "</h3>" +
          (variantText ? '<p class="cart-item__variant">' + escapeHtml(variantText) + "</p>" : "") +
          '<div class="cart-item__footer">' +
            '<div class="stepper">' +
              '<button type="button" class="stepper__btn cart-item__decrease" ' +
                'aria-label="Decrease quantity of ' + escapeHtml(item.name) + '">−</button>' +
              '<input type="number" class="stepper__input cart-item__qty" ' +
                'value="' + item.quantity + '" min="1" max="99" ' +
                'aria-label="Quantity for ' + escapeHtml(item.name) + '" />' +
              '<button type="button" class="stepper__btn cart-item__increase" ' +
                'aria-label="Increase quantity of ' + escapeHtml(item.name) + '">+</button>' +
            "</div>" +
            '<span class="cart-item__price">' + fmt(item.price * item.quantity) + "</span>" +
            '<button type="button" class="cart-item__remove" ' +
              'aria-label="Remove ' + escapeHtml(item.name) + ' from cart">Remove</button>' +
          "</div>" +
        "</div>";

      wireRow(row, item);
      fragment.appendChild(row);
    });

    itemsList.appendChild(fragment);
  }

  function wireRow(row, item) {
    var qtyInput   = row.querySelector(".cart-item__qty");
    var decBtn     = row.querySelector(".cart-item__decrease");
    var incBtn     = row.querySelector(".cart-item__increase");
    var removeBtn  = row.querySelector(".cart-item__remove");

    decBtn.addEventListener("click", function () {
      // Decrement to 0 removes the item (handled inside App.Cart.updateQuantity)
      window.App.Cart.updateQuantity(item.lineId, Math.max(0, parseInt(qtyInput.value, 10) - 1));
    });

    incBtn.addEventListener("click", function () {
      window.App.Cart.updateQuantity(item.lineId, Math.min(99, parseInt(qtyInput.value, 10) + 1));
    });

    qtyInput.addEventListener("change", function () {
      var val = parseInt(qtyInput.value, 10);
      if (isNaN(val) || val < 1) val = 1;
      if (val > 99) val = 99;
      window.App.Cart.updateQuantity(item.lineId, val);
    });

    removeBtn.addEventListener("click", function () {
      window.App.Cart.removeItem(item.lineId);
      window.App.Toast.info(escapeHtml(item.name) + " removed from cart");
    });
  }

  /* ---- Order summary ---- */
  function renderSummary() {
    var subtotal     = window.App.Cart.getSubtotal();
    var rate         = getPromoDiscountRate(appliedPromoCode);
    var s            = calculateSummary(subtotal, rate);

    document.getElementById("summary-subtotal").textContent = fmt(s.subtotal);
    document.getElementById("summary-shipping").textContent = s.shipping === 0 ? "Free" : fmt(s.shipping);
    document.getElementById("summary-tax").textContent      = fmt(s.tax);
    document.getElementById("summary-total").textContent    = fmt(s.total);

    var discountRow = document.getElementById("summary-discount-row");
    if (s.discount > 0) {
      discountRow.hidden = false;
      document.getElementById("summary-discount").textContent = "−" + fmt(s.discount);
    } else {
      discountRow.hidden = true;
    }
  }

  /* ---- Promo code form ---- */
  if (promoForm) {
    promoForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var code = promoInput.value.trim();
      var rate = getPromoDiscountRate(code);

      promoMsg.hidden = false;
      if (rate > 0) {
        appliedPromoCode = code;
        promoMsg.textContent = "Code applied: " + Math.round(rate * 100) + "% off your order";
        promoMsg.style.color = "var(--color-success-500)";
      } else {
        appliedPromoCode = "";
        promoMsg.textContent = "That code isn\u2019t valid. Try WELCOME10 or SAVE20.";
        promoMsg.style.color = "";
      }
      renderSummary();
    });
  }

  // Re-render the full page whenever the cart changes (covers both this
  // page's own stepper/remove actions and the "cart:updated" events those
  // actions emit through App.Cart, which will already have fired before
  // this listener is added — so we call render() once on init below too).
  document.addEventListener("cart:updated", render);

  // Initial render from persisted localStorage state
  render();
});
