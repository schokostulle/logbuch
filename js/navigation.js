// /logbuch/js/navigation.js — Version 0.5 (stabil, Icon-Responsive, korrekte Pfade)
(function initNavigation() {
  let attempts = 0;
  let initialized = false;

  async function renderNavigation() {
    if (initialized) return true;

    const navContainer = document.getElementById("nav");
    if (!navContainer) return false;

    navContainer.innerHTML = `
      <nav class="nav">

        <!-- Header -->
        <div class="nav-header">
          <div class="nav-title">
            <span class="icon">⚓</span>
            <span class="label">Logbuch</span>
          </div>
        </div>

        <!-- Menü -->
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
              <span class="label">Memberverwaltung</span>
            </a>
          </li>
          <li>
            <a href="csv/csv.html">
              <span class="icon">⚙️</span>
              <span class="label">CSV-Upload</span>
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

    const logoutBtn = navContainer.querySelector("#btn-logout");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        try { await supabaseAPI.logoutUser(); } catch (_) {}
        sessionStorage.setItem("lastExit", "pending");
        window.location.href = "gate.html";
      });
    }

    initialized = true;
    return true;
  }

  async function tryRender() {
    const ok = await renderNavigation();
    if (!ok && attempts++ < 10) setTimeout(tryRender, 300);
  }

  window.addEventListener("load", tryRender);
})();