// /logbuch/js/gate.js — Version 0.4 (Supabase-Onlinebetrieb, stabiler Redirect)
(async function () {
  const title = document.getElementById("gate-title");
  const msg = document.getElementById("gate-msg");
  const sub = document.getElementById("gate-sub");

  // ---------------------------
  // Automatische Weiterleitung
  // ---------------------------
  function autoRedirect(target, delay = 1000) {
    sub.textContent = `Weiterleitung in ${delay / 1000}s ...`;
    setTimeout(() => (window.location.href = target), delay);
  }

  const username = sessionStorage.getItem("username") || null;
  const lastExit = sessionStorage.getItem("lastExit") || null;

  // ---------------------------
  // Supabase-Session prüfen
  // ---------------------------
  let activeSession = null;
  try {
    activeSession = await supabaseAPI.getSession();
  } catch (err) {
    console.warn("[Gate] Supabase Sessionprüfung fehlgeschlagen:", err);
  }

  // ---------------------------
  // Eingang – gültige Sitzung
  // ---------------------------
  if (activeSession && !lastExit) {
    const user = activeSession.user;
    const name = user?.user_metadata?.username || username || "Benutzer";

    title.textContent = "Willkommen zurück";
    msg.textContent = `Guten Tag, ${name}!`;

    autoRedirect("dashboard/dashboard.html");
    return;
  }

  // ---------------------------
  // Ausgang – Logout-Vorgang
  // ---------------------------
  if (lastExit === "pending") {
    try {
      await supabaseAPI.logoutUser();
    } catch (err) {
      console.warn("[Gate] Logout bei Supabase fehlgeschlagen:", err);
    }

    sessionStorage.clear();

    title.textContent = "Abmeldung";
    msg.textContent = "Bis bald! Sie wurden erfolgreich abgemeldet.";

    autoRedirect("index.html");
    return;
  }

  // ---------------------------
  // Kein gültiger Zustand
  // ---------------------------
  title.textContent = "Zugriff verweigert";
  msg.textContent = "Keine aktive Sitzung gefunden.";

  autoRedirect("index.html");
})();