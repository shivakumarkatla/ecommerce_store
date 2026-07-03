/* ==========================================================================
   PAGES/SEARCH.JS
   Reads the ?q= query param on load and renders matching products.
   Also wires a debounced "input" listener to the main search field
   so results update live as the user types (without waiting for submit),
   and syncs the URL on each actual search so results are shareable.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  var mainInput      = document.getElementById("search-main-input");
  var headerInput    = document.getElementById("site-search-input");
  var resultsGrid    = document.getElementById("search-results-grid");
  var resultsHeader  = document.getElementById("search-results-header");
  var headingEl      = document.getElementById("search-heading");
  var countEl        = document.getElementById("search-count");
  var promptEl       = document.getElementById("search-prompt");
  var statusEl       = document.getElementById("search-results-status");

  if (!mainInput || !resultsGrid) return;

  var debounceTimer  = null;
  var DEBOUNCE_MS    = 300;

  /* ---- Initial load from URL ---- */
  var params = new URLSearchParams(window.location.search);
  var initialQuery = (params.get("q") || "").trim();

  if (initialQuery) {
    mainInput.value   = initialQuery;
    if (headerInput) headerInput.value = initialQuery;
    runSearch(initialQuery, false);
  }

  /* ---- Live search as user types (debounced) ---- */
  mainInput.addEventListener("input", function () {
    clearTimeout(debounceTimer);
    var query = mainInput.value.trim();
    debounceTimer = setTimeout(function () {
      runSearch(query, true);
    }, DEBOUNCE_MS);
  });

  /* ---- Form submit: update URL so the result is shareable/bookmarkable ---- */
  var mainForm = document.getElementById("search-main-form");
  if (mainForm) {
    mainForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var query = mainInput.value.trim();
      var newUrl = "search.html" + (query ? "?q=" + encodeURIComponent(query) : "");
      window.history.pushState({}, "", newUrl);
      if (headerInput) headerInput.value = query;
      runSearch(query, false);
    });
  }

  /* ---- Core search ---- */
  function runSearch(query, isLive) {
    if (!query) {
      showPrompt();
      return;
    }

    document.title = "Search: " + query + " — Nestwell";

    window.App.Catalog.search(query).then(function (results) {
      var label = results.length === 0
        ? "No results for \u201C" + query + "\u201D"
        : "Results for \u201C" + query + "\u201D";

      if (headingEl) headingEl.textContent = label;
      if (countEl)   countEl.textContent   = results.length + (results.length === 1 ? " product found" : " products found");
      if (statusEl)  statusEl.textContent  = results.length + " products found for " + query;

      promptEl.hidden        = true;
      resultsHeader.hidden   = false;
      resultsGrid.hidden     = false;

      window.App.ProductRender.renderProductGrid(
        resultsGrid,
        results,
        "No products matched \u201C" + query + "\u201D. Try a different search term."
      );
    }).catch(function (err) {
      console.error("Search failed:", err);
      window.App.ProductRender.renderProductGrid(resultsGrid, [], "Search is temporarily unavailable.");
    });
  }

  function showPrompt() {
    promptEl.hidden      = false;
    resultsHeader.hidden = true;
    resultsGrid.hidden   = true;
    document.title       = "Search — Nestwell";
    if (statusEl) statusEl.textContent = "";
  }

  /* ---- Browser back/forward ---- */
  window.addEventListener("popstate", function () {
    var q = new URLSearchParams(window.location.search).get("q") || "";
    mainInput.value = q;
    if (headerInput) headerInput.value = q;
    q ? runSearch(q, false) : showPrompt();
  });
});
