// /logbuch/dashboard/dashboard.js — Version 0.5 (bereinigt, ohne zusätzliche Ausgaben)
(async function () {
  const content = document.getElementById("content");

  let session = null;
  try {
    session = await supabaseAPI.getSession();
  } catch {
    window.location.href = "gate.html";
    return;
  }

  if (!session || !session.user) {
    window.location.href = "gate.html";
    return;
  }

  const username = session.user.user_metadata?.username || "Unbekannt";

  let role = "member";
  let statusVal = "aktiv";

  try {
    const profile = await supabaseAPI.fetchData("profiles", { username });
    if (profile && profile.length > 0) {
      role = profile[0].rolle || role;
      statusVal = profile[0].status || statusVal;
    }
  } catch {}

  if (statusVal !== "aktiv") {
    status.show("Zugang gesperrt. Bitte wende dich an einen Admin.", "error");
    setTimeout(async () => {
      await supabaseAPI.logoutUser().catch(() => {});
      sessionStorage.clear();
      window.location.href = "index.html";
    }, 1200);
    return;
  }

  sessionStorage.setItem("username", username);
  sessionStorage.setItem("userRole", role);

  window.dispatchEvent(new StorageEvent("storage", { key: "userRole", newValue: role }));
})();