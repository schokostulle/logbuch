// /logbuch/js/kopf.js — Version 0.7 (Sekundengenaue Uhr + Auto-Sync für Session & Rolle)
(function buildKopf() {
  let initialized = false;
  let tries = 0;
  let serverOffset = 0;
  let lastRenderedUser = "";
  let lastRenderedRole = "";

  const TIME_API = "https://worldtimeapi.org/api/timezone/Europe/Berlin";

  // ----------------------------------------------------------
  // 1️⃣ Hole einmalig Serverzeit und berechne Offset
  // ----------------------------------------------------------
  async function initServerTime() {
    try {
      const res = await fetch(TIME_API, { cache: "no-store" });
      const data = await res.json();
      const serverTime = new Date(data.datetime);
      serverOffset = serverTime - Date.now();
      console.log("[Kopf] Zeit synchronisiert (Offset:", serverOffset, "ms)");
    } catch {
      console.warn("[Kopf] Zeitserver nicht erreichbar, nutze lokale Uhrzeit");
      serverOffset = 0;
    }
  }

  // ----------------------------------------------------------
  // 2️⃣ Aktuelle Zeit (Server oder Lokal)
  // ----------------------------------------------------------
  function getCurrentTime() {
    return new Date(Date.now() + serverOffset);
  }

  // ----------------------------------------------------------
  // 3️⃣ Kopf rendern
  // ----------------------------------------------------------
  async function renderKopf() {
    const kopf = document.getElementById("kopf");
    if (!kopf) return false;

    let username = sessionStorage.getItem("username") || "Gast";
    let role = sessionStorage.getItem("userRole") || "member";

    // Prüfe Supabase-Session
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

    // Dynamischer Titel anhand Seite
    const path = window.location.pathname;
    let appTitle = "Logbuch";
    if (path.includes("dashboard.html")) appTitle = "Dashboard";
    else if (path.includes("member.html")) appTitle = "Member";
    else if (path.includes("gate.html")) appTitle = "Zugangskontrolle";
    else if (path.includes("index.html")) appTitle = "Login & Registrierung";

    // Kopf aufbauen
    kopf.innerHTML = `
      <div class="kopf-row row1">
        <div class="right" id="kopf-zeit">${username} (${role}) [--:--:--]</div>
      </div>
      <div class="kopf-row row2">
        <div class="left">${appTitle}</div>
      </div>
    `;

    lastRenderedUser = username;
    lastRenderedRole = role;
    initialized = true;

    // Starte sekundengenaue Aktualisierung
    startClock(username, role);
    return true;
  }

  // ----------------------------------------------------------
  // 4️⃣ Uhr starten (läuft sekundengenau weiter)
  // ----------------------------------------------------------
  function startClock(username, role) {
    const el = document.getElementById("kopf-zeit");
    if (!el) return;

    function tick() {
      const now = getCurrentTime();
      const datum = now.toLocaleString("de-DE", {
        dateStyle: "short",
        timeStyle: "medium", // → Sekundenanzeige
      });
      el.innerHTML = `${username} (${role}) [${datum}]`;
    }

    tick();
    setInterval(tick, 1000);
  }

  // ----------------------------------------------------------
  // 5️⃣ Automatische Neurenderung bei Session-Änderung
  // ----------------------------------------------------------
  window.addEventListener("storage", (e) => {
    if (["username", "userRole"].includes(e.key)) {
      console.log("[Kopf] Session-Änderung erkannt → neu rendern");
      renderKopf();
    }
  });

  // ----------------------------------------------------------
  // 6️⃣ Initialisierung mit Fallback
  // ----------------------------------------------------------
  async function tryRender() {
    if (tries++ === 0) await initServerTime();
    const success = await renderKopf();
    if (!success && tries < 10) setTimeout(tryRender, 300);
  }

  window.addEventListener("load", tryRender);
})();