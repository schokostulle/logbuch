// js/navigation.js
// Linkes Navigationsmenü mit Auth- & Rollenprüfung
// Klassischer Seitenwechsel (kein fetch)

import { getCurrentUser, logoutUser } from "./auth.js";
import { supabase } from "./supabase.js";

const nav = document.getElementById("nav-container");

async function buildNavigation() {

    if (!nav) return;

    /* --------------------------------------------------------------
       Auth prüfen
       -------------------------------------------------------------- */
    const user = await getCurrentUser();
    if (!user) {
        window.location.href = "../index.html";
        return;
    }

    /* --------------------------------------------------------------
       Rolle laden
       -------------------------------------------------------------- */
    const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (error || !profile) {
        window.location.href = "../index.html";
        return;
    }

    const isAdmin = profile.role === "Admin";

    /* --------------------------------------------------------------
       Aktuelle Seite bestimmen (für .active)
       -------------------------------------------------------------- */
    const currentPath = window.location.pathname;

    const isActive = (path) => currentPath.includes(path)
        ? "active"
        : "";

    /* --------------------------------------------------------------
       Navigation aufbauen
       -------------------------------------------------------------- */
    nav.innerHTML = `
        <div class="nav-header">
            <div class="nav-title">
                ⚓ <span class="nav-label">Logbuch</span>
            </div>
        </div>

        <div class="nav-links">

            <a class="nav-item ${isActive("dashboard")}" href="../dashboard/dashboard.html">
                <span class="nav-icon">📯</span>
                <span class="nav-label">Dashboard</span>
            </a>

            <a class="nav-item ${isActive("fleet")}" href="../fleet/fleet.html">
                <span class="nav-icon">⛵</span>
                <span class="nav-label">Flotte</span>
            </a>

            <a class="nav-item ${isActive("reports")}" href="../reports/reports.html">
                <span class="nav-icon">📜</span>
                <span class="nav-label">Berichte</span>
            </a>

            <a class="nav-item ${isActive("map")}" href="../map/map.html">
                <span class="nav-icon">🗺️</span>
                <span class="nav-label">Karte</span>
            </a>

            <a class="nav-item ${isActive("reservation")}" href="../reservation/reservation.html">
                <span class="nav-icon">📍</span>
                <span class="nav-label">Reservierungen</span>
            </a>

            <a class="nav-item ${isActive("calculation")}" href="../calculation/calculation.html">
                <span class="nav-icon">📐</span>
                <span class="nav-label">Berechnung</span>
            </a>

            ${isAdmin ? `
                <a class="nav-item ${isActive("member")}" href="../member/member.html">
                    <span class="nav-icon">🪖</span>
                    <span class="nav-label">Mitglieder</span>
                </a>

                <a class="nav-item ${isActive("csv")}" href="../csv/csv.html">
                    <span class="nav-icon">📂</span>
                    <span class="nav-label">CSV</span>
                </a>

                <a class="nav-item ${isActive("diplomacy")}" href="../diplomacy/diplomacy.html">
                    <span class="nav-icon">🕊️</span>
                    <span class="nav-label">Diplomatie</span>
                </a>

                <a class="nav-item ${isActive("chrono")}" href="../chrono/chrono.html">
                    <span class="nav-icon">⏳</span>
                    <span class="nav-label">Chrono</span>
                </a>
            ` : ""}

            <a class="nav-item" id="logout">
                <span class="nav-icon">⛩️</span>
                <span class="nav-label">Logout</span>
            </a>

        </div>
    `;

    /* --------------------------------------------------------------
       Logout
       -------------------------------------------------------------- */
    document.getElementById("logout")?.addEventListener("click", async (e) => {
        e.preventDefault();
        await logoutUser();
        window.location.href = "../index.html";
    });
}

/* --------------------------------------------------------------
   Init
   -------------------------------------------------------------- */
buildNavigation();