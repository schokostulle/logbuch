// ============================================================
// reservierungen.js – Logbuch-Reservierungen
// Version: 1.1 – 04.11.2025
// Autor: Kapitän ⚓
// Beschreibung:
//  - Zeigt CSV-Daten aller nicht-freundlichen Spieler
//  - Reservierungen mit Status (frei, reserviert, angenommen, abgelehnt)
//  - Admin kann Reservierungen annehmen/ablehnen
//  - Kämpfe (Berichte) der Spieler einblendbar (max. 5)
// ============================================================

import { supabase } from "./logbuch.js";

document.addEventListener("DOMContentLoaded", async () => {
  const tableBody = document.querySelector("#reservierungenTable tbody");
  const filterInput = document.getElementById("filterInput");
  const statusFilter = document.getElementById("statusFilter");

  let csvData = [];
  let reservations = [];

  const { data: userData } = await supabase.auth.getUser();
  const currentUser = userData?.user?.email || "Unbekannt";
  const isAdmin = (await getUserRole()) === "admin";

  // ------------------------------------------------------------
  // CSV-Daten laden
  // ------------------------------------------------------------
  async function loadCSV() {
    const { data, error } = await supabase.from("csv_base").select("*").order("oz, ig, i");
    if (error) {
      console.error("❌ CSV LOAD ERROR:", error);
      tableBody.innerHTML = `<tr><td colspan="8"><em>Fehler beim Laden der CSV.</em></td></tr>`;
      return [];
    }
    return data;
  }

  // Dummy: Diplomatie-Filter (hier: alles außer Allianz "ALLY")
  async function getNonFriendlyPlayers(data) {
    return data.filter((r) => r.akuerzel !== "ALLY");
  }

  // ------------------------------------------------------------
  // Tabellenrendering
  // ------------------------------------------------------------
  async function renderTable() {
    let filtered = csvData;

    const search = filterInput.value.toLowerCase();
    if (search) {
      filtered = filtered.filter(
        (r) =>
          r.spielername.toLowerCase().includes(search) ||
          r.akuerzel.toLowerCase().includes(search) ||
          r.inselname?.toLowerCase().includes(search)
      );
    }

    const statusSel = statusFilter.value;
    if (statusSel !== "alle") {
      filtered = filtered.filter((r) => getReservationStatus(r) === statusSel);
    }

    tableBody.innerHTML = "";

    if (filtered.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="8"><em>Keine passenden Einträge gefunden.</em></td></tr>`;
      return;
    }

    for (const row of filtered) {
      const status = getReservationStatus(row);
      const reservBy = reservations.find((res) => res.key === keyOf(row))?.user;
      const tr = document.createElement("tr");
      tr.className = `status-${status}`;

      tr.innerHTML = `
        <td><button class="btn btn--small btn-expand" data-key="${keyOf(row)}">＋</button></td>
        <td>${row.oz}</td>
        <td>${row.ig}</td>
        <td>${row.i}</td>
        <td>${row.spielername}</td>
        <td>${row.akuerzel}</td>
        <td>${row.punkte.toLocaleString("de-DE")}</td>
        <td class="reserv-cell">${renderReservationCell(row, reservBy, status)}</td>
      `;
      tableBody.appendChild(tr);
    }

    attachExpandHandlers();
    attachReservationHandlers();
  }

  // ------------------------------------------------------------
  // Reservierungs-Buttons
  // ------------------------------------------------------------
  function renderReservationCell(row, reservBy, status) {
    if (status === "frei") {
      return `<button class="btn btn--primary btn-reserve" data-key="${keyOf(row)}">Reservieren</button>`;
    }
    if (status === "reserviert" || status === "angenommen" || status === "abgelehnt") {
      const name = reservBy || "Unbekannt";
      let adminButtons = "";
      if (isAdmin && status === "reserviert") {
        adminButtons = `
          <button class="btn btn--ok btn-small" data-accept="${keyOf(row)}">✓</button>
          <button class="btn btn--danger btn-small" data-deny="${keyOf(row)}">✗</button>
        `;
      }
      return `<span>${name}</span> ${adminButtons}`;
    }
  }

  // ------------------------------------------------------------
  // Eventhandler für Reservierungen
  // ------------------------------------------------------------
  function attachReservationHandlers() {
    document.querySelectorAll(".btn-reserve").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const key = e.target.dataset.key;
        reservations.push({ key, user: currentUser, status: "reserviert" });
        renderTable();
      });
    });

    document.querySelectorAll("[data-accept]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const key = e.target.dataset.accept;
        const r = reservations.find((r) => r.key === key);
        if (r) r.status = "angenommen";
        renderTable();
      });
    });

    document.querySelectorAll("[data-deny]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const key = e.target.dataset.deny;
        const r = reservations.find((r) => r.key === key);
        if (r) r.status = "abgelehnt";
        renderTable();
      });
    });
  }

  // ------------------------------------------------------------
  // Expand-Funktion → letzte Kampfberichte
  // ------------------------------------------------------------
  function attachExpandHandlers() {
    document.querySelectorAll(".btn-expand").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const key = e.target.dataset.key;
        const tr = e.target.closest("tr");
        const next = tr.nextElementSibling;
        if (next && next.classList.contains("subtable")) {
          next.remove();
          return;
        }

        const { data, error } = await supabase
          .from("battle_reports")
          .select("*")
          .or(`attacker.eq.${key},defender.eq.${key}`)
          .order("created_at", { ascending: false })
          .limit(5);

        const subTr = document.createElement("tr");
        subTr.className = "subtable";
        const td = document.createElement("td");
        td.colSpan = 8;

        if (error || !data?.length) {
          td.innerHTML = `<em>Keine Kampfberichte vorhanden.</em>`;
        } else {
          const innerTable = `
            <table class="sub-inner">
              ${data
                .map(
                  (b) => `
                <tr>
                  <td>${new Date(b.created_at).toLocaleString("de-DE")}</td>
                  <td>${b.attacker} vs ${b.defender}</td>
                  <td>${b.oz}:${b.ig}:${b.i}</td>
                </tr>`
                )
                .join("")}
            </table>`;
          td.innerHTML = innerTable;
        }

        subTr.appendChild(td);
        tr.after(subTr);
      });
    });
  }

  // ------------------------------------------------------------
  // Hilfsfunktionen
  // ------------------------------------------------------------
  function keyOf(row) {
    return `${row.oz}:${row.ig}:${row.i}`;
  }

  function getReservationStatus(row) {
    const r = reservations.find((r) => r.key === keyOf(row));
    return r ? r.status : "frei";
  }

  async function getUserRole() {
    const { data, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", userData.user.id)
      .single();
    return error ? "member" : data.role.toLowerCase();
  }

  // ------------------------------------------------------------
  // Initial laden
  // ------------------------------------------------------------
  csvData = await getNonFriendlyPlayers(await loadCSV());
  renderTable();

  filterInput.addEventListener("input", renderTable);
  statusFilter.addEventListener("change", renderTable);
});