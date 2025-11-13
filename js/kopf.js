// /logbuch/js/kopf.js — Version 0.8 (ohne Datum/Uhrzeit, mit Rollen-Icon)
(function buildKopf() {
  let initialized = false;
  let tries = 0;

  // ----------------------------------------------------------
  // Kopf rendern
  // ----------------------------------------------------------
  async function renderKopf() {
    const kopf = document.getElementById("kopf");
    if (!kopf) return false;

    let username = sessionStorage.getItem("username") || "Gast";
    let role = sessionStorage.getItem("userRole") || "member";

    // Supabase-Session prüfen (optional)
    try {
      const data = await supabaseAPI.getSession();
      const user = data?.user;
      if (user) {
        username = user.user_metadata?.username || username;
        role = user.user_metadata?.role || role;
      }
    } catch (err) {
      console.warn("[Kopf] Supabase-Session konnte nicht geprüft werden:", err);
    }

    // Rollen-Icon
    const roleIcon = role === "admin" ? "🎖️" : "🪖";

    // Titel anhand der Seite
    const path = window.location.pathname;
    let appTitle = "Logbuch";
    if (path.includes("dashboard.html")) appTitle = "Dashboard";
    else if (path.includes("member.html")) appTitle = "Member";
    else if (path.includes("gate.html")) appTitle = "Zugangskontrolle";
    else if (path.includes("index.html")) appTitle = "Login & Registrierung";

    // Kopfbereich setzen
    kopf.innerHTML = `
      <div class="kopf-row row1">
        <div class="right">${roleIcon} ${username} (${role})</div>
      </div>
      <div class="kopf-row row2">
        <div class="left">${appTitle}</div>
      </div>
    `;

    initialized = true;
    return true;
  }

  // ----------------------------------------------------------
  // Reaktion auf Rollen-/Benutzeränderungen
  // ----------------------------------------------------------
  window.addEventListener("storage", (e) => {
    if (["username", "userRole"].includes(e.key)) {
      console.log("[Kopf] Session-Änderung erkannt → neu rendern");
      renderKopf();
    }
  });

  // ----------------------------------------------------------
  // Initialisierung mit Fallback
  // ----------------------------------------------------------
  async function tryRender() {
    const success = await renderKopf();
    if (!success && tries++ < 10) setTimeout(tryRender, 300);
  }

  window.addEventListener("load", tryRender);
})();