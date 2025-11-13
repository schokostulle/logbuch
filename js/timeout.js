// /logbuch/js/timeout.js — Version 1.0 (stabil + responsive + nav-sync)
// Session-Timeout basiert auf sichtbarer Navigation & Benutzeraktivität

(function initTimeout() {
  const DISPLAY_SELECTOR = ".nav-session .timeout";
  const DEFAULT_DURATION_MIN = 15;
  const REFRESH_INTERVAL = 1000;

  let timeLeft = DEFAULT_DURATION_MIN * 60;
  let timerInterval = null;
  let waitAttempts = 0;

  // ------------------------------
  // Hilfsfunktionen
  // ------------------------------

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  function getDisplayElement() {
    return document.querySelector(DISPLAY_SELECTOR);
  }

  function updateDisplay() {
    const el = getDisplayElement();
    if (!el) return; // Navigation evtl. noch nicht fertig

    el.textContent = `[${formatTime(timeLeft)}]`;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      el.textContent = "[00:00]";
      el.style.color = "red";

      status.show("Session abgelaufen. Sie werden abgemeldet.", "warn");

      setTimeout(() => {
        sessionStorage.setItem("lastExit", "pending");
        window.location.href = "gate.html";
      }, 2000);
    }
  }

  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);

    updateDisplay();
    timerInterval = setInterval(() => {
      timeLeft--;
      updateDisplay();
    }, REFRESH_INTERVAL);
  }

  function resetTimer() {
    timeLeft = DEFAULT_DURATION_MIN * 60;
    updateDisplay();
  }

  // Throttling für mousemove
  let lastMove = 0;
  function throttledMove() {
    const now = Date.now();
    if (now - lastMove < 800) return;
    lastMove = now;
    resetTimer();
  }

  // ------------------------------
  // Timer nur starten, wenn Nav bereit
  // ------------------------------
  function waitForNav() {
    const el = getDisplayElement();
    if (el) {
      // Navigation existiert → Timer starten
      startTimer();
      return;
    }

    // 30 Sekunden lang prüfen
    if (waitAttempts++ < 60) {
      setTimeout(waitForNav, 500);
    }
  }

  // ------------------------------
  // Initialisierung
  // ------------------------------
  window.addEventListener("load", () => {
    // Nur starten, wenn wir im App-Modus sind (Dashboard, Member, …)
    if (!document.querySelector("#nav")) return;

    waitForNav();
  });

  // Benutzeraktivität → Timer verlängern
  document.addEventListener("click", resetTimer);
  document.addEventListener("keypress", resetTimer);
  document.addEventListener("mousemove", throttledMove);

  // Extern verfügbar
  window.sessionTimer = {
    reset: resetTimer,
    stop: () => clearInterval(timerInterval)
  };
})();