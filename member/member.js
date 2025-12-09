// member/member.js
//
// Mitgliederverwaltung für Admins
// Zeigt alle User und erlaubt Rollen-/Statusänderungen.

import { getCurrentUser } from "../js/auth.js";
import { supabase } from "../js/supabase.js";


/* ==========================================================================
   DOM Elemente (können beim ersten Laden noch fehlen)
   ========================================================================== */

function getDomRefs() {
    return {
        tableBody: document.getElementById("member-table-body"),
        statusBox: document.getElementById("member-status")
    };
}


/* ==========================================================================
   Statusanzeige
   ========================================================================== */

function showStatus(message, type = "info") {
    const { statusBox } = getDomRefs();
    if (!statusBox) return;
    statusBox.innerHTML = `<div class="${type}-box">${message}</div>`;
}



/* ==========================================================================
   Mitglieder laden
   ========================================================================== */

async function loadMembers() {

    const { tableBody } = getDomRefs();
    if (!tableBody) {
        // Tool ist noch nicht geladen → nichts tun
        return;
    }

    const user = await getCurrentUser();
    if (!user) {
        showStatus("Nicht angemeldet.", "error");
        return;
    }

    const currentUserId = user.id;

    const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, username, role, status")
        .order("username", { ascending: true });

    if (error || !profiles) {
        showStatus("Fehler beim Laden der Mitglieder.", "error");
        return;
    }

    tableBody.innerHTML = "";

    profiles.forEach(member => {

        const isSelf = member.id === currentUserId;
        const disabledAttr = isSelf ? "disabled" : "";

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${member.username}</td>

            <td>
                <select class="role-select" data-id="${member.id}" ${disabledAttr}>
                    <option value="Admin"  ${member.role === "Admin" ? "selected" : ""}>Admin</option>
                    <option value="Member" ${member.role === "Member" ? "selected" : ""}>Member</option>
                </select>
            </td>

            <td>
                <select class="status-select" data-id="${member.id}" ${disabledAttr}>
                    <option value="aktiv"     ${member.status === "aktiv" ? "selected" : ""}>aktiv</option>
                    <option value="blockiert" ${member.status === "blockiert" ? "selected" : ""}>blockiert</option>
                    <option value="gelöscht"  ${member.status === "gelöscht" ? "selected" : ""}>gelöscht</option>
                </select>
            </td>

            <td>
                <button class="btn btn-secondary save-btn" data-id="${member.id}" ${disabledAttr}>
                    Speichern
                </button>
            </td>
        `;

        tableBody.appendChild(tr);
    });

    activateActions();
}



/* ==========================================================================
   Speicher-Buttons aktivieren
   ========================================================================== */

function activateActions() {
    const { tableBody } = getDomRefs();
    if (!tableBody) return;

    const saveButtons = tableBody.querySelectorAll(".save-btn");

    saveButtons.forEach(btn => {
        btn.addEventListener("click", async () => {

            const id = btn.dataset.id;

            const roleSelect   = tableBody.querySelector(`.role-select[data-id="${id}"]`);
            const statusSelect = tableBody.querySelector(`.status-select[data-id="${id}"]`);

            const newRole   = roleSelect.value;
            const newStatus = statusSelect.value;

            const { error } = await supabase
                .from("profiles")
                .update({ role: newRole, status: newStatus })
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
   Init – wird nach Laden des Fragments erneut aufgerufen
   ========================================================================== */

export function initMemberTool() {
    loadMembers();
}