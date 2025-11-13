// /logbuch/js/kopf.js — Version 0.8 (stabil, sekundengenaue Uhr, korrekte Rollenanzeige)
(function buildKopf() {
  let initialized = false;
  let tries = 0;
  let serverOffset = 0;

  const TIME_API = "https://worldtimeapi.org/api/timezone/Europe/Berlin";

  // ----------------------------------------------------------
  // 1️⃣ Serverzeit holen → Offset berechnen
  // ----------------------------------------------------------
  async function initServerTime() {
    try {
      const res = await fetch(TIME_API, { cache: "no-store" });
      const data = await res.json();
      const serverTime = new Date(data.datetime);
      serverOffset = serverTime - Date.now();
      console.log("[Kopf] Zeit synchronisiert (Offset:", serverOffset, "ms)");
    } catch {
      console.warn("[Kopf] Zeitserver nicht erreichbar → lokale Uhrzeit");
      serverOffset = 0;
    }
  }

  function getCurrentTime() {
    return new Date(Date.now() + serverOffset);
  }

  // ----------------------------------------------------------
  // 2️⃣ Kopf rendern
  // ----------------------------------------------------------
  async function renderKopf() {
    const kopf = document.getElementById("kopf");
    if (!kopf) return false;

    // Username + Rolle aus SessionStorage holen
    let username = sessionStorage.getItem("username") || "Gast";
    let role = sessionStorage.getItem("userRole") || "member";

    // Supabase Session prüfen (ohne Rolle zu überschreiben!)
    try {
      const data = await supabaseAPI.getSession();
      const user = data?.user;
      if (user) {
        username = user.user_metadata?.username || username;
      }
    } catch (err) {
      console.warn("[Kopf] Supabase Session konnte nicht geprüft werden:", err);
    }

    // Seitentitel
    const path = window.location.pathname;
    let appTitle = "Logbuch";
    if (path.includes("dashboard.html")) appTitle = "Dashboard";
    else if (path.includes("member.html")) appTitle = "Member";
    else if (path.includes("gate.html")) appTitle = "Zugangskontrolle";
    else if (path.includes("index.html")) appTitle = "Login & Registrierung";

    // Kopf erzeugen
    kopf.innerHTML = `
      <div class="kopf-row row1">
        <div class="right">
          <span id="kopf-user">${username} (${role})</span>
          <span id="kopf-time">[--:--:--]</span>
        </div>
      </div>
      <div class="kopf-row row2">
        <div class="left">${appTitle}</div>
      </div>
    `;

    initialized = true;
    startClock();
    return true;
  }

  // ----------------------------------------------------------
  // 3️⃣ Sekundengenaue Uhr
  // ----------------------------------------------------------
  function startClock() {
    const el = document.getElementById("kopf-time");
    if (!el) return;

    // Falls bereits ein Timer läuft → stoppen
    if (window._kopfClock) clearInterval(window._kopfClock);

    function tick() {
      const now = getCurrentTime();
      const datum = now.toLocaleString("de-DE", {
        dateStyle: "short",
        timeStyle: "medium"
      });
      el.textContent = `[${datum}]`;
    }

    tick();
    window._kopfClock = setInterval(tick, 1000);
  }

  // ----------------------------------------------------------
  // 4️⃣ Neu rendern bei Session/Role-Wechsel
  // ----------------------------------------------------------
  window.addEventListener("storage", (e) => {
    if (["username", "userRole"].includes(e.key)) {
      console.log("[Kopf] Session-Update → Kopf neu rendern");
      renderKopf();
    }
  });

  // ----------------------------------------------------------
  // 5️⃣ Initialisierung mit Retry
  // ----------------------------------------------------------
  async function tryRender() {
    if (tries++ === 0) await initServerTime();
    const ok = await renderKopf();
    if (!ok && tries < 10) setTimeout(tryRender, 300);
  }

  window.addEventListener("load", tryRender);
})();