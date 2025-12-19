import { supabase } from "../js/supabase.js";

/* ==========================================================
   DOM
   ========================================================== */

const allianceBody = document.getElementById("alliance-table-body");
const playerBody   = document.getElementById("player-table-body");

/* ==========================================================
   STATUS SELECT (Anzeige + Wert)
   ========================================================== */

function statusSelect(defaultStatus = "neutral") {
    return `
        <select class="status-select" data-status="${defaultStatus}">
            <option value="neutral" ${defaultStatus === "neutral" ? "selected" : ""}>
                Neutral
            </option>
            <option value="friendly" ${defaultStatus === "friendly" ? "selected" : ""}>
                Freundlich
            </option>
            <option value="hostile" ${defaultStatus === "hostile" ? "selected" : ""}>
                Feindlich
            </option>
        </select>
    `;
}

/* ==========================================================
   ALLIANZEN – EINDEUTIG (alliance_id)
   ========================================================== */

async function renderAlliances() {

    const { data, error } = await supabase
        .from("csv_data")
        .select("alliance_id, alliance_tag")
        .not("alliance_id", "is", null);

    if (error) {
        allianceBody.innerHTML =
            `<tr><td colspan="3">Fehler beim Laden der Allianzen</td></tr>`;
        return;
    }

    const map = new Map();

    data.forEach(row => {
        if (!map.has(row.alliance_id)) {
            map.set(row.alliance_id, row.alliance_tag);
        }
    });

    allianceBody.innerHTML = [...map.entries()]
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([id, tag]) => `
            <tr data-alliance-id="${id}" class="status-neutral">
                <td>${tag}</td>
                <td>${statusSelect("neutral")}</td>
                <td>
                    <button class="save-btn">Speichern</button>
                </td>
            </tr>
        `)
        .join("");
}

/* ==========================================================
   SPIELER – EINDEUTIG (player_id)
   ========================================================== */

async function renderPlayers() {

    const { data, error } = await supabase
        .from("csv_data")
        .select("player_id, player_name")
        .not("player_id", "is", null);

    if (error) {
        playerBody.innerHTML =
            `<tr><td colspan="3">Fehler beim Laden der Spieler</td></tr>`;
        return;
    }

    const map = new Map();

    data.forEach(row => {
        if (!map.has(row.player_id)) {
            map.set(row.player_id, row.player_name);
        }
    });

    playerBody.innerHTML = [...map.entries()]
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([id, name]) => `
            <tr data-player-id="${id}" class="status-neutral">
                <td>${name}</td>
                <td>${statusSelect("neutral")}</td>
                <td>
                    <button class="save-btn">Speichern</button>
                </td>
            </tr>
        `)
        .join("");
}

/* ==========================================================
   INIT – NUR RENDER
   ========================================================== */

async function initDiplomacy() {
    await renderAlliances();
    await renderPlayers();
}

initDiplomacy();