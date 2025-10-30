// =============================================================
// Mitgliederverwaltung – v1.3 (Build 30.10.2025)
// Neue Funktion: Wiederherstellen gelöschter Mitglieder
// =============================================================

const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
if (!currentUser || currentUser.status !== "aktiv") {
  window.location.href = "gate.html";
}

import { Logbuch } from "./logbuch.js";

document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.querySelector("#membersTable tbody");
  const showDeletedCheckbox = document.getElementById("showDeleted");

  // Zugriff prüfen
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  if (!currentUser || currentUser.status !== "aktiv" || currentUser.role !== "Admin") {
    alert("Zugriff verweigert – nur Administratoren dürfen diese Seite aufrufen.");
    window.location.href = "dashboard.html";
    return;
  }

  let users = JSON.parse(localStorage.getItem("logbuch_users")) || [];
  const founder = users.length > 0 ? users[0].name : null;

  renderTable();

  showDeletedCheckbox.addEventListener("change", renderTable);

  // -------------------- Tabellenaufbau --------------------
  function renderTable() {
    tableBody.innerHTML = "";

    const showDeleted = showDeletedCheckbox.checked;
    const visibleUsers = showDeleted ? users : users.filter(u => !u.deleted);

    if (visibleUsers.length === 0) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="5"><em>Keine Mitglieder gefunden.</em></td>`;
      tableBody.appendChild(tr);
      return;
    }

    visibleUsers.forEach((user, index) => {
      const isFounder = user.name === founder;
      const isSelf = user.name === currentUser.name;
      const isDeleted = user.deleted;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${user.name}${isFounder ? " ⭐" : ""}</td>
        <td>${user.role}</td>
        <td>${user.status}</td>
        <td>${isDeleted ? "Ja" : "Nein"}</td>
        <td>
          ${renderActions(user, index, isFounder, isSelf)}
        </td>
      `;
      tableBody.appendChild(tr);
    });

    activateButtons();
  }

  // -------------------- Aktionen generieren --------------------
  function renderActions(user, index, isFounder, isSelf) {
    if (isFounder || isSelf) {
      return `<em style="color:#888;">geschützt</em>`;
    }

    if (user.deleted) {
      return `<button class="btn-restore" data-index="${index}">Reaktivieren</button>`;
    }

    return `
      <button class="btn-role" data-index="${index}">Rolle</button>
      <button class="btn-status" data-index="${index}">Status</button>
      <button class="btn-delete" data-index="${index}">Entfernen</button>
    `;
  }

  // -------------------- Buttons aktivieren --------------------
  function activateButtons() {
    document.querySelectorAll(".btn-role").forEach(btn => {
      btn.addEventListener("click", e => toggleRole(e.target.dataset.index));
    });
    document.querySelectorAll(".btn-status").forEach(btn => {
      btn.addEventListener("click", e => toggleStatus(e.target.dataset.index));
    });
    document.querySelectorAll(".btn-delete").forEach(btn => {
      btn.addEventListener("click", e => softDelete(e.target.dataset.index));
    });
    document.querySelectorAll(".btn-restore").forEach(btn => {
      btn.addEventListener("click", e => restoreUser(e.target.dataset.index));
    });
  }

  // -------------------- Logik --------------------
  function toggleRole(i) {
    const u = users[i];
    if (isProtected(u)) return;
    u.role = u.role === "Admin" ? "Member" : "Admin";
    saveUsers();
  }

  function toggleStatus(i) {
    const u = users[i];
    if (isProtected(u)) return;
    u.status = u.status === "aktiv" ? "geblockt" : "aktiv";
    saveUsers();
  }

  function softDelete(i) {
    const u = users[i];
    if (isProtected(u)) return;
    if (u.deleted) return alert("Benutzer ist bereits als gelöscht markiert.");
    if (!confirm(`Soll der Benutzer "${u.name}" wirklich entfernt werden?`)) return;
    u.deleted = true;
    saveUsers();
  }

  function restoreUser(i) {
    const u = users[i];
    if (!u.deleted) return alert("Dieser Benutzer ist nicht gelöscht.");
    if (!confirm(`"${u.name}" wieder an Bord holen?`)) return;
    u.deleted = false;
    saveUsers();
  }

  // -------------------- Schutzregeln --------------------
  function isProtected(user) {
    if (user.name === founder) {
      alert("Dieser Benutzer ist der Gründer-Admin und kann nicht geändert werden.");
      return true;
    }
    if (user.name === currentUser.name) {
      alert("Du kannst dich nicht selbst ändern, Kapitän!");
      return true;
    }
    return false;
  }

  // -------------------- Speicherung --------------------
  function saveUsers() {
    localStorage.setItem("logbuch_users", JSON.stringify(users));
    renderTable();
  }

  Logbuch.log("Mitgliederverwaltung v1.3 geladen – Reaktivierung aktiv.");
});