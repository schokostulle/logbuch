// =============================================================
// mitglieder.js – Supabase-only Mitgliederverwaltung (final)
// Version: 2.1 – 03.11.2025
// Keine Nutzung von localStorage. Alle Daten aus Supabase.
// =============================================================

import { supabase, Logbuch } from "./logbuch.js";

document.addEventListener("DOMContentLoaded", async () => {
  const tableBody = document.querySelector("#membersTable tbody");
  const showDeletedCheckbox = document.getElementById("showDeleted");

  // 🔒 Aktuellen Benutzer prüfen
  const { data: sessionData, error: sessionError } = await supabase.auth.getUser();
  if (sessionError || !sessionData?.user) {
    alert("Zugang verweigert – keine gültige Sitzung.");
    window.location.href = "login.html";
    return;
  }

  const authUser = sessionData.user;

  // Benutzer aus Tabelle laden
  const { data: currentUserData, error: currentUserError } = await supabase
    .from("users")
    .select("id, username, role, status")
    .eq("id", authUser.id)
    .single();

  if (currentUserError || !currentUserData) {
    alert("Benutzer konnte nicht geladen werden. Bitte erneut anmelden.");
    window.location.href = "login.html";
    return;
  }

  if (currentUserData.role.toLowerCase() !== "admin") {
    alert("Zugriff verweigert – nur Administratoren dürfen diese Seite aufrufen.");
    window.location.href = "dashboard.html";
    return;
  }

  // Alle Benutzer laden
  const { data: allUsers, error: loadError } = await supabase
    .from("users")
    .select("id, username, role, status, deleted")
    .order("username", { ascending: true });

  if (loadError) {
    console.error("Fehler beim Laden der Benutzer:", loadError);
    alert("Fehler beim Laden der Benutzerliste.");
    return;
  }

  // Gründer-Admin = erster registrierter Benutzer (ältester Eintrag)
  const { data: founderData } = await supabase
    .from("users")
    .select("id, username")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  const founderId = founderData?.id || null;
  let users = allUsers || [];

  renderTable();

  showDeletedCheckbox.addEventListener("change", renderTable);

  // =========================================================
  // Tabellenaufbau
  // =========================================================
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

    visibleUsers.forEach(user => {
      const isFounder = user.id === founderId;
      const isSelf = user.id === currentUserData.id;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${user.username}${isFounder ? " ⭐" : ""}</td>
        <td>${capitalize(user.role)}</td>
        <td>${capitalize(user.status)}</td>
        <td>${user.deleted ? "Ja" : "Nein"}</td>
        <td>${renderActions(user, isFounder, isSelf)}</td>
      `;
      tableBody.appendChild(tr);
    });

    activateButtons();
  }

  // =========================================================
  // Aktionen für jeden Benutzer
  // =========================================================
  function renderActions(user, isFounder, isSelf) {
    if (isFounder || isSelf) {
      return `<em style="color:#888;">geschützt</em>`;
    }

    if (user.deleted) {
      return `<button class="btn-restore" data-id="${user.id}">Reaktivieren</button>`;
    }

    return `
      <button class="btn-role" data-id="${user.id}">Rolle</button>
      <button class="btn-status" data-id="${user.id}">Status</button>
      <button class="btn-delete" data-id="${user.id}">Entfernen</button>
    `;
  }

  // =========================================================
  // Buttons aktivieren
  // =========================================================
  function activateButtons() {
    document.querySelectorAll(".btn-role").forEach(btn => {
      btn.addEventListener("click", async e => {
        await toggleRole(e.target.dataset.id);
      });
    });
    document.querySelectorAll(".btn-status").forEach(btn => {
      btn.addEventListener("click", async e => {
        await toggleStatus(e.target.dataset.id);
      });
    });
    document.querySelectorAll(".btn-delete").forEach(btn => {
      btn.addEventListener("click", async e => {
        await softDelete(e.target.dataset.id);
      });
    });
    document.querySelectorAll(".btn-restore").forEach(btn => {
      btn.addEventListener("click", async e => {
        await restoreUser(e.target.dataset.id);
      });
    });
  }

  // =========================================================
  // Logik: Änderungen über Supabase-API
  // =========================================================
  async function toggleRole(userId) {
    const u = users.find(x => x.id === userId);
    if (!u || isProtected(u)) return;

    const newRole = u.role === "admin" ? "member" : "admin";
    const { error } = await supabase.from("users").update({ role: newRole }).eq("id", userId);

    if (error) {
      alert("Fehler beim Ändern der Rolle.");
      return;
    }

    u.role = newRole;
    renderTable();
  }

  async function toggleStatus(userId) {
    const u = users.find(x => x.id === userId);
    if (!u || isProtected(u)) return;

    const newStatus = u.status === "aktiv" ? "geblockt" : "aktiv";
    const { error } = await supabase.from("users").update({ status: newStatus }).eq("id", userId);

    if (error) {
      alert("Fehler beim Ändern des Status.");
      return;
    }

    u.status = newStatus;
    renderTable();
  }

  async function softDelete(userId) {
    const u = users.find(x => x.id === userId);
    if (!u || isProtected(u)) return;

    if (u.deleted) return alert("Benutzer ist bereits als gelöscht markiert.");
    if (!confirm(`Soll der Benutzer "${u.username}" wirklich entfernt werden?`)) return;

    const { error } = await supabase.from("users").update({ deleted: true }).eq("id", userId);
    if (error) {
      alert("Fehler beim Entfernen des Benutzers.");
      return;
    }

    u.deleted = true;
    renderTable();
  }

  async function restoreUser(userId) {
    const u = users.find(x => x.id === userId);
    if (!u) return alert("Benutzer nicht gefunden.");
    if (!u.deleted) return alert("Dieser Benutzer ist nicht gelöscht.");

    if (!confirm(`"${u.username}" wieder an Bord holen?`)) return;

    const { error } = await supabase.from("users").update({ deleted: false }).eq("id", userId);
    if (error) {
      alert("Fehler beim Reaktivieren des Benutzers.");
      return;
    }

    u.deleted = false;
    renderTable();
  }

  // =========================================================
  // Schutzregeln
  // =========================================================
  function isProtected(user) {
    if (user.id === founderId) {
      alert("Dieser Benutzer ist der Gründer-Admin und kann nicht geändert werden.");
      return true;
    }
    if (user.id === currentUserData.id) {
      alert("Du kannst dich nicht selbst ändern, Kapitän!");
      return true;
    }
    
    return false;
  }

  function capitalize(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  Logbuch.log("Mitgliederverwaltung v2.1 geladen – Supabase aktiv ⚓");
});