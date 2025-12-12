import { supabase } from "../js/supabase.js";

/* ==========================================================================
   DOM
   ========================================================================== */

const fileInput = document.getElementById("csv-file");
const uploadBtn = document.getElementById("upload-btn");
const deleteBtn = document.getElementById("delete-btn");
const tableBody = document.getElementById("csv-table-body");
const statusBox = document.getElementById("csv-status");
const rowCountBox = document.getElementById("csv-rowcount");

/* ==========================================================================
   STATUSANZEIGE
   ========================================================================== */

function showStatus(msg, type = "info") {
    statusBox.innerHTML = `<div class="${type}-box">${msg}</div>`;
}

/* ==========================================================================
   ZEILENANZAHL
   ========================================================================== */

function updateRowCount(count) {
    if (rowCountBox) {
        rowCountBox.textContent = `Angezeigte Zeilen: ${count}`;
    }
}

/* ==========================================================================
   CSV PARSEN
   (keine Kopfzeile, ; getrennt, keine Quotes)
   ========================================================================== */

function parseCSV(text) {
    return text
        .trim()
        .split("\n")
        .map(line =>
            line
                .replace(/"/g, "")
                .split(";")
        )
        .filter(row => row.length >= 10)
        .map(row => ({
            oz: Number(row[0]),
            ig: Number(row[1]),
            in_value: Number(row[2]),
            island_name: row[3],
            player_id: Number(row[4]),
            player_name: row[5],
            alliance_id: Number(row[6]),
            alliance_tag: row[7],
            alliance_name: row[8],
            points: Number(row[9])
        }));
}

/* ==========================================================================
   DATEN LADEN
   ========================================================================== */

async function loadData() {
    const { data, error } = await supabase
        .from("csv_data")
        .select("*")
        .order("points", { ascending: false });

    if (error) {
        showStatus("Fehler beim Laden der Daten", "error");
        return;
    }

    tableBody.innerHTML = "";

    data.forEach(row => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${row.oz}</td>
            <td>${row.ig}</td>
            <td>${row.in_value}</td>
            <td>${row.island_name}</td>
            <td>${row.player_id}</td>
            <td>${row.player_name}</td>
            <td>${row.alliance_id}</td>
            <td>${row.alliance_tag}</td>
            <td>${row.alliance_name}</td>
            <td>${row.points}</td>
        `;
        tableBody.appendChild(tr);
    });

    updateRowCount(data.length);
}

/* ==========================================================================
   UPLOAD (überschreibt komplett)
   ========================================================================== */

uploadBtn.addEventListener("click", async () => {
    const file = fileInput.files[0];

    if (!file) {
        showStatus("Keine CSV-Datei ausgewählt", "error");
        return;
    }

    const text = await file.text();
    const rows = parseCSV(text);

    if (!rows.length) {
        showStatus("CSV enthält keine gültigen Daten", "error");
        return;
    }

    showStatus("Alte Daten werden gelöscht …", "info");

    await supabase.from("csv_data").delete().neq("oz", -1);

    const { error } = await supabase
        .from("csv_data")
        .insert(rows);

    if (error) {
        showStatus("Fehler beim Import", "error");
        return;
    }

    showStatus(`CSV erfolgreich importiert (${rows.length} Zeilen)`, "success");
    loadData();
});

/* ==========================================================================
   LÖSCHEN
   ========================================================================== */

deleteBtn.addEventListener("click", async () => {
    if (!confirm("Alle CSV-Daten löschen?")) return;

    await supabase.from("csv_data").delete().neq("oz", -1);

    tableBody.innerHTML = "";
    updateRowCount(0);

    showStatus("Alle Daten gelöscht", "success");
});

/* ==========================================================================
   INIT
   ========================================================================== */

loadData();