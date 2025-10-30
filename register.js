// =============================================================
// Registrierung – v1.0 (Build 29.10.2025)
// Erstregistrierung = Admin/aktiv, weitere = Member/geblockt
// =============================================================

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const nameInput = document.getElementById("regName");
  const passInput = document.getElementById("regPass");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const pass = passInput.value.trim();
    if (!name || !pass) return alert("Bitte Name und Passwort eingeben.");

    let users = JSON.parse(localStorage.getItem("logbuch_users")) || [];

    // Prüfen, ob Benutzer bereits existiert
    if (users.some(u => u.name.toLowerCase() === name.toLowerCase())) {
      return alert("Ein Benutzer mit diesem Namen existiert bereits.");
    }

    // Erster Benutzer → Admin / aktiv, sonst Member / geblockt
    const newUser = {
      name,
      password: pass,
      role: users.length === 0 ? "Admin" : "Member",
      status: users.length === 0 ? "aktiv" : "geblockt",
      deleted: false
    };

    users.push(newUser);
    localStorage.setItem("logbuch_users", JSON.stringify(users));

    alert("Registrierung erfolgreich! Du kannst dich nun anmelden.");
    window.location.href = "login.html";
  });
});