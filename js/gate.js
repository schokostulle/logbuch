// /logbuch/js/gate.js — Version 2.2 (bereinigt, konsistent, schleifenfrei)
(async function () {
  const title = document.getElementById("gate-title");
  const msg = document.getElementById("gate-msg");
  const sub = document.getElementById("gate-sub");

  function redirect(target, delay = 1200) {
    sub.textContent = `Weiterleitung in ${delay / 1000}s ...`;
    setTimeout(() => (window.location.href = target), delay);
  }

  // --------------------------------------------
  // 1. Logout-Vorgang
  // --------------------------------------------
  const lastExit = sessionStorage.getItem("lastExit");
  if (lastExit === "pending") {
    try { await supabaseAPI.logoutUser(); } catch (_) {}
    sessionStorage.clear();

    title.textContent = "Abmeldung";
    msg.textContent = "Sie wurden erfolgreich abgemeldet.";
    return redirect("index.html");
  }

  // --------------------------------------------
  // 2. Lokale Session vorhanden?
  // --------------------------------------------
  const username = sessionStorage.getItem("username");
  if (!username) {
    title.textContent = "Zugriff verweigert";
    msg.textContent = "Keine gültige Sitzung gefunden.";
    return redirect("index.html");
  }

  // --------------------------------------------
  // 3. Profil aus DB prüfen
  // --------------------------------------------
  let profile = null;
  try {
    const res = await supabaseAPI.fetchData("profiles", { username });
    profile = res?.[0] || null;
  } catch (err) {
    sessionStorage.clear();
    title.textContent = "Zugriff verweigert";
    msg.textContent = "Profil konnte nicht geladen werden.";
    return redirect("index.html");
  }

  // --------------------------------------------
  // 4. Profil nicht vorhanden
  // --------------------------------------------
  if (!profile) {
    sessionStorage.clear();
    title.textContent = "Unbekannter Benutzer";
    msg.textContent = "Bitte erneut anmelden.";
    return redirect("index.html");
  }

  // --------------------------------------------
  // 5. Status prüfen
  // --------------------------------------------
  if (profile.status !== "aktiv") {
    sessionStorage.clear();
    title.textContent = "Zugang gesperrt";
    msg.textContent = "Bitte wende dich an einen Administrator.";
    return redirect("index.html");
  }

  // --------------------------------------------
  // 6. Weiterleitung zum Dashboard
  // --------------------------------------------
  sessionStorage.setItem("userRole", profile.rolle);

  title.textContent = "Willkommen zurück";
  msg.textContent = `Guten Tag, ${profile.username}!`;

  return redirect("dashboard/dashboard.html");
})();