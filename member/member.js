// member/member.js
//
// Mitgliederverwaltung für Admins
// Voraussetzungen:
// - Supabase Tabelle "profiles" mit Feldern: id, username, role, status
// - Nur Admins haben Zugriff (Navigation filtert bereits)

import { getCurrentUser } from "../js/auth.js";
import { supabase } from "../js/supabase.js";


/* ==========================================================================
   DOM Elemente
   ========================================================================== */

const tableBody = document.getElementById("member-table-body");
const statusBox = document.getElementById("member-status");


/* ==========================================================================
   Statusanzeige
   ========================================================================== */

function showStatus(message, type = "info") {
    statusBox.innerHTML = `<div class="${type}-box">${message}</div>`;
}



/* ==========================================================================
   Mitglieder laden
   ========================================================================== */

async function loadMembers() {

    const user = await getCurrentUser();
    if (!user) {
        showStatus("Nicht angemeldet.", "error");
        return;
    }

    // Eigene ID, um Selbstbearbeitung zu verhindern
    const currentUserId = user.id;

    const { data, error } = await supabase
        .from("profiles")
        .select("id, username, role, status")
        .order("username", { ascending: true });

    if (error) {
        showStatus("Fehler beim Laden der Mitglieder.", "error");
        return;
    }

    tableBody.innerHTML = "";

    data.forEach(row => {

        const isSelf = row.id === currentUserId;
        const disabledAttr = isSelf ? "disabled" : "";

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${row.username}</td>

            <td>
                <select data-id="${row.id}" class="role-select" ${disabledAttr}>
                    <option value="Admin"  ${row.role === "Admin" ? "selected" : ""}>Admin</option>
                    <option value="Member" ${row.role === "Member" ? "selected" : ""}>Member</option>
                </select>
            </td>

            <td>
                <select data-id="${row.id}" class="status-select" ${disabledAttr}>
                    <option value="aktiv"    ${row.status === "aktiv" ? "selected" : ""}>aktiv</option>
                    <option value="blockiert" ${row.status === "blockiert" ? "selected" : ""}>blockiert</option>
                    <option value="gelöscht"  ${row.status === "gelöscht" ? "selected" : ""}>gelöscht</option>
                </select>
            </td>

            <td>
                <button class="btn btn-secondary save-btn" data-id="${row.id}" ${disabledAttr}>
                    Speichern
                </button>
            </td>
        `;

        tableBody.appendChild(tr);
    });

    activateActions();
}



/* ==========================================================================
   Aktionen aktivieren (Speichern)
   ========================================================================== */

function activateActions() {

    const saveButtons = document.querySelectorAll(".save-btn");

    saveButtons.forEach(btn => {
        btn.addEventListener("click", async () => {

            const id = btn.getAttribute("data-id");
            const roleSelect = document.querySelector(`.role-select[data-id="${id}"]`);
            const statusSelect = document.querySelector(`.status-select[data-id="${id}"]`);

            const newRole = roleSelect.value;
            const newStatus = statusSelect.value;

            const { error } = await supabase
                .from("profiles")
                .update({
                    role: newRole,
                    status: newStatus
                })
                .eq("id", id);

            if (error) {
                showStatus("Änderung konnte nicht gespeichert werden.", "error");
                return;
            }

            showStatus("Änderung gespeichert.", "success");
            loadMembers();
        });
    });
}



/* ==========================================================================
   Init
   ========================================================================== */

loadMembers();