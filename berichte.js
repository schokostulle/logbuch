// =============================================================
// berichte.js – v3.1 (Build 04.11.2025)
// Zwei Einträge je Bericht (Angreifer + Verteidiger)
// + visuelle Trennung per Rolle (rot/blau)
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

    // 1️⃣ Eintrag für den Angreifer
    const attackerEntry = {
      user: username,
      role: "Angreifer",
      oz: parsed.attackerCoords?.oz ?? null,
      ig: parsed.attackerCoords?.ig ?? null,
      i: parsed.attackerCoords?.i ?? null,
      attacker_units: parsed.attackerUnits,
      defender_units: null,
      destroyed_buildings: "n.a.",
      research_changes: "n.a.",
      created_at: new Date().toISOString(),
    };

    // 2️⃣ Eintrag für den Verteidiger
    const defenderEntry = {
      user: username,
      role: "Verteidiger",
      oz: parsed.defenderCoords?.oz ?? null,
      ig: parsed.defenderCoords?.ig ?? null,
      i: parsed.defenderCoords?.i ?? null,
      attacker_units: null,
      defender_units: parsed.defenderUnits,
      destroyed_buildings: parsed.destroyedBuildings,
      research_changes: parsed.researchChanges,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("battle_reports").insert([attackerEntry, defenderEntry]);
    if (error) {
      console.error("SUPABASE INSERT ERROR:", error);
      alert("Fehler beim Speichern des Kampfberichts!");
      return;
    }

    alert("Kampfbericht gespeichert – Angreifer & Verteidiger ⚔️");
    textarea.value = "";
    await renderLogs();
  });

  // =============================================================
  // Tabellen-Rendering (mit Rollen-Spalte & Farben)
  // =============================================================
  async function renderLogs() {
    tbody.innerHTML = "<tr><td colspan='60'><em>Lade Berichte...</em></td></tr>";

    const { data, error } = await supabase
      .from("battle_reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("SUPABASE LOAD ERROR:", error);
      tbody.innerHTML = "<tr><td colspan='60'><em>Fehler beim Laden.</em></td></tr>";
      return;
    }

    if (!data || data.length === 0) {
      tbody.innerHTML = "<tr><td colspan='60'><em>Keine Berichte vorhanden.</em></td></tr>";
      return;
    }

    tbody.innerHTML = "";
    data.forEach((r) => {
      const units = r.attacker_units || r.defender_units || {};
      const b = typeof r.destroyed_buildings === "object" ? r.destroyed_buildings : {};
      const f = typeof r.research_changes === "object" ? r.research_changes : {};

      const tr = document.createElement("tr");
      tr.classList.add(r.role === "Angreifer" ? "attacker-row" : "defender-row");

      tr.innerHTML = `
        <td>${new Date(r.created_at).toLocaleString("de-DE")}</td>
        <td>${r.user || "?"}</td>
        <td>${r.role || ""}</td>
        <td>${r.oz ?? ""}</td>
        <td>${r.ig ?? ""}</td>
        <td>${r.i ?? ""}</td>

        <!-- Einheiten -->
        <td>${units.Steinschleuderer?.total ?? 0}</td>
        <td>${units.Lanzenträger?.total ?? 0}</td>
        <td>${units.Langbogenschütze?.total ?? 0}</td>
        <td>${units.Kanonen?.total ?? 0}</td>
        <td>${units.Fregatte?.total ?? 0}</td>
        <td>${units.Handelskogge?.total ?? 0}</td>
        <td>${units.Kolonialschiff?.total ?? 0}</td>
        <td>${units.Spähschiff?.total ?? 0}</td>

        <!-- Verluste -->
        <td>${units.Steinschleuderer?.losses ?? 0}</td>
        <td>${units.Lanzenträger?.losses ?? 0}</td>
        <td>${units.Langbogenschütze?.losses ?? 0}</td>
        <td>${units.Kanonen?.losses ?? 0}</td>
        <td>${units.Fregatte?.losses ?? 0}</td>
        <td>${units.Handelskogge?.losses ?? 0}</td>
        <td>${units.Kolonialschiff?.losses ?? 0}</td>
        <td>${units.Spähschiff?.losses ?? 0}</td>

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
        <td>${f.Lanze ?? "n.a."}</td>
        <td>${f.Schild ?? "n.a."}</td>
        <td>${f.Langbogen ?? "n.a."}</td>
        <td>${f.Kanone ?? "n.a."}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderBuilding(obj, name) {
    const v = obj[name] || {};
    return `<td>${v.vor ?? "n.a."}</td><td>${v.neu ?? "n.a."}</td>`;
  }
});

// =============================================================
// Parser v3.1 – erkennt Angreifer + Verteidiger separat
// =============================================================
function parseReport(text) {
  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const UNIT_KEYS = [
    Steinschleuderer: "ST",
    Lanzenträger: "LT",
    Langbogenschütze: "BS",
    Kanonen: "KK",
    Fregatte: "KS",
    Handelskogge: "HS",
    Kolonialschiff: "Ko",
    Spähschiff: "SS",
  ];
  const BUILDING_KEYS = [
    Hauptgebäude: "HH",
    Goldbergwerk: "G",
    Steinbruch: "S",
    Holzfällerhütte: "H",
    Universität: "U",
    Baracke: "B",
    Werft: "W",
    Lagerhaus: "L",
    Steinwall: "SW",
    Wachturm: "WT",
    Ruhestätte: "RS",
  ];
  const RESEARCH_KEYS = ["Lt", "Sd", "Lb", "Ka"];

  const coords = [...text.matchAll(/\((\d+):(\d+):(\d+)\)/g)].map((m) => ({
    oz: +m[1],
    ig: +m[2],
    i: +m[3],
  }));
  const attackerCoords = coords[0] || null;
  const defenderCoords = coords[1] || null;

  const attackerStart = lines.findIndex((l) => /Einheiten des Angreifers/i.test(l));
  const defenderStart = lines.findIndex((l) => /Einheiten des Verteidigers/i.test(l));

  const attackerUnits =
    attackerStart !== -1
      ? parseUnits(lines.slice(attackerStart + 1, defenderStart === -1 ? lines.length : defenderStart), UNIT_KEYS)
      : {};
  const defenderUnits =
    defenderStart !== -1 ? parseUnits(lines.slice(defenderStart + 1), UNIT_KEYS) : {};

  const destroyedBuildings = {};
  lines.forEach((l) => {
    const m = l.match(/(Zerstörung|Kollateralschaden)\s+(.+?)\s*\((\d+)\s*auf\s*(\d+)\)/i);
    if (m) {
      const b = m[2].trim();
      destroyedBuildings[b] = { vor: +m[3], neu: +m[4] };
    }
  });

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

  const researchChanges = {};
  const resStart = lines.findIndex((l) => /^Forschungen$/i.test(l));
  if (resStart !== -1) {
    for (let i = resStart + 1; i < lines.length; i++) {
      const m = lines[i].match(/^(Lanze|Schild|Langbogen|Kanone)\s*\(Stufe\s*(\d+)\)/i);
      if (m) researchChanges[m[1]] = +m[2];
    }
  }
  RESEARCH_KEYS.forEach((k) => (researchChanges[k] = researchChanges[k] ?? 0));

  return {
    attackerCoords,
    defenderCoords,
    attackerUnits,
    defenderUnits,
    destroyedBuildings,
    researchChanges,
  };
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