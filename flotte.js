// =============================================================
// flotte.js – v2.0 (Supabase)
// Nur Gesamtwerte – speichert & lädt direkt aus Supabase
// =============================================================

import { Logbuch } from "./logbuch.js";

// Zugriff prüfen
document.addEventListener("DOMContentLoaded", async () => {
  const { data: currentUser } = await Logbuch.getCurrentUser();
  if (!currentUser || currentUser.status !== "aktiv") {
    window.location.href = "gate.html";
    return;
  }

  const form = document.getElementById("flottenForm");
  const textarea = document.getElementById("flottenText");
  const tableContainer = document.querySelector("#flottenTable").parentElement;

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

  // ------------------------------------------------------------
  // Log-Einträge laden
  // ------------------------------------------------------------
  const { data: flotteLogs, error: loadError } = await Logbuch.load("flotten_logs");
  if (loadError) console.error("Fehler beim Laden:", loadError);
  renderLogs(flotteLogs || []);

  // ------------------------------------------------------------
  // Formular absenden → Analyse durchführen & speichern
  // ------------------------------------------------------------
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const text = textarea.value.trim();
    if (!text) return;

    const gesamt = parseGesamtOderInselFlotte(text);

    const timestamp = new Date().toLocaleString("de-DE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });

    // Benutzername aus Supabase Session
    const username = currentUser.username || "Unbekannt";

    // Datensatz aufbauen
    const entry = {
      datum: timestamp,
      benutzer: username,
      ...gesamt
    };

    const { error } = await Logbuch.save("flotten_logs", entry);
    if (error) {
      console.error("Fehler beim Speichern:", error);
      alert("Fehler beim Speichern des Eintrags.");
      return;
    }

    textarea.value = "";
    alert("Flotteneintrag erfolgreich gespeichert!");

    // Tabelle neu laden
    const { data: updatedLogs } = await Logbuch.load("flotten_logs");
    renderLogs(updatedLogs || []);
  });

  // ------------------------------------------------------------
  // Parser erkennt automatisch: Gesamt oder Inselweise
  // ------------------------------------------------------------
  function parseGesamtOderInselFlotte(text) {
    const lines = text.split("\n").map(l => l.trim()).filter(l => l !== "");
    if (lines[0].toLowerCase().includes("im hafen") || lines[0].toLowerCase().includes("gesamt")) {
      return parseGesamtflotte(lines)[0];
    }
    // Inselweise Summierung
    const daten = parseInselflotte(lines);
    const summe = {};
    keys.forEach(k => (summe[k] = daten.reduce((a, r) => a + (r[k] || 0), 0)));
    return summe;
  }

  function parseInselflotte(lines) {
    const ergebnis = [];
    for (let line of lines) {
      const parts = line.split("\t").map(p => p.trim()).filter(p => p !== "");
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

  function parseGesamtflotte(lines) {
    const row = {};
    const dataLines = lines.slice(1);
    dataLines.forEach(line => {
      const parts = line.split(/\t| {2,}/).map(p => p.trim()).filter(p => p !== "");
      if (parts.length < 2) return;
      const name = parts[0];
      const value = parseInt(parts[parts.length - 1], 10) || 0;
      if (keys.includes(name)) row[name] = value;
    });
    keys.forEach(k => { if (!row[k]) row[k] = 0; });
    return [row];
  }

  // ------------------------------------------------------------
  // Darstellung
  // ------------------------------------------------------------
  function renderLogs(logs) {
    tableContainer.innerHTML = "";
    if (!logs || logs.length === 0) {
      tableContainer.innerHTML = "<p><em>Keine Flotteneinträge vorhanden.</em></p>";
      return;
    }

    const table = document.createElement("table");
    table.className = "flotten-tabelle";
    table.innerHTML = `
      <thead>
        <tr>
          <th>Datum</th>
          <th>Benutzer</th>
          ${keys.map(k => `<th>${k}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${logs.map(r => `
          <tr>
            <td>${r.datum}</td>
            <td>${r.benutzer}</td>
            ${keys.map(k => `<td>${r[k] ?? 0}</td>`).join("")}
          </tr>
        `).join("")}
      </tbody>
    `;
    tableContainer.appendChild(table);
  }

  Logbuch.log("Flottenmodul v2.0 (Supabase) aktiv.");
});