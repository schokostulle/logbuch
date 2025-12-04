// dashboard.js
//
// Start-Dashboard der Community-Webapp
// Lädt eine kleine Übersicht + Beispiel-Widgets für Statistiken

import { supabase } from "./supabase.js";
import { getCurrentUser } from "./auth.js";


/* ==========================================================================
   DOM Ziel
   ========================================================================== */

const container = document.getElementById("tool-content");



/* ==========================================================================
   Dashboard anzeigen
   ========================================================================== */

export async function loadDashboard() {

    if (!container) return;

    const user = await getCurrentUser();
    const username = user?.email || "Benutzer";

    // Beispiel: kleine Übersichtskarten
    const html = `
        <h2 class="tool-title-local">Übersicht</h2>

        <div class="dashboard-grid">

            <div class="dash-card">
                <div class="dash-title">Willkommen</div>
                <div class="dash-value">${username}</div>
                <div class="dash-note">Schön, dass du wieder da bist.</div>
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

        <