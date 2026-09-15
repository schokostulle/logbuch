// ---------- Datenbasis ----------
const FACTOR = 1.25;

// Zeit in Sekunden aus "H:MM:SS"
function timeToSeconds(str){
  const parts = str.split(':').map(Number);
  const [h,m,s] = parts;
  return h*3600 + m*60 + s;
}
function secondsToTime(totalSec){
  totalSec = Math.round(totalSec);
  const h = Math.floor(totalSec/3600);
  const m = Math.floor((totalSec%3600)/60);
  const s = totalSec%60;
  return [h,m,s].map((v,i)=> i===0 ? String(v) : String(v).padStart(2,'0')).join(':');
}
function fmt(n){
  return Math.round(n).toLocaleString('de-DE');
}

// Gebäude: baseCost/baseTime = Stufe 1, baseStat = Stufe 0 (falls vorhanden)
const BUILDINGS = {
  hauptgebaeude: { name:'Hauptgebäude', gold:149.6, stein:120, holz:89.6, time:timeToSeconds('0:24:50'), stat:null, statLabel:null, req:'—' },
  goldbergwerk:  { name:'Goldbergwerk', gold:90, stein:60, holz:60, time:timeToSeconds('0:16:33'), stat:4, statLabel:'Produktion / Std.', req:'—' },
  steinbruch:    { name:'Steinbruch', gold:60, stein:60, holz:60, time:timeToSeconds('0:16:33'), stat:2, statLabel:'Produktion / Std.', req:'—' },
  holzfaellerhuette: { name:'Holzfällerhütte', gold:90, stein:70, holz:60, time:timeToSeconds('0:19:52'), stat:3, statLabel:'Produktion / Std.', req:'—' },
  universitaet:  { name:'Universität', gold:150, stein:100, holz:60, time:timeToSeconds('0:23:11'), stat:null, statLabel:null, req:'Hauptgebäude Stufe 10' },
  baracke:       { name:'Baracke', gold:120, stein:120, holz:120, time:timeToSeconds('0:23:11'), stat:null, statLabel:null, req:'—' },
  werft:         { name:'Werft', gold:150, stein:160, holz:120, time:timeToSeconds('0:26:15'), stat:null, statLabel:null, req:'Hauptgebäude Stufe 5' },
  lagerhaus:     { name:'Lagerhaus', gold:90, stein:60, holz:90, time:timeToSeconds('0:19:52'), stat:1000, statLabel:'Kapazität je Rohstoff', req:'—' },
  steinwall:     { name:'Steinwall', gold:120, stein:150, holz:30, time:timeToSeconds('0:14:54'), stat:50, statLabel:'Defensivwert', req:'—' },
  wachturm:      { name:'Wachturm', gold:90, stein:100, holz:90, time:timeToSeconds('0:23:11'), stat:1, statLabel:'Sichtweite (sm)', req:'—' },
};

// Militär: keine Stufen, fixe Werte
const MILITARY = {
  steinewerfer:   { name:'Steinewerfer', gold:50, stein:10, holz:5, time:timeToSeconds('0:24:53'), req:'Baracke Stufe 1', cap:null },
  lanzentraeger:  { name:'Lanzenträger', gold:80, stein:10, holz:30, time:timeToSeconds('0:16:53'), req:'Baracke 5 · Universität 1 · Forschung Speer 1', cap:null },
  bogenschuetze:  { name:'Bogenschütze', gold:100, stein:30, holz:50, time:timeToSeconds('0:06:04'), req:'Baracke 10 · Universität 5 · Forschung Bogen 5', cap:null },
  spionageschiff: { name:'Spionageschiff', gold:75, stein:0, holz:75, time:timeToSeconds('0:21:34'), req:'Werft Stufe 1', cap:null, speedKn:6 },
  handelsschiff:  { name:'Handelsschiff', gold:600, stein:0, holz:750, time:timeToSeconds('4:08:57'), req:'Werft Stufe 1', cap:'Transportkapazität: 500 Rohstoffe gesamt', speedKn:4 },
  fregatte:       { name:'Fregatte', gold:700, stein:0, holz:600, time:timeToSeconds('2:45:58'), req:'Werft Stufe 1', cap:'Transportkapazität: 5 Infanterie', speedKn:5 },
  kanonenboot:    { name:'Kanonenboot', gold:25000, stein:10000, holz:15000, time:timeToSeconds('16:08:57'), req:'Werft 10 · Universität 10 · Forschung Kanone 1', cap:null, speedKn:3 },
  kolonialschiff: { name:'Kolonialschiff', gold:40000, stein:0, holz:30000, time:timeToSeconds('19:44:47'), req:'Werft Stufe 20', cap:null, speedKn:2 },
};

