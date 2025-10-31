// =============================================================
// flotte.js – v2.3 (Supabase Integration, kompakte Ansicht)
// Tabelle: fleet_logs (user_id, date, total_fleet, per_island)
// =============================================================
import { supabase } from "./logbuch.js";

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("flottenForm");
  const textarea = document.getElementById("flottenText");
  const tableContainer = document.querySelector("#flottenTable").parentElement;

  // ------------------------------------------------------------
  // Einheiten + Kürzel
  // ------------------------------------------------------------
  const unitNames = [
    "Steinschleuderer",
    "Lanzenträger",
    "Langbogenschütze",
    "Kanonen",
    "Fregatte",
    "Handelskogge",
    "Kolonialschiff",
    "Spähschiff",
  ];

  const shortLabels = {
    Steinschleuderer: "SW",
    Lanzenträger: "LT",
    Langbogenschütze: "BS",
    Kanonen: "KK",
    Fregatte: "KS",
    Handelskogge: "HS",
    Kolonialschiff: "Ko",
    Spähschiff: "SS",
  };

  // ------------------------------------------------------------
  // Daten aus Supabase laden
  // ------------------------------------------------------------
  async function loadFleetLogs() {
    const { data, error } = await supabase
      .from("fleet_logs")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      console.error("❌ SUPABASE LOAD ERROR:", error);
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

    // Aktiver Benutzer prüfen
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      alert("❌ Keine aktive Sitzung gefunden.");
      console.error("AUTH ERROR:", userError);
      return;
    }

    const userId = userData.user.id;

    const { error } = await supabase.from("fleet_logs").insert([
      {
        user_id: userId,
        date: new Date().toISOString(),
        total_fleet: totalFleet,
        per_island: null,
      },
    ]);

    if (error) {
      console.error("❌ SUPABASE INSERT ERROR:", error);
      alert("Fehler beim Speichern des Flotteneintrags!");
    } else {
      alert("✅ Flotteneintrag erfolgreich gespeichert!");
      textarea.value = "";
      renderLogs(await loadFleetLogs());
    }
  });

  // ------------------------------------------------------------
  // Parser: erkennt Gesamtflotte oder Inselweise
  // ------------------------------------------------------------
  function parseFleetText(text) {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const result = {};

    lines.forEach((line) => {
      unitNames.forEach((name) => {
        const regex = new RegExp(`^${name}\\s*(\\d+)`, "i");
        const m = line.match(regex);
        if (m) {
          result[name] = parseInt(m[1]) || 0;
        }
      });
    });

    // Fehlende Einheiten ergänzen
    unitNames.forEach((u) => (result[u] = result[u] || 0));
    return result;
  }

  // ------------------------------------------------------------
  // Tabellenansicht (kompakt, scrollbar, sticky Header)
  // ------------------------------------------------------------
  async function renderLogs(logs) {
    tableContainer.innerHTML = "";

    if (!logs || logs.length === 0) {
      tableContainer.innerHTML = "<p><em>Keine Flotteneinträge im Logbuch.</em></p>";
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "table-wrapper"; // scrollbarer Bereich

    const table = document.createElement("table");
    table.className = "flotten-tabelle";
    table.innerHTML = `
      <thead>
        <tr>
          <th>Datum</th>
          ${unitNames.map((u) => `<th title="${u}">${shortLabels[u]}</th>`).join("")}
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector("tbody");

    logs.forEach((entry) => {
      const fleet = entry.total_fleet || {};
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${new Date(entry.date).toLocaleString("de-DE")}</td>
        ${unitNames.map((u) => `<td>${fleet[u] ?? 0}</td>`).join("")}
      `;
      tbody.appendChild(tr);
    });

    wrapper.appendChild(table);
    tableContainer.appendChild(wrapper);
  }

  // ------------------------------------------------------------
  // Initiale Anzeige
  // ------------------------------------------------------------
  renderLogs(await loadFleetLogs());
});