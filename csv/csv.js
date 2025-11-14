// /logbuch/csv/csv.js — Version 0.2 (Supabase Onlinebetrieb)
(async function () {
  const content = document.getElementById("content");

  let session = null;
  try {
    session = await supabaseAPI.getSession();
  } catch {}

  if (!session || !session.user) {
    window.location.href = "gate.html";
    return;
  }

  const username = session.user.user_metadata?.username || "Unbekannt";

  let role = "member";
  let statusVal = "aktiv";

  try {
    const profile = await supabaseAPI.fetchData("profiles", { username });
    if (profile?.length) {
      role = profile[0].rolle || role;
      statusVal = profile[0].status || statusVal;
    }
  } catch {}

  if (statusVal !== "aktiv") {
    status.show("Zugang gesperrt.", "error");
    setTimeout(async () => {
      await supabaseAPI.logoutUser().catch(() => {});
      sessionStorage.clear();
      window.location.href = "index.html";
    }, 1000);
    return;
  }

  if (content) {
    const info = document.createElement("p");
    info.textContent = `Angemeldet als: ${username} (${role})`;
    content.appendChild(info);
  }

  sessionStorage.setItem("username", username);
  sessionStorage.setItem("userRole", role);

  window.dispatchEvent(new StorageEvent("storage", { key: "userRole", newValue: role }));
})();