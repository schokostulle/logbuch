// member/member.js
//
// Mitgliederverwaltung für Admins
// Läuft ausschließlich auf member/member.html
// Kein dynamisches Nachladen von HTML-Seiten

import { getCurrentUser } from "../js/auth.js";
import { supabase } from "../js/supabase.js";


/* ==========================================================================
   DOM Referenzen
   ========================================================================== */

const tableBody = document.getElementById("member-table-body");
const statusBox = document.getElementById("member-status");


/* ==========================================================================
   Statusanzeige
   ========================================================================== */

function showStatus(message, type = "info") {
    if (!statusBox) return;
    statusBox.innerHTML = `<div class="${type}-box">${message}</div>`;
}



/* ==========================================================================
   Mitglieder laden
   ========================================================================== */

async function loadMembers() {

    if (!tableBody) return;

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
   Speicheraktionen
   ========================================================================== */

function activateActions() {

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
   Init – wird beim Laden von member.html ausgeführt
   ========================================================================== */

document.addEventListener("DOMContentLoaded", loadMembers);