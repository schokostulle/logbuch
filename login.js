// =============================================================
// login.js – Supabase-only Login (final)
// Version: 2.1 – 03.11.2025
// Hinweis: Nutzt fake-email: <username>@bullfrog.fake
// Funktioniert mit Supabase-Client aus logbuch.js
// =============================================================

import { supabase } from "./logbuch.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const nameInput = document.getElementById("loginName");
  const passInput = document.getElementById("loginPass");

  if (!form || !nameInput || !passInput) {
    console.warn("login.js: login form elements not found.");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const pass = passInput.value.trim();

    if (!name || !pass) {
      alert("Bitte Name und Passwort eingeben.");
      return;
    }

    // Erzeuge die Fake-Email
    const email = `${name}@bullfrog.fake`.toLowerCase();

    try {
      // Anmeldung bei Supabase Auth
      const { data: signData, error: signError } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });

      if (signError) {
        console.error("Login fehlgeschlagen:", signError);
        alert("Anmeldung fehlgeschlagen. Bitte überprüfe Benutzername/Passwort.");
        return;
      }

      const authUser = signData?.user;
      if (!authUser) {
        alert("Anmeldung fehlgeschlagen (kein User).");
        return;
      }

      // -------------------------------
      // Sicherstellen, dass users-Tabelle einen Eintrag hat
      // -------------------------------
      const { data: userRecord, error: userFetchError } = await supabase
        .from("users")
        .select("id, username, role, status")
        .eq("id", authUser.id)
        .single();

      if (userFetchError && userFetchError.code !== "PGRST116") {
        console.error("Fehler beim Lesen der users-Tabelle:", userFetchError);
        alert("Fehler beim Benutzerladen. Bitte später erneut versuchen.");
        return;
      }

      let userEntry = userRecord || null;

      // Falls kein Eintrag existiert → automatisch anlegen
      if (!userEntry) {
        const { data: byName } = await supabase
          .from("users")
          .select("id, username, role, status")
          .ilike("username", name)
          .limit(1)
          .maybeSingle();

        if (byName) {
          // Versuch Update
          const { error: updErr } = await supabase
            .from("users")
            .update({ id: authUser.id })
            .match({ id: byName.id });

          if (updErr) {
            console.warn("Update-Konflikt, neuer Eintrag wird erstellt:", updErr);
          }
        }

        // Neuer Benutzer falls noch keiner existiert
        const { data: newUser, error: insertErr } = await supabase
          .from("users")
          .insert({
            id: authUser.id,
            username: name,
            role: "member",
            status: "aktiv",
          })
          .select()
          .single();

        if (insertErr) {
          console.error("Fehler beim Anlegen des Benutzer-Eintrags:", insertErr);
          alert("Fehler beim Anlegen des Benutzers. Bitte Admin kontaktieren.");
          await supabase.auth.signOut();
          return;
        }

        userEntry = newUser;
      }

      // -------------------------------
      // Status prüfen (nur 'aktiv' darf weiter)
      // -------------------------------
      const status = (userEntry.status || "").toLowerCase();
      if (status !== "aktiv") {
        alert("Zugang verweigert – Benutzer ist nicht aktiv. Bitte Admin kontaktieren.");
        await supabase.auth.signOut();
        return;
      }

      // -------------------------------
      // Login erfolgreich => Weiterleitung
      // -------------------------------
      alert(`Willkommen zurück, ${userEntry.username || name}!`);
      window.location.href = "dashboard.html";
    } catch (err) {
      console.error("❌ Unbekannter Fehler beim Login:", err);
      alert("Unbekannter Fehler beim Login. Siehe Konsole.");
    }
  });
});