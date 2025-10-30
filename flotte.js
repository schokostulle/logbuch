// =============================================================
// Flotte.js – v2.0 (Supabase Integration)
// Nutzt Tabelle: fleet_logs (user_id, date, total_fleet, per_island)
// =============================================================
import { supabase } from "./logbuch.js";

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("flottenForm");
  const textarea = document.getElementById("flottenText");
  const tableContainer = document.querySelector("#flottenTable").parentElement;

  const keys = [
    "Steinschleuderer", "Lanzenträger", "Langbogenschütze", "Kanonen",
    "Fregatte", "Handelskogge", "Kolonialschiff", "Spähschiff"
  ];

  // ------------------------------------------------------------
  // Daten aus Supabase laden
  // ------------------------------------------------------------
  async function loadFleetLogs() {
    const { data, error } = await supabase
      .from("fleet_logs")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      console.error("SUPABASE LOAD ERROR:", error);
      return [];
    }
    return data || [];
  }

  // ------------------------------------------------------------
  // Neuer Eintrag speichern
  // ------------------------------------------------------------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = textarea.value.trim();
    if (!text) return;

    const totalFleet = parseFleetText(text);
    const user = await supabase.auth.getUser();
    const userId = user?.data?.user?.id || null;

    const { error } = await supabase.from("fleet_logs").insert([
      {
        user_id: userId,
        date: new Date().toISOString(),
        total_fleet: totalFleet,
        per_island: null
      }
    ]);

    if (error) {
      console.error("SUPABASE INSERT ERROR:", error);
      alert("Fehler beim Speichern des Flotteneintrags!");
    } else {
      alert("Flotteneintrag erfolgreich gespeichert!");
      renderLogs(await loadFleetLogs());
      textarea.value = "";
    }
  });

  // ------------------------------------------------------------
  // Parser erkennt Gesamtflotte oder Inselweise
  // ------------------------------------------------------------
  function parseFleetText(text) {
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    const result = {};
    lines.forEach(line => {
      const [unit, value] = line.split(/\s+/);
      if (keys.includes(unit)) {
        result[unit] = parseInt(value) || 0;
      }
    });
    keys.forEach(k => result[k] = result[k] || 0);
    return result;
  }

  // ------------------------------------------------------------
  // Tabellenansicht
  // ------------------------------------------------------------
  async function renderLogs(logs) {
    tableContainer.innerHTML = "";

    if (!logs || logs.length === 0) {
      tableContainer.innerHTML = "<p><em>Keine Flotteneinträge im Logbuch.</em></p>";
      return;
    }

    const table = document.createElement("table");
    table.className = "flotten-tabelle";
    table.innerHTML = `
      <thead>
        <tr>
          <th>Datum</th>
          ${keys.map(k => `<th>${k}</th>`).join("")}
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector("tbody");
    logs.forEach(entry => {
      const fleet = entry.total_fleet || {};
      const row = `
        <tr>
          <td>${new Date(entry.date).toLocaleString("de-DE")}</td>
          ${keys.map(k => `<td>${fleet[k] ?? 0}</td>`).join("")}
        </tr>
      `;
      tbody.insertAdjacentHTML("beforeend", row);
    });

    tableContainer.appendChild(table);
  }

  renderLogs(await loadFleetLogs());
});