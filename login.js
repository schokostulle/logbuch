// =============================================================
// login.js – Supabase-only Login
// Version: 1.0 – 02.11.2025
// Hinweis: Nutzt fake-email: <username>@bullfrog.fake
// Supabase muss via window.supabase initialisiert sein (supabase.createClient)
// =============================================================

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
      const { data: signData, error: signError } = await window.supabaseClient.auth.signInWithPassword({
        email,
        password: pass,
      });

      if (signError) {
        // Fehler beim Authentifizieren
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
      // Wir suchen zuerst nach einem users-Eintrag mit id = authUser.id
      // Falls nicht vorhanden, erzeugen wir einen neuen Eintrag und koppeln username -> name
      const { data: userRecord, error: userFetchError } = await window.supabaseClient
        .from("users")
        .select("id, username, role, status")
        .eq("id", authUser.id)
        .single();

      if (userFetchError && userFetchError.code !== "PGRST116") {
        // PGRST116 = no rows (single() returned nothing) -> behandeln wir separat
        console.error("Fehler beim Lesen der users-Tabelle:", userFetchError);
        alert("Fehler beim Benutzerladen. Bitte später erneut versuchen.");
        // Bei ernsteren Fehlern loggen und abbrechen
        return;
      }

      let userEntry = userRecord || null;

      if (!userEntry) {
        // Kein expliziter users-Eintrag mit dieser id vorhanden.
        // Versuche Alternativsuche nach username (ältere Daten) --> falls existiert, update id to auth id
        const { data: byName, error: byNameError } = await window.supabaseClient
          .from("users")
          .select("id, username, role, status")
          .ilike("username", name)
          .limit(1)
          .single();

        if (byName && !byNameError) {
          // Aktualisiere den vorhandenen users-Eintrag: setze id = authUser.id (falls möglich)
          // Achtung: direkte Änderung der PK kann fehlschlagen falls schon verwendet — in dem Fall legen wir neuen Eintrag an.
          try {
            const { error: updErr } = await window.supabaseClient
              .from("users")
              .update({ id: authUser.id })
              .match({ id: byName.id });

            if (updErr) {
              // Falls nicht möglich, ignoriere und erstelle neuen Eintrag
              console.warn("Konflikt beim Update user.id – Erstelle neuen Eintrag.", updErr);
              const { data: insData, error: insErr } = await window.supabaseClient
                .from("users")
                .insert({
                  id: authUser.id,
                  username: name,
                  role: "member",
                  status: "aktiv",
                })
                .select()
                .single();

              if (insErr) throw insErr;
              userEntry = insData;
            } else {
              // Lade aktualisierten Eintrag
              const { data: refreshed } = await window.supabaseClient
                .from("users")
                .select("id, username, role, status")
                .eq("id", authUser.id)
                .single();
              userEntry = refreshed;
            }
          } catch (err) {
            console.error("Fehler beim Erstellen/Aktualisieren des Benutzers:", err);
            alert("Fehler bei der Benutzerverarbeitung. Bitte Admin kontaktieren.");
            await window.supabaseClient.auth.signOut();
            return;
          }
        } else {
          // Kein Eintrag vorhanden: Erzeuge einen neuen users-Eintrag
          try {
            const { data: newUser, error: insertErr } = await window.supabaseClient
              .from("users")
              .insert({
                id: authUser.id,
                username: name,
                role: "member",
                status: "aktiv",
              })
              .select()
              .single();

            if (insertErr) throw insertErr;
            userEntry = newUser;
          } catch (err) {
            console.error("Fehler beim Anlegen des Benutzer-Eintrags:", err);
            alert("Fehler beim Anlegen des Benutzers. Bitte Admin kontaktieren.");
            await window.supabaseClient.auth.signOut();
            return;
          }
        }
      }

      // -------------------------------
      // Status prüfen (nur 'aktiv' darf weiter)
      // -------------------------------
      const status = (userEntry.status || "").toLowerCase();
      if (status !== "aktiv") {
        alert("Zugang verweigert – Benutzer ist nicht aktiv. Bitte Admin kontaktieren.");
        // Log user out to be safe
        await window.supabaseClient.auth.signOut();
        return;
      }

      // -------------------------------
      // Login erfolgreich => Weiterleitung
      // -------------------------------
      alert(`Willkommen zurück, ${userEntry.username || name}!`);
      window.location.href = "dashboard.html";
    } catch (err) {
      console.error("Unbekannter Fehler beim Login:", err);
      alert("Unbekannter Fehler beim Login. Siehe Konsole.");
    }
  });
});