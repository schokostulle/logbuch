// /logbuch/js/index.js — Version 0.8 (Supabase Onlinebetrieb + Statusprüfung)

// ==============================
// Tabs & Formulare
// ==============================
const tabLogin = document.getElementById("tab-login");
const tabRegister = document.getElementById("tab-register");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");

// Umschaltanimation
function fadeSwitch(fromEl, toEl, fromTab, toTab) {
  fromEl.classList.add("fadeout");
  setTimeout(() => {
    fromEl.classList.add("hidden");
    fromEl.classList.remove("fadeout");
    if (typeof fromEl.reset === "function") fromEl.reset();
    toEl.classList.remove("hidden");
    toEl.style.opacity = "0";
    toEl.style.transform = "scale(0.98)";
    setTimeout(() => {
      toEl.style.opacity = "1";
      toEl.style.transform = "scale(1)";
    }, 30);
  }, 350);
  fromTab.classList.remove("active");
  toTab.classList.add("active");
}

// Tabs umschalten
tabLogin.addEventListener("click", () => {
  if (!loginForm.classList.contains("hidden")) return;
  fadeSwitch(registerForm, loginForm, tabRegister, tabLogin);
});

tabRegister.addEventListener("click", () => {
  if (!registerForm.classList.contains("hidden")) return;
  fadeSwitch(loginForm, registerForm, tabLogin, tabRegister);
});

// ==============================
// LOGIN über Supabase
// ==============================
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;

  if (!username || !password) {
    status.show("Bitte alle Felder ausfüllen.", "warn");
    return;
  }

  try {
    // Login mit Fake-Mail
    const { user, error } = await supabaseAPI.loginUser(username, password);
    if (error || !user) throw error || new Error("Login fehlgeschlagen.");

    const profileName = user.user_metadata?.username || username;

    // 🔹 Rolle und Status aus Tabelle "profiles" abrufen
    let role = "member";
    let statusVal = "blockiert";
    try {
      const res = await supabaseAPI.fetchData("profiles", { username: profileName });
      if (res && res.length > 0) {
        role = res[0].rolle || "member";
        statusVal = res[0].status || "blockiert";
      }
    } catch (dbErr) {
      console.warn("[Login] Profil konnte nicht aus 'profiles' geladen werden:", dbErr);
    }

    // ⛔ Blockierte Nutzer abweisen
    if (statusVal.toLowerCase() !== "aktiv") {
      await supabaseAPI.logoutUser().catch(() => {});
      status.show("Zugang gesperrt. Bitte wende dich an einen Admin.", "error");
      return;
    }

    // Session speichern
    sessionStorage.setItem("username", profileName);
    sessionStorage.setItem("userRole", role);
    sessionStorage.removeItem("lastExit");

    // 🔁 Kopf sofort aktualisieren
    window.dispatchEvent(new StorageEvent("storage", { key: "userRole", newValue: role }));

    status.show(`Willkommen ${profileName}`, "ok");
    loginForm.reset();
    setTimeout(() => (window.location.href = "gate.html"), 900);
  } catch (err) {
    console.error(err);
    status.show("Anmeldung fehlgeschlagen.", "error");
  }
});

// ==============================
// REGISTRIERUNG über Supabase
// ==============================
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("reg-username").value.trim();
  const pw1 = document.getElementById("reg-password").value;
  const pw2 = document.getElementById("reg-password2").value;

  if (!username || !pw1 || !pw2) {
    status.show("Bitte alle Felder ausfüllen.", "warn");
    return;
  }
  if (pw1 !== pw2) {
    status.show("Passwörter stimmen nicht überein.", "error");
    return;
  }
  if (pw1.length < 6) {
    status.show("Passwort: mind. 6 Zeichen.", "warn");
    return;
  }

  try {
    const res = await supabaseAPI.registerUser(username, pw1);
    if (!res?.ok) throw new Error("Registrierung fehlgeschlagen.");

    // Standardrolle & Status setzen
    try {
      const allProfiles = await supabaseAPI.fetchData("profiles");
      const role = allProfiles.length === 0 ? "admin" : "member"; // erster Admin
      const statusVal = allProfiles.length === 0 ? "aktiv" : "blockiert";

      await supabaseAPI.insertData("profiles", {
        username,
        rolle: role,
        status: statusVal,
        deleted: false
      });
    } catch (insErr) {
      console.warn("[Registrierung] Konnte Profil nicht speichern:", insErr);
    }

    status.show("Registrierung erfolgreich. Jetzt einloggen.", "ok");
    registerForm.reset();
    fadeSwitch(registerForm, loginForm, tabRegister, tabLogin);
  } catch (err) {
    console.error(err);
    const msg =
      (err.message || "").toLowerCase().includes("duplicate") ||
      (err.message || "").toLowerCase().includes("unique")
        ? "Benutzername existiert bereits."
        : err.message || "Registrierung fehlgeschlagen.";
    status.show(msg, "error");
  }
});