// Bauzeit-Skalierung: Einheiten werden schneller produziert, je hoeher Baracke/Werft ausgebaut sind.
// Werte aus echten Beobachtungen (Stufen 1,5,10,15,18,20), dazwischen linear interpoliert.
// Spionageschiff-Wert bei Stufe 15 ist ein bekannter Ausreisser/Tippfehler und wird nicht verwendet.
const UNIT_TIME_TABLE = {
  steinewerfer:   [[1,1493],[5,1484],[10,1453],[15,1357],[18,1222],[20,1066]],   // Baracke-Stufe
  lanzentraeger:  [[5,2474],[10,2422],[15,2263],[18,2036],[20,1777]],           // Baracke-Stufe (ab 5 baubar)
  bogenschuetze:  [[10,3391],[15,3168],[18,2852],[20,2488]],                     // Baracke-Stufe (ab 10 baubar)
  handelsschiff:  [[1,14937],[5,14847],[10,14533],[15,13578],[18,13578],[20,10663]], // Werft-Stufe
  fregatte:       [[1,8962],[5,8908],[10,8720],[15,8317],[18,9052],[20,6397]],  // Werft-Stufe
};

function interpolateUnitTime(unitKey, level){
  const table = UNIT_TIME_TABLE[unitKey];
  if(!table) return null;
  if(level <= table[0][0]) return table[0][1];
  if(level >= table[table.length-1][0]) return table[table.length-1][1];
  for(let i=0; i<table.length-1; i++){
    const [l1,t1] = table[i], [l2,t2] = table[i+1];
    if(level>=l1 && level<=l2){
      const frac = (level-l1)/(l2-l1);
      return t1 + (t2-t1)*frac;
    }
  }
  return table[table.length-1][1];
}

// Forschung: baseCost/baseTime = Stufe 1
const RESEARCH = {
  schild: { name:'Schild', gold:250, stein:0, holz:120, time:timeToSeconds('1:22:48'), req:'Universität Stufe 1' },
  speer:  { name:'Speer', gold:400, stein:40, holz:100, time:timeToSeconds('1:39:22'), req:'Universität Stufe 1' },
  bogen:  { name:'Bogen', gold:350, stein:40, holz:50, time:timeToSeconds('1:46:40'), req:'Universität Stufe 5' },
  kanone: { name:'Kanone', gold:4000, stein:3900, holz:2500, time:timeToSeconds('3:58:21'), req:'Universität Stufe 10' },
};

// Weltstruktur (für spätere Tools: Entfernungs-/Reisezeitrechner, Kartenansicht, Farmziel-Finder)
// Koordinatenformat: x:y:z
//   x = Ozean, angeordnet als quadratisches Raster (z.B. 3x3 = 9 Ozeane)
//   y = Inselgruppe innerhalb eines Ozeans, angeordnet als quadratisches Raster (z.B. 10x10 = 100 Gruppen)
//   z = Insel innerhalb einer Inselgruppe, angeordnet als quadratisches Raster (z.B. 4x4 = 16 Inseln)
// Nicht jede Koordinate ist belegt; nicht jede belegte Insel hat einen Spieler (herrenlose Inseln möglich).
const WORLD = {
  oceanGridSize: 3,      // 3x3 -> 9 Ozeane
  groupGridSize: 10,     // 10x10 -> 100 Inselgruppen je Ozean
  islandGridSize: 4,     // 4x4 -> 16 Inseln je Gruppe
  get oceanCount(){ return this.oceanGridSize * this.oceanGridSize; },
  get groupsPerOcean(){ return this.groupGridSize * this.groupGridSize; },
  get islandsPerGroup(){ return this.islandGridSize * this.islandGridSize; },
  get maxIslandsTotal(){ return this.oceanCount * this.groupsPerOcean * this.islandsPerGroup; }
};

