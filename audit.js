// ============================================================
// audit.js – Supabase Audit-Viewer
// Version: 1.0 – 03.11.2025
// Autor: Kapitän ⚓
// Beschreibung:
//   Zeigt die letzten Audit-Einträge aus audit_log
//   Nur Admins haben Zugriff
// ============================================================

import { Logbuch } from "./logbuch.js";

document.addEventListener("DOMContentLoaded", async () => {
  const tableBody = document.querySelector("#auditTable tbody");

  // --- Authentifizierung prüfen ---
  const { data: sessionData, error: sessionError } = await window.supabase.auth.getUser();
  if (sessionError || !sessionData?.user) {
    alert("Zugang verweigert – keine gültige Sitzung.");
    window.location.href = "login.html";
    return;
  }

  const authUser = sessionData.user;

  // --- Benutzer laden ---
  const { data: currentUser, error: userError } = await window.supabase
    .from("users")
    .select("id, username, role")
    .eq("id", authUser.id)
    .single();

  if (userError || !currentUser) {
    alert("Benutzer konnte nicht geladen werden.");
    window.location.href = "login.html";
    return;
  }

  if (currentUser.role.toLowerCase() !== "admin") {
    alert("Zugriff verweigert – nur Administratoren dürfen das Audit-Log sehen.");
    window.location.href = "dashboard.html";
    return;
  }

  // --- Auditdaten laden ---
  const { data: logs, error: loadError } = await window.supabase
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (loadError) {
    console.error("SUPABASE LOAD ERROR:", loadError);
    alert("Fehler beim Laden des Audit-Protokolls.");
    return;
  }

  // --- Tabelle füllen ---
  renderTable(logs || []);

  function renderTable(entries) {
    tableBody.innerHTML = "";

    if (entries.length === 0) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="6"><em>Keine Audit-Einträge vorhanden.</em></td>`;
      tableBody.appendChild(tr);
      return;
    }

    entries.forEach(entry => {
      const tr = document.createElement("tr");

      const oldData = entry.old_data ? JSON.stringify(entry.old_data, null, 0) : "-";
      const newData = entry.new_data ? JSON.stringify(entry.new_data, null, 0) : "-";

      tr.innerHTML = `
        <td>${formatDate(entry.created_at)}</td>
        <td>${entry.table_name}</td>
        <td>${entry.action}</td>
        <td>${entry.username || "Unbekannt"}</td>
        <td>${entry.record_id || "-"}</td>
        <td>
          <details>
            <summary>Details</summary>
            <div><strong>Alt:</strong> <code>${escapeHTML(oldData)}</code></div>
            <div><strong>Neu:</strong> <code>${escapeHTML(newData)}</code></div>
          </details>
        </td>
      `;
      tableBody.appendChild(tr);
    });
  }

  function formatDate(ts) {
    const d = new Date(ts);
    return d.toLocaleString("de-DE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  function escapeHTML(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  Logbuch.log("Audit.js v1.0 geladen – Admin-Protokoll aktiv ⚓");
});