// /logbuch/js/supabase.js — FINAL Version 1.0
// Zentrale Schnittstelle zwischen Frontend und Supabase
// Keine DOM- oder UI-Logik – nur API-Kommunikation

// ==================================================
// Grundkonfiguration
// ==================================================
const SUPABASE_URL = "https://bbeczprdumbeqcutqopr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiZWN6cHJkdW1iZXFjdXRxb3ByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NjMzMTgsImV4cCI6MjA3NzMzOTMxOH0.j2DiRK_40cSiFOM8KdA9DzjLklC9hXH_Es6mHPOvPQk"; // <- einsetzen

// Supabase-Client erstellen
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==================================================
// Hilfsfunktionen
// ==================================================
function makeFakeEmail(username) {
  return `${username.trim().toLowerCase()}@logbuch.fake`;
}

// ==================================================
// AUTHENTIFIZIERUNG
// ==================================================

/**
 * Registrierung eines Nutzers
 * Nutzt Username + Passwort über Fake-Mail
 * Supabase v2 erstellt KEINE Session, wenn Email-Verification OFF ist
 */
async function registerUser(username, password) {
  const email = makeFakeEmail(username);

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: { username } // optionales Metadata
    }
  });

  if (error) {
    console.error("[Supabase] Registrierung Fehler:", error);
    throw new Error(error.message);
  }

  // Registrierung erfolgreich – auch wenn user == null
  return {
    ok: true,
    user: data.user || null
  };
}

/**
 * Login eines Nutzers
 * Gibt IMMER { user, session, error } zurück
 */
async function loginUser(username, password) {
  const email = makeFakeEmail(username);

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  return { data, error };
}

/**
 * Logout
 */
async function logoutUser() {
  const { error } = await supabaseClient.auth.signOut();
  if (error) throw new Error(error.message);
  return true;
}

/**
 * Session abrufen
 * Gibt session oder null zurück
 */
async function getSession() {
  const { data, error } = await supabaseClient.auth.getSession();
  if (error) {
    console.error("[Supabase] getSession Fehler:", error);
    throw new Error(error.message);
  }
  return data?.session || null;
}

// ==================================================
// CRUD – Generische Funktionen für Tabellen
// ==================================================

/** Daten abrufen */
async function fetchData(table, filter = {}) {
  let query = supabaseClient.from(table).select("*");

  for (const [key, value] of Object.entries(filter)) {
    query = query.eq(key, value);
  }

  const { data, error } = await query;

  if (error) {
    console.error(`[Supabase] Fetch Fehler (${table}):`, error);
    throw new Error(`Fetch fehlgeschlagen: ${error.message}`);
  }

  return data;
}

/** Datensatz einfügen */
async function insertData(table, values) {
  const { data, error } = await supabaseClient
    .from(table)
    .insert(values)
    .select();

  if (error) {
    console.error(`[Supabase] Insert Fehler (${table}):`, error);
    throw new Error(`Insert fehlgeschlagen: ${error.message}`);
  }

  return data;
}

/** Datensatz aktualisieren */
async function updateData(table, id, values) {
  const { data, error } = await supabaseClient
    .from(table)
    .update(values)
    .eq("id", id)
    .select();

  if (error) {
    console.error(`[Supabase] Update Fehler (${table}):`, error);
    throw new Error(`Update fehlgeschlagen: ${error.message}`);
  }

  return data;
}

/** Datensatz löschen */
async function deleteData(table, id) {
  const { error } = await supabaseClient
    .from(table)
    .delete()
    .eq("id", id);

  if (error) {
    console.error(`[Supabase] Delete Fehler (${table}):`, error);
    throw new Error(`Delete fehlgeschlagen: ${error.message}`);
  }

  return true;
}

// ==================================================
// Globale Export-Schnittstelle
// ==================================================
window.supabaseAPI = {
  client: supabaseClient,

  // Auth
  makeFakeEmail,
  registerUser,
  loginUser,
  logoutUser,
  getSession,

  // CRUD
  fetchData,
  insertData,
  updateData,
  deleteData
};