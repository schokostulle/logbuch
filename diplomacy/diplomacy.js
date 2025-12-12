import { supabase } from "../js/supabase.js";

const allianceBody = document.getElementById("alliance-body");
const playerBody   = document.getElementById("player-body");

const STATUS = ["neutral", "friendly", "hostile"];

function statusSelect(value) {
    return `
        <select class="status-select">
            ${STATUS.map(s =>
                `<option value="${s}" ${s === value ? "selected" : ""}>${s}</option>`
            ).join("")}
        </select>
    `;
}

/* =========================
   ALLIANZEN
   ========================= */

async function loadAlliances() {
    const { data } = await supabase
        .from("diplomacy_alliance_view")
        .select("*")
        .order("alliance_tag");

    allianceBody.innerHTML = "";

    data.forEach(a => {
        const tr = document.createElement("tr");
        tr.className = `status-${a.status}`;

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

            /* Vererbung auf Spieler */
            await supabase
                .from("diplomacy_players")
                .update({ status })
                .eq("player_id", a.alliance_id);

            loadAlliances();
            loadPlayers();
        };

        allianceBody.appendChild(tr);
    });
}

/* =========================
   SPIELER
   ========================= */

async function loadPlayers() {
    const { data } = await supabase
        .from("diplomacy_player_view")
        .select("*")
        .order("player_name");

    playerBody.innerHTML = "";

    data.forEach(p => {
        const tr = document.createElement("tr");
        tr.className = `status-${p.status}`;

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

            loadPlayers();
        };

        playerBody.appendChild(tr);
    });
}

/* INIT */
loadAlliances();
loadPlayers();