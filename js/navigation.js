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
       Navigation aufbauen
       -------------------------------------------------------------- */
    nav.innerHTML = `
        <div class="nav-header">
            <span class="nav-title">
                <span class="nav-icon">⚓</span>
                <span class="nav-label">Logbuch</span>
            </span>
        </div>

        <ul class="nav-links">

            <li class="nav-item">
                <a href="../dashboard/dashboard.html">
                    <span class="nav-icon">📯</span>
                    <span class="nav-label">Dashboard</span>
                </a>
            </li>

            <li class="nav-item">
                <a href="../fleet/fleet.html">
                    <span class="nav-icon">⛵</span>
                    <span class="nav-label">Flotte</span>
                </a>
            </li>

            <li class="nav-item">
                <a href="../reports/reports.html">
                    <span class="nav-icon">📜</span>
                    <span class="nav-label">Berichte</span>
                </a>
            </li>

            <li class="nav-item">
                <a href="../map/map.html">
                    <span class="nav-icon">🗺️</span>
                    <span class="nav-label">Karte</span>
                </a>
            </li>

            <li class="nav-item">
                <a href="../reservation/reservation.html">
                    <span class="nav-icon">📍</span>
                    <span class="nav-label">Reservierungen</span>
                </a>
            </li>

            <li class="nav-item">
                <a href="../calculation/calculation.html">
                    <span class="nav-icon">📐</span>
                    <span class="nav-label">Berechnung</span>
                </a>
            </li>

            ${isAdmin ? `
           /* <li class="nav-section-title">Administration</li> 

*/

            <li class="nav-item">
                <a href="../member/member.html">
                    <span class="nav-icon">🪖</span>
                    <span class="nav-label">Mitglieder</span>
                </a>
            </li>

            <li class="nav-item">
                <a href="../csv/csv.html">
                    <span class="nav-icon">📂</span>
                    <span class="nav-label">CSV</span>
                </a>
            </li>

            <li class="nav-item">
                <a href="../diplomacy/diplomacy.html">
                    <span class="nav-icon">🕊️</span>
                    <span class="nav-label">Diplomatie</span>
                </a>
            </li>

            <li class="nav-item">
                <a href="../chrono/chrono.html">
                    <span class="nav-icon">⏳</span>
                    <span class="nav-label">Chrono</span>
                </a>
            </li>
            ` : ""}

            <li class="nav-item logout" id="logout">
                <span class="nav-icon">⛩️</span>
                <span class="nav-label">Logout</span>
            </li>

        </ul>
    `;

    /* --------------------------------------------------------------
       Logout
       -------------------------------------------------------------- */
    document.getElementById("logout")?.addEventListener("click", async () => {
        await logoutUser();
        window.location.href = "../index.html";
    });
}

/* --------------------------------------------------------------
   Init
   -------------------------------------------------------------- */
buildNavigation();