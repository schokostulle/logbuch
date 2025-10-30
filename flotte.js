// =============================================================
// Flotte.js – v1.9
// Loggt nur Gesamtwerte:
// Spalte 1 = Datum/Zeit, Spalte 2 = Benutzername
// =============================================================
const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
if (!currentUser || currentUser.status !== "aktiv") {
  window.location.href = "gate.html";
}
import { Logbuch } from './logbuch.js';

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('flottenForm');
  const textarea = document.getElementById('flottenText');
  const tableContainer = document.querySelector('#flottenTable').parentElement;

  const keys = [
    "Steinschleuderer",
    "Lanzenträger",
    "Langbogenschütze",
    "Kanonen",
    "Fregatte",
    "Handelskogge",
    "Kolonialschiff",
    "Spähschiff"
  ];

  // Bisherige Log-Einträge laden
  let flotteLogs = await Logbuch.load('flotten_logs');
  renderLogs(flotteLogs);

  // ------------------------------------------------------------
  // Formular absenden → Analyse durchführen & speichern
  // ------------------------------------------------------------
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const text = textarea.value.trim();
    if (!text) return;

    const gesamt = parseGesamtOderInselFlotte(text);

    const timestamp = new Date().toLocaleString('de-DE', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    // Benutzername aus der Kopfzeile holen
    const userElem = document.querySelector('.user-status');
    const username = userElem ? userElem.textContent.split('–')[0].trim() : 'Unbekannt';

    // Nur Gesamtzeile speichern
    const row = { Datum: timestamp, Benutzer: username };
    keys.forEach(k => (row[k] = gesamt[k] || 0));

    const logEintrag = { zeit: timestamp, daten: [row] };
    flotteLogs.unshift(logEintrag);

    await Logbuch.save('flotten_logs', flotteLogs);
    renderLogs(flotteLogs);
    textarea.value = '';
  });

  // ------------------------------------------------------------
  // Parser erkennt automatisch: Gesamt oder Inselweise
  // ------------------------------------------------------------
  function parseGesamtOderInselFlotte(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l !== '');
    if (lines[0].toLowerCase().includes('im hafen') || lines[0].toLowerCase().includes('gesamt')) {
      return parseGesamtflotte(lines)[0];
    }

    // Inselweise Summierung
    const daten = parseInselflotte(lines);
    const summe = {};
    keys.forEach(k => (summe[k] = daten.reduce((a, r) => a + (r[k] || 0), 0)));
    return summe;
  }

  // ------------------------------------------------------------
  // Inselweise Tabelle parsen
  // ------------------------------------------------------------
  function parseInselflotte(lines) {
    const ergebnis = [];
    for (let line of lines) {
      const parts = line.split('\t').map(p => p.trim()).filter(p => p !== '');
      if (parts.length < 9) continue;
      const [insel, sw, lt, bs, kk, fr, hs, ko, ss] = parts;
      const values = [sw, lt, bs, kk, fr, hs, ko, ss].map(v => parseInt(v, 10) || 0);
      if (values.some(v => v > 0)) {
        ergebnis.push({
          Steinschleuderer: values[0],
          Lanzenträger: values[1],
          Langbogenschütze: values[2],
          Kanonen: values[3],
          Fregatte: values[4],
          Handelskogge: values[5],
          Kolonialschiff: values[6],
          Spähschiff: values[7]
        });
      }
    }
    return ergebnis;
  }

  // ------------------------------------------------------------
  // Gesamtflotte (Im Hafen / Unterwegs / Gesamt)
  // ------------------------------------------------------------
  function parseGesamtflotte(lines) {
    const row = {};
    const dataLines = lines.slice(1);
    dataLines.forEach(line => {
      const parts = line.split(/\t| {2,}/).map(p => p.trim()).filter(p => p !== '');
      if (parts.length < 2) return;
      const name = parts[0];
      const value = parseInt(parts[parts.length - 1], 10) || 0;
      if (keys.includes(name)) row[name] = value;
    });
    keys.forEach(k => { if (!row[k]) row[k] = 0; });
    return [row];
  }

  // ------------------------------------------------------------
  // Logbuchdarstellung
  // ------------------------------------------------------------
  function renderLogs(logs) {
    tableContainer.innerHTML = '';

    if (!logs || logs.length === 0) {
      tableContainer.innerHTML = '<p><em>Keine Flotteneinträge im Logbuch vorhanden.</em></p>';
      return;
    }

    const table = document.createElement('table');
    table.className = 'flotten-tabelle';
    table.innerHTML = `
      <thead>
        <tr>
          <th>Datum</th>
          <th>Benutzer</th>
          <th>Steinschleuderer</th>
          <th>Lanzenträger</th>
          <th>Langbogenschütze</th>
          <th>Kanonen</th>
          <th>Fregatte</th>
          <th>Handelskogge</th>
          <th>Kolonialschiff</th>
          <th>Spähschiff</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');
    logs.forEach(entry => {
      const row = entry.daten[0];
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row.Datum}</td>
        <td>${row.Benutzer}</td>
        <td>${row.Steinschleuderer}</td>
        <td>${row.Lanzenträger}</td>
        <td>${row.Langbogenschütze}</td>
        <td>${row.Kanonen}</td>
        <td>${row.Fregatte}</td>
        <td>${row.Handelskogge}</td>
        <td>${row.Kolonialschiff}</td>
        <td>${row.Spähschiff}</td>
      `;
      tbody.appendChild(tr);
    });

    tableContainer.appendChild(table);
  }

  Logbuch.log("Flottenmodul v1.9 aktiv – Datum in Spalte 1, Benutzer in Spalte 2.");
});