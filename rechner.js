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
      candidates.push([mainBusyUntil, 'main_complete', null]);
    }

    if(barackeUnlocked){
      if(barackeBusyUntil===null){
        if(pendingSteinewerfer.length>0){
          const item = pendingSteinewerfer[0];
          const cost = [item.gold, item.stein, item.holz];
          const dynTime = interpolateUnitTime('steinewerfer', levels.baracke) ?? item.time;
          const ts = t + m1TimeToAfford(cost, res, r, cap);
          candidates.push([ts, 'baracke', {cost, time:dynTime, name:item.name}]);
        }
      } else {
        candidates.push([barackeBusyUntil, 'baracke_complete', null]);
      }
    }

    if(werftUnlocked){
      if(werftBusyUntil===null){
        if(pendingShips.length>0){
          const item = pendingShips[0];
          const cost = [item.gold, item.stein, item.holz];
          const unitKey = item.name==='Handelsschiff' ? 'handelsschiff' : 'fregatte';
          const dynTime = interpolateUnitTime(unitKey, levels.werft) ?? item.time;
          const ts = t + m1TimeToAfford(cost, res, r, cap);
          candidates.push([ts, 'werft', {cost, time:dynTime, name:item.name}]);
        }
      } else {
        candidates.push([werftBusyUntil, 'werft_complete', null]);
      }
    }

    if(candidates.length===0){
      if(allDone()) return {time:t, log};
      return {time: Infinity, log};
    }

    candidates.sort((a,b)=>a[0]-b[0]);
    const [ts, ctype, payload] = candidates[0];
    if(!isFinite(ts)) return {time: Infinity, log};

    const dt = ts - t;
    if(dt > 0){ for(let i=0;i<3;i++) res[i] = Math.min(res[i] + r[i]*dt, cap[i]); }
    t = ts;

    if(ctype==='main'){
      const {kind, newLevel, cost, time, idx} = payload;
      res[0]-=cost[0]; res[1]-=cost[1]; res[2]-=cost[2];
      mainBusyUntil = t + time; mainPendingKind = kind; mainPendingLevel = newLevel;
      mainIdx = idx + 1;
      if(log) log.push({group:'main', name: MAIN_NAMES[kind] + ' → Stufe ' + newLevel, start:t, end:t+time});
    } else if(ctype==='main_complete'){
      levels[mainPendingKind] = mainPendingLevel;
      if(mainPendingKind==='baracke') barackeUnlocked = true;
      if(mainPendingKind==='werft') werftUnlocked = true;
      mainBusyUntil = null;
    } else if(ctype==='baracke'){
      const {cost, time, name} = payload;
      res[0]-=cost[0]; res[1]-=cost[1]; res[2]-=cost[2];
      barackeBusyUntil = t + time;
      if(log) log.push({group:'baracke', name, start:t, end:t+time});
    } else if(ctype==='baracke_complete'){
      pendingSteinewerfer.shift();
      barackeBusyUntil = null;
    } else if(ctype==='werft'){
      const {cost, time, name} = payload;
      res[0]-=cost[0]; res[1]-=cost[1]; res[2]-=cost[2];
      werftBusyUntil = t + time;
      if(log) log.push({group:'werft', name, start:t, end:t+time});
    } else if(ctype==='werft_complete'){
      pendingShips.shift();
      werftBusyUntil = null;
    }

    if(allDone()) return {time:t, log};
  }
}

const M1_TAIL = ['hg','hg','hg','hg','werft','baracke'];

function m1ScoreOrder(mineOrder, cfg){
  const order = mineOrder.concat(M1_TAIL);
  const t1 = m1Simulate(order, ['handelsschiff','fregatte'], cfg, false).time;
  const t2 = m1Simulate(order, ['fregatte','handelsschiff'], cfg, false).time;
  return Math.min(t1, t2);
}
function m1RandomMines(maxEach){
  const g = Math.floor(Math.random()*(maxEach+1));
  const s = Math.floor(Math.random()*(maxEach+1));
  const h = Math.floor(Math.random()*(maxEach+1));
  let pool = [];
  for(let i=0;i<g;i++) pool.push('gold');
  for(let i=0;i<s;i++) pool.push('stein');
  for(let i=0;i<h;i++) pool.push('holz');
  for(let i=pool.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [pool[i],pool[j]]=[pool[j],pool[i]]; }
  return pool;
}
function m1Mutate(mines){
  mines = mines.slice();
  const ops = ['swap','insert','remove','add','add'];
  const op = ops[Math.floor(Math.random()*ops.length)];
  if(op==='swap' && mines.length>=2){
    const i=Math.floor(Math.random()*mines.length);
    const j=Math.floor(Math.random()*mines.length);
    [mines[i],mines[j]]=[mines[j],mines[i]];
  } else if(op==='insert' && mines.length>=1){
    const i=Math.floor(Math.random()*mines.length);
    const item = mines.splice(i,1)[0];
    const j=Math.floor(Math.random()*(mines.length+1));
    mines.splice(j,0,item);
  } else if(op==='remove' && mines.length>0){
    mines.splice(Math.floor(Math.random()*mines.length),1);
  } else if(op==='add'){
    const kinds=['gold','stein','holz'];
    const kind = kinds[Math.floor(Math.random()*3)];
    const j=Math.floor(Math.random()*(mines.length+1));
    mines.splice(j,0,kind);
  }
  return mines;
}
function m1Search(cfg, budgetMs){
  const t0 = performance.now();
  let current = m1RandomMines(8);
  let currentScore = m1ScoreOrder(current, cfg);
  let best = current, bestScore = currentScore;
  let stale = 0;
  while(performance.now()-t0 < budgetMs){
    const cand = m1Mutate(current);
    const s = m1ScoreOrder(cand, cfg);
    if(s <= currentScore){
      current = cand; currentScore = s;
      if(s < bestScore){ best = cand; bestScore = s; stale = 0; } else { stale++; }
    } else {
      stale++;
      if(Math.random() < 0.03){ current = cand; currentScore = s; }
    }
    if(stale > 3000){
      current = m1RandomMines(8);
      currentScore = m1ScoreOrder(current, cfg);
      stale = 0;
    }
  }
  return {order: best.concat(M1_TAIL), score: bestScore};
}

