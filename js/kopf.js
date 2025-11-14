// /logbuch/js/kopf.js — Version 0.9 (stabil, ohne Datum/Uhrzeit, Rollen-Icon fix)
(function () {
  let tries = 0;

  async function renderKopf() {
    const kopf = document.getElementById("kopf");
    if (!kopf) return false;

    let username = sessionStorage.getItem("username") || "Gast";
    let role = sessionStorage.getItem("userRole") || "member";

    // Supabase-Session optional prüfen
    try {
      const session = await supabaseAPI.getSession();
      const user = session?.user;
      if (user) {
        username = user.user_metadata?.username || username;
        role = user.user_metadata?.role || role;
      }
    } catch (_) {}

    const roleIcon = role === "admin" ? "🎖️" : "🪖";

    // Titel anhand Dateiname
    const file = location.pathname.split("/").pop();
    let appTitle =
      file === "dashboard.html" ? "Dashboard" :
      file === "member.html"    ? "Memberverwaltung" :
      file === "csv.html"       ? "CSV-Import" :
      file === "gate.html"      ? "Zugangskontrolle" :
      file === "index.html"     ? "Login & Registrierung" :
      "Logbuch";

    kopf.innerHTML = `
      <div class="kopf-row row1">
        <div class="right">${roleIcon} ${username} (${role})</div>
      </div>
      <div class="kopf-row row2">
        <div class="left">${appTitle}</div>
      </div>
    `;

    return true;
  }

  window.addEventListener("storage", (e) => {
    if (e.key === "username" || e.key === "userRole") renderKopf();
  });

  async function init() {
    const ok = await renderKopf();
    if (!ok && tries++ < 10) setTimeout(init, 300);
  }

  window.addEventListener("load", init);
})();