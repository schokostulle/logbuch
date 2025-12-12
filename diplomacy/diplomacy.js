import { supabase } from "../js/supabase.js";

/* ==========================================================================
   DOM
   ========================================================================== */

const allianceBody = document.getElementById("alliance-body");
const playerBody   = document.getElementById("player-body");

/* ==========================================================================
   STATUS-DEFINITION
   ========================================================================== */

const STATUS_OPTIONS = [
    { value: "neutral",   label: "Neutral" },
    { value: "friendly",  label: "Freundlich" },
    { value: "hostile",   label: "Feindlich" }
];

/* ==========================================================================
   HELFER
   ========================================================================== */

function statusSelect(current = "neutral") {
    return `
        <select class="status-select">
            ${STATUS_OPTIONS.map(s =>
                `<option value="${s.value}" ${s.value === current ? "selected" : ""}>
                    ${s.label}
                 </option>`
            ).join("")}
        </select>
    `;
}

function setRowStatusClass(tr, status) {
    tr.classList.remove("status-neutral", "status-friendly", "status-hostile");
    tr.classList.add(`status-${status}`);
}

/* ==========================================================================
   ALLIANZEN
   ========================================================================== */

async function loadAlliances() {

    /* eindeutige Allianzen aus CSV */
    const { data: csvAlliances } = await supabase
        .from("csv_data")
        .select("alliance_id, alliance_tag")
        .neq("alliance_id", null)
        .group("alliance_id, alliance_tag");

    /* Basis-Datensätze sicherstellen */
    for (const a of csvAlliances) {
        await supabase
            .from("diplomacy_alliances")
            .upsert({
                alliance_id: a.alliance_id,
                alliance_tag: a.alliance_tag,
                status: "neutral"
            }, { onConflict: "alliance_id" });
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

        setRowStatusClass(tr, a.status);

        tr.querySelector(".save-btn").addEventListener("click", async () => {
            const status = tr.querySelector("select").value;

            /* Allianzstatus speichern */
            await supabase
                .from("diplomacy_alliances")
                .update({ status })
                .eq("alliance_id", a.alliance_id);

            /* VERERBUNG → alle Spieler dieser Allianz */
            await supabase
                .from("diplomacy_players")
                .update({ status })
                .eq("alliance_id", a.alliance_id);

            setRowStatusClass(tr, status);
            loadPlayers(); // Spieleransicht aktualisieren
        });

        allianceBody.appendChild(tr);
    });
}

/* ==========================================================================
   SPIELER
   ========================================================================== */

async function loadPlayers() {

    /* eindeutige Spieler aus CSV */
    const { data: csvPlayers } = await supabase
        .from("csv_data")
        .select("player_id, player_name, alliance_id")
        .neq("player_id", null)
        .group("player_id, player_name, alliance_id");

    /* Basis-Datensätze sicherstellen */
    for (const p of csvPlayers) {
        await supabase
            .from("diplomacy_players")
            .upsert({
                player_id: p.player_id,
                player_name: p.player_name,
                alliance_id: p.alliance_id,
                status: "neutral"
            }, { onConflict: "player_id" });
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

        setRowStatusClass(tr, p.status);

        tr.querySelector(".save-btn").addEventListener("click", async () => {
            const status = tr.querySelector("select").value;

            await supabase
                .from("diplomacy_players")
                .update({ status })
                .eq("player_id", p.player_id);

            setRowStatusClass(tr, status);
        });

        playerBody.appendChild(tr);
    });
}

/* ==========================================================================
   INIT
   ========================================================================== */

loadAlliances();
loadPlayers();