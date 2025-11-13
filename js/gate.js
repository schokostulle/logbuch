// /logbuch/js/gate.js — Version 2.0
// Frontend-Einlasskontrolle basierend auf sessionStorage + Supabase-Profilstatus

(async function () {
  const title = document.getElementById("gate-title");
  const msg = document.getElementById("gate-msg");
  const sub = document.getElementById("gate-sub");

  function redirect(target, delay = 1200) {
    sub.textContent = `Weiterleitung in ${delay / 1000}s ...`;
    setTimeout(() => (window.location.href = target), delay);
  }

  // ----------------------------------------------------
  // 1. Logout-Vorgang (Frontend)
  // ----------------------------------------------------
  const lastExit = sessionStorage.getItem("lastExit");
  if (lastExit === "pending") {
    try {
      await supabaseAPI.logoutUser(); // Supabase Sitzung beenden
    } catch (_) {}

    sessionStorage.clear();

    title.textContent = "Abmeldung";
    msg.textContent = "Sie wurden erfolgreich abgemeldet.";
    return redirect("index.html");
  }

  // ----------------------------------------------------
  // 2. Prüfung: Ist eine lokale Session vorhanden?
  // ----------------------------------------------------
  const username = sessionStorage.getItem("username");
  if (!username) {
    title.textContent = "Zugriff verweigert";
    msg.textContent = "Keine gültige Sitzung gefunden.";
    return redirect("index.html");
  }

  // ----------------------------------------------------
  // 3. Profil aus Supabase laden (Status + Rolle)
  // ----------------------------------------------------
  let profile = null;
  try {
    const result = await supabaseAPI.fetchData("profiles", { username });
    profile = result?.[0] || null;
  } catch (err) {
    console.warn("[Gate] Profil konnte nicht geladen werden:", err);

    // Fallback – nur lokale Session
    title.textContent = "Willkommen";
    msg.textContent = `Hallo ${username}!`;
    return redirect("dashboard/dashboard.html");
  }

  if (!profile) {
    // Kein Profil? → zurück zum Login
    sessionStorage.clear();
    title.textContent = "Unbekannter Benutzer";
    msg.textContent = "Bitte erneut anmelden.";
    return redirect("index.html");
  }

  // ----------------------------------------------------
  // 4. Blockiert? → raus!
  // ----------------------------------------------------
  if (profile.status !== "aktiv") {
    sessionStorage.clear();
    title.textContent = "Zugang gesperrt";
    msg.textContent = "Bitte wende dich an einen Administrator.";
    return redirect("index.html");
  }

  // ----------------------------------------------------
  // 5. Alles ok → Weiter zum Dashboard
  // ----------------------------------------------------
  title.textContent = "Willkommen zurück";
  msg.textContent = `Guten Tag, ${profile.username}!`;

  // Rolle sicherstellen
  sessionStorage.setItem("userRole", profile.rolle);

  redirect("dashboard/dashboard.html");
})();