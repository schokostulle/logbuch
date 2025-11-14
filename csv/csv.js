// /logbuch/csv/csv.js — Version 1.2
(async function () {
  const fileInput   = document.getElementById("csv-file");
  const uploadBtn   = document.getElementById("csv-upload-btn");
  const deleteBtn   = document.getElementById("csv-delete-btn");
  const nameSpan    = document.getElementById("csv-filename");
  const tbody       = document.querySelector("#csv-table tbody");

  // ---- Session prüfen ----
  const session = await supabaseAPI.getSession().catch(() => null);
  if (!session || !session.user) {
    window.location.href = "gate.html";
    return;
  }

  // ---- Dateiname anzeigen ----
  if (fileInput && nameSpan) {
    fileInput.addEventListener("change", () => {
      if (fileInput.files && fileInput.files.length > 0) {
        nameSpan.textContent = fileInput.files[0].name;
      } else {
        nameSpan.textContent = "";
      }
    });
  }

  // ---- CSV → Tabelle rendern ----
  function renderTable(rows) {
    tbody.innerHTML = "";
    rows.forEach((r) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="num">${r[0] || ""}</td>
        <td class="num">${r[1] || ""}</td>
        <td class="num">${r[2] || ""}</td>
        <td class="txt">${r[3] || ""}</td>
        <td class="num">${r[4] || ""}</td>
        <td class="txt">${r[5] || ""}</td>
        <td class="num">${r[6] || ""}</td>
        <td class="txt">${r[7] || ""}</td>
        <td class="txt">${r[8] || ""}</td>
        <td class="num">${r[9] || ""}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // ---- CSV Parser (Semikolon, Quotes entfernen) ----
  function parseCSV(text) {
    return text
      .trim()
      .split("\n")
      .map((line) =>
        line
          .replace(/"/g, "")
          .split(";")
          .map((x) => x.trim())
      );
  }

  // ---- CSV aus DB laden ----
  async function loadCSV() {
    try {
      const data = await supabaseAPI.fetchData("csv_storage");
      if (!data || data.length === 0 || !data[0].file) {
        tbody.innerHTML = "";
        return;
      }
      const parsed = parseCSV(data[0].file);
      renderTable(parsed);
    } catch (err) {
      console.error("[CSV] Laden fehlgeschlagen:", err);
      tbody.innerHTML = "";
      status.show("Fehler beim Laden der CSV.", "error");
    }
  }

  // ---- CSV hochladen / überschreiben ----
  uploadBtn?.addEventListener("click", async () => {
    if (!fileInput.files || !fileInput.files.length) {
      status.show("Keine CSV ausgewählt.", "warn");
      return;
    }

    try {
      const file = fileInput.files[0];
      const text = await file.text();

      await supabaseAPI.client
        .from("csv_storage")
        .upsert({ id: 1, file: text })
        .select();

      status.show("CSV gespeichert.", "ok");
      renderTable(parseCSV(text));
    } catch (err) {
      console.error("[CSV] Upload fehlgeschlagen:", err);
      status.show("Fehler beim Speichern der CSV.", "error");
    }
  });

  // ---- CSV löschen ----
  deleteBtn?.addEventListener("click", async () => {
    try {
      await supabaseAPI.client.from("csv_storage").delete().eq("id", 1);
      tbody.innerHTML = "";
      if (nameSpan) nameSpan.textContent = "";
      if (fileInput) fileInput.value = "";
      status.show("CSV gelöscht.", "ok");
    } catch (err) {
      console.error("[CSV] Löschen fehlgeschlagen:", err);
      status.show("Fehler beim Löschen der CSV.", "error");
    }
  });

  // ---- Initial laden ----
  loadCSV();
})();