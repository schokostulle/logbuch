// Gemeinsame Konfiguration für alle Logbuch-Module.
// Trage hier einmalig deine Supabase-Projekt-URL und deinen "anon" Public Key ein.
const CONFIG = {
  supabaseUrl: 'https://xqkbbhafdhplweszyjjc.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhxa2JiaGFmZGhwbHdlc3p5ampjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzODAyOTQsImV4cCI6MjEwNDk1NjI5NH0.xbIBCvGBevl6bT3-VMZvNwVkZWzn4E3PqLJIE6GVsIA',
  // Feste interne "Fake"-E-Mail für den einen Logbuch-Account (in Supabase Auth angelegt).
  // Nach außen sieht der Nutzer nur ein Passwortfeld.
  fixedEmail: 'krake@logbuch.local'
};
