// /logbuch/member/member.js — Version 1.3B (stabil + Core-Admin-Schutz + last_login)
(async function () {
  const tableBody = document.querySelector("#member-table tbody");
  const username = sessionStorage.getItem("username");
  const role = sessionStorage.getItem("userRole");

  // ==========================================
  // Zugriffsschutz
  // ==========================================
  if (!username || role !== "admin") {
    status.show("Zugriff verweigert.", "error");
    setTimeout(() => (window.location.href = "dashboard/dashboard.html"), 1200);
    return;
  }

  // ==========================================
  // Benutzerliste laden
  // ==========================================
  async function loadUsers() {
    tableBody.innerHTML = `<tr><td colspan="6">Lade Daten...</td></tr>`;

    try {
      const profiles = await supabaseAPI.fetchData("profiles");

      if (!profiles || profiles.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6">Keine Benutzer gefunden.</td></tr>`;
        return;
      }

      // Ersten registrierten User schützen (Core-Admin)
      const coreUser = [...profiles].sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      )[0];

      renderTable(profiles, coreUser?.id ?? null);

    } catch (err) {
      console.error("[Member] Fehler beim Laden:", err);
      tableBody.innerHTML = `<tr><td colspan="6">Fehler beim Laden der Daten.</td></tr>`;
    }
  }

  // ==========================================
  // Tabelle rendern
  // ==========================================
  function renderTable(users, coreAdminId) {
    tableBody.innerHTML = "";

    // Sortierung: aktiv → blockiert → deleted → alphabetisch
    users.sort((a, b) => {
      const order = { aktiv: 0, blockiert: 1, null: 2, undefined: 2 };
      const aOrder = order[a.status] ?? 2;
      const bOrder = order[b.status] ?? 2;

      if (aOrder !== bOrder) return aOrder - bOrder;

      return (a.username || "").localeCompare(b.username || "");
    });

    users.forEach((u) => {
      const isSelf = u.username === username;
      const isCore = u.id === coreAdminId;

      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${u.username}</td>
        <td>${new Date(u.created_at).toLocaleString("de-DE")}</td>
        <td>${u.last_login ? new Date(u.last_login).toLocaleString("de-DE") : "–"}</td>
        <td>${u.rolle}</td>
        <td>${u.status}</td>

        <td class="actions">
          <button class="btn-role"
            ${isSelf || isCore ? "disabled" : ""}
            title="${isCore ? "Core-Admin gesperrt" : isSelf ? "Eigene Rolle gesperrt" : "Rollenwechsel"}">
            ${u.rolle === "admin" ? "🪖" : "🎖️"}
          </button>

          <button class="btn-status"
            ${isCore ? "disabled" : ""}
            title="${isCore ? "Core-Admin gesperrt" : "Statuswechsel"}">
            ${u.status === "aktiv" ? "🌕" : "🌑"}
          </button>

          <button class="btn-delete"
            ${isCore ? "disabled" : ""}
            title="${isCore ? "Core-Admin gesperrt" : u.deleted ? "Reaktivieren" : "Soft Delete"}">
            ${u.deleted ? "🐦‍🔥" : "🔥"}
          </button>
        </td>
      `;

      // Buttons:
      const btnRole = tr.querySelector(".btn-role");
      const btnStatus = tr.querySelector(".btn-status");
      const btnDelete = tr.querySelector(".btn-delete");

      // ==========================
      // Rollenwechsel
      // ==========================
      btnRole?.addEventListener("click", async () => {
        if (isSelf) return status.show("Eigene Rolle kann nicht geändert werden.", "warn");
        if (isCore) return status.show("Erster Nutzer ist geschützt.", "warn");

        const newRole = u.rolle === "admin" ? "member" : "admin";

        try {
          await supabaseAPI.updateData("profiles", u.id, { rolle: newRole });
          status.show(`Rolle geändert: ${u.username} → ${newRole}`, "ok");
          loadUsers();
        } catch (err) {
          console.error("[Member] Fehler beim Rollenwechsel:", err);
          status.show("Fehler beim Ändern der Rolle.", "error");
        }
      });

      // ==========================
      // Statuswechsel
      // ==========================
      btnStatus?.addEventListener("click", async () => {
        if (isCore) return status.show("Erster Nutzer ist geschützt.", "warn");

        const newStatus = u.status === "aktiv" ? "blockiert" : "aktiv";

        try {
          await supabaseAPI.updateData("profiles", u.id, { status: newStatus });
          status.show(`Status geändert: ${u.username} → ${newStatus}`, "ok");
          loadUsers();
        } catch (err) {
          console.error("[Member] Fehler beim Statuswechsel:", err);
          status.show("Fehler beim Ändern des Status.", "error");
        }
      });

      // ==========================
      // Soft Delete / Restore
      // ==========================
      btnDelete?.addEventListener("click", async () => {
        if (isCore) return status.show("Erster Nutzer ist geschützt.", "warn");

        const newDeleted = !u.deleted;

        try {
          await supabaseAPI.updateData("profiles", u.id, { deleted: newDeleted });

          status.show(
            newDeleted
              ? `Benutzer gelöscht: ${u.username}`
              : `Benutzer reaktiviert: ${u.username}`,
            newDeleted ? "warn" : "ok"
          );

          loadUsers();
        } catch (err) {
          console.error("[Member] Fehler beim Löschen/Reaktivieren:", err);
          status.show("Fehler beim Löschen/Reaktivieren.", "error");
        }
      });

      tableBody.appendChild(tr);
    });
  }

  // Initial laden
  await loadUsers();
})();