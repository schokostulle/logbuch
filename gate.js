// =============================================================
// gate.js – Supabase-only Türsteherseite
// Version: 2.0 – 02.11.2025
// Prüft Supabase-Session, Rolle & Status
// Weiterleitung zu Dashboard oder Login
// =============================================================

document.addEventListener("DOMContentLoaded", async () => {
  const statusBox = document.getElementById("statusMessage");

  function showMessage(msg) {
    if (statusBox) statusBox.innerHTML = `<p>${msg}</p>`;
  }

  function redirect(target, delay = 1500) {
    setTimeout(() => {
      window.location.href = target;
    }, delay);
  }

  // Kleine Verzögerung für "Ladegefühl"
  showMessage("⏳ Zugangskontrolle wird überprüft...");

  setTimeout(async () => {
    try {
      // 1️⃣ Session prüfen
      const { data: sessionData, error: sessionError } = await window.supabase.auth.getUser();
      if (sessionError) throw sessionError;

      const authUser = sessionData?.user;
      if (!authUser) {
        showMessage("🚫 Kein Benutzer angemeldet. Weiterleitung zur Anmeldung...");
        redirect("login.html");
        return;
      }

      // 2️⃣ Benutzerinformationen laden
      const { data: userData, error: userError } = await window.supabase
        .from("users")
        .select("id, username, role, status")
        .eq("id", authUser.id)
        .single();

      if (userError || !userData) {
        console.warn("Benutzer konnte nicht in der users-Tabelle gefunden werden:", userError);
        showMessage("🚫 Kein gültiger Benutzer gefunden. Weiterleitung...");
        await window.supabase.auth.signOut();
        redirect("login.html");
        return;
      }

      // 3️⃣ Status prüfen
      const status = userData.status?.toLowerCase();
      if (status !== "aktiv") {
        showMessage(
          `🚫 Zugang verweigert – Benutzer <strong>${userData.username}</strong> ist geblockt oder inaktiv.`
        );
        await window.supabase.auth.signOut();
        redirect("login.html");
        return;
      }

      // 4️⃣ Erfolg – Zugang gewährt
      showMessage(
        `✅ Willkommen, <strong>${userData.username}</strong>! Deine Daten sind gültig. Du wirst eingelassen...`
      );
      redirect("dashboard.html");
    } catch (err) {
      console.error("❌ Fehler bei der Zugangskontrolle:", err);
      showMessage("🚫 Fehler bei der Authentifizierung. Bitte melde dich erneut an.");
      redirect("login.html");
    }
  }, 1000);
});