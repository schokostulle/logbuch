// ===========================================================
// dashboard.js – Supabase-Integration
// Version: 2.1 – 03.11.2025
// Beschreibung:
// - Vollständige Anbindung an Supabase (keine LocalStorage-Nutzung)
// - Admins dürfen posten und löschen
// - Normale Member können nur lesen
// ===========================================================

import { Logbuch } from "./logbuch.js";

document.addEventListener("DOMContentLoaded", async () => {
  const dashboardLogs = document.getElementById("dashboardLogs");
  const postSection = document.getElementById("adminPostSection");
  const postForm = document.getElementById("postForm");
  const postTitle = document.getElementById("postTitle");
  const postMessage = document.getElementById("postMessage");

  // 🔐 Supabase-Client prüfen
  if (!window.supabase) {
    console.error("❌ Supabase ist nicht initialisiert! (logbuch.js fehlt?)");
    alert("Fehler: Keine Verbindung zur Datenbank.");
    return;
  }

  // 🔐 Aktuellen Benutzer prüfen
  const { data: sessionData, error: sessionError } = await window.supabase.auth.getUser();
  if (sessionError || !sessionData?.user) {
    alert("Keine gültige Sitzung – bitte erneut anmelden.");
    window.location.href = "login.html";
    return;
  }

  const authUser = sessionData.user;

  // 🔎 Benutzerrolle ermitteln
  const { data: currentUser, error: userError } = await window.supabase
    .from("users")
    .select("id, username, role, status")
    .eq("id", authUser.id)
    .single();

  if (userError || !currentUser) {
    alert("Benutzer konnte nicht geladen werden.");
    window.location.href = "login.html";
    return;
  }

  if (currentUser.status !== "aktiv") {
    alert("Zugang verweigert – Benutzer ist nicht aktiv.");
    window.location.href = "login.html";
    return;
  }

  const isAdmin = currentUser.role.toLowerCase() === "admin";

  // 📋 Einträge laden
  await renderEntries();

  // Nur Admins dürfen posten
  if (isAdmin) {
    postSection.style.display = "block";

    postForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const title = postTitle.value.trim();
      const message = postMessage.value.trim();

      if (!title || !message) return alert("Titel und Nachricht erforderlich.");

      const { error } = await window.supabase.from("dashboard_entries").insert([
        {
          user_id: currentUser.id,
          title,
          message,
        },
      ]);

      if (error) {
        console.error("Fehler beim Speichern:", error);
        alert("Fehler beim Erstellen des Eintrags.");
        return;
      }

      postTitle.value = "";
      postMessage.value = "";
      await renderEntries();
    });
  } else {
    postSection.style.display = "none";
  }

  // =========================================================
  // Einträge laden & anzeigen
  // =========================================================
  async function renderEntries() {
    dashboardLogs.innerHTML = "<p><em>Lade Einträge …</em></p>";

    const { data: entries, error } = await window.supabase
      .from("dashboard_entries")
      .select("id, user_id, title, message, created_at, deleted")
      .eq("deleted", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fehler beim Laden:", error);
      dashboardLogs.innerHTML = "<p><em>Fehler beim Laden der Einträge.</em></p>";
      return;
    }

    if (!entries || entries.length === 0) {
      dashboardLogs.innerHTML = "<p><em>Noch keine Einträge im Logbuch.</em></p>";
      return;
    }

    dashboardLogs.innerHTML = "";

    // Benutzer-Namen für Zuordnung laden
    const { data: allUsers } = await window.supabase.from("users").select("id, username");

    entries.forEach((entry) => {
      const entryDiv = document.createElement("div");
      entryDiv.classList.add("log-entry");

      const titleEl = document.createElement("h3");
      titleEl.classList.add("log-title");
      titleEl.textContent = entry.title;

      const messageEl = document.createElement("p");
      messageEl.classList.add("log-message");
      messageEl.textContent = entry.message;

      const author = allUsers.find((u) => u.id === entry.user_id)?.username || "Unbekannt";
      const date = new Date(entry.created_at).toLocaleString("de-DE");

      const footerEl = document.createElement("div");
      footerEl.classList.add("log-footer");
      footerEl.textContent = `${date} – ${author}`;

      // 🗑️ Nur Admins dürfen löschen
      if (isAdmin) {
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "🗑️ Löschen";
        deleteBtn.classList.add("delete-btn");
        deleteBtn.addEventListener("click", () => deleteEntry(entry.id));
        footerEl.appendChild(deleteBtn);
      }

      entryDiv.appendChild(titleEl);
      entryDiv.appendChild(messageEl);
      entryDiv.appendChild(footerEl);
      dashboardLogs.appendChild(entryDiv);
    });
  }

  // =========================================================
  // Soft Delete für Einträge (Admins)
  // =========================================================
  async function deleteEntry(id) {
    if (!confirm("Eintrag wirklich löschen, Kapitän?")) return;

    const { error } = await window.supabase
      .from("dashboard_entries")
      .update({ deleted: true })
      .eq("id", id);

    if (error) {
      console.error("Fehler beim Löschen:", error);
      alert("Fehler beim Löschen des Eintrags.");
      return;
    }

    await renderEntries();
  }

  Logbuch.log("Dashboard v2.1 – Supabase aktiv, Soft-Delete & Admin-Posting aktiv ⚓");
});