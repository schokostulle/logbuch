// js/kopf.js
//
// Header mit 2 Zeilen:
// Zeile 1 rechts: User (Rolle)
// Zeile 2 links: Titel des aktuellen Tools
//
// Stellt window.setToolTitle(tool) für navigation.js bereit.

import { getCurrentUser } from "./auth.js";
import { supabase } from "./supabase.js";


/* ==========================================================================
   DOM Ziel
   ========================================================================== */

const kopfContainer = document.getElementById("kopf-container");



/* ==========================================================================
   Header erzeugen
   ========================================================================== */

async function buildHeader() {

    const user = await getCurrentUser();
    if (!user) {
        window.location.href = "../index.html";
        return;
    }

    // Profil laden
    const { data: profile, error } = await supabase
        .from("profiles")
        .select("username, role")
        .eq("id", user.id)
        .single();

    if (error || !profile) {
        window.location.href = "../index.html";
        return;
    }

    const username = profile.username;
    const role = profile.role;

    // HTML (2 Zeilen)
    kopfContainer.innerHTML = `
        <div class="kopf-zeile oben">
            <div class="user-info">${username} (${role})</div>
        </div>

        <div class="kopf-zeile unten">
            <div id="tool-title" class="tool-title">Dashboard</div>
        </div>
    `;
}



/* ==========================================================================
   Tooltitel setzen (wird von navigation.js aufgerufen)
   ========================================================================== */

window.setToolTitle = function (toolName) {

    const titleElement = document.getElementById("tool-title");
    if (!titleElement) return;

    // Nav-Element finden
    const navItem = document.querySelector(`.nav-item[data-tool="${toolName}"]`);
    if (!navItem) {
        titleElement.textContent = toolName;
        return;
    }

    // NUR den Label-Text ziehen, NICHT das Icon
    const labelElement = navItem.querySelector(".nav-label");
    const label = labelElement ? labelElement.textContent.trim() : toolName;

    titleElement.textContent = label;
};



/* ==========================================================================
   Init
   ========================================================================== */

buildHeader();