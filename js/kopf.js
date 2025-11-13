// /logbuch/js/kopf.js — Version 0.4 (User + Rolle + Datum + Uhrzeit)
(function buildKopf() {
  let initialized = false;
  let tries = 0;

  async function renderKopf() {
    if (initialized) return true;
    const kopf = document.getElementById("kopf");
    if (!kopf) return false;

    // ----------------------------
    // Benutzer + Rolle aus Session
    // ----------------------------
    let username = sessionStorage.getItem("username") || "Gast";
    let role = sessionStorage.getItem("userRole") || "Member";

    try {
      const data = await supabaseAPI.getSession();
      const user = data?.user;
      if (user) {
        username = user.user_metadata?.username || username;
        role = user.user_metadata?.role || role;
      }
    } catch (err) {
      console.warn("Kopf: Supabase-Session konnte nicht geprüft werden:", err);
    }

    // ----------------------------
    // Datum + Uhrzeit (live)
    // ----------------------------
    const datum = new Date().toLocaleString("de-DE", {
      dateStyle: "short",
      timeStyle: "short",
    });

    // ----------------------------
    // Seitentitel dynamisch
    // ----------------------------
    const path = window.location.pathname;
    let appTitle = "Logbuch";
    if (path.includes("dashboard.html")) appTitle = "Dashboard";
    else if (path.includes("member.html")) appTitle = "Member";
    else if (path.includes("gate.html")) appTitle = "Zugangskontrolle";
    else if (path.includes("index.html")) appTitle = "Login & Registrierung";

    // ----------------------------
    // HTML-Ausgabe
    // ----------------------------
    kopf.innerHTML = `
      <div class="kopf-row row1">
        <div class="right">${username} (${role}) [${datum}]</div>
      </div>
      <div class="kopf-row row2">
        <div class="left">${appTitle}</div>
      </div>
    `;

    initialized = true;
    return true;
  }

  // ----------------------------
  // Wiederholungsmechanismus (falls DOM/Supabase verzögert)
  // ----------------------------
  async function tryRender() {
    const success = await renderKopf();
    if (!success && tries++ < 10) setTimeout(tryRender, 300);
  }

  // Start nach vollständigem Laden
  window.addEventListener("load", tryRender);
})();