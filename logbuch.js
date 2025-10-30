/* ==========================================================
   LOGBUCH – Datenmodul (v1.0)
   Unterstützt localStorage – Supabase-ready Architektur
   ========================================================== */

// Toggle: false = localStorage aktiv, true = Supabase aktiv
const USE_SUPABASE = false;

// --- Supabase Setup (nur relevant, wenn USE_SUPABASE = true) ---
let supabase = null;
if (USE_SUPABASE) {
  const SUPABASE_URL = "https://YOUR_SUPABASE_URL.supabase.co";
  const SUPABASE_KEY = "YOUR_PUBLIC_ANON_KEY";
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

// -------------------------------------------------------------
// Zentrale Logbuch-API (egal ob lokal oder Supabase)
// -------------------------------------------------------------
export const Logbuch = {
  // 📦 Daten speichern
  async save(key, data) {
    if (USE_SUPABASE) {
      // --- Supabase: Tabelle = key, data = Array oder Objekt ---
      const { error } = await supabase.from(key).insert(data);
      if (error) console.error("SUPABASE SAVE ERROR:", error);
    } else {
      // --- localStorage ---
      localStorage.setItem(key, JSON.stringify(data));
    }
  },

  // 📦 Daten laden
  async load(key) {
    if (USE_SUPABASE) {
      const { data, error } = await supabase.from(key).select("*");
      if (error) {
        console.error("SUPABASE LOAD ERROR:", error);
        return [];
      }
      return data || [];
    } else {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    }
  },

  // 🗑️ Daten löschen
  async remove(key) {
    if (USE_SUPABASE) {
      const { error } = await supabase.from(key).delete().neq("id", 0);
      if (error) console.error("SUPABASE DELETE ERROR:", error);
    } else {
      localStorage.removeItem(key);
    }
  },

  // 🧭 Userstatus / Session (optional)
  getCurrentUser() {
    if (USE_SUPABASE && supabase.auth) {
      const user = supabase.auth.getUser();
      return user?.email || "Unbekannt";
    } else {
      return localStorage.getItem("user") || "Gast";
    }
  },

  setCurrentUser(name) {
    if (!USE_SUPABASE) {
      localStorage.setItem("user", name);
    }
  },

  // 🔄 Utility: Debug-Log
  log(...args) {
    console.log("[Logbuch]", ...args);
  }
};

// =============================================================
// Benutzeranzeige – v11.6 (Build 30.10.2025)
// Zeigt auf allen Seiten den aktuellen Benutzer und seine Rolle
// =============================================================

document.addEventListener("DOMContentLoaded", () => {
  const userBox = document.querySelector(".user-status");
  if (!userBox) return; // Falls Seite keinen Bereich hat

  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");

  if (!currentUser) {
    userBox.textContent = "Nicht angemeldet";
    return;
  }

  // Symbol abhängig von Rolle
  const roleSymbol = currentUser.role === "Admin" ? "⚓" : "👤";

  // Formatierte Ausgabe
  userBox.textContent = `${roleSymbol} ${currentUser.name} – ${currentUser.role}`;
});