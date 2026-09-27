/* Myers Pulse: engine.
   Store + story clock + derived state + actions + AI answers. Front end only.

   API used by every page (read this before writing a page):
   MP.get()                 -> state S (read only; mutate only through MP.act.*)
   MP.useStore()            -> React hook, re-renders on change, returns S   (defined in mp-ui.js)
   MP.now()                 -> story clock in minutes since midnight, Mon 28 Sep 2026
   MP.q.*                   -> selectors (see below)
   MP.act.*                 -> actions; each one updates every linked record, logs activity, toasts
   MP.go(path)              -> navigate ("jobs/2491", "machines/LP200-48023" ...)  (mp-ui.js)
   MP.link(ref)             -> path for a {type,id} ref
   MP.ask(text)             -> AI answer object (see MP.ask below)
*/
(function(){
"use strict";
const MP = window.MP;
const U = MP.util, G = MP.geo, REF = MP.ref;
const {hm, toMin, dur, eur, TODAY} = U;

/* ---------- store ---------- */
const KEY = "myers-pulse-v3";
let S = null;
const listeners = new Set();
function load(){
  try { const raw = sessionStorage.getItem(KEY); if (raw){ const x = JSON.parse(raw); if (x && x.v === 3) return x; } } catch(e){}
  return MP.seed();
}
function save(){ try { sessionStorage.setItem(KEY, JSON.stringify(S)); } catch(e){} }
let pending = false;
function emit(){ cache.clear(); save(); if (pending) return; pending = true; queueMicrotask(() => { pending = false; listeners.forEach(f => f()); }); }
MP.init = () => { if (!S) S = load(); return S; };
MP.get = () => S;
MP.subscribe = (f) => { listeners.add(f); return () => listeners.delete(f); };
MP.now = () => S.clock;
MP.reset = () => { S = MP.seed(); cache.clear(); timers.forEach(clearTimeout); timers = []; emit(); toast("Demo reset", "Back to Monday 28 September, 07:02.", "info"); };
let timers = [];
const later = (ms, fn) => { timers.push(setTimeout(fn, ms)); };

/* memo cache, cleared on every change */
const cache = new Map();
const memo = (k, f) => { if (!cache.has(k)) cache.set(k, f()); return cache.get(k); };

/* ---------- toasts ---------- */
let toasts = [], toastNo = 0; const toastL = new Set();
function toast(text, sub, kind){
  const t = {id:++toastNo, text, sub: sub || "", kind: kind || "ok"};
  toasts = toasts.concat([t]).slice(-4); toastL.forEach(f => f());
  setTimeout(() => { toasts = toasts.filter(x => x.id !== t.id); toastL.forEach(f => f()); }, kind === "flow" ? 6500 : 4200);
}
MP.toast = toast; MP.toasts = () => toasts; MP.onToast = (f) => { toastL.add(f); return () => toastL.delete(f); };

/* ---------- lookups ---------- */
const job = (id) => S.jobs[String(id).replace("#", "")];
const cust = (id) => S.customers[id];
const site = (id) => S.sites[id];
const mach = (id) => S.machines[id];
const model = (mid) => { const m = mach(mid); return m ? REF.MODELS[m.model] : null; };
const part = (sku) => S.parts[sku];
const eng = (id) => S.engineers[id];
const loc = (id) => S.locations[id];
const claim = (id) => S.claims[id];
const doc = (id) => S.docs[id];
const request = (id) => S.requests.find(r => r.id === id);
const placeName = (p) => p === "base" ? "Myers base" : site(p) ? cust(site(p).cust).name : p;
const placePos = (p) => p === "base" ? G.BASE.pos : site(p) ? site(p).pos : null;
const staffName = () => ({owner:"Tom Myers", manager:"Karen Nolan", engineer:"Sean Murphy", stores:"Pat Hayes"})[S.role] || "Tom Myers";

/* ---------- activity ---------- */
function log(actor, kind, text, refs, t){
  cache.clear();
  S.activity.push({d:TODAY, t: t || hm(S.clock), actor, kind, text, refs: refs || []});
}
function jlog(j, text, by, kind, t){ j.timeline.push({d:TODAY, t: t || hm(S.clock), text, by, kind: kind || "person"}); }
function ai(agent, text, refs, status){ S.ai.unshift({id:"AI-" + (S.ai.length + 100), agent, d:TODAY, t:hm(S.clock), text, refs: refs || [], status: status || "Done"}); }

/* ---------- story clock ---------- */
/* Move the clock forward to `target` (or one minute), revealing scripted events on the way. */
function advance(target){
  cache.clear();
  const to = Math.max(S.clock + 1, target == null ? S.clock + 1 : target);
  while (S.script.length && S.script[0].e.t <= to){ const x = S.script.shift(); S.clock = Math.max(S.clock, x.e.t); applyScripted(x.eng, x.e); }
  S.clock = to;
}
MP.advance = (t) => { advance(t); emit(); };
const REPORTS = {
  "2492":"Reject conveyor belt split at the joint and jammed the reject arm, which faulted the detector. Belt replaced, validated at 1.5 mm Fe, 2.0 mm NFe, 2.5 mm SS. Line 1 running.",
  "2490":"Lid gasket split at the hinge side. Replaced gasket, pump oil checked, vacuum back to 4 mbar. 50 packs passed QA.",
  "2489":"Guard interlock proximity sensor loose and damaged. Replaced sensor, tested interlock five times, slicer released to production.",
  "2498":"Planned maintenance complete. Blade sharpened, guard and interlock checked after Friday’s change.",
  "2499":"Planned maintenance complete. Pump oil changed, lid gasket in good condition, vacuum 3.8 mbar.",
  "2500":"Planned maintenance and validation complete. Certificate issued, sensitivity unchanged.",
  "2494":"Planned maintenance complete on the line 1 checkweigher. Calibrated with 500 g and 1 kg test weights.",
  "2495":"Follow-up after the 24 Sep sensor change: placement accurate at 55 packs a minute. Six-monthly service complete.",
  "2497":"TS-600 installed on line 3, commissioned with customer film, operators trained. Handover signed."
};
function applyScripted(engId, e){
  const d = day(engId, TODAY); d.ev.push(e);
  const E = eng(engId), j = e.job ? job(e.job) : null;
  if (e.type === "depart" && j && j.eng === engId && ["Scheduled","Unassigned"].indexOf(j.status) >= 0){ j.status = "Travelling"; jlog(j, E.name + " departed for " + cust(j.cust).name, E.name, "engineer", hm(e.t)); log(E.name, "engineer", "Departed for " + cust(j.cust).name + ", Job #" + j.id, [{type:"job", id:j.id}], hm(e.t)); }
  else if (e.type === "depart" && e.to === "base") log(E.name, "engineer", "Heading back to base", [{type:"engineer", id:engId}], hm(e.t));
  if (e.type === "arrive" && j && j.eng === engId && ["Travelling","Scheduled"].indexOf(j.status) >= 0){ j.status = "On Site"; jlog(j, E.name + " arrived on site", E.name, "engineer", hm(e.t)); log(E.name, "engineer", "Arrived at " + cust(j.cust).name, [{type:"job", id:j.id}], hm(e.t)); }
  if (e.type === "arrive" && e.place === "base") log(E.name, "engineer", "Back at base", [{type:"engineer", id:engId}], hm(e.t));
  if (e.type === "jobStart" && j && j.eng === engId){ if (j.status !== "On Site") j.status = "On Site"; j.started = hm(e.t); jlog(j, E.name + " started the job", E.name, "engineer", hm(e.t)); log(E.name, "engineer", "Started Job #" + j.id, [{type:"job", id:j.id}], hm(e.t)); }
  if (e.type === "part" && j) usePart(j, e.sku, e.qty || 1, e.from, engId, hm(e.t), true);
  if (e.type === "jobEnd" && j && j.eng === engId && j.status === "On Site"){
    j.report = {summary: REPORTS[j.id] || "Work completed.", by:engId, d:TODAY};
    j.signoff = {name:(cust(j.cust).contacts[0] || {}).name, d:TODAY, t:hm(e.t)};
    j.photos = Math.max(j.photos, 3); j.ended = hm(e.t); if (!j.parts.length) j.noParts = true;
    addDoc({kind:"Photo", name:"Completed work, Job #" + j.id, by:E.name, links:{job:j.id, machine:j.machine, cust:j.cust}}, j, hm(e.t));
    addDoc({kind:"Service report", name:"Service report, Job #" + j.id, by:E.name, links:{job:j.id, machine:j.machine, cust:j.cust}}, j, hm(e.t));
    finishJob(j, hm(e.t));
  }
  if (e.type === "signon") log(E.name, "engineer", "Signed on", [{type:"engineer", id:engId}], hm(e.t));
  if (e.type === "signoff") log(E.name, "engineer", "Signed off", [{type:"engineer", id:engId}], hm(e.t));
}

/* ---------- engineer days, positions and the zone ---------- */
function day(engId, d){ const k = engId + "|" + d; return S.days[k] = S.days[k] || {eng:engId, d, ev:[]}; }
/* Movement model: stays and legs between the first and last known moment. */
function track(dayObj, upto){
  const evs = dayObj.ev.filter(e => upto == null || e.t <= upto);
  if (!evs.length) return {segs:[], start:null, end:null, gaps:[], last:null};
  const segs = []; let cur = G.BASE.pos, t = evs[0].t, moving = null;
  const gaps = []; let gap = null, last = null, lost = false;
  const close = (tt, p) => { if (moving){ const pts = [[moving.t0, moving.p0]].concat((moving.via || []).filter(v => v.t < tt).map(v => [v.t, v.pos])).concat([[tt, p]]);
      for (let i = 0; i < pts.length - 1; i++) segs.push({t0:pts[i][0], t1:pts[i + 1][0], p0:pts[i][1], p1:pts[i + 1][1], move:true}); moving = null; } cur = p; t = tt; };
  evs.forEach(e => {
    if (e.type === "signon"){ cur = placePos(e.place) || cur; t = e.t; }
    else if (e.type === "depart"){ if (t < e.t) segs.push({t0:t, t1:e.t, p0:cur, p1:cur}); moving = {t0:e.t, p0:cur, to:placePos(e.to), eta:e.eta, via:e.via}; t = e.t; }
    else if (e.type === "arrive"){ close(e.t, placePos(e.place)); }
    else if (e.type === "lastSeen"){ close(e.t, e.pos); lost = true; last = e; }
    else if (e.type === "manualReturn"){ close(e.t, G.BASE.pos); last = e; }
    else if (e.type === "gapStart"){ gap = {from:e.t}; }
    else if (e.type === "gapEnd"){ if (gap){ gap.to = e.t; gaps.push(gap); gap = null; } }
    else if (e.type === "signoff"){ if (t < e.t && !moving) segs.push({t0:t, t1:e.t, p0:cur, p1:cur}); t = e.t; }
  });
  if (gap) gaps.push({from:gap.from, to:null});
  const end = upto != null ? upto : evs[evs.length - 1].t;
  if (moving && !lost){
    // Still on the road: position along the planned route up to `end`.
    const tt = Math.min(end, moving.eta || end); const f = moving.eta && moving.eta > moving.t0 ? (tt - moving.t0) / (moving.eta - moving.t0) : 1;
    const via = (moving.via || []).filter(v => v.t <= tt);
    const pts = [[moving.t0, moving.p0]].concat(via.map(v => [v.t, v.pos]));
    const lastPt = pts[pts.length - 1];
    const remF = moving.eta && moving.eta > lastPt[0] ? (tt - lastPt[0]) / (moving.eta - lastPt[0]) : f;
    pts.push([tt, G.lerp(lastPt[1], moving.to, Math.max(0, Math.min(1, remF)))]);
    for (let i = 0; i < pts.length - 1; i++) segs.push({t0:pts[i][0], t1:pts[i + 1][0], p0:pts[i][1], p1:pts[i + 1][1], move:true});
    cur = pts[pts.length - 1][1];
  } else if (!lost && t < end) segs.push({t0:t, t1:end, p0:cur, p1:cur});
  return {segs, start:evs[0].t, end, gaps, last, lost, moving: !!moving && !lost, pos:cur};
}
function posAtSegs(segs, t){
  for (const s of segs){ if (t >= s.t0 && t <= s.t1){ const f = s.t1 > s.t0 ? (t - s.t0) / (s.t1 - s.t0) : 0; return G.lerp(s.p0, s.p1, f); } }
  return segs.length ? segs[segs.length - 1].p1 : G.BASE.pos;
}
/* Subsistence for one engineer-day. Derived every time from the location events and the rules. */
function subDay(engId, d){
  const k = engId + "|" + d, r = S.rules.subsistence, isToday = d === TODAY;
  return memo("sub|" + k + "|" + r.radius + "|" + r.bands.map(b => b.min + ":" + b.amount).join(",") + "|" + (isToday ? S.clock : ""), () => {
    const dayObj = S.days[k]; const E = eng(engId);
    const rec = {key:k, eng:engId, d, exit:null, ret:null, away:0, band:null, allowance:0, flags:[], stops:[], status:"No data", inProgress:false};
    if (!dayObj || dayObj.leave){ rec.status = dayObj && dayObj.leave ? "On leave" : "No data"; return rec; }
    const tr = track(dayObj, isToday ? S.clock : null);
    if (tr.start == null) return rec;
    const R = r.radius, dist = (t) => G.km(G.BASE.pos, posAtSegs(tr.segs, t));
    let first = null, lastOut = null;
    for (let t = tr.start; t <= tr.end; t++){ if (dist(t) >= R){ if (first == null) first = t; lastOut = t; } }
    rec.exit = first;
    const evs = dayObj.ev.filter(e => !isToday || e.t <= S.clock);
    const finished = evs.some(e => e.type === "signoff" || e.type === "manualReturn" || e.type === "lastSeen") || (!isToday);
    const stillOut = first != null && lastOut === tr.end && dist(tr.end) >= R;
    if (first != null){
      if (stillOut && isToday && !tr.lost){ rec.inProgress = true; rec.ret = null; rec.away = S.clock - first; }
      else { rec.ret = lastOut; rec.away = lastOut - first; }
    }
    // stops
    let arr = null;
    evs.forEach(e => {
      if (e.type === "arrive" && e.place !== "base") arr = {place:e.place, arr:e.t, dep:null, job:e.job || null};
      if (e.type === "jobStart" && arr){ arr.job = e.job; arr.start = e.t; }
      if (e.type === "jobEnd" && arr){ arr.end = e.t; arr.billable = e.billable !== false; }
      if (e.type === "depart" && arr){ arr.dep = e.t; rec.stops.push(arr); arr = null; }
    });
    if (arr) rec.stops.push(arr);
    rec.stops.forEach(s => { const j = s.job ? job(s.job) : null; if (j){ s.billable = j.billable && j.type !== "Site measurement"; s.jobType = j.type; } else if (s.billable == null) s.billable = true; });
    // exceptions
    tr.gaps.forEach(g => rec.flags.push({type:"gap", title:"GPS gap", text:"Location unavailable " + hm(g.from) + (g.to ? " to " + hm(g.to) : " onwards"), from:g.from, to:g.to}));
    if (tr.lost && tr.last){ rec.flags.push({type:"noReturn", title:"No return detected", text:"Last location " + hm(tr.last.t) + ", still outside qualifying zone", t:tr.last.t}); }
    const man = evs.find(e => e.type === "manualReturn");
    if (man){ rec.flags.push({type:"manual", title:"Manual adjustment", text:E.name.split(" ")[0] + " manually marked: Returned " + hm(man.t), t:man.t, note:man.note}); rec.ret = man.t; rec.away = man.t - (first || man.t); }
    // band
    const hrs = rec.away / 60; const bands = r.bands.slice().sort((a, b) => b.min - a.min);
    const b = bands.find(x => hrs >= x.min);
    if (b){ rec.band = r.bands.indexOf(b); rec.allowance = b.amount; }
    const rv = S.subReview[k];
    if (rec.inProgress) rec.status = "In progress";
    else if (rv) rec.status = rv.status;
    else if (rec.flags.length) rec.status = "Review required";
    else if (rec.band == null) rec.status = first == null ? "Inside zone" : "Below threshold";
    else rec.status = "Auto-calculated";
    rec.review = rv || null;
    rec.provisional = rec.flags.length > 0 && !rv;
    return rec;
  });
}
/* Timeline for the subsistence day view (brief format). */
function subTimeline(engId, d){
  const rec = subDay(engId, d), dayObj = S.days[engId + "|" + d]; if (!dayObj) return [];
  const out = [], isToday = d === TODAY;
  const evs = dayObj.ev.filter(e => !isToday || e.t <= S.clock);
  evs.forEach(e => {
    const j = e.job ? job(e.job) : null;
    if (e.type === "signon") out.push({t:e.t, text:"Signed on", sub:placeName(e.place), kind:"muted"});
    if (e.type === "depart") out.push({t:e.t, text:"Departed", sub:placeName(e.from) + " → " + placeName(e.to), kind:"move"});
    if (e.type === "arrive") out.push({t:e.t, text: e.place === "base" ? "Arrived at base" : "Arrived", sub:placeName(e.place), kind: e.place === "base" ? "muted" : "stop"});
    if (e.type === "jobStart" && j) out.push({t:e.t, text: j.type === "Site measurement" ? "Site measurement" : "Started Job #" + j.id, sub:j.type === "Site measurement" ? "Non-billable visit" : cust(j.cust).name, kind:"job", job:j.id, nonBillable: !j.billable || j.type === "Site measurement"});
    if (e.type === "jobEnd" && j) out.push({t:e.t, text:"Completed " + (j.type === "Site measurement" ? "site measurement" : "Job #" + j.id), sub: j.billable && j.type !== "Site measurement" ? "Chargeable" : "Non-billable", kind:"job", job:j.id, nonBillable: !j.billable || j.type === "Site measurement"});
    if (e.type === "part") out.push({t:e.t, text:"Part used " + e.sku, sub:"Job #" + e.job, kind:"muted"});
    if (e.type === "gapStart") out.push({t:e.t, text:"Location unavailable", sub:"Signal lost", kind:"warn"});
    if (e.type === "gapEnd") out.push({t:e.t, text:"Location restored", sub:"", kind:"warn"});
    if (e.type === "lastSeen") out.push({t:e.t, text:"Last location received", sub:"Outside qualifying zone", kind:"warn"});
    if (e.type === "manualReturn") out.push({t:e.t, text:"Manually marked: returned", sub:e.note || "", kind:"warn"});
    if (e.type === "signoff") out.push({t:e.t, text:"Signed off", sub:"", kind:"muted"});
  });
  if (rec.exit != null) out.push({t:rec.exit, text:"Exited Myers qualifying zone", sub:S.rules.subsistence.radius + " km radius", kind:"zone", order:-1});
  if (rec.ret != null && !rec.flags.some(f => f.type === "manual") && !rec.flags.some(f => f.type === "noReturn")) out.push({t:rec.ret, text:"Returned to Myers qualifying zone", sub:"", kind:"zone", order:1});
  return out.sort((a, b) => a.t - b.t || (a.order || 0) - (b.order || 0));
}
/* Live status for an engineer at the story clock. */
function engNow(engId){
  return memo("eng|" + engId + "|" + S.clock, () => {
    const E = eng(engId), dayObj = S.days[engId + "|" + TODAY] || {ev:[]};
    const jobsToday = Object.values(S.jobs).filter(j => j.date === TODAY && j.eng === engId && !j.draft).sort((a, b) => (a.start || "99").localeCompare(b.start || "99"));
    const done = jobsToday.filter(j => DONE.indexOf(j.status) >= 0);
    const out = {id:engId, name:E.name, van:E.van, jobs:jobsToday, done, status:"Not signed on", place:null, pos:G.BASE.pos, job:null, eta:null, travel:0, onsite:0, away:0, parts:0, sub:null};
    if (E.leave){ out.status = "On leave"; return out; }
    const evs = dayObj.ev;
    if (!evs.length) return out;
    const tr = track(dayObj, S.clock); out.pos = tr.pos;
    let st = "At base", place = "base", curJob = null, eta = null, arrT = null;
    evs.forEach(e => {
      if (e.type === "signon"){ st = "At base"; place = "base"; }
      if (e.type === "depart"){ st = "Travelling"; place = e.to; eta = e.eta; curJob = e.job || null; }
      if (e.type === "arrive"){ st = e.place === "base" ? "At base" : "On site"; place = e.place; eta = null; arrT = e.t; if (e.job) curJob = e.job; }
      if (e.type === "jobStart") curJob = e.job;
      if (e.type === "jobEnd" && curJob === e.job) curJob = null;
      if (e.type === "signoff"){ st = "Signed off"; place = "base"; }
    });
    out.status = st; out.place = place; out.eta = eta; out.since = arrT;
    const cj = curJob ? job(curJob) : jobsToday.find(j => ["Travelling","On Site","Paused"].indexOf(j.status) >= 0);
    out.job = cj || null;
    out.next = jobsToday.find(j => j.status === "Scheduled" && j !== out.job) || null;
    tr.segs.forEach(s => { if (s.move) out.travel += s.t1 - s.t0; });
    let a = null; evs.forEach(e => { if (e.type === "arrive" && e.place !== "base") a = e.t; if (e.type === "depart" && a != null){ out.onsite += e.t - a; a = null; } });
    if (a != null && st === "On site") out.onsite += S.clock - a;
    out.parts = evs.filter(e => e.type === "part").reduce((n, e) => n + (e.qty || 1), 0);
    out.sub = subDay(engId, TODAY); out.away = out.sub.away;
    out.where = st === "Travelling" ? "To " + placeName(place) : st === "On site" ? placeName(place) + (site(place) ? ", " + site(place).town.split(",")[0] : "") : st === "At base" ? "Myers base" : st === "Signed off" ? "Signed off" : "";
    return out;
  });
}
const DONE = ["Engineer Complete","Review Required","Ready for Invoice","Sent to QuickBooks","Closed"];
const OPEN = ["Unassigned","Scheduled","Travelling","On Site","Paused","Awaiting Part"];

/* ---------- stock ---------- */
const stockTotal = (sku) => Object.keys(S.stock).reduce((n, l) => n + (S.stock[l][sku] || 0), 0);
const stockBy = (sku) => Object.keys(S.stock).filter(l => S.stock[l][sku] != null && (S.stock[l][sku] > 0 || l === "main" || (S.vanMin[l] || {})[sku] != null)).map(l => ({loc:l, qty:S.stock[l][sku] || 0, min:(S.vanMin[l] || {})[sku] || null}));
const openReorder = (sku) => S.reorders.find(r => r.sku === sku && ["Requested","Ordered"].indexOf(r.status) >= 0);
function lowStock(){
  return memo("low", () => {
    const out = [];
    Object.values(S.parts).forEach(p => { const tot = stockTotal(p.sku); if (tot < p.reorder) out.push({kind:"reorder", sku:p.sku, loc:"all", qty:tot, min:p.reorder, open:openReorder(p.sku) || null}); });
    Object.keys(S.vanMin).forEach(v => Object.keys(S.vanMin[v]).forEach(sku => { const q = S.stock[v][sku] || 0; if (q < S.vanMin[v][sku]) out.push({kind:"van", sku, loc:v, qty:q, min:S.vanMin[v][sku], open:openReorder(sku) || null}); }));
    return out;
  });
}
function usePart(j, sku, qty, from, engId, t, scripted, docId){
  S.stock[from] = S.stock[from] || {}; const before = S.stock[from][sku] || 0; S.stock[from][sku] = Math.max(0, before - qty);
  j.parts.push({sku, qty, from, t, by:engId, doc:docId || null}); j.noParts = false;
  S.moves.unshift({d:TODAY, t, type:"Used", sku, qty, from, job:j.id, eng:engId, by:eng(engId).name});
  const E = eng(engId), P = part(sku);
  log(E.name, "engineer", (scripted ? "Recorded part " : "Scanned part ") + sku + " on Job #" + j.id, [{type:"job", id:j.id},{type:"part", id:sku}], t);
  log("Pulse", "system", loc(from).name + " stock updated: " + sku + " " + before + " → " + S.stock[from][sku], [{type:"part", id:sku}], t);
  jlog(j, "Part " + sku + " " + P.name + " × " + qty + " from " + loc(from).name, E.name, "engineer", t);
  // Low stock check
  const tot = stockTotal(sku), vm = (S.vanMin[from] || {})[sku];
  const flags = [];
  if (vm != null && S.stock[from][sku] < vm) flags.push(loc(from).name + " below minimum (" + S.stock[from][sku] + " of " + vm + ")");
  if (tot < P.reorder && !openReorder(sku)){ flags.push("Total " + tot + ", reorder level " + P.reorder); ai("parts", "Low stock on " + sku + ": " + tot + " left against a reorder level of " + P.reorder + ". Suggested reorder " + P.reorderQty + " from " + P.supplier + ".", [{type:"part", id:sku}], "Awaiting confirmation");
    log("Parts Assistant", "ai", "Reorder suggested for " + sku + ": " + P.reorderQty + " from " + P.supplier, [{type:"part", id:sku}], t); }
  return {before, after:S.stock[from][sku], flags, tot};
}

/* ---------- documents ---------- */
function addDoc(o, j, t){
  const id = "D-" + (S.docNext++);
  S.docs[id] = Object.assign({id, d:TODAY, t: t || hm(S.clock), size: o.kind === "Photo" || o.kind === "Label photo" ? "2.3 MB" : "160 KB"}, o);
  Object.keys(S.docs[id].links).forEach(k => { if (S.docs[id].links[k] == null) delete S.docs[id].links[k]; });
  if (j) j.docs.push(id);
  if (o.links.machine && mach(o.links.machine)) mach(o.links.machine).docs = (mach(o.links.machine).docs || []).concat([id]);
  if (o.links.warranty && claim(o.links.warranty)) claim(o.links.warranty).docs.push(id);
  return id;
}

/* ---------- jobs: value, checks, completion ---------- */
function jobTimes(j){
  if (j.date !== TODAY || !j.eng) return {travel:j.travel || 0, onsite:j.actual || 0};
  const dayObj = S.days[j.eng + "|" + TODAY]; if (!dayObj) return {travel:0, onsite:0};
  let travel = 0, onsite = 0, dep = null, st = null;
  dayObj.ev.forEach(e => {
    if (e.type === "depart" && e.job === j.id) dep = e.t;
    if (e.type === "arrive" && dep != null && (e.job === j.id || e.place === j.site)){ travel += e.t - dep; dep = null; }
    if (e.type === "jobStart" && e.job === j.id) st = e.t;
    if (e.type === "jobEnd" && e.job === j.id && st != null){ onsite += e.t - st; st = null; }
  });
  if (dep != null) travel += S.clock - dep;
  if (st != null) onsite += S.clock - st;
  return {travel, onsite};
}
function jobValue(j){
  const r = S.rules.invoice, tm = jobTimes(j);
  const lines = [];
  if (j.type === "Breakdown" && j.billable) lines.push({label:"Call-out", amount:r.callout});
  lines.push({label:"Labour " + dur(tm.onsite) + " at " + eur(r.labour) + "/h", amount:tm.onsite / 60 * r.labour});
  lines.push({label:"Travel " + dur(tm.travel) + " at " + eur(r.travel) + "/h", amount:tm.travel / 60 * r.travel});
  j.parts.forEach(p => lines.push({label:p.sku + " " + part(p.sku).name + " × " + p.qty, amount:part(p.sku).sell * p.qty, part:true}));
  const total = j.estOverride || lines.reduce((n, l) => n + l.amount, 0);
  const partsCost = j.parts.reduce((n, p) => n + part(p.sku).cost * p.qty, 0);
  return {lines, total:Math.round(total), partsCost, times:tm, billable:j.billable && j.type !== "Site measurement" && j.type !== "Warranty"};
}
function jobChecks(j){
  const tm = jobTimes(j);
  return [
    {k:"machine", label:"Machine identified", ok: !!j.machine, fix:"Pick the machine"},
    {k:"labour", label:"Labour recorded", ok: tm.onsite > 0, v:dur(tm.onsite)},
    {k:"travel", label:"Travel recorded", ok: tm.travel > 0, v:dur(tm.travel)},
    {k:"parts", label:"Parts recorded", ok: j.parts.length > 0 || j.noParts, v: j.parts.length ? j.parts.length + " part" + (j.parts.length > 1 ? "s" : "") : "No parts used"},
    {k:"report", label:"Completion report", ok: !!(j.report && j.report.summary), v: j.report ? "Complete" : "Missing"},
    {k:"photos", label:"Photos", ok: j.photos > 0 || j.docs.some(id => doc(id) && /photo/i.test(doc(id).kind)), v: (j.photos || j.docs.filter(id => doc(id) && /photo/i.test(doc(id).kind)).length) + " on file"},
    {k:"signoff", label:"Customer confirmation", ok: !!j.signoff, v: j.signoff ? "Recorded" : "Missing"}
  ];
}
/* After the engineer completes: warranty jobs raise a claim, non-billable close, the rest are checked. */
function finishJob(j, t){
  j.status = "Engineer Complete";
  jlog(j, "Engineer completed the job", eng(j.eng).name, "engineer", t);
  log(eng(j.eng).name, "engineer", "Completed Job #" + j.id, [{type:"job", id:j.id}], t);
  const t2 = hm(toMin(t) + 2);
  if (j.type === "Site measurement" || (!j.billable && j.type !== "Warranty")){
    j.status = "Closed"; jlog(j, "Non-billable visit closed. Nothing sent to QuickBooks.", "Pulse", "system", t2);
    log("Pulse", "system", "Job #" + j.id + " closed as non-billable", [{type:"job", id:j.id}], t2); return;
  }
  if (j.type === "Warranty"){
    const cid = "W-" + (S.claimNext++); const p = j.parts[0];
    S.claims[cid] = {id:cid, cust:j.cust, machine:j.machine, part: p ? p.sku : null, job:j.id, mfr:model(j.machine).mfr, stage:"Active", status:"Drafted by Pulse",
      value: Math.round((p ? part(p.sku).cost : 0) + jobTimes(j).onsite / 60 * S.rules.invoice.labour), submitted:null, docs:[], note:"Drafted from the job sheet: serial, install date, fault, photos and labour already filled in."};
    j.docs.forEach(id => { const dd = doc(id); if (dd){ dd.links.warranty = cid; S.claims[cid].docs.push(id); } });
    j.warranty = cid; j.status = "Review Required"; j.reviewReason = "Warranty job: check the drafted claim " + cid + " before it goes to " + model(j.machine).mfr;
    jlog(j, "Warranty claim " + cid + " drafted for " + model(j.machine).mfr + ". Held for manager review.", "Pulse", "system", t2);
    log("Pulse", "system", "Warranty claim " + cid + " drafted from Job #" + j.id, [{type:"warranty", id:cid},{type:"job", id:j.id}], t2); return;
  }
  const fails = jobChecks(j).filter(c => !c.ok);
  if (fails.length){ j.status = "Review Required"; j.reviewReason = "Missing: " + fails.map(c => c.label.toLowerCase()).join(", ");
    jlog(j, "Held for review. " + j.reviewReason + ".", "Pulse", "system", t2); log("Pulse", "system", "Job #" + j.id + " held for review: " + fails.map(c => c.label.toLowerCase()).join(", "), [{type:"job", id:j.id}], t2); }
  else { j.status = "Ready for Invoice"; jlog(j, "Checks passed: labour, travel, parts, report, photos, customer confirmation. Ready for invoice.", "Pulse", "system", t2);
    log("Pulse", "system", "Job #" + j.id + " moved to Ready for Invoice", [{type:"job", id:j.id}], t2); }
}

/* ---------- needs attention (one queue) ---------- */
function needs(){
  return memo("needs", () => {
    const out = [];
    const add = (o) => { if (!S.resolved[o.id]) out.push(o); };
    Object.values(S.jobs).filter(j => j.prio === "Urgent" && OPEN.indexOf(j.status) >= 0).forEach(j => {
      const en = j.eng ? engNow(j.eng) : null;
      add({id:"urgent:" + j.id, cat:"URGENT", title:"Urgent breakdown", head:cust(j.cust).name + ", " + model(j.machine).type, detail:j.issue,
        meta: en ? en.name + " · " + (j.status === "Travelling" && en.eta ? "travelling, ETA " + hm(en.eta) : j.status.toLowerCase()) : "No engineer", refs:[{type:"job", id:j.id}], go:"jobs/" + j.id, rank:0});
    });
    S.requests.filter(r => r.status === "Triaged" || r.status === "New").forEach(r => {
      const c = r.ai && r.ai.cust ? cust(r.ai.cust).name : r.from;
      add({id:"request:" + r.id, cat:"APPROVAL", title: r.status === "Triaged" ? "AI draft waiting for you" : "New service request", head:c + (r.job ? ", draft Job #" + r.job : ""),
        detail: r.status === "Triaged" ? r.ai.cls + ". Suggested engineer: " + eng(r.ai.eng).name + "." : r.ai.action, refs:[{type:"request", id:r.id}], go:"desk/" + r.id, rank: r.ai.urgency === "High" ? 1 : 3});
    });
    Object.values(S.jobs).filter(j => j.status === "Awaiting Part" && j.date === TODAY).forEach(j => {
      const a = j.awaiting || {}; const v = loc(eng(j.eng).van).name;
      add({id:"part:" + j.id, cat:"STOCK", title:"Part required", head:"Job #" + j.id + ", " + cust(j.cust).name, detail:(part(a.sku) ? part(a.sku).name : "Part") + " unavailable in " + v + (a.reorder ? ". " + a.reorder + " due " + U.rel(S.reorders.find(r => r.id === a.reorder).eta).toLowerCase() : ""), refs:[{type:"job", id:j.id},{type:"part", id:a.sku}], go:"jobs/" + j.id, rank:2});
    });
    lowStock().filter(l => l.kind === "reorder" && !l.open).forEach(l => {
      const P = part(l.sku);
      add({id:"stock:" + l.sku, cat:"STOCK", title:"Below reorder point", head:l.sku + " " + P.name, detail:"Available " + l.qty + ", minimum " + l.min + ". Suggested " + P.reorderQty + " from " + P.supplier + ".", refs:[{type:"part", id:l.sku}], go:"parts/" + l.sku, rank:2, action:{label:"Create reorder request", fn:"createReorder", arg:l.sku}});
    });
    Object.values(S.jobs).filter(j => j.status === "Review Required").forEach(j => add({id:"review:" + j.id, cat:"APPROVAL", title:"Job needs review", head:"Job #" + j.id + ", " + cust(j.cust).name, detail:j.reviewReason || "Held for review", refs:[{type:"job", id:j.id}], go:"jobs/" + j.id, rank:2}));
    const ready = Object.values(S.jobs).filter(j => j.status === "Ready for Invoice");
    if (ready.length) add({id:"ready:" + ready.map(j => j.id).join(","), cat:"APPROVAL", title:"Ready for invoice", head:ready.length + " completed job" + (ready.length > 1 ? "s" : ""), detail:eur(ready.reduce((n, j) => n + jobValue(j).total, 0)) + " estimated value, waiting to go to QuickBooks", refs:[], go:"jobs?view=ready", rank:3});
    Object.values(S.claims).filter(c => c.overdue && c.stage === "Awaiting manufacturer").forEach(c => add({id:"warranty:" + c.id, cat:"WARRANTY", title:"Manufacturer response overdue", head:c.id + ", " + cust(c.cust).name, detail:c.mfr + " was due to respond by " + U.dm(c.due) + ". " + eur(c.value) + " claim.", refs:[{type:"warranty", id:c.id}], go:"warranties/" + c.id, rank:4, action:{label:"Chase " + c.mfr, fn:"chaseClaim", arg:c.id}}));
    Object.values(S.days).forEach(dd => { if (dd.d === TODAY) return; const r = subDay(dd.eng, dd.d); if (r.flags.length && !r.review){ const f = r.flags[0];
      add({id:"sub:" + r.key, cat:"SUBSISTENCE", title:f.title, head:eng(dd.eng).name + ", " + U.wdm(dd.d), detail:f.text + (f.type === "manual" ? ". Manager confirmation required." : ". Review required."), refs:[{type:"engineer", id:dd.eng}], go:"subsistence/day/" + dd.eng + "/" + dd.d, rank:4}); } });
    Object.values(S.jobs).filter(j => j.dataIssue && !j.machine).forEach(j => add({id:"data:" + j.id, cat:"DATA", title:"Missing data", head:"Job #" + j.id + ", " + cust(j.cust).name, detail:"Machine serial number missing from Job #" + j.id + ".", refs:[{type:"job", id:j.id}], go:"jobs/" + j.id, rank:5}));
    return out.sort((a, b) => a.rank - b.rank);
  });
}

/* ---------- morning briefing ---------- */
function briefing(){
  const jt = Object.values(S.jobs).filter(j => j.date === TODAY);
  const engs = Object.values(S.engineers).filter(e => !e.leave).length;
  const urgent = Object.values(S.jobs).filter(j => j.prio === "Urgent" && OPEN.indexOf(j.status) >= 0);
  const await_ = Object.values(S.jobs).filter(j => j.status === "Awaiting Part");
  const ready = Object.values(S.jobs).filter(j => j.status === "Ready for Invoice");
  const subs = needs().filter(n => n.cat === "SUBSISTENCE");
  const watch = [];
  const fp = job("2492"); if (OPEN.indexOf(fp.status) >= 0) watch.push({text:"FreshPak breakdown remains urgent. Line 1 stopped, David Ryan " + (fp.status === "Travelling" ? "en route" : "on site") + ".", go:"jobs/2492"});
  const rq = request("RQ-3107"); if (rq && rq.status === "Triaged") watch.push({text:"Glenmore Foods, Line 2 labeller: draft job #2491 needs an engineer. Pulse suggests Sean Murphy.", go:"desk/RQ-3107"});
  const low = lowStock().filter(l => l.kind === "reorder" && !l.open); low.slice(0, 1).forEach(l => watch.push({text:l.sku + " is below its reorder level (" + l.qty + " of " + l.min + ").", go:"parts/" + l.sku}));
  if (!low.length){ const g = job("2488"); if (g.status === "Awaiting Part") watch.push({text:"GreenFarm #2488 waits on bearing 6204-2RS, due tomorrow on RO-0331.", go:"jobs/2488"}); }
  if (subs.length) watch.push({text:(subs.length === 1 ? "One subsistence record requires" : ["","","Two","Three","Four"][subs.length] + " subsistence records require") + " review.", go:"subsistence/exceptions"});
  if (ready.length) watch.push({text:(ready.length === 5 ? "Five" : ready.length) + " job" + (ready.length > 1 ? "s" : "") + " from Friday " + (ready.length > 1 ? "are" : "is") + " ready for QuickBooks (" + eur(ready.reduce((n, j) => n + jobValue(j).total, 0)) + " est.).", go:"jobs?view=ready"});
  return {today:[[jt.length, "service jobs"],[engs, "engineers scheduled"],[urgent.length, "urgent jobs"],[await_.length, "jobs awaiting parts"]], watch};
}

/* ---------- knowledge graph ---------- */
function graph(ref){
  const N = [], E = [];
  const node = (type, id) => ({type, id, key:type + ":" + id, label:label({type, id}), sub:subLabel({type, id})});
  const add = (from, type, id, rel) => { if (!id) return; const n = node(type, id); if (!N.find(x => x.key === n.key)) N.push(n); E.push({from:from.key, to:n.key, rel}); };
  const root = node(ref.type, ref.id); N.push(root);
  if (ref.type === "customer"){ const c = cust(ref.id); c.sites.forEach(s => add(root, "site", s, "has site")); c.contacts.slice(0, 1).forEach(ct => {}); Object.values(S.jobs).filter(j => j.cust === ref.id && OPEN.concat(["Engineer Complete","Review Required","Ready for Invoice"]).indexOf(j.status) >= 0).slice(0, 3).forEach(j => add(root, "job", j.id, "open job")); S.quotes.filter(q => q.cust === ref.id).forEach(q => add(root, "quote", q.id, "quote")); }
  if (ref.type === "site"){ const s = site(ref.id); add(root, "customer", s.cust, "site of"); Object.values(S.machines).filter(m => m.site === ref.id).forEach(m => add(root, "machine", m.id, "has machine")); }
  if (ref.type === "machine"){ const m = mach(ref.id); add(root, "site", m.site, "installed at"); Object.values(S.jobs).filter(j => j.machine === ref.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4).forEach(j => add(root, "job", j.id, "service job"));
    Object.values(S.claims).filter(c => c.machine === ref.id).forEach(c => add(root, "warranty", c.id, "warranty claim")); }
  if (ref.type === "job"){ const j = job(ref.id); add(root, "machine", j.machine, "on machine"); add(root, "site", j.site, "at site"); add(root, "engineer", j.eng, "engineer"); j.parts.forEach(p => add(root, "part", p.sku, "used part")); if (j.warranty) add(root, "warranty", j.warranty, "claim"); if (j.qb) add(root, "qb", j.id, "QuickBooks"); j.docs.slice(-3).forEach(d => add(root, "doc", d, "document")); }
  if (ref.type === "engineer"){ const e = eng(ref.id); add(root, "location", e.van, "drives"); Object.values(S.jobs).filter(j => j.eng === ref.id && j.date === TODAY).forEach(j => add(root, "job", j.id, "today")); }
  if (ref.type === "part"){ stockBy(ref.id).filter(x => x.qty > 0).forEach(x => add(root, "location", x.loc, "stocked in")); const used = S.moves.filter(m => m.sku === ref.id && m.job).slice(0, 3); used.forEach(m => add(root, "job", m.job, "used on")); }
  if (ref.type === "location"){ const l = loc(ref.id); if (l.eng) add(root, "engineer", l.eng, "driven by"); Object.keys(S.stock[ref.id] || {}).filter(k => S.stock[ref.id][k] > 0 && part(k).models.length).slice(0, 5).forEach(k => add(root, "part", k, "carries")); }
  if (ref.type === "warranty"){ const c = claim(ref.id); add(root, "customer", c.cust, "customer"); add(root, "machine", c.machine, "machine"); add(root, "job", c.job, "job"); add(root, "part", c.part, "failed part"); c.docs.slice(0, 2).forEach(d => add(root, "doc", d, "document")); }
  return {nodes:N, edges:E, root};
}

/* ---------- labels and links ---------- */
function label(r){
  const t = r.type, id = r.id;
  if (t === "job") return "Job #" + id; if (t === "customer") return cust(id) ? cust(id).name : id; if (t === "site") return site(id) ? site(id).name : id;
  if (t === "machine") return mach(id) ? REF.MODELS[mach(id).model].name : id; if (t === "engineer") return eng(id) ? eng(id).name : id; if (t === "part") return id;
  if (t === "location") return loc(id) ? loc(id).name : id; if (t === "warranty") return id; if (t === "doc") return doc(id) ? doc(id).name : id;
  if (t === "request") return id; if (t === "quote") return id; if (t === "qb") return job(id) && job(id).qb ? job(id).qb.ref : "QuickBooks"; return id;
}
function subLabel(r){
  const t = r.type, id = r.id;
  if (t === "job"){ const j = job(id); return j ? j.status : ""; } if (t === "machine") return id; if (t === "part") return part(id) ? part(id).name : "";
  if (t === "site") return site(id) ? site(id).town : ""; if (t === "customer") return "Customer"; if (t === "engineer") return eng(id) ? loc(eng(id).van).name : "";
  if (t === "location") return loc(id) && loc(id).kind === "van" ? "Van stock" : "Stores"; if (t === "warranty") return claim(id) ? claim(id).status : ""; if (t === "doc") return doc(id) ? doc(id).kind : "";
  if (t === "qb"){ const j = job(id); return j && j.qb ? j.qb.status : ""; } if (t === "quote"){ const q = S.quotes.find(x => x.id === id); return q ? q.status : ""; } return "";
}
MP.link = function(r){
  const t = r.type, id = r.id;
  return ({job:"jobs/", customer:"customers/", site:"customers/", machine:"machines/", engineer:"engineers/", part:"parts/", location:"parts/location/", warranty:"warranties/", doc:"documents/", request:"desk/", qb:"jobs/", quote:"customers/"})[t]
    + (t === "site" ? site(id).cust : t === "quote" ? (S.quotes.find(q => q.id === id) || {}).cust : id);
};

/* ---------- selectors ---------- */
MP.q = {
  job, cust, site, mach, model, part, eng, loc, claim, doc, request, placeName, placePos, label, subLabel, staffName,
  DONE, OPEN,
  jobs: (f) => Object.values(S.jobs).filter(f || (() => true)).sort((a, b) => b.date.localeCompare(a.date) || (b.start || "").localeCompare(a.start || "") || b.id.localeCompare(a.id)),
  jobsToday: () => Object.values(S.jobs).filter(j => j.date === TODAY).sort((a, b) => (a.start || "99").localeCompare(b.start || "99")),
  engNow, day: (e, d) => S.days[e + "|" + d] || null, track, posAtSegs,
  subDay, subTimeline,
  subMonth: (ym) => memo("month|" + ym + "|" + S.rules.subsistence.radius + "|" + JSON.stringify(S.rules.subsistence.bands) + "|" + S.clock + "|" + Object.keys(S.subReview).length, () =>
    Object.values(S.days).filter(d => d.d.slice(0, 7) === ym && !d.leave).map(d => subDay(d.eng, d.d)).sort((a, b) => b.d.localeCompare(a.d) || eng(a.eng).name.localeCompare(eng(b.eng).name))),
  stockTotal, stockBy, lowStock, openReorder,
  jobTimes, jobValue, jobChecks,
  needs, briefing, graph,
  machineJobs: (mid) => Object.values(S.jobs).filter(j => j.machine === mid).sort((a, b) => b.date.localeCompare(a.date)),
  machineParts: (mid) => { const out = []; Object.values(S.jobs).filter(j => j.machine === mid).forEach(j => j.parts.forEach(p => out.push(Object.assign({job:j.id, d:j.date}, p)))); return out.sort((a, b) => b.d.localeCompare(a.d)); },
  custJobs: (cid) => Object.values(S.jobs).filter(j => j.cust === cid).sort((a, b) => b.date.localeCompare(a.date)),
  custStats: (cid) => { const js = Object.values(S.jobs).filter(j => j.cust === cid); return {sites:cust(cid).sites.length, machines:Object.values(S.machines).filter(m => m.cust === cid).length,
    open:js.filter(j => OPEN.indexOf(j.status) >= 0 && !j.draft).length, ytd:js.filter(j => j.date >= "2026-01-01").length}; },
  docsFor: (r) => { const k = {job:"job", machine:"machine", customer:"cust", part:"part", warranty:"warranty"}[r.type]; return Object.values(S.docs).filter(d => d.links[k] === r.id || (r.type === "machine" && d.links.model === (mach(r.id) || {}).model)).sort((a, b) => (b.d + b.t).localeCompare(a.d + a.t)); },
  activityFor: (r) => S.activity.filter(a => a.refs.some(x => x.type === r.type && x.id === r.id)).slice().reverse(),
  partMoves: (sku) => S.moves.filter(m => m.sku === sku),
  warrantyActive: (mid) => { const m = mach(mid); return !!(m && m.warrantyEnd && m.warrantyEnd >= TODAY); },
  recommend: (jobId) => recommend(jobId)
};

/* Dispatch Assistant: rank engineers for a job. */
function recommend(jobId){
  const j = job(jobId), M = model(j.machine), P = j.possibleParts || [];
  return Object.values(S.engineers).filter(e => !e.leave).map(e => {
    const n = engNow(e.id), why = [], against = [];
    const cert = M && e.certs.indexOf(M.mfr) >= 0, skill = e.skills.indexOf(j.skill || (M && M.skill)) >= 0;
    if (cert) why.push("Certified on " + M.mfr); else if (skill) why.push("Skilled in " + (j.skill || M.skill).toLowerCase()); else against.push("Not certified on " + (M ? M.mfr : "this machine"));
    const inVan = P.filter(sku => (S.stock[e.van][sku] || 0) > 0);
    if (inVan.length) why.push(loc(e.van).name + " carries likely required " + inVan.join(", ") + " (" + S.stock[e.van][inVan[0]] + ")"); else if (P.length) against.push("Likely part not in " + loc(e.van).name);
    const from = n.status === "Travelling" ? placePos(n.place) : n.pos, mins = G.driveMin(from, site(j.site).pos), kmv = Math.round(G.km(from, site(j.site).pos) * 1.25);
    const busy = n.jobs.filter(x => x.id !== j.id && OPEN.indexOf(x.status) >= 0 && x.status !== "Awaiting Part");
    const committed = busy.filter(x => x.prio === "Urgent" || ["Travelling","On Site"].indexOf(x.status) >= 0);
    const freeUntil = busy.filter(x => x.status === "Scheduled" && x.start).map(x => x.start).sort()[0];
    const clash = !committed.length && freeUntil && toMin(freeUntil) < S.clock + mins + (j.dur || 90);
    if (committed.length) against.push("Committed to Job #" + committed[0].id + (committed[0].prio === "Urgent" ? " (urgent)" : ""));
    else if (clash){ const b = busy.find(x => x.start === freeUntil); against.push("Booked at " + freeUntil + (b ? " (" + cust(b.cust).name + ")" : "")); }
    else why.push(n.status === "At base" ? "At base now, free" + (freeUntil ? " until " + freeUntil : " all day") : "Available" + (freeUntil ? " until " + freeUntil : ""));
    why.push(kmv + " km away, about " + dur(mins));
    const score = (cert ? 40 : skill ? 20 : 0) + inVan.length * 25 - committed.length * 60 - (clash ? 35 : 0) - mins / 6;
    return {eng:e.id, name:e.name, score, why, against, mins, km:kmv, eta:hm(S.clock + 10 + mins), inVan};
  }).sort((a, b) => b.score - a.score);
}

/* ======================================================================
   ACTIONS. Each one updates every linked record, then logs and toasts.
   ====================================================================== */
const act = MP.act = {};
const commit = () => emit();
/* Sean's canonical day (the demo story). Other engineers get realistic timings from drive time. */
const STORY = {assign:"07:04", depart2491:"07:12", zoneOut:"07:18", arrive2491:"09:04", start2491:"09:10", scan2491:"10:18", complete2491:"11:24",
  depart2496:"12:07", arrive2496:"13:16", start2496:"13:17", complete2496:"13:59", departBase:"14:01", zoneIn:"15:42", arriveBase:"15:55", signoff:"16:04"};
const st = (k) => toMin(STORY[k]);
MP.STORY = STORY;

act.role = (r) => { S.role = r; commit(); };
act.confirmDraft = (jobId) => {
  const j = job(jobId); if (!j.draft) return; advance(st("assign") - 1);
  j.draft = false; jlog(j, "Draft confirmed as a job by " + staffName(), staffName());
  log(staffName(), "person", "Created Job #" + j.id + " from the AI draft", [{type:"job", id:j.id},{type:"request", id:j.requestId}]);
  const rq = request(j.requestId); if (rq) rq.status = "Job created";
  S.ai.filter(a => a.refs.some(r => r.type === "job" && r.id === j.id) && a.agent === "coordinator").forEach(a => a.status = "Accepted by " + staffName());
  toast("Job #" + j.id + " created", cust(j.cust).name + ", " + model(j.machine).name, "ok"); commit();
};
act.assign = (jobId, engId, opts) => {
  const j = job(jobId), E = eng(engId); if (j.draft) act.confirmDraft(jobId);
  advance(jobId === "2491" && engId === "sean" ? st("assign") : null);
  const prev = j.eng; j.eng = engId; if (["Unassigned"].indexOf(j.status) >= 0 || (opts && opts.status)) j.status = (opts && opts.status) || "Scheduled";
  if (opts && opts.start) j.start = opts.start;
  if (!j.start || j.status === "Scheduled" && jobId === "2491") j.start = jobId === "2491" ? "08:45" : hm(Math.ceil((S.clock + 60) / 15) * 15);
  jlog(j, (prev ? "Reassigned from " + eng(prev).name + " to " : "Assigned to ") + E.name + " by " + staffName(), staffName());
  log(staffName(), "person", "Assigned " + E.name + " to Job #" + j.id, [{type:"job", id:j.id},{type:"engineer", id:engId}]);
  S.ai.filter(a => a.agent === "dispatch" && a.refs.some(r => r.type === "job" && r.id === j.id) && /Awaiting/.test(a.status)).forEach(a => a.status = (a.refs.some(r => r.id === engId) ? "Accepted by " : "Overridden by ") + staffName());
  toast(E.name + " assigned to Job #" + j.id, "Sent to " + E.name.split(" ")[0] + "’s phone. " + loc(E.van).name + ".", "flow"); commit();
};
act.unassign = (jobId) => { const j = job(jobId); const p = j.eng; j.eng = null; j.status = "Unassigned"; jlog(j, "Unassigned from " + eng(p).name, staffName()); log(staffName(), "person", "Unassigned Job #" + j.id, [{type:"job", id:j.id}]); commit(); };
act.setStatus = (jobId, status) => {
  const j = job(jobId), prev = j.status; if (prev === status) return;
  if (status === "Ready for Invoice"){ act.markReady(jobId); return; }
  j.status = status; jlog(j, "Status changed from " + prev + " to " + status + " on the dispatch board", staffName());
  log(staffName(), "person", "Moved Job #" + j.id + " to " + status, [{type:"job", id:j.id}]); commit();
};
act.reschedule = (jobId, start) => { const j = job(jobId); j.start = start; jlog(j, "Rescheduled to " + start, staffName()); log(staffName(), "person", "Rescheduled Job #" + j.id + " to " + start, [{type:"job", id:j.id}]); commit(); };
act.linkRequest = (rqId, jobId) => { const r = request(rqId); r.status = "Linked"; r.job = jobId; const j = job(jobId); jlog(j, "Customer follow-up " + rqId + " linked (" + r.channel.toLowerCase() + ")", staffName());
  log(staffName(), "person", "Linked " + rqId + " to Job #" + jobId + " instead of creating a duplicate", [{type:"request", id:rqId},{type:"job", id:jobId}]);
  S.ai.filter(a => a.refs.some(x => x.id === rqId)).forEach(a => a.status = "Accepted by " + staffName());
  toast("Linked to Job #" + jobId, "No duplicate job created. Reply drafted with the part ETA.", "ok"); commit(); };
act.requestInfo = (rqId, text) => { const r = request(rqId); r.status = "Awaiting customer"; r.reply = text; log(staffName(), "person", "Asked " + r.from + " for more information", [{type:"request", id:rqId}]); toast("Reply sent from service@myers.ie", text.slice(0, 80), "ok"); commit(); };
act.createFromRequest = (rqId, o) => {
  const r = request(rqId); advance();
  const id = String(S.jobNext++); const a = r.ai; const m = o && o.machine || a.machine;
  S.jobs[id] = {id, cust:a.cust, site:a.site, machine:m, type:"Breakdown", billable:true, prio:a.urgency === "Urgent" ? "Urgent" : a.urgency === "High" ? "High" : "Normal", status:"Unassigned", eng:null, date:TODAY,
    start:null, dur:120, source:r.channel, parts:[], possibleParts:a.parts || [], notes:[], docs:[], timeline:[], photos:0, report:null, signoff:null, qb:null, warranty:null, draft:false,
    skill: m ? REF.MODELS[mach(m).model].skill : null, issue: a.fault || r.body.slice(0, 140), reported:r.body, requestId:rqId, aiClass:a.cls};
  jlog(S.jobs[id], "Created from " + rqId + " (" + r.channel.toLowerCase() + ")", staffName());
  r.status = "Job created"; r.job = id; log(staffName(), "person", "Created Job #" + id + " from " + rqId, [{type:"job", id},{type:"request", id:rqId}]);
  toast("Job #" + id + " created", cust(a.cust).name, "ok"); commit(); return id;
};
/* Manual or pasted request: AI triage from the text. */
act.newRequest = (o) => {
  advance(); const id = "RQ-" + (3110 + S.requests.filter(r => +r.id.slice(3) >= 3110).length);
  const txt = (o.body + " " + (o.from || "")).toLowerCase();
  const c = Object.values(S.customers).find(x => txt.indexOf(x.name.toLowerCase().split(" ")[0]) >= 0);
  let m = null; if (c){ const ms = Object.values(S.machines).filter(x => x.cust === c.id);
    m = ms.find(x => txt.indexOf(x.id.toLowerCase()) >= 0) || ms.find(x => { const M = REF.MODELS[x.model]; return txt.indexOf(M.type.toLowerCase().split(/[ /]/)[0]) >= 0 || txt.indexOf(M.mfr.toLowerCase()) >= 0; }) || null; }
  const urg = /stopped|down|urgent|asap|immediately|line stop/.test(txt) ? "Urgent" : /today|missing|reject|failing/.test(txt) ? "High" : "Normal";
  const M = m ? REF.MODELS[m.model] : null;
  const cls = M ? (M.type === "Metal detector" ? "Detection fault, validation needed" : M.type.indexOf("Label") >= 0 ? "Likely sensor/alignment issue" : M.type === "Vacuum packer" ? "Likely seal or pump issue" : "Mechanical fault, inspection needed") : "Needs more detail";
  const r = {id, channel:o.channel || "Manual", at:hm(S.clock), d:TODAY, from:o.from || "Manual entry", fromAddr:o.channel === "Email" ? "service@myers.ie" : "Manual entry", subject:o.subject || (o.body.slice(0, 48) + (o.body.length > 48 ? "…" : "")), body:o.body,
    status:"New", ai:{cust: c ? c.id : null, site: c ? (m ? m.site : c.sites[0]) : null, machine: m ? m.id : null, urgency:urg, cls, conf:{cust: c ? .94 : 0, site: c ? .9 : 0, machine: m ? .86 : 0, urgency:.75},
      parts: m ? Object.values(S.parts).filter(p => p.models.indexOf(m.model) >= 0).slice(0, 1).map(p => p.sku) : [], action: c ? (m ? "Create a job and assign an engineer" : "Confirm which machine") : "Ask who is calling and which site", fault:o.body.slice(0, 140)}};
  S.requests.unshift(r); log("Service Coordinator", "ai", "Triaged " + id + (c ? ": " + c.name + (m ? ", " + m.id : "") : ": customer not recognised"), [{type:"request", id}]);
  commit(); return id;
};

/* ----- field (engineer web app) ----- */
function curPlace(engId){ const n = engNow(engId); return n.place || "base"; }
act.fieldDepart = (engId, jobId) => {
  const j = jobId ? job(jobId) : null, E = eng(engId), from = curPlace(engId), to = j ? j.site : "base";
  const isStory = engId === "sean";
  let t, eta, via;
  if (isStory && jobId === "2491"){ t = st("depart2491"); eta = st("arrive2491"); via = [{t:st("zoneOut"), pos:G.along(G.BASE.pos, site("glenmore-naas").pos, S.rules.subsistence.radius + 0.05)}]; }
  else if (isStory && jobId === "2496"){ t = st("depart2496"); eta = st("arrive2496"); }
  else if (isStory && !jobId){ t = st("departBase"); eta = st("arriveBase"); via = [{t:st("zoneIn"), pos:G.along(G.BASE.pos, site("murphy-athlone").pos, S.rules.subsistence.radius + 0.05)}]; }
  advance(t);
  t = S.clock; if (!eta || eta <= t) eta = t + G.driveMin(placePos(from), placePos(to));
  const wasInside = G.km(G.BASE.pos, placePos(from)) < S.rules.subsistence.radius;
  day(engId, TODAY).ev.push({t, type:"depart", from, to, eta, job: jobId || null, via});
  if (j){ j.status = "Travelling"; jlog(j, E.name + " departed for " + cust(j.cust).name + ", ETA " + hm(eta), E.name, "engineer"); log(E.name, "engineer", "Departed for " + cust(j.cust).name + ", Job #" + j.id, [{type:"job", id:j.id}]); }
  else log(E.name, "engineer", "Heading back to base, ETA " + hm(eta), [{type:"engineer", id:engId}]);
  toast(j ? "On the way to " + cust(j.cust).name : "Heading back to base", "ETA " + hm(eta) + ". Customer notified by text.", "ok");
  commit();
  // Geofence: the zone crossing is detected automatically a moment later.
  if (wasInside){ later(1600, () => { const rec = subDay(engId, TODAY); advance(Math.max(S.clock, (isStory && jobId === "2491") ? st("zoneOut") : t + 6));
    const r2 = subDay(engId, TODAY); log("Pulse", "system", E.name + " exited the Myers qualifying zone. Subsistence timer started.", [{type:"engineer", id:engId}], hm(r2.exit != null ? r2.exit : S.clock));
    toast(E.name.split(" ")[0] + " left the Myers qualifying zone", "Subsistence timer started automatically at " + hm(r2.exit != null ? r2.exit : S.clock) + ".", "flow"); commit(); }); }
};
act.fieldArrive = (engId) => {
  const E = eng(engId), dd = day(engId, TODAY), dep = dd.ev.slice().reverse().find(e => e.type === "depart");
  if (!dep) return; advance(dep.eta);
  dd.ev.push({t:S.clock, type:"arrive", place:dep.to, job:dep.job || null});
  if (dep.job){ const j = job(dep.job); j.status = "On Site"; j.arrived = hm(S.clock); jlog(j, E.name + " arrived on site (geofence)", E.name, "engineer");
    log(E.name, "engineer", "Arrived at " + cust(j.cust).name, [{type:"job", id:j.id}]);
    toast("Arrived at " + cust(j.cust).name, "Arrival detected " + hm(S.clock) + " by the site geofence.", "ok"); }
  else {
    const rec = subDay(engId, TODAY);
    log(E.name, "engineer", "Back at base", [{type:"engineer", id:engId}]);
    if (rec.ret != null) log("Pulse", "system", E.name + " returned to the qualifying zone at " + hm(rec.ret) + ". " + dur(rec.away) + " away, " + (rec.band != null ? "band " + (rec.band + 1) + ", " + U.eur2(rec.allowance) : "below threshold") + ".", [{type:"engineer", id:engId}], hm(rec.ret));
    toast("Back inside the Myers zone at " + hm(rec.ret != null ? rec.ret : S.clock), dur(rec.away) + " away. " + (rec.band != null ? U.eur2(rec.allowance) + " subsistence calculated automatically." : "Below the subsistence threshold."), "flow");
  }
  commit();
};
act.fieldStart = (jobId) => {
  const j = job(jobId), E = eng(j.eng); advance(j.eng === "sean" && jobId === "2491" ? st("start2491") : j.eng === "sean" && jobId === "2496" ? st("start2496") : null);
  day(j.eng, TODAY).ev.push({t:S.clock, type:"jobStart", job:j.id}); j.status = "On Site"; j.started = hm(S.clock);
  jlog(j, E.name + " started the job", E.name, "engineer"); log(E.name, "engineer", "Started Job #" + j.id, [{type:"job", id:j.id}]);
  if (j.machine){ log("Machine Expert", "ai", "Machine history retrieved for " + j.machine + " and sent to " + E.name.split(" ")[0] + "’s phone", [{type:"machine", id:j.machine}], hm(S.clock + 1)); }
  commit();
};
act.addNote = (jobId, text) => { const j = job(jobId); advance(); j.notes.push({t:hm(S.clock), by:j.eng, text}); jlog(j, "Note: " + text, eng(j.eng).name, "engineer"); log(eng(j.eng).name, "engineer", "Added a note to Job #" + j.id, [{type:"job", id:j.id}]); commit(); };
act.addPhoto = (jobId, name) => {
  const j = job(jobId); advance(); j.photos += 1;
  const id = addDoc({kind:"Photo", name: (name || "Photo") + ", Job #" + j.id, by:eng(j.eng).name, links:{job:j.id, machine:j.machine, cust:j.cust}}, j);
  jlog(j, (name || "Photo") + " added", eng(j.eng).name, "engineer"); log(eng(j.eng).name, "engineer", "Added a photo to Job #" + j.id, [{type:"job", id:j.id},{type:"doc", id}]);
  commit(); return id;
};
/* The label scan result: what the camera read off the part bag. */
act.readLabel = (jobId) => {
  const j = job(jobId), E = eng(j.eng), van = S.stock[E.van];
  const sku = (j.possibleParts || []).find(s => (van[s] || 0) > 0) || (j.possibleParts || [])[0] || "MX-44721";
  const P = part(sku); return {sku, name:P.name + (P.name.indexOf("Label") < 0 && P.mfr === "LabelPro" ? "" : ""), desc:P.name, bin:P.bin, match: sku === "MX-44721" ? 98.7 : 96.2, van:E.van, inVan: van[sku] || 0};
};
act.confirmPart = (jobId, sku, qty, from) => {
  const j = job(jobId), E = eng(j.eng); from = from || E.van;
  advance(j.eng === "sean" && jobId === "2491" ? st("scan2491") : null);
  const t = hm(S.clock);
  const docId = addDoc({kind:"Label photo", name:"Parts label " + sku + ", Job #" + j.id, by:E.name, links:{job:j.id, part:sku, machine:j.machine, cust:j.cust}}, j, t);
  day(j.eng, TODAY).ev.push({t:S.clock, type:"part", job:j.id, sku, qty, from});
  const r = usePart(j, sku, qty, from, j.eng, t, false, docId);
  log("Pulse", "system", "Label photo stored on Job #" + j.id + " and part " + sku, [{type:"doc", id:docId}], t);
  commit(); return r;
};
act.reportIssue = (jobId, kind, text) => {
  const j = job(jobId), E = eng(j.eng); advance();
  if (kind === "part"){ j.status = "Awaiting Part"; j.awaiting = {sku:(j.possibleParts || [])[0] || null}; }
  else j.status = "Paused";
  jlog(j, "Issue reported: " + text, E.name, "engineer"); log(E.name, "engineer", "Reported an issue on Job #" + j.id + ": " + text, [{type:"job", id:j.id}]);
  toast("Office notified", text, "warn"); commit();
};
act.resume = (jobId) => { const j = job(jobId); j.status = "On Site"; jlog(j, "Work resumed", eng(j.eng).name, "engineer"); commit(); };
act.completeJob = (jobId, o) => {
  const j = job(jobId), E = eng(j.eng);
  advance(j.eng === "sean" && jobId === "2491" ? st("complete2491") : j.eng === "sean" && jobId === "2496" ? st("complete2496") : null);
  const t = hm(S.clock);
  j.report = {summary:o.summary, by:j.eng, d:TODAY}; if (o.signedBy) j.signoff = {name:o.signedBy, d:TODAY, t};
  if (o.noParts) j.noParts = true; j.ended = t;
  day(j.eng, TODAY).ev.push({t:S.clock, type:"jobEnd", job:j.id, billable:j.billable});
  addDoc({kind:"Service report", name:"Engineer report, Job #" + j.id, by:E.name, links:{job:j.id, machine:j.machine, cust:j.cust}}, j, t);
  if (o.signedBy) addDoc({kind:"Signature", name:"Customer sign-off (" + o.signedBy + "), Job #" + j.id, by:E.name, links:{job:j.id, cust:j.cust}}, j, t);
  finishJob(j, t);
  const r = j.status;
  toast(r === "Ready for Invoice" ? "Job #" + j.id + " ready for invoice" : r === "Closed" ? "Visit closed" : "Job #" + j.id + " sent for review",
    r === "Ready for Invoice" ? "Labour, travel, parts, report, photos and sign-off all checked." : r === "Closed" ? "Non-billable, nothing goes to QuickBooks." : j.reviewReason || "", r === "Review Required" ? "warn" : "flow");
  commit();
};
act.finishDay = (engId) => { const E = eng(engId); advance(engId === "sean" ? st("signoff") : null); day(engId, TODAY).ev.push({t:S.clock, type:"signoff", place:"base"}); log(E.name, "engineer", "Signed off", [{type:"engineer", id:engId}]); commit(); };

/* ----- office: review and QuickBooks ----- */
act.markReady = (jobId) => {
  const j = job(jobId); advance();
  const fails = jobChecks(j).filter(c => !c.ok && c.k !== "signoff");
  if (fails.length){ toast("Still missing: " + fails.map(c => c.label.toLowerCase()).join(", "), "Fix these before the job can go to QuickBooks.", "warn"); return false; }
  if (!j.signoff) j.signoff = {name:"Confirmed by phone (" + staffName() + ")", d:TODAY, t:hm(S.clock)};
  if (j.warranty && claim(j.warranty) && claim(j.warranty).stage === "Active"){ const c = claim(j.warranty); c.stage = "Awaiting manufacturer"; c.status = "Submitted"; c.submitted = TODAY; c.due = U.addDays(TODAY, 14);
    j.status = "Closed"; jlog(j, "Warranty claim " + c.id + " approved by " + staffName() + " and submitted to " + c.mfr + ". No invoice.", staffName());
    log(staffName(), "person", "Submitted warranty claim " + c.id + " to " + c.mfr, [{type:"warranty", id:c.id},{type:"job", id:j.id}]); toast("Claim " + c.id + " submitted to " + c.mfr, "The job closes with no invoice. Credit tracked under Warranties.", "flow"); commit(); return true; }
  j.status = "Ready for Invoice"; j.reviewReason = null; jlog(j, "Reviewed by " + staffName() + ". Ready for invoice.", staffName());
  log(staffName(), "person", "Marked Job #" + j.id + " ready for invoice", [{type:"job", id:j.id}]);
  toast("Job #" + j.id + " ready for invoice", "", "ok"); commit(); return true;
};
act.sendToQB = (ids) => {
  ids = [].concat(ids); advance(ids.indexOf("2491") >= 0 ? toMin("11:31") : null);
  const sent = [];
  ids.forEach(id => { const j = job(id); if (j.status !== "Ready for Invoice") return;
    const ref = "QB-" + (S.qbNext++), v = jobValue(j);
    j.qb = {ref, status:"Sent", value:v.total, sentD:TODAY, sentT:hm(S.clock), invoiceD:null, paidD:null, invoiceNo:null, payload:{customer:cust(j.cust).qb, lines:v.lines.map(l => l.label)}};
    j.status = "Sent to QuickBooks"; jlog(j, "Sent to QuickBooks as " + ref + " by " + staffName() + ": customer, labour, travel, parts and report", staffName());
    log(staffName(), "person", "Sent Job #" + j.id + " to QuickBooks as " + ref, [{type:"job", id:j.id},{type:"qb", id:j.id}]); sent.push(ref); });
  S.integrations.qb.lastSync = hm(S.clock);
  toast(sent.length === 1 ? "Sent to QuickBooks · " + sent[0] : sent.length + " jobs sent to QuickBooks", "QuickBooks creates the invoice. Pulse reads the status back.", "flow");
  commit();
  // QuickBooks picks it up and creates the invoice shortly afterwards.
  later(5000, () => { let n = 0; ids.forEach(id => { const j = job(id); if (j.qb && j.qb.status === "Sent"){ j.qb.status = "Invoiced"; j.qb.invoiceD = TODAY; j.qb.invoiceNo = "INV-" + (6200 + S.qbNext - 10428 + n++);
    jlog(j, "QuickBooks: invoice " + j.qb.invoiceNo + " created, " + eur(j.qb.value), "QuickBooks", "qb"); log("QuickBooks", "qb", "Invoice " + j.qb.invoiceNo + " created for Job #" + j.id + " (" + j.qb.ref + ")", [{type:"job", id:j.id}]); } });
    if (n){ toast("QuickBooks: invoiced", n === 1 ? "Status read back from QuickBooks." : n + " invoices created in QuickBooks.", "info"); commit(); } });
};
/* Pull statuses back from QuickBooks: invoiced jobs from today become paid (demo). */
act.qbSync = () => {
  advance(); let n = 0;
  Object.values(S.jobs).filter(j => j.qb && j.qb.sentD === TODAY).forEach(j => {
    if (j.qb.status === "Sent"){ j.qb.status = "Invoiced"; j.qb.invoiceD = TODAY; j.qb.invoiceNo = "INV-" + (6200 + n); jlog(j, "QuickBooks: invoiced", "QuickBooks", "qb"); n++; }
    else if (j.qb.status === "Invoiced"){ j.qb.status = "Paid"; j.qb.paidD = TODAY; j.status = "Closed"; jlog(j, "QuickBooks: paid " + eur(j.qb.value) + ". Job closed.", "QuickBooks", "qb"); log("QuickBooks", "qb", "Payment recorded for Job #" + j.id + " (" + j.qb.ref + ")", [{type:"job", id:j.id}]); n++; }
  });
  S.integrations.qb.lastSync = hm(S.clock);
  toast("QuickBooks sync complete", n ? n + " status update" + (n > 1 ? "s" : "") + " read back." : "No changes.", "info"); commit();
};

/* ----- parts ----- */
act.createReorder = (sku, qty) => {
  const P = part(sku); advance(); const id = "RO-0" + (S.reorderNext++); qty = qty || P.reorderQty;
  S.reorders.unshift({id, sku, qty, supplier:P.supplier, status:"Requested", raised:TODAY, by:staffName(), eta:U.addDays(TODAY, 3), note:"Suggested by the Parts Assistant"});
  S.ai.filter(a => a.agent === "parts" && a.refs.some(r => r.id === sku) && /Awaiting/.test(a.status)).forEach(a => a.status = "Accepted by " + staffName());
  log(staffName(), "person", "Created reorder request " + id + ": " + qty + " × " + sku + " from " + P.supplier, [{type:"part", id:sku}]);
  toast("Reorder request " + id + " created", qty + " × " + sku + ". Email to " + P.supplier + " drafted for purchasing; the order itself is placed in QuickBooks.", "ok"); commit(); return id;
};
act.transfer = (sku, from, to, qty) => {
  advance(); S.stock[from][sku] = (S.stock[from][sku] || 0) - qty; S.stock[to] = S.stock[to] || {}; S.stock[to][sku] = (S.stock[to][sku] || 0) + qty;
  S.moves.unshift({d:TODAY, t:hm(S.clock), type:"Transferred", sku, qty, from, to, by:staffName()});
  log(staffName(), "person", "Transferred " + qty + " × " + sku + " from " + loc(from).name + " to " + loc(to).name, [{type:"part", id:sku}]);
  toast("Transfer booked", qty + " × " + sku + " → " + loc(to).name, "ok"); commit();
};
act.receiveReorder = (id) => { const r = S.reorders.find(x => x.id === id); advance(); r.status = "Received"; S.stock.main[r.sku] = (S.stock.main[r.sku] || 0) + r.qty;
  S.moves.unshift({d:TODAY, t:hm(S.clock), type:"Received", sku:r.sku, qty:r.qty, to:"main", supplier:r.supplier, by:staffName()});
  log(staffName(), "person", "Received " + r.qty + " × " + r.sku + " into Main Stores (" + id + ")", [{type:"part", id:r.sku}]); toast("Received into Main Stores", r.qty + " × " + r.sku, "ok"); commit(); };

/* ----- warranty ----- */
act.chaseClaim = (id) => { const c = claim(id); advance(); c.chased = TODAY; c.overdue = false; log(staffName(), "person", "Chased " + c.mfr + " about " + id, [{type:"warranty", id}]);
  toast("Chaser sent to " + c.mfr, "Reference " + c.ref + ", with the claim pack attached.", "ok"); commit(); };
act.advanceClaim = (id) => { const c = claim(id); advance(); const order = ["Active","Awaiting manufacturer","Credit due","Closed"]; const i = order.indexOf(c.stage);
  if (i < 0 || i >= 3) return; c.stage = order[i + 1]; c.status = ({"Awaiting manufacturer":"Submitted","Credit due":"Awaiting credit","Closed":"Credited"})[c.stage];
  if (c.stage === "Awaiting manufacturer"){ c.submitted = TODAY; c.due = U.addDays(TODAY, 14); } if (c.stage === "Credit due") c.approved = TODAY; if (c.stage === "Closed") c.credited = TODAY;
  log(staffName(), "person", "Warranty " + id + " moved to " + c.stage, [{type:"warranty", id}]); toast(id + ": " + c.status, "", "ok"); commit(); };

/* ----- subsistence ----- */
act.markReviewed = (keys) => { advance(); [].concat(keys).forEach(k => { const r = subDay(k.split("|")[0], k.split("|")[1]);
  S.subReview[k] = {status: r.flags.some(f => f.type === "manual") ? "Confirmed" : "Reviewed", by:staffName(), t:TODAY + " " + hm(S.clock)}; });
  log(staffName(), "person", "Reviewed " + [].concat(keys).length + " subsistence record" + ([].concat(keys).length > 1 ? "s" : ""), []); toast("Marked reviewed", "", "ok"); commit(); };
act.setRules = (patch) => { S.rules.subsistence = Object.assign({}, S.rules.subsistence, patch); log(staffName(), "person", "Changed subsistence rules: radius " + S.rules.subsistence.radius + " km, bands " + S.rules.subsistence.bands.map(b => b.min + "h €" + b.amount).join(", "), []); commit(); };
act.setTracking = (patch) => { S.rules.tracking = Object.assign({}, S.rules.tracking, patch); commit(); };

/* ----- attention and data ----- */
act.resolve = (id, note) => { S.resolved[id] = {by:staffName(), t:hm(S.clock), note: note || ""}; log(staffName(), "person", "Resolved: " + id.replace(/:.*/, "") + " item" + (note ? " (" + note + ")" : ""), []); commit(); };
act.fixMachine = (jobId, mid) => { const j = job(jobId); j.machine = mid; j.dataIssue = null; jlog(j, "Machine set to " + mid + " by " + staffName(), staffName()); log(staffName(), "person", "Added machine serial " + mid + " to Job #" + j.id, [{type:"job", id:j.id},{type:"machine", id:mid}]); toast("Job #" + j.id + " updated", "Machine " + mid + " linked. History and warranty now attached.", "ok"); commit(); };

/* ----- demo ----- */
act.demoNext = () => { S.demoStep += 1; commit(); };

/* ======================================================================
   AI: answers from the live records. Write tools only propose.
   Returns {agent, text, table:{cols,rows}, links:[[label,path]], confirm:{tool, args, summary, run:[fn,...args], yes}}
   ====================================================================== */
const AGENTS = {
  coordinator:{name:"Service Coordinator", short:"Coordinator"}, dispatch:{name:"Dispatch Assistant", short:"Dispatch"}, parts:{name:"Parts Assistant", short:"Parts"},
  machine:{name:"Machine Expert", short:"Machine"}, watchdog:{name:"Operations Watchdog", short:"Watchdog"}
};
MP.AGENTS = AGENTS;
MP.SUGGEST = ["Where is Sean?","What jobs are still open today?","Which engineers have qualified for subsistence this week?","Which parts are below minimum stock?",
  "Show me every issue we've had with Glenmore's LP200.","What jobs are completed but haven't reached QuickBooks?","Which warranty credits are still outstanding?",
  "Who is closest to the FreshPak breakdown and qualified to work on the machine?"];
MP.ask = function(q){
  const s = q.toLowerCase();
  const has = (...w) => w.some(x => s.indexOf(x) >= 0);
  const engHit = Object.values(S.engineers).find(e => s.indexOf(e.name.split(" ")[0].toLowerCase()) >= 0);
  if (has("closest","nearest") || (has("freshpak") && has("qualified","who"))){
    const j = job("2492"), rec = recommend("2492").slice(0, 4);
    return {agent:"dispatch", tool:"dispatch.rank_engineers", text:"FreshPak’s MetalCheck X4 needs a MetalCheck-certified engineer. David Ryan is " + (j.status === "Travelling" ? "already on the way, ETA " + hm(engNow("david").eta) : "assigned (" + j.status.toLowerCase() + ")") + ". If you need a second pair of hands, here is the ranking from where everyone is right now.",
      table:{cols:["Engineer","Qualified","Distance","Right now"], rows:rec.map(r => [r.name, eng(r.eng).certs.indexOf("MetalCheck") >= 0 ? "MetalCheck certified" : "No", r.km + " km", engNow(r.eng).status + (engNow(r.eng).job ? ", #" + engNow(r.eng).job.id : "")])},
      links:[["Open Job #2492","jobs/2492"],["Open dispatch","dispatch"]]};
  }
  if (has("where is","where's","location") && engHit){
    const n = engNow(engHit.id), sub = n.sub;
    return {agent:"dispatch", tool:"engineers.location", text: engHit.name + " is " + (n.status === "Travelling" ? "travelling to " + placeName(n.place) + ", ETA " + hm(n.eta) : n.status === "On site" ? "on site at " + n.where + (n.job ? ", working on Job #" + n.job.id : "") : n.status.toLowerCase()) + ". " +
      (sub && sub.exit != null ? "Outside the Myers zone since " + hm(sub.exit) + " (" + dur(sub.away) + ")" + (sub.band != null ? ", qualifying for subsistence." : ".") : "Inside the Myers zone today.") + " " + n.done.length + " of " + n.jobs.length + " jobs complete.",
      table:{cols:["Job","Customer","Time","Status"], rows:n.jobs.map(j => ["#" + j.id, cust(j.cust).name, j.start || "", j.status])}, links:[["Open " + engHit.name.split(" ")[0] + "’s profile","engineers/" + engHit.id]]};
  }
  if (has("subsistence","allowance","qualif")){
    const from = U.addDays(TODAY, -7); const rows = {};
    Object.values(S.days).filter(d => d.d > from && d.d <= TODAY).forEach(d => { const r = subDay(d.eng, d.d); if (r.band == null) return; rows[d.eng] = rows[d.eng] || {days:0, amt:0, review:0}; rows[d.eng].days++; rows[d.eng].amt += r.allowance; if (r.status === "Review required") rows[d.eng].review++; });
    const list = Object.keys(rows).map(k => [eng(k).name, String(rows[k].days), U.eur2(rows[k].amt), rows[k].review ? rows[k].review + " to review" : "Auto-calculated"]).sort((a, b) => +b[1] - +a[1]);
    return {agent:"watchdog", tool:"subsistence.summary", text:list.length + " engineers have qualifying days since " + U.wdm(U.addDays(from, 1)) + ", worth " + U.eur2(Object.values(rows).reduce((n, r) => n + r.amt, 0)) + " at the current rules (" + S.rules.subsistence.radius + " km, " + S.rules.subsistence.bands.map(b => b.min + "h+ " + U.eur2(b.amount)).join(", ") + "). Today’s figures are still running.",
      table:{cols:["Engineer","Qualifying days","Allowance","Status"], rows:list}, links:[["Open monthly report","subsistence/report"],["Exceptions","subsistence/exceptions"]]};
  }
  if (has("below","low stock","minimum stock","reorder","stock")){
    const low = lowStock();
    return {agent:"parts", tool:"parts.low_stock", text: low.length + " stock lines are below their minimum. " + (low.filter(l => l.kind === "reorder" && !l.open).length ? low.filter(l => l.kind === "reorder" && !l.open).map(l => l.sku).join(", ") + " need a reorder." : "Every line below its reorder level already has an order raised."),
      table:{cols:["Part","Where","Have","Min","Order"], rows:low.map(l => [l.sku + " " + part(l.sku).name, l.loc === "all" ? "All locations" : loc(l.loc).name, String(l.qty), String(l.min), l.open ? l.open.id + " due " + U.dm(l.open.eta) : "None"])},
      links:[["Open parts","parts"]], confirm: low.find(l => l.kind === "reorder" && !l.open) ? (() => { const l = low.find(x => x.kind === "reorder" && !x.open); const P = part(l.sku);
        return {tool:"parts.create_reorder_request", args:{sku:l.sku, qty:P.reorderQty, supplier:P.supplier}, summary:"Create reorder request: " + P.reorderQty + " × " + l.sku + " from " + P.supplier + ".", run:["createReorder", l.sku], yes:"Create request"}; })() : null};
  }
  if (has("lp200","glenmore") && has("issue","history","problem","fault","every")){
    const js = MP.q.machineJobs("LP200-48023");
    return {agent:"machine", tool:"machines.history", text:"LabelPro LP200 LP200-48023 at Glenmore’s Naas facility, installed 12 March 2022, warranty expired. " + js.length + " jobs on record. The optical sensor MX-44721 has now been the cause twice for the same missed-label symptom" + (js.some(j => j.id === "2491" && j.parts.some(p => p.sku === "MX-44721")) ? " (February and today)" : " (February, and likely today)") + ". Worth checking the bracket for vibration on the next service.",
      table:{cols:["Date","Job","Issue","Parts"], rows:js.map(j => [U.dm(j.date) + " " + j.date.slice(0, 4), "#" + j.id, j.issue.slice(0, 60), j.parts.map(p => p.sku).join(", ") || "None"])}, links:[["Open machine record","machines/LP200-48023"]]};
  }
  if (has("quickbooks","invoice","haven't reached","not reached","completed but")){
    const rows = Object.values(S.jobs).filter(j => ["Engineer Complete","Review Required","Ready for Invoice"].indexOf(j.status) >= 0);
    const ready = rows.filter(j => j.status === "Ready for Invoice");
    return {agent:"watchdog", tool:"jobs.not_in_quickbooks", text:rows.length + " completed jobs have not reached QuickBooks. " + ready.length + " are ready to send (" + eur(ready.reduce((n, j) => n + jobValue(j).total, 0)) + " estimated). " + (rows.length - ready.length ? (rows.length - ready.length) + " need review first." : ""),
      table:{cols:["Job","Customer","Completed","Status","Est. value"], rows:rows.map(j => ["#" + j.id, cust(j.cust).name, U.rel(j.date), j.status, jobValue(j).billable ? eur(jobValue(j).total) : "Warranty"])},
      links:[["Open ready for invoice","jobs?view=ready"]],
      confirm: ready.length ? {tool:"quickbooks.send_jobs", args:{jobs:ready.map(j => j.id)}, summary:"Send " + ready.length + " job" + (ready.length > 1 ? "s" : "") + " (" + ready.map(j => "#" + j.id).join(", ") + ") to QuickBooks. QuickBooks creates the invoices.", run:["sendToQB", ready.map(j => j.id)], yes:"Send to QuickBooks"} : null};
  }
  if (has("warranty","credit")){
    const cs = Object.values(S.claims).filter(c => c.stage === "Credit due" || c.stage === "Awaiting manufacturer");
    return {agent:"parts", tool:"warranty.outstanding", text:cs.length + " warranty claims are still open, worth " + eur(cs.reduce((n, c) => n + c.value, 0)) + ". " + cs.filter(c => c.stage === "Credit due").length + " are approved with the credit still to come; " + cs.filter(c => c.overdue).map(c => c.id).join(", ") + (cs.some(c => c.overdue) ? " is past the manufacturer’s response date." : ""),
      table:{cols:["Claim","Customer","Manufacturer","Stage","Value"], rows:cs.map(c => [c.id, cust(c.cust).name, c.mfr, c.stage + (c.overdue ? " (overdue)" : ""), eur(c.value)])}, links:[["Open warranties","warranties"]]};
  }
  if (has("open","today","jobs")){
    const js = MP.q.jobsToday().filter(j => OPEN.indexOf(j.status) >= 0);
    return {agent:"coordinator", tool:"jobs.today", text:js.length + " of today’s " + MP.q.jobsToday().length + " jobs are still open. " + js.filter(j => j.prio === "Urgent").length + " urgent, " + js.filter(j => !j.eng).length + " without an engineer.",
      table:{cols:["Job","Customer","Engineer","Status","Priority"], rows:js.map(j => ["#" + j.id, cust(j.cust).name, j.eng ? eng(j.eng).name : "Unassigned", j.status, j.prio])}, links:[["Open dispatch","dispatch"]]};
  }
  if (has("assign") && has("sean") || has("glenmore") && has("assign")){
    const j = job("2491");
    return {agent:"dispatch", tool:"jobs.assign", text:"Sean Murphy is the best fit for Job #2491: LabelPro certified, Van 04 carries MX-44721, free until 13:15.", confirm: j.eng ? null : {tool:"jobs.assign", args:{job:"2491", engineer:"sean"}, summary:"Assign Sean Murphy to Job #2491, Glenmore Foods, and send it to his phone.", run:["assign","2491","sean"], yes:"Assign Sean"}};
  }
  if (has("brief","morning","attention","summary")){
    const b = briefing();
    return {agent:"watchdog", tool:"briefing.today", text:"Today: " + b.today.map(x => x[0] + " " + x[1]).join(", ") + ". " + b.watch.map(w => w.text).join(" "), links:[["Needs attention","attention"]]};
  }
  return {agent:"coordinator", tool:null, text:"I can answer from the jobs, engineers, parts, machines, warranty, subsistence and QuickBooks records in Pulse. Try one of these.", suggest:true};
};
/* Helpers for page files that define extra actions: mutate MP.get(), then MP.commit(). */
MP.commit = () => emit();
MP.tick = (t) => advance(t);        // move the clock (no re-render until commit)
MP.log = log; MP.jlog = jlog; MP.addDoc = addDoc; MP.later = later; MP.aiLog = ai;
MP.runProposal = (run) => { const fn = act[run[0]]; if (fn) fn.apply(null, run.slice(1)); };
})();
