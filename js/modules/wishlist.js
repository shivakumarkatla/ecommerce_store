/* ==========================================================================
   WISHLIST.JS
   Wishlist state management: toggle/add/remove saved products. Simpler
   than cart.js — no quantities or variants, just a set of product
   snapshots keyed by productId. Same persistence (App.Storage) and
   pub/sub pattern (a "wishlist:updated" CustomEvent) as cart.js, so the
   two modules stay consistent and predictable to work with.
   ========================================================================== */

window.App = window.App || {};

window.App.Wishlist = (function () {
  "use strict";

  var STORAGE_KEY = window.App.Storage.KEYS.WISHLIST;

  function getItems() {
    return window.App.Storage.get(STORAGE_KEY, []);
  }

  function saveItems(items) {
    window.App.Storage.set(STORAGE_KEY, items);
    emitWishlistUpdated(items);
  }

  function emitWishlistUpdated(items) {
    var detail = { items: items, count: items.length };
    document.dispatchEvent(new CustomEvent("wishlist:updated", { detail: detail }));
  }

  function isInWishlist(productId) {
    return getItems().some(function (item) {
      return item.productId === productId;
    });
  }

  /**
   * Add a product to the wishlist. No-op (returns unchanged list) if
   * it's already present, so callers don't need to check first.
   */
  function addItem(product) {
    if (!product || !product.id) {
      console.error("App.Wishlist.addItem: a valid product object is required.");
      return getItems();
    }

    if (isInWishlist(product.id)) {
      return getItems();
    }

    var items = getItems();
    items.push({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.images && product.images[0] ? product.images[0] : "",
    });

    saveItems(items);
    return items;
  }

  function removeItem(productId) {
    var items = getItems().filter(function (item) {
      return item.productId !== productId;
    });
    saveItems(items);
    return items;
  }

  /**
   * Convenience method for the heart-icon button pattern used on
   * product cards: one click handler, no need for the caller to check
   * current state first.
   * @returns {boolean} true if the product is now in the wishlist,
   *   false if it was just removed.
   */
  function toggle(product) {
    if (!product || !product.id) {
      console.error("App.Wishlist.toggle: a valid product object is required.");
      return false;
    }

    if (isInWishlist(product.id)) {
      removeItem(product.id);
      return false;
    }

    addItem(product);
    return true;
  }

  function clearWishlist() {
    saveItems([]);
    return [];
  }

  function getCount() {
    return getItems().length;
  }

  return {
    getItems: getItems,
    isInWishlist: isInWishlist,
    addItem: addItem,
    removeItem: removeItem,
    toggle: toggle,
    clearWishlist: clearWishlist,
    getCount: getCount,
  };
})();
