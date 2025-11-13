// /logbuch/member/member.js — Version 1.3A (Admin-Tool, last_login + Core-Admin-Schutz)
(async function () {
  const tableBody = document.querySelector("#member-table tbody");
  const username = sessionStorage.getItem("username");
  const role = sessionStorage.getItem("userRole");

  // Zugriffsschutz
  if (!username || role !== "admin") {
    status.show("Zugriff verweigert.", "error");
    setTimeout(() => (window.location.href = "dashboard/dashboard.html"), 1200);
    return;
  }

  // -----------------------------------------
  // Benutzerliste laden
  // -----------------------------------------
  async function loadUsers() {
    tableBody.innerHTML = `<tr><td colspan="6">Lade Daten...</td></tr>`;

    try {
      // Wichtig: Tabelle OHNE public.
      const profiles = await supabaseAPI.fetchData("profiles");

      // Core-Admin = der zuerst registrierte User
      const core = [...profiles].sort((a, b) =>
        new Date(a.created_at) - new Date(b.created_at)
      )[0];

      const coreAdminId = core?.id || null;

      renderTable(profiles, coreAdminId);
    } catch (err) {
      console.error("[Member] Fehler beim Laden:", err);
      tableBody.innerHTML = `<tr><td colspan="6">Fehler beim Laden der Daten.</td></tr>`;
    }
  }

  // -----------------------------------------
  // Tabelle rendern
  // -----------------------------------------
  function renderTable(users, coreAdminId) {
    if (!users || users.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6">Keine Benutzer gefunden.</td></tr>`;
      return;
    }

    // Sortierung: aktiv → blockiert → gelöscht → nach Name
    users.sort((a, b) => {
      const order = ["aktiv", "blockiert", null];
      const sA = order.indexOf(a.status);
      const sB = order.indexOf(b.status);
      if (sA !== sB) return sA - sB;
      return (a.username || "").localeCompare(b.username || "");
    });

    tableBody.innerHTML = "";

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
            title="${isSelf ? "Eigene Rolle gesperrt" : isCore ? "Core-Admin gesperrt" : "Rollenwechsel"}"
            ${isSelf || isCore ? "disabled" : ""}>
            ${u.rolle === "admin" ? "🪖" : "🎖️"}
          </button>

          <button class="btn-status"
            title="${isCore ? "Core-Admin gesperrt" : "Statuswechsel"}"
            ${isCore ? "disabled" : ""}>
            ${u.status === "aktiv" ? "🌕" : "🌑"}
          </button>

          <button class="btn-delete"
            title="${isCore ? "Core-Admin gesperrt" : u.deleted ? "Reaktivieren" : "Soft Delete"}"
            ${isCore ? "disabled" : ""}>
            ${u.deleted ? "🐦‍🔥" : "🔥"}
          </button>
        </td>
      `;

      // Buttons referenzieren
      const btnRole = tr.querySelector(".btn-role");
      const btnStatus = tr.querySelector(".btn-status");
      const btnDelete = tr.querySelector(".btn-delete");

      // -------------------------------------
      // Rollenwechsel (admin <-> member)
      // -------------------------------------
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

      // -------------------------------------
      // Statuswechsel
      // -------------------------------------
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

      // -------------------------------------
      // Soft-Delete / Restore
      // -------------------------------------
      btnDelete?.addEventListener("click", async () => {
        if (isCore) return status.show("Erster Nutzer ist geschützt.", "warn");

        const newDeleted = !u.deleted;

        try {
          await supabaseAPI.updateData("profiles", u.id, { deleted: newDeleted });
          status.show(
            newDeleted ? `Benutzer gelöscht: ${u.username}` : `Benutzer reaktiviert: ${u.username}`,
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