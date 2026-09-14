// Modul: Farmstatistik. Lädt und rendert die "farm_targets"-Tabelle.
// Wird erst aktiv, sobald Auth.onReady feuert (siehe auth.js).

const Farmstatistik = (function () {
  const TABLE = 'farm_targets';
  let supabase = null;
  let currentData = [];
  let sortKey = 'distance';
  let sortAsc = true;

  function formatFahrzeit(minutesTotal) {
    if (minutesTotal === null || minutesTotal === undefined) return '–';
    const totalSeconds = Math.round(minutesTotal * 60);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return `${h}:${pad(m)}:${pad(s)}`;
  }

  function formatRueckkehr(minutesTotal) {
    if (minutesTotal === null || minutesTotal === undefined) return '–';
    const now = new Date();
    const rueckkehr = new Date(now.getTime() + 2 * minutesTotal * 60000);
    return rueckkehr.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  async function loadData() {
    document.getElementById('meta').textContent = 'Lade Daten…';
    const { data, error } = await supabase.from(TABLE).select('*');
    if (error) {
      document.getElementById('meta').textContent = 'Fehler beim Laden: ' + error.message;
      console.error(error);
      return;
    }
    currentData = data;
    render();
    document.getElementById('meta').textContent =
      `${currentData.length} Ziele · Stand: ${new Date().toLocaleString('de-DE')}`;
  }

  function render() {
    const sorted = [...currentData].sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (av === null || av === undefined) av = sortAsc ? Infinity : -Infinity;
      if (bv === null || bv === undefined) bv = sortAsc ? Infinity : -Infinity;
      if (typeof av === 'string') return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortAsc ? av - bv : bv - av;
    });

    const tbody = document.getElementById('tbody');
    tbody.innerHTML = '';
    sorted.forEach((row) => {
      const tr = document.createElement('tr');
      const classes = [];
      if (row.status === 'lohnt sich') classes.push('lohnt');
      if (row.status === 'unbekannt') classes.push('unbekannt');
      if (row.s) classes.push('bearbeitet');
      tr.className = classes.join(' ');
      tr.innerHTML = `
        <td>${row.oz ?? ''}</td>
        <td>${row.ig ?? ''}</td>
        <td>${row.i ?? ''}</td>
        <td>${row.distance !== null ? row.distance : '–'}</td>
        <td>${formatFahrzeit(row.fahrzeit_minuten)}</td>
        <td>${formatRueckkehr(row.fahrzeit_minuten)}</td>
        <td>${row.nearest_village || '–'}</td>
        <td>${row.est_gold ?? '–'}</td>
        <td>${row.est_steine ?? '–'}</td>
        <td>${row.est_holz ?? '–'}</td>
        <td>${row.farmable_sum ?? '–'}</td>
        <td>${row.kogg_empfehlung !== null && row.kogg_empfehlung !== undefined ? String(row.kogg_empfehlung).replace('.', ',') : '–'}</td>
        <td>${row.status}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function initSortHandlers() {
    document.querySelectorAll('th[data-key]').forEach((th) => {
      th.addEventListener('click', () => {
        const key = th.dataset.key;
        if (sortKey === key) { sortAsc = !sortAsc; } else { sortKey = key; sortAsc = true; }
        render();
      });
    });
  }

  function init(client) {
    supabase = client;
    initSortHandlers();
    document.getElementById('refresh').addEventListener('click', loadData);
    loadData();
    setInterval(render, 60000); // Rückkehr-Zeiten laufend aktualisieren
  }

  return { init };
})();

Auth.onReady(Farmstatistik.init);
