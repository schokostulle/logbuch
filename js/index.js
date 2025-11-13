// /logbuch/js/index.js — Version 0.3 (Onlinebetrieb über Supabase)

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
    const { user, error } = await supabaseAPI.loginUser(username, password);
    if (error || !user) throw error || new Error("Login fehlgeschlagen.");

    const profileName = user.user_metadata?.username || username;
    sessionStorage.setItem("username", profileName);
    sessionStorage.setItem("userRole", "User");
    sessionStorage.removeItem("lastExit");

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

    // Erfolg: unabhängig davon, ob Supabase bereits user/session liefert
    status.show("Registrierung erfolgreich. Jetzt einloggen.", "ok");
    registerForm.reset();
    fadeSwitch(registerForm, loginForm, tabRegister, tabLogin);
  } catch (err) {
    console.error(err);
    const msg =
      (err.message || "").toLowerCase().includes("duplicate") ||
      (err.message || "").toLowerCase().includes("unique")
        ? "Benutzername existiert bereits."
        : (err.message || "Registrierung fehlgeschlagen.");
    status.show(msg, "error");
  }
});