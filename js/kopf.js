// js/kopf.js
//
// Kopfzeile (Sticky Header)
// Zeile 1: rechts – User + Rolle (Cormorant)
// Zeile 2: links – aktueller Seitentitel (Almendra, Gold)

import { getCurrentUser } from "./auth.js";
import { supabase } from "./supabase.js";

/* ==========================================================================
   DOM Ziel
   ========================================================================== */

const kopfContainer = document.getElementById("kopf-container");

/* ==========================================================================
   Seitentitel aus URL ableiten
   ========================================================================== */

function getPageTitle() {
    const path = window.location.pathname.toLowerCase();

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
   Rollen-Icon
   ========================================================================== */

function getRoleIcon(role) {
    return role === "Admin" ? "🎖️" : "🪖";
}

/* ==========================================================================
   Header bauen
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

    kopfContainer.innerHTML = `
        <div class="kopf-zeile oben" style="
            justify-content: flex-end;
            font-family: var(--font-serif);
        ">
            <div class="user-info">
                ${getRoleIcon(profile.role)}
                ${profile.username} (${profile.role})
            </div>
        </div>

        <div class="kopf-zeile unten" style="
            justify-content: flex-start;
        ">
            <div class="tool-title" style="
                font-family: var(--font-smallcaps);
                color: var(--color-brass);
            ">
                ${getPageTitle()}
            </div>
        </div>
    `;
}

/* ==========================================================================
   Init
   ========================================================================== */

buildHeader();