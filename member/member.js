// /logbuch/member/member.js — Version 1.2 (Realtime-Sync für Benutzerverwaltung)
(async function () {
  const tableBody = document.querySelector("#member-table tbody");
  const username = sessionStorage.getItem("username");
  const role = sessionStorage.getItem("userRole");

  if (!username || role !== "admin") {
    status.show("Zugriff verweigert.", "error");
    setTimeout(() => (window.location.href = "dashboard/dashboard.html"), 1200);
    return;
  }

  // -------------------------------------------------------
  // Tabelle laden und rendern
  // -------------------------------------------------------
  async function loadUsers() {
    tableBody.innerHTML = `<tr><td colspan="5">Lade Daten...</td></tr>`;
    try {
      const data = await supabaseAPI.fetchData("profiles");
      renderTable(data);
    } catch (err) {
      console.error(err);
      tableBody.innerHTML = `<tr><td colspan="5">Fehler beim Laden der Daten.</td></tr>`;
    }
  }

  function renderTable(users) {
    if (!users || users.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="5">Keine Benutzer gefunden.</td></tr>`;
      return;
    }

    tableBody.innerHTML = "";
    for (const u of users) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${u.username}</td>
        <td>${new Date(u.created_at).toLocaleString("de-DE")}</td>
        <td>${u.rolle}</td>
        <td>${u.status}</td>
        <td class="actions">
          <button class="btn-role" title="Rollenwechsel">${u.rolle === "admin" ? "🪖" : "🎖️"}</button>
          <button class="btn-status" title="Statuswechsel">${u.status === "aktiv" ? "🌕" : "🌑"}</button>
          <button class="btn-delete" title="Soft Delete">${u.deleted ? "🐦‍🔥" : "🔥"}</button>
        </td>
      `;

      const btnRole = tr.querySelector(".btn-role");
      const btnStatus = tr.querySelector(".btn-status");
      const btnDelete = tr.querySelector(".btn-delete");

      // ------------------- Aktionen --------------------
      // Rollenwechsel (admin <-> member)
      btnRole.addEventListener("click", async () => {
        if (u.username === username) return status.show("Eigene Rolle kann nicht geändert werden.", "warn");
        const newRole = u.rolle === "admin" ? "member" : "admin";
        try {
          await supabaseAPI.updateData("profiles", u.id, { rolle: newRole });
          status.show(`Rolle geändert: ${u.username} → ${newRole}`, "ok");
        } catch {
          status.show("Fehler beim Ändern der Rolle.", "error");
        }
      });

      // Statuswechsel (aktiv <-> blockiert)
      btnStatus.addEventListener("click", async () => {
        const newStatus = u.status === "aktiv" ? "blockiert" : "aktiv";
        try {
          await supabaseAPI.updateData("profiles", u.id, { status: newStatus });
          status.show(`Status geändert: ${u.username} → ${newStatus}`, "ok");
        } catch {
          status.show("Fehler beim Ändern des Status.", "error");
        }
      });

      // Soft Delete / Reaktivierung
      btnDelete.addEventListener("click", async () => {
        const newVal = !u.deleted;
        try {
          await supabaseAPI.updateData("profiles", u.id, { deleted: newVal });
          status.show(newVal ? `Benutzer gelöscht: ${u.username}` : `Benutzer reaktiviert: ${u.username}`, "warn");
        } catch {
          status.show("Fehler beim Löschen/Reaktivieren.", "error");
        }
      });

      tableBody.appendChild(tr);
    }
  }

  // -------------------------------------------------------
  // Realtime-Kanal für Änderungen an "profiles"
  // -------------------------------------------------------
  function subscribeRealtime() {
    const channel = supabaseAPI.client
      .channel("profiles_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        (payload) => {
          console.log("[Realtime] Änderung erkannt:", payload.eventType, payload.new);
          loadUsers(); // Tabelle neu laden bei Insert, Update, Delete
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("[Realtime] Kanal aktiv");
        }
      });
  }

  // -------------------------------------------------------
  // Initialisieren
  // -------------------------------------------------------
  await loadUsers();
  subscribeRealtime();
})();