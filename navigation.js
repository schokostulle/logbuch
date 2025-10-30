// ===========================================================
// navigation.js – Logbuch-Projekt
// Version: 2.0 – 02.11.2025
// Autor: Kapitän ⚓
// Beschreibung:
// Einheitliches Navigationssystem mit Supabase Auth,
// Benutzeranzeige, Adminprüfung & Seitenhervorhebung
// ===========================================================

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // 🧭 1. Aktive Supabase-Session prüfen
    const { data: sessionData, error: sessionError } = await window.supabase.auth.getUser();
    if (sessionError) throw sessionError;

    const authUser = sessionData?.user;
    if (!authUser) {
      console.warn("❌ Kein Benutzer eingeloggt – Weiterleitung zur Zugangskontrolle.");
      window.location.href = "gate.html";
      return;
    }

    // 🧭 2. Benutzerdetails aus users-Tabelle laden
    const { data: userData, error: userError } = await window.supabase
      .from("users")
      .select("id, username, role, status")
      .eq("id", authUser.id)
      .single();

    if (userError || !userData) {
      console.error("❌ Benutzer nicht in users-Tabelle gefunden:", userError);
      await window.supabase.auth.signOut();
      window.location.href = "gate.html";
      return;
    }

    // 🛑 Status prüfen
    if (userData.status?.toLowerCase() !== "aktiv") {
      console.warn(`Benutzer "${userData.username}" ist inaktiv.`);
      alert("Zugang verweigert – dein Account ist nicht aktiv.");
      await window.supabase.auth.signOut();
      window.location.href = "login.html";
      return;
    }

    // ✅ Benutzer verfügbar, Navigation aufbauen
    buildNavigation(userData);
    updateUserStatus(userData);

  } catch (err) {
    console.error("❌ Fehler in navigation.js:", err);
    window.location.href = "gate.html";
  }
});

// ===========================================================
// Menüstruktur (statisch definiert)
// ===========================================================

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

// ===========================================================
// Navigation dynamisch erzeugen
// ===========================================================
function buildNavigation(userData) {
  const sidebar = document.querySelector("aside nav ul");
  if (!sidebar) return;

  const role = userData.role?.toLowerCase() || "member";
  const currentPage = window.location.pathname.split("/").pop();

  sidebar.innerHTML = "";

  navItems.forEach(item => {
    // Admin-Check
    if (item.adminOnly && role !== "admin") return;

    const li = document.createElement("li");
    if (item.logout) li.classList.add("logout");

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

// ===========================================================
// Benutzeranzeige in Kopfzeile aktualisieren
// ===========================================================
function updateUserStatus(userData) {
  const userStatus = document.querySelector(".user-status");
  if (!userStatus) return;

  const roleText = userData.role
    ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1)
    : "Unbekannt";

  const symbol = userData.role === "admin" ? "⚓" : "👤";

  userStatus.textContent = `${symbol} ${userData.username} – ${roleText}`;
}