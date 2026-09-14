// Gemeinsame Auth-Logik für alle Logbuch-Module.
// Stellt window.Auth mit supabase-Client, Login/Logout und einem
// "onReady"-Hook bereit, den jedes Modul nutzt, um erst nach erfolgreichem
// Login seine eigenen Daten zu laden.

const Auth = (function () {
  const client = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);
  let readyCallback = null;

  function showApp() {
    document.getElementById('loginBox').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    if (typeof Nav !== 'undefined' && Nav.render) Nav.render();
    if (readyCallback) readyCallback(client);
  }

  function showLogin() {
    document.getElementById('loginBox').style.display = 'block';
    document.getElementById('app').style.display = 'none';
  }

  function initLoginForm() {
    const btn = document.getElementById('loginBtn');
    const input = document.getElementById('password');
    const errorBox = document.getElementById('loginError');

    async function attemptLogin() {
      errorBox.textContent = '';
      const { error } = await client.auth.signInWithPassword({
        email: CONFIG.fixedEmail,
        password: input.value
      });
      if (error) {
        errorBox.textContent = 'Login fehlgeschlagen: ' + error.message;
        return;
      }
      showApp();
    }

    btn.addEventListener('click', attemptLogin);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') attemptLogin();
    });
  }

  function initLogoutButton() {
    const btn = document.getElementById('logout');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      await client.auth.signOut();
      showLogin();
    });
  }

  // onReady(fn): fn(supabaseClient) wird aufgerufen, sobald ein gültiger Login vorliegt
  // (direkt beim Laden, falls Sitzung noch besteht, oder nach erfolgreichem Login).
  function onReady(fn) {
    readyCallback = fn;
  }

  function init() {
    initLoginForm();
    initLogoutButton();
    client.auth.getSession().then(({ data }) => {
      if (data.session) { showApp(); } else { showLogin(); }
    });
  }

  return { client, onReady, init };
})();
