// /logbuch/js/kopf.js — Version 0.3a (Supabase Onlinebetrieb, stabilisiert)
(function buildKopf() {
  let initialized = false;
  let tries = 0;

  async function renderKopf() {
    if (initialized) return true;
    const kopf = document.getElementById("kopf");
    if (!kopf) return false;

    // =====================================
    // Session prüfen (Supabase + Frontend)
    // =====================================
    let username = sessionStorage.getItem("username") || "Gast";
    let role = sessionStorage.getItem("userRole") || "";

    try {
      const session = await supabaseAPI.getSession();
      const user = session?.user;
      if (user) {
        username = user.user_metadata?.username || username;
      }
    } catch (err) {
      console.warn("Kopf: Supabase-Session konnte nicht geprüft werden:", err);
    }

    // =====================================
    // Datum + Uhrzeit formatieren
    // =====================================
    const datum = new Date().toLocaleString("de-DE", {
      dateStyle: "short",
      timeStyle: "short",
    });

    // =====================================
    // Dynamischer Titel anhand des Pfads
    // =====================================
    const path = window.location.pathname;
    let appTitle = "Logbuch";
    if (path.includes("dashboard.html")) appTitle = "Dashboard";
    else if (path.includes("member.html")) appTitle = "Member";
    else if (path.includes("gate.html")) appTitle = "Zugangskontrolle";
    else if (path.includes("index.html")) appTitle = "Login & Registrierung";

    // =====================================
    // HTML-Inhalt aufbauen
    // =====================================
    kopf.innerHTML = `
      <div class="kopf-row row1">
        <div class="right">${username}${role ? " (" + role + ")" : ""} [${datum}]</div>
      </div>
      <div class="kopf-row row2">
        <div class="left">${appTitle}</div>
      </div>
    `;

    initialized = true;
    return true;
  }

  // Wiederholungsmechanismus (bei Ladeverzögerungen)
  async function tryRender() {
    const success = await renderKopf();
    if (!success && tries++ < 10) setTimeout(tryRender, 300);
  }

  window.addEventListener("load", tryRender);
})();