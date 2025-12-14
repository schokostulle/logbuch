import { supabase } from "../js/supabase.js";

/* ==========================================================================
   KONSTANTEN
   ========================================================================== */

const allianceBody = document.getElementById("alliance-body");
const playerBody   = document.getElementById("player-body");

const STATUS = ["friendly", "neutral", "hostile"];

const ICON = {
    friendly: "🟢",
    neutral:  "🟡",
    hostile:  "🔴"
};

/* ==========================================================================
   STATUS-ICON-GRUPPE
   ========================================================================== */

function statusIcons(current, onChange, onReset = null) {
    const wrap = document.createElement("div");

    STATUS.forEach(status => {
        const btn = document.createElement("button");
        btn.textContent = ICON[status];
        btn.disabled = status === current;
        btn.onclick = () => onChange(status);
        wrap.appendChild(btn);
    });

    if (onReset) {
        const reset = document.createElement("button");
        reset.textContent = "🔄";
        reset.onclick = onReset;
        wrap.appendChild(reset);
    }

    return wrap;
}

/* ==========================================================================
   ALLIANZEN
   ========================================================================== */

async function loadAlliances() {

    /* eindeutige Allianzen aus CSV */
    const { data: csvAlliances } = await supabase
        .from("csv_data")
        .select("alliance_id, alliance_tag")
        .neq("alliance_id", null);

    const map = new Map();
    csvAlliances.forEach(a => {
        if (!map.has(a.alliance_id)) {
            map.set(a.alliance_id, a.alliance_tag);
        }
    });

    /* bestehende Diplomatie-Status */
    const { data: stored } = await supabase
        .from("diplomacy_alliances")
        .select("*");

    const statusMap = new Map();
    stored.forEach(a => statusMap.set(a.alliance_id, a.status));

    allianceBody.innerHTML = "";

    for (const [id, tag] of map.entries()) {
        const status = statusMap.get(id) || "neutral";

        const tr = document.createElement("tr");
        tr.className = `status-${status}`;

        const statusCell = document.createElement("td");
        statusCell.appendChild(
            statusIcons(status, async newStatus => {

                await supabase
                    .from("diplomacy_alliances")
                    .upsert({
                        alliance_id: id,
                        alliance_tag: tag,
                        status: newStatus
                    });

                /* Vererbung: Spieler-Overrides löschen */
                await supabase
                    .from("diplomacy_players")
                    .delete()
                    .in(
                        "player_id",
                        supabase
                            .from("csv_data")
                            .select("player_id")
                            .eq("alliance_id", id)
                    );

                loadAlliances();
                loadPlayers();
            })
        );

        tr.innerHTML = `
            <td>${id}</td>
            <td>${tag}</td>
        `;
        tr.appendChild(statusCell);

        allianceBody.appendChild(tr);
    }
}

/* ==========================================================================
   SPIELER
   ========================================================================== */

async function loadPlayers() {

    /* eindeutige Spieler aus CSV */
    const { data: csvPlayers } = await supabase
        .from("csv_data")
        .select("player_id, player_name, alliance_id")
        .neq("player_id", null);

    const map = new Map();
    csvPlayers.forEach(p => {
        if (!map.has(p.player_id)) {
            map.set(p.player_id, {
                name: p.player_name,
                alliance_id: p.alliance_id
            });
        }
    });

    /* Allianz-Status */
    const { data: alliances } = await supabase
        .from("diplomacy_alliances")
        .select("*");

    const allianceStatus = new Map();
    alliances.forEach(a => allianceStatus.set(a.alliance_id, a.status));

    /* Spieler-Overrides */
    const { data: players } = await supabase
        .from("diplomacy_players")
        .select("*");

    const playerStatus = new Map();
    players.forEach(p => playerStatus.set(p.player_id, p.status));

    playerBody.innerHTML = "";

    for (const [id, p] of map.entries()) {

        const inherited = allianceStatus.get(p.alliance_id) || "neutral";
        const override  = playerStatus.get(id);
        const status    = override || inherited;

        const tr = document.createElement("tr");
        tr.className = `status-${status}`;

        const statusCell = document.createElement("td");
        statusCell.appendChild(
            statusIcons(
                status,

                /* Override setzen */
                async newStatus => {
                    await supabase
                        .from("diplomacy_players")
                        .upsert({
                            player_id: id,
                            player_name: p.name,
                            status: newStatus
                        });

                    loadPlayers();
                },

                /* Reset → Override löschen */
                async () => {
                    await supabase
                        .from("diplomacy_players")
                        .delete()
                        .eq("player_id", id);

                    loadPlayers();
                }
            )
        );

        tr.innerHTML = `
            <td>${id}</td>
            <td>${p.name}</td>
        `;
        tr.appendChild(statusCell);

        playerBody.appendChild(tr);
    }
}

/* ==========================================================================
   INIT
   ========================================================================== */

loadAlliances();
loadPlayers();