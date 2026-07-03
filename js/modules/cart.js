/* ==========================================================================
   CART.JS
   Cart state management: add / remove / update-quantity / totals.
   Persists via App.Storage (localStorage). Each line item stores a
   snapshot of product data (name, price, image) at the time it was
   added — this decouples the cart from needing the full product catalog
   loaded to render itself on the cart/checkout pages.

   Pub/sub: every mutation dispatches a "cart:updated" CustomEvent on
   document, carrying the current items/count/subtotal. UI modules
   (header badge in nav.js, the cart page itself) listen for this rather
   than cart.js reaching into the DOM directly — keeps this module
   UI-agnostic and easy to reuse (e.g. checkout summary, mini-cart).
   ========================================================================== */

window.App = window.App || {};

window.App.Cart = (function () {
  "use strict";

  var STORAGE_KEY = window.App.Storage.KEYS.CART;

  /**
   * Build a stable, unique key for a product + variant combination so
   * "Black / M" and "Black / L" are separate cart lines, but adding
   * "Black / M" twice merges into one line with quantity 2.
   */
  function buildLineId(productId, variant) {
    variant = variant || {};
    var variantKeys = Object.keys(variant).sort();
    var variantPart = variantKeys
      .map(function (k) {
        return k + ":" + variant[k];
      })
      .join("|");
    return variantPart ? productId + "::" + variantPart : productId;
  }

  function getItems() {
    return window.App.Storage.get(STORAGE_KEY, []);
  }

  function saveItems(items) {
    window.App.Storage.set(STORAGE_KEY, items);
    emitCartUpdated(items);
  }

  function emitCartUpdated(items) {
    var detail = {
      items: items,
      count: items.reduce(function (sum, item) {
        return sum + item.quantity;
      }, 0),
      subtotal: items.reduce(function (sum, item) {
        return sum + item.price * item.quantity;
      }, 0),
    };
    document.dispatchEvent(new CustomEvent("cart:updated", { detail: detail }));
  }

  /**
   * Add a product to the cart, or increase quantity if that exact
   * product+variant combination is already present.
   * @param {Object} product - a product record from products.json
   *   (must include id, slug, name, price, images[0])
   * @param {Object} [variant] - e.g. { color: "Black", size: "M" }
   * @param {number} [quantity=1]
   */
  function addItem(product, variant, quantity) {
    variant = variant || {};
    quantity = quantity && quantity > 0 ? quantity : 1;

    if (!product || !product.id) {
      console.error("App.Cart.addItem: a valid product object is required.");
      return getItems();
    }

    var items = getItems();
    var lineId = buildLineId(product.id, variant);
    var existing = items.find(function (item) {
      return item.lineId === lineId;
    });

    if (existing) {
      existing.quantity += quantity;
    } else {
      items.push({
        lineId: lineId,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: product.images && product.images[0] ? product.images[0] : "",
        variant: variant,
        quantity: quantity,
      });
    }

    saveItems(items);
    return items;
  }

  function removeItem(lineId) {
    var items = getItems().filter(function (item) {
      return item.lineId !== lineId;
    });
    saveItems(items);
    return items;
  }

  /**
   * Set an exact quantity for a line item. A quantity of 0 or less
   * removes the line entirely, mirroring how the stepper UI on the
   * cart page will behave (decrementing to 0 removes the item).
   */
  function updateQuantity(lineId, quantity) {
    var items = getItems();

    if (quantity <= 0) {
      return removeItem(lineId);
    }

    var item = items.find(function (i) {
      return i.lineId === lineId;
    });

    if (!item) {
      console.warn("App.Cart.updateQuantity: no line item found for", lineId);
      return items;
    }

    item.quantity = quantity;
    saveItems(items);
    return items;
  }

  function clearCart() {
    saveItems([]);
    return [];
  }

  function getItemCount() {
    return getItems().reduce(function (sum, item) {
      return sum + item.quantity;
    }, 0);
  }

  function getSubtotal() {
    return getItems().reduce(function (sum, item) {
      return sum + item.price * item.quantity;
    }, 0);
  }

  function getLine(lineId) {
    return getItems().find(function (item) {
      return item.lineId === lineId;
    });
  }

  return {
    getItems: getItems,
    addItem: addItem,
    removeItem: removeItem,
    updateQuantity: updateQuantity,
    clearCart: clearCart,
    getItemCount: getItemCount,
    getSubtotal: getSubtotal,
    getLine: getLine,
    buildLineId: buildLineId,
  };
})();
