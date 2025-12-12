import { supabase } from "../js/supabase.js";

const allianceBody = document.getElementById("alliance-body");
const playerBody   = document.getElementById("player-body");

const STATUS = ["neutral", "friendly", "hostile"];

/* =========================================
   STATUS-DROPDOWN
   ========================================= */

function statusSelect(value = "neutral") {
    return `
        <select class="status-select">
            ${STATUS.map(s =>
                `<option value="${s}" ${s === value ? "selected" : ""}>${s}</option>`
            ).join("")}
        </select>
    `;
}

/* =========================================
   ALLIANZEN
   Quelle: diplomacy_alliance_view
   ========================================= */

async function loadAlliances() {

    const { data, error } = await supabase
        .from("diplomacy_alliance_view")
        .select("*")
        .order("alliance_tag");

    if (error) {
        console.error(error);
        return;
    }

    allianceBody.innerHTML = "";

    data.forEach(a => {

        const tr = document.createElement("tr");
        tr.className = `status-${a.status || "neutral"}`;

        tr.innerHTML = `
            <td>${a.alliance_id}</td>
            <td>${a.alliance_tag}</td>
            <td>${statusSelect(a.status)}</td>
            <td><button class="save-btn">Speichern</button></td>
        `;

        tr.querySelector(".save-btn").onclick = async () => {
            const status = tr.querySelector("select").value;

            await supabase
                .from("diplomacy_alliances")
                .upsert({
                    alliance_id: a.alliance_id,
                    status
                });

            /* KEINE JS-Vererbung!
               DB-Trigger erledigt das korrekt */
            await loadAlliances();
            await loadPlayers();
        };

        allianceBody.appendChild(tr);
    });
}

/* =========================================
   SPIELER
   Quelle: diplomacy_player_view
   ========================================= */

async function loadPlayers() {

    const { data, error } = await supabase
        .from("diplomacy_player_view")
        .select("*")
        .order("player_name");

    if (error) {
        console.error(error);
        return;
    }

    playerBody.innerHTML = "";

    data.forEach(p => {

        const tr = document.createElement("tr");
        tr.className = `status-${p.status || "neutral"}`;

        tr.innerHTML = `
            <td>${p.player_id}</td>
            <td>${p.player_name}</td>
            <td>${statusSelect(p.status)}</td>
            <td><button class="save-btn">Speichern</button></td>
        `;

        tr.querySelector(".save-btn").onclick = async () => {
            const status = tr.querySelector("select").value;

            await supabase
                .from("diplomacy_players")
                .upsert({
                    player_id: p.player_id,
                    status
                });

            await loadPlayers();
        };

        playerBody.appendChild(tr);
    });
}

/* =========================================
   INIT
   ========================================= */

loadAlliances();
loadPlayers();