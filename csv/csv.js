// /logbuch/csv/csv.js — Version 1.1
(async function () {
  const fileInput = document.getElementById("csv-file");
  const uploadBtn = document.getElementById("csv-upload-btn");
  const tbody = document.querySelector("#csv-table tbody");

  const session = await supabaseAPI.getSession().catch(() => null);
  if (!session || !session.user) {
    window.location.href = "gate.html";
    return;
  }

  function renderTable(rows) {
    tbody.innerHTML = "";
    rows.forEach(r => {
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

  function parseCSV(text) {
    return text
      .trim()
      .split("\n")
      .map(line =>
        line.replace(/"/g, "").split(";").map(x => x.trim())
      );
  }

  async function loadCSV() {
    const data = await supabaseAPI.fetchData("csv_storage");
    if (!data || data.length === 0) return;
    const parsed = parseCSV(data[0].file || "");
    renderTable(parsed);
  }

  uploadBtn.addEventListener("click", async () => {
    if (!fileInput.files.length) {
      status.show("Keine CSV ausgewählt.", "warn");
      return;
    }

    const text = await fileInput.files[0].text();

    await supabaseClient
      .from("csv_storage")
      .upsert({ id: 1, file: text })
      .select();

    status.show("CSV gespeichert.", "ok");
    renderTable(parseCSV(text));
  });

  loadCSV();
})();