document.getElementById('m1-calc-btn').addEventListener('click', ()=>{
  const cfg = {
    startRes: parseFloat(document.getElementById('m1-startres').value) || 500,
    prodGold: parseFloat(document.getElementById('m1-prod-gold').value) || 4,
    prodStein: parseFloat(document.getElementById('m1-prod-stein').value) || 2,
      prodHolz: parseFloat(document.getElementById('m1-prod-holz').value) || 3,
    lagerCap: parseFloat(document.getElementById('m1-lagercap').value) || 1000
  };
  document.getElementById('m1-loading').style.display = 'block';
  document.getElementById('m1-result').style.display = 'none';
  document.getElementById('m1-timeline-wrap').style.display = 'none';

  setTimeout(()=>{
    const {order, score} = m1Search(cfg, 2500);
    const sim1 = m1Simulate(order, ['handelsschiff','fregatte'], cfg, true);
    const sim2 = m1Simulate(order, ['fregatte','handelsschiff'], cfg, true);
    const best = sim1.time <= sim2.time ? sim1 : sim2;

    const mineOnly = order.filter(k => k!=='hg' && k!=='baracke' && k!=='werft');
    const gCount = mineOnly.filter(k=>k==='gold').length;
    const sCount = mineOnly.filter(k=>k==='stein').length;
    const hCount = mineOnly.filter(k=>k==='holz').length;

    document.getElementById('m1-mine-combo').textContent = `Gold ${gCount} / Stein ${sCount} / Holz ${hCount}`;

    const startInput = document.getElementById('m1-serverstart').value;
    const serverStart = startInput ? new Date(startInput) : new Date();
    const fmtDate = (offsetSeconds) => {
      const d = new Date(serverStart.getTime() + offsetSeconds*1000);
      return d.toLocaleString('de-DE', {weekday:'short', day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'});
    };

    document.getElementById('m1-finish-date').textContent = fmtDate(best.time) + (startInput ? '' : '  (ohne Serverstart-Angabe: ab jetzt gerechnet)');

    const rowHtml = (name, start, end, cls) => `<tr class="${cls}"><td>${name}</td><td>${fmtDate(start)}</td><td>${fmtDate(end)}</td></tr>`;

    const now = new Date();

    // Bestimmt je Eintrag den Status (erledigt / laeuft gerade / naechster anstehender Schritt / zukuenftig)
    // relativ zum aktuellen Datum - getrennt pro Tabelle, da die drei Queues parallel/unabhaengig laufen.
    function renderGroup(entries, mapName){
      let nextMarked = false;
      return entries.map(e => {
        const startDate = new Date(serverStart.getTime() + e.start*1000);
        const endDate = new Date(serverStart.getTime() + e.end*1000);
        let cls = '';
        if(endDate <= now){
          cls = 'row-done';
        } else if(startDate <= now && now < endDate){
          cls = 'row-active';
        } else if(!nextMarked){
          cls = 'row-next';
          nextMarked = true;
        }
        return rowHtml(mapName(e), e.start, e.end, cls);
      }).join('');
    }

    const tbodyMain = document.querySelector('#m1-table-main tbody');
    const tbodyWerft = document.querySelector('#m1-table-werft tbody');
    const tbodyBaracke = document.querySelector('#m1-table-baracke tbody');

    tbodyMain.innerHTML = renderGroup(best.log.filter(e=>e.group==='main'), e=>e.name);
    tbodyWerft.innerHTML = renderGroup(best.log.filter(e=>e.group==='werft'), e=>e.name);

    let stCount = 0;
    tbodyBaracke.innerHTML = renderGroup(best.log.filter(e=>e.group==='baracke'), e => {
      stCount++;
      return e.name === 'Steinewerfer' ? `Steinewerfer #${stCount}` : e.name;
    });

    document.getElementById('m1-loading').style.display = 'none';
    document.getElementById('m1-result').style.display = 'block';
    document.getElementById('m1-timeline-wrap').style.display = 'block';
  }, 50);
});

