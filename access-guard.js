// =============================================================
// access-guard.js – Supabase-only Zugriffsschutz
// Version: 2.1 – 03.11.2025
// =============================================================

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // 🧭 1️⃣ Supabase-Client prüfen
    if (!window.supabase) {
      console.error("❌ Supabase-Client nicht initialisiert – logbuch.js muss zuerst geladen werden.");
      window.location.href = "gate.html";
      return;
    }

    const supabase = window.supabase;

    // 🔐 2️⃣ Aktuelle Sitzung laden
    const { data: sessionData, error: sessionError } = await supabase.auth.getUser();

    if (sessionError || !sessionData?.user) {
      console.warn("⚠️ Keine aktive Sitzung gefunden. Weiterleitung zur Anmeldung.");
      window.location.href = "login.html";
      return;
    }

    const authUser = sessionData.user;

    // ⚓ 3️⃣ Benutzerstatus aus 'users'-Tabelle laden
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, username, role, status, deleted")
      .eq("id", authUser.id)
      .maybeSingle();

    if (userError) {
      console.error("❌ Fehler beim Laden der Benutzerinformationen:", userError);
      alert("Fehler beim Benutzerabgleich. Bitte erneut anmelden.");
      await supabase.auth.signOut();
      window.location.href = "login.html";
      return;
    }

    if (!userData) {
      console.warn("⚠️ Kein Eintrag in users-Tabelle für diesen Account.");
      await supabase.auth.signOut();
      window.location.href = "login.html";
      return;
    }

    // 🚫 4️⃣ Sicherheitsprüfungen
    if (userData.deleted) {
      alert("Zugang verweigert – Benutzer wurde gelöscht.");
      await supabase.auth.signOut();
      window.location.href = "login.html";
      return;
    }

    if (userData.status?.toLowerCase() !== "aktiv") {
      alert("Zugang verweigert – dein Account ist nicht aktiv. Bitte Admin kontaktieren.");
      await supabase.auth.signOut();
      window.location.href = "login.html";
      return;
    }

    // ✅ 5️⃣ Zugriff gewährt
    console.info(`✅ Zugang gewährt für ${userData.username} (${userData.role}).`);

    // Benutzeranzeige aktualisieren (optional)
    const userBox = document.querySelector(".user-status");
    if (userBox) {
      const symbol = userData.role.toLowerCase() === "admin" ? "⚓" : "👤";
      userBox.textContent = `${symbol} ${userData.username} – ${userData.role}`;
    }

  } catch (err) {
    console.error("❌ Unerwarteter Fehler im access-guard:", err);
    alert("Ein unerwarteter Fehler ist aufgetreten. Du wirst ausgeloggt.");
    if (window.supabase) await window.supabase.auth.signOut();
    window.location.href = "login.html";
  }
});