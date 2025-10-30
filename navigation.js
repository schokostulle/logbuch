// ===========================================================
// navigation.js – Logbuch-Projekt
// Version: 1.1 – 31.10.2025
// Autor: Kapitän
// Beschreibung:
// Einheitliches Navigationssystem mit Benutzeranzeige,
// Adminprüfung und automatischer Seitenhervorhebung.
// ===========================================================

// Aktuellen Benutzer laden
const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");

// Zugriffsschutz
if (!currentUser) {
  window.location.href = "gate.html";
}

// Menüstruktur
const navItems = [
  { href: "dashboard.html", icon: "📯", text: "Dashboard" },
  { href: "reservierungen.html", icon: "📌", text: "Reservierungen" },
  { href: "karte.html", icon: "🗺️", text: "Karte" },
  { href: "angriffe.html", icon: "⚔️", text: "Angriffe" },
  { href: "berichte.html", icon: "📜", text: "Berichte" },
  { href: "flotte.html", icon: "⛵️", text: "Flotte" },
  // Admin-spezifisch
  { href: "mitglieder.html", icon: "⚓", text: "Mitglieder", adminOnly: true },
  { href: "diplomatie.html", icon: "🕊️", text: "Diplomatie", adminOnly: true },
  { href: "import.html", icon: "📂", text: "CSV", adminOnly: true },
  // Logout immer am Ende
  { href: "logout.html", icon: "⛩️", text: "Logout", logout: true }
];

// Menü dynamisch erzeugen
function buildNavigation() {
  const sidebar = document.querySelector("aside nav ul");
  if (!sidebar) return;

  const role = currentUser?.role?.toLowerCase() || "member";
  const currentPage = window.location.pathname.split("/").pop(); // Aktuelle Seite ermitteln

  sidebar.innerHTML = "";

  navItems.forEach(item => {
    // Admin-Check
    if (item.adminOnly && role !== "admin") return;

    const li = document.createElement("li");
    if (item.logout) li.classList.add("logout");

    // Aktiven Link hervorheben
    const isActive = currentPage === item.href;
    li.innerHTML = `
      <a href="${item.href}" class="${isActive ? "active" : ""}">
        <span class="icon">${item.icon}</span>
        <span class="text">${item.text}</span>
      </a>
    `;
    sidebar.appendChild(li);
  });
}

// Benutzeranzeige in Kopfzeile
function updateUserStatus() {
  const userStatus = document.querySelector(".user-status");
  if (!userStatus) return;

  const roleText = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
  userStatus.textContent = `${currentUser.username} – ${roleText}`;
}

// Initialisierung
document.addEventListener("DOMContentLoaded", () => {
  buildNavigation();
  updateUserStatus();
});