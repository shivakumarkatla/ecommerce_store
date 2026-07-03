/* ==========================================================================
   PAGES/SHOP.JS
   Product Listing Page logic. Filter/sort state lives in the URL (query
   params), not just in-memory — so filtered views are shareable and the
   browser back/forward buttons work correctly (via the popstate listener
   at the bottom of this file).

   Pure functions (parseFiltersFromURL, buildQueryString, applyFilters,
   sortProducts) take explicit input and return output with no DOM or
   global access, so they can be tested in isolation. Everything below
   the "DOM WIRING" comment is the glue that connects them to the page.
   ========================================================================== */

var PAGE_SIZE = 8;

/* --------------------------------------------------------------------------
   PURE LOGIC — no DOM access, fully testable in isolation
   -------------------------------------------------------------------------- */

/**
 * @param {string} search - a location.search-style string, e.g. "?category=electronics&on_sale=true"
 * @returns {Object} filters
 */
function parseFiltersFromURL(search) {
  var params = new URLSearchParams(search);
  var categoryParam = params.get("category");

  return {
    categories: categoryParam ? categoryParam.split(",").filter(Boolean) : [],
    priceMin: params.has("price_min") && params.get("price_min") !== "" ? Number(params.get("price_min")) : null,
    priceMax: params.has("price_max") && params.get("price_max") !== "" ? Number(params.get("price_max")) : null,
    inStock: params.get("in_stock") === "true",
    onSale: params.get("on_sale") === "true",
    sort: params.get("sort") || "featured",
  };
}

/**
 * Builds a query string from a filters object, omitting default/empty
 * values so URLs stay clean (e.g. no "?in_stock=false&sort=featured"
 * cluttering every default shop.html visit).
 */
function buildQueryString(filters) {
  var params = new URLSearchParams();

  if (filters.categories && filters.categories.length) {
    params.set("category", filters.categories.join(","));
  }
  if (filters.priceMin !== null && filters.priceMin !== undefined && !isNaN(filters.priceMin)) {
    params.set("price_min", String(filters.priceMin));
  }
  if (filters.priceMax !== null && filters.priceMax !== undefined && !isNaN(filters.priceMax)) {
    params.set("price_max", String(filters.priceMax));
  }
  if (filters.inStock) params.set("in_stock", "true");
  if (filters.onSale) params.set("on_sale", "true");
  if (filters.sort && filters.sort !== "featured") params.set("sort", filters.sort);

  var qs = params.toString();
  return qs ? "?" + qs : "";
}

function applyFilters(products, filters) {
  return products.filter(function (p) {
    if (filters.categories.length && filters.categories.indexOf(p.category) === -1) return false;
    if (filters.priceMin !== null && p.price < filters.priceMin) return false;
    if (filters.priceMax !== null && p.price > filters.priceMax) return false;
    if (filters.inStock && !p.inStock) return false;
    if (filters.onSale && !p.onSale) return false;
    return true;
  });
}

function sortProducts(products, sortKey) {
  var sorted = products.slice();

  switch (sortKey) {
    case "price_low":
      sorted.sort(function (a, b) { return a.price - b.price; });
      break;
    case "price_high":
      sorted.sort(function (a, b) { return b.price - a.price; });
      break;
    case "newest":
      // Array.prototype.sort is stable (ES2019+), so within each group
      // (new vs. not-new) the original catalog order is preserved.
      sorted.sort(function (a, b) { return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0); });
      break;
    case "rating":
      sorted.sort(function (a, b) { return b.rating - a.rating; });
      break;
    case "featured":
    default:
      sorted.sort(function (a, b) {
        var aFeatured = a.tags && a.tags.indexOf("featured") !== -1 ? 0 : 1;
        var bFeatured = b.tags && b.tags.indexOf("featured") !== -1 ? 0 : 1;
        return aFeatured - bFeatured;
      });
      break;
  }

  return sorted;
}

