// =============================================================
// register.js – Supabase-only Registrierung
// Version: 2.0 – 02.11.2025
// Registrierung mit Nutzername & Passwort
// Intern: Fake-E-Mail "<name>@bullfrog.fake"
// Erstregistrierung = Admin/aktiv, danach Member/geblockt
// =============================================================

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
      // 1️⃣ Prüfen, ob es bereits Benutzer in der users-Tabelle gibt
      const { data: allUsers, error: countError } = await window.supabase
        .from("users")
        .select("id", { count: "exact" });

      if (countError) throw countError;

      const isFirstUser = !allUsers || allUsers.length === 0;

      // 2️⃣ Registrierung im Supabase Auth-System
      const { data: signUpData, error: signUpError } = await window.supabase.auth.signUp({
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
        alert("Registrierung fehlgeschlagen. Kein Benutzerobjekt empfangen.");
        return;
      }

      // 3️⃣ Benutzer in users-Tabelle eintragen
      const role = isFirstUser ? "admin" : "member";
      const status = isFirstUser ? "aktiv" : "geblockt";

      const { error: insertError } = await window.supabase.from("users").insert([
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

      // 4️⃣ Erfolgsmeldung und Weiterleitung
      if (isFirstUser) {
        alert(`Erster Benutzer registriert. Willkommen, Admiral ${name}!`);
      } else {
        alert(
          `Registrierung erfolgreich! Dein Konto ist derzeit blockiert. Bitte kontaktiere einen Admin, um Zugriff zu erhalten.`
        );
      }

      window.location.href = "login.html";
    } catch (err) {
      console.error("❌ Unerwarteter Fehler bei der Registrierung:", err);
      alert("Fehler bei der Registrierung. Siehe Konsole für Details.");
    }
  });
});