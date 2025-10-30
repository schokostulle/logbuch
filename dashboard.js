// ===========================================================
// dashboard.js – Logbuch-Projekt
// Version: 1.3 – 02.11.2025
// Autor: Kapitän
// Beschreibung:
// - Logeinträge werden ohne Tabelle dargestellt
// - Titel = rot & fett (Zeile 1)
// - Nachricht = Fließtext (Zeile 2)
// - Fußnote = Datum + Benutzername (Zeile 3, kleiner & sandfarben)
// - Admins dürfen neue Einträge erstellen und löschen
// ===========================================================

const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");

if (!currentUser) {
  window.location.href = "gate.html";
}

const role = currentUser?.role?.toLowerCase() || "";

document.addEventListener("DOMContentLoaded", () => {
  const postSection = document.getElementById("adminPostSection");
  const postForm = document.getElementById("postForm");
  const postTitle = document.getElementById("postTitle");
  const postMessage = document.getElementById("postMessage");
  const dashboardLogs = document.getElementById("dashboardLogs");

  // Nur Admins sehen Eingabeformular
  if (role === "admin") {
    postSection.style.display = "block";

    postForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const title = postTitle.value.trim();
      const message = postMessage.value.trim();

      if (!title || !message) return;

      const now = new Date();
      const timestamp = now.toLocaleString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const entry = {
        id: crypto.randomUUID(),
        title,
        message,
        user: currentUser.name,
        date: timestamp,
      };

      const entries = JSON.parse(localStorage.getItem("dashboardEntries") || "[]");
      entries.unshift(entry);
      localStorage.setItem("dashboardEntries", JSON.stringify(entries));

      postTitle.value = "";
      postMessage.value = "";
      renderEntries();
    });
  }

  renderEntries();

  // ----------------------------------------------------------
  // Logbucheinträge anzeigen (ohne Tabelle)
  // ----------------------------------------------------------
  function renderEntries() {
    dashboardLogs.innerHTML = "";
    const entries = JSON.parse(localStorage.getItem("dashboardEntries") || "[]");

    if (entries.length === 0) {
      dashboardLogs.innerHTML = `<p><em>Noch keine Einträge im Logbuch.</em></p>`;
      return;
    }

    entries.forEach((entry) => {
      const entryDiv = document.createElement("div");
      entryDiv.classList.add("log-entry");

      // Titel (rot, fett)
      const titleEl = document.createElement("h3");
      titleEl.classList.add("log-title");
      titleEl.textContent = entry.title;

      // Nachricht (Fließtext)
      const messageEl = document.createElement("p");
      messageEl.classList.add("log-message");
      messageEl.textContent = entry.message;

      // Fußnote (Datum & Benutzer)
      const footerEl = document.createElement("div");
      footerEl.classList.add("log-footer");
      footerEl.textContent = `${entry.date} – ${entry.user}`;

      // Löschbutton (nur Admins)
      if (role === "admin") {
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

  // ----------------------------------------------------------
  // Eintrag löschen (nur Admin)
  // ----------------------------------------------------------
  function deleteEntry(id) {
    if (!confirm("Eintrag wirklich löschen, Kapitän?")) return;

    let entries = JSON.parse(localStorage.getItem("dashboardEntries") || "[]");
    entries = entries.filter((e) => e.id !== id);
    localStorage.setItem("dashboardEntries", JSON.stringify(entries));

    renderEntries();
  }
});