/**
 * Builds a human-readable heading for the current filter state.
 * @param {Object} filters
 * @param {Object} categoryMap - { [categoryId]: displayName }
 */
function buildHeading(filters, categoryMap) {
  if (filters.categories.length === 1) {
    return categoryMap[filters.categories[0]] || "Shop All";
  }
  if (filters.onSale && filters.categories.length === 0) {
    return "Sale";
  }
  return "Shop All";
}

/* --------------------------------------------------------------------------
   DOM WIRING
   -------------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  var gridEl = document.getElementById("product-grid");
  var resultsCountEl = document.getElementById("results-count");
  var headingEl = document.getElementById("shop-heading");
  var breadcrumbEl = document.getElementById("breadcrumb-current");
  var loadMoreBtn = document.getElementById("load-more-btn");
  var filterForm = document.getElementById("filter-form");
  var clearFiltersBtn = document.getElementById("clear-filters");
  var sortSelect = document.getElementById("sort-select");
  var filterSidebar = document.getElementById("filter-sidebar");
  var filterOverlay = document.getElementById("filter-drawer-overlay");
  var filterToggle = document.getElementById("filter-toggle");
  var filterClose = document.getElementById("filter-close");

  if (!gridEl) return; // safety: this script should only run where shop markup exists

  var allProducts = [];
  var categoryMap = {};
  var visibleCount = PAGE_SIZE;
  var currentFilters = parseFiltersFromURL(window.location.search);

  var mediaQuery = window.matchMedia("(min-width: 1024px)");
  var isDrawerOpen = false;

  /* ---- Mobile filter drawer (uses `inert` so closed-off-screen content
     is unreachable by keyboard/screen reader on mobile, while staying
     fully accessible as a static sidebar on desktop) ---- */
  function syncSidebarInertState() {
    if (!filterSidebar) return;
    if (mediaQuery.matches) {
      filterSidebar.inert = false;
    } else {
      filterSidebar.inert = !isDrawerOpen;
    }
  }

  function openFilterDrawer() {
    isDrawerOpen = true;
    filterSidebar.classList.add("is-open");
    if (filterOverlay) {
      filterOverlay.hidden = false;
      requestAnimationFrame(function () {
        filterOverlay.classList.add("is-visible");
      });
    }
    document.body.classList.add("nav-open");
    syncSidebarInertState();
    var firstInput = filterSidebar.querySelector("input, button");
    if (firstInput) firstInput.focus();
  }

  function closeFilterDrawer() {
    isDrawerOpen = false;
    filterSidebar.classList.remove("is-open");
    if (filterOverlay) {
      filterOverlay.classList.remove("is-visible");
      window.setTimeout(function () {
        if (!isDrawerOpen) filterOverlay.hidden = true;
      }, 260);
    }
    document.body.classList.remove("nav-open");
    syncSidebarInertState();
    if (filterToggle) filterToggle.focus();
  }

  if (filterToggle) filterToggle.addEventListener("click", openFilterDrawer);
  if (filterClose) filterClose.addEventListener("click", closeFilterDrawer);
  if (filterOverlay) filterOverlay.addEventListener("click", closeFilterDrawer);
  mediaQuery.addEventListener("change", syncSidebarInertState);
  syncSidebarInertState();

  /* ---- Sync the filter form UI to match the current filters state ---- */
  function syncFormToFilters() {
    if (!filterForm) return;

    filterForm.querySelectorAll('input[name="category"]').forEach(function (checkbox) {
      checkbox.checked = currentFilters.categories.indexOf(checkbox.value) !== -1;
    });

    var inStockInput = filterForm.querySelector('input[name="in_stock"]');
    if (inStockInput) inStockInput.checked = currentFilters.inStock;

    var onSaleInput = filterForm.querySelector('input[name="on_sale"]');
    if (onSaleInput) onSaleInput.checked = currentFilters.onSale;

    var minInput = document.getElementById("price-min");
    var maxInput = document.getElementById("price-max");
    if (minInput) minInput.value = currentFilters.priceMin !== null ? currentFilters.priceMin : "";
    if (maxInput) maxInput.value = currentFilters.priceMax !== null ? currentFilters.priceMax : "";

    if (sortSelect) sortSelect.value = currentFilters.sort;
  }

  /** Reads the current state of the filter form into a filters object. */
  function readFiltersFromForm() {
    var categories = Array.prototype.slice
      .call(filterForm.querySelectorAll('input[name="category"]:checked'))
      .map(function (cb) { return cb.value; });

    var minVal = document.getElementById("price-min").value;
    var maxVal = document.getElementById("price-max").value;

    return {
      categories: categories,
      priceMin: minVal !== "" ? Number(minVal) : null,
      priceMax: maxVal !== "" ? Number(maxVal) : null,
      inStock: filterForm.querySelector('input[name="in_stock"]').checked,
      onSale: filterForm.querySelector('input[name="on_sale"]').checked,
      sort: sortSelect ? sortSelect.value : "featured",
    };
  }

  function applyNewFilters(filters, pushHistory) {
    currentFilters = filters;
    visibleCount = PAGE_SIZE;

    var qs = buildQueryString(currentFilters);
    var newUrl = window.location.pathname + qs;

    if (pushHistory) {
      window.history.pushState({ filters: currentFilters }, "", newUrl);
    } else {
      window.history.replaceState({ filters: currentFilters }, "", newUrl);
    }

    syncFormToFilters();
    render();
  }

  /* ---- Render ---- */
  function render() {
    var filtered = applyFilters(allProducts, currentFilters);
    var sorted = sortProducts(filtered, currentFilters.sort);
    var visible = sorted.slice(0, visibleCount);

    window.App.ProductRender.renderProductGrid(
      gridEl,
      visible,
      "No products match your filters. Try adjusting or clearing them."
    );

    if (resultsCountEl) {
      resultsCountEl.textContent = sorted.length === 0
        ? "0 products found"
        : "Showing " + visible.length + " of " + sorted.length + " products";
    }

    if (loadMoreBtn) {
      loadMoreBtn.hidden = visibleCount >= sorted.length;
    }

    var heading = buildHeading(currentFilters, categoryMap);
    if (headingEl) headingEl.textContent = heading;
    if (breadcrumbEl) breadcrumbEl.textContent = heading;
    document.title = heading + " — Nestwell";
  }

  /* ---- Event wiring ---- */
  if (filterForm) {
    filterForm.addEventListener("submit", function (event) {
      event.preventDefault();
      applyNewFilters(readFiltersFromForm(), true);
      if (!mediaQuery.matches) closeFilterDrawer();
    });
  }

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", function () {
      applyNewFilters(
        { categories: [], priceMin: null, priceMax: null, inStock: false, onSale: false, sort: "featured" },
        true
      );
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", function () {
      var updated = readFiltersFromForm();
      applyNewFilters(updated, true);
    });
  }

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", function () {
      visibleCount += PAGE_SIZE;
      render();
    });
  }

  // Browser back/forward: re-read the URL and re-render to match.
  window.addEventListener("popstate", function () {
    currentFilters = parseFiltersFromURL(window.location.search);
    visibleCount = PAGE_SIZE;
    syncFormToFilters();
    render();
  });

  /* ---- Initial load ---- */
  Promise.all([window.App.Catalog.getAll(), window.App.Catalog.getCategories()])
    .then(function (results) {
      allProducts = results[0];
      results[1].forEach(function (cat) {
        categoryMap[cat.id] = cat.name;
      });
      syncFormToFilters();
      render();
    })
    .catch(function (err) {
      console.error("Failed to load shop data:", err);
      window.App.ProductRender.renderProductGrid(gridEl, [], "Something went wrong loading products.");
    });
});
