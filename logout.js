// =============================================================
// logout.js – Supabase-only Logout
// Version: 2.0 – 02.11.2025
// Beendet die Supabase-Session vollständig
// =============================================================

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // 🚪 Abmelden über Supabase Auth
    const { error } = await window.supabase.auth.signOut();
    if (error) {
      console.error("Fehler beim Abmelden:", error);
      alert("Beim Abmelden ist ein Fehler aufgetreten.");
    } else {
      console.info("✅ Benutzer erfolgreich abgemeldet.");
    }

    // 🕐 Kurze Verzögerung, um Feedback zu zeigen
    setTimeout(() => {
      alert("Du wurdest erfolgreich abgemeldet.");
      window.location.href = "login.html"; // alternativ: "gate.html"
    }, 800);
  } catch (err) {
    console.error("❌ Unerwarteter Fehler beim Logout:", err);
    alert("Fehler beim Abmelden. Bitte erneut versuchen.");
    window.location.href = "login.html";
  }
});