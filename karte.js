// =============================================================
// karte.js – v1.1 (Build 05.11.2025)
// Hierarchische Kartenlogik: Oz → IG → I
// Darstellung mit hellblauem Meer + Inseln nach Allianzfarbe
// =============================================================

import { supabase } from "./logbuch.js";

document.addEventListener("DOMContentLoaded", async () => {
  const mapContainer = document.getElementById("mapContainer");
  const ozInput = document.getElementById("ozInput");
  const igInput = document.getElementById("igInput");
  const zoomInput = document.getElementById("zoomInput");
  const refreshButton = document.getElementById("refreshButton");

  const COLORS = {
    ocean: "#74b9ff", // helles blau
    island: "#4caf50",
    noAlliance: "#cc55cc",
  };

  refreshButton.addEventListener("click", async () => {
    const oz = parseInt(ozInput.value);
    const ig = parseInt(igInput.value);
    const zoom = parseInt(zoomInput.value);
    await renderMap(oz, ig, zoom);
  });

  await renderMap(1, 1, 10); // Standard: Welt 1, Gruppe 1

  // ------------------------------------------------------------
  // Karte rendern
  // ------------------------------------------------------------
  async function renderMap(oz, ig, zoom) {
    mapContainer.innerHTML = "<p><em>Lade Karte...</em></p>";

    const { data, error } = await supabase
      .from("csv_base")
      .select("oz, ig, i, inselname, spielername, akuerzel, allianzname");

    if (error) {
      console.error("❌ SUPABASE LOAD ERROR:", error);
      mapContainer.innerHTML = "<p><em>Fehler beim Laden der Inseln.</em></p>";
      return;
    }

    mapContainer.innerHTML = "";
    const cellSize = Math.max(8, 600 / zoom); // dynamisch
    mapContainer.style.display = "grid";
    mapContainer.style.gridTemplateColumns = `repeat(${zoom}, ${cellSize}px)`;
    mapContainer.style.gridTemplateRows = `repeat(${zoom}, ${cellSize}px)`;
    mapContainer.style.gap = "1px";

    const filtered = data.filter((r) => r.oz === oz && r.ig === ig);
    const islands = new Map(filtered.map((r) => [r.i, r]));

    // Karte (Quadrat von Inseln) zeichnen
    for (let y = 1; y <= zoom; y++) {
      for (let x = 1; x <= zoom; x++) {
        const idx = (y - 1) * zoom + x;
        const island = islands.get(idx);
        const cell = document.createElement("div");
        cell.classList.add("map-cell");

        if (island) {
          let color = COLORS.island;
          if (!island.allianzname) {
            color = COLORS.noAlliance;
          } else {
            color = colorFromString(island.akuerzel || island.allianzname);
          }

          cell.style.backgroundColor = color;
          cell.title = `${island.inselname || "?"}\n${island.spielername || "?"}\n${island.allianzname || "keine Allianz"}`;
        } else {
          cell.style.backgroundColor = COLORS.ocean;
        }

        mapContainer.appendChild(cell);
      }
    }
  }

  // ------------------------------------------------------------
  // Stabile Allianzfarbe (aus Namen generiert)
  // ------------------------------------------------------------
  function colorFromString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 55%)`;
  }
});