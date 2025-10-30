// =============================================================
// Kampfberichte.js – v1.3  (Build 03.11.2025)
// Anpassung: Speicherung direkt in Supabase-Tabelle "battle_reports"
// =============================================================

import { Logbuch } from "./logbuch.js";

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("berichtForm");
  const textarea = document.getElementById("berichtText");
  const tbody = document.querySelector("#berichteTable tbody");

  // Bestehende Einträge laden
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

    // ✅ Supabase-kompatible Struktur für battle_reports
    const entry = {
      attacker: attacker.Benutzer,
      defender: defender.Benutzer,
      oz: defender.Oz || null,
      ig: defender.Ig || null,
      i: defender.In || null,
      attacker_units: {
        Steinschleuderer: attacker.Steinschleuderer,
        Lanzenträger: attacker.Lanzenträger,
        Langbogenschütze: attacker.Langbogenschütze,
        Kanonen: attacker.Kanonen,
        Fregatte: attacker.Fregatte,
        Handelskogge: attacker.Handelskogge,
        Kolonialschiff: attacker.Kolonialschiff,
        Spähschiff: attacker.Spähschiff
      },
      defender_units: {
        Steinschleuderer: defender.Steinschleuderer,
        Lanzenträger: defender.Lanzenträger,
        Langbogenschütze: defender.Langbogenschütze,
        Kanonen: defender.Kanonen,
        Fregatte: defender.Fregatte,
        Handelskogge: defender.Handelskogge,
        Kolonialschiff: defender.Kolonialschiff,
        Spähschiff: defender.Spähschiff
      },
      destroyed_buildings: Object.fromEntries(
        Object.entries(defender).filter(([k]) => k.endsWith("vor") || k.endsWith("neu"))
      ),
      research_changes: {
        Lanze: defender.Lanze,
        Schild: defender.Schild,
        Langbogen: defender.Langbogen,
        Kanone: defender.Kanone
      },
      created_at: new Date().toISOString()
    };

    await Logbuch.save("battle_reports", entry);
    textarea.value = "";
    alert("Kampfbericht erfolgreich gespeichert ⚔️");

    const updated = await Logbuch.load("battle_reports");
    renderLogs(updated);
  });

  // --- Hilfsfunktionen (unverändert) ---
  function extractDate(text) {
    const m = text.match(/vom\s+(\d{1,2}\.\d{1,2}\.\d{4})\s+(\d{1,2}:\d{2})/);
    return m ? `${m[1]} ${m[2]}` : new Date().toLocaleString("de-DE");
  }

  // (parseReport, parseUnits, parseBuildings, parseResearch etc. bleiben unverändert)
  // ... nur renderLogs unten minimal angepasst, um battle_reports anzuzeigen:

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

  Logbuch.log("Kampfberichte v1.3 – Speicherung in battle_reports aktiv.");
});