// /logbuch/js/status.js — Version 0.4 (stabil, kompatibel mit status.css)
/**
 * Globale Statusmeldungen
 * -----------------------
 * status.show(message, type?, duration?)
 * status.clear()
 *
 * type: "info" | "ok" | "warn" | "error"
 * duration: ms (0 = dauerhaft)
 */

const status = (() => {
  let el = null;
  let timer = null;

  function ensureElement() {
    if (!el) {
      el = document.createElement("div");
      el.id = "status-bar";
      el.className = "status hidden";
      document.body.appendChild(el);
    }
  }

  function show(message, type = "info", duration = 2500) {
    ensureElement();

    if (timer) clearTimeout(timer);

    el.textContent = message;
    el.className = `status ${type}`;
    el.classList.remove("hidden");

    if (duration > 0) {
      timer = setTimeout(clear, duration);
    }
  }

  function clear() {
    if (!el) return;
    el.classList.add("hidden");
    el.textContent = "";
  }

  return { show, clear };
})();