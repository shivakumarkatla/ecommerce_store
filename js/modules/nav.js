/* ==========================================================================
   NAV.JS
   Two responsibilities:
   1. Mobile off-canvas nav: open/close the drawer, trap focus sensibly,
      dismiss via overlay click / Escape key / nav link click.
   2. Header cart badge: stays in sync with cart state by listening for
      the "cart:updated" event dispatched by cart.js — this module never
      calls into cart.js directly to read state proactively, it just
      reacts to what cart.js broadcasts. Also does one manual sync on
      init, since the cart may already have items from a previous
      session (localStorage) before any "cart:updated" event fires.
   ========================================================================== */

window.App = window.App || {};

window.App.Nav = (function () {
  "use strict";

  var menuToggle, mobileNav, drawerOverlay, cartBadge, cartLink;
  var isDrawerOpen = false;

  function openDrawer() {
    isDrawerOpen = true;
    mobileNav.hidden = false;
    drawerOverlay.hidden = false;

    // Two rAF-free ticks isn't necessary here since hidden->visible plus
    // the transform transition in layout.css only needs the class added
    // after the element is actually in the render tree, which removing
    // `hidden` already accomplishes synchronously enough for the
    // transition to be observed on the next frame.
    requestAnimationFrame(function () {
      mobileNav.classList.add("is-open");
      drawerOverlay.classList.add("is-visible");
    });

    menuToggle.setAttribute("aria-expanded", "true");
    document.body.classList.add("nav-open");

    // Move focus into the drawer for keyboard/screen-reader users —
    // the first link is the natural landing point.
    var firstLink = mobileNav.querySelector("a");
    if (firstLink) firstLink.focus();

    document.addEventListener("keydown", handleKeydown);
  }

  function closeDrawer() {
    isDrawerOpen = false;
    mobileNav.classList.remove("is-open");
    drawerOverlay.classList.remove("is-visible");
    menuToggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("nav-open");
    document.removeEventListener("keydown", handleKeydown);

    // Wait for the CSS transform transition to finish before setting
    // `hidden` (which removes it from layout/accessibility tree
    // instantly) — otherwise the drawer would visually snap out of
    // view instead of sliding.
    window.setTimeout(function () {
      if (!isDrawerOpen) {
        mobileNav.hidden = true;
        drawerOverlay.hidden = true;
      }
    }, 260); // slightly longer than --transition-base (250ms)

    // Return focus to the toggle button so keyboard users don't lose
    // their place after closing.
    menuToggle.focus();
  }

  function toggleDrawer() {
    if (isDrawerOpen) {
      closeDrawer();
    } else {
      openDrawer();
    }
  }

  function handleKeydown(event) {
    if (event.key === "Escape") {
      closeDrawer();
    }
  }

  function updateCartBadge(count) {
    if (!cartBadge) return;
    cartBadge.textContent = count > 99 ? "99+" : String(count);
    cartBadge.classList.toggle("is-empty", count === 0);
    if (cartLink) {
      cartLink.setAttribute(
        "aria-label",
        "Cart, " + count + (count === 1 ? " item" : " items")
      );
    }
  }

  function init() {
    menuToggle = document.getElementById("menu-toggle");
    mobileNav = document.getElementById("mobile-nav");
    drawerOverlay = document.getElementById("drawer-overlay");
    cartBadge = document.getElementById("cart-badge");
    cartLink = document.querySelector(".site-header__cart");

    if (!menuToggle || !mobileNav || !drawerOverlay) {
      console.error("App.Nav.init: one or more required header elements are missing from the DOM.");
      return;
    }

    menuToggle.addEventListener("click", toggleDrawer);
    drawerOverlay.addEventListener("click", closeDrawer);

    // Closing on link click matters even for full page navigations:
    // without it, a user who taps back (browser bfcache) can land back
    // on a page with the drawer still visually open before JS re-inits.
    mobileNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeDrawer);
    });

    // Sync badge immediately from persisted cart state (localStorage),
    // since no "cart:updated" event has fired yet on a fresh page load.
    if (window.App.Cart) {
      updateCartBadge(window.App.Cart.getItemCount());
    }

    // Stay in sync with any future cart changes on this page.
    document.addEventListener("cart:updated", function (event) {
      updateCartBadge(event.detail.count);
    });
  }

  return {
    init: init,
    openDrawer: openDrawer,
    closeDrawer: closeDrawer,
  };
})();
