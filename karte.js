// =============================================================
// karte.js – v1.4 (funktionierende Rasterkarte)
// =============================================================
import { supabase } from "./logbuch.js";

document.addEventListener("DOMContentLoaded", async () => {
  const mapContainer = document.getElementById("mapContainer");
  const worldSizeInput = document.getElementById("worldSizeInput");
  const groupsInput = document.getElementById("groupsInput");
  const islandsInput = document.getElementById("islandsInput");
  const refreshButton = document.getElementById("refreshButton");

  const COLORS = {
    ocean: "#a6d9ff",   // hellblau
    island: "#4caf50",  // grün
    noAlliance: "#ff66ff" // magenta
  };

  refreshButton.addEventListener("click", async () => {
    const x = parseInt(worldSizeInput.value);
    const y = parseInt(groupsInput.value);
    const z = parseInt(islandsInput.value);
    await renderWorld(x, y, z);
  });

  await renderWorld(2, 15, 4);

  // ------------------------------------------------------------
  // Karte zeichnen
  // ------------------------------------------------------------
  async function renderWorld(x, y, z) {
    mapContainer.innerHTML = "<p><em>Lade Inseln...</em></p>";

    const { data, error } = await supabase
      .from("csv_base")
      .select("oz, ig, i, inselname, spielername, allianzname, akuerzel");

    if (error) {
      console.error("❌ SUPABASE LOAD ERROR:", error);
      mapContainer.innerHTML = "<p><em>Fehler beim Laden der CSV-Daten.</em></p>";
      return;
    }

    const worldCells = x * y * z;
    mapContainer.innerHTML = "";
    mapContainer.className = "map-grid";
    mapContainer.style.gridTemplateColumns = `repeat(${worldCells}, 6px)`;
    mapContainer.style.gridTemplateRows = `repeat(${worldCells}, 6px)`;
    mapContainer.style.gap = "1px";

    // Für schnellen Zugriff: Key = "oz-ig-i"
    const islandMap = new Map();
    data.forEach(r => {
      islandMap.set(`${r.oz}-${r.ig}-${r.i}`, r);
    });

    // Gesamtes Welt-Raster
    for (let ozY = 1; ozY <= x; ozY++) {
      for (let ozX = 1; ozX <= x; ozX++) {
        const ozNum = (ozY - 1) * x + ozX;

        for (let gY = 1; gY <= y; gY++) {
          for (let gX = 1; gX <= y; gX++) {
            const igNum = (gY - 1) * y + gX;

            for (let iY = 1; iY <= z; iY++) {
              for (let iX = 1; iX <= z; iX++) {
                const iNum = (iY - 1) * z + iX;
                const key = `${ozNum}-${igNum}-${iNum}`;
                const island = islandMap.get(key);

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
                  cell.title = `${island.inselname || "Unbenannt"}\n${island.spielername || "?"}\n${island.allianzname || "keine Allianz"}\n(${island.oz}:${island.ig}:${island.i})`;
                } else {
                  cell.style.backgroundColor = COLORS.ocean;
                }

                mapContainer.appendChild(cell);
              }
            }
          }
        }
      }
    }
  }

  // Generiert aus String eine gut unterscheidbare Farbe
  function colorFromString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 55%)`;
  }
});