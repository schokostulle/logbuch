// diplomacy.js — Phase D
// Frontend-Status + Vererbung
// KEINE Speicherung
// KEIN CSS
// KEIN csv_data Update

import { supabase } from "../js/supabase.js";

/* DOM */
const allianceBody = document.getElementById("diplomacy-alliance-body");
const playerBody   = document.getElementById("diplomacy-player-body");

/* Status */
const STATUS = ["friendly", "neutral", "hostile"];
const ICON = {
    friendly: "🟢",
    neutral: "🟡",
    hostile: "🔴"
};

/* Frontend-State */
const allianceStatusMap = new Map(); // alliance_id -> status
const playerStatusMap   = new Map(); // player_id   -> status (manuell)

/* =========================================================
   STATUS ICONS
   ========================================================= */

function statusIcons(current, onChange) {
    const wrapper = document.createElement("div");

    STATUS.forEach(status => {
        const btn = document.createElement("button");
        btn.textContent = ICON[status];
        btn.dataset.status = status;

        if (status === current) {
            btn.disabled = true;
        }

        btn.onclick = () => onChange(status);
        wrapper.appendChild(btn);
    });

    return wrapper;
}

/* =========================================================
   ALLIANZEN
   ========================================================= */

async function loadAlliances() {
    const { data, error } = await supabase
        .from("csv_data")
        .select("alliance_id, alliance_tag")
        .not("alliance_id", "is", null);

    if (error) return console.error(error);

    const map = new Map();
    data.forEach(r => {
        if (!map.has(r.alliance_id)) {
            map.set(r.alliance_id, r.alliance_tag);
            if (!allianceStatusMap.has(r.alliance_id)) {
                allianceStatusMap.set(r.alliance_id, "neutral");
            }
        }
    });

    allianceBody.innerHTML = "";

    for (const [id, tag] of map.entries()) {
        const tr = document.createElement("tr");

        const status = allianceStatusMap.get(id);

        const statusCell = document.createElement("td");
        statusCell.appendChild(
            statusIcons(status, newStatus => {
                allianceStatusMap.set(id, newStatus);
                renderPlayers(); // Vererbung
                loadAlliances(); // Re-render
            })
        );

        tr.innerHTML = `
            <td>${id}</td>
            <td>${tag ?? ""}</td>
        `;
        tr.appendChild(statusCell);
        allianceBody.appendChild(tr);
    }
}

/* =========================================================
   SPIELER
   ========================================================= */

let playerSource = [];

async function loadPlayers() {
    const { data, error } = await supabase
        .from("csv_data")
        .select("player_id, player_name, alliance_id")
        .not("player_id", "is", null);

    if (error) return console.error(error);

    const map = new Map();
    data.forEach(r => {
        if (!map.has(r.player_id)) {
            map.set(r.player_id, {
                name: r.player_name,
                alliance_id: r.alliance_id
            });
        }
    });

    playerSource = [...map.entries()];
    renderPlayers();
}

function renderPlayers() {
    playerBody.innerHTML = "";

    for (const [id, info] of playerSource) {

        // Statusauflösung:
        // 1. Manuell gesetzter Spielerstatus
        // 2. Allianzstatus
        // 3. neutral
        const status =
            playerStatusMap.get(id) ??
            allianceStatusMap.get(info.alliance_id) ??
            "neutral";

        const tr = document.createElement("tr");

        const statusCell = document.createElement("td");
        statusCell.appendChild(
            statusIcons(status, newStatus => {
                playerStatusMap.set(id, newStatus); // überschreibt Allianz
                renderPlayers();
            })
        );

        tr.innerHTML = `
            <td>${id}</td>
            <td>${info.name ?? ""}</td>
        `;
        tr.appendChild(statusCell);

        playerBody.appendChild(tr);
    }
}

/* =========================================================
   INIT
   ========================================================= */

loadAlliances();
loadPlayers();