// js/navigation.js
//
// Navigation links + Tool-Ladefunktion
// mit Symbolen vor jedem Menüpunkt

import { getCurrentUser, logoutUser } from "./auth.js";
import { supabase } from "./supabase.js";


/* ==========================================================================
   Icons
   ========================================================================== */

const icons = {
    dashboard:   "📜",
    flotte:      "⛵",
    reports:     "⚔️",
    map:         "🗺️",
    reservation: "📌",
    calculation: "⚓",

    member:      "🪖",
    csv:         "📂",
    diplomacy:   "🕊️",
    chrono:      "⏳",

    logout:      "⛩️",
    header:      "🧭"
};


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

    const { data: profile } = await supabase
        .from("profiles")
        .select("username, role")
        .eq("id", user.id)
        .single();

    const isAdmin = profile.role === "Admin";
    const nav = document.getElementById("nav-container");
    if (!nav) return;


    /* Header */
    let html = `
        <div class="nav-header">
            <span class="nav-title">
                <span class="nav-icon">${icons.header}</span>
                <span class="nav-label">Logbuch</span>
            </span>
        </div>

        <ul class="nav-links">
    `;

    /* Tools für alle */
    toolsAll.forEach(tool => {
        html += `
            <li data-tool="${tool.id}" class="nav-item">
                <span class="nav-icon">${icons[tool.id]}</span>
                <span class="nav-label">${tool.label}</span>
            </li>`;
    });

    /* Admin */
    if (isAdmin) {
        html += `<li class="nav-section-title">Administration</li>`;

        toolsAdmin.forEach(tool => {
            html += `
            <li data-tool="${tool.id}" class="nav-item">
                <span class="nav-icon">${icons[tool.id]}</span>
                <span class="nav-label">${tool.label}</span>
            </li>`;
        });
    }

    /* Logout */
    html += `
        <li class="nav-item logout" data-logout="true">
            <span class="nav-icon">${icons.logout}</span>
            <span class="nav-label">Logout</span>
        </li>
    `;

    html += `</ul>`;

    nav.innerHTML = html;

    activateNavigation();
}



/* ==========================================================================
   Click-Handler
   ========================================================================== */

function activateNavigation() {

    const items = document.querySelectorAll(".nav-item");

    items.forEach(item => {

        /* Logout */
        if (item.dataset.logout === "true") {
            item.addEventListener("click", async () => {
                await logoutUser();
                window.location.href = "../index.html";
            });
            return;
        }

        /* Normale Tools */
        item.addEventListener("click", () => {
            const tool = item.getAttribute("data-tool");
            loadToolContent(tool);

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

        container.innerHTML = await response.text();

    } catch (e) {
        container.innerHTML = `<p>Fehler beim Laden des Tools.</p>`;
    }
}


/* ==========================================================================
   Start
   ========================================================================== */

buildNavigation();

export default buildNavigation;