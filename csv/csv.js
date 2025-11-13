// /logbuch/csv/csv.js — Version 0.4 (Supabase Onlinebetrieb)
(async function () {
  const content = document.getElementById("content");

  // 1. Supabase-Session prüfen
  let session = null;
  try {
    session = await supabaseAPI.getSession();
  } catch (err) {
    console.error("[CSV] Supabase-Sessionprüfung fehlgeschlagen:", err);
  }

  // 2. Ungültige Session → Gate
  if (!session || !session.user) {
    window.location.href = "gate.html";
    return;
  }

  const supaUser = session.user;
  const username = supaUser.user_metadata?.username || "Unbekannt";

  // 3. Profil aus der DB laden (rolle + status)
  let role = "member";
  let statusVal = "aktiv";

  try {
    const profile = await supabaseAPI.fetchData("profiles", { username });
    if (profile && profile.length > 0) {
      role = profile[0].rolle || role;
      statusVal = profile[0].status || statusVal;
    }
  } catch (err) {
    console.warn("[CSV] Profil konnte nicht geladen werden:", err);
  }

  // 4. Blockierte Nutzer sofort rausschmeißen
  if (statusVal !== "aktiv") {
    status.show("Zugang gesperrt. Bitte wende dich an einen Admin.", "error");
    setTimeout(async () => {
      await supabaseAPI.logoutUser().catch(() => {});
      sessionStorage.clear();
      window.location.href = "index.html";
    }, 1200);
    return;
  }

  // 5. Begrüßung anzeigen
  if (content) {
    const info = document.createElement("p");
    info.textContent = `Angemeldet als: ${username} (${role})`;
    content.appendChild(info);
  }

  // 6. SessionStorage für Kopf & Navigation aktualisieren
  sessionStorage.setItem("username", username);
  sessionStorage.setItem("userRole", role);

  // Event senden → Kopf aktualisiert sich automatisch
  window.dispatchEvent(new StorageEvent("storage", { key: "userRole", newValue: role }));
})();