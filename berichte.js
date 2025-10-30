// =============================================================
// Kampfberichte.js – v2.0 (Supabase Build 03.11.2025)
// Portiert auf Supabase: kein LocalStorage, direkter DB-Zugriff
// =============================================================

import { Logbuch } from "./logbuch.js";

document.addEventListener("DOMContentLoaded", async () => {
  // 🧭 Aktuellen Benutzer aus Supabase laden
  const { data: currentUser } = await Logbuch.getCurrentUser();
  if (!currentUser || currentUser.status !== "aktiv") {
    window.location.href = "gate.html";
    return;
  }

  const form = document.getElementById("berichtForm");
  const textarea = document.getElementById("berichtText");
  const tbody = document.querySelector("#berichteTable tbody");

  // -------------------- Bestehende Logs laden --------------------
  const { data: logs, error } = await Logbuch.load("kampfberichte_logs");
  if (error) console.error("Fehler beim Laden:", error);
  renderLogs(logs || []);

  // -------------------- Formular absenden ------------------------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = textarea.value.trim();
    if (!text) return;

    const datum = extractDate(text);
    const username = currentUser.username || "Unbekannt";

    const { attacker, defender } = parseReport(text);
    attacker.Datum = defender.Datum = datum;
    attacker.Benutzer = defender.Benutzer = username;
    attacker.Rolle = "Angreifer";
    defender.Rolle = "Verteidiger";

    // Zwei Datensätze speichern
    const { error: saveError } = await Logbuch.save("kampfberichte_logs", [attacker, defender]);
    if (saveError) {
      console.error("Fehler beim Speichern:", saveError);
      alert("Fehler beim Speichern des Berichts.");
      return;
    }

    textarea.value = "";
    alert("Kampfbericht erfolgreich gespeichert!");

    // Neu laden
    const { data: updated } = await Logbuch.load("kampfberichte_logs");
    renderLogs(updated || []);
  });

  // -------------------- Hilfsfunktionen -----------------------
  function extractDate(text) {
    const m = text.match(/vom\s+(\d{1,2}\.\d{1,2}\.\d{4})\s+(\d{1,2}:\d{2})/);
    return m ? `${m[1]} ${m[2]}` : new Date().toLocaleString("de-DE");
  }

  function baseTemplate() {
    const t = {
      Oz: 0, Ig: 0, In: 0,
      Steinschleuderer: 0, Lanzenträger: 0, Langbogenschütze: 0,
      Kanonen: 0, Fregatte: 0, Handelskogge: 0, Kolonialschiff: 0, Spähschiff: 0,
      "V-Stein": 0, "V-Lanze": 0, "V-Bogen": 0, "V-Kanonen": 0,
      "V-Fregatte": 0, "V-Kogge": 0, "V-Kolonial": 0, "V-Späh": 0,
      Lanze: "", Schild: "", Langbogen: "", Kanone: ""
    };
    const buildings = [
      "Hauptgebäude","Goldbergwerk","Steinbruch","Holzfällerhütte",
      "Universität","Baracke","Werft","Lagerhaus","Steinwall","Wachturm","Ruhestätte"
    ];
    buildings.forEach(b=>{
      t[`${b} vor`] = "";
      t[`${b} neu`] = "";
    });
    return t;
  }

  function parseReport(text) {
    const atkBlock = text.match(/Einheiten des Angreifers.*?\n([\s\S]*?)Einheiten des Verteidigers/);
    const defBlock = text.match(/Einheiten des Verteidigers.*?\n([\s\S]*?)(Zerstörung|Spähbericht|$)/);
    const atkCoords = text.match(/Einheiten des Angreifers.*\((\d+):(\d+):(\d+)\)/);
    const defCoords = text.match(/Einheiten des Verteidigers.*\((\d+):(\d+):(\d+)\)/);

    const attacker = baseTemplate();
    const defender = baseTemplate();

    if (atkCoords) [attacker.Oz, attacker.Ig, attacker.In] = atkCoords.slice(1, 4);
    if (defCoords) [defender.Oz, defender.Ig, defender.In] = defCoords.slice(1, 4);

    parseUnits(atkBlock, attacker);
    parseUnits(defBlock, defender);
    parseBuildings(text, defender);
    parseResearch(text, defender);

    return { attacker, defender };
  }

  function parseUnits(block, obj) {
    if (!block) return;
    const lines = block[1].trim().split("\n");
    lines.forEach((l) => {
      const p = l.split("\t").map((x) => x.trim());
      if (p.length < 3) return;
      const name = p[0];
      const total = parseInt(p[1]) || 0;
      const loss = parseInt(p[2]) || 0;
      if (obj.hasOwnProperty(name)) obj[name] = total;
      const map = {
        Steinschleuderer: "V-Stein",
        Lanzenträger: "V-Lanze",
        Langbogenschütze: "V-Bogen",
        Kanonen: "V-Kanonen",
        Fregatte: "V-Fregatte",
        Handelskogge: "V-Kogge",
        Kolonialschiff: "V-Kolonial",
        Spähschiff: "V-Späh",
      };
      if (map[name]) obj[map[name]] = loss;
    });
  }

  function parseBuildings(text, obj) {
    const gebRx = /(Zerstörung|Gebäude)([\s\S]*?)(Forschungen|Rohstoffe|$)/;
    const m = text.match(gebRx);
    if (!m) return;
    const lines = m[2].split("\n").map((l) => l.trim()).filter(Boolean);
    lines.forEach((raw) => {
      let line = raw.replace(/\t+/g, " ").replace(/\s+/g, " ").trim();
      let mDestr = line.match(/\((\d+)\s*auf\s*(\d+)\)/);
      if (mDestr) {
        let namePart = line.replace(/\(.*\)/, "").trim();
        namePart = namePart.replace(/^(Zerstörung|Kollateralschaden)\s*/i, "").trim();
        const key = normalizeBuildingKey(namePart);
        const vor = mDestr[1], neu = mDestr[2];
        if (obj.hasOwnProperty(`${key} vor`)) {
          obj[`${key} vor`] = vor;
          obj[`${key} neu`] = neu;
        }
        return;
      }
      let mStufe = line.match(/^([A-Za-zÄÖÜäöüß\s]+)\s*\(Stufe\s*(\d+)\)$/);
      if (mStufe) {
        const key = normalizeBuildingKey(mStufe[1]);
        const st = mStufe[2];
        if (obj.hasOwnProperty(`${key} vor`)) {
          obj[`${key} vor`] = st;
          obj[`${key} neu`] = st;
        }
      }
    });
  }

  function normalizeBuildingKey(s) {
    return s.replace(/\s+/g, " ").trim();
  }

  function parseResearch(text, obj) {
    const rx = /Forschungen([\s\S]*?)(?:Rohstoffe|$)/;
    const m = text.match(rx);
    if (!m) return;
    const lines = m[1].split("\n").map((l) => l.trim()).filter(Boolean);
    lines.forEach((raw) => {
      const line = raw.replace(/\t+/g, " ").replace(/\s+/g, " ").trim();
      const kv = line.match(/^([A-Za-zÄÖÜäöüß]+).*?(\d+)$/);
      if (!kv) return;
      const key = kv[1];
      const val = kv[2];
      if (obj.hasOwnProperty(key)) obj[key] = val;
    });
  }

  function renderLogs(entries) {
    tbody.innerHTML = "";
    if (!entries || entries.length === 0) {
      tbody.innerHTML = '<tr><td colspan="51"><em>Keine Berichte vorhanden.</em></td></tr>';
      return;
    }
    const order = [
      "Datum","Benutzer","Rolle","Oz","Ig","In",
      "Steinschleuderer","Lanzenträger","Langbogenschütze","Kanonen",
      "Fregatte","Handelskogge","Kolonialschiff","Spähschiff",
      "V-Stein","V-Lanze","V-Bogen","V-Kanonen","V-Fregatte","V-Kogge","V-Kolonial","V-Späh",
      "Hauptgebäude vor","Hauptgebäude neu","Goldbergwerk vor","Goldbergwerk neu",
      "Steinbruch vor","Steinbruch neu","Holzfällerhütte vor","Holzfällerhütte neu",
      "Universität vor","Universität neu","Baracke vor","Baracke neu","Werft vor","Werft neu",
      "Lagerhaus vor","Lagerhaus neu","Steinwall vor","Steinwall neu",
      "Wachturm vor","Wachturm neu","Ruhestätte vor","Ruhestätte neu",
      "Lanze","Schild","Langbogen","Kanone"
    ];

    entries.forEach((r) => {
      const tr = document.createElement("tr");
      tr.innerHTML = order.map((k) => `<td>${r[k] ?? ""}</td>`).join("");
      tbody.appendChild(tr);
    });
  }

  Logbuch.log("Kampfberichte v2.0 (Supabase) aktiv – Parser vollständig portiert.");
});