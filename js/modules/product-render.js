/* ==========================================================================
   PRODUCT-RENDER.JS
   Two responsibilities, kept together because they're tightly coupled:

   1. App.Catalog — loads js/data/products.json once (cached as a shared
      Promise so multiple pages/sections calling it simultaneously only
      trigger a single network request), then exposes query helpers.

   2. App.ProductRender — builds the actual <article class="product-card">
      and <a class="category-card"> DOM structures from product/category
      data, matching the markup contract defined in components.css.
      Reused by home.js, shop.js, search.js, and PDP's "related products".
   ========================================================================== */

window.App = window.App || {};

/* --------------------------------------------------------------------------
   App.Catalog — data loading layer
   Data is embedded directly here (instead of fetched from products.json)
   so the site works when opened as a local file without a server.
   -------------------------------------------------------------------------- */
window.App.Catalog = (function () {
  "use strict";

  // Inline product data — no fetch() needed, works with file:// protocol
  var CATALOG_DATA = {
    "categories": [
      { "id": "electronics", "name": "Electronics", "slug": "electronics" },
      { "id": "home", "name": "Home & Living", "slug": "home" },
      { "id": "fashion", "name": "Fashion", "slug": "fashion" }
    ],
    "products": [
      { "id": "p001", "slug": "wireless-noise-cancelling-headphones", "name": "Wireless Noise-Cancelling Headphones", "category": "electronics", "price": 129.99, "originalPrice": 179.99, "onSale": true, "isNew": false, "inStock": true, "stockCount": 24, "rating": 4.6, "reviewCount": 312, "shortDescription": "Over-ear headphones with adaptive noise cancellation and 30-hour battery life.", "description": "Immerse yourself with adaptive noise cancellation that adjusts to your environment in real time. A 30-hour battery, plush memory-foam ear cushions, and multipoint Bluetooth pairing make these an easy daily driver for commutes, calls, and focus sessions alike.", "images": ["assets/images/products/p001-1.svg", "assets/images/products/p001-2.svg"], "variants": { "color": ["Black", "Silver", "Navy"] }, "tags": ["featured", "trending"] },
      { "id": "p002", "slug": "smart-fitness-watch", "name": "Smart Fitness Watch", "category": "electronics", "price": 89.0, "originalPrice": null, "onSale": false, "isNew": true, "inStock": true, "stockCount": 41, "rating": 4.3, "reviewCount": 156, "shortDescription": "Track workouts, sleep, and heart rate with a 10-day battery.", "description": "A lightweight fitness watch that tracks over 20 workout modes, sleep stages, and continuous heart rate — all on a battery that lasts up to 10 days per charge. Water-resistant to 50m so it keeps up in the pool too.", "images": ["assets/images/products/p002-1.svg", "assets/images/products/p002-2.svg"], "variants": { "color": ["Black", "Rose Gold"] }, "tags": ["new-arrival"] },
      { "id": "p003", "slug": "portable-bluetooth-speaker", "name": "Portable Bluetooth Speaker", "category": "electronics", "price": 45.5, "originalPrice": 59.99, "onSale": true, "isNew": false, "inStock": true, "stockCount": 63, "rating": 4.4, "reviewCount": 204, "shortDescription": "Pocket-sized speaker with 12-hour playtime and IPX7 waterproofing.", "description": "Don't let the size fool you — this speaker fills a room with balanced, punchy sound and holds up to 12 hours on a single charge. IPX7-rated, so poolside splashes and light rain are no problem.", "images": ["assets/images/products/p003-1.svg", "assets/images/products/p003-2.svg"], "variants": { "color": ["Charcoal", "Coral", "Sky Blue"] }, "tags": ["featured"] },
      { "id": "p004", "slug": "mechanical-keyboard-compact", "name": "Compact Mechanical Keyboard", "category": "electronics", "price": 74.99, "originalPrice": null, "onSale": false, "isNew": false, "inStock": true, "stockCount": 18, "rating": 4.7, "reviewCount": 98, "shortDescription": "75% layout mechanical keyboard with hot-swappable switches.", "description": "A space-saving 75% layout without sacrificing the arrow keys or function row. Hot-swappable switches mean you can tune the feel without a soldering iron, and the aluminum top plate keeps the whole board sturdy.", "images": ["assets/images/products/p004-1.svg", "assets/images/products/p004-2.svg"], "variants": { "color": ["White", "Black"] }, "tags": [] },
      { "id": "p005", "slug": "4k-webcam", "name": "4K Webcam with Auto-Frame", "category": "electronics", "price": 59.0, "originalPrice": null, "onSale": false, "isNew": true, "inStock": false, "stockCount": 0, "rating": 4.1, "reviewCount": 41, "shortDescription": "Crisp 4K video with auto-framing and a built-in privacy shutter.", "description": "Sharp 4K video, automatic framing that keeps you centered as you move, and a physical privacy shutter for peace of mind when the camera's off duty.", "images": ["assets/images/products/p005-1.svg", "assets/images/products/p005-2.svg"], "variants": {}, "tags": ["new-arrival"] },
      { "id": "p006", "slug": "wireless-charging-pad", "name": "3-in-1 Wireless Charging Pad", "category": "electronics", "price": 34.99, "originalPrice": 44.99, "onSale": true, "isNew": false, "inStock": true, "stockCount": 55, "rating": 4.2, "reviewCount": 87, "shortDescription": "Charge your phone, watch, and earbuds at once.", "description": "One pad, three charging spots — phone, smartwatch, and earbuds all topped up overnight without a tangle of cables on your nightstand.", "images": ["assets/images/products/p006-1.svg", "assets/images/products/p006-2.svg"], "variants": { "color": ["White", "Black"] }, "tags": ["featured"] },
      { "id": "p007", "slug": "ceramic-pour-over-set", "name": "Ceramic Pour-Over Coffee Set", "category": "home", "price": 42.0, "originalPrice": null, "onSale": false, "isNew": true, "inStock": true, "stockCount": 30, "rating": 4.8, "reviewCount": 67, "shortDescription": "Hand-glazed ceramic dripper with matching carafe.", "description": "A slow-poured cup, made simple. The hand-glazed dripper sits snugly on the matching 600ml carafe, and the double-wall design keeps your coffee hotter for longer.", "images": ["assets/images/products/p007-1.svg", "assets/images/products/p007-2.svg"], "variants": { "color": ["Sand", "Sage", "Charcoal"] }, "tags": ["new-arrival", "featured"] },
      { "id": "p008", "slug": "linen-throw-blanket", "name": "Washed Linen Throw Blanket", "category": "home", "price": 58.0, "originalPrice": 72.0, "onSale": true, "isNew": false, "inStock": true, "stockCount": 22, "rating": 4.5, "reviewCount": 133, "shortDescription": "Breathable, pre-washed linen that softens with every wash.", "description": "Stonewashed for softness right out of the bag, this linen throw breathes in summer and layers well in winter. Machine washable, and it only gets better with age.", "images": ["assets/images/products/p008-1.svg", "assets/images/products/p008-2.svg"], "variants": { "color": ["Oat", "Clay", "Forest"] }, "tags": ["featured"] },
      { "id": "p009", "slug": "cast-iron-skillet", "name": "10-Inch Cast Iron Skillet", "category": "home", "price": 36.5, "originalPrice": null, "onSale": false, "isNew": false, "inStock": true, "stockCount": 47, "rating": 4.9, "reviewCount": 289, "shortDescription": "Pre-seasoned skillet built to last generations.", "description": "Pre-seasoned and ready to cook from day one, this skillet goes from stovetop to oven to table. With proper care, it's the kind of pan you hand down.", "images": ["assets/images/products/p009-1.svg", "assets/images/products/p009-2.svg"], "variants": {}, "tags": [] },
      { "id": "p010", "slug": "rattan-pendant-light", "name": "Rattan Pendant Light Shade", "category": "home", "price": 64.0, "originalPrice": null, "onSale": false, "isNew": true, "inStock": true, "stockCount": 15, "rating": 4.4, "reviewCount": 52, "shortDescription": "Hand-woven rattan shade that casts warm, dappled light.", "description": "Hand-woven from natural rattan, this pendant shade filters light into a warm, dappled glow — a simple way to add texture to any room without a full rewire.", "images": ["assets/images/products/p010-1.svg", "assets/images/products/p010-2.svg"], "variants": { "size": ["Small", "Medium", "Large"] }, "tags": ["new-arrival"] },
      { "id": "p011", "slug": "stoneware-dinnerware-set", "name": "Stoneware Dinnerware Set (16-Piece)", "category": "home", "price": 96.0, "originalPrice": 128.0, "onSale": true, "isNew": false, "inStock": true, "stockCount": 12, "rating": 4.6, "reviewCount": 78, "shortDescription": "Service for four — dinner plates, side plates, bowls, and mugs.", "description": "A complete service for four with a soft matte glaze that hides everyday scratches. Dishwasher, microwave, and oven safe up to 450°F.", "images": ["assets/images/products/p011-1.svg", "assets/images/products/p011-2.svg"], "variants": { "color": ["Ivory", "Slate"] }, "tags": ["featured"] },
      { "id": "p012", "slug": "aroma-diffuser", "name": "Ultrasonic Aroma Diffuser", "category": "home", "price": 28.99, "originalPrice": null, "onSale": false, "isNew": false, "inStock": true, "stockCount": 60, "rating": 4.0, "reviewCount": 145, "shortDescription": "Whisper-quiet mist with seven ambient light settings.", "description": "A whisper-quiet ultrasonic diffuser that runs up to 8 hours per fill, with seven soft light settings for a calmer evening wind-down.", "images": ["assets/images/products/p012-1.svg", "assets/images/products/p012-2.svg"], "variants": { "color": ["White", "Wood Grain"] }, "tags": [] },
      { "id": "p013", "slug": "organic-cotton-tee", "name": "Organic Cotton Crewneck Tee", "category": "fashion", "price": 24.0, "originalPrice": null, "onSale": false, "isNew": true, "inStock": true, "stockCount": 120, "rating": 4.5, "reviewCount": 210, "shortDescription": "Heavyweight organic cotton with a relaxed fit.", "description": "A heavyweight organic cotton tee with a relaxed, not-baggy fit. Garment-dyed for a slightly worn-in look straight out of the bag, and it holds its shape wash after wash.", "images": ["assets/images/products/p013-1.svg", "assets/images/products/p013-2.svg"], "variants": { "color": ["Black", "Bone", "Olive"], "size": ["XS", "S", "M", "L", "XL"] }, "tags": ["new-arrival", "featured"] },
      { "id": "p014", "slug": "canvas-tote-bag", "name": "Heavy Canvas Tote Bag", "category": "fashion", "price": 32.0, "originalPrice": 40.0, "onSale": true, "isNew": false, "inStock": true, "stockCount": 88, "rating": 4.7, "reviewCount": 164, "shortDescription": "12oz canvas tote built for daily hauling.", "description": "Built from 12oz canvas with reinforced stitching at every stress point, this tote is made for the daily grind — groceries, laptops, gym clothes, all of it.", "images": ["assets/images/products/p014-1.svg", "assets/images/products/p014-2.svg"], "variants": { "color": ["Natural", "Black"] }, "tags": ["featured"] },
      { "id": "p015", "slug": "wool-blend-scarf", "name": "Wool-Blend Scarf", "category": "fashion", "price": 38.0, "originalPrice": null, "onSale": false, "isNew": false, "inStock": true, "stockCount": 34, "rating": 4.3, "reviewCount": 59, "shortDescription": "Soft wool-blend weave in classic plaid.", "description": "A soft wool-blend weave in a classic plaid, long enough to wrap twice and warm enough for anything short of a blizzard.", "images": ["assets/images/products/p015-1.svg", "assets/images/products/p015-2.svg"], "variants": { "color": ["Camel Plaid", "Grey Plaid"] }, "tags": [] },
      { "id": "p016", "slug": "leather-minimalist-wallet", "name": "Leather Minimalist Wallet", "category": "fashion", "price": 45.0, "originalPrice": 55.0, "onSale": true, "isNew": false, "inStock": true, "stockCount": 27, "rating": 4.6, "reviewCount": 101, "shortDescription": "Full-grain leather, slim enough for a front pocket.", "description": "Full-grain leather that develops a rich patina over time, cut slim enough to disappear in a front pocket while still holding four cards and folded bills.", "images": ["assets/images/products/p016-1.svg", "assets/images/products/p016-2.svg"], "variants": { "color": ["Cognac", "Espresso", "Black"] }, "tags": ["featured"] },
      { "id": "p017", "slug": "canvas-low-top-sneakers", "name": "Canvas Low-Top Sneakers", "category": "fashion", "price": 52.0, "originalPrice": null, "onSale": false, "isNew": true, "inStock": true, "stockCount": 40, "rating": 4.4, "reviewCount": 92, "shortDescription": "Classic canvas sneaker with a cushioned insole.", "description": "A classic canvas low-top with a cushioned insole and a vulcanized rubber sole built to handle actual walking, not just standing around looking good.", "images": ["assets/images/products/p017-1.svg", "assets/images/products/p017-2.svg"], "variants": { "color": ["White", "Black", "Navy"], "size": ["6", "7", "8", "9", "10", "11"] }, "tags": ["new-arrival"] },
      { "id": "p018", "slug": "structured-baseball-cap", "name": "Structured Baseball Cap", "category": "fashion", "price": 26.0, "originalPrice": null, "onSale": false, "isNew": false, "inStock": false, "stockCount": 0, "rating": 4.2, "reviewCount": 38, "shortDescription": "Structured six-panel cap with an adjustable strap.", "description": "A structured six-panel cap that holds its shape, with an adjustable strap in back for a sizing that actually fits.", "images": ["assets/images/products/p018-1.svg", "assets/images/products/p018-2.svg"], "variants": { "color": ["Black", "Khaki"] }, "tags": [] }
    ]
  };

  var cachePromise = null;

  function load() {
    if (cachePromise) return cachePromise;
    cachePromise = Promise.resolve(CATALOG_DATA);
    return cachePromise;
  }

  function getAll() {
    return load().then(function (data) {
      return data.products;
    });
  }

  function getCategories() {
    return load().then(function (data) {
      return data.categories;
    });
  }

  function getById(id) {
    return getAll().then(function (products) {
      return products.find(function (p) {
        return p.id === id;
      });
    });
  }

  function getBySlug(slug) {
    return getAll().then(function (products) {
      return products.find(function (p) {
        return p.slug === slug;
      });
    });
  }

  function getByCategory(categoryId) {
    return getAll().then(function (products) {
      return products.filter(function (p) {
        return p.category === categoryId;
      });
    });
  }

  function getFeatured(limit) {
    return getAll().then(function (products) {
      var results = products.filter(function (p) {
        return p.tags && p.tags.indexOf("featured") !== -1;
      });
      return limit ? results.slice(0, limit) : results;
    });
  }

  function getNewArrivals(limit) {
    return getAll().then(function (products) {
      var results = products.filter(function (p) {
        return p.isNew === true;
      });
      return limit ? results.slice(0, limit) : results;
    });
  }

  function getOnSale(limit) {
    return getAll().then(function (products) {
      var results = products.filter(function (p) {
        return p.onSale === true;
      });
      return limit ? results.slice(0, limit) : results;
    });
  }

  /**
   * Case-insensitive search across name and short description.
   * Returns [] (not a rejected promise) if query is empty, so callers
   * can call this unconditionally without guarding first.
   */
  function search(query, limit) {
    if (!query || !query.trim()) {
      return Promise.resolve([]);
    }
    var needle = query.trim().toLowerCase();

    return getAll().then(function (products) {
      var results = products.filter(function (p) {
        return (
          p.name.toLowerCase().indexOf(needle) !== -1 ||
          p.shortDescription.toLowerCase().indexOf(needle) !== -1 ||
          p.category.toLowerCase().indexOf(needle) !== -1
        );
      });
      return limit ? results.slice(0, limit) : results;
    });
  }

  /**
   * Related products: same category, excluding the current product,
   * capped at `limit`. Used on the PDP.
   */
  function getRelated(product, limit) {
    limit = limit || 4;
    return getByCategory(product.category).then(function (products) {
      return products
        .filter(function (p) {
          return p.id !== product.id;
        })
        .slice(0, limit);
    });
  }

  return {
    load: load,
    getAll: getAll,
    getCategories: getCategories,
    getById: getById,
    getBySlug: getBySlug,
    getByCategory: getByCategory,
    getFeatured: getFeatured,
    getNewArrivals: getNewArrivals,
    getOnSale: getOnSale,
    getRelated: getRelated,
    search: search,
  };
})();

