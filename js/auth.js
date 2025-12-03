// js/auth.js
//
// Zentrale Authentifizierung + Profilprüfung
// Nutzt supabase.js für die Verbindung

import { supabase } from "./supabase.js";


/* ==========================================================================
   Login
   ========================================================================== */

export async function loginUser(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            return { error: error.message };
        }

        // Erfolg → Profilprüfung
        const profileCheck = await fetchUserProfile(data.user.id);
        if (profileCheck.error) {
            return { error: profileCheck.error };
        }

        // Nur aktive User dürfen rein
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
   Registrierung
   ========================================================================== */

export async function registerUser(email, password) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });

        if (error) {
            return { error: error.message };
        }

        // Profil wird durch deinen Trigger später automatisch erzeugt
        // Solange RLS/Trigger aus: Profile wird evtl. manuell gepflegt

        return { user: data.user };

    } catch (e) {
        return { error: "Unbekannter Fehler bei der Registrierung." };
    }
}



/* ==========================================================================
   Aktuellen User laden
   ========================================================================== */

export async function getCurrentUser() {
    const { data } = await supabase.auth.getUser();
    if (!data || !data.user) return null;

    const user = data.user;

    // Profil prüfen
    const profile = await fetchUserProfile(user.id);
    if (profile.error) return null;

    // Blockierte/gelöschte User erhalten keinen Zugriff
    if (profile.status !== "aktiv") {
        await supabase.auth.signOut();
        return null;
    }

    return user;
}



/* ==========================================================================
   Profil laden
   ========================================================================== */

async function fetchUserProfile(userId) {
    try {
        const { data, error } = await supabase
            .from("profiles")
            .select("role, status")
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
   Logout
   ========================================================================== */

export async function logoutUser() {
    await supabase.auth.signOut();
}