// /logbuch/js/timeout.js — Version 0.4
// Anzeige & Countdown für Session-Timeout im Navigationsbereich
(function initTimeout() {
  const DISPLAY_SELECTOR = ".nav-session .timeout";
  const DEFAULT_DURATION_MIN = 15; // Standard-Sitzungszeit (15 Min)
  const REFRESH_INTERVAL = 1000; // 1 Sekunde

  let timeLeft = DEFAULT_DURATION_MIN * 60; // Sekunden
  let timerInterval;

  /**
   * Formatiert Sekunden zu MM:SS
   */
  function formatTime(seconds) {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  }

  /**
   * Anzeige aktualisieren
   */
  function updateDisplay() {
    const el = document.querySelector(DISPLAY_SELECTOR);
    if (!el) return;

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

  /**
   * Countdown starten
   */
  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    updateDisplay();
    timerInterval = setInterval(() => {
      timeLeft--;
      updateDisplay();
    }, REFRESH_INTERVAL);
  }

  /**
   * Timer zurücksetzen (z. B. bei Benutzeraktion)
   */
  function resetTimer() {
    timeLeft = DEFAULT_DURATION_MIN * 60;
    updateDisplay();
  }

  // Timer automatisch starten, sobald DOM geladen ist
  window.addEventListener("load", () => {
    updateDisplay();
    startTimer();
  });

  // Maus- oder Tastatureingaben verlängern Session
  ["click", "keypress", "mousemove"].forEach((evt) => {
    document.addEventListener(evt, resetTimer);
  });

  // Global verfügbar machen (optional für spätere Tools)
  window.sessionTimer = { reset: resetTimer, stop: () => clearInterval(timerInterval) };
})();