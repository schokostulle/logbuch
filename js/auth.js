// js/auth.js
//
// Authentifizierung mit Username + Passwort (sichtbar für User)
// Intern für Supabase wird username@logbuch.fake genutzt

import { supabase } from "./supabase.js";


/* ==========================================================================
   Hilfsfunktion: Fake-Mail generieren
   ========================================================================== */

function toFakeMail(username) {
    return `${username.toLowerCase()}@logbuch.fake`;
}



/* ==========================================================================
   LOGIN
   ========================================================================== */

export async function loginUser(username, password) {
    try {
        const email = toFakeMail(username);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            return { error: error.message };
        }

        // Profil prüfen
        const profileCheck = await fetchUserProfile(data.user.id);

        if (profileCheck.error) {
            return { error: profileCheck.error };
        }

        if (profileCheck.status !== "aktiv") {
            await supabase.auth.signOut();
            return { error: "Account nicht aktiv (blockiert oder gelöscht)." };
        }

        return { user: data.user };

    } catch (e) {
        return { error: "Unbekannter Fehler beim Login." };
    }
}



/* ==========================================================================
   REGISTRIERUNG
   ========================================================================== */

export async function registerUser(username, password) {
    try {
        const email = toFakeMail(username);

        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });

        if (error) {
            return { error: error.message };
        }

        // Falls RLS/Trigger deaktiviert sind:
        // Profil manuell anlegen, falls nicht vorhanden
        await ensureProfileExists(data.user.id, username);

        return { user: data.user };

    } catch (e) {
        return { error: "Unbekannter Fehler bei der Registrierung." };
    }
}



/* ==========================================================================
   PROFIL ANLEGEN (nur falls kein Trigger aktiv)
   ========================================================================== */

async function ensureProfileExists(userId, username) {
    try {
        // Prüfen, ob Profil existiert
        const { data } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", userId)
            .single();

        if (data) return; // existiert bereits

        // Neues Profil anlegen: Standard Member + blockiert
        await supabase
            .from("profiles")
            .insert({
                id: userId,
                username: username,
                role: "Member",
                status: "blockiert"
            });

    } catch (e) {
        console.warn("Profil konnte nicht automatisch angelegt werden.");
    }
}



/* ==========================================================================
   AKTIVEN USER LADEN
   ========================================================================== */

export async function getCurrentUser() {
    const { data } = await supabase.auth.getUser();
    if (!data || !data.user) return null;

    const user = data.user;

    const profile = await fetchUserProfile(user.id);
    if (profile.error) return null;

    if (profile.status !== "aktiv") {
        await supabase.auth.signOut();
        return null;
    }

    return user;
}



/* ==========================================================================
   PROFIL LADEN
   ========================================================================== */

async function fetchUserProfile(userId) {
    try {
        const { data, error } = await supabase
            .from("profiles")
            .select("username, role, status")
            .eq("id", userId)
            .single();

        if (error) {
            return { error: "Profil konnte nicht geladen werden." };
        }

        return data;

    } catch {
        return { error: "Profilfehler." };
    }
}



/* ==========================================================================
   LOGOUT
   ========================================================================== */

export async function logoutUser() {
    await supabase.auth.signOut();
}