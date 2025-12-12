// js/kopf.js
//
// Kopfzeile (Sticky Header)
// Zeile 1 rechts: Username + Rolle
// Zeile 2 links: Aktueller Tool-Name (aus URL abgeleitet)

import { getCurrentUser } from "./auth.js";
import { supabase } from "./supabase.js";

/* ==========================================================================
   DOM Ziel
   ========================================================================== */

const kopfContainer = document.getElementById("kopf-container");

/* ==========================================================================
   Tooltitel aus URL ableiten
   ========================================================================== */

function getToolTitleFromPath() {
    const path = window.location.pathname;

    if (path.includes("dashboard"))   return "Dashboard";
    if (path.includes("fleet"))       return "Flotte";
    if (path.includes("reports"))     return "Berichte";
    if (path.includes("map"))         return "Karte";
    if (path.includes("reservation")) return "Reservierungen";
    if (path.includes("calculation")) return "Berechnung";
    if (path.includes("member"))      return "Mitglieder";
    if (path.includes("csv"))         return "CSV";
    if (path.includes("diplomacy"))   return "Diplomatie";
    if (path.includes("chrono"))      return "Chrono";

    return "Logbuch";
}

/* ==========================================================================
   Header erzeugen
   ========================================================================== */

async function buildHeader() {

    if (!kopfContainer) return;

    const user = await getCurrentUser();
    if (!user) {
        window.location.href = "../index.html";
        return;
    }

    const { data: profile, error } = await supabase
        .from("profiles")
        .select("username, role")
        .eq("id", user.id)
        .single();

    if (error || !profile) {
        window.location.href = "../index.html";
        return;
    }

    const toolTitle = getToolTitleFromPath();

    kopfContainer.innerHTML = `
        <div class="kopf-zeile oben">
            <div class="user-info">
                ${profile.username} <span class="user-role">(${profile.role})</span>
            </div>
        </div>

        <div class="kopf-zeile unten">
            <div class="tool-title">${toolTitle}</div>
        </div>
    `;
}

/* ==========================================================================
   Init
   ========================================================================== */

buildHeader();