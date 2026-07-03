/* ==========================================================================
   PAGES/WISHLIST.JS
   Renders wishlist items as product cards extended with "Move to cart"
   and "Remove" actions. Re-renders on every "wishlist:updated" event
   so the grid stays in sync when items are toggled from other pages.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  var emptyEl   = document.getElementById("wishlist-empty");
  var gridEl    = document.getElementById("wishlist-grid");
  var countEl   = document.getElementById("wishlist-count");

  if (!gridEl) return;

  function render() {
    var items = window.App.Wishlist.getItems();

    if (countEl) {
      countEl.textContent = items.length === 0
        ? ""
        : items.length + (items.length === 1 ? " item" : " items");
    }

    if (items.length === 0) {
      emptyEl.hidden = false;
      gridEl.hidden  = true;
      return;
    }

    emptyEl.hidden = false;  // keep hidden
    emptyEl.hidden = true;
    gridEl.hidden  = false;
    gridEl.innerHTML = "";

    var fragment = document.createDocumentFragment();

    items.forEach(function (item) {
      var card = document.createElement("article");
      card.className = "wishlist-card";

      card.innerHTML =
        '<div class="product-card__media">' +
          '<a href="product.html?slug=' + encodeURIComponent(item.slug) + '" tabindex="-1" aria-hidden="true">' +
            '<img class="product-card__image" src="' + escapeHtml(item.image) + '" alt="" loading="lazy" />' +
          '</a>' +
        '</div>' +
        '<div class="product-card__body">' +
          '<h3 class="product-card__title">' +
            '<a href="product.html?slug=' + encodeURIComponent(item.slug) + '">' + escapeHtml(item.name) + '</a>' +
          '</h3>' +
          '<div class="product-card__price-row">' +
            '<span class="product-card__price">$' + Number(item.price).toFixed(2) + '</span>' +
          '</div>' +
          '<div class="wishlist-card__actions">' +
            '<button type="button" class="btn btn--primary btn--sm wishlist-card__add">Move to cart</button>' +
            '<button type="button" class="btn btn--ghost btn--sm wishlist-card__remove">Remove</button>' +
          '</div>' +
        '</div>';

      var addBtn    = card.querySelector(".wishlist-card__add");
      var removeBtn = card.querySelector(".wishlist-card__remove");

      addBtn.addEventListener("click", function () {
        // Build a minimal product-shaped object from the wishlist snapshot
        window.App.Cart.addItem(
          { id: item.productId, slug: item.slug, name: item.name, price: item.price, images: [item.image] },
          {},
          1
        );
        window.App.Wishlist.removeItem(item.productId);
        window.App.Toast.success(item.name + " moved to cart");
      });

      removeBtn.addEventListener("click", function () {
        window.App.Wishlist.removeItem(item.productId);
        window.App.Toast.info(item.name + " removed from wishlist");
      });

      fragment.appendChild(card);
    });

    gridEl.appendChild(fragment);
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  document.addEventListener("wishlist:updated", render);
  render();
});
