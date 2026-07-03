/* ==========================================================================
   STORAGE.JS
   Thin wrapper around localStorage: handles JSON serialization, namespaced
   keys, and a safe in-memory fallback if localStorage is unavailable
   (private browsing in some browsers, storage quota exceeded, etc.).

   All modules are attached to a single global `App` namespace object
   rather than using ES modules, since these files load as plain <script>
   tags in a fixed order (see index.html). This avoids polluting the
   global scope with dozens of top-level functions/variables.
   ========================================================================== */

window.App = window.App || {};

window.App.Storage = (function () {
  "use strict";

  // Prefix every key so this app's data never collides with anything
  // else that might use localStorage on the same origin.
  var PREFIX = "nestwell:";

  // Centralized key names — every module should reference these
  // constants rather than typing raw strings, to avoid silent typos
  // that would cause a module to read/write the wrong key.
  var KEYS = {
    CART: "cart",
    WISHLIST: "wishlist",
    SESSION: "session",
    RECENTLY_VIEWED: "recently_viewed",
  };

  // In-memory fallback store, used only if localStorage throws
  // (e.g. Safari private mode in older versions, or storage disabled
  // by browser settings). Data won't persist across reloads in that
  // case, but the app keeps functioning instead of crashing.
  var memoryStore = {};
  var storageAvailable = detectStorageAvailability();

  function detectStorageAvailability() {
    try {
      var testKey = PREFIX + "__test__";
      window.localStorage.setItem(testKey, "1");
      window.localStorage.removeItem(testKey);
      return true;
    } catch (err) {
      console.warn(
        "App.Storage: localStorage unavailable, falling back to in-memory storage. " +
          "Data will not persist across page reloads."
      );
      return false;
    }
  }

  function namespacedKey(key) {
    return PREFIX + key;
  }

  /**
   * Retrieve and JSON-parse a stored value.
   * @param {string} key - one of App.Storage.KEYS
   * @param {*} fallback - returned if the key doesn't exist or parsing fails
   */
  function get(key, fallback) {
    if (fallback === undefined) fallback = null;
    var fullKey = namespacedKey(key);

    try {
      var raw = storageAvailable
        ? window.localStorage.getItem(fullKey)
        : memoryStore[fullKey];

      if (raw === null || raw === undefined) return fallback;
      return JSON.parse(raw);
    } catch (err) {
      console.error("App.Storage.get failed for key \"" + key + "\":", err);
      return fallback;
    }
  }

  /**
   * JSON-stringify and store a value.
   * @returns {boolean} true if the write succeeded
   */
  function set(key, value) {
    var fullKey = namespacedKey(key);

    try {
      var serialized = JSON.stringify(value);
      if (storageAvailable) {
        window.localStorage.setItem(fullKey, serialized);
      } else {
        memoryStore[fullKey] = serialized;
      }
      return true;
    } catch (err) {
      // Most commonly QuotaExceededError. Fall back to memory so the
      // in-page experience continues even if persistence fails.
      console.error("App.Storage.set failed for key \"" + key + "\":", err);
      try {
        memoryStore[fullKey] = JSON.stringify(value);
      } catch (fallbackErr) {
        console.error("App.Storage: in-memory fallback also failed.", fallbackErr);
      }
      return false;
    }
  }

  function remove(key) {
    var fullKey = namespacedKey(key);
    try {
      if (storageAvailable) {
        window.localStorage.removeItem(fullKey);
      }
      delete memoryStore[fullKey];
      return true;
    } catch (err) {
      console.error("App.Storage.remove failed for key \"" + key + "\":", err);
      return false;
    }
  }

  function has(key) {
    var fullKey = namespacedKey(key);
    if (storageAvailable) {
      return window.localStorage.getItem(fullKey) !== null;
    }
    return Object.prototype.hasOwnProperty.call(memoryStore, fullKey);
  }

  return {
    KEYS: KEYS,
    get: get,
    set: set,
    remove: remove,
    has: has,
    isAvailable: function () {
      return storageAvailable;
    },
  };
})();
