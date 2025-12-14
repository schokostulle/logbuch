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

/* Cache */
const allianceStatus = new Map(); // alliance_id -> status
const playerStatus   = new Map(); // player_id   -> status

/* =========================================================
   STATUS ICONS
   ========================================================= */

function statusIcons(current, onChange) {
    const wrap = document.createElement("div");

    STATUS.forEach(s => {
        const btn = document.createElement("button");
        btn.textContent = ICON[s];
        btn.disabled = s === current;
        btn.onclick = () => onChange(s);
        wrap.appendChild(btn);
    });

    return wrap;
}

/* =========================================================
   ALLIANZEN
   ========================================================= */

async function loadAlliances() {

    /* CSV-Quelle */
    const { data: csv } = await supabase
        .from("csv_data")
        .select("alliance_id, alliance_tag")
        .not("alliance_id", "is", null);

    const unique = new Map();
    csv.forEach(r => {
        if (!unique.has(r.alliance_id)) {
            unique.set(r.alliance_id, r.alliance_tag);
        }
    });

    /* gespeicherte Status */
    const { data: saved } = await supabase
        .from("diplomacy_alliances")
        .select("*");

    saved.forEach(a => allianceStatus.set(a.alliance_id, a.status));

    allianceBody.innerHTML = "";

    for (const [id, tag] of unique.entries()) {

        const status = allianceStatus.get(id) ?? "neutral";

        const tr = document.createElement("tr");

        const statusCell = document.createElement("td");
        statusCell.appendChild(
            statusIcons(status, async newStatus => {

                allianceStatus.set(id, newStatus);

                await supabase
                    .from("diplomacy_alliances")
                    .upsert({ alliance_id: id, status: newStatus });

                loadPlayers();
                loadAlliances();
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

async function loadPlayers() {

    const { data: csv } = await supabase
        .from("csv_data")
        .select("player_id, player_name, alliance_id")
        .not("player_id", "is", null);

    const unique = new Map();
    csv.forEach(r => {
        if (!unique.has(r.player_id)) {
            unique.set(r.player_id, {
                name: r.player_name,
                alliance_id: r.alliance_id
            });
        }
    });

    const { data: saved } = await supabase
        .from("diplomacy_players")
        .select("*");

    playerStatus.clear();
    saved.forEach(p => playerStatus.set(p.player_id, p.status));

    playerBody.innerHTML = "";

    for (const [id, info] of unique.entries()) {

        const resolvedStatus =
            playerStatus.get(id) ??
            allianceStatus.get(info.alliance_id) ??
            "neutral";

        const tr = document.createElement("tr");

        const statusCell = document.createElement("td");
        statusCell.appendChild(
            statusIcons(resolvedStatus, async newStatus => {

                /* Spieler überschreibt Allianz */
                playerStatus.set(id, newStatus);

                await supabase
                    .from("diplomacy_players")
                    .upsert({ player_id: id, status: newStatus });

                loadPlayers();
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