// Wandelt einen 1-basierten Index innerhalb eines quadratischen Rasters in Zeile/Spalte um.
// Nummerierung: zeilenweise links->rechts, oben->unten (Index 1 = Zeile 0, Spalte 0).
function coordToGrid(index, gridSize){
  const i = index - 1;
  return { row: Math.floor(i / gridSize), col: i % gridSize };
}

// Berechnet die globale 2D-Position (in "Feldern") einer Insel aus x:y:z.
function globalPosition(x, y, z, world = WORLD){
  const o = coordToGrid(x, world.oceanGridSize);   // Ozean im Ozean-Raster
  const g = coordToGrid(y, world.groupGridSize);   // Gruppe im Gruppen-Raster (innerhalb des Ozeans)
  const i = coordToGrid(z, world.islandGridSize);  // Insel im Insel-Raster (innerhalb der Gruppe)

  const unitsPerOcean = world.groupGridSize * world.islandGridSize; // Felder je Ozean-Kante

  return {
    X: o.col * unitsPerOcean + g.col * world.islandGridSize + i.col,
    Y: o.row * unitsPerOcean + g.row * world.islandGridSize + i.row
  };
}

// Entfernung zweier Inseln in Seemeilen (euklidisch, mindestens 1 sm).
function distanceSM(a, b, world = WORLD){
  const posA = globalPosition(a.x, a.y, a.z, world);
  const posB = globalPosition(b.x, b.y, b.z, world);
  const dx = posA.X - posB.X;
  const dy = posA.Y - posB.Y;
  const raw = Math.sqrt(dx*dx + dy*dy);
  return Math.max(1, Math.round(raw * 10) / 10);
}

// ---------- Berechnungen ----------
function scaledCost(base, level){
  // Stufe 1 = base, jede weitere Stufe * 1.25
  return base * Math.pow(FACTOR, level-1);
}
function scaledStat(base, level){
  // Stufe 0 = base, Stufe N = base * 1.25^N
  return base * Math.pow(FACTOR, level);
}

// ---------- Tabs ----------
document.querySelectorAll('nav.tabs button').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('nav.tabs button').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('panel-'+btn.dataset.tab).classList.add('active');
  });
});

// ---------- Gebäude UI ----------
const gebSelect = document.getElementById('geb-select');
Object.entries(BUILDINGS).forEach(([key,b])=>{
  const opt = document.createElement('option');
  opt.value = key; opt.textContent = b.name;
  gebSelect.appendChild(opt);
});
function buildLevelTable(tableEl, entry, minLevel, maxLevel, includeStat){
  const thead = tableEl.querySelector('thead');
  const tbody = tableEl.querySelector('tbody');

  let headHtml = '<tr class="group-row"><th>&nbsp;</th><th colspan="4">Einzelkosten dieser Stufe</th>';
  if(includeStat) headHtml += '<th></th>';
  headHtml += '<th colspan="4">Kumuliert (inkl. vorheriger Stufen)</th></tr>';
  headHtml += '<tr><th>Stufe</th><th>Gold</th><th>Stein</th><th>Holz</th><th>Bauzeit</th>';
  if(includeStat) headHtml += `<th>${entry.statLabel || 'Eigenschaft'}</th>`;
  headHtml += '<th class="sep-left">Σ Gold</th><th>Σ Stein</th><th>Σ Holz</th><th>Σ Bauzeit</th></tr>';
  thead.innerHTML = headHtml;

  let sumGold=0, sumStein=0, sumHolz=0, sumTime=0;
  let rows = '';
  for(let level=minLevel; level<=maxLevel; level++){
    const gold = scaledCost(entry.gold, level);
    const stein = scaledCost(entry.stein, level);
    const holz = scaledCost(entry.holz, level);
    const time = scaledCost(entry.time, level);
    sumGold += gold; sumStein += stein; sumHolz += holz; sumTime += time;

    rows += `<tr><td>${level}</td><td>${fmt(gold)}</td><td>${fmt(stein)}</td><td>${fmt(holz)}</td><td>${secondsToTime(time)}</td>`;
    if(includeStat){
      rows += `<td>${entry.stat !== null && entry.stat !== undefined ? fmt(scaledStat(entry.stat, level)) : '–'}</td>`;
    }
    rows += `<td class="sep-left">${fmt(sumGold)}</td><td>${fmt(sumStein)}</td><td>${fmt(sumHolz)}</td><td>${secondsToTime(sumTime)}</td></tr>`;
  }
  tbody.innerHTML = rows;
}

