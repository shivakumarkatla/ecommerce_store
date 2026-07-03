/* ==========================================================================
   PAGES/HOME.JS
   Homepage-specific glue code: pulls data from App.Catalog and renders it
   into the grid containers defined in index.html, using App.ProductRender.
   This file has no exports — it's a page script, not a reusable module.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  var categoryGrid = document.getElementById("category-grid");
  var featuredGrid = document.getElementById("featured-product-grid");
  var newArrivalsGrid = document.getElementById("new-arrivals-grid");

  if (categoryGrid) {
    window.App.Catalog.getCategories()
      .then(function (categories) {
        window.App.ProductRender.renderCategoryGrid(categoryGrid, categories);
      })
      .catch(function (err) {
        console.error("Failed to render category grid:", err);
      });
  }

  if (featuredGrid) {
    window.App.Catalog.getFeatured(8)
      .then(function (products) {
        window.App.ProductRender.renderProductGrid(
          featuredGrid,
          products,
          "No featured products right now — check back soon."
        );
      })
      .catch(function (err) {
        console.error("Failed to render featured products:", err);
        window.App.ProductRender.renderProductGrid(featuredGrid, [], "Something went wrong loading products.");
      });
  }

  if (newArrivalsGrid) {
    window.App.Catalog.getNewArrivals(8)
      .then(function (products) {
        window.App.ProductRender.renderProductGrid(
          newArrivalsGrid,
          products,
          "No new arrivals right now — check back soon."
        );
      })
      .catch(function (err) {
        console.error("Failed to render new arrivals:", err);
        window.App.ProductRender.renderProductGrid(newArrivalsGrid, [], "Something went wrong loading products.");
      });
  }
});
