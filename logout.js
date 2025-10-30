// =============================================================
// Logout – v1.0 (Build 29.10.2025)
// Entfernt currentUser (Sitzung) aus Local Storage
// =============================================================

document.addEventListener("DOMContentLoaded", () => {
  // Aktuellen Benutzer entfernen
  localStorage.removeItem("currentUser");

  // Kurze Verzögerung, um die Abmelde-Meldung anzuzeigen
  setTimeout(() => {
    alert("Du wurdest erfolgreich abgemeldet.");
    window.location.href = "login.html";
  }, 1000);
});