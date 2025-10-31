// =============================================================
// session-timeout.js – Sitzungsüberwachung mit Countdown
// Version: 2.0 – 05.11.2025
// Autor: Kapitän ⚓
//
// Funktionen:
// - Countdown-Anzeige im Header neben Benutzername
// - Reset bei Maus-/Tastatur-/Scrollaktivität
// - Warnung 2 Minuten vor Ablauf
// - Automatischer Logout bei Inaktivität
// =============================================================

import { supabase } from "./logbuch.js";

const TIMEOUT_MINUTES = 30;     // Inaktivität bis Logout
const WARNING_MINUTES = 2;      // Vorwarnzeit
let remainingSeconds = TIMEOUT_MINUTES * 60;

let inactivityTimer;
let countdownTimer;
let warningActive = false;

// -------------------------------------------------------------
// DOM-Element für Countdown vorbereiten
// -------------------------------------------------------------
function setupCountdownDisplay() {
  let header = document.querySelector(".user-status");
  if (!header) return;

  const countdownEl = document.createElement("span");
  countdownEl.id = "session-countdown";
  countdownEl.style.marginLeft = "1rem";
  countdownEl.style.fontSize = "0.9rem";
  countdownEl.style.color = "#c7b37e";
  countdownEl.style.opacity = "0.9";
  countdownEl.textContent = formatTime(remainingSeconds);

  header.appendChild(countdownEl);
}

// -------------------------------------------------------------
// Countdown-Ticker
// -------------------------------------------------------------
function startCountdown() {
  clearInterval(countdownTimer);
  countdownTimer = setInterval(() => {
    remainingSeconds--;

    const countdownEl = document.getElementById("session-countdown");
    if (countdownEl) {
      countdownEl.textContent = formatTime(remainingSeconds);

      // Farbänderung bei Warnung
      if (remainingSeconds <= WARNING_MINUTES * 60 && !warningActive) {
        warningActive = true;
        countdownEl.style.color = "#ff6961";
        showWarning();
      }

      // Wenn Zeit abgelaufen → Logout
      if (remainingSeconds <= 0) {
        performLogout();
      }
    }
  }, 1000);
}

// -------------------------------------------------------------
// Aktivität -> Reset Timer & Countdown
// -------------------------------------------------------------
function resetSessionTimer() {
  clearTimeout(inactivityTimer);
  remainingSeconds = TIMEOUT_MINUTES * 60;
  warningActive = false;

  const countdownEl = document.getElementById("session-countdown");
  if (countdownEl) countdownEl.style.color = "#c7b37e";

  inactivityTimer = setTimeout(() => {
    performLogout();
  }, TIMEOUT_MINUTES * 60 * 1000);
}

// -------------------------------------------------------------
// Warnung unten rechts anzeigen
// -------------------------------------------------------------
function showWarning() {
  const existing = document.querySelector("#session-warning");
  if (existing) return;

  const div = document.createElement("div");
  div.id = "session-warning";
  div.textContent = `⚠️ Inaktivität – Sitzung läuft in ${WARNING_MINUTES} Minuten ab!`;
  Object.assign(div.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    backgroundColor: "#3b2b2b",
    color: "#f0d9a0",
    border: "1px solid #665",
    borderRadius: "6px",
    padding: "0.6rem 1rem",
    fontFamily: "Courier New, monospace",
    fontSize: "0.9rem",
    boxShadow: "0 0 10px rgba(0,0,0,0.4)",
    zIndex: "9999",
    transition: "opacity 0.5s ease"
  });
  document.body.appendChild(div);

  setTimeout(() => {
    div.style.opacity = "0";
    setTimeout(() => div.remove(), 500);
  }, 60 * 1000);
}

// -------------------------------------------------------------
// Logout
// -------------------------------------------------------------
async function performLogout() {
  clearInterval(countdownTimer);
  clearTimeout(inactivityTimer);

  const warning = document.querySelector("#session-warning");
  if (warning) warning.remove();

  alert("⚓ Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.");
  await supabase.auth.signOut();
  window.location.href = "login.html";
}

// -------------------------------------------------------------
// Hilfsfunktionen
// -------------------------------------------------------------
function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// -------------------------------------------------------------
// Aktivitätsüberwachung
// -------------------------------------------------------------
["mousemove", "keydown", "click", "scroll", "touchstart"].forEach(event => {
  document.addEventListener(event, resetSessionTimer, { passive: true });
});

// -------------------------------------------------------------
// Start, wenn DOM geladen
// -------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  setupCountdownDisplay();
  resetSessionTimer();
  startCountdown();
  console.log(`⚓ Session Timeout aktiv (${TIMEOUT_MINUTES}min, Warnung bei ${WARNING_MINUTES}min)`);
});