// /logbuch/js/gate.js — Version 0.3 (Supabase Onlinebetrieb)
(async function () {
  const title = document.getElementById("gate-title");
  const msg = document.getElementById("gate-msg");
  const sub = document.getElementById("gate-sub");

  function autoRedirect(target, delay = 1000) {
    sub.textContent = `Weiterleitung in ${delay / 1000}s ...`;
    setTimeout(() => (window.location.href = target), delay);
  }

  const username = sessionStorage.getItem("username");
  const lastExit = sessionStorage.getItem("lastExit");

  // Supabase-Session prüfen
  let session = null;
  try {
    const data = await supabaseAPI.getSession();
    session = data;
  } catch (err) {
    console.error("Supabase-Sessionprüfung fehlgeschlagen:", err);
  }

  // =========================
  // EINGANG — gültige Sitzung
  // =========================
  if (session && !lastExit) {
    const user = session.user;
    const name = user?.user_metadata?.username || username || "Benutzer";
    title.textContent = "Willkommen zurück";
    msg.textContent = `Guten Tag, ${name}!`;
    autoRedirect("dashboard/dashboard.html");
    return;
  }

  // =========================
  // AUSGANG — Logout-Vorgang
  // =========================
  if (lastExit === "pending") {
    try {
      await supabaseAPI.logoutUser();
    } catch (err) {
      console.warn("Abmeldung mit Supabase fehlgeschlagen:", err);
    }
    sessionStorage.clear();
    title.textContent = "Abmeldung";
    msg.textContent = "Bis bald! Sie wurden erfolgreich abgemeldet.";
    autoRedirect("index.html");
    return;
  }

  // =========================
  // KEIN gültiger Zustand
  // =========================
  title.textContent = "Zugriff verweigert";
  msg.textContent = "Keine aktive Sitzung gefunden.";
  autoRedirect("index.html");
});
