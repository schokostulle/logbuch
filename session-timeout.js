// =============================================================
// session-timeout.js – Globale Sitzungsüberwachung
// Version: 1.0 – 04.11.2025
// Autor: Kapitän ⚓
//
// Funktionen:
// - automatische Abmeldung bei Inaktivität
// - Vorwarnung 2 Minuten vor Ablauf
// - vollständiger Logout über Supabase
// - Reset bei Maus, Tastatur oder Scrollaktivität
// =============================================================

import { supabase } from "./logbuch.js";

const TIMEOUT_MINUTES = 30;     // Gesamtzeit bis Auto-Logout (Inaktivität)
const WARNING_MINUTES = 2;      // Vorwarnzeit in Minuten

let inactivityTimer;
let warningTimer;
let warned = false;

// -------------------------------------------------------------
// Sitzung zurücksetzen bei Benutzeraktivität
// -------------------------------------------------------------
function resetSessionTimer() {
  clearTimeout(inactivityTimer);
  clearTimeout(warningTimer);

  warned = false;

  // Vorwarnung anzeigen 2 Minuten vor Timeout
  warningTimer = setTimeout(() => {
    warned = true;
    showWarning();
  }, (TIMEOUT_MINUTES - WARNING_MINUTES) * 60 * 1000);

  // Nach Ablauf automatisch abmelden
  inactivityTimer = setTimeout(() => {
    performLogout();
  }, TIMEOUT_MINUTES * 60 * 1000);
}

// -------------------------------------------------------------
// Warnung anzeigen (sanft, nicht störend)
// -------------------------------------------------------------
function showWarning() {
  const existing = document.querySelector("#session-warning");
  if (existing) return; // Doppelte Warnungen vermeiden

  const warning = document.createElement("div");
  warning.id = "session-warning";
  warning.textContent = `⚠️ Deine Sitzung läuft in ${WARNING_MINUTES} Minuten ab.`;
  warning.style.position = "fixed";
  warning.style.bottom = "20px";
  warning.style.right = "20px";
  warning.style.backgroundColor = "#3b2b2b";
  warning.style.color = "#f0d9a0";
  warning.style.border = "1px solid #665";
  warning.style.borderRadius = "6px";
  warning.style.padding = "0.6rem 1rem";
  warning.style.fontFamily = "Courier New, monospace";
  warning.style.fontSize = "0.9rem";
  warning.style.boxShadow = "0 0 10px rgba(0,0,0,0.4)";
  warning.style.zIndex = "9999";
  warning.style.transition = "opacity 0.5s ease";
  document.body.appendChild(warning);

  // Nach 1 Minute entfernen, wenn Benutzer wieder aktiv wird
  setTimeout(() => {
    if (warning && !warned) warning.remove();
  }, WARNING_MINUTES * 60 * 1000);
}

// -------------------------------------------------------------
// Automatischer Logout
// -------------------------------------------------------------
async function performLogout() {
  const warning = document.querySelector("#session-warning");
  if (warning) warning.remove();

  alert("⚓ Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.");
  await supabase.auth.signOut();
  window.location.href = "login.html";
}

// -------------------------------------------------------------
// Listener für Benutzeraktivität
// -------------------------------------------------------------
["mousemove", "keydown", "click", "scroll", "touchstart"].forEach(event => {
  document.addEventListener(event, resetSessionTimer, { passive: true });
});

// -------------------------------------------------------------
// Starten, sobald DOM geladen ist
// -------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  resetSessionTimer();
  console.log("⚓ Session Timeout gestartet (", TIMEOUT_MINUTES, "min )");
});