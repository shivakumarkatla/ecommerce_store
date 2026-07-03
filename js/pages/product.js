/* ==========================================================================
   PAGES/PRODUCT.JS
   Product Detail Page logic. Reads ?slug= from the URL, loads the
   matching product from App.Catalog, and populates the page shell
   defined in product.html. Handles three states: loading, not-found,
   and loaded — matching the three HTML blocks (#pdp-loading,
   #pdp-not-found, #pdp-content) already in the markup.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  var loadingEl = document.getElementById("pdp-loading");
  var notFoundEl = document.getElementById("pdp-not-found");
  var contentEl = document.getElementById("pdp-content");
  var tabsEl = document.getElementById("pdp-tabs");
  var relatedSection = document.getElementById("related-section");

  if (!contentEl) return; // safety: only run on the actual PDP

  var params = new URLSearchParams(window.location.search);
  var slug = params.get("slug");

  var selectedVariant = {};
  var currentProduct = null;

  function showState(state) {
    loadingEl.hidden = state !== "loading";
    notFoundEl.hidden = state !== "not-found";
    contentEl.hidden = state !== "loaded";
    tabsEl.hidden = state !== "loaded";
    if (relatedSection) relatedSection.hidden = state !== "loaded";
  }

  if (!slug) {
    showState("not-found");
    return;
  }

  window.App.Catalog.getBySlug(slug)
    .then(function (product) {
      if (!product) {
        showState("not-found");
        return;
      }
      currentProduct = product;
      renderProduct(product);
      showState("loaded");
      wireTabs();
      loadRelated(product);
    })
    .catch(function (err) {
      console.error("Failed to load product:", err);
      showState("not-found");
    });

  /* ---- Rendering ---- */
  function renderProduct(product) {
    var Render = window.App.ProductRender;

    document.getElementById("page-title").textContent = product.name + " — Nestwell";
    document.getElementById("page-description").setAttribute("content", product.shortDescription);

    document.getElementById("breadcrumb-category-link").textContent = capitalize(product.category);
    document.getElementById("breadcrumb-category-link").href = "shop.html?category=" + encodeURIComponent(product.category);
    document.getElementById("breadcrumb-product-name").textContent = product.name;

    // Gallery
    var mainImg = document.getElementById("pdp-main-image");
    mainImg.src = product.images[0];
    mainImg.alt = product.name;

    var thumbsEl = document.getElementById("pdp-thumbs");
    thumbsEl.innerHTML = "";
    if (product.images.length > 1) {
      product.images.forEach(function (imgSrc, index) {
        var thumb = document.createElement("button");
        thumb.type = "button";
        thumb.className = "pdp-thumb";
        thumb.setAttribute("aria-pressed", index === 0 ? "true" : "false");
        thumb.setAttribute("aria-label", "View image " + (index + 1) + " of " + product.images.length);
        thumb.innerHTML = '<img src="' + imgSrc + '" alt="" />';
        thumb.addEventListener("click", function () {
          mainImg.src = imgSrc;
          thumbsEl.querySelectorAll(".pdp-thumb").forEach(function (t) {
            t.setAttribute("aria-pressed", "false");
          });
          thumb.setAttribute("aria-pressed", "true");
        });
        thumbsEl.appendChild(thumb);
      });
    }

    document.getElementById("pdp-category").textContent = capitalize(product.category);
    document.getElementById("pdp-title").textContent = product.name;
    document.getElementById("pdp-rating").innerHTML =
      '<span class="rating"><span class="rating__stars" aria-hidden="true">' +
      "★★★★★".slice(0, Math.round(product.rating)) +
      "☆☆☆☆☆".slice(0, 5 - Math.round(product.rating)) +
      '</span><span class="visually-hidden">' +
      product.rating.toFixed(1) + " out of 5 stars, " + product.reviewCount + " reviews</span>" +
      "<span aria-hidden=\"true\">(" + product.reviewCount + " reviews)</span></span>";

    renderPrice(product);

    var stockEl = document.getElementById("pdp-stock-status");
    stockEl.textContent = product.inStock
      ? (product.stockCount <= 5 ? "Only " + product.stockCount + " left in stock" : "In stock")
      : "Out of stock";
    stockEl.className = "pdp-stock-status " + (product.inStock ? "in-stock" : "out-of-stock");

    document.getElementById("pdp-short-description").textContent = product.shortDescription;

    renderVariants(product);

    // Quantity stepper bounds
    var qtyInput = document.getElementById("qty-input");
    qtyInput.value = 1;
    qtyInput.max = product.inStock ? String(Math.min(product.stockCount, 99)) : "0";

    var addBtn = document.getElementById("pdp-add-to-cart-btn");
    addBtn.disabled = !product.inStock;
    addBtn.textContent = product.inStock ? "Add to cart" : "Out of stock";

    var wishlistBtn = document.getElementById("pdp-wishlist-btn");
    var isWishlisted = window.App.Wishlist.isInWishlist(product.id);
    wishlistBtn.classList.toggle("is-active", isWishlisted);
    wishlistBtn.setAttribute("aria-pressed", String(isWishlisted));
    wishlistBtn.setAttribute("aria-label", isWishlisted ? "Remove from wishlist" : "Add to wishlist");

    renderTabContent(product);
  }

  function renderPrice(product) {
    var priceRow = document.getElementById("pdp-price-row");
    if (product.onSale && product.originalPrice) {
      priceRow.innerHTML =
        '<span class="product-card__price">' + window.App.ProductRender.formatPrice(product.price) + "</span>" +
        '<span class="product-card__price--original">' + window.App.ProductRender.formatPrice(product.originalPrice) + "</span>" +
        '<span class="badge badge--sale" style="position:static;">Sale</span>';
    } else {
      priceRow.innerHTML = '<span class="product-card__price">' + window.App.ProductRender.formatPrice(product.price) + "</span>";
    }
  }

  /**
   * Builds one button group per variant type (e.g. "color", "size").
   * Defaults to the first option of each so selectedVariant is always
   * complete by the time Add to Cart is clickable.
   */
  function renderVariants(product) {
    var container = document.getElementById("pdp-variants");
    container.innerHTML = "";
    selectedVariant = {};

    var variantTypes = Object.keys(product.variants || {});
    variantTypes.forEach(function (type) {
      var options = product.variants[type];
      selectedVariant[type] = options[0];

      var group = document.createElement("div");
      group.className = "pdp-variant-group";

      var label = document.createElement("span");
      label.className = "pdp-variant-group__label";
      label.id = "variant-label-" + type;
      label.textContent = capitalize(type) + ": " + options[0];

      var optionsWrap = document.createElement("div");
      optionsWrap.className = "pdp-variant-options";
      optionsWrap.setAttribute("role", "group");
      optionsWrap.setAttribute("aria-labelledby", "variant-label-" + type);

      options.forEach(function (option, i) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "pdp-variant-btn";
        btn.textContent = option;
        btn.setAttribute("aria-pressed", i === 0 ? "true" : "false");
        btn.addEventListener("click", function () {
          selectedVariant[type] = option;
          label.textContent = capitalize(type) + ": " + option;
          optionsWrap.querySelectorAll(".pdp-variant-btn").forEach(function (b) {
            b.setAttribute("aria-pressed", "false");
          });
          btn.setAttribute("aria-pressed", "true");
        });
        optionsWrap.appendChild(btn);
      });

      group.appendChild(label);
      group.appendChild(optionsWrap);
      container.appendChild(group);
    });
  }

  function renderTabContent(product) {
    document.getElementById("tab-panel-description").innerHTML =
      "<p>" + escapeHtml(product.description) + "</p>";

    document.getElementById("tab-panel-reviews").innerHTML =
      "<p>" + product.reviewCount + " customers rated this product an average of " +
      product.rating.toFixed(1) + " out of 5 stars.</p>" +
      "<p>Full review listings aren't available in this preview.</p>";

    document.getElementById("tab-panel-shipping").innerHTML =
      "<p>Free standard shipping on orders over $50. Orders ship within 1-2 business days.</p>" +
      "<p>Returns accepted within 30 days of delivery, in original condition.</p>";
  }

  /* ---- Quantity stepper ---- */
  var qtyInput = document.getElementById("qty-input");
  document.getElementById("qty-decrease").addEventListener("click", function () {
    var val = Math.max(1, parseInt(qtyInput.value, 10) - 1);
    qtyInput.value = val;
  });
  document.getElementById("qty-increase").addEventListener("click", function () {
    var max = parseInt(qtyInput.max, 10) || 99;
    var val = Math.min(max, parseInt(qtyInput.value, 10) + 1);
    qtyInput.value = val;
  });
  qtyInput.addEventListener("change", function () {
    var max = parseInt(qtyInput.max, 10) || 99;
    var val = parseInt(qtyInput.value, 10);
    if (isNaN(val) || val < 1) val = 1;
    if (val > max) val = max;
    qtyInput.value = val;
  });

  /* ---- Add to cart / wishlist ---- */
  document.getElementById("pdp-add-to-cart-btn").addEventListener("click", function () {
    if (!currentProduct) return;
    var qty = parseInt(qtyInput.value, 10) || 1;
    window.App.Cart.addItem(currentProduct, selectedVariant, qty);
    window.App.Toast.success(currentProduct.name + " added to cart");
  });

  document.getElementById("pdp-wishlist-btn").addEventListener("click", function () {
    if (!currentProduct) return;
    var btn = document.getElementById("pdp-wishlist-btn");
    var nowActive = window.App.Wishlist.toggle(currentProduct);
    btn.classList.toggle("is-active", nowActive);
    btn.setAttribute("aria-pressed", String(nowActive));
    btn.setAttribute("aria-label", nowActive ? "Remove from wishlist" : "Add to wishlist");
    window.App.Toast.show(
      nowActive ? currentProduct.name + " added to wishlist" : currentProduct.name + " removed from wishlist",
      { type: nowActive ? "success" : "info" }
    );
  });

  /* ---- Tabs: click + arrow-key navigation (WAI-ARIA tabs pattern) ---- */
  function wireTabs() {
    var tabButtons = Array.prototype.slice.call(tabsEl.querySelectorAll('[role="tab"]'));

    tabButtons.forEach(function (tab, index) {
      tab.addEventListener("click", function () {
        activateTab(tab);
      });

      tab.addEventListener("keydown", function (event) {
        var newIndex = null;
        if (event.key === "ArrowRight") newIndex = (index + 1) % tabButtons.length;
        if (event.key === "ArrowLeft") newIndex = (index - 1 + tabButtons.length) % tabButtons.length;
        if (newIndex !== null) {
          event.preventDefault();
          tabButtons[newIndex].focus();
          activateTab(tabButtons[newIndex]);
        }
      });
    });

    function activateTab(selectedTab) {
      tabButtons.forEach(function (tab) {
        var isSelected = tab === selectedTab;
        tab.setAttribute("aria-selected", String(isSelected));
        tab.setAttribute("tabindex", isSelected ? "0" : "-1");
        var panel = document.getElementById(tab.getAttribute("aria-controls"));
        if (panel) panel.hidden = !isSelected;
      });
    }
  }

  /* ---- Related products ---- */
  function loadRelated(product) {
    window.App.Catalog.getRelated(product, 4).then(function (related) {
      if (related.length === 0) {
        if (relatedSection) relatedSection.hidden = true;
        return;
      }
      window.App.ProductRender.renderProductGrid(document.getElementById("related-products-grid"), related);
    });
  }

  /* ---- Helpers ---- */
  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
});
