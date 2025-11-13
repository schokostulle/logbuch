// /logbuch/js/supabase.js — Version 0.3b (ohne Email-Bestätigung)
// Zentrale Schnittstelle zwischen Frontend (Index, Dashboard etc.) und Supabase
// Keine DOM- oder UI-Logik – nur API-Kommunikation

// ==========================
// Grundkonfiguration
// ==========================

// !!! Eigene Supabase-Projektwerte einsetzen !!!
const SUPABASE_URL = "https://bbeczprdumbeqcutqopr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiZWN6cHJkdW1iZXFjdXRxb3ByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NjMzMTgsImV4cCI6MjA3NzMzOTMxOH0.j2DiRK_40cSiFOM8KdA9DzjLklC9hXH_Es6mHPOvPQk";

// Supabase-Client (global)
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================
// Hilfsfunktionen
// ==========================

function makeFakeEmail(username) {
  return `${username.trim().toLowerCase()}@logbuch.fake`;
}

// ==========================
// Authentifizierung
// ==========================

/** Registrierung mit Username + Passwort (Fake-Mail) */
async function registerUser(username, password) {
  const email = makeFakeEmail(username);
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: { username },
    },
  });

  if (error) throw new Error(`Registrierung fehlgeschlagen: ${error.message}`);
  return data;
}

/** Login mit Username + Passwort (Fake-Mail) */
async function loginUser(username, password) {
  const email = makeFakeEmail(username);
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Login fehlgeschlagen: ${error.message}`);
  return data;
}

/** Logout */
async function logoutUser() {
  const { error } = await supabaseClient.auth.signOut();
  if (error) throw new Error(`Logout fehlgeschlagen: ${error.message}`);
  return true;
}

/** Aktive Session abrufen */
async function getSession() {
  const { data, error } = await supabaseClient.auth.getSession();
  if (error) throw new Error(`Sessionabruf fehlgeschlagen: ${error.message}`);
  return data?.session || null;
}

// ==========================
// CRUD-Funktionen (generisch)
// ==========================

async function fetchData(table, filter = {}) {
  let query = supabaseClient.from(table).select("*");
  for (const [key, value] of Object.entries(filter)) query = query.eq(key, value);
  const { data, error } = await query;
  if (error) throw new Error(`Fetch fehlgeschlagen: ${error.message}`);
  return data;
}

async function insertData(table, values) {
  const { data, error } = await supabaseClient.from(table).insert(values).select();
  if (error) throw new Error(`Insert fehlgeschlagen: ${error.message}`);
  return data;
}

async function updateData(table, id, values) {
  const { data, error } = await supabaseClient.from(table).update(values).eq("id", id).select();
  if (error) throw new Error(`Update fehlgeschlagen: ${error.message}`);
  return data;
}

async function deleteData(table, id) {
  const { error } = await supabaseClient.from(table).delete().eq("id", id);
  if (error) throw new Error(`Delete fehlgeschlagen: ${error.message}`);
  return true;
}

// ==========================
// Exportobjekt
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
  deleteData,
};