function renderGeb(){
  const key = gebSelect.value;
  const b = BUILDINGS[key];
  const minLevel = (key === 'hauptgebaeude') ? 2 : 1;

  document.getElementById('geb-req').textContent = key === 'hauptgebaeude'
    ? 'Jede Insel startet bereits mit Hauptgebäude Stufe 1 (kostenlos). Tabelle zeigt Ausbau ab Stufe 2.'
    : 'Voraussetzung: ' + b.req;

  buildLevelTable(document.getElementById('geb-table'), b, minLevel, 20, b.stat !== null);
}
gebSelect.addEventListener('change', renderGeb);

// ---------- Militär UI ----------
const milSelect = document.getElementById('mil-select');
Object.entries(MILITARY).forEach(([key,u])=>{
  const opt = document.createElement('option');
  opt.value = key; opt.textContent = u.name;
  milSelect.appendChild(opt);
});
const milQty = document.getElementById('mil-qty');
const milLevel = document.getElementById('mil-level');

// Welche Einheiten haengen von welchem Gebaeude ab (fuer die Bauzeit-Skalierung)
const MIL_LEVEL_BUILDING = {
  steinewerfer: 'baracke', lanzentraeger: 'baracke', bogenschuetze: 'baracke',
  handelsschiff: 'werft', fregatte: 'werft',
  spionageschiff: 'werft', kanonenboot: 'werft', kolonialschiff: 'werft'
};
const BUILDING_LABEL = { baracke: 'Baracke-Stufe (beeinflusst Bauzeit)', werft: 'Werft-Stufe (beeinflusst Bauzeit)' };

function renderMil(){
  const key = milSelect.value;
  const u = MILITARY[key];
  const qty = Math.max(1, parseInt(milQty.value,10) || 1);
  const level = parseInt(milLevel.value,10);
  document.getElementById('mil-level-num').textContent = level;

  const buildingKey = MIL_LEVEL_BUILDING[key];
  document.getElementById('mil-level-label').textContent = BUILDING_LABEL[buildingKey] || 'Gebäudestufe';

  const dynTime = interpolateUnitTime(key, level);
  const hasScaling = dynTime !== null;
  const effectiveTime = hasScaling ? dynTime : u.time;

  document.getElementById('mil-scaling-note').textContent = hasScaling
    ? ''
    : 'Bauzeit-Skalierung für diese Einheit noch nicht bekannt – es gilt der Basiswert (Stufe 1).';

  document.getElementById('mil-qty-echo').textContent = qty;
  document.getElementById('mil-req').textContent = 'Voraussetzung: ' + u.req;
  document.getElementById('mil-cap').textContent = u.cap || '';
  document.getElementById('mil-gold').textContent = fmt(u.gold * qty);
  document.getElementById('mil-stein').textContent = fmt(u.stein * qty);
  document.getElementById('mil-holz').textContent = fmt(u.holz * qty);
  document.getElementById('mil-zeit-stk').textContent = secondsToTime(effectiveTime);
  document.getElementById('mil-zeit-gesamt').textContent = secondsToTime(effectiveTime * qty);
}
milSelect.addEventListener('change', renderMil);
milQty.addEventListener('input', renderMil);
milLevel.addEventListener('input', renderMil);

