// js/navigation.js
//
// Permanente Navigation links + HTML-Seitenwechsel
// Keine fetch-Befehle. Jedes Tool hat eine eigene HTML-Seite.
//
// Beispielpfade:
//   /dashboard/dashboard.html
//   /member/member.html
//   /map/map.html
//

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
   Tool-Definitionen
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
   Navigation erzeugen
   ========================================================================== */

async function buildNavigation() {

    const user = await getCurrentUser();
    if (!user) {
        window.location.href = "../index.html";
        return;
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    const isAdmin = profile?.role === "Admin";

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
            <li class="nav-item" data-tool="${tool.id}">
                <span class="nav-icon">${icons[tool.id]}</span>
                <span class="nav-label">${tool.label}</span>
            </li>
        `;
    });


    /* Adminbereich */
    if (isAdmin) {
        html += `<li class="nav-section-title">Administration</li>`;

        toolsAdmin.forEach(tool => {
            html += `
                <li class="nav-item" data-tool="${tool.id}">
                    <span class="nav-icon">${icons[tool.id]}</span>
                    <span class="nav-label">${tool.label}</span>
                </li>
            `;
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
   Klick-Handler: Seitenwechsel
   ========================================================================== */

function activateNavigation() {

    const items = document.querySelectorAll(".nav-item");

    items.forEach(item => {

        // Logout
        if (item.dataset.logout === "true") {
            item.addEventListener("click", async () => {
                await logoutUser();