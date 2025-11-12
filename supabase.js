// /logbuch/js/supabase.js — Version 0.3 (Online-Betrieb über Supabase)
// Zweck: Zentrale Schnittstelle zwischen Frontend (Index, Dashboard, etc.) und Supabase
// Hinweis: Keine UI- oder Logiksteuerung — nur Verbindung und Datenoperationen

// ==========================
// Grundkonfiguration
// ==========================

// !!! API-Daten anpassen !!!
const SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

// Supabase-Client erstellen
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================
// Hilfsfunktionen
// ==========================

// E-Mail-Maskierung für Fake-Authentifizierung
function makeFakeEmail(username) {
  return `${username.toLowerCase()}@logbuch.fake`;
}

// ==========================
// Authentifizierungs-Funktionen
// ==========================

/**
 * Registrierung mit Username + Passwort (Fake-Mail)
 */
async function registerUser(username, password) {
  const email = makeFakeEmail(username);
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: { data: { username } }
  });
  if (error) throw error;
  return data;
}

/**
 * Login mit Username + Passwort (Fake-Mail)
 */
async function loginUser(username, password) {
  const email = makeFakeEmail(username);
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });
  if (error) throw error;
  return data;
}

/**
 * Logout
 */
async function logoutUser() {
  const { error } = await supabaseClient.auth.signOut();
  if (error) throw error;
  return true;
}

/**
 * Aktive Session abrufen
 */
async function getSession() {
  const { data, error } = await supabaseClient.auth.getSession();
  if (error) throw error;
  return data?.session || null;
}

// ==========================
// Beispiel-CRUD-Vorlagen (für spätere Tools)
// ==========================

/**
 * Datensatz abrufen
 */
async function fetchData(table, filter = {}) {
  let query = supabaseClient.from(table).select("*");
  for (const [key, value] of Object.entries(filter)) {
    query = query.eq(key, value);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Datensatz hinzufügen
 */
async function insertData(table, values) {
  const { data, error } = await supabaseClient.from(table).insert(values).select();
  if (error) throw error;
  return data;
}

/**
 * Datensatz aktualisieren
 */
async function updateData(table, id, values) {
  const { data, error } = await supabaseClient.from(table).update(values).eq("id", id).select();
  if (error) throw error;
  return data;
}

/**
 * Datensatz löschen
 */
async function deleteData(table, id) {
  const { error } = await supabaseClient.from(table).delete().eq("id", id);
  if (error) throw error;
  return true;
}

// ==========================
// Export
// ==========================
window.supabaseAPI = {
  client: supabaseClient,
  makeFakeEmail,
  registerUser,
  loginUser,
  logoutUser,
  getSession,
  fetchData,
  insertData,
  updateData,
  deleteData
};