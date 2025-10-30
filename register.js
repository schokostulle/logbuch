// =============================================================
// register.js – Supabase-only Registrierung (final)
// Version: 2.1 – 03.11.2025
// Registrierung mit Nutzername & Passwort
// Intern: Fake-E-Mail "<name>@bullfrog.fake"
// Erstregistrierung = Admin/aktiv, danach Member/geblockt
// =============================================================

import { supabase } from "./logbuch.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const nameInput = document.getElementById("regName");
  const passInput = document.getElementById("regPass");

  if (!form || !nameInput || !passInput) {
    console.warn("register.js: Formularelemente nicht gefunden.");
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

    const email = `${name.toLowerCase()}@bullfrog.fake`;

    try {
      // 1️⃣ Prüfen, ob es bereits Benutzer gibt (Erstregistrierung = Admin)
      const { data: allUsers, error: countError } = await supabase
        .from("users")
        .select("id", { count: "exact" });

      if (countError) throw countError;

      const isFirstUser = !allUsers || allUsers.length === 0;

      // 2️⃣ Benutzer in Supabase Auth registrieren
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: pass,
      });

      if (signUpError) {
        console.error("❌ Fehler bei Supabase-Registrierung:", signUpError);
        alert("Registrierung fehlgeschlagen. Möglicherweise existiert der Benutzer bereits.");
        return;
      }

      const authUser = signUpData?.user;
      if (!authUser) {
        alert("Registrierung fehlgeschlagen – kein Benutzerobjekt empfangen.");
        return;
      }

      // 3️⃣ Benutzer in 'users'-Tabelle anlegen
      const role = isFirstUser ? "admin" : "member";
      const status = isFirstUser ? "aktiv" : "geblockt";

      const { error: insertError } = await supabase.from("users").insert([
        {
          id: authUser.id,
          username: name,
          role,
          status,
        },
      ]);

      if (insertError) {
        console.error("❌ Fehler beim Eintragen in users:", insertError);
        alert("Fehler beim Speichern in der Benutzertabelle. Bitte Admin kontaktieren.");
        return;
      }

      // 4️⃣ Erfolg & Weiterleitung
      if (isFirstUser) {
        alert(`Erster Benutzer registriert. Willkommen, Admiral ${name}!`);
      } else {
        alert(`Registrierung erfolgreich! Dein Konto ist blockiert, bis ein Admin dich freischaltet.`);
      }

      window.location.href = "login.html";
    } catch (err) {
      console.error("❌ Unerwarteter Fehler bei der Registrierung:", err);
      alert("Fehler bei der Registrierung. Siehe Konsole für Details.");
    }
  });
});