// =============================================================
// berichte.js – Kampfberichte v2.0 (Supabase Integration)
// Build: 03.11.2025
// Beschreibung:
//  - Speichert Berichte direkt in "battle_reports"
//  - Erkennt Angreifer / Verteidiger / Koordinaten / Einheiten
//  - Extrahiert Gebäudeänderungen und Forschung
// =============================================================

import { Logbuch } from "./logbuch.js";

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("berichtForm");
  const textarea = document.getElementById("berichtText");
  const tbody = document.querySelector("#berichteTable tbody");

  // --- Vorhandene Einträge laden ---
  const logs = await Logbuch.load("battle_reports");
  renderLogs(logs);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = textarea.value.trim();
    if (!text) return;

    const userElem = document.querySelector(".user-status");
    const username = userElem ? userElem.textContent.split("–")[0].trim() : "Unbekannt";
    const datum = extractDate(text);

    const { attacker, defender } = parseReport(text);
    attacker.Benutzer = defender.Benutzer = username;

    // ✅ Supabase-kompatible Struktur
    const entry = {
      attacker: attacker.Benutzer,
      defender: defender.Benutzer,
      oz: defender.Oz || defender.oz || null,
      ig: defender.Ig || defender.ig || null,
      i: defender.In || defender.i || null,
      attacker_units: {
        Steinschleuderer: attacker.Steinschleuderer || 0,
        Lanzenträger: attacker.Lanzenträger || 0,
        Langbogenschütze: attacker.Langbogenschütze || 0,
        Kanonen: attacker.Kanonen || 0,
        Fregatte: attacker.Fregatte || 0,
        Handelskogge: attacker.Handelskogge || 0,
        Kolonialschiff: attacker.Kolonialschiff || 0,
        Spähschiff: attacker.Spähschiff || 0,
      },
      defender_units: {
        Steinschleuderer: defender.Steinschleuderer || 0,
        Lanzenträger: defender.Lanzenträger || 0,
        Langbogenschütze: defender.Langbogenschütze || 0,
        Kanonen: defender.Kanonen || 0,
        Fregatte: defender.Fregatte || 0,
        Handelskogge: defender.Handelskogge || 0,
        Kolonialschiff: defender.Kolonialschiff || 0,
        Spähschiff: defender.Spähschiff || 0,
      },
      destroyed_buildings: defender.destroyed_buildings || {},
      research_changes: defender.research_changes || {},
      created_at: new Date().toISOString(),
    };

    await Logbuch.save("battle_reports", [entry]);
    textarea.value = "";
    alert("Kampfbericht erfolgreich gespeichert ⚔️");

    const updated = await Logbuch.load("battle_reports");
    renderLogs(updated);
  });

  // =============================================================
  // Berichtstext parsen
  // =============================================================
  function parseReport(text) {
    const attacker = {};
    const defender = {
      destroyed_buildings: {},
      research_changes: {},
    };

    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    let current = null;

    for (const line of lines) {
      if (/^Angreifer/i.test(line)) {
        current = "attacker";
        continue;
      }
      if (/^Verteidiger/i.test(line)) {
        current = "defender";
        continue;
      }

      // Einheitenzeilen erkennen (z. B. "Steinschleuderer: 200")
      const unitMatch = line.match(/^([\wäöüÄÖÜß]+)\s*[:\-]?\s*(\d+)/);
      if (unitMatch) {
        const key = unitMatch[1];
        const val = parseInt(unitMatch[2]);
        if (current === "attacker") attacker[key] = val;
        if (current === "defender") defender[key] = val;
        continue;
      }

      // Koordinaten: "12:34:5" oder "Insel: 12:34:5"
      const coordMatch = line.match(/(\d{1,2}):(\d{1,2}):(\d{1,2})/);
      if (coordMatch) {
        defender.Oz = coordMatch[1];
        defender.Ig = coordMatch[2];
        defender.In = coordMatch[3];
        continue;
      }

      // Gebäudeänderungen: "Hafen vor: 5 neu: 3"
      const buildingMatch = line.match(/^([\wäöüÄÖÜß]+)\s+vor[:\-]?\s*(\d+)\s+neu[:\-]?\s*(\d+)/i);
      if (buildingMatch) {
        const name = buildingMatch[1];
        defender.destroyed_buildings[name] = {
          vor: parseInt(buildingMatch[2]),
          neu: parseInt(buildingMatch[3]),
        };
        continue;
      }

      // Forschung: "Lanze: 3", "Schild: 2" usw.
      const researchMatch = line.match(/(Lanze|Schild|Langbogen|Kanone)\s*[:\-]?\s*(\d+)/i);
      if (researchMatch) {
        const name = researchMatch[1];
        defender.research_changes[name] = parseInt(researchMatch[2]);
        continue;
      }
    }

    return { attacker, defender };
  }

  // =============================================================
  // Datum extrahieren
  // =============================================================
  function extractDate(text) {
    const m = text.match(/vom\s+(\d{1,2}\.\d{1,2}\.\d{4})\s+(\d{1,2}:\d{2})/);
    return m ? `${m[1]} ${m[2]}` : new Date().toLocaleString("de-DE");
  }

  // =============================================================
  // Tabellenanzeige
  // =============================================================
  function renderLogs(entries) {
    tbody.innerHTML = "";
    if (!entries || entries.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8"><em>Keine Berichte vorhanden.</em></td></tr>';
      return;
    }

    entries.forEach((r) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r.created_at ? new Date(r.created_at).toLocaleString("de-DE") : ""}</td>
        <td>${r.attacker || ""}</td>
        <td>${r.defender || ""}</td>
        <td>${r.oz || ""}:${r.ig || ""}:${r.i || ""}</td>
        <td><pre>${JSON.stringify(r.attacker_units, null, 2)}</pre></td>
        <td><pre>${JSON.stringify(r.defender_units, null, 2)}</pre></td>
        <td><pre>${JSON.stringify(r.destroyed_buildings, null, 2)}</pre></td>
        <td><pre>${JSON.stringify(r.research_changes, null, 2)}</pre></td>
      `;
      tbody.appendChild(tr);
    });
  }

  Logbuch.log("Kampfberichte v2.0 – Parser & Supabase aktiv ⚔️");
});