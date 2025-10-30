// =============================================================
// access-guard.js – v1.0 (Build 29.10.2025)
// Globale Zugangskontrolle für alle Module
// =============================================================

document.addEventListener("DOMContentLoaded", () => {
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");

  // Niemand eingeloggt → zurück zum Wachhaus
  if (!currentUser) {
    console.warn("Kein Benutzer angemeldet – Weiterleitung zur Zugangskontrolle.");
    window.location.href = "gate.html";
    return;
  }

  // Benutzer existiert, aber gesperrt
  if (currentUser.status !== "aktiv") {
    console.warn(`Benutzer "${currentUser.name}" ist geblockt – Zugang verweigert.`);
    alert("Zugang verweigert – dein Account ist nicht aktiv.");
    localStorage.removeItem("currentUser");
    window.location.href = "gate.html";
    return;
  }

  // Gelöschter Benutzer? (Sicherheitscheck)
  const users = JSON.parse(localStorage.getItem("logbuch_users") || "[]");
  const matched = users.find(u => u.name === currentUser.name);
  if (!matched || matched.deleted) {
    console.warn(`Benutzer "${currentUser.name}" ist gelöscht – Zugang verweigert.`);
    alert("Zugang verweigert – Benutzer wurde entfernt.");
    localStorage.removeItem("currentUser");
    window.location.href = "gate.html";
    return;
  }

  // Falls alles in Ordnung ist:
  console.info(`Zugang gewährt für ${currentUser.name} (${currentUser.role}).`);
});