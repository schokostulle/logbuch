// =============================================================
// showStatusMessage.js – Globale Statusmeldungen
// Version: 1.0 – 04.11.2025
// =============================================================

export function showStatusMessage(message, type = "info", duration = 4000) {
  // Existierendes Element entfernen, falls vorhanden
  const oldMsg = document.querySelector(".status-message.show");
  if (oldMsg) oldMsg.remove();

  // Neues Element erzeugen
  const msg = document.createElement("div");
  msg.className = `status-message show status-${type}`;
  msg.textContent = message;

  document.body.appendChild(msg);

  // Automatisch ausblenden
  setTimeout(() => {
    msg.classList.remove("show");
    msg.style.opacity = 0;
    setTimeout(() => msg.remove(), 500);
  }, duration);
}

// Optional: globale Kurzform
window.showStatusMessage = showStatusMessage;