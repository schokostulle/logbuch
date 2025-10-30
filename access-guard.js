// =============================================================
// access-guard.js – Supabase-only Zugriffskontrolle
// Version: 2.0 – 02.11.2025
// Keine Nutzung von localStorage; nur Supabase Auth & users-Table
// =============================================================

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // 🧭 Prüfe aktuelle Supabase-Session
    const { data: sessionData, error: sessionError } = await window.supabase.auth.getUser();
    if (sessionError) throw sessionError;

    const authUser = sessionData?.user;
    if (!authUser) {
      console.warn("❌ Kein Supabase-User aktiv – Weiterleitung zur Zugangskontrolle.");
      window.location.href = "gate.html";
      return;
    }

    // 🧭 Lade Benutzerdetails aus users-Tabelle
    const { data: userData, error: userError } = await window.supabase
      .from("users")
      .select("id, username, role, status")
      .eq("id", authUser.id)
      .single();

    if (userError) {
      console.error("❌ Benutzer in users-Tabelle nicht gefunden oder Fehler:", userError);
      alert("Zugang verweigert – Benutzer konnte nicht verifiziert werden.");
      await window.supabase.auth.signOut();
      window.location.href = "gate.html";
      return;
    }

    // 🛑 Statusprüfung
    if (!userData || userData.status?.toLowerCase() !== "aktiv") {
      console.warn(`Benutzer "${userData?.username}" ist geblockt oder inaktiv.`);
      alert("Zugang verweigert – dein Account ist nicht aktiv.");
      await window.supabase.auth.signOut();
      window.location.href = "gate.html";
      return;
    }

    // ✅ Zugang gewährt
    console.info(`✅ Zugang gewährt für ${userData.username} (${userData.role})`);

    // Optional: Benutzerinfos global verfügbar machen
    window.currentUser = userData;
  } catch (err) {
    console.error("❌ Unerwarteter Fehler in access-guard:", err);
    alert("Fehler bei der Zugangskontrolle. Bitte erneut anmelden.");
    try {
      await window.supabase.auth.signOut();
    } catch (_) {}
    window.location.href = "gate.html";
  }
});