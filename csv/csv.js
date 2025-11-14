// /logbuch/csv/csv.js — Version 1.0
(async function () {
  const fileInput = document.getElementById("csv-file");
  const uploadBtn = document.getElementById("csv-upload-btn");
  const tbody = document.querySelector("#csv-table tbody");

  // ---- Session prüfen ----
  const session = await supabaseAPI.getSession().catch(() => null);
  if (!session || !session.user) {
    window.location.href = "gate.html";
    return;
  }

  // ---- CSV → Tabelle rendern ----
  function renderTable(rows) {
    tbody.innerHTML = "";
    rows.forEach(r => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r[0] || ""}</td>
        <td>${r[1] || ""}</td>
        <td>${r[2] || ""}</td>
        <td>${r[3] || ""}</td>
        <td>${r[4] || ""}</td>
        <td>${r[5] || ""}</td>
        <td>${r[6] || ""}</td>
        <td>${r[7] || ""}</td>
        <td>${r[8] || ""}</td>
        <td>${r[9] || ""}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // ---- CSV Parser (Semikolon, ohne Quotes) ----
  function parseCSV(text) {
    return text
      .trim()
      .split("\n")
      .map(line =>
        line
          .replace(/"/g, "")
          .split(";")
          .map(x => x.trim())
      );
  }

  // ---- CSV laden (aus DB) ----
  async function loadCSV() {
    const data = await supabaseAPI.fetchData("csv_storage");
    if (!data || data.length === 0) return;
    const parsed = parseCSV(data[0].file || "");
    renderTable(parsed);
  }

  // ---- CSV hochladen ----
  uploadBtn.addEventListener("click", async () => {
    if (!fileInput.files.length) {
      status.show("Keine CSV ausgewählt.", "warn");
      return;
    }

    const file = fileInput.files[0];
    const text = await file.text();

    await supabaseClient
      .from("csv_storage")
      .upsert({ id: 1, file: text })
      .select();

    status.show("CSV gespeichert.", "ok");
    const parsed = parseCSV(text);
    renderTable(parsed);
  });

  // ---- Start ----
  loadCSV();
})();