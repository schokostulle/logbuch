import { supabase } from "../js/supabase.js";

/* ==========================================================
   DOM
   ========================================================== */

const toolContent = document.querySelector(".tool-content");

/* ==========================================================
   STATUS ICONS (nur Anzeige)
   ========================================================== */

function statusIcons(status = "neutral") {
    return `
        <span title="freundlich">🟢</span>
        <span title="neutral">🟡</span>
        <span title="feindlich">🔴</span>
    `;
}

/* ==========================================================
   ALLIANZEN – EINDEUTIG
   ========================================================== */

async function renderAlliances() {
    const { data, error } = await supabase
        .from("csv_data")
        .select("alliance_id, alliance_tag")
        .not("alliance_id", "is", null);

    if (error) {
        toolContent.innerHTML = "Fehler beim Laden der Allianzen";
        return;
    }

    const map = new Map();

    data.forEach(row => {
        if (!map.has(row.alliance_id)) {
            map.set(row.alliance_id, row.alliance_tag);
        }
    });

    const rows = [...map.entries()]
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([id, tag]) => `
            <tr>
                <td>${tag}</td>
                <td>${statusIcons()}</td>
            </tr>
        `)
        .join("");

    return `
        <h2>Allianzen</h2>
        <table class="member-table">
            <thead>
                <tr>
                    <th>Kürzel</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
    `;
}

/* ==========================================================
   SPIELER – EINDEUTIG
   ========================================================== */

async function renderPlayers() {
    const { data, error } = await supabase
        .from("csv_data")
        .select("player_id, player_name")
        .not("player_id", "is", null);

    if (error) {
        toolContent.innerHTML = "Fehler beim Laden der Spieler";
        return;
    }

    const map = new Map();

    data.forEach(row => {
        if (!map.has(row.player_id)) {
            map.set(row.player_id, row.player_name);
        }
    });

    const rows = [...map.entries()]
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([id, name]) => `
            <tr>
                <td>${name}</td>
                <td>${statusIcons()}</td>
            </tr>
        `)
        .join("");

    return `
        <h2>Spieler</h2>
        <table class="member-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
    `;
}

/* ==========================================================
   INIT – NUR RENDER
   ========================================================== */

async function initDiplomacy() {
    const alliancesHTML = await renderAlliances();
    const playersHTML   = await renderPlayers();

    toolContent.innerHTML = alliancesHTML + playersHTML;
}

initDiplomacy();