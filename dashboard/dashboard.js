// dashboard.js
//
// Start-Dashboard der Community-Webapp
// Zeigt Nutzerbegrüßung + Beispiel-Statistiken.
//
// Funktioniert ausschließlich innerhalb dashboard.html
// und ersetzt NICHT den Seitenwechsel über navigation.js.

import { supabase } from "./js/supabase.js";
import { getCurrentUser } from "./js/auth.js";


/* ==========================================================================
   DOM Ziel
   ========================================================================== */

const container = document.getElementById("tool-content");



/* ==========================================================================
   Dashboard Render-Funktion
   ========================================================================== */

export async function loadDashboard() {

    if (!container) return;

    const user = await getCurrentUser();

    // Username aus profiles holen
    let username = "Gast";

    if (user) {
        const { data: profile } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", user.id)
            .single();

        if (profile?.username) username = profile.username;
    }

    /* Dashboard HTML */
    container.innerHTML = `
        <h2 class="tool-title-local">Übersicht</h2>

        <div class="dashboard-grid">

            <div class="dash-card">
                <div class="dash-title">Willkommen</div>
                <div class="dash-value">${username}</div>
                <div class="dash-note">Schön, dass du wieder an Bord bist.</div>
            </div>

            <div class="dash-card">
                <div class="dash-title">Mitglieder</div>
                <div class="dash-value" id="dash-members">–</div>
                <div class="dash-note">registrierte Nutzer</div>
            </div>

            <div class="dash-card">
                <div class="dash-title">Flotten</div>
                <div class="dash-value" id="dash-fleet">–</div>
                <div class="dash-note">eingetragene Schiffe</div>
            </div>

            <div class="dash-card">
                <div class="dash-title">Berichte</div>
                <div class="dash-value" id="dash-reports">–</div>
                <div class="dash-note">gespeicherte Einträge</div>
            </div>

        </div>
    `;

    loadStatistics();
}



/* ==========================================================================
   Statistik-Lader (optional unterstützend)
   ========================================================================== */

async function loadStatistics() {

    // Mitglieder zählen
    const { count: members } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

    document.getElementById("dash-members").textContent = members ?? "–";

    // Flotten zählen (falls Tabelle existiert)
    const { count: fleetCount } = await supabase
        .from("fleet")
        .select("*", { count: "exact", head: true });
    document.getElementById("dash-fleet").textContent =
        fleetCount !== null ? fleetCount : "–";

    // Berichte zählen (falls Tabelle existiert)
    const { count: reportCount } = await supabase
        .from("reports")
        .select("*", { count: "exact", head: true });
    document.getElementById("dash-reports").textContent =
        reportCount !== null ? reportCount : "–";
}



/* ==========================================================================
   Init – Dashboard automatisch laden
   ========================================================================== */

loadDashboard();