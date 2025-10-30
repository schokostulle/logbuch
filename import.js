// ===========================================================
// import.js – Logbuch-Projekt (Supabase-only)
// Version: 2.1 – 03.11.2025
// Autor: Kapitän 🦑
// Beschreibung:
// - CSV ohne Kopfzeile importieren
// - Quotes entfernen
// - Daten dauerhaft in Supabase speichern (Tabelle: csv_base)
// - Sticky Header-Tabelle mit allen Spalten
// - Nur Admins dürfen importieren oder löschen
// ===========================================================

import { Logbuch, supabase } from "./logbuch.js";

document.addEventListener("DOMContentLoaded", async () => {
  const importSection = document.getElementById("adminImportSection");
  const fileInput = document.getElementById("csvFile");
  const importButton = document.getElementById("importButton");
  const clearButton = document.getElementById("clearButton");
  const tableBody = document.querySelector("#csvTable tbody");

  // --- Benutzerprüfung -----------------------------------------------------
  const { data: sessionData, error: sessionError } = await supabase.auth.getUser();
  if (sessionError || !sessionData?.user) {
    alert("Zugang verweigert – keine gültige Sitzung.");
    window.location.href = "login.html";
    return;
  }

  const authUser = sessionData.user;

  const { data: currentUser, error: userError } = await supabase
    .from("users")
    .select("id, username, role")
    .eq("id", authUser.id)
    .single();

  if (userError || !currentUser) {
    alert("Benutzer konnte nicht geladen werden.");
    window.location.href = "login.html";
    return;
  }

  const isAdmin = currentUser.role.toLowerCase() === "admin";
  if (!isAdmin) {
    alert("Zugang verweigert – nur Administratoren dürfen CSV importieren.");
    window.location.href = "dashboard.html";
    return;
  }

  // Admin darf importieren/löschen
  importSection.style.display = "block";

  // --- CSV anzeigen -------------------------------------------------------
  await renderTable();

  // ===========================================================
  // CSV Import starten
  // ===========================================================
  importButton.addEventListener("click", async () => {
    const file = fileInput.files[0];
    if (!file) {
      alert("Bitte eine CSV-Datei auswählen, Kapitän!");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target.result;
      const rows = content
        .trim()
        .split("\n")
        .map((line) =>
          line
            .replace(/"/g, "") // Quotes entfernen
            .split(/[;,]/) // Komma oder Semikolon
            .map((val) => val.trim())
        );

      if (!rows.length) {
        alert("Keine gültigen Daten in der CSV gefunden.");
        return;
      }

      // Bestehende CSV-Daten löschen (vollständiger Ersatz)
      await supabase.from("csv_base").delete().neq("id", 0);

      // CSV in Supabase speichern
      const formattedRows = rows.map((r) => ({
        oz: r[0],
        ig: r[1],
        i: r[2],
        inselname: r[3],
        spieler_id: r[4],
        spielername: r[5],
        allianz_id: r[6],
        akuerzel: r[7],
        allianzname: r[8],
        punkte: parseInt(r[9]) || 0,
      }));

      const { error: insertError } = await supabase.from("csv_base").insert(formattedRows);
      if (insertError) {
        console.error("SUPABASE IMPORT ERROR:", insertError);
        alert("Fehler beim Speichern der CSV in Supabase.");
        return;
      }

      alert(`CSV erfolgreich importiert (${rows.length} Zeilen).`);
      await renderTable();
    };

    reader.readAsText(file, "UTF-8");
  });

  // ===========================================================
  // CSV Daten löschen
  // ===========================================================
  clearButton.addEventListener("click", async () => {
    if (!confirm("Gesamte CSV löschen, Kapitän?")) return;

    const { error } = await supabase.from("csv_base").delete().neq("id", 0);
    if (error) {
      console.error("SUPABASE DELETE ERROR:", error);
      alert("Fehler beim Löschen der CSV-Daten.");
      return;
    }

    alert("CSV erfolgreich gelöscht.");
    await renderTable();
  });

  // ===========================================================
  // Tabelle rendern
  // ===========================================================
  async function renderTable() {
    tableBody.innerHTML = "";

    const { data, error } = await supabase
      .from("csv_base")
      .select("*")
      .order("oz", { ascending: true });

    if (error) {
      console.error("SUPABASE LOAD ERROR:", error);
      const row = document.createElement("tr");
      row.innerHTML = `<td colspan="10" style="text-align:center;"><em>Fehler beim Laden der CSV-Daten.</em></td>`;
      tableBody.appendChild(row);
      return;
    }

    if (!data || data.length === 0) {
      const row = document.createElement("tr");
      row.innerHTML = `<td colspan="10" style="text-align:center;"><em>Keine CSV-Daten geladen.</em></td>`;
      tableBody.appendChild(row);
      return;
    }

    data.forEach((rowData) => {
      const tr = document.createElement("tr");
      [
        rowData.oz,
        rowData.ig,
        rowData.i,
        rowData.inselname,
        rowData.spieler_id,
        rowData.spielername,
        rowData.allianz_id,
        rowData.akuerzel,
        rowData.allianzname,
        rowData.punkte,
      ].forEach((val) => {
        const td = document.createElement("td");
        td.textContent = val ?? "";
        tr.appendChild(td);
      });
      tableBody.appendChild(tr);
    });
  }

  Logbuch.log("Import.js v2.1 geladen – Supabase aktiv ⚓");
});