// ---------- Forschung UI ----------
const forSelect = document.getElementById('for-select');
Object.entries(RESEARCH).forEach(([key,r])=>{
  const opt = document.createElement('option');
  opt.value = key; opt.textContent = r.name;
  forSelect.appendChild(opt);
});
function renderFor(){
  const r = RESEARCH[forSelect.value];
  document.getElementById('for-req').textContent = 'Voraussetzung: ' + r.req;
  buildLevelTable(document.getElementById('for-table'), r, 1, 10, false);
}
forSelect.addEventListener('change', renderFor);

// ---------- Init ----------
renderGeb();
renderMil();
renderFor();

// ---------- Reisezeit UI ----------
const reiseSchiff = document.getElementById('reise-schiff');
Object.entries(MILITARY).forEach(([key,u])=>{
  if(u.speedKn){
    const opt = document.createElement('option');
    opt.value = key; opt.textContent = `${u.name} (${u.speedKn} kn)`;
    reiseSchiff.appendChild(opt);
  }
});

const coordIds = ['start-x','start-y','start-z','ziel-x','ziel-y','ziel-z'];

function renderReise(){
  const rawStartX = document.getElementById('start-x').value;
  const rawStartY = document.getElementById('start-y').value;
  const rawStartZ = document.getElementById('start-z').value;
  const rawZielX  = document.getElementById('ziel-x').value;
  const rawZielY  = document.getElementById('ziel-y').value;
  const rawZielZ  = document.getElementById('ziel-z').value;

  const allFilled = [rawStartX,rawStartY,rawStartZ,rawZielX,rawZielY,rawZielZ].every(v => v !== '');

  if(!allFilled){
    document.getElementById('reise-distanz').textContent = '–';
    document.getElementById('reise-speed').textContent = '–';
    document.getElementById('reise-zeit-einfach').textContent = '–';
    document.getElementById('reise-zeit-hinundzurueck').textContent = '–';
    return;
  }

  const startX = parseInt(rawStartX,10);
  const startY = parseInt(rawStartY,10);
  const startZ = parseInt(rawStartZ,10);
  const zielX  = parseInt(rawZielX,10);
  const zielY  = parseInt(rawZielY,10);
  const zielZ  = parseInt(rawZielZ,10);

  const ship = MILITARY[reiseSchiff.value];
  const dist = distanceSM(
    { x:startX, y:startY, z:startZ },
    { x:zielX, y:zielY, z:zielZ }
  );

  const hoursOneWay = dist / ship.speedKn;
  const secOneWay = hoursOneWay * 3600;

  document.getElementById('reise-distanz').textContent = dist.toFixed(1) + ' sm';
  document.getElementById('reise-speed').textContent = ship.speedKn + ' kn';
  document.getElementById('reise-zeit-einfach').textContent = secondsToTime(secOneWay);
  document.getElementById('reise-zeit-hinundzurueck').textContent = secondsToTime(secOneWay * 2);
}

coordIds.forEach(id => document.getElementById(id).addEventListener('input', renderReise));
reiseSchiff.addEventListener('change', renderReise);
renderReise();

// ==================== MEILENSTEIN 1 ====================
// Portierung der Python-Simulation: einzige sequenzielle Bau-Warteschlange (Minen, Hauptgebäude,
// Baracke-Struktur, Werft-Struktur) + zwei parallele, unabhängige Ausbildungsqueues (Baracke->Truppen,
// Werft->Schiffe). Ressourcenpool ist gemeinsam und durch die Lagerkapazität gedeckelt.

function m1BuildCostTime(kind, level, cfg){
  let base;
  if(kind==='hg') base = BUILDINGS.hauptgebaeude;
  else if(kind==='gold') base = BUILDINGS.goldbergwerk;
  else if(kind==='stein') base = BUILDINGS.steinbruch;
  else if(kind==='holz') base = BUILDINGS.holzfaellerhuette;
  else if(kind==='baracke') base = BUILDINGS.baracke;
  else if(kind==='werft') base = BUILDINGS.werft;
  else if(kind==='lager') base = BUILDINGS.lagerhaus;
  const cost = [scaledCost(base.gold, level), scaledCost(base.stein, level), scaledCost(base.holz, level)];
  const time = scaledCost(base.time, level);
  return {cost, time};
}
function m1ProdRate(kind, level, cfg){
  if(kind==='gold') return cfg.prodGold * Math.pow(FACTOR, level);
  if(kind==='stein') return cfg.prodStein * Math.pow(FACTOR, level);
  if(kind==='holz') return cfg.prodHolz * Math.pow(FACTOR, level);
}
function m1CapAtLevel(level, cfg){ return cfg.lagerCap * Math.pow(FACTOR, level); }

