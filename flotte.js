// =============================================================
// flotte.js – v2.0 (Build 03.11.2025)
// Supabase-Version (keine localStorage-Nutzung mehr)
// Speichert nur Gesamtflotten-Daten pro Benutzer + Zeitstempel
// =============================================================

import { Logbuch } from "./logbuch.js";

// -------------------------------------------------------------
// Zugriffskontrolle
// -------------------------------------------------------------
document.addEventListener("DOMContentLoaded", async () => {
  const user = await Logbuch.getCurrentUser();
  if (!user) {
    alert("Zugang verweigert – bitte neu anmelden.");
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

  // -----------------------------------------------------------
  // Bestehende Flotteneinträge aus Supabase laden
  // -----------------------------------------------------------
  const flotteLogs = await Logbuch.load("fleet_logs");
  renderLogs(flotteLogs);

  // -----------------------------------------------------------
  // Formular absenden → Textblock analysieren und speichern
  // -----------------------------------------------------------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = textarea.value.trim();
    if (!text) return;

    const gesamt = parseGesamtOderInselFlotte(text);
    const timestamp = new Date().toISOString();

    const newEntry = {
      created_at: timestamp,
      user_name: user.name || "Unbekannt",
      user_role: user.role || "Member",
      fleet_data: gesamt
    };

    await Logbuch.save("fleet_logs", newEntry);

    const updated = await Logbuch.load("fleet_logs");
    renderLogs(updated);
    textarea.value = "";
  });

  // -----------------------------------------------------------
  // Parser erkennt automatisch Gesamt- oder Inselweise
  // -----------------------------------------------------------
  function parseGesamtOderInselFlotte(text) {
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines[0].toLowerCase().includes("im hafen") || lines[0].toLowerCase().includes("gesamt")) {
      return parseGesamtflotte(lines)[0];
    }

    // Inselweise summieren
    const daten = parseInselflotte(lines);
    const summe = {};
    keys.forEach(k => (summe[k] = daten.reduce((a, r) => a + (r[k] || 0), 0)));
    return summe;
  }

  function parseInselflotte(lines) {
    const ergebnis = [];
    for (const line of lines) {
      const parts = line.split("\t").map(p => p.trim()).filter(Boolean);
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
      const parts = line.split(/\t| {2,}/).map(p => p.trim()).filter(Boolean);
      if (parts.length < 2) return;
      const name = parts[0];
      const value = parseInt(parts[parts.length - 1], 10) || 0;
      if (keys.includes(name)) row[name] = value;
    });
    keys.forEach(k => { if (!row[k]) row[k] = 0; });
    return [row];
  }

  // -----------------------------------------------------------
  // Tabellen-Darstellung
  // -----------------------------------------------------------
  function renderLogs(logs) {
    tableContainer.innerHTML = "";

    if (!logs || logs.length === 0) {
      tableContainer.innerHTML = "<p><em>Keine Flotteneinträge im Logbuch vorhanden.</em></p>";
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
      <tbody></tbody>
    `;

    const tbody = table.querySelector("tbody");
    logs.forEach(entry => {
      const d = new Date(entry.created_at).toLocaleString("de-DE");
      const row = entry.fleet_data || {};
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${d}</td>
        <td>${entry.user_name}</td>
        ${keys.map(k => `<td>${row[k] ?? 0}</td>`).join("")}
      `;
      tbody.appendChild(tr);
    });

    tableContainer.appendChild(table);
  }

  Logbuch.log("Flottenmodul v2.0 aktiv – Supabase-Kompatibilität vollständig.");
});