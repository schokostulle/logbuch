// =============================================================
// Kampfberichte.js – v2.3  (Build 03.11.2025)
// Unterstützt beide Formate (Markdown + Tab-getrennt)
// =============================================================

import { supabase } from "./logbuch.js";

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("berichtForm");
  const textarea = document.getElementById("berichtText");
  const tbody = document.querySelector("#berichteTable tbody");

  await renderLogs();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = textarea.value.trim();
    if (!text) return;

    const userElem = document.querySelector(".user-status");
    const username = userElem ? userElem.textContent.split("–")[0].trim() : "Unbekannt";

    const parsed = parseReport(text);
    if (!parsed) {
      alert("Fehler beim Parsen des Berichts.");
      return;
    }

    const entry = {
      attacker: parsed.attackerName || `Angreifer (${username})`,
      defender: parsed.defenderName || "Verteidiger",
      oz: parsed.coords?.oz ?? null,
      ig: parsed.coords?.ig ?? null,
      i: parsed.coords?.i ?? null,
      attacker_units: parsed.attackerUnits,
      defender_units: parsed.defenderUnits,
      destroyed_buildings: parsed.destroyedBuildings,
      research_changes: parsed.researchChanges,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("battle_reports").insert([entry]);
    if (error) {
      console.error("SUPABASE INSERT ERROR:", error);
      alert("Fehler beim Speichern des Kampfberichts!");
      return;
    }

    alert("Kampfbericht erfolgreich gespeichert ⚔️");
    textarea.value = "";
    await renderLogs();
  });

  // ------------------------------------------------------------
  // Logs anzeigen
  // ------------------------------------------------------------
  async function renderLogs() {
    tbody.innerHTML = "<tr><td colspan='8'><em>Lade Berichte...</em></td></tr>";

    const { data, error } = await supabase
      .from("battle_reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("SUPABASE LOAD ERROR:", error);
      tbody.innerHTML = "<tr><td colspan='8'><em>Fehler beim Laden.</em></td></tr>";
      return;
    }

    if (!data || data.length === 0) {
      tbody.innerHTML = "<tr><td colspan='8'><em>Keine Berichte vorhanden.</em></td></tr>";
      return;
    }

    tbody.innerHTML = "";
    data.forEach((r) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${new Date(r.created_at).toLocaleString("de-DE")}</td>
        <td>${r.attacker}</td>
        <td>${r.defender}</td>
        <td>${r.oz}:${r.ig}:${r.i}</td>
        <td><pre>${JSON.stringify(r.attacker_units, null, 2)}</pre></td>
        <td><pre>${JSON.stringify(r.defender_units, null, 2)}</pre></td>
        <td><pre>${JSON.stringify(r.destroyed_buildings, null, 2)}</pre></td>
        <td><pre>${JSON.stringify(r.research_changes, null, 2)}</pre></td>
      `;
      tbody.appendChild(tr);
    });
  }
});

// =============================================================
// Parser (robust gegen Formatvarianten)
// =============================================================
function parseReport(text) {
  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const UNIT_KEYS = [
    "Steinschleuderer",
    "Lanzenträger",
    "Langbogenschütze",
    "Kanonen",
    "Fregatte",
    "Handelskogge",
    "Kolonialschiff",
    "Spähschiff",
  ];
  const BUILDING_KEYS = [
    "Hauptgebäude",
    "Goldbergwerk",
    "Steinbruch",
    "Holzfällerhütte",
    "Universität",
    "Baracke",
    "Werft",
    "Lagerhaus",
    "Steinwall",
    "Wachturm",
  ];
  const RESEARCH_KEYS = ["Lanze", "Schild", "Langbogen", "Kanone"];

  let attackerName = "";
  let defenderName = "";
  let coords = null;
  let attackerUnits = {};
  let defenderUnits = {};
  let destroyedBuildings = {};
  let researchChanges = {};

  // ---------------------------------------
  // Namen & Koordinaten
  // ---------------------------------------
  for (const line of lines) {
    if (/Angreifers/i.test(line)) {
      attackerName = extractName(line);
      coords = extractCoords(line);
    } else if (/Verteidigers/i.test(line)) {
      defenderName = extractName(line);
      coords = extractCoords(line) || coords;
    }
  }

  // ---------------------------------------
  // Einheiten parsen
  // ---------------------------------------
  const attackerStart = lines.findIndex((l) => /Einheiten des Angreifers/i.test(l));
  const defenderStart = lines.findIndex((l) => /Einheiten des Verteidigers/i.test(l));

  if (attackerStart !== -1) {
    attackerUnits = parseUnits(lines.slice(attackerStart + 1, defenderStart === -1 ? lines.length : defenderStart), UNIT_KEYS);
  }
  if (defenderStart !== -1) {
    defenderUnits = parseUnits(lines.slice(defenderStart + 1), UNIT_KEYS);
  }

  // ---------------------------------------
  // Zerstörung & Kollateralschaden
  // ---------------------------------------
  lines.forEach((l, i) => {
    const m = l.match(/(Zerstörung|Kollateralschaden)\s+(.+?)\s*\((\d+)\s*auf\s*(\d+)\)/i);
    if (m) {
      const geb = m[2].trim();
      destroyedBuildings[geb] = { vor: parseInt(m[3]), neu: parseInt(m[4]) };
    } else if (/^(Zerstörung|Kollateralschaden)$/i.test(l)) {
      const geb = lines[i + 1];
      const s = lines[i + 2]?.match(/\((\d+)\s*auf\s*(\d+)\)/);
      if (geb && s) destroyedBuildings[geb] = { vor: parseInt(s[1]), neu: parseInt(s[2]) };
    }
  });

  // ---------------------------------------
  // Gebäude aus Spähbericht
  // ---------------------------------------
  const spyStart = lines.findIndex((l) => /^Spähbericht$/i.test(l));
  if (spyStart !== -1) {
    for (let i = spyStart + 1; i < lines.length; i++) {
      const m = lines[i].match(/^([A-Za-zÄÖÜäöüß\s]+)\s*\(Stufe\s*(\d+)\)/i);
      if (m) {
        const b = m[1].trim();
        const lvl = parseInt(m[2]);
        if (!destroyedBuildings[b] && BUILDING_KEYS.includes(b))
          destroyedBuildings[b] = { vor: lvl, neu: lvl };
      }
    }
  }

  // ---------------------------------------
  // Forschungen (Lanze, Schild, Langbogen, Kanone)
  // ---------------------------------------
  const resStart = lines.findIndex((l) => /^Forschungen$/i.test(l));
  if (resStart !== -1) {
    for (let i = resStart + 1; i < lines.length; i++) {
      const m = lines[i].match(/^(Lanze|Schild|Langbogen|Kanone)\s*\(Stufe\s*(\d+)\)/i);
      if (m) researchChanges[m[1]] = parseInt(m[2]);
      if (/^Rohstoffe$/i.test(lines[i])) break;
    }
  }
  // Fehlende Forschungen auf 0 setzen
  RESEARCH_KEYS.forEach((k) => {
    if (!researchChanges[k]) researchChanges[k] = 0;
  });

  return { attackerName, defenderName, coords, attackerUnits, defenderUnits, destroyedBuildings, researchChanges };
}

// =============================================================
// Hilfsfunktionen
// =============================================================
function extractName(line) {
  const m = line.match(/([A-Z0-9-]+)\s*\((\d+:\d+:\d+)\)/);
  return m ? m[1] : "";
}

function extractCoords(line) {
  const m = line.match(/\((\d+):(\d+):(\d+)\)/);
  return m ? { oz: parseInt(m[1]), ig: parseInt(m[2]), i: parseInt(m[3]) } : null;
}

function parseUnits(lines, UNIT_KEYS) {
  const result = {};
  for (const l of lines) {
    const parts = l.split(/\s+/).filter(Boolean);
    const name = parts[0];
    if (UNIT_KEYS.includes(name) && parts.length >= 3) {
      const total = parseInt(parts[1]) || 0;
      const losses = parseInt(parts[2]) || 0;
      result[name] = { total, losses };
    }
  }
  UNIT_KEYS.forEach((u) => {
    if (!result[u]) result[u] = { total: 0, losses: 0 };
  });
  return result;
}