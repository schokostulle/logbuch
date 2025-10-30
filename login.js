// =============================================================
// Login – v1.0 (Build 29.10.2025)
// Prüft Benutzer, Passwort, Status und Weiterleitung
// =============================================================

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const nameInput = document.getElementById("loginName");
  const passInput = document.getElementById("loginPass");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const pass = passInput.value.trim();
    if (!name || !pass) return alert("Bitte Name und Passwort eingeben.");

    const users = JSON.parse(localStorage.getItem("logbuch_users")) || [];
    const user = users.find(u => u.name.toLowerCase() === name.toLowerCase());

    if (!user) {
      alert("Benutzer nicht gefunden.");
      return;
    }

    if (user.password !== pass) {
      alert("Falsches Passwort.");
      return;
    }

    if (user.deleted) {
      alert("Zugang verweigert – Benutzer wurde entfernt.");
      return;
    }

    if (user.status !== "aktiv") {
      alert("Zugang verweigert – Benutzer ist geblockt. Bitte Admin kontaktieren.");
      return;
    }

    // Login erfolgreich
    localStorage.setItem("currentUser", JSON.stringify({
      name: user.name,
      role: user.role,
      status: user.status
    }));

    alert(`Willkommen zurück, ${user.name}!`);
    window.location.href = "dashboard.html";
  });
});