function m1TimeToAfford(cost, avail, rate, cap){
  let needed = 0;
  for(let i=0;i<3;i++){
    if(avail[i] >= cost[i]) continue;
    if(cost[i] > cap[i]) return Infinity;
    if(rate[i] <= 0) return Infinity;
    needed = Math.max(needed, (cost[i]-avail[i])/rate[i]);
  }
  return needed;
}

function m1Simulate(mainOrder, werftOrder, cfg, collectLog){
  let t = 0;
  let res = [cfg.startRes, cfg.startRes, cfg.startRes];
  let levels = {hg:1, gold:0, stein:0, holz:0, baracke:0, werft:0, lager:0};
  const log = collectLog ? [] : null;

  function rates(){
    return [
      m1ProdRate('gold', levels.gold, cfg)/3600,
      m1ProdRate('stein', levels.stein, cfg)/3600,
      m1ProdRate('holz', levels.holz, cfg)/3600
    ];
  }
  function caps(){ const c = m1CapAtLevel(levels.lager, cfg); return [c,c,c]; }

  let mainIdx = 0, mainBusyUntil = null, mainPendingKind = null, mainPendingLevel = null;
  let barackeUnlocked = false, barackeBusyUntil = null;
  let werftUnlocked = false, werftBusyUntil = null;

  function nextMainAction(){
    while(mainIdx < mainOrder.length){
      const kind = mainOrder[mainIdx];
      if(kind==='hg' && levels.hg>=5){ mainIdx++; continue; }
      if(kind==='baracke' && levels.baracke>=1){ mainIdx++; continue; }
      if(kind==='werft' && levels.werft>=1){ mainIdx++; continue; }
      return kind;
    }
    return null;
  }

  const pendingSteinewerfer = [0,1,2,3,4].map(()=>({gold:MILITARY.steinewerfer.gold, stein:MILITARY.steinewerfer.stein, holz:MILITARY.steinewerfer.holz, time:MILITARY.steinewerfer.time, name:'Steinewerfer'}));
  const shipDefs = {handelsschiff:{...MILITARY.handelsschiff, name:'Handelsschiff'}, fregatte:{...MILITARY.fregatte, name:'Fregatte'}};
  const pendingShips = werftOrder.map(k=>({gold:shipDefs[k].gold, stein:shipDefs[k].stein, holz:shipDefs[k].holz, time:shipDefs[k].time, name:shipDefs[k].name}));

  const MAIN_NAMES = {hg:'Hauptgebäude', gold:'Goldbergwerk', stein:'Steinbruch', holz:'Holzfällerhütte', baracke:'Baracke', werft:'Werft'};

  function allDone(){
    return levels.baracke>=1 && levels.werft>=1 && levels.hg>=5 &&
      pendingSteinewerfer.length===0 && barackeBusyUntil===null &&
      pendingShips.length===0 && werftBusyUntil===null &&
      nextMainAction()===null;
  }

  let safety = 0;
  while(true){
    safety++;
    if(safety > 300000) return {time: Infinity, log};

    const r = rates();
    const cap = caps();
    const candidates = [];

    if(mainBusyUntil===null){
      const kind = nextMainAction();
      if(kind !== null && !(kind==='werft' && levels.hg<5)){
        const newLevel = levels[kind] + 1;
        const {cost, time} = m1BuildCostTime(kind, newLevel, cfg);
        const ts = t + m1TimeToAfford(cost, res, r, cap);
        candidates.push([ts, 'main', {kind, newLevel, cost, time, idx: mainIdx}]);
      }
    } else {
      candidates.push([mainBusyUntil, 'main_complete', null