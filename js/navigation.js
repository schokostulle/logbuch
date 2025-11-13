// /logbuch/js/navigation.js — Version 0.3a (Supabase Onlinebetrieb, erweitert mit Kopfzeilen)
(function initNavigation() {
  let initialized = false;
  let attempts = 0;

  async function renderNavigation() {
    if (initialized) return true;

    const navContainer = document.getElementById("nav");
    if (!navContainer) return false;

    // ==========================================
    // Benutzername prüfen (Supabase + Session)
    // ==========================================
    let username = sessionStorage.getItem("username") || "Gast";
    try {
      const data = await supabaseAPI.getSession();
      const user = data?.user;
      if (user) {
        username = user.user_metadata?.username || username;
      }
    } catch (err) {
      console.warn("Navigation: Supabase-Session konnte nicht geprüft werden:", err);
    }

    // ==========================================
    // Navigation HTML-Struktur aufbauen
    // ==========================================
    navContainer.innerHTML = `
      <nav class="nav">
        <!-- Zeile 1: Logbuch -->
        <div class="nav-header">
          <div class="nav-title">
            <span class="icon">⚓</span>
            <span class="label">Logbuch</span>
          </div>
          <!-- Zeile 2: Session-Info -->
          <div class="nav-session">
            <span class="timeout">[--:--]</span>
            <span class="label"> (Sessiontimeout)</span>
          </div>
        </div>

        <!-- Navigationseinträge -->
        <ul class="nav-list">
          <li>
            <a href="dashboard/dashboard.html">
              <span class="icon">📯</span>
              <span class="label">Dashboard</span>
            </a>
          </li>
          <li>
            <a href="member/member.html">
              <span class="icon">🪖</span>
              <span class="label">Member</span>
            </a>
          </li>
        </ul>

        <!-- Logout -->
        <ul class="nav-list bottom">
          <li>
            <a href="#" id="btn-logout">
              <span class="icon">⛩️</span>
              <span class="label">Logout</span>
            </a>
          </li>
        </ul>
      </nav>
    `;

    // ==========================================
    // Logout → Gate (Exit)
    // ==========================================
    const logoutBtn = navContainer.querySelector("#btn-logout");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        try {
          await supabaseAPI.logoutUser();
        } catch (err) {
          console.warn("Logout fehlgeschlagen:", err);
        }
        sessionStorage.setItem("lastExit", "pending");
        window.location.href = "gate.html";
      });
    }

    initialized = true;
    return true;
  }

  // ==========================================
  // Wiederholungslogik bei Ladeverzögerung
  // ==========================================
  async function tryRender() {
    const success = await renderNavigation();
    if (!success && attempts++ < 10) setTimeout(tryRender, 300);
  }

  // ==========================================
  // Initialisierung nach DOM-Load
  // ==========================================
  window.addEventListener("load", tryRender);
})();