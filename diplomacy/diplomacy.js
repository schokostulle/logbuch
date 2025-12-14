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
        btn.type = "button";
        btn.textContent = ICON[status];
        btn.disabled = status === current;
        btn.onclick = () => onChange(status);
        wrap.appendChild(btn);
    });

    if (onReset) {
        const reset = document.createElement("button");
        reset.type = "button";
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

    const allianceMap = new Map();
    csvAlliances.forEach(a => {
        if (!allianceMap.has(a.alliance_id)) {
            allianceMap.set(a.alliance_id, a.alliance_tag);
        }
    });

    /* gespeicherte Allianz-Status */
    const { data: stored } = await supabase
        .from("diplomacy_alliances")
        .select("*");

    const statusMap = new Map();
    stored.forEach(a => statusMap.set(a.alliance_id, a.status));

    allianceBody.innerHTML = "";

    for (const [allianceId, tag] of allianceMap.entries()) {

        const status = statusMap.get(allianceId) || "neutral";

        const tr = document.createElement("tr");
        tr.className = `status-${status}`;

        const statusCell = document.createElement("td");

        statusCell.appendChild(
            statusIcons(status, async newStatus => {

                /* Allianzstatus speichern */
                await supabase
                    .from("diplomacy_alliances")
                    .upsert({
                        alliance_id: allianceId,
                        alliance_tag: tag,
                        status: newStatus
                    });

                /* 👇 KORREKTE VERERBUNG: Spieler-Overrides löschen */
                const { data: players } = await supabase
                    .from("csv_data")
                    .select("player_id")
                    .eq("alliance_id", allianceId)
                    .neq("player_id", null);

                const ids = players.map(p => p.player_id);

                if (ids.length) {
                    await supabase
                        .from("diplomacy_players")
                        .delete()
                        .in("player_id", ids);
                }

                loadAlliances();
                loadPlayers();
            })
        );

        tr.innerHTML = `
            <td>${allianceId}</td>
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

    const playerMap = new Map();
    csvPlayers.forEach(p => {
        if (!playerMap.has(p.player_id)) {
            playerMap.set(p.player_id, {
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

    for (const [playerId, p] of playerMap.entries()) {

        const inherited = allianceStatus.get(p.alliance_id) || "neutral";
        const override  = playerStatus.get(playerId);
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
                            player_id: playerId,
                            player_name: p.name,
                            status: newStatus
                        });

                    loadPlayers();
                },

                /* Override entfernen → zurück zur Allianz */
                async () => {
                    await supabase
                        .from("diplomacy_players")
                        .delete()
                        .eq("player_id", playerId);

                    loadPlayers();
                }
            )
        );

        tr.innerHTML = `
            <td>${playerId}</td>
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