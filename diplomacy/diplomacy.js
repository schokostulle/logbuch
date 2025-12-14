// diplomacy.js
// Phase C: Reine Anzeige
// - Datengrundlage: csv_data
// - Jede Allianz-ID / Spieler-ID genau 1×
// - Status nur visuell (🟡 neutral)
// - KEINE Speicherung
// - KEINE Vererbung
// - KEIN CSS

import { supabase } from "../js/supabase.js";

/* DOM */
const allianceBody = document.getElementById("diplomacy-alliance-body");
const playerBody   = document.getElementById("diplomacy-player-body");

/* Status-Icons (neutral voreingestellt) */
function statusIcons() {
    return `
        <button data-status="friendly" aria-label="freundlich">🟢</button>
        <button data-status="neutral" aria-label="neutral" class="active">🟡</button>
        <button data-status="hostile" aria-label="feindlich">🔴</button>
    `;
}

/* =========================================================
   ALLIANZEN – eindeutig aus csv_data
   ========================================================= */

async function loadAlliances() {

    const { data, error } = await supabase
        .from("csv_data")
        .select("alliance_id, alliance_tag")
        .not("alliance_id", "is", null);

    if (error) {
        console.error("Fehler beim Laden der Allianzen", error);
        return;
    }

    /* Eindeutige Allianzen */
    const map = new Map();

    data.forEach(row => {
        if (!map.has(row.alliance_id)) {
            map.set(row.alliance_id, row.alliance_tag);
        }
    });

    allianceBody.innerHTML = "";

    for (const [id, tag] of map.entries()) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${id}</td>
            <td>${tag ?? ""}</td>
            <td class="status-icons">
                ${statusIcons()}
            </td>
        `;
        allianceBody.appendChild(tr);
    }
}

/* =========================================================
   SPIELER – eindeutig aus csv_data
   ========================================================= */

async function loadPlayers() {

    const { data, error } = await supabase
        .from("csv_data")
        .select("player_id, player_name")
        .not("player_id", "is", null);

    if (error) {
        console.error("Fehler beim Laden der Spieler", error);
        return;
    }

    /* Eindeutige Spieler */
    const map = new Map();

    data.forEach(row => {
        if (!map.has(row.player_id)) {
            map.set(row.player_id, row.player_name);
        }
    });

    playerBody.innerHTML = "";

    for (const [id, name] of map.entries()) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${id}</td>
            <td>${name ?? ""}</td>
            <td class="status-icons">
                ${statusIcons()}
            </td>
        `;
        playerBody.appendChild(tr);
    }
}

/* =========================================================
   INIT
   ========================================================= */

loadAlliances();
loadPlayers();