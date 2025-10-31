// =============================================================
// karte.js – v1.0 (Build 04.11.2025)
// Weltkarte mit Inseln aus csv_base
// Darstellung per Raster (Insel = grün / Ozean = blau)
// Allianzfarben, Neutralität & Diplomatie folgen später
// =============================================================

import { supabase } from "./logbuch.js";

document.addEventListener("DOMContentLoaded", async () => {
  const mapContainer = document.getElementById("mapContainer");

  // Parameter: Größe der Karte
  const MAP_WIDTH = 50;   // Spalten
  const MAP_HEIGHT = 50;  // Zeilen

  // Farben
  const COLORS = {
    ocean: "#1a3b5d",
    island: "#3b6040",
    noAlliance: "#cc55cc",
    friendly: "#55cc55",
    hostile: "#ff3333",
    neutral: "#bbbbbb",
  };

  // --- Inseln laden --------------------------------------------------
  const { data, error } = await supabase
    .from("csv_base")
    .select("oz, ig, i, spielername, akuerzel, allianzname");

  if (error) {
    console.error("❌ SUPABASE LOAD ERROR:", error);
    mapContainer.innerHTML = "<p><em>Fehler beim Laden der Inseln.</em></p>";
    return;
  }

  // --- Karte vorbereiten --------------------------------------------
  mapContainer.innerHTML = "";
  mapContainer.style.display = "grid";
  mapContainer.style.gridTemplateColumns = `repeat(${MAP_WIDTH}, 12px)`;
  mapContainer.style.gridTemplateRows = `repeat(${MAP_HEIGHT}, 12px)`;
  mapContainer.style.gap = "1px";

  // Inselpositionen merken
  const islands = new Map();

  data.forEach((row) => {
    const key = `${row.oz}:${row.ig}`;
    islands.set(key, row);
  });

  // --- Karte zeichnen ------------------------------------------------
  for (let y = 1; y <= MAP_HEIGHT; y++) {
    for (let x = 1; x <= MAP_WIDTH; x++) {
      const key = `${x}:${y}`;
      const cell = document.createElement("div");
      cell.classList.add("map-cell");

      const island = islands.get(key);

      if (island) {
        // Insel vorhanden
        let color = COLORS.island;

        if (!island.allianzname || island.allianzname.trim() === "") {
          color = COLORS.noAlliance; // Magenta
        } else {
          // Temporär zufällige, stabile Allianzfarbe generieren
          color = colorFromString(island.akuerzel || island.allianzname);
        }

        cell.style.backgroundColor = color;
        cell.title = `${island.inselname || "Unbekannt"}\n${island.spielername || "?"}\n${island.allianzname || "keine Allianz"}`;
      } else {
        // Ozean
        cell.style.backgroundColor = COLORS.ocean;
      }

      mapContainer.appendChild(cell);
    }
  }

  console.log("🌍 Karte generiert mit", data.length, "Inseln.");
});

// -------------------------------------------------------------
// Utility: Erzeugt eine stabile Farbe aus String
// -------------------------------------------------------------
function colorFromString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 45%)`;
}