// =============================================================
// logbuch.js – Supabase Initialisierung (v2.1-fix)
// =============================================================

// Stelle sicher, dass das Supabase SDK geladen ist
if (!window.supabase || !window.supabase.createClient) {
  console.error("❌ Supabase SDK wurde nicht geladen!");
}

// Supabase-Client erzeugen
const SUPABASE_URL = "https://bbeczprdumbeqcutqopr.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiZWN6cHJkdW1iZXFjdXRxb3ByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NjMzMTgsImV4cCI6MjA3NzMzOTMxOH0.j2DiRK_40cSiFOM8KdA9DzjLklC9hXH_Es6mHPOvPQk"; // ← hier dein echter anon key
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Global verfügbar machen
window.supabaseClient = supabaseClient;
export const supabase = supabaseClient;
// =============================================================
// ⚓ Zentrale Logbuch-API
// =============================================================

export const Logbuch = {
  // 📦 Eintrag speichern
  async save(table, data) {
    try {
      const { error } = await supabaseClient.from(table).insert(data);
      if (error) throw error;
      console.log(`✅ Gespeichert in ${table}`, data);
    } catch (err) {
      console.error(`❌ Fehler beim Speichern in ${table}:`, err.message);
    }
  },

  // 📦 Daten laden
  async load(table, filter = null) {
    try {
      let query = supabase.from(table).select("*");
      if (filter) query = query.match(filter);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error(`❌ Fehler beim Laden aus ${table}:`, err.message);
      return [];
    }
  },

  // 🗑️ Daten löschen
  async remove(table, filter = null) {
    try {
      let query = supabase.from(table).delete();
      if (filter) query = query.match(filter);

      const { error } = await query;
      if (error) throw error;
      console.log(`🗑️ Daten aus ${table} gelöscht`);
    } catch (err) {
      console.error(`❌ Fehler beim Löschen aus ${table}:`, err.message);
    }
  },

  // ⚙️ Datensatz aktualisieren
  async update(table, filter, values) {
    try {
      const { error } = await supabaseClient.from(table).update(values).match(filter);
      if (error) throw error;
      console.log(`🧭 ${table} aktualisiert:`, filter);
    } catch (err) {
      console.error(`❌ Fehler beim Update in ${table}:`, err.message);
    }
  },

  // =============================================================
  // 👤 Benutzerfunktionen
  // =============================================================

  async getCurrentUser() {
    try {
      const { data, error } = await supabaseClient.auth.getUser();
      if (error) throw error;
      return data?.user || null;
    } catch (err) {
      console.error("❌ Fehler beim Abrufen des Benutzers:", err.message);
      return null;
    }
  },

  async signIn(email, password) {
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      console.log("✅ Angemeldet als:", data.user.email);
      return data.user;
    } catch (err) {
      console.error("❌ Anmeldung fehlgeschlagen:", err.message);
      return null;
    }
  },

  async signOut() {
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
      console.log("👋 Abgemeldet");
    } catch (err) {
      console.error("❌ Fehler beim Abmelden:", err.message);
    }
  },

  async register(email, password) {
    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      console.log("✅ Registrierung erfolgreich:", data.user.email);
      return data.user;
    } catch (err) {
      console.error("❌ Registrierung fehlgeschlagen:", err.message);
      return null;
    }
  },

  // =============================================================
  // 🔍 Debugging / Kontrolle
  // =============================================================

  async testConnection() {
    try {
      const { data, error } = await supabaseClient.from("users").select("id").limit(1);
      if (error) throw error;
      console.log("✅ Supabase-Verbindung aktiv");
      return true;
    } catch (err) {
      console.error("⚠️ Keine Verbindung zu Supabase:", err.message);
      return false;
    }
  },

  log(...args) {
    console.log("[Logbuch]", ...args);
  },
};

// =============================================================
// 👁️ Benutzeranzeige – zeigt Name & Rolle (Supabase only)
// =============================================================
document.addEventListener("DOMContentLoaded", async () => {
  const userBox = document.querySelector(".user-status");
  if (!userBox) return;

  try {
    const { data } = await supabaseClient.auth.getUser();
    const user = data?.user;

    if (!user) {
      userBox.textContent = "Nicht angemeldet";
      return;
    }

    // Benutzerrolle aus users-Tabelle laden (falls vorhanden)
    const { data: userInfo } = await supabaseClient
      .from("users")
      .select("username, role")
      .eq("id", user.id)
      .single();

    const name = userInfo?.username || user.email;
    const role = userInfo?.role || "member";
    const roleSymbol = role === "admin" ? "⚓" : "👤";

    userBox.textContent = `${roleSymbol} ${name} – ${role}`;
  } catch (err) {
    console.error("❌ Benutzeranzeige fehlgeschlagen:", err.message);
    userBox.textContent = "Fehler bei Benutzeranzeige";
  }
});