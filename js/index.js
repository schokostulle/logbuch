// js/index.js
// Steuert Login, Registrierung und UI-Umschaltung

import { loginUser, registerUser, getCurrentUser } from "./auth.js";

/* ==========================================================================
   DOM-Elemente
   ========================================================================== */

const loginSection = document.getElementById("login-section");
const registerSection = document.getElementById("register-section");

const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");

const showLoginLink = document.getElementById("show-login");
const showRegisterLink = document.getElementById("show-register");

const statusBox = document.getElementById("auth-status");



/* ==========================================================================
   Statusanzeige
   ========================================================================== */

function showStatus(message, type = "info") {
    statusBox.textContent = message;
    statusBox.className = `status-box ${type}`;
    statusBox.style.display = "block";

    // Auto-Fade-Out nach 4s
    setTimeout(() => {
        statusBox.style.display = "none";
    }, 4000);
}



/* ==========================================================================
   UI-Umschaltung Login ↔ Registrierung
   ========================================================================== */

function switchToLogin() {
    loginSection.classList.remove("hidden");
    registerSection.classList.add("hidden");
}

function switchToRegister() {
    loginSection.classList.add("hidden");
    registerSection.classList.remove("hidden");
}

if (showLoginLink) {
    showLoginLink.addEventListener("click", (e) => {
        e.preventDefault();
        switchToLogin();
    });
}

if (showRegisterLink) {
    showRegisterLink.addEventListener("click", (e) => {
        e.preventDefault();
        switchToRegister();
    });
}



/* ==========================================================================
   FORMULAR: Login
   ========================================================================== */

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = loginForm.email.value.trim();
        const password = loginForm.password.value.trim();

        if (!email || !password) {
            showStatus("Bitte E-Mail und Passwort eingeben.", "error");
            return;
        }

        const result = await loginUser(email, password);

        if (result.error) {
            showStatus(result.error, "error");
            return;
        }

        showStatus("Login erfolgreich!", "success");

        // Weiterleitung ins Dashboard
        window.location.href = "dashboard/dashboard.html";
    });
}



/* ==========================================================================
   FORMULAR: Registrierung
   ========================================================================== */

if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = registerForm.email.value.trim();
        const password = registerForm.password.value.trim();

        if (!email || !password) {
            showStatus("Bitte alle Felder ausfüllen.", "error");
            return;
        }

        const result = await registerUser(email, password);

        if (result.error) {
            showStatus(result.error, "error");
            return;
        }

        showStatus("Registrierung erfolgreich! Du kannst dich jetzt einloggen.", "success");

        // automatisch zurück zum Login
        switchToLogin();
    });
}



/* ==========================================================================
   Automatische Weiterleitung wenn User bereits eingeloggt ist
   ========================================================================== */

(async () => {
    const user = await getCurrentUser();

    if (user) {
        // User schon eingeloggt → direkt ins Dashboard
        window.location.href = "dashboard/dashboard.html";
    }
})();