/* --------------------------------------------------------------------------
   App.ProductRender — rendering layer
   -------------------------------------------------------------------------- */
window.App.ProductRender = (function () {
  "use strict";

  /** Escapes text before it's placed inside an HTML template string.
   * Even though this app's data is local/trusted JSON, this keeps the
   * rendering path safe by default and costs nothing. */
  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function formatPrice(amount) {
    return "$" + Number(amount).toFixed(2);
  }

  /**
   * Builds a visual + accessible star rating.
   * The stars themselves are aria-hidden (decorative); a visually-hidden
   * text node carries the actual numeric rating for screen readers.
   */
  function renderRatingMarkup(rating, reviewCount) {
    var rounded = Math.round(rating);
    var stars = "★★★★★".slice(0, rounded) + "☆☆☆☆☆".slice(0, 5 - rounded);
    var srText = rating.toFixed(1) + " out of 5 stars, " + reviewCount + " reviews";

    return (
      '<span class="rating">' +
      '<span class="rating__stars" aria-hidden="true">' + stars + "</span>" +
      '<span class="visually-hidden">' + escapeHtml(srText) + "</span>" +
      '<span aria-hidden="true">(' + reviewCount + ")</span>" +
      "</span>"
    );
  }

  function renderBadgeMarkup(product) {
    if (!product.inStock) {
      return '<span class="badge badge--out-of-stock">Out of stock</span>';
    }
    if (product.onSale) {
      return '<span class="badge badge--sale">Sale</span>';
    }
    if (product.isNew) {
      return '<span class="badge badge--new">New</span>';
    }
    return "";
  }

  function renderPriceMarkup(product) {
    if (product.onSale && product.originalPrice) {
      return (
        '<span class="product-card__price">' + formatPrice(product.price) + "</span>" +
        '<span class="product-card__price--original">' + formatPrice(product.originalPrice) + "</span>"
      );
    }
    return '<span class="product-card__price">' + formatPrice(product.price) + "</span>";
  }

  /**
   * Builds a single product card as a DOM element (not just an HTML
   * string) so we can attach real event listeners to its buttons
   * before it's inserted into the page.
   */
  function createProductCard(product) {
    var isWishlisted = window.App.Wishlist ? window.App.Wishlist.isInWishlist(product.id) : false;

    var wrapper = document.createElement("article");
    wrapper.className = "product-card";
    wrapper.dataset.productId = product.id;

    wrapper.innerHTML =
      '<div class="product-card__media">' +
      renderBadgeMarkup(product) +
      '<button type="button" class="icon-btn product-card__wishlist-btn' +
      (isWishlisted ? " is-active" : "") +
      '" aria-pressed="' + isWishlisted + '" aria-label="' +
      (isWishlisted ? "Remove from wishlist" : "Add to wishlist") + '">' +
      '<svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M12 21s-7-4.35-9.5-8.5C.6 8.9 2.2 5 6 5c2 0 3.3 1 4 2 0.7-1 2-2 4-2 3.8 0 5.4 3.9 3.5 7.5C19 16.65 12 21 12 21z" stroke="currentColor" stroke-width="2" fill="' +
      (isWishlisted ? "currentColor" : "none") + '"/></svg>' +
      "</button>" +
      '<a href="product.html?slug=' + encodeURIComponent(product.slug) + '" tabindex="-1" aria-hidden="true">' +
      '<img class="product-card__image" src="' + escapeHtml(product.images[0]) + '" alt="" loading="lazy" width="600" height="600" />' +
      "</a>" +
      "</div>" +
      '<div class="product-card__body">' +
      '<p class="product-card__category">' + escapeHtml(product.category) + "</p>" +
      '<h3 class="product-card__title"><a href="product.html?slug=' + encodeURIComponent(product.slug) + '">' + escapeHtml(product.name) + "</a></h3>" +
      renderRatingMarkup(product.rating, product.reviewCount) +
      '<div class="product-card__price-row">' + renderPriceMarkup(product) + "</div>" +
      '<button type="button" class="btn btn--secondary btn--sm product-card__add-btn"' +
      (product.inStock ? "" : " disabled") +
      ">" + (product.inStock ? "Add to cart" : "Out of stock") + "</button>" +
      "</div>";

    // Wire up the wishlist toggle button
    var wishlistBtn = wrapper.querySelector(".product-card__wishlist-btn");
    wishlistBtn.addEventListener("click", function () {
      var nowActive = window.App.Wishlist.toggle(product);
      wishlistBtn.classList.toggle("is-active", nowActive);
      wishlistBtn.setAttribute("aria-pressed", String(nowActive));
      wishlistBtn.setAttribute("aria-label", nowActive ? "Remove from wishlist" : "Add to wishlist");
      var svgPath = wishlistBtn.querySelector("path");
      if (svgPath) svgPath.setAttribute("fill", nowActive ? "currentColor" : "none");
      window.App.Toast.show(
        nowActive ? product.name + " added to wishlist" : product.name + " removed from wishlist",
        { type: nowActive ? "success" : "info" }
      );
    });

    // Wire up the quick add-to-cart button (adds with no variant selected —
    // full variant selection happens on the PDP for products that have any)
    var addBtn = wrapper.querySelector(".product-card__add-btn");
    if (product.inStock) {
      addBtn.addEventListener("click", function () {
        window.App.Cart.addItem(product, {}, 1);
        window.App.Toast.success(product.name + " added to cart");
      });
    }

    return wrapper;
  }

  function createCategoryCard(category) {
    var link = document.createElement("a");
    link.className = "category-card";
    link.href = "shop.html?category=" + encodeURIComponent(category.slug);
    link.innerHTML =
      '<svg class="icon category-card__icon" aria-hidden="true" viewBox="0 0 24 24">' +
      '<rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" stroke-width="2" fill="none"/>' +
      '<path d="M3 9h18M9 21V9" stroke="currentColor" stroke-width="2"/>' +
      "</svg>" +
      "<span>" + escapeHtml(category.name) + "</span>";
    return link;
  }

  /**
   * Renders a list of products into a grid container, replacing
   * whatever was there before (e.g. skeleton loaders). Shows an
   * empty-state block if the list is empty.
   */
  function renderProductGrid(container, products, emptyMessage) {
    if (!container) {
      console.error("App.ProductRender.renderProductGrid: container element is required.");
      return;
    }

    container.innerHTML = "";

    if (!products || products.length === 0) {
      var empty = document.createElement("div");
      empty.className = "empty-state";
      empty.innerHTML =
        '<svg class="empty-state__icon" aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" fill="none"/><path d="M21 21l-4.3-4.3" stroke="currentColor" stroke-width="2"/></svg>' +
        "<p>" + escapeHtml(emptyMessage || "No products found.") + "</p>";
      container.appendChild(empty);
      return;
    }

    var fragment = document.createDocumentFragment();
    products.forEach(function (product) {
      fragment.appendChild(createProductCard(product));
    });
    container.appendChild(fragment);
  }

  function renderCategoryGrid(container, categories) {
    if (!container) {
      console.error("App.ProductRender.renderCategoryGrid: container element is required.");
      return;
    }
    container.innerHTML = "";
    var fragment = document.createDocumentFragment();
    categories.forEach(function (category) {
      fragment.appendChild(createCategoryCard(category));
    });
    container.appendChild(fragment);
  }

  return {
    formatPrice: formatPrice,
    createProductCard: createProductCard,
    createCategoryCard: createCategoryCard,
    renderProductGrid: renderProductGrid,
    renderCategoryGrid: renderCategoryGrid,
  };
})();