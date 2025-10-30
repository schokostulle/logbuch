// =============================================================
// berichte.js – v2.5 (Build 03.11.2025)
// Ausgabe exakt passend zur HTML-Tabelle
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
      user: username,
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

  // =============================================================
  // Tabellen-Rendering (passend zu Kopfstruktur)
  // =============================================================
  async function renderLogs() {
    tbody.innerHTML = "<tr><td colspan='50'><em>Lade Berichte...</em></td></tr>";

    const { data, error } = await supabase
      .from("battle_reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("SUPABASE LOAD ERROR:", error);
      tbody.innerHTML = "<tr><td colspan='50'><em>Fehler beim Laden.</em></td></tr>";
      return;
    }

    if (!data || data.length === 0) {
      tbody.innerHTML = "<tr><td colspan='50'><em>Keine Berichte vorhanden.</em></td></tr>";
      return;
    }

    tbody.innerHTML = "";
    data.forEach((r) => {
      const u = r.attacker_units || {};
      const v = r.defender_units || {};
      const b = r.destroyed_buildings || {};
      const f = r.research_changes || {};

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${new Date(r.created_at).toLocaleString("de-DE")}</td>
        <td>${r.user || "?"}</td>
        <td>${r.oz ?? ""}</td>
        <td>${r.ig ?? ""}</td>
        <td>${r.i ?? ""}</td>

        <!-- Einheiten -->
        <td>${u.Steinschleuderer?.total ?? 0}</td>
        <td>${u.Lanzenträger?.total ?? 0}</td>
        <td>${u.Langbogenschütze?.total ?? 0}</td>
        <td>${u.Kanonen?.total ?? 0}</td>
        <td>${u.Fregatte?.total ?? 0}</td>
        <td>${u.Handelskogge?.total ?? 0}</td>
        <td>${u.Kolonialschiff?.total ?? 0}</td>
        <td>${u.Spähschiff?.total ?? 0}</td>

        <!-- Verluste -->
        <td>${u.Steinschleuderer?.losses ?? 0}</td>
        <td>${u.Lanzenträger?.losses ?? 0}</td>
        <td>${u.Langbogenschütze?.losses ?? 0}</td>
        <td>${u.Kanonen?.losses ?? 0}</td>
        <td>${u.Fregatte?.losses ?? 0}</td>
        <td>${u.Handelskogge?.losses ?? 0}</td>
        <td>${u.Kolonialschiff?.losses ?? 0}</td>
        <td>${u.Spähschiff?.losses ?? 0}</td>

        <!-- Gebäude -->
        ${renderBuilding(b, "Hauptgebäude")}
        ${renderBuilding(b, "Goldbergwerk")}
        ${renderBuilding(b, "Steinbruch")}
        ${renderBuilding(b, "Holzfällerhütte")}
        ${renderBuilding(b, "Universität")}
        ${renderBuilding(b, "Baracke")}
        ${renderBuilding(b, "Werft")}
        ${renderBuilding(b, "Lagerhaus")}
        ${renderBuilding(b, "Steinwall")}
        ${renderBuilding(b, "Wachturm")}
        ${renderBuilding(b, "Ruhestätte")}

        <!-- Forschungen -->
        <td>${f.Lanze ?? 0}</td>
        <td>${f.Schild ?? 0}</td>
        <td>${f.Langbogen ?? 0}</td>
        <td>${f.Kanone ?? 0}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderBuilding(obj, name) {
    const v = obj[name] || {};
    return `<td>${v.vor ?? ""}</td><td>${v.neu ?? ""}</td>`;
  }
});

// =============================================================
// Parser v2.5 – erkennt Einheiten, Gebäude, Forschungen etc.
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
    "Ruhestätte",
  ];
  const RESEARCH_KEYS = ["Lanze", "Schild", "Langbogen", "Kanone"];

  let coords = null;
  let attackerUnits = {};
  let defenderUnits = {};
  let destroyedBuildings = {};
  let researchChanges = {};

  // --- Koordinaten ---
  const coordMatch = text.match(/\((\d+):(\d+):(\d+)\)/);
  if (coordMatch) coords = { oz: +coordMatch[1], ig: +coordMatch[2], i: +coordMatch[3] };

  // --- Einheiten ---
  const attackerStart = lines.findIndex((l) => /Einheiten des Angreifers/i.test(l));
  const defenderStart = lines.findIndex((l) => /Einheiten des Verteidigers/i.test(l));
  if (attackerStart !== -1)
    attackerUnits = parseUnits(lines.slice(attackerStart + 1, defenderStart === -1 ? lines.length : defenderStart), UNIT_KEYS);
  if (defenderStart !== -1)
    defenderUnits = parseUnits(lines.slice(defenderStart + 1), UNIT_KEYS);

  // --- Zerstörung / Kollateralschaden ---
  lines.forEach((l, i) => {
    const m = l.match(/(Zerstörung|Kollateralschaden)\s+(.+?)\s*\((\d+)\s*auf\s*(\d+)\)/i);
    if (m) {
      const geb = m[2].trim();
      destroyedBuildings[geb] = { vor: +m[3], neu: +m[4] };
    }
  });

  // --- Spähbericht: Gebäude-Level ---
  const spyStart = lines.findIndex((l) => /^Spähbericht$/i.test(l));
  if (spyStart !== -1) {
    for (let i = spyStart + 1; i < lines.length; i++) {
      const m = lines[i].match(/^([A-Za-zÄÖÜäöüß\s]+)\s*\(Stufe\s*(\d+)\)/i);
      if (m) {
        const b = m[1].trim();
        const lvl = +m[2];
        if (!destroyedBuildings[b] && BUILDING_KEYS.includes(b))
          destroyedBuildings[b] = { vor: lvl, neu: lvl };
      }
    }
  }

  // --- Forschungen ---
  const resStart = lines.findIndex((l) => /^Forschungen$/i.test(l));
  if (resStart !== -1) {
    for (let i = resStart + 1; i < lines.length; i++) {
      const m = lines[i].match(/^(Lanze|Schild|Langbogen|Kanone)\s*\(Stufe\s*(\d+)\)/i);
      if (m) researchChanges[m[1]] = +m[2];
    }
  }
  RESEARCH_KEYS.forEach((k) => (researchChanges[k] = researchChanges[k] ?? 0));

  return { coords, attackerUnits, defenderUnits, destroyedBuildings, researchChanges };
}

function parseUnits(lines, keys) {
  const result = {};
  for (const l of lines) {
    const p = l.split(/\s+/).filter(Boolean);
    const name = p[0];
    if (keys.includes(name) && p.length >= 3) {
      result[name] = { total: +p[1] || 0, losses: +p[2] || 0 };
    }
  }
  keys.forEach((k) => (result[k] = result[k] || { total: 0, losses: 0 }));
  return result;
}