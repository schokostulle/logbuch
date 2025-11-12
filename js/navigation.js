// /logbuch/js/navigation.js — Version 0.3 (Supabase Onlinebetrieb)
(function initNavigation() {
  let initialized = false;
  let attempts = 0;

  async function renderNavigation() {
    if (initialized) return true;

    const navContainer = document.getElementById("nav");
    if (!navContainer) return false;

    // Benutzer aus Supabase oder Session holen
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

    // Navigation erzeugen
    navContainer.innerHTML = `
      <nav class="nav">
        <div class="brand">⚓ Allianz-Logbuch</div>

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

    // Logout → Gate (Exit)
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

  // Wiederholungslogik mit Supabase-Abhängigkeit
  async function tryRender() {
    const success = await renderNavigation();
    if (!success && attempts++ < 10) setTimeout(tryRender, 300);
  }

  // DOM vollständig geladen → Initialisierung starten
  window.addEventListener("load", tryRender);
})();
