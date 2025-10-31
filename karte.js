// =============================================================
// karte.js – v1.2 (Build 06.11.2025)
// Weltansicht: mehrere Ozeane mit Untergruppen und Inselraster
// =============================================================

import { supabase } from "./logbuch.js";

document.addEventListener("DOMContentLoaded", async () => {
  const mapContainer = document.getElementById("mapContainer");
  const worldSizeInput = document.getElementById("worldSizeInput");
  const groupsInput = document.getElementById("groupsInput");
  const islandsInput = document.getElementById("islandsInput");
  const refreshButton = document.getElementById("refreshButton");

  const COLORS = {
    ocean: "#74b9ff",
    island: "#4caf50",
    noAlliance: "#cc55cc",
  };

  refreshButton.addEventListener("click", async () => {
    const worldSize = parseInt(worldSizeInput.value);
    const groups = parseInt(groupsInput.value);
    const islands = parseInt(islandsInput.value);
    await renderWorld(worldSize, groups, islands);
  });

  await renderWorld(2, 4, 10);

  // ------------------------------------------------------------
  // Weltkarte rendern
  // ------------------------------------------------------------
  async function renderWorld(worldSize, groups, islands) {
    mapContainer.innerHTML = "<p><em>Lade Weltkarte...</em></p>";

    const { data, error } = await supabase
      .from("csv_base")
      .select("oz, ig, i, inselname, spielername, akuerzel, allianzname");

    if (error) {
      console.error("❌ SUPABASE LOAD ERROR:", error);
      mapContainer.innerHTML = "<p><em>Fehler beim Laden der Inseln.</em></p>";
      return;
    }

    mapContainer.innerHTML = "";
    mapContainer.classList.add("world-grid");
    mapContainer.style.gridTemplateColumns = `repeat(${worldSize}, auto)`;
    mapContainer.style.gridTemplateRows = `repeat(${worldSize}, auto)`;
    mapContainer.style.gap = "8px";

    for (let ozY = 1; ozY <= worldSize; ozY++) {
      for (let ozX = 1; ozX <= worldSize; ozX++) {
        const ozNum = (ozY - 1) * worldSize + ozX;
        const oceanDiv = document.createElement("div");
        oceanDiv.classList.add("ocean-block");
        oceanDiv.innerHTML = `<div class="ocean-label">Ozean ${ozNum}</div>`;

        const groupGrid = document.createElement("div");
        groupGrid.classList.add("group-grid");
        groupGrid.style.gridTemplateColumns = `repeat(${groups}, auto)`;
        groupGrid.style.gridTemplateRows = `repeat(${groups}, auto)`;

        const oceanIslands = data.filter((r) => r.oz === ozNum);

        // Gruppen rendern
        for (let gY = 1; gY <= groups; gY++) {
          for (let gX = 1; gX <= groups; gX++) {
            const igNum = (gY - 1) * groups + gX;
            const groupDiv = document.createElement("div");
            groupDiv.classList.add("group-block");

            const islandGrid = document.createElement("div");
            islandGrid.classList.add("island-grid");
            islandGrid.style.gridTemplateColumns = `repeat(${islands}, 6px)`;
            islandGrid.style.gridTemplateRows = `repeat(${islands}, 6px)`;

            const groupIslands = oceanIslands.filter((r) => r.ig === igNum);
            const islandMap = new Map(groupIslands.map((r) => [r.i, r]));

            for (let y = 1; y <= islands; y++) {
              for (let x = 1; x <= islands; x++) {
                const iNum = (y - 1) * islands + x;
                const island = islandMap.get(iNum);
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
                  cell.title = `${island.inselname}\n${island.spielername}\n${island.allianzname || "keine Allianz"}`;
                } else {
                  cell.style.backgroundColor = COLORS.ocean;
                }

                islandGrid.appendChild(cell);
              }
            }

            groupDiv.appendChild(islandGrid);
            groupGrid.appendChild(groupDiv);
          }
        }

        oceanDiv.appendChild(groupGrid);
        mapContainer.appendChild(oceanDiv);
      }
    }
  }

  // ------------------------------------------------------------
  // Zufällige, aber stabile Allianzfarben
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