// ============================================================
// access-guard.js – v3.0 (Policy-kompatibel)
// Stand: 03.11.2025
// Autor: Kapitän ⚓
//
// Zweck:
// - Prüft NUR, ob eine gültige Supabase-Session existiert
// - Leitet sonst automatisch auf login.html weiter
// - Optional: aktualisiert die Anzeige von Benutzername + Rolle
// ============================================================

import { supabase } from "./logbuch.js";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // 🔹 1. Aktive Session prüfen
    const { data: sessionData, error: sessionError } = await supabase.auth.getUser();

    if (sessionError || !sessionData?.user) {
      console.warn("⚠️ Keine aktive Session, leite zur Anmeldung um...");
      window.location.href = "login.html";
      return;
    }

    const authUser = sessionData.user;

    // 🔹 2. Benutzerinformationen laden (optional)
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("username, role")
      .eq("id", authUser.id)
      .maybeSingle();

    if (userError) {
      console.warn("⚠️ Fehler beim Laden der Benutzerdaten:", userError);
    }

    // 🔹 3. Benutzeranzeige im Header aktualisieren (wenn vorhanden)
    const userNameElem = document.querySelector("#userName");
    const userRoleElem = document.querySelector("#userRole");

    if (userNameElem) userNameElem.textContent = userData?.username || "Unbekannt";
    if (userRoleElem) userRoleElem.textContent = userData?.role || "–";

    // 🔹 4. (Optional) Session-Timer anzeigen
    startSessionCountdown();

  } catch (err) {
    console.error("❌ Fehler in access-guard.js:", err);
    window.location.href = "login.html";
  }
});

// ============================================================
// Session Countdown Timer (Frontend-Anzeige)
// ============================================================
function startSessionCountdown() {
  const sessionTimerElem = document.getElementById("sessionTimer");
  if (!sessionTimerElem) return;

  // 60 Minuten Timer – wird lokal gezählt, nicht sicherheitsrelevant
  let remaining = 60 * 60; // Sekunden

  const updateTimer = () => {
    const min = Math.floor(remaining / 60);
    const sec = remaining % 60;
    sessionTimerElem.textContent = `${min}:${sec.toString().padStart(2, "0")}`;
    if (remaining <= 0) {
      clearInterval(interval);
      alert("⏳ Sitzung abgelaufen – bitte erneut anmelden.");
      window.location.href = "login.html";
    }
    remaining--;
  };

  updateTimer();
  const interval = setInterval(updateTimer, 1000);
}