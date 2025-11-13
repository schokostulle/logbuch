// /logbuch/member/member.js — Version 1.3D (ohne last_login, stabil)
(async function () {
  const tableBody = document.querySelector("#member-table tbody");
  const btnToggleDeleted = document.getElementById("toggle-deleted");

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
  // Deleted-Filter (Standard: ausgeblendet)
  // ==========================================
  let showDeleted = false;

  btnToggleDeleted.addEventListener("click", () => {
    showDeleted = !showDeleted;

    btnToggleDeleted.textContent = showDeleted
      ? "🔥 Gelöschte ausblenden"
      : "🐦‍🔥 Gelöschte einblenden";

    loadUsers();
  });

  // ==========================================
  // Benutzer laden
  // ==========================================
  async function loadUsers() {
    tableBody.innerHTML = `<tr><td colspan="5">Lade Daten...</td></tr>`;

    try {
      const users = await supabaseAPI.fetchData("profiles");

      // Core-Admin (erster registrierter Benutzer)
      const coreUser = [...users].sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      )[0];

      const coreAdminId = coreUser?.id ?? null;

      renderTable(users, coreAdminId);

    } catch (err) {
      console.error("[Member] Fehler:", err);
      tableBody.innerHTML = `<tr><td colspan="5">Fehler beim Laden der Daten.</td></tr>`;
    }
  }

  // ==========================================
  // Tabelle erzeugen
  // ==========================================
  function renderTable(users, coreAdminId) {
    tableBody.innerHTML = "";

    // Gelöschte optional ausblenden
    const list = showDeleted ? users : users.filter(u => !u.deleted);

    if (list.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="5">Keine Benutzer vorhanden.</td></tr>`;
      return;
    }

    // Sortierung: aktiv → blockiert → alphabetisch
    list.sort((a, b) => {
      const order = { aktiv: 0, blockiert: 1, undefined: 2 };
      const oa = order[a.status] ?? 2;
      const ob = order[b.status] ?? 2;
      if (oa !== ob) return oa - ob;
      return (a.username || "").localeCompare(b.username || "");
    });

    list.forEach(u => {
      const isSelf = u.username === username;
      const isCore = u.id === coreAdminId;

      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${u.username}</td>
        <td>${new Date(u.created_at).toLocaleString("de-DE")}</td>
        <td>${u.rolle}</td>
        <td>${u.status}</td>

        <td class="actions">
          <button class="btn-role"
            ${isSelf || isCore ? "disabled" : ""}
            title="${isCore ? "Core-Admin gesperrt" : isSelf ? "Eigene Rolle gesperrt" : "Rollenwechsel"}">
            ${u.rolle === "admin" ? "🎖️" : "🪖"}
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

      // Rollenwechsel
      tr.querySelector(".btn-role")?.addEventListener("click", async () => {
        if (isSelf || isCore) return;
        const newRole = u.rolle === "admin" ? "member" : "admin";
        await update(u.id, { rolle: newRole }, `Rolle geändert: ${u.username} → ${newRole}`);
      });

      // Statuswechsel
      tr.querySelector(".btn-status")?.addEventListener("click", async () => {
        if (isCore) return;
        const newStatus = u.status === "aktiv" ? "blockiert" : "aktiv";
        await update(u.id, { status: newStatus }, `Status geändert: ${u.username} → ${newStatus}`);
      });

      // Soft Delete / Restore
      tr.querySelector(".btn-delete")?.addEventListener("click", async () => {
        if (isCore) return;
        const newDeleted = !u.deleted;
        await update(
          u.id,
          { deleted: newDeleted },
          newDeleted
            ? `Benutzer gelöscht: ${u.username}`
            : `Benutzer reaktiviert: ${u.username}`
        );
      });

      tableBody.appendChild(tr);
    });
  }

  // ==========================================
  // Hilfsfunktion für Updates
  // ==========================================
  async function update(id, values, msg) {
    try {
      await supabaseAPI.updateData("profiles", id, values);
      status.show(msg, "ok");
      loadUsers();
    } catch (err) {
      console.error("[Member] Update-Fehler:", err);
      status.show("Fehler beim Anwenden der Änderung.", "error");
    }
  }

  // Initial laden
  loadUsers();
})();