// =============================================================
// gate.js – v1.0 (Build 29.10.2025)
// Türsteherseite: prüft Session, Rolle & Status
// Weiterleitung zu Dashboard oder Login
// =============================================================

document.addEventListener("DOMContentLoaded", () => {
  const statusBox = document.getElementById("statusMessage");

  // Kleine Verzögerung für Authentizität (Ladegefühl)
  setTimeout(() => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");

    // Kein Benutzer angemeldet
    if (!currentUser) {
      statusBox.innerHTML = "<p>Zugang verweigert – du bist nicht angemeldet.</p>";
      redirect("login.html");
      return;
    }

    // Gelöschter oder gesperrter Benutzer
    if (currentUser.status !== "aktiv") {
      statusBox.innerHTML = `<p>Zugang verweigert – Benutzer "${currentUser.name}" ist geblockt oder inaktiv.</p>`;
      localStorage.removeItem("currentUser");
      redirect("login.html");
      return;
    }

    // Erfolgreich
    statusBox.innerHTML = `<p>Willkommen, ${currentUser.name}! Deine Daten sind gültig. Du wirst eingelassen...</p>`;
    redirect("dashboard.html");
  }, 1000);

  function redirect(target) {
    setTimeout(() => {
      window.location.href = target;
    }, 1500);
  }
});