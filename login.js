// =============================================================
// login.js – Supabase-only Login (v2.2)
// -------------------------------------------------------------
// - nutzt Fake-E-Mail <username>@bullfrog.fake
// - sorgt für automatisches User-Mapping in "users"-Tabelle
// - prüft Benutzerstatus ('aktiv')
// - zeigt Statusmeldungen im UI statt via alert()
// =============================================================

import { supabase } from "./logbuch.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const nameInput = document.getElementById("loginName");
  const passInput = document.getElementById("loginPass");
  const statusBox = document.getElementById("statusMessage");

  if (!form) {
    console.warn("❗ login.js: loginForm nicht gefunden");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = nameInput.value.trim();
    const password = passInput.value.trim();
    if (!username || !password) {
      showStatus("Bitte Name und Passwort eingeben.", "warn");
      return;
    }

    const email = `${username}@bullfrog.fake`.toLowerCase();
    showStatus("⏳ Anmeldung wird überprüft...", "info");

    try {
      // --------------------------------------------------------
      // Anmeldung bei Supabase Auth
      // --------------------------------------------------------
      const { data: signData, error: signError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signError) {
        console.error("❌ Login fehlgeschlagen:", signError);
        showStatus("Anmeldung fehlgeschlagen. Benutzername oder Passwort falsch.", "error");
        return;
      }

      const authUser = signData?.user;
      if (!authUser) {
        showStatus("Anmeldung fehlgeschlagen. Kein Benutzerobjekt empfangen.", "error");
        return;
      }

      // --------------------------------------------------------
      // Benutzer aus Tabelle 'users' lesen
      // --------------------------------------------------------
      const { data: userEntry, error: userError } = await supabase
        .from("users")
        .select("id, username, role, status")
        .eq("id", authUser.id)
        .maybeSingle();

      if (userError && userError.code !== "PGRST116") {
        console.error("Fehler beim Laden des Benutzer-Eintrags:", userError);
        showStatus("Fehler beim Laden des Benutzers. Bitte später erneut versuchen.", "error");
        return;
      }

      let userData = userEntry;

      // --------------------------------------------------------
      // Wenn Benutzer nicht existiert → neu anlegen
      // --------------------------------------------------------
      if (!userData) {
        const { data: newUser, error: insertErr } = await supabase
          .from("users")
          .insert({
            id: authUser.id,
            username,
            role: "member",
            status: "aktiv",
          })
          .select()
          .single();

        if (insertErr) {
          console.error("Fehler beim Anlegen des Benutzers:", insertErr);
          showStatus("Fehler beim Anlegen des Benutzers. Bitte Admin kontaktieren.", "error");
          await supabase.auth.signOut();
          return;
        }
        userData = newUser;
      }

      // --------------------------------------------------------
      // Zugriff nur für aktive Benutzer
      // --------------------------------------------------------
      if ((userData.status || "").toLowerCase() !== "aktiv") {
        showStatus("🚫 Benutzer ist nicht aktiv. Bitte Admin kontaktieren.", "error");
        await supabase.auth.signOut();
        return;
      }

      // --------------------------------------------------------
      // Erfolg → Dashboard
      // --------------------------------------------------------
      showStatus(`✅ Willkommen zurück, ${userData.username || username}!`, "success");
      setTimeout(() => (window.location.href = "dashboard.html"), 1200);

    } catch (err) {
      console.error("❌ Unbekannter Fehler beim Login:", err);
      showStatus("Unbekannter Fehler beim Login. Bitte Konsole prüfen.", "error");
    }
  });

  // ------------------------------------------------------------
  // Hilfsfunktion: Statusanzeige im DOM
  // ------------------------------------------------------------
  function showStatus(msg, type = "info") {
    if (!statusBox) return alert(msg);
    statusBox.innerHTML = `<p class="${type}">${msg}</p>`;
  }
});