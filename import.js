// ===========================================================
// import.js – Logbuch-Projekt
// Version: 1.0 – 02.11.2025
// Autor: Kapitän
// Beschreibung:
// - CSV ohne Kopfzeile importieren
// - Quotes entfernen
// - Daten dauerhaft im localStorage speichern
// - Tabelle mit Sticky Header darstellen
// - Nur Admins dürfen importieren oder löschen
// ===========================================================

const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
if (!currentUser) window.location.href = "gate.html";

document.addEventListener("DOMContentLoaded", () => {
  const role = currentUser?.role?.toLowerCase() || "";
  const importSection = document.getElementById("adminImportSection");
  const fileInput = document.getElementById("csvFile");
  const importButton = document.getElementById("importButton");
  const clearButton = document.getElementById("clearButton");
  const tableBody = document.querySelector("#csvTable tbody");

  // Nur Admins dürfen CSV importieren / löschen
  if (role === "admin") {
    importSection.style.display = "block";
  }

  // CSV laden, falls vorhanden
  renderTable();

  // ----------------------------------------------------------
  // Import starten
  // ----------------------------------------------------------
  importButton.addEventListener("click", () => {
    const file = fileInput.files[0];
    if (!file) {
      alert("Bitte eine CSV-Datei auswählen, Kapitän!");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const rows = content
        .trim()
        .split("\n")
        .map((line) =>
          line
            .replace(/"/g, "") // Quotes entfernen
            .split(/[;,]/) // Trenner: Komma oder Semikolon
            .map((val) => val.trim())
        );

      localStorage.setItem("logbuchCSV", JSON.stringify(rows));
      renderTable();
      alert(`CSV erfolgreich importiert (${rows.length} Zeilen).`);
    };

    reader.readAsText(file, "UTF-8");
  });

  // ----------------------------------------------------------
  // Daten löschen
  // ----------------------------------------------------------
  clearButton.addEventListener("click", () => {
    if (confirm("Gesamte CSV löschen, Kapitän?")) {
      localStorage.removeItem("logbuchCSV");
      renderTable();
    }
  });

  // ----------------------------------------------------------
  // Tabelle rendern
  // ----------------------------------------------------------
  function renderTable() {
    tableBody.innerHTML = "";
    const data = JSON.parse(localStorage.getItem("logbuchCSV") || "[]");

    if (data.length === 0) {
      const row = document.createElement("tr");
      row.innerHTML = `<td colspan="10" style="text-align:center;"><em>Keine CSV-Daten geladen.</em></td>`;
      tableBody.appendChild(row);
      return;
    }

    data.forEach((rowData) => {
      const row = document.createElement("tr");
      rowData.forEach((cell) => {
        const td = document.createElement("td");
        td.textContent = cell;
        row.appendChild(td);
      });
      tableBody.appendChild(row);
    });
  }
});