// /logbuch/js/navigation.js — Version 0.3b (stabil, kompatibel mit timeout.js & style.css)
(function initNavigation() {
  let initialized = false;
  let attempts = 0;

  async function renderNavigation() {
    if (initialized) return true;

    const navContainer = document.getElementById("nav");
    if (!navContainer) return false;

    // Username ausschließlich aus SessionStorage
    // (Rolle & Status werden nicht in der Navi angezeigt)
    const username = sessionStorage.getItem("username") || "Gast";

    // ==========================================
    // Navigation HTML-Struktur aufbauen
    // ==========================================
    navContainer.innerHTML = `
      <nav class="nav">

        <!-- Header: Titel + Timeout -->
        <div class="nav-header">
          <div class="nav-title">
            <span class="icon">⚓</span>
            <span class="label">Logbuch</span>
          </div>
          <div class="nav-session">
            <span id="nav-timeout">[--:--]</span>
          </div>
        </div>

        <!-- Menüeinträge -->
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
          console.warn("[Navigation] Logout fehlgeschlagen:", err);
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

  window.addEventListener("load", tryRender);
})();