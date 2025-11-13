// /logbuch/js/kopf.js — Version 0.6 (Live-Uhrzeit + automatische Rollensynchronisierung)
(function buildKopf() {
  let initialized = false;
  let tries = 0;
  let lastTime = "";
  let lastUser = "";
  let lastRole = "";

  const TIME_API = "https://worldtimeapi.org/api/timezone/Europe/Berlin";

  async function getTime() {
    try {
      const res = await fetch(TIME_API, { cache: "no-store" });
      const data = await res.json();
      return new Date(data.datetime);
    } catch {
      return new Date(); // Fallback auf lokale Zeit
    }
  }

  async function renderKopf() {
    const kopf = document.getElementById("kopf");
    if (!kopf) return false;

    let username = sessionStorage.getItem("username") || "Gast";
    let role = sessionStorage.getItem("userRole") || "member";

    // Wenn sich Werte nicht geändert haben → abbrechen
    if (initialized && username === lastUser && role === lastRole) return true;

    // Supabase Session ggf. prüfen
    try {
      const data = await supabaseAPI.getSession();
      const user = data?.user;
      if (user) {
        username = user.user_metadata?.username || username;
      }
    } catch (err) {
      console.warn("Kopf: Supabase-Session konnte nicht geprüft werden:", err);
    }

    // Titel abhängig von der Seite
    const path = window.location.pathname;
    let appTitle = "Logbuch";
    if (path.includes("dashboard.html")) appTitle = "Dashboard";
    else if (path.includes("member.html")) appTitle = "Member";
    else if (path.includes("gate.html")) appTitle = "Zugangskontrolle";
    else if (path.includes("index.html")) appTitle = "Login & Registrierung";

    // Kopf HTML rendern
    kopf.innerHTML = `
      <div class="kopf-row row1">
        <div class="right" id="kopf-zeit">
          ${username} (${role}) [--:--]
        </div>
      </div>
      <div class="kopf-row row2">
        <div class="left">${appTitle}</div>
      </div>
    `;

    initialized = true;
    lastUser = username;
    lastRole = role;

    // Zeitupdate starten
    async function updateTime() {
      const el = document.getElementById("kopf-zeit");
      if (!el) return;

      try {
        const now = await getTime();
        const datum = now.toLocaleString("de-DE", {
          dateStyle: "short",
          timeStyle: "short",
        });
        if (datum !== lastTime) {
          el.innerHTML = `${username} (${role}) [${datum}]`;
          lastTime = datum;
        }
      } catch {
        const datum = new Date().toLocaleString("de-DE", {
          dateStyle: "short",
          timeStyle: "short",
        });
        el.innerHTML = `${username} (${role}) [${datum}]`;
      }
    }

    updateTime();
    setInterval(updateTime, 60000);
    return true;
  }

  // 🔁 Beobachtung von Änderungen an SessionStorage (z. B. neue Rolle)
  window.addEventListener("storage", (e) => {
    if (e.key === "userRole" || e.key === "username") {
      console.log("Kopf aktualisiert nach Sessionänderung");
      renderKopf();
    }
  });

  // Wiederholungsmechanismus (bei langsamer Supabase-Verbindung)
  async function tryRender() {
    const success = await renderKopf();
    if (!success && tries++ < 10) setTimeout(tryRender, 300);
  }

  window.addEventListener("load", tryRender);
})();