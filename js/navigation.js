// js/navigation.js
//
// Navigation links + Tool-Ladefunktion
// Rolle bestimmt, welche Tools sichtbar sind

import { getCurrentUser, logoutUser } from "./auth.js";
import { supabase } from "./supabase.js";


/* ==========================================================================
   Tools nach Rolle
   ========================================================================== */

const toolsAll = [
    { id: "dashboard",   label: "Dashboard" },
    { id: "flotte",      label: "Flotten" },
    { id: "reports",     label: "Berichte" },
    { id: "map",         label: "Karte" },
    { id: "reservation", label: "Reservierung" },
    { id: "calculation", label: "Rechner" }
];

const toolsAdmin = [
    { id: "member",      label: "Mitglieder" },
    { id: "csv",         label: "CSV" },
    { id: "diplomacy",   label: "Diplomatie" },
    { id: "chrono",      label: "Chrono" }
];


/* ==========================================================================
   Navigation generieren
   ========================================================================== */

async function buildNavigation() {

    const user = await getCurrentUser();
    if (!user) {
        window.location.href = "../index.html";
        return;
    }

    // Profil abrufen
    const { data: profile } = await supabase
        .from("profiles")
        .select("username, role")
        .eq("id", user.id)
        .single();

    const isAdmin = profile.role === "Admin";

    const nav = document.getElementById("nav-container");
    if (!nav) return;


    /* Navigation HTML */
    let html = `
        <div class="nav-header">
            <span class="nav-title">Community Webapp</span>
        </div>

        <ul class="nav-links">
    `;

    // Tools für alle
    toolsAll.forEach(tool => {
        html += `<li data-tool="${tool.id}" class="nav-item">${tool.label}</li>`;
    });

    // Adminbereich
    if (isAdmin) {
        html += `<li class="nav-section-title">Administration</li>`;
        toolsAdmin.forEach(tool => {
            html += `<li data-tool="${tool.id}" class="nav-item">${tool.label}</li>`;
        });
    }

    // Logout als normaler Navigationseintrag
    html += `
        <li class="nav-item logout" data-logout="true">Logout</li>
        </ul>
    `;

    nav.innerHTML = html;

    activateNavigation();
}


/* ==========================================================================
   Click-Handler aktivieren
   ========================================================================== */

function activateNavigation() {

    const items = document.querySelectorAll(".nav-item");

    items.forEach(item => {

        // Logout separat behandeln
        if (item.dataset.logout === "true") {
            item.addEventListener("click", async () => {
                await logoutUser();
                window.location.href = "../index.html";
            });
            return;
        }

        // Normale Tools laden
        item.addEventListener("click", () => {
            const tool = item.getAttribute("data-tool");
            loadToolContent(tool);

            // Titel setzen falls vorhanden
            if (window.setToolTitle) {
                window.setToolTitle(tool);
            }
        });
    });
}


/* ==========================================================================
   Tool laden
   ========================================================================== */

export async function loadToolContent(toolName) {
    const container = document.getElementById("tool-content");
    if (!container) return;

    try {
        const response = await fetch(`../${toolName}/${toolName}.html`);

        if (!response.ok) {
            container.innerHTML = `<p>Fehler: Tool konnte nicht geladen werden.</p>`;
            return;
        }

        const html = await response.text();
        container.innerHTML = html;

    } catch {
        container.innerHTML = `<p>Fehler beim Laden des Tools.</p>`;
    }
}


/* ==========================================================================
   Navigation starten
   ========================================================================== */

buildNavigation();

export default buildNavigation;

/* ==========================================================================
   Icon-Mapping für Navigation
   ========================================================================== */

const icons = {
    dashboard: "📜",
    flotte: "⛵",
    reports: "⚔️",
    map: "🗺️",
    reservation: "📌",
    calculation: "⚓",
    
    member: "👥",
    csv: "📂",
    diplomacy: "🤝",
    chrono: "⏳",

    logout: "🚪",
    header: "🧭"
};