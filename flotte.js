// =============================================================
// flotte.js – v2.3 (Supabase Integration + Parser-Erkennung)
// Erkennung: Inselberichte & Gesamtberichte
// Tabelle: fleet_logs (user_id, user, date, total_fleet)
// =============================================================
import { supabase } from "./logbuch.js";

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("flottenForm");
  const textarea = document.getElementById("flottenText");
  const tableContainer = document.querySelector("#flottenTable").parentElement;

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
    Fregatte: "KS", // Fr in Berichten entspricht KS
    Handelskogge: "HS",
    Kolonialschiff: "Ko",
    Spähschiff: "SS",
  };

  // ------------------------------------------------------------
  // Lade vorhandene Flotteneinträge
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
  // Bericht speichern
  // ------------------------------------------------------------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = textarea.value.trim();
    if (!text) return;

    // Benutzername ermitteln
    const userElem = document.querySelector(".user-status");
    const username = userElem ? userElem.textContent.split("–")[0].trim() : "Unbekannt";

    const totalFleet = parseFleetText(text);

    // Aktive Supabase-Session
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      alert("Fehler: Keine aktive Sitzung gefunden.");
      console.error("❌ AUTH ERROR:", userError);
      return;
    }

    const userId = userData.user.id;

    const { error } = await supabase.from("fleet_logs").insert([
      {
        user_id: userId,
        user: username,
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
  // Parser erkennt automatisch Gesamt- oder Inselbericht
  // ------------------------------------------------------------
  function parseFleetText(text) {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const result = {};
    unitNames.forEach((k) => (result[k] = 0)); // Initialisieren mit 0

    // 🔍 Prüfen, ob es sich um einen Inselbericht handelt
    const isIslandReport = lines.some((l) => /\(\d+:\d+:\d+\)/.test(l));

    if (isIslandReport) {
      // Beispiel:
      // A-046-04 (4:46:4)	1136	1342	0	1	374	10	2	5
      for (const line of lines) {
        if (/\(\d+:\d+:\d+\)/.test(line)) {
          const parts = line.split(/\s+/).filter(Boolean);
          const nums = parts.filter((p) => /^\d+$/.test(p)).map(Number);
          if (nums.length >= 8) {
            result["Steinschleuderer"] += nums[0];
            result["Lanzenträger"] += nums[1];
            result["Langbogenschütze"] += nums[2];
            result["Kanonen"] += nums[3];
            result["Fregatte"] += nums[4];
            result["Handelskogge"] += nums[5];
            result["Kolonialschiff"] += nums[6];
            result["Spähschiff"] += nums[7];
          }
        }
      }
    } else {
      // 🔹 Gesamtübersicht
      // Hafen Unterwegs Gesamt
      // Steinschleuderer 19257 1 19258
      for (const line of lines) {
        for (const unit of unitNames) {
          if (line.toLowerCase().startsWith(unit.toLowerCase())) {
            const nums = line.split(/\s+/).slice(1).map((n) => parseInt(n) || 0);
            // letzte Spalte = Gesamt (wenn vorhanden)
            const total = nums.length >= 3 ? nums[2] : nums[nums.length - 1];
            result[unit] = total || 0;
          }
        }
      }
    }

    return result;
  }

  // ------------------------------------------------------------
  // Tabellenanzeige mit User + Sticky Header
  // ------------------------------------------------------------
  async function renderLogs(logs) {
    tableContainer.innerHTML = "";

    if (!logs || logs.length === 0) {
      tableContainer.innerHTML = "<p><em>Keine Flotteneinträge im Logbuch.</em></p>";
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "table-wrapper";

    const table = document.createElement("table");
    table.className = "flotten-tabelle";
    table.innerHTML = `
      <thead>
        <tr>
          <th>Datum</th>
          <th>Benutzer</th>
          ${unitNames.map((u) => `<th title="${u}">${shortLabels[u]}</th>`).join("")}
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector("tbody");
    logs.forEach((entry) => {
      const fleet = entry.total_fleet || {};
      const row = `
        <tr>
          <td>${new Date(entry.date).toLocaleString("de-DE")}</td>
          <td>${entry.user || "?"}</td>
          ${unitNames.map((k) => `<td>${fleet[k] ?? 0}</td>`).join("")}
        </tr>
      `;
      tbody.insertAdjacentHTML("beforeend", row);
    });

    wrapper.appendChild(table);
    tableContainer.appendChild(wrapper);
  }

  // ------------------------------------------------------------
  // Initial laden
  // ------------------------------------------------------------
  renderLogs(await loadFleetLogs());
});