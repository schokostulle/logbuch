// ============================================================
// reservierungen.js – Logbuch Reservierungsverwaltung
// Version: 1.0 – 04.11.2025
// Autor: Kapitän ⚓
// Beschreibung:
//   - Verwaltung von Insel-Reservierungen
//   - Admins/Offiziere können neue anlegen
//   - Später via Supabase-Table 'reservations'
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("reservationForm");
  const tableBody = document.querySelector("#reservierungenTable tbody");

  // Temporärer Speicher (wird später aus Supabase gelesen)
  let reservations = [];

  // ------------------------------------------------------------
  // Formular absenden
  // ------------------------------------------------------------
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const insel = document.getElementById("inselName").value.trim();
    const spieler = document.getElementById("spielerName").value.trim();
    const allianz = document.getElementById("allianz").value.trim() || "-";
    const frist = document.getElementById("frist").value;
    const status = document.getElementById("status").value;

    if (!insel || !spieler || !frist) {
      alert("Bitte alle Pflichtfelder ausfüllen!");
      return;
    }

    const entry = {
      id: Date.now(),
      insel,
      spieler,
      allianz,
      status,
      frist,
      erstellt: new Date().toISOString(),
    };

    reservations.unshift(entry);
    form.reset();
    renderTable();
  });

  // ------------------------------------------------------------
  // Tabelle aktualisieren
  // ------------------------------------------------------------
  function renderTable() {
    tableBody.innerHTML = "";

    if (reservations.length === 0) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="8"><em>Keine Reservierungen vorhanden.</em></td>`;
      tableBody.appendChild(tr);
      return;
    }

    reservations.forEach((res, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${idx + 1}</td>
        <td>${res.insel}</td>
        <td>${res.spieler}</td>
        <td>${res.allianz}</td>
        <td>
          <span class="badge ${statusClass(res.status)}">${res.status}</span>
        </td>
        <td>${formatDate(res.frist)}</td>
        <td>${formatDateTime(res.erstellt)}</td>
        <td>
          <button class="btn btn--danger btn-sm" data-id="${res.id}">Löschen</button>
        </td>
      `;
      tableBody.appendChild(tr);
    });

    // Aktionen
    document.querySelectorAll("[data-id]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = parseInt(e.target.dataset.id);
        reservations = reservations.filter((r) => r.id !== id);
        renderTable();
      });
    });
  }

  // ------------------------------------------------------------
  // Hilfsfunktionen
  // ------------------------------------------------------------
  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("de-DE", { year: "numeric", month: "2-digit", day: "2-digit" });
  }

  function formatDateTime(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleString("de-DE", {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function statusClass(status) {
    switch (status.toLowerCase()) {
      case "offen": return "badge--warn";
      case "bestätigt": return "badge--ok";
      case "erledigt": return "badge--ok";
      case "abgelehnt": return "badge--danger";
      default: return "";
    }
  }

  // ------------------------------------------------------------
  // Initial rendern (leer)
  // ------------------------------------------------------------
  renderTable();
});