// /logbuch/dashboard/dashboard.js — Version 0.3 (Supabase Onlinebetrieb)
(async function () {
  const username = sessionStorage.getItem("username");

  // Supabase-Session prüfen
  let session = null;
  try {
    const data = await supabaseAPI.getSession();
    session = data;
  } catch (err) {
    console.error("Supabase-Sessionprüfung fehlgeschlagen:", err);
  }

  // Kein Benutzer oder keine aktive Session → zurück zum Gate
  if (!username || !session) {
    window.location.href = "gate.html";
    return;
  }

  // Begrüßung / Infoanzeige
  const content = document.getElementById("content");
  if (content) {
    const user = session.user;
    const name = user?.user_metadata?.username || username;
    const info = document.createElement("p");
    info.textContent = `Angemeldet als: ${name}`;
    content.appendChild(info);
  }
})();
