// =============================================================
// flotte.js – v2.4 (Supabase Integration + Rollenfilterung)
// Erkennung: Inselberichte & Gesamtberichte
// Member sehen nur ihre eigenen Einträge
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

  // =============================================================
  // Benutzer ermitteln + Rolle laden
  // =============================================================
  let currentUser = null;

  async function getCurrentUser() {
    const { data: sessionData, error: sessionError } = await supabase.auth.getUser();
    if (sessionError || !sessionData?.user) {
      console.error("❌ Keine aktive Supabase-Session.");
      window.location.href = "login.html";
      return null;
    }

    const userId = sessionData.user.id;
    const { data: userInfo, error: userError } = await supabase
      .from("users")
      .select("id, username, role")
      .eq("id", userId)
      .single();

    if (userError || !userInfo) {
      console.error("❌ Benutzerrolle konnte nicht geladen werden:", userError);
      return null;
    }

    currentUser = userInfo;
    return userInfo;
  }

  // =============================================================
  // Lade vorhandene Flotteneinträge (Rollenabhängig)
  // =============================================================
  async function loadFleetLogs() {
    if (!currentUser) await getCurrentUser();
    if (!currentUser) return [];

    let query = supabase
      .from("fleet_logs")
      .select("*")
      .order("date", { ascending: false });

    // 🔒 Nur Admin darf alles sehen
    if (currentUser.role.toLowerCase() !== "admin") {
      query = query.eq("user_id", currentUser.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ SUPABASE LOAD ERROR:", error);
      return [];
    }
    return data || [];
  }

  // =============================================================
  // Bericht speichern
  // =============================================================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = textarea.value.trim();
    if (!text) return;

    const totalFleet = parseFleetText(text);

    // Session prüfen
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      alert("Fehler: Keine aktive Sitzung gefunden.");
      console.error("❌ AUTH ERROR:", userError);
      return;
    }

    // Benutzername aus Topbar lesen
    const userElem = document.querySelector(".user-status");
    const username = userElem ? userElem.textContent.split("–")[0].trim() : "Unbekannt";

    const userId = userData.user.id;

    const { error } = await supabase.from("fleet_logs").insert([
      {
        user_id: userId,
        username: username,
        date: new Date().toISOString(),
        total_fleet: totalFleet,
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

  // =============================================================
  // Parser erkennt automatisch Gesamt- oder Inselbericht
  // =============================================================
  function parseFleetText(text) {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const result = {};
    unitNames.forEach((k) => (result[k] = 0));

    const isIslandReport = lines.some((l) => /\(\d+:\d+:\d+\)/.test(l));

    if (isIslandReport) {
      for (const line of lines) {
        if (/\(\d+:\d+:\d+\)/.test(line)) {
          const nums = line.split(/\s+/).filter((n) => /^\d+$/.test(n)).map(Number);
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
      for (const line of lines) {
        for (const unit of unitNames) {
          if (line.toLowerCase().startsWith(unit.toLowerCase())) {
            const nums = line.split(/\s+/).slice(1).map((n) => parseInt(n) || 0);
            const total = nums.length >= 3 ? nums[2] : nums[nums.length - 1];
            result[unit] = total || 0;
          }
        }
      }
    }
    return result;
  }

  // =============================================================
  // Tabellenanzeige mit User + Sticky Header
  // =============================================================
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

  // =============================================================
  // Initial laden
  // =============================================================
  await getCurrentUser();
  renderLogs(await loadFleetLogs());
});