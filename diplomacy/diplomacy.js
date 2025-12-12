import { supabase } from "../js/supabase.js";

const allianceBody = document.getElementById("alliance-body");
const playerBody   = document.getElementById("player-body");

const STATUS_OPTIONS = ["neutral", "friendly", "hostile"];

/* Dropdown */
function statusSelect(value) {
    return `
        <select>
            ${STATUS_OPTIONS.map(s =>
                `<option value="${s}" ${s === value ? "selected" : ""}>${s}</option>`
            ).join("")}
        </select>
    `;
}

/* ---------------- ALLIANZEN ---------------- */

async function loadAlliances() {
    const { data } = await supabase
        .from("csv_data")
        .select("alliance_id, alliance_tag")
        .neq("alliance_id", null)
        .group("alliance_id, alliance_tag");

    for (const a of data) {
        await supabase.from("diplomacy_alliances").upsert({
            alliance_id: a.alliance_id,
            alliance_tag: a.alliance_tag
        });
    }

    const { data: alliances } = await supabase
        .from("diplomacy_alliances")
        .select("*")
        .order("alliance_tag");

    allianceBody.innerHTML = "";

    alliances.forEach(a => {
        const tr = document.createElement("tr");
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
                .update({ status })
                .eq("alliance_id", a.alliance_id);
        };

        allianceBody.appendChild(tr);
    });
}

/* ---------------- SPIELER ---------------- */

async function loadPlayers() {
    const { data } = await supabase
        .from("csv_data")
        .select("player_id, player_name")
        .neq("player_id", null)
        .group("player_id, player_name");

    for (const p of data) {
        await supabase.from("diplomacy_players").upsert({
            player_id: p.player_id,
            player_name: p.player_name
        });
    }

    const { data: players } = await supabase
        .from("diplomacy_players")
        .select("*")
        .order("player_name");

    playerBody.innerHTML = "";

    players.forEach(p => {
        const tr = document.createElement("tr");
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
                .update({ status })
                .eq("player_id", p.player_id);
        };

        playerBody.appendChild(tr);
    });
}

/* INIT */
loadAlliances();
loadPlayers();