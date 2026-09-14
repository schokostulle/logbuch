// Gemeinsame Navigation für alle Logbuch-Module.
// Neue Module einfach hier in MODULES ergänzen - erscheinen dann automatisch
// in der Kopfleiste auf jeder Seite, die nav.js einbindet.

const Nav = (function () {
  const MODULES = [
    { label: 'Dashboard', href: 'index.html' },
    { label: 'Farmstatistik', href: 'farmstatistik.html' }
    // Weiteres Modul: { label: 'Neuer Name', href: 'neue-datei.html' }
  ];

  function currentPage() {
    const path = window.location.pathname;
    const file = path.substring(path.lastIndexOf('/') + 1);
    return file || 'index.html';
  }

  function render() {
    const el = document.getElementById('navbar');
    if (!el) return;
    const page = currentPage();
    el.innerHTML = MODULES.map((m) => {
      const active = m.href === page;
      return `<a href="${m.href}" class="navlink${active ? ' active' : ''}">${m.label}</a>`;
    }).join('');
  }

  return { render, MODULES };
})();
