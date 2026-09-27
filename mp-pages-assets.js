/* Myers Pulse: assets and records.
   Parts, Machines, Warranties, Customers, Documents, Knowledge.
   Everything is derived from MP.get() / MP.q; every change goes through MP.act.* */
(function(){
"use strict";
const MP = window.MP, h = MP.h, F = MP.F, U = MP.util, Q = MP.q, A = MP.act, UI = MP.ui, R = window.React;
const {Card, Kpi, Badge, Status, Prio, Btn, Av, Ref, Chip, Icon, Table, KV, Tabs, Empty, Bar, QR, Timeline} = UI;
const useState = (v) => R.useState(v);
const MODELS = MP.ref.MODELS;

/* ---------- actions this file needs ---------- */
/* Submitting a claim from the Warranties board. If the claim was drafted from a warranty job that is held
   for review, submitting it is the same decision as approving the job, so it goes through markReady
   (which submits the claim and closes the job with no invoice). Otherwise the claim just moves on. */
A.submitClaim = (id) => {
  const c = Q.claim(id); if (!c || c.stage !== "Active") return;
  const j = c.job ? Q.job(c.job) : null;
  if (j && j.warranty === id && j.status === "Review Required") return A.markReady(j.id);
  A.advanceClaim(id);
};

/* ---------- styles (prefix as-) ---------- */
const CSS = `
.as-kpis{grid-template-columns:repeat(auto-fit,minmax(170px,1fr))}
.as-hdr{padding:16px 20px}
.as-hdr-in{display:flex;gap:20px;align-items:flex-start;flex-wrap:wrap}
.as-back{font-size:12px;color:var(--dim)}
.as-title{font-size:21px;font-weight:600;letter-spacing:-.015em;color:var(--ink);margin-top:4px;overflow-wrap:anywhere}
.as-split{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(300px,1fr);gap:14px;align-items:start}
.as-stack{display:grid;gap:14px;min-width:0}
.as-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));margin:14px -20px -16px;border-top:1px solid var(--border)}
.as-st{padding:11px 20px;border-left:1px solid var(--border);min-width:0}
.as-st:first-child{border-left:0}
.as-st .l{font-size:11px;color:var(--dim);font-family:var(--mono);letter-spacing:.06em;text-transform:uppercase}
.as-st .v{font-size:19px;font-weight:600;color:var(--ink);font-variant-numeric:tabular-nums;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.as-search{width:230px;height:30px}
.as-cards{display:grid;gap:14px;grid-template-columns:repeat(auto-fill,minmax(320px,1fr))}
.as-ro{padding:14px 16px;border-color:var(--bad-soft)}
.as-ro-g{display:grid;grid-template-columns:repeat(4,auto);justify-content:start;gap:4px 24px;margin-top:12px}
.as-ro-g .l{font-size:11px;color:var(--dim)}
.as-ro-g .v{font-size:15px;font-weight:600;color:var(--ink);font-variant-numeric:tabular-nums}
.as-email{border:1px solid var(--border);border-radius:12px;padding:12px 14px;background:var(--surface-faint)}
.as-email-body{white-space:pre-wrap;margin-top:10px;padding-top:10px;border-top:1px solid var(--border);color:var(--body);font-size:12.5px;line-height:1.6}
.as-board{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;align-items:start}
.as-col{border:1px solid var(--border);border-radius:16px;background:var(--surface-faint);padding:10px;min-width:0}
.as-col-h{padding:4px 6px 4px}
.as-wc{display:block;width:100%;text-align:left;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:11px 12px;margin-top:8px;cursor:pointer;color:inherit;font:inherit;transition:border-color .15s var(--ease),transform .15s var(--ease)}
.as-wc:hover{border-color:var(--accent-line);transform:translateY(-1px)}
.as-wc:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.as-steps{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:14px}
.as-step i{display:block;height:4px;border-radius:4px;background:var(--track)}
.as-step.on i{background:var(--accent)}
.as-step span{display:block;font-size:11px;color:var(--faint);margin-top:5px}
.as-step.on span{color:var(--body)}
.as-ins{border:1px solid var(--accent-line);background:var(--accent-faint);border-radius:12px;padding:12px 14px}
.as-qr{display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;width:170px}
.as-prev{border-radius:12px;overflow:hidden;background:var(--surface-2);border:1px solid var(--border);min-height:340px;display:flex;align-items:center;justify-content:center;position:relative;margin:0 18px 18px}
.as-photo{background:radial-gradient(circle at 28% 24%,var(--surface-3),transparent 58%),radial-gradient(circle at 80% 90%,var(--accent-faint),transparent 50%),linear-gradient(160deg,var(--surface-2),var(--track))}
.as-cap{position:absolute;left:14px;right:14px;bottom:12px;font-size:12px;color:var(--body)}
.as-frame{position:absolute;inset:26px;border-radius:10px;pointer-events:none;box-shadow:inset 0 0 0 1px var(--border-strong)}
.as-label{background:var(--pill-bg);color:var(--pill-ink);border-radius:6px;padding:14px 16px 12px;width:270px;transform:rotate(-2deg);box-shadow:0 14px 30px rgba(0,0,0,.25)}
.as-label .sku{font-family:var(--mono);font-size:24px;font-weight:600;letter-spacing:.02em;margin-top:4px}
.as-label .sm{font-family:var(--mono);font-size:9px;letter-spacing:.12em;opacity:.7}
.as-paper{background:var(--surface-3);border:1px solid var(--border);border-radius:8px;width:min(460px,92%);padding:20px 22px;margin:22px 0;color:var(--body);font-size:12.5px;line-height:1.55}
.as-paper h4{margin:0 0 2px;font-size:14px;color:var(--ink)}
.as-paper .ln{height:6px;border-radius:3px;background:var(--track);margin-top:9px}
.as-graph{display:block;width:100%;height:auto}
.as-graph .as-node{cursor:pointer;transition:transform .28s var(--ease);animation:asFade .26s var(--ease) both}
.as-graph .as-node:focus{outline:none}
.as-node rect{fill:var(--surface-2);stroke:var(--border-strong);stroke-width:1;transition:stroke .15s var(--ease)}
.as-node:hover rect,.as-node:focus-visible rect{stroke:var(--accent)}
.as-node.root rect{fill:var(--accent-soft);stroke:var(--accent);stroke-width:1.4}
.as-nt{font-family:var(--mono);font-size:8.5px;letter-spacing:.09em}
.as-nn{font-size:11.5px;font-weight:600;fill:var(--ink);font-family:var(--sans)}
.as-ns{font-size:9.5px;fill:var(--dim);font-family:var(--sans)}
.as-open{font-size:9.5px;fill:var(--accent);font-family:var(--sans);font-weight:600}
.as-rel{font-family:var(--mono);font-size:9px;fill:var(--faint);paint-order:stroke;stroke:var(--bg);stroke-width:3px;stroke-linejoin:round}
.as-edge{animation:asFade .32s var(--ease) both}
.as-thread{display:flex;align-items:center;gap:6px;overflow-x:auto;padding:12px 14px}
.as-tn{flex:none;height:30px;padding:0 12px;border-radius:999px;border:1px solid var(--border-strong);background:var(--surface-faint);color:var(--body);font:inherit;font-size:11px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;cursor:pointer;white-space:nowrap;transition:border-color .15s var(--ease),color .15s var(--ease)}
.as-tn:hover{border-color:var(--accent-line);color:var(--ink)}
.as-tn.on{border-color:var(--accent);color:var(--accent);background:var(--accent-faint)}
.as-tn:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.as-tl{flex:none;display:flex;flex-direction:column;align-items:center;font-family:var(--mono);font-size:9px;color:var(--faint);min-width:54px}
.as-tl i{display:block;width:100%;height:0;border-top:1px solid var(--border-strong);margin-top:3px}
.as-tl.pend{color:var(--warn)}
.as-tl.pend i{border-top-style:dashed;border-color:var(--warn)}
.as-kg{display:grid;gap:14px;grid-template-columns:minmax(0,1fr) 330px;align-items:start}
.as-rel-row{display:flex;align-items:center;gap:8px;padding:8px 0;border-top:1px solid var(--border)}
.as-rel-row:first-child{border-top:0}
.as-kinds{display:flex;flex-wrap:wrap;gap:6px}
@keyframes asFade{from{opacity:0}to{opacity:1}}
@media (max-width:1100px){.as-split,.as-kg{grid-template-columns:1fr}.as-board{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:720px){.as-board{grid-template-columns:1fr}.as-stats{grid-template-columns:1fr 1fr}.as-st:nth-child(3){border-left:0}.as-search{width:100%}.as-ro-g{grid-template-columns:1fr 1fr}}
`;
if (typeof document !== "undefined" && document.getElementById && !document.getElementById("as-css")){
  const st = document.createElement("style"); st.id = "as-css"; st.textContent = CSS; if (document.head) document.head.appendChild(st);
}

/* ---------- helpers ---------- */
const ymd = (d) => d ? (d.slice(0, 4) === "2026" ? U.dm(d) : U.dmy(d)) : "";
const trunc = (s, n) => { s = String(s || ""); return s.length > n ? s.slice(0, n - 1) + "…" : s; };
const locName = (id) => Q.loc(id) ? Q.loc(id).name : id;
const vanIds = (S) => Object.keys(S.locations).filter(k => S.locations[k].kind === "van").sort();
const byNewest = (a, b) => ((b.d || "") + (b.t || "")).localeCompare((a.d || "") + (a.t || ""));
const stat = (l, v, c) => h("div", {className:"as-st"}, h("div", {className:"l"}, l), h("div", {className:"v", style:c ? {color:c} : null}, v));
const num = (n) => Number(n).toLocaleString("en-IE");
const times = (n) => n === 2 ? "twice" : n + " times";
function Search(p){ return h("input", {className:"in as-search", type:"search", value:p.value, onChange:(e) => p.onChange(e.target.value), placeholder:p.placeholder, "aria-label":p.label || p.placeholder}); }
function NotFound(p){ return h(Card, {pad:true}, h(Empty, {title:p.what + " " + p.id + " was not found", icon:"search"}, h("div", {style:{marginTop:10}}, h(Btn, {sm:true, icon:"back", onClick:() => MP.go(p.back[1])}, p.back[0])))); }
function RecHead(p){
  return h(Card, {className:"as-hdr"},
    h("div", {className:"as-hdr-in"},
      h("div", {style:{minWidth:0, flex:1}},
        h("button", {type:"button", className:"ref as-back", onClick:() => MP.go(p.back[1])}, h(Icon, {n:"back", s:13}), p.back[0]),
        p.kicker ? h("div", {className:"mono faint", style:{marginTop:10}}, p.kicker) : null,
        h("div", {className:"as-title"}, p.title),
        p.sub ? h("div", {className:"dim", style:{marginTop:3}}, p.sub) : null,
        p.badges ? h("div", {className:"row wrap", style:{gap:6, marginTop:10}}, p.badges) : null),
      p.right || null),
    p.children || null);
}
/* Show the first `n` rows with a "Show all" toggle. */
function useMore(rows, n){ const [all, setAll] = useState(false); const shown = all ? rows : rows.slice(0, n);
  const more = rows.length > n ? h("div", {style:{padding:"8px 18px 14px"}}, h(Btn, {sm:true, k:"ghost", onClick:() => setAll(!all)}, all ? "Show fewer" : "Show all " + rows.length)) : null;
  return [shown, more]; }
/* Documents attached to a record. */
function DocList(p){
  const [rows, more] = useMore(p.docs, p.n || 8);
  return h(F, null, h(Table, {rows, onRow:(d) => MP.go("documents/" + d.id), empty:p.empty || "No documents yet", emptyIcon:"documents", cols:[
    {t:"Document", r:(d) => h("div", {style:{color:"var(--ink)", minWidth:0}}, d.name)},
    {t:"Kind", r:(d) => h(Badge, {k:KIND_TONE[d.kind] || ""}, d.kind)},
    {t:"Date", r:(d) => h("span", {className:"mono dim"}, ymd(d.d) + (d.t ? " " + d.t : ""))}]}), more);
}
const KIND_TONE = {"Photo":"", "Label photo":"acc", "Service report":"ok", "Signature":"", "Manual":"line", "Certificate":"line", "Warranty":"warn", "Credit note":"ok", "Quote":"line"};

/* Usage of every part, from the jobs' parts arrays (the job record is the source; moves mirror it). */
function usageIndex(S){
  const u = {};
  Object.values(S.jobs).forEach(j => j.parts.forEach(p => { (u[p.sku] = u[p.sku] || []).push({d:j.date, t:p.t || j.start || "", job:j.id, qty:p.qty, from:p.from, eng:p.by || j.eng, cust:j.cust, machine:j.machine}); }));
  Object.keys(u).forEach(k => u[k].sort(byNewest));
  return u;
}
/* Stock state for one part: totals, van shortfalls and the badge to show. */
function pState(S, sku){
  const P = Q.part(sku), tot = Q.stockTotal(sku), main = (S.stock.main || {})[sku] || 0, open = Q.openReorder(sku);
  const vanLow = vanIds(S).filter(v => (S.vanMin[v] || {})[sku] != null && ((S.stock[v] || {})[sku] || 0) < S.vanMin[v][sku]);
  const below = tot < P.reorder;
  let label, tone, rank;
  if (below && !open){ label = "Below reorder"; tone = "bad"; rank = 0; }
  else if (open){ label = "On order " + open.id + " · ETA " + U.dm(open.eta); tone = below ? "warn" : "acc"; rank = 1; }
  else if (vanLow.length){ label = "Low"; tone = "warn"; rank = 2; }
  else { label = "OK"; tone = "ok"; rank = 3; }
  return {P, tot, main, vans:tot - main, open, vanLow, below, label, tone, rank};
}
function locStats(S, id){
  const st = S.stock[id] || {}, mins = S.vanMin[id] || {};
  const skus = Object.keys(st).filter(k => st[k] > 0);
  return {lines:skus.length, units:skus.reduce((n, k) => n + st[k], 0), val:skus.reduce((n, k) => n + st[k] * Q.part(k).cost, 0),
    below:Object.keys(mins).filter(k => (st[k] || 0) < mins[k])};
}

/* ======================================================================
   PARTS
   ====================================================================== */
MP.pages.parts = {
  title:(r) => r.parts[0] === "location" ? (Q.loc(r.parts[1]) ? Q.loc(r.parts[1]).name : "Location") : r.parts[0] ? "Part " + r.parts[0] : "Parts",
  sub:(r, S) => r.parts[0] === "location" ? "Stock and van minimums" : r.parts[0] ? (Q.part(r.parts[0]) ? Q.part(r.parts[0]).name : "") : "Main Stores and " + vanIds(S).length + " vans. Reorder suggestions only.",
  render:(route, S) => {
    const a = route.parts;
    if (a[0] === "location") return h(LocationPage, {key:a[1], S, id:a[1]});
    if (a[0]) return h(PartPage, {key:a[0], S, sku:a[0]});
    return h(PartsHome, {S, tab:route.query.tab || "stock"});
  }
};

function PartsHome(p){
  const S = p.S, tab = ["stock","locations","movements","reorders"].indexOf(p.tab) >= 0 ? p.tab : "stock";
  let units = 0; Object.keys(S.stock).forEach(l => Object.keys(S.stock[l]).forEach(k => { units += S.stock[l][k] || 0; }));
  let vanVal = 0; vanIds(S).forEach(v => { vanVal += locStats(S, v).val; });
  const low = Q.lowStock(), lowTot = low.filter(l => l.kind === "reorder"), lowVan = low.filter(l => l.kind === "van");
  const need = lowTot.filter(l => !l.open);
  const open = S.reorders.filter(r => r.status === "Requested" || r.status === "Ordered");
  const go = (t) => MP.go("parts?tab=" + t);
  return h("div", {className:"g", style:{gap:16}},
    h("div", {className:"g as-kpis"},
      h(Kpi, {label:"Parts in stock", value:num(units), sub:Object.keys(S.parts).length + " part numbers in " + Object.keys(S.locations).length + " locations", onClick:() => go("stock")}),
      h(Kpi, {label:"Van stock value", value:U.eur(vanVal), sub:"At cost, across " + vanIds(S).length + " vans", onClick:() => go("locations")}),
      h(Kpi, {label:"Low stock", value:low.length, color:need.length ? "var(--warn)" : null, sub:lowTot.length + " below reorder level, " + lowVan.length + " below van minimum", onClick:() => go("reorders")}),
      h(Kpi, {label:"Awaiting delivery", value:open.length, sub:num(open.reduce((n, r) => n + r.qty, 0)) + " units on open requests", onClick:() => go("reorders")})),
    h("div", {className:"row wrap", style:{gap:"8px 12px"}},
      h(Tabs, {value:tab, onChange:go, items:[["stock","Stock"],["locations","Locations", Object.keys(S.locations).length],["movements","Movements"],["reorders","Reorders", need.length || null]]}),
      h("span", {className:"sp1"}),
      h("span", {className:"faint", style:{fontSize:12}}, "Orders and supplier invoices stay in QuickBooks.")),
    tab === "stock" ? h(StockTab, {S}) : tab === "locations" ? h(LocationsTab, {S}) : tab === "movements" ? h(MovesTab, {S}) : h(ReordersTab, {S}));
}

function StockTab(p){
  const S = p.S, [q, setQ] = useState(""), [lowOnly, setLow] = useState(false);
  const use = usageIndex(S), s = q.trim().toLowerCase();
  const rows = Object.values(S.parts).map(P => Object.assign({id:P.sku, last:(use[P.sku] || [])[0] || null}, pState(S, P.sku)))
    .filter(r => !lowOnly || r.below || r.vanLow.length)
    .filter(r => !s || (r.P.sku + " " + r.P.name + " " + r.P.mfr + " " + r.P.bin).toLowerCase().indexOf(s) >= 0)
    .sort((a, b) => a.rank - b.rank || a.id.localeCompare(b.id));
  return h(Card, {title:"Stock", sub:"Every part number, where it is and when it was last used", icon:"parts",
      right:h("div", {className:"row wrap", style:{gap:8, justifyContent:"flex-end"}},
        h(Search, {value:q, onChange:setQ, placeholder:"Part number, name or bin"}),
        h(Chip, {k:lowOnly ? "acc" : null, onClick:() => setLow(!lowOnly), title:"Show only lines below a reorder level or a van minimum"}, lowOnly ? h(Icon, {n:"check", s:12}) : null, "Low only"))},
    h(Table, {rows, onRow:(r) => MP.go("parts/" + r.id), empty:"No parts match", emptyIcon:"parts", cols:[
      {t:"Part number", r:(r) => h("span", {className:"mono", style:{color:"var(--ink)"}}, r.id)},
      {t:"Name", r:(r) => r.P.name},
      {t:"Manufacturer", r:(r) => h("span", {className:"dim"}, r.P.mfr)},
      {t:"Bin", r:(r) => h("span", {className:"mono dim"}, r.P.bin)},
      {t:"Main Stores", num:true, r:(r) => r.main},
      {t:"In vans", num:true, r:(r) => h("span", {title:vanIds(S).filter(v => (S.stock[v][r.id] || 0) > 0).map(v => locName(v) + ": " + S.stock[v][r.id]).join(", ") || "None in vans"}, r.vans)},
      {t:"Total", num:true, r:(r) => h("b", {style:{color:r.below ? "var(--bad)" : "var(--ink)", fontWeight:600}}, r.tot)},
      {t:"Reorder level", num:true, r:(r) => h("span", {className:"dim"}, r.P.reorder)},
      {t:"Status", r:(r) => h(Badge, {k:r.tone, title:r.vanLow.length ? "Below van minimum: " + r.vanLow.map(locName).join(", ") : null}, r.label)},
      {t:"Last used", r:(r) => r.last ? h("span", {style:{whiteSpace:"nowrap"}}, h(Ref, {r:{type:"job", id:r.last.job}}), h("span", {className:"faint"}, " " + ymd(r.last.d))) : h("span", {className:"faint"}, "Not used yet")}
    ]}));
}

function LocationsTab(p){
  const S = p.S;
  const rows = Object.keys(S.locations).sort((a, b) => a === "main" ? -1 : b === "main" ? 1 : a.localeCompare(b)).map(id => Object.assign({id, l:S.locations[id]}, locStats(S, id)));
  const maxVal = Math.max.apply(null, rows.map(r => r.val));
  return h(Card, {title:"Stock locations", sub:"Main Stores and one van per engineer. Van minimums are set per van.", icon:"parts"},
    h(Table, {rows, onRow:(r) => MP.go("parts/location/" + r.id), cols:[
      {t:"Location", r:(r) => h("div", null, h("div", {style:{color:"var(--ink)", fontWeight:500}}, r.l.name), h("div", {className:"faint", style:{fontSize:11.5}}, r.l.kind === "van" ? "Van stock" : "Stores, reorder on total"))},
      {t:"Engineer", r:(r) => r.l.eng ? h("div", {className:"row", style:{gap:7}}, h(Av, {e:r.l.eng, s:22}), Q.eng(r.l.eng).name) : h("div", {className:"row", style:{gap:7}}, h(Av, {e:"pat", s:22}), S.staff.pat.name)},
      {t:"Lines", num:true, r:(r) => r.lines},
      {t:"Units", num:true, r:(r) => num(r.units)},
      {t:"Stock value", num:true, r:(r) => h("div", {style:{minWidth:120}}, h("div", null, U.eur(r.val)), h(Bar, {v:r.val / (maxVal || 1), style:{marginTop:5, height:4}}))},
      {t:"Below van minimum", r:(r) => r.l.kind !== "van" ? h("span", {className:"faint"}, "Not applicable") : r.below.length ? h(Badge, {k:"bad", title:r.below.join(", ")}, r.below.length + " line" + (r.below.length > 1 ? "s" : "") + ": " + r.below.join(", ")) : h(Badge, {k:"ok"}, "None")}
    ]}));
}

function MovesTab(p){
  const S = p.S, [type, setType] = useState("all");
  const all = S.moves.slice().sort(byNewest);
  const rows = all.filter(m => type === "all" || m.type === type).map((m, i) => Object.assign({key:"m" + i}, m));
  const counts = (t) => all.filter(m => m.type === t).length;
  return h(Card, {title:"Movements", sub:"Stock ledger: received, transferred and used", icon:"history",
      right:h(Tabs, {value:type, onChange:setType, items:[["all","All", all.length],["Received","Received", counts("Received")],["Transferred","Transferred", counts("Transferred")],["Used","Used", counts("Used")]]})},
    h(Table, {rows, empty:"No movements", cols:[
      {t:"Date", r:(m) => h("span", {className:"mono"}, ymd(m.d))},
      {t:"Time", r:(m) => h("span", {className:"mono dim"}, m.t)},
      {t:"Type", r:(m) => h(Badge, {k:m.type === "Received" ? "ok" : m.type === "Transferred" ? "acc" : ""}, m.type)},
      {t:"Part", r:(m) => h("div", null, h(Ref, {r:{type:"part", id:m.sku}}), h("div", {className:"faint", style:{fontSize:11.5}}, Q.part(m.sku).name))},
      {t:"Qty", num:true, r:(m) => m.qty},
      {t:"From → to", r:(m) => h("span", {className:"dim"}, (m.type === "Received" ? m.supplier || "Supplier" : locName(m.from)) + " → " + (m.type === "Used" ? (m.job && Q.job(m.job) ? Q.cust(Q.job(m.job).cust).name : "Fitted") : locName(m.to)))},
      {t:"Job", r:(m) => m.job ? h(Ref, {r:{type:"job", id:m.job}}) : h("span", {className:"faint"}, "None")},
      {t:"By", r:(m) => m.by}
    ]}));
}

function ReorderCard(p){
  const l = p.l, P = Q.part(l.sku);
  const cell = (k, v) => h("div", null, h("div", {className:"l"}, k), h("div", {className:"v"}, v));
  return h("div", {className:"card as-ro"},
    h("div", {className:"row", style:{gap:8}}, h(Badge, {k:"bad"}, "REORDER REQUIRED"), h("span", {className:"sp1"}), h("span", {className:"mono faint"}, "Parts Assistant")),
    h("div", {style:{marginTop:10}}, h(Ref, {r:{type:"part", id:l.sku}}), h("span", {style:{color:"var(--ink)", marginLeft:6}}, P.name)),
    h("div", {className:"as-ro-g"}, cell("Available", l.qty), cell("Minimum", l.min), cell("Suggested", P.reorderQty), cell("Supplier", h("span", {style:{fontSize:13, fontWeight:500}}, P.supplier))),
    h("div", {className:"row wrap", style:{gap:10, marginTop:14}},
      h(Btn, {k:"pri", sm:true, icon:"plus", onClick:() => A.createReorder(l.sku)}, "Create reorder request"),
      h("span", {className:"faint", style:{fontSize:11.5}}, "Raises an internal request and drafts the supplier email")));
}
function EmailDraft(p){
  const r = p.r, P = Q.part(r.sku);
  return h(Card, {title:"Reorder request " + r.id, sub:"Raised by " + r.by + " on " + ymd(r.raised) + ". Supplier email drafted for purchasing, not sent.", icon:"parts", right:h(Badge, {k:"warn"}, r.status)},
    h("div", {className:"cb"},
      h("div", {className:"as-email"},
        h(KV, {rows:[["To", r.supplier + ", sales order desk"],["From", "stores@myers.ie"],["Subject", "Reorder " + r.id + ": " + r.qty + " × " + r.sku + " " + P.name]]}),
        h("div", {className:"as-email-body"}, "Hello,\n\nPlease supply " + r.qty + " × " + r.sku + " (" + P.name + ") for Myers Food Machinery, Main Stores bin " + P.bin + ".\n\nPlease confirm the delivery date.\n\nThanks,\n" + r.by + "\nStores, Myers Food Machinery")),
      h("div", {className:"row wrap", style:{gap:8, marginTop:12}},
        h(Icon, {n:"qb", s:15, style:{color:"var(--dim)"}}),
        h("span", {className:"dim", style:{fontSize:12}}, "Orders and supplier invoices stay in QuickBooks. Pulse tracks the delivery and the stock."),
        h("span", {className:"sp1"}),
        h(Btn, {sm:true, icon:"check", onClick:() => A.receiveReorder(r.id)}, "Mark received"))));
}
const RO_TONE = {Requested:"warn", Ordered:"acc", Received:"ok"};
function ReordersTab(p){
  const S = p.S, need = Q.lowStock().filter(l => l.kind === "reorder" && !l.open);
  const requested = S.reorders.filter(r => r.status === "Requested");
  const openFirst = (r) => r.status === "Received" ? 1 : 0;
  const list = S.reorders.slice().sort((a, b) => openFirst(a) - openFirst(b) || b.raised.localeCompare(a.raised) || b.id.localeCompare(a.id));
  return h("div", {className:"g", style:{gap:14}},
    need.length ? h("div", {className:"as-cards"}, need.map(l => h(ReorderCard, {key:l.sku, l})))
      : h(Card, {pad:true}, h(Empty, {title:"Every line below its reorder level has a request", icon:"check"}, "A card appears here the moment total stock drops below a reorder level with nothing on order.")),
    requested.map(r => h(EmailDraft, {key:r.id, r})),
    h(Card, {title:"Reorder requests", sub:"Internal requests and expected deliveries. No procurement or supplier accounting in Pulse.", icon:"parts"},
      h(Table, {rows:list, empty:"No reorder requests", cols:[
        {t:"Request", r:(r) => h("span", {className:"mono", style:{color:"var(--ink)"}}, r.id)},
        {t:"Part", r:(r) => h("div", null, h(Ref, {r:{type:"part", id:r.sku}}), h("div", {className:"faint", style:{fontSize:11.5}}, Q.part(r.sku).name))},
        {t:"Qty", num:true, r:(r) => r.qty},
        {t:"Supplier", r:(r) => r.supplier},
        {t:"Status", r:(r) => h(Badge, {k:RO_TONE[r.status] || ""}, r.status)},
        {t:"Raised", r:(r) => h("span", {className:"mono dim"}, ymd(r.raised))},
        {t:"ETA", r:(r) => h("span", {className:"mono"}, r.status === "Received" ? "Received" : ymd(r.eta))},
        {t:"Note", r:(r) => h("span", {className:"dim", style:{fontSize:12}}, r.note || "")},
        {t:"", r:(r) => r.status === "Received" ? null : h(Btn, {sm:true, onClick:() => A.receiveReorder(r.id)}, "Mark received")}
      ]})));
}

function PartPage(p){
  const S = p.S, P = Q.part(p.sku);
  if (!P) return h(NotFound, {what:"Part", id:p.sku, back:["Parts", "parts"]});
  const st = pState(S, P.sku), by = Q.stockBy(P.sku), use = usageIndex(S)[P.sku] || [];
  const moves = Q.partMoves(P.sku).slice().sort(byNewest).map((m, i) => Object.assign({key:"m" + i}, m));
  const docs = Q.docsFor({type:"part", id:P.sku});
  const low = Q.lowStock().find(l => l.kind === "reorder" && l.sku === P.sku && !l.open);
  const last = use[0] || null;
  const fits = P.models.map(k => ({k, M:MODELS[k], n:Object.values(S.machines).filter(m => m.model === k).length}));
  return h("div", {className:"g", style:{gap:14}},
    h(RecHead, {back:["All parts", "parts"], kicker:P.mfr.toUpperCase() + " · BIN " + P.bin, title:h(F, null, h("span", {className:"mono", style:{fontSize:21}}, P.sku), h("span", {style:{fontWeight:500, color:"var(--body)"}}, "  " + P.name)),
      badges:[h(Badge, {key:"s", k:st.tone}, st.label), st.vanLow.length ? h(Badge, {key:"v", k:"warn"}, "Below van minimum: " + st.vanLow.map(locName).join(", ")) : null]},
      h("div", {className:"as-stats"}, stat("Total stock", st.tot, st.below ? "var(--bad)" : null), stat("Reorder level", P.reorder), stat("Main Stores", st.main), stat("In vans", st.vans))),
    h("div", {className:"as-split"},
      h("div", {className:"as-stack"},
        h(Card, {title:"Quantity by location", sub:"Live from the stock ledger", icon:"parts"},
          h(Table, {rows:by.map(x => Object.assign({id:x.loc}, x)), onRow:(x) => MP.go("parts/location/" + x.loc), cols:[
            {t:"Location", r:(x) => h(Ref, {r:{type:"location", id:x.loc}})},
            {t:"Held by", r:(x) => Q.loc(x.loc).eng ? h("div", {className:"row", style:{gap:7}}, h(Av, {e:Q.loc(x.loc).eng, s:20}), Q.eng(Q.loc(x.loc).eng).name) : h("span", {className:"dim"}, "Stores, bin " + P.bin)},
            {t:"Qty", num:true, r:(x) => h("b", {style:{fontWeight:600, color:"var(--ink)"}}, x.qty)},
            {t:"Van minimum", num:true, r:(x) => x.min != null ? x.min : h("span", {className:"faint"}, "None")},
            {t:"State", r:(x) => x.min != null && x.qty < x.min ? h(Badge, {k:"bad"}, "Below minimum") : h(Badge, {k:"ok"}, "OK")}
          ]}),
          h("div", {className:"cb", style:{paddingTop:12, borderTop:"1px solid var(--border)"}},
            h("div", {className:"row", style:{gap:10}}, h("span", {style:{color:"var(--ink)", fontWeight:600}}, "Total " + st.tot), h("span", {className:"dim"}, "against a reorder level of " + P.reorder), h("span", {className:"sp1"}),
              h("span", {style:{color:st.below ? "var(--bad)" : "var(--ok)", fontSize:12.5, fontWeight:500}}, st.below ? "Below reorder level" : "Above reorder level")),
            h(Bar, {v:st.tot / Math.max(1, P.reorder * 2), color:st.below ? "var(--bad)" : "var(--ok)", style:{marginTop:8}}))),
        h(Card, {title:"History", sub:"Received, transferred and used, newest first", icon:"history"},
          h(Table, {rows:moves, empty:"No movements recorded", cols:[
            {t:"Date", r:(m) => h("span", {className:"mono"}, ymd(m.d) + " " + m.t)},
            {t:"Type", r:(m) => h(Badge, {k:m.type === "Received" ? "ok" : m.type === "Transferred" ? "acc" : ""}, m.type)},
            {t:"Detail", r:(m) => m.type === "Used" ? h("span", null, h(Ref, {r:{type:"job", id:m.job}}), h("span", {className:"dim"}, ", from " + locName(m.from))) :
              m.type === "Transferred" ? h("span", {className:"dim"}, locName(m.from) + " → " + locName(m.to)) : h("span", {className:"dim"}, "Supplier delivery, " + (m.supplier || P.supplier) + " → " + locName(m.to))},
            {t:"Qty", num:true, r:(m) => m.qty},
            {t:"By", r:(m) => m.by}
          ]})),
        h(Card, {title:"Jobs where fitted", sub:use.length + " fitted across " + new Set(use.map(u => u.machine)).size + " machines", icon:"jobs"},
          h(Table, {rows:use.map((u, i) => Object.assign({key:"u" + i}, u)), onRow:(u) => MP.go("jobs/" + u.job), empty:"Not fitted on any job yet", cols:[
            {t:"Date", r:(u) => h("span", {className:"mono"}, ymd(u.d))},
            {t:"Job", r:(u) => h(Ref, {r:{type:"job", id:u.job}})},
            {t:"Customer", r:(u) => h(Ref, {r:{type:"customer", id:u.cust}})},
            {t:"Machine", r:(u) => u.machine ? h("span", null, h(Ref, {r:{type:"machine", id:u.machine}}), h("span", {className:"mono faint"}, " " + u.machine)) : h("span", {className:"faint"}, "Not recorded")},
            {t:"Qty", num:true, r:(u) => u.qty},
            {t:"From", r:(u) => locName(u.from)},
            {t:"Engineer", r:(u) => u.eng && Q.eng(u.eng) ? Q.eng(u.eng).name : ""}
          ]}))),
      h("div", {className:"as-stack"},
        low ? h(ReorderCard, {l:low}) : null,
        st.open ? (st.open.status === "Requested" ? h(EmailDraft, {r:st.open}) : h(Card, {pad:true},
          h("div", {className:"row", style:{gap:8}}, h(Badge, {k:"acc"}, "On order"), h("span", {className:"mono"}, st.open.id), h("span", {className:"sp1"}), h("span", {className:"mono dim"}, "ETA " + ymd(st.open.eta))),
          h("div", {className:"dim", style:{marginTop:8}}, st.open.qty + " from " + st.open.supplier + ". " + (st.open.note || "")),
          h("div", {style:{marginTop:10}}, h(Btn, {sm:true, icon:"check", onClick:() => A.receiveReorder(st.open.id)}, "Mark received")))) : null,
        h(Card, {title:"Details", icon:"parts"}, h("div", {className:"cb"}, h(KV, {rows:[
          ["Manufacturer", P.mfr],
          ["Stores location", h("span", {className:"mono"}, P.bin)],
          ["Supplier", P.supplier],
          ["Reorder level", P.reorder + " across all locations"],
          ["Reorder quantity", P.reorderQty],
          ["Unit cost", h("span", null, U.eur2(P.cost), h("span", {className:"faint"}, "  internal"))],
          ["Last used", last ? h("span", null, h(Ref, {r:{type:"job", id:last.job}}), h("span", {className:"dim"}, ", " + ymd(last.d) + (last.eng && Q.eng(last.eng) ? ", " + Q.eng(last.eng).name : ""))) : "Not used yet"],
          ["Fits", fits.length ? h("div", {className:"row wrap", style:{gap:6}}, fits.map(f => h(Chip, {key:f.k, onClick:() => MP.go("machines?model=" + f.k)}, f.M.name + " · " + f.n + " machine" + (f.n === 1 ? "" : "s")))) : h("span", {className:"dim"}, "General stock, any machine")]
        ]}))),
        h(Card, {title:"Documents", sub:"Photos and labels captured for this part", icon:"documents"}, h(DocList, {docs, empty:"No documents linked to this part"})))));
}

function TransferCtl(p){
  const S = p.S, main = (S.stock.main || {})[p.sku] || 0;
  const [n, setN] = useState(Math.max(1, Math.min(p.need, main)));
  if (!main){ const o = Q.openReorder(p.sku); return h("span", {className:"faint", style:{fontSize:12}}, "Main Stores empty" + (o ? ". " + o.id + " due " + U.dm(o.eta) : "")); }
  const qty = Math.max(1, Math.min(main, n));
  return h("div", {className:"row", style:{gap:6}, onClick:(e) => e.stopPropagation()},
    h("input", {className:"in", type:"number", min:1, max:main, value:qty, "aria-label":"Quantity to transfer from Main Stores", style:{width:62, height:28}, onChange:(e) => setN(parseInt(e.target.value, 10) || 1)}),
    h(Btn, {sm:true, icon:"arrow", onClick:() => A.transfer(p.sku, "main", p.loc, qty)}, "Transfer from Main Stores"),
    h("span", {className:"faint", style:{fontSize:11.5}}, main + " in stores"));
}
function LocationPage(p){
  const S = p.S, L = Q.loc(p.id);
  if (!L) return h(NotFound, {what:"Location", id:p.id, back:["Parts", "parts?tab=locations"]});
  const st = S.stock[L.id] || {}, mins = S.vanMin[L.id] || {}, ls = locStats(S, L.id), isVan = L.kind === "van";
  const skus = isVan ? Array.from(new Set(Object.keys(st).concat(Object.keys(mins)))) : Object.keys(S.parts);
  const rows = skus.map(sku => ({id:sku, P:Q.part(sku), qty:st[sku] || 0, min:mins[sku] != null ? mins[sku] : null}))
    .map(r => Object.assign(r, {below:r.min != null && r.qty < r.min, ps:isVan ? null : pState(S, r.id)}))
    .sort((a, b) => (b.below - a.below) || (isVan ? 0 : a.ps.rank - b.ps.rank) || a.id.localeCompare(b.id));
  const E = L.eng ? Q.eng(L.eng) : null;
  const others = Object.keys(S.locations).sort((a, b) => a === "main" ? -1 : b === "main" ? 1 : a.localeCompare(b));
  const cols = [
    {t:"Part", r:(r) => h(Ref, {r:{type:"part", id:r.id}})},
    {t:"Name", r:(r) => r.P.name},
    {t:"Bin", r:(r) => h("span", {className:"mono dim"}, r.P.bin)},
    {t:"Qty", num:true, r:(r) => h("b", {style:{fontWeight:600, color:r.below ? "var(--bad)" : "var(--ink)"}}, r.qty)}
  ].concat(isVan ? [
    {t:"Van minimum", num:true, r:(r) => r.min != null ? r.min : h("span", {className:"faint"}, "None")},
    {t:"State", r:(r) => r.below ? h(Badge, {k:"bad"}, "Below minimum") : h(Badge, {k:"ok"}, "OK")},
    {t:"Top up", r:(r) => r.below ? h(TransferCtl, {S, sku:r.id, loc:L.id, need:r.min - r.qty}) : null}
  ] : [
    {t:"Total, all locations", num:true, r:(r) => r.ps.tot},
    {t:"Reorder level", num:true, r:(r) => h("span", {className:"dim"}, r.P.reorder)},
    {t:"State", r:(r) => h(Badge, {k:r.ps.tone}, r.ps.label)}
  ]);
  return h("div", {className:"g", style:{gap:14}},
    h(RecHead, {back:["All locations", "parts?tab=locations"], kicker:isVan ? "VAN STOCK" : "MAIN STORES", title:L.name,
      sub:E ? h("span", {className:"row", style:{gap:7, display:"inline-flex"}}, h(Av, {e:E, s:20}), h(Ref, {r:{type:"engineer", id:E.id}}), h("span", {className:"dim"}, E.phone)) : "Stores, run by " + S.staff.pat.name + ". Reorder levels apply to total stock.",
      badges:isVan ? [h(Badge, {key:"b", k:ls.below.length ? "bad" : "ok"}, ls.below.length ? ls.below.length + " below van minimum" : "All lines at or above minimum")] : null},
      h("div", {className:"as-stats"}, stat("Lines", ls.lines), stat("Units", num(ls.units)), stat("Stock value", U.eur(ls.val)), stat(isVan ? "Below minimum" : "Below reorder", isVan ? ls.below.length : Q.lowStock().filter(l => l.kind === "reorder").length))),
    h("div", {className:"row wrap", style:{gap:6}}, others.map(id => h(Chip, {key:id, k:id === L.id ? "acc" : null, onClick:() => MP.go("parts/location/" + id)}, S.locations[id].name))),
    h(Card, {title:isVan ? "Van stock" : "Stores stock", sub:isVan ? "Lines below the van minimum can be topped up from Main Stores" : "Every part number held in Main Stores", icon:"parts"},
      h(Table, {rows, cols, onRow:(r) => MP.go("parts/" + r.id), empty:"Nothing stocked here"})));
}

/* ======================================================================
   MACHINES
   ====================================================================== */
function warrantyBadge(m){
  if (!m.warrantyEnd) return h(Badge, {k:"line"}, "Starts at handover");
  return Q.warrantyActive(m.id) ? h(Badge, {k:"ok"}, "Active until " + U.dmy(m.warrantyEnd)) : h(Badge, {k:"line"}, "Expired");
}
function machineRow(S, m){
  const jobs = Q.machineJobs(m.id);
  const last = jobs.find(j => Q.DONE.indexOf(j.status) >= 0);
  return {id:m.id, m, M:MODELS[m.model], c:Q.cust(m.cust), s:Q.site(m.site), wa:Q.warrantyActive(m.id), last, open:jobs.filter(j => Q.OPEN.indexOf(j.status) >= 0 && !j.draft).length};
}
MP.pages.machines = {
  title:(r) => r.parts[0] ? (Q.mach(r.parts[0]) ? Q.model(r.parts[0]).name : "Machine") : "Machines",
  sub:(r) => r.parts[0] ? (Q.mach(r.parts[0]) ? r.parts[0] + " · " + Q.cust(Q.mach(r.parts[0]).cust).name : "") : "Machine register: every installed machine, its history and documents",
  render:(route, S) => route.parts[0] ? h(MachinePage, {key:route.parts[0], S, id:route.parts[0]}) : h(MachineList, {key:JSON.stringify(route.query), S, query:route.query})
};
function MachineList(p){
  const S = p.S, [q, setQ] = useState(p.query.q || ""), [model, setModel] = useState(MODELS[p.query.model] ? p.query.model : ""), [w, setW] = useState(p.query.warranty || "all");
  const all = Object.values(S.machines).map(m => machineRow(S, m));
  const s = q.trim().toLowerCase();
  const base = all.filter(r => (!model || r.m.model === model) && (!s || [r.c.name, r.M.name, r.M.type, r.m.id, r.m.model, r.s.name, r.s.town].join(" ").toLowerCase().indexOf(s) >= 0));
  const rows = base.filter(r => w === "all" || (w === "active" ? r.wa : !r.wa)).sort((a, b) => a.c.name.localeCompare(b.c.name) || a.M.name.localeCompare(b.M.name) || a.id.localeCompare(b.id));
  const custs = new Set(all.map(r => r.m.cust)).size;
  return h(Card, {title:"Machine register", sub:all.length + " machines at " + custs + " customers. The QR tag on each machine opens its record.", icon:"machines",
      right:h("div", {className:"row wrap", style:{gap:8, justifyContent:"flex-end"}},
        h(Search, {value:q, onChange:setQ, placeholder:"Customer, machine, serial or model"}),
        h("select", {className:"sel", value:model, onChange:(e) => setModel(e.target.value), "aria-label":"Filter by model", style:{width:220, height:30}},
          h("option", {value:""}, "All models and types"), Object.keys(MODELS).map(k => h("option", {key:k, value:k}, MODELS[k].name + " (" + MODELS[k].type + ")"))),
        h(Tabs, {value:w, onChange:setW, items:[["all","All", base.length],["active","Warranty active", base.filter(r => r.wa).length],["expired","Expired", base.filter(r => !r.wa).length]]}))},
    h(Table, {rows, onRow:(r) => MP.go("machines/" + r.id), empty:"No machines match", emptyIcon:"machines", cols:[
      {t:"Machine", r:(r) => h("div", null, h("div", {style:{color:"var(--ink)", fontWeight:500}}, r.M.name), h("div", {className:"faint", style:{fontSize:11.5}}, r.M.type))},
      {t:"Serial", r:(r) => h("span", {className:"mono", style:{color:"var(--ink)"}}, r.id)},
      {t:"Customer", r:(r) => h(Ref, {r:{type:"customer", id:r.m.cust}})},
      {t:"Site", r:(r) => h("div", null, h("div", null, r.s.name), h("div", {className:"faint", style:{fontSize:11.5}}, r.s.town))},
      {t:"Installed", r:(r) => r.m.installed ? h("span", {className:"mono"}, U.dmy(r.m.installed)) : h(Badge, {k:"acc"}, "Installing")},
      {t:"Warranty", r:(r) => warrantyBadge(r.m)},
      {t:"Last service", r:(r) => r.last ? h("span", {className:"mono dim"}, ymd(r.last.date)) : h("span", {className:"faint"}, "None yet")},
      {t:"Open jobs", num:true, r:(r) => r.open ? h(Badge, {k:"warn"}, r.open) : h("span", {className:"faint"}, "0")}
    ]}));
}
/* Machine Expert: repeated parts and repeated symptoms, derived from the machine's own history. */
const words = (s) => new Set(String(s || "").toLowerCase().split(/[^a-z]+/).filter(w => w.length > 4));
const similar = (a, b) => { const A1 = words(a), B1 = words(b); let n = 0; A1.forEach(w => { if (B1.has(w)) n++; }); return n >= 2; };
function expert(S, m){
  const out = [], by = {};
  Q.machineParts(m.id).forEach(x => { (by[x.sku] = by[x.sku] || new Set()).add(x.job); });
  const advice = (P) => /sensor/i.test(P.name) ? "Check the bracket for vibration before fitting another." : "Look for the root cause (alignment, wear on mating parts) before fitting another.";
  Object.keys(by).forEach(sku => {
    const js = Array.from(by[sku]).map(id => Q.job(id)).sort((a, b) => a.date.localeCompare(b.date)), P = Q.part(sku);
    if (js.length >= 2){
      const same = js.slice(1).every(j => similar(j.issue, js[0].issue));
      out.push({text:P.name + " (" + sku + ") replaced " + times(js.length) + " on this machine" + (same ? " for the same symptom" : "") + ". " + advice(P), jobs:js});
    }
  });
  Q.machineJobs(m.id).filter(j => Q.OPEN.indexOf(j.status) >= 0).forEach(j => (j.possibleParts || []).forEach(sku => {
    if (!by[sku] || by[sku].size !== 1 || j.parts.some(x => x.sku === sku)) return;
    const prev = Q.job(Array.from(by[sku])[0]); if (!similar(prev.issue, j.issue)) return;
    out.push({text:"Job #" + j.id + " reports the same symptom as Job #" + prev.id + " on " + ymd(prev.date) + ", when " + sku + " (" + Q.part(sku).name + ") was replaced. " + advice(Q.part(sku)), jobs:[prev, j]});
  }));
  return out;
}
function MachinePage(p){
  const S = p.S, m = Q.mach(p.id), jobs = m ? Q.machineJobs(m.id) : [];
  const [hist, more] = useMore(jobs, 10);
  if (!m) return h(NotFound, {what:"Machine", id:p.id, back:["Machine register", "machines"]});
  const M = MODELS[m.model], c = Q.cust(m.cust), s = Q.site(m.site), wa = Q.warrantyActive(m.id);
  const open = jobs.filter(j => Q.OPEN.indexOf(j.status) >= 0);
  const parts = Q.machineParts(m.id).map((x, i) => Object.assign({key:"p" + i}, x));
  const docs = Q.docsFor({type:"machine", id:m.id});
  const claims = Object.values(S.claims).filter(x => x.machine === m.id).sort((a, b) => b.id.localeCompare(a.id));
  const ins = expert(S, m);
  return h("div", {className:"g", style:{gap:14}},
    h(RecHead, {back:["Machine register", "machines"], kicker:M.type.toUpperCase() + " · " + M.mfr.toUpperCase(), title:M.name.toUpperCase(),
      sub:h("span", null, h("span", {className:"mono"}, m.id), h("span", {className:"dim"}, " at "), h(Ref, {r:{type:"customer", id:c.id}}), h("span", {className:"dim"}, ", " + s.name + ", " + s.town)),
      badges:[h(Badge, {key:"s", k:m.status === "Active" ? "ok" : "acc"}, m.status.toUpperCase()), h(Badge, {key:"w", k:wa ? "ok" : "line"}, "WARRANTY " + (m.warrantyEnd ? (wa ? "ACTIVE" : "EXPIRED") : "NOT STARTED")),
        open.length ? h(Badge, {key:"o", k:"warn"}, open.length + " open issue" + (open.length > 1 ? "s" : "")) : null],
      right:h("div", {className:"as-qr"}, h(QR, {v:m.qr, s:112}), h("div", {className:"mono faint"}, m.qr), h("div", {className:"dim", style:{fontSize:11.5}}, "Scan to open this record. Printed tag on the machine guard."))},
      h("div", {style:{marginTop:14}}, h(KV, {rows:[
        ["Serial", h("span", {className:"mono"}, m.id)],
        ["Customer", h(Ref, {r:{type:"customer", id:c.id}})],
        ["Site", s.name + ", " + s.town],
        ["Installed", m.installed ? U.dLong(m.installed) : "Installation in progress"],
        ["Status", m.status],
        ["Warranty", m.warrantyEnd ? (wa ? "Active until " : "Expired ") + U.dLong(m.warrantyEnd) : "Starts at handover"],
        ["Service skill", M.skill]
      ]}))),
    ins.length ? h("div", {className:"as-ins"}, ins.map((x, i) => h("div", {key:i, style:{marginTop:i ? 10 : 0}},
      h("div", {className:"row wrap", style:{gap:8}}, h(Badge, {k:"acc"}, "Machine Expert"), h("span", {className:"faint", style:{fontSize:11.5}}, "From the service history of " + m.id)),
      h("div", {style:{color:"var(--ink)", marginTop:6}}, x.text),
      h("div", {className:"row wrap", style:{gap:10, marginTop:6}}, x.jobs.map(j => h("span", {key:j.id, className:"dim", style:{fontSize:12}}, h(Ref, {r:{type:"job", id:j.id}}), " " + ymd(j.date))))))) : null,
    h("div", {className:"as-split"},
      h("div", {className:"as-stack"},
        h(Card, {title:"Open issues", sub:"Open jobs on this machine", icon:"alert"},
          h(Table, {rows:open, onRow:(j) => MP.go("jobs/" + j.id), empty:"No open issues", emptyIcon:"check", cols:[
            {t:"Job", r:(j) => h(Ref, {r:{type:"job", id:j.id}})},
            {t:"Issue", r:(j) => h("span", {style:{color:"var(--ink)"}}, j.issue)},
            {t:"Engineer", r:(j) => j.eng ? Q.eng(j.eng).name : h("span", {className:"faint"}, "Unassigned")},
            {t:"Priority", r:(j) => h(Prio, {p:j.prio})},
            {t:"Status", r:(j) => h(Status, {j})}
          ]})),
        h(Card, {title:"Service history", sub:jobs.length + " jobs on record", icon:"history"},
          h(Table, {rows:hist, onRow:(j) => MP.go("jobs/" + j.id), cols:[
            {t:"Date", r:(j) => h("span", {className:"mono"}, ymd(j.date))},
            {t:"Job", r:(j) => h(Ref, {r:{type:"job", id:j.id}})},
            {t:"Type", r:(j) => h("span", {className:"dim"}, j.type)},
            {t:"Engineer", r:(j) => j.eng ? Q.eng(j.eng).name : h("span", {className:"faint"}, "Unassigned")},
            {t:"Issue → resolution", r:(j) => h("div", {style:{minWidth:220}}, h("div", {style:{color:"var(--ink)"}}, j.issue), h("div", {className:"dim", style:{fontSize:12}}, j.resolution || (j.report && j.report.summary) || j.status))},
            {t:"Parts", r:(j) => j.parts.length ? h("div", {className:"row wrap", style:{gap:4}}, j.parts.map((x, i) => h(Ref, {key:i, r:{type:"part", id:x.sku}}))) : h("span", {className:"faint"}, "None")},
            {t:"Status", r:(j) => h(Status, {j})}
          ]}), more),
        h(Card, {title:"Part history", sub:"Every part fitted to this machine", icon:"parts"},
          h(Table, {rows:parts, onRow:(x) => MP.go("parts/" + x.sku), empty:"No parts fitted yet", cols:[
            {t:"Date", r:(x) => h("span", {className:"mono"}, ymd(x.d))},
            {t:"Part", r:(x) => h("div", null, h(Ref, {r:{type:"part", id:x.sku}}), h("div", {className:"faint", style:{fontSize:11.5}}, Q.part(x.sku).name))},
            {t:"Qty", num:true, r:(x) => x.qty},
            {t:"Job", r:(x) => h(Ref, {r:{type:"job", id:x.job}})},
            {t:"From", r:(x) => locName(x.from)}
          ]}))),
      h("div", {className:"as-stack"},
        h(Card, {title:"Warranty claims", icon:"warranties"},
          h(Table, {rows:claims, onRow:(x) => MP.go("warranties/" + x.id), empty:"No claims on this machine", cols:[
            {t:"Claim", r:(x) => h(Ref, {r:{type:"warranty", id:x.id}})},
            {t:"Part", r:(x) => x.part ? h("span", {className:"mono"}, x.part) : h("span", {className:"faint"}, "None")},
            {t:"Status", r:(x) => h(Badge, {k:CLAIM_TONE[x.stage]}, x.status)},
            {t:"Value", num:true, r:(x) => U.eur(x.value)}
          ]})),
        h(Card, {title:"Documents", sub:"Manuals, certificates, service reports and photos", icon:"documents"}, h(DocList, {docs, n:10})),
        h(Card, {title:"Related", icon:"knowledge"}, h("div", {className:"cb row wrap", style:{gap:6}},
          h(Chip, {k:"acc", icon:"knowledge", onClick:() => MP.go("knowledge/machine/" + m.id)}, "Open in knowledge graph"),
          h(Chip, {onClick:() => MP.go("machines?model=" + m.model)}, "Other " + M.name + " machines"),
          h(Chip, {onClick:() => MP.go("customers/" + c.id)}, c.name))))));
}

/* ======================================================================
   WARRANTIES
   ====================================================================== */
const STAGES = [["Active","Active claims"],["Awaiting manufacturer","Awaiting manufacturer"],["Credit due","Credit due"],["Closed","Closed"]];
const CLAIM_TONE = {"Active":"warn", "Awaiting manufacturer":"acc", "Credit due":"ok", "Closed":"line"};
MP.pages.warranties = {
  title:(r) => r.parts[0] ? "Claim " + r.parts[0] : "Warranties",
  sub:(r, S) => { if (r.parts[0]){ const c = Q.claim(r.parts[0]); return c ? Q.cust(c.cust).name + " · " + (Q.mach(c.machine) ? Q.model(c.machine).name : "") : ""; }
    const o = Object.values(S.claims).filter(c => c.stage !== "Closed"); return o.length + " open claims, " + U.eur(o.reduce((n, c) => n + c.value, 0)) + " with manufacturers"; },
  render:(route, S) => route.parts[0] ? h(ClaimPage, {key:route.parts[0], S, id:route.parts[0]}) : h(WarrantyBoard, {S})
};
function ClaimCard(p){
  const c = p.c, m = Q.mach(c.machine), P = c.part ? Q.part(c.part) : null;
  return h("button", {type:"button", className:"as-wc", onClick:() => MP.go("warranties/" + c.id)},
    h("div", {className:"row", style:{gap:8}}, h("span", {className:"mono", style:{color:"var(--ink)", fontWeight:600}}, c.id), h("span", {className:"sp1"}), h(Badge, {k:c.status === "Rejected" ? "bad" : CLAIM_TONE[c.stage]}, c.status)),
    h("div", {style:{color:"var(--ink)", fontWeight:500, marginTop:8}}, Q.cust(c.cust).name),
    h("div", {className:"dim", style:{fontSize:12}}, (m ? MODELS[m.model].name : "Machine") + " · ", h("span", {className:"mono"}, c.machine)),
    h("div", {className:"dim", style:{fontSize:12, marginTop:2}}, P ? h(F, null, "Failed: ", h("span", {className:"mono"}, c.part), " " + P.name) : "Failed part not recorded"),
    h("div", {className:"row", style:{gap:8, marginTop:9}}, h("span", {className:"faint", style:{fontSize:11.5}}, c.mfr), h("span", {className:"faint", style:{fontSize:11.5}}, c.submitted ? "Submitted " + ymd(c.submitted) : "Not submitted"),
      h("span", {className:"sp1"}), h("b", {style:{fontWeight:600, color:"var(--ink)", fontVariantNumeric:"tabular-nums"}}, U.eur(c.value))),
    c.overdue && c.stage === "Awaiting manufacturer" ? h("div", {style:{marginTop:8}}, h(Badge, {k:"bad"}, "Overdue, response was due " + ymd(c.due))) : null);
}
function WarrantyBoard(p){
  const S = p.S, all = Object.values(S.claims);
  const order = (a, b) => (b.overdue ? 1 : 0) - (a.overdue ? 1 : 0) || (b.submitted || "9999").localeCompare(a.submitted || "9999") || b.id.localeCompare(a.id);
  return h("div", {className:"g", style:{gap:14}},
    h("div", {className:"row wrap", style:{gap:10}}, h("span", {className:"dim"}, "Warranty jobs draft their claim automatically from the job sheet. A manager checks it before it goes to the manufacturer."),
      h("span", {className:"sp1"}), h("span", {className:"faint", style:{fontSize:12}}, "Credit notes are recorded in QuickBooks.")),
    h("div", {className:"as-board"}, STAGES.map(st => {
      const list = all.filter(c => c.stage === st[0]).sort(order), val = list.reduce((n, c) => n + c.value, 0);
      return h("section", {key:st[0], className:"as-col", "aria-label":st[1]},
        h("div", {className:"as-col-h"}, h("div", {className:"row", style:{gap:8}}, h("b", {style:{fontSize:12.5, letterSpacing:".04em"}}, st[1].toUpperCase()), h("span", {className:"sp1"}), h("span", {className:"mono dim"}, list.length)),
          h("div", {className:"faint", style:{fontSize:11.5, marginTop:2}}, U.eur(val) + (st[0] === "Closed" ? ", " + list.filter(c => c.status === "Credited").length + " credited, " + list.filter(c => c.status === "Rejected").length + " rejected" : list.some(c => c.overdue) ? ", " + list.filter(c => c.overdue).length + " overdue" : ""))),
        list.length ? list.map(c => h(ClaimCard, {key:c.id, c})) : h("div", {className:"faint", style:{fontSize:12, padding:"14px 6px"}}, "None"));
    })));
}
function ClaimPage(p){
  const S = p.S, c = Q.claim(p.id);
  if (!c) return h(NotFound, {what:"Claim", id:p.id, back:["Warranties", "warranties"]});
  const m = Q.mach(c.machine), M = m ? MODELS[m.model] : null, P = c.part ? Q.part(c.part) : null, j = c.job ? Q.job(c.job) : null;
  const si = STAGES.findIndex(x => x[0] === c.stage);
  const docs = c.docs.map(id => Q.doc(id)).filter(Boolean);
  const act = Q.activityFor({type:"warranty", id:c.id}).map(a => ({t:ymd(a.d), text:a.text, sub:a.t + " · " + a.actor, kind:a.kind}));
  const held = j && j.warranty === c.id && j.status === "Review Required";
  const actions = c.stage === "Active" ? [h(Btn, {key:"s", k:"pri", icon:"arrow", onClick:() => A.submitClaim(c.id)}, "Submit to " + c.mfr)]
    : c.stage === "Awaiting manufacturer" ? [h(Btn, {key:"c", onClick:() => A.chaseClaim(c.id)}, "Chase " + c.mfr), h(Btn, {key:"a", k:"pri", icon:"check", onClick:() => A.advanceClaim(c.id)}, "Mark approved")]
    : c.stage === "Credit due" ? [h(Btn, {key:"m", k:"pri", icon:"check", onClick:() => A.advanceClaim(c.id)}, "Mark credited")] : [];
  const note = c.stage === "Active" ? (held ? "Submitting also approves Job #" + j.id + ", which closes with no invoice." : "Sends the claim pack to " + c.mfr + ". Response due within 14 days.")
    : c.stage === "Awaiting manufacturer" ? (c.chased ? "Chased on " + ymd(c.chased) + "." : "No response yet.") + (c.due ? " Response due " + ymd(c.due) + "." : "")
    : c.stage === "Credit due" ? "Credit note is recorded in QuickBooks. Mark credited once it has arrived."
    : c.status === "Rejected" ? "Rejected by " + c.mfr + ". No credit." : "Credited" + (c.credited ? " on " + ymd(c.credited) : "") + ". Credit note recorded in QuickBooks.";
  return h("div", {className:"g", style:{gap:14}},
    h(RecHead, {back:["Warranties", "warranties"], kicker:"WARRANTY CLAIM · " + c.mfr.toUpperCase(), title:"Claim " + c.id,
      sub:Q.cust(c.cust).name + (M ? ", " + M.name + " " + c.machine : ""),
      badges:[h(Badge, {key:"s", k:c.status === "Rejected" ? "bad" : CLAIM_TONE[c.stage]}, c.status.toUpperCase()), c.overdue && c.stage === "Awaiting manufacturer" ? h(Badge, {key:"o", k:"bad"}, "Response overdue") : null,
        c.status === "Drafted by Pulse" ? h(Badge, {key:"d", k:"acc"}, "Drafted from Job #" + c.job) : null],
      right:h("div", {style:{textAlign:"right"}}, h("div", {className:"mono faint"}, "CLAIM VALUE"), h("div", {style:{fontSize:26, fontWeight:600, color:"var(--ink)", fontVariantNumeric:"tabular-nums"}}, U.eur(c.value)))},
      h("div", {className:"as-steps"}, STAGES.map((s, i) => h("div", {key:s[0], className:"as-step" + (i <= si ? " on" : "")}, h("i"), h("span", null, s[1]))))),
    h("div", {className:"as-split"},
      h("div", {className:"as-stack"},
        h(Card, {title:"Claim", icon:"warranties"}, h("div", {className:"cb"}, h(KV, {rows:[
          ["Customer", h(Ref, {r:{type:"customer", id:c.cust}})],
          ["Machine", m ? h(Ref, {r:{type:"machine", id:c.machine}}) : "Not recorded"],
          ["Serial", m ? h(Ref, {r:{type:"machine", id:c.machine}}, h("span", {className:"mono"}, c.machine)) : "Not recorded"],
          ["Failed part", P ? h("span", null, h(Ref, {r:{type:"part", id:c.part}}), " " + P.name) : "Not recorded"],
          ["Job", j ? h("span", null, h(Ref, {r:{type:"job", id:c.job}}), h("span", {className:"dim"}, ", " + ymd(j.date) + (j.eng ? ", " + Q.eng(j.eng).name : ""))) : "Not recorded"],
          ["Manufacturer", c.mfr],
          ["Status", h(Badge, {k:c.status === "Rejected" ? "bad" : CLAIM_TONE[c.stage]}, c.status.toUpperCase())],
          ["Claim value", U.eur(c.value)],
          ["Submitted", c.submitted ? U.dm(c.submitted) : "Not yet submitted"],
          ["Manufacturer ref", c.ref ? h("span", {className:"mono"}, c.ref) : c.submitted ? "Awaiting from " + c.mfr : "Issued on submission"],
          c.due && c.stage === "Awaiting manufacturer" ? ["Response due", h("span", {style:{color:c.overdue ? "var(--bad)" : null}}, U.dm(c.due) + (c.overdue ? ", overdue" : ""))] : null,
          ["Approved", c.approved ? U.dm(c.approved) : "Not yet"],
          c.credited ? ["Credited", U.dm(c.credited)] : null
        ]}), c.note ? h("div", {className:"dim", style:{marginTop:12, fontSize:12.5}}, c.note) : null)),
        h(Card, {title:"Supporting documents (" + docs.length + ")", sub:"Evidence sent with the claim", icon:"documents"}, h(DocList, {docs, n:12, empty:"No documents attached"}))),
      h("div", {className:"as-stack"},
        h(Card, {title:"Next step", icon:"arrow"}, h("div", {className:"cb"},
          h("div", {className:"dim", style:{fontSize:12.5}}, note),
          actions.length ? h("div", {className:"row wrap", style:{gap:8, marginTop:12}}, actions) : null,
          held ? h("div", {className:"row", style:{gap:8, marginTop:12}}, h(Status, {j}), h("span", {className:"dim", style:{fontSize:12}}, "Job #" + j.id + " waits for this claim")) : null)),
        h(Card, {title:"Activity", icon:"activity"}, h("div", {className:"cb"}, act.length ? h(Timeline, {items:act}) : h("div", {className:"faint", style:{fontSize:12}}, "No changes recorded in Pulse yet. Earlier steps were imported."))))));
}

/* ======================================================================
   CUSTOMERS
   ====================================================================== */
MP.pages.customers = {
  title:(r) => r.parts[0] ? (Q.cust(r.parts[0]) ? Q.cust(r.parts[0]).name : "Customer") : "Customers",
  sub:(r, S) => r.parts[0] ? "Customer record · synced from QuickBooks" : Object.keys(S.customers).length + " customers synced from QuickBooks. Service history lives in Pulse.",
  render:(route, S) => route.parts[0] ? h(CustomerPage, {key:route.parts[0], S, id:route.parts[0]}) : h(CustomerList, {S})
};
function CustomerList(p){
  const S = p.S, [q, setQ] = useState(""), s = q.trim().toLowerCase();
  const rows = Object.values(S.customers).map(c => { const js = Q.custJobs(c.id).filter(j => !j.draft); return Object.assign({id:c.id, c, last:js[0] || null}, Q.custStats(c.id)); })
    .filter(r => !s || [r.c.name, r.c.qb].concat(r.c.contacts.map(x => x.name)).concat(r.c.sites.map(x => Q.site(x).town)).join(" ").toLowerCase().indexOf(s) >= 0)
    .sort((a, b) => a.c.name.localeCompare(b.c.name));
  return h(Card, {title:"Customers", sub:"Names, addresses and contacts come from QuickBooks. Last sync " + S.integrations.qb.lastSync + ".", icon:"customers",
      right:h(Search, {value:q, onChange:setQ, placeholder:"Customer, contact or town"})},
    h(Table, {rows, onRow:(r) => MP.go("customers/" + r.id), empty:"No customers match", cols:[
      {t:"Customer", r:(r) => h("div", null, h("div", {style:{color:"var(--ink)", fontWeight:500}}, r.c.name), h("div", {className:"faint", style:{fontSize:11.5}}, (r.c.contacts[0] || {}).name + ", " + Q.site(r.c.sites[0]).town))},
      {t:"Sites", num:true, r:(r) => r.sites},
      {t:"Machines", num:true, r:(r) => r.machines},
      {t:"Open jobs", num:true, r:(r) => r.open ? h(Badge, {k:"warn"}, r.open) : h("span", {className:"faint"}, "0")},
      {t:"Jobs YTD", num:true, r:(r) => r.ytd},
      {t:"Last job", r:(r) => r.last ? h("span", null, h(Ref, {r:{type:"job", id:r.last.id}}), h("span", {className:"faint"}, " " + ymd(r.last.date))) : h("span", {className:"faint"}, "None")},
      {t:"QuickBooks", r:(r) => h(Badge, {k:"line", title:"Synced from QuickBooks"}, h(Icon, {n:"qb", s:12}), h("span", {className:"mono"}, r.c.qb))}
    ]}));
}
function custActivity(S, cid){
  const jobs = Q.custJobs(cid), jset = new Set(jobs.map(j => j.id));
  const mset = new Set(Object.values(S.machines).filter(m => m.cust === cid).map(m => m.id));
  const rset = new Set(S.requests.filter(r => r.ai && r.ai.cust === cid).map(r => r.id));
  const wset = new Set(Object.values(S.claims).filter(c => c.cust === cid).map(c => c.id));
  const items = [], seen = new Set();
  jobs.forEach(j => j.timeline.forEach(e => { items.push({d:e.d, t:e.t, text:e.text, who:e.by, job:j.id}); seen.add(j.id + "|" + e.d + "|" + e.t); }));
  S.activity.forEach(a => {
    const hit = a.refs.some(r => (r.type === "job" && jset.has(r.id)) || (r.type === "machine" && mset.has(r.id)) || (r.type === "request" && rset.has(r.id)) || (r.type === "warranty" && wset.has(r.id)) || (r.type === "customer" && r.id === cid));
    if (!hit) return;
    const jr = a.refs.find(r => r.type === "job" && jset.has(r.id));
    if (jr && seen.has(jr.id + "|" + a.d + "|" + a.t)) return;
    const other = a.refs.find(r => r.type === "warranty" || r.type === "machine" || r.type === "request");
    items.push({d:a.d, t:a.t, text:a.text, who:a.actor, job:jr ? jr.id : null, ref:other || null});
  });
  return items.sort(byNewest).map((x, i) => Object.assign({key:"a" + i}, x));
}
function CustomerPage(p){
  const S = p.S, c = Q.cust(p.id), jobs = c ? Q.custJobs(c.id) : [], act = c ? custActivity(S, c.id) : [];
  const [hist, moreHist] = useMore(jobs, 12);
  const [acts, moreAct] = useMore(act, 14);
  if (!c) return h(NotFound, {what:"Customer", id:p.id, back:["Customers", "customers"]});
  const st = Q.custStats(c.id);
  const machines = Object.values(S.machines).filter(m => m.cust === c.id);
  const models = new Set(machines.map(m => m.model));
  const docMap = {}; Q.docsFor({type:"customer", id:c.id}).forEach(d => docMap[d.id] = d);
  Object.values(S.docs).forEach(d => { if (d.links.model && models.has(d.links.model)) docMap[d.id] = d; });
  const docs = Object.values(docMap).sort(byNewest);
  const quotes = S.quotes.filter(q => q.cust === c.id);
  return h("div", {className:"g", style:{gap:14}},
    h(RecHead, {back:["Customers", "customers"], kicker:"CUSTOMER", title:c.name.toUpperCase(),
      sub:c.sites.map(x => Q.site(x).town).join(" · "),
      badges:[h(Badge, {key:"q", k:"line"}, h(Icon, {n:"qb", s:12}), "Synced from QuickBooks · ", h("span", {className:"mono"}, c.qb))],
      right:h(Chip, {k:"acc", icon:"knowledge", onClick:() => MP.go("knowledge/customer/" + c.id)}, "Knowledge graph")},
      h("div", {className:"as-stats"}, stat("Sites", st.sites), stat("Machines", st.machines), stat("Open jobs", st.open, st.open ? "var(--warn)" : null), stat("Jobs YTD", st.ytd))),
    h("div", {className:"as-split"},
      h("div", {className:"as-stack"},
        h(Card, {title:"Sites and machines", icon:"machines"}, c.sites.map((sid, i) => { const s = Q.site(sid), ms = machines.filter(m => m.site === sid).map(m => machineRow(S, m));
          return h("div", {key:sid, style:{borderTop:i ? "1px solid var(--border)" : null, paddingTop:i ? 6 : 0}},
            h("div", {className:"row", style:{gap:8, padding:"8px 18px 4px"}}, h("b", {style:{color:"var(--ink)", fontWeight:600}}, s.name), h("span", {className:"dim"}, s.town), h("span", {className:"sp1"}), h("span", {className:"mono faint"}, ms.length + " machine" + (ms.length === 1 ? "" : "s"))),
            h(Table, {rows:ms, onRow:(r) => MP.go("machines/" + r.id), empty:"No machines at this site", cols:[
              {t:"Machine", r:(r) => h("div", null, h("div", {style:{color:"var(--ink)"}}, r.M.name), h("div", {className:"faint", style:{fontSize:11.5}}, r.M.type))},
              {t:"Serial", r:(r) => h("span", {className:"mono"}, r.id)},
              {t:"Installed", r:(r) => r.m.installed ? h("span", {className:"mono dim"}, U.dmy(r.m.installed)) : h(Badge, {k:"acc"}, "Installing")},
              {t:"Warranty", r:(r) => warrantyBadge(r.m)},
              {t:"Last service", r:(r) => r.last ? h("span", {className:"mono dim"}, ymd(r.last.date)) : h("span", {className:"faint"}, "None")},
              {t:"Open", num:true, r:(r) => r.open ? h(Badge, {k:"warn"}, r.open) : h("span", {className:"faint"}, "0")}
            ]})); })),
        h(Card, {title:"Service history", sub:jobs.length + " jobs, newest first", icon:"history"},
          h(Table, {rows:hist, onRow:(j) => MP.go("jobs/" + j.id), cols:[
            {t:"Date", r:(j) => h("span", {className:"mono"}, ymd(j.date))},
            {t:"Job", r:(j) => h(Ref, {r:{type:"job", id:j.id}})},
            {t:"Machine", r:(j) => j.machine ? h("div", null, h("div", null, Q.model(j.machine).name), h("div", {className:"mono faint"}, j.machine)) : h("span", {className:"faint"}, j.type === "Site measurement" ? "Site measurement" : "Not recorded")},
            {t:"Issue", r:(j) => h("span", {className:"dim"}, trunc(j.issue, 70))},
            {t:"Engineer", r:(j) => j.eng ? Q.eng(j.eng).name : h("span", {className:"faint"}, "Unassigned")},
            {t:"Status", r:(j) => h(Status, {j})}
          ]}), moreHist),
        h(Card, {title:"Activity", sub:"Complete history: people, AI, engineers, QuickBooks", icon:"activity"},
          h(Table, {rows:acts, empty:"No activity yet", cols:[
            {t:"When", r:(a) => h("span", {className:"mono", style:{whiteSpace:"nowrap"}}, ymd(a.d) + " " + a.t)},
            {t:"What", r:(a) => h("span", {style:{color:"var(--ink)"}}, a.text)},
            {t:"Who", r:(a) => h("span", {className:"dim"}, a.who)},
            {t:"Record", r:(a) => a.job ? h(Ref, {r:{type:"job", id:a.job}}) : a.ref ? h(Ref, {r:a.ref}) : null}
          ]}), moreAct)),
      h("div", {className:"as-stack"},
        h(Card, {title:"Contacts", icon:"team"}, h("div", {className:"cb"}, c.contacts.map((x, i) => h("div", {key:i, style:{padding:"8px 0", borderTop:i ? "1px solid var(--border)" : null}},
          h("div", {style:{color:"var(--ink)", fontWeight:500}}, x.name), h("div", {className:"dim", style:{fontSize:12}}, x.role),
          h("div", {className:"row wrap", style:{gap:"2px 14px", marginTop:4}}, h("span", {className:"mono"}, x.phone), h("span", {className:"dim", style:{fontSize:12}}, x.email)))))),
        h(Card, {title:"Quotes", sub:"Read-only from QuickBooks", icon:"qb", right:h(Badge, {k:"line"}, "From QuickBooks")},
          h(Table, {rows:quotes, empty:"No quotes in QuickBooks", cols:[
            {t:"Quote", r:(q) => h("span", {className:"mono", style:{color:"var(--ink)"}}, q.id)},
            {t:"Title", r:(q) => h("div", null, h("div", null, q.title), h("div", {className:"faint", style:{fontSize:11.5}}, ymd(q.d)))},
            {t:"Value", num:true, r:(q) => U.eur(q.value)},
            {t:"Status", r:(q) => h(Badge, {k:q.status === "Accepted" ? "ok" : "line"}, q.status)}
          ]})),
        h(Card, {title:"Documents", sub:"Reports, photos, quotes, manuals and certificates", icon:"documents"}, h(DocList, {docs, n:10})))));
}

/* ======================================================================
   DOCUMENTS
   ====================================================================== */
const KINDS = ["Photo","Label photo","Service report","Signature","Manual","Certificate","Warranty","Credit note","Quote"];
const LINK_ORDER = ["job","warranty","part","machine","cust","quote","model"];
const LINK_NAME = {job:"Job", warranty:"Warranty claim", part:"Part", machine:"Machine", cust:"Customer", quote:"Quote", model:"Model"};
const LINK_TYPE = {job:"job", warranty:"warranty", part:"part", machine:"machine", cust:"customer", quote:"quote"};
const linkList = (d) => LINK_ORDER.filter(k => d.links && d.links[k] != null).map(k => ({k, id:d.links[k]})).concat(Object.keys(d.links || {}).filter(k => LINK_ORDER.indexOf(k) < 0 && d.links[k] != null).map(k => ({k, id:d.links[k]})));
function linkLabel(l){ if (l.k === "model") return MODELS[l.id] ? MODELS[l.id].name : l.id; if (l.k === "machine") return l.id; if (l.k === "job") return "Job #" + l.id; return Q.label({type:LINK_TYPE[l.k] || l.k, id:l.id}); }
function linkGo(l){ return l.k === "model" ? "machines?model=" + l.id : MP.link({type:LINK_TYPE[l.k] || l.k, id:l.id}); }
function LinkChips(p){ return h("div", {className:"row wrap", style:{gap:5}}, linkList(p.d).map(l => h(Chip, {key:l.k, title:LINK_NAME[l.k] || l.k, onClick:(e) => { e.stopPropagation(); MP.go(linkGo(l)); }}, linkLabel(l)))); }

MP.pages.documents = {
  title:(r) => r.parts[0] ? (Q.doc(r.parts[0]) ? trunc(Q.doc(r.parts[0]).name, 48) : "Document") : "Documents",
  sub:(r) => r.parts[0] ? (Q.doc(r.parts[0]) ? Q.doc(r.parts[0]).kind + " · " + r.parts[0] : "") : "Everything captured in the field, attached to the right records",
  render:(route, S) => route.parts[0] ? h(DocPage, {key:route.parts[0], S, id:route.parts[0]}) : h(DocLibrary, {key:route.query.kind || "", S, kind:route.query.kind})
};
function DocLibrary(p){
  const S = p.S, [kind, setKind] = useState(KINDS.indexOf(p.kind) >= 0 ? p.kind : "all"), [q, setQ] = useState(""), [n, setN] = useState(60);
  const all = Object.values(S.docs).sort((a, b) => byNewest(a, b) || b.id.localeCompare(a.id));
  const unlinked = all.filter(d => !linkList(d).length).length;
  const today = all.filter(d => d.d === U.TODAY).length;
  const s = q.trim().toLowerCase();
  const rows = all.filter(d => kind === "all" || d.kind === kind)
    .filter(d => !s || (d.name + " " + d.id + " " + d.by + " " + linkList(d).map(linkLabel).join(" ")).toLowerCase().indexOf(s) >= 0);
  return h("div", {className:"g", style:{gap:14}},
    h(Card, {style:{padding:"4px 20px 16px"}},
      h("div", {className:"as-stats", style:{margin:"0 -20px"}},
        stat("Files", num(all.length)), stat("Captured today", today),
        stat("Linked records", num(all.reduce((x, d) => x + linkList(d).length, 0))),
        stat("Unlinked files", unlinked, unlinked ? "var(--bad)" : "var(--ok)"))),
    h(Card, {title:"Library", sub:"Newest first. Every file is attached to at least one record.", icon:"documents",
        right:h(Search, {value:q, onChange:(v) => { setQ(v); setN(60); }, placeholder:"Name, record or person"})},
      h("div", {className:"cb as-kinds"},
        h(Chip, {k:kind === "all" ? "acc" : null, onClick:() => { setKind("all"); setN(60); }}, "All ", h("span", {className:"mono faint"}, all.length)),
        KINDS.map(k => h(Chip, {key:k, k:kind === k ? "acc" : null, onClick:() => { setKind(k); setN(60); }}, k, " ", h("span", {className:"mono faint"}, all.filter(d => d.kind === k).length)))),
      h(Table, {rows:rows.slice(0, n), onRow:(d) => MP.go("documents/" + d.id), empty:"No documents match", emptyIcon:"documents", cols:[
        {t:"Document", r:(d) => h("div", {style:{minWidth:200}}, h("div", {style:{color:"var(--ink)"}}, d.name), h("div", {className:"mono faint"}, d.id + (d.size ? " · " + d.size : "")))},
        {t:"Kind", r:(d) => h(Badge, {k:KIND_TONE[d.kind] || ""}, d.kind)},
        {t:"Date", r:(d) => h("span", {className:"mono", style:{whiteSpace:"nowrap"}}, ymd(d.d) + (d.t ? " " + d.t : ""))},
        {t:"By", r:(d) => h("span", {className:"dim"}, d.by)},
        {t:"Linked to", r:(d) => h(LinkChips, {d})}
      ]}),
      rows.length > n ? h("div", {style:{padding:"8px 18px 14px"}}, h(Btn, {sm:true, k:"ghost", onClick:() => setN(n + 60)}, "Show more (" + (rows.length - n) + " left)")) : null));
}
function barcode(v){
  let x = parseInt(U.hash(v), 16); const out = []; let pos = 0;
  for (let i = 0; i < 44 && pos < 230; i++){ x = Math.imul(x ^ (i * 2654435761), 1597334677) >>> 0; const w = 1 + x % 3; if (i % 2 === 0) out.push(h("rect", {key:i, x:pos, y:0, width:w, height:30, fill:"currentColor"})); pos += w + 1; }
  return h("svg", {width:"100%", height:30, viewBox:"0 0 232 30", preserveAspectRatio:"none", "aria-hidden":"true", style:{display:"block", marginTop:10}}, out);
}
function signaturePath(v){
  const r = U.rng(parseInt(U.hash(v), 16)); let x = 18, y = 58, d = "M" + x + " " + y;
  for (let i = 0; i < 7; i++){ const nx = x + 26 + r() * 22, ny = 36 + r() * 44; d += " C" + (x + 10).toFixed(1) + " " + (y - 40 * r()).toFixed(1) + " " + (nx - 14).toFixed(1) + " " + (ny + 34 * r()).toFixed(1) + " " + nx.toFixed(1) + " " + ny.toFixed(1); x = nx; y = ny; }
  return d + " M30 84 C90 78 170 80 " + Math.min(300, x + 10).toFixed(0) + " 76";
}
function Preview(p){
  const S = p.S, d = p.d, L = d.links || {}, j = L.job ? Q.job(L.job) : null, m = L.machine ? Q.mach(L.machine) : null;
  const where = [m ? MODELS[m.model].name + ", " + m.id : null, L.cust && Q.cust(L.cust) ? Q.cust(L.cust).name : null].filter(Boolean).join(" · ");
  if (d.kind === "Label photo"){
    const P = Q.part(L.part) || {};
    return h("div", {className:"as-prev as-photo"}, h("div", {className:"as-frame"}),
      h("div", {className:"as-label", role:"img", "aria-label":"Parts label " + (P.sku || "")},
        h("div", {className:"sm"}, "MYERS FOOD MACHINERY · STORES"), h("div", {className:"sku"}, P.sku || L.part), h("div", {style:{fontSize:13, fontWeight:600, marginTop:2}}, P.name || ""),
        h("div", {className:"row", style:{gap:10, marginTop:8, fontFamily:"var(--mono)", fontSize:11}}, h("span", null, "LOC " + (P.bin || "")), h("span", {className:"sp1"}), h("span", null, "QTY 1")), barcode(P.sku || d.id)),
      h("div", {className:"as-cap"}, "Captured by " + d.by + (d.t ? " at " + d.t : "") + ". Part number, description and stores location read from the label."));
  }
  if (d.kind === "Photo") return h("div", {className:"as-prev as-photo"},
    h("div", {style:{textAlign:"center", color:"var(--dim)"}}, h(Icon, {n:"camera", s:42, w:1.2}), h("div", {className:"mono faint", style:{marginTop:8}}, "JPEG · " + (d.size || "2.3 MB"))),
    h("div", {className:"as-cap"}, h("div", {style:{color:"var(--ink)", fontWeight:500}}, d.name), where ? h("div", {className:"dim"}, where) : null));
  if (d.kind === "Signature"){
    const who = j && j.signoff ? j.signoff.name : (/\(([^)]+)\)/.exec(d.name) || [])[1] || "Customer";
    return h("div", {className:"as-prev"}, h("div", {className:"as-paper"},
      h("div", {className:"mono faint"}, "CUSTOMER SIGN-OFF" + (j ? " · JOB #" + j.id : "")),
      h("svg", {viewBox:"0 0 320 100", width:"100%", height:110, role:"img", "aria-label":"Signature of " + who, style:{display:"block", margin:"10px 0 4px", color:"var(--ink)"}},
        h("path", {d:signaturePath(d.id), fill:"none", stroke:"currentColor", strokeWidth:1.8, strokeLinecap:"round", strokeLinejoin:"round"})),
      h("div", {style:{borderTop:"1px solid var(--border-strong)", paddingTop:6}}, h("b", {style:{color:"var(--ink)"}}, who), h("span", {className:"dim"}, (j && j.signoff && j.signoff.t ? ", " + j.signoff.t : "") + ", " + U.dLong(d.d)))));
  }
  if (d.kind === "Service report" && j){
    return h("div", {className:"as-prev"}, h("div", {className:"as-paper"},
      h("div", {className:"mono faint"}, "MYERS FOOD MACHINERY · SERVICE REPORT"),
      h("h4", {style:{marginTop:6}}, "Job #" + j.id + ", " + Q.cust(j.cust).name),
      h("div", {className:"dim"}, (j.machine ? Q.model(j.machine).name + ", " + j.machine + ". " : "") + U.dLong(j.date) + (j.eng ? ". Engineer: " + Q.eng(j.eng).name : "")),
      h("div", {className:"sec", style:{marginTop:14}}, "Reported"), h("div", null, j.reported || j.issue),
      h("div", {className:"sec", style:{marginTop:12}}, "Work done"), h("div", {style:{color:"var(--ink)"}}, j.report ? j.report.summary : j.resolution || "Report not yet written."),
      h("div", {className:"sec", style:{marginTop:12}}, "Parts"), h("div", null, j.parts.length ? j.parts.map(x => x.sku + " " + Q.part(x.sku).name + " × " + x.qty).join("; ") : "No parts used."),
      h("div", {className:"sec", style:{marginTop:12}}, "Customer confirmation"), h("div", null, j.signoff ? "Signed by " + j.signoff.name : "Not recorded")));
  }
  if (d.kind === "Quote"){
    const q = S.quotes.find(x => x.id === L.quote);
    return h("div", {className:"as-prev"}, h("div", {className:"as-paper"},
      h("div", {className:"mono faint"}, "QUOTE · READ FROM QUICKBOOKS"),
      h("h4", {style:{marginTop:6}}, q ? q.id + " " + q.title : d.name),
      q ? h(KV, {style:{marginTop:12}, rows:[["Customer", Q.cust(q.cust).name],["Value", U.eur(q.value)],["Status", q.status],["Date", U.dLong(q.d)]]}) : null,
      h("div", {className:"faint", style:{marginTop:12, fontSize:12}}, "Quotes are created and edited in QuickBooks. Pulse shows them next to the customer's service history.")));
  }
  return h("div", {className:"as-prev"}, h("div", {className:"as-paper"},
    h("div", {className:"mono faint"}, d.kind.toUpperCase() + " · PDF"),
    h("h4", {style:{marginTop:6}}, d.name), where ? h("div", {className:"dim"}, where) : null,
    [92, 100, 84, 97, 60, 0, 88, 94, 72].map((w, i) => w ? h("div", {key:i, className:"ln", style:{width:w + "%"}}) : h("div", {key:i, style:{height:10}}))));
}
function DocPage(p){
  const S = p.S, d = Q.doc(p.id);
  if (!d) return h(NotFound, {what:"Document", id:p.id, back:["Documents", "documents"]});
  const links = linkList(d);
  return h("div", {className:"g", style:{gap:14}},
    h("div", null, h("button", {type:"button", className:"ref as-back", onClick:() => MP.go("documents")}, h(Icon, {n:"back", s:13}), "All documents")),
    h("div", {className:"as-split"},
      h(Card, {title:d.name, sub:d.kind + ", " + U.dLong(d.d) + (d.t ? " at " + d.t : ""), icon:"documents", right:h(Badge, {k:KIND_TONE[d.kind] || ""}, d.kind)}, h(Preview, {S, d})),
      h("div", {className:"as-stack"},
        h(Card, {title:"Details", icon:"documents"}, h("div", {className:"cb"}, h(KV, {rows:[
          ["Document", h("span", {className:"mono"}, d.id)],
          ["Kind", d.kind],
          [/Imported|QuickBooks/.test(d.by) ? "Source" : "Captured by", d.by || "Pulse"],
          ["Date", U.dLong(d.d) + (d.t ? ", " + d.t : "")],
          ["Size", d.size || "Not recorded"]
        ]}))),
        h(Card, {title:"Linked records (" + links.length + ")", sub:links.length ? "Filed automatically when it was captured" : "Not linked", icon:"link"},
          h("div", {className:"cb"}, links.length ? links.map((l, i) => h("div", {key:l.k, className:"as-rel-row"},
            h("span", {className:"mono faint", style:{width:108, flex:"none"}}, (LINK_NAME[l.k] || l.k).toUpperCase()),
            h("button", {type:"button", className:"ref", onClick:() => MP.go(linkGo(l))}, linkLabel(l)),
            l.k !== "model" && LINK_TYPE[l.k] ? h("span", {className:"faint", style:{fontSize:11.5, marginLeft:"auto", textAlign:"right"}}, Q.subLabel({type:LINK_TYPE[l.k], id:l.id})) : null))
            : h("div", {className:"faint"}, "This file is not attached to any record."),
            h("div", {style:{marginTop:12}}, h(Chip, {k:"acc", icon:"knowledge", onClick:() => MP.go("knowledge/doc/" + d.id)}, "Open in knowledge graph")))))));
}

/* ======================================================================
   KNOWLEDGE / ONTOLOGY
   ====================================================================== */
const K_TYPES = ["customer","site","machine","job","engineer","part","location","warranty","doc","qb","quote"];
const K_LABEL = {customer:"CUSTOMER", site:"SITE", machine:"MACHINE", job:"JOB", engineer:"ENGINEER", part:"PART", location:"STOCK LOCATION", warranty:"WARRANTY CLAIM", doc:"DOCUMENT", qb:"QUICKBOOKS", quote:"QUOTE"};
const K_COLOR = {customer:"var(--accent)", site:"var(--dim)", machine:"var(--ok)", job:"var(--warn)", engineer:"var(--accent)", part:"var(--ok)", location:"var(--dim)", warranty:"var(--bad)", doc:"var(--faint)", qb:"var(--ok)", quote:"var(--dim)"};
function kExists(S, r){
  const id = r.id;
  switch (r.type){
    case "customer": return !!S.customers[id]; case "site": return !!S.sites[id]; case "machine": return !!S.machines[id]; case "job": return !!S.jobs[id];
    case "engineer": return !!S.engineers[id]; case "part": return !!S.parts[id]; case "location": return !!S.locations[id]; case "warranty": return !!S.claims[id];
    case "doc": return !!S.docs[id]; case "qb": return !!(S.jobs[id] && S.jobs[id].qb); case "quote": return !!S.quotes.find(q => q.id === id);
  }
  return false;
}
/* MP.q.graph plus the relations it leaves out (job → customer, suggested engineer and likely part, machine → customer and parts,
   documents → everything they are filed under, QuickBooks and quotes → customer). */
function graphFor(S, r){
  const g = Q.graph(r), root = g.root, N = [root], E = [];
  const add = (type, id, rel) => { if (!id) return; const key = type + ":" + id; if (key === root.key || !kExists(S, {type, id})) return;
    if (!N.find(n => n.key === key)) N.push({type, id, key, label:Q.label({type, id}), sub:Q.subLabel({type, id})});
    if (!E.find(e => e.to === key)) E.push({from:root.key, to:key, rel}); };
  g.edges.forEach(e => { const n = g.nodes.find(x => x.key === e.to); if (n) add(n.type, n.id, e.rel); });
  if (r.type === "job"){ const j = Q.job(r.id); add("customer", j.cust, "for customer");
    const rq = j.requestId ? Q.request(j.requestId) : null; if (!j.eng && rq && rq.ai && rq.ai.eng) add("engineer", rq.ai.eng, "suggested");
    (j.possibleParts || []).forEach(sku => { if (!j.parts.some(x => x.sku === sku)) add("part", sku, "likely part"); }); }
  if (r.type === "machine"){ const m = Q.mach(r.id); add("customer", m.cust, "owned by"); const seen = new Set(); Q.machineParts(r.id).forEach(x => { if (seen.size < 3 && !seen.has(x.sku)){ seen.add(x.sku); add("part", x.sku, "part fitted"); } }); }
  if (r.type === "doc"){ const L = Q.doc(r.id).links || {}; add("job", L.job, "attached to"); add("warranty", L.warranty, "evidence for"); add("part", L.part, "shows part"); add("machine", L.machine, "machine"); add("customer", L.cust, "customer"); add("quote", L.quote, "quote"); }
  if (r.type === "qb"){ const j = Q.job(r.id); add("job", j.id, "invoice for"); add("customer", j.cust, "billed to"); }
  if (r.type === "quote"){ const q = S.quotes.find(x => x.id === r.id); add("customer", q.cust, "quote for"); }
  if (r.type === "part"){ const u = (usageIndex(S)[r.id] || []).slice(0, 4); u.forEach(x => add("job", x.job, "used on")); }
  const nb = N.slice(1, 13);
  return {root, nodes:[root].concat(nb), edges:E.filter(e => nb.some(n => n.key === e.to)), more:Math.max(0, N.length - 13)};
}
function kSummary(S, r){
  const t = r.type, id = r.id;
  if (t === "customer"){ const c = Q.cust(id), st = Q.custStats(id); return [["QuickBooks", h("span", {className:"mono"}, c.qb)],["Sites", st.sites],["Machines", st.machines],["Open jobs", st.open],["Jobs YTD", st.ytd],["Main contact", (c.contacts[0] || {}).name]]; }
  if (t === "site"){ const s = Q.site(id); return [["Customer", h(Ref, {r:{type:"customer", id:s.cust}})],["Town", s.town],["Machines", Object.values(S.machines).filter(m => m.site === id).length]]; }
  if (t === "machine"){ const m = Q.mach(id); return [["Model", MODELS[m.model].name],["Serial", h("span", {className:"mono"}, id)],["Customer", h(Ref, {r:{type:"customer", id:m.cust}})],["Installed", m.installed ? U.dLong(m.installed) : "Installing"],["Warranty", m.warrantyEnd ? (Q.warrantyActive(id) ? "Active" : "Expired") : "Not started"],["Jobs on record", Q.machineJobs(id).length]]; }
  if (t === "job"){ const j = Q.job(id); return [["Status", h(Status, {j})],["Customer", h(Ref, {r:{type:"customer", id:j.cust}})],["Machine", j.machine ? h("span", {className:"mono"}, j.machine) : "Not recorded"],["Engineer", j.eng ? Q.eng(j.eng).name : "Unassigned"],["Date", ymd(j.date) + (j.start ? " " + j.start : "")],["Priority", h(Prio, {p:j.prio})],["Issue", j.issue]]; }
  if (t === "engineer"){ const e = Q.eng(id), n = Q.engNow(id); return [["Van", locName(e.van)],["Now", n.status + (n.where ? ", " + n.where : "")],["Jobs today", n.done.length + " of " + n.jobs.length + " complete"],["Skills", e.skills.join(", ")],["Certified", e.certs.join(", ")]]; }
  if (t === "part"){ const st = pState(S, id); return [["Name", st.P.name],["Bin", h("span", {className:"mono"}, st.P.bin)],["Total stock", st.tot],["Reorder level", st.P.reorder],["State", h(Badge, {k:st.tone}, st.label)]]; }
  if (t === "location"){ const l = Q.loc(id), ls = locStats(S, id); return [["Kind", l.kind === "van" ? "Van stock" : "Main Stores"],["Held by", l.eng ? Q.eng(l.eng).name : S.staff.pat.name + ", Stores"],["Lines", ls.lines],["Stock value", U.eur(ls.val)],l.kind === "van" ? ["Below minimum", ls.below.length ? ls.below.join(", ") : "None"] : null]; }
  if (t === "warranty"){ const c = Q.claim(id); return [["Stage", c.stage],["Status", c.status],["Manufacturer", c.mfr],["Value", U.eur(c.value)],["Submitted", c.submitted ? ymd(c.submitted) : "Not yet"]]; }
  if (t === "doc"){ const d = Q.doc(id); return [["Kind", d.kind],["Date", ymd(d.d) + (d.t ? " " + d.t : "")],["By", d.by],["Size", d.size || ""]]; }
  if (t === "qb"){ const j = Q.job(id); return [["Reference", h("span", {className:"mono"}, j.qb.ref)],["Status", h(Status, {s:j.qb.status})],["Value", U.eur(j.qb.value)],["Invoice", j.qb.invoiceNo || "Not yet"],["Job", h(Ref, {r:{type:"job", id}})]]; }
  if (t === "quote"){ const q = S.quotes.find(x => x.id === id); return [["Title", q.title],["Value", U.eur(q.value)],["Status", q.status],["Date", ymd(q.d)]]; }
  return [];
}
const THREAD = [["customer","glenmore","Glenmore Foods"],["site","glenmore-naas","Naas site"],["machine","LP200-48023","LabelPro LP200"],["job","2491","Job #2491"],["engineer","sean","Sean Murphy"],["part","MX-44721","Part MX-44721"],["location","van04","Van 04"]];
function Thread(p){
  const S = p.S, j = Q.job("2491");
  const fitted = j.parts.find(x => x.sku === "MX-44721");
  const links = [["has site", false],["has machine", false],["service job", false],
    j.eng === "sean" ? ["assigned", false] : ["suggested", true],
    fitted ? ["fitted", false] : ["likely part", true],
    fitted && fitted.from === "van04" ? ["taken from", false] : ["stocked in", false]];
  return h(Card, null,
    h("div", {className:"row wrap", style:{padding:"12px 16px 0", gap:8}}, h("b", {style:{fontSize:13}}, "Golden thread"), h("span", {className:"dim", style:{fontSize:12}}, "The Glenmore breakdown, from customer to van shelf. Dashed links are proposals waiting on a person or the scan.")),
    h("div", {className:"as-thread", role:"list"}, THREAD.map((t, i) => h(F, {key:t[1]},
      i ? h("span", {className:"as-tl" + (links[i - 1][1] ? " pend" : ""), "aria-hidden":"true"}, links[i - 1][0], h("i")) : null,
      h("button", {type:"button", role:"listitem", className:"as-tn" + (p.focus === t[0] + ":" + t[1] ? " on" : ""), onClick:() => MP.go("knowledge/" + t[0] + "/" + t[1]), title:"Focus the graph on " + t[2]}, t[2])))));
}
function GraphCanvas(p){
  const g = p.g, W = 840, H = 470, cx = W / 2, cy = H / 2, nb = g.nodes.slice(1);
  const pos = {}; pos[g.root.key] = [cx, cy];
  nb.forEach((n, i) => { const a = -Math.PI / 2 + (i / Math.max(1, nb.length)) * Math.PI * 2, k = nb.length > 7 && i % 2 ? .7 : 1;
    pos[n.key] = [Math.round(cx + Math.cos(a) * 310 * k), Math.round(cy + Math.sin(a) * 180 * k)]; });
  const nav = (n, root) => root ? MP.go(MP.link(n)) : MP.go("knowledge/" + n.type + "/" + n.id);
  return h("svg", {viewBox:"0 0 " + W + " " + H, className:"as-graph", role:"group", "aria-label":"Knowledge graph centred on " + g.root.label},
    g.edges.map(e => { const a = pos[e.from], b = pos[e.to]; if (!a || !b) return null; const mx = a[0] + (b[0] - a[0]) * .56, my = a[1] + (b[1] - a[1]) * .56;
      return h("g", {key:g.root.key + ">" + e.to, className:"as-edge"},
        h("line", {x1:a[0], y1:a[1], x2:b[0], y2:b[1], stroke:"var(--border-strong)", strokeWidth:1.2, strokeDasharray:/suggested|likely/.test(e.rel) ? "4 4" : null}),
        h("text", {x:mx, y:my + 3, textAnchor:"middle", className:"as-rel"}, e.rel)); }),
    g.nodes.map(n => { const root = n.key === g.root.key, xy = pos[n.key], hh = root ? 60 : 46;
      return h("g", {key:n.key, className:"as-node" + (root ? " root" : ""), style:{transform:"translate(" + xy[0] + "px," + xy[1] + "px)"}, role:"button", tabIndex:0,
          "aria-label":(root ? "Open record: " : "Focus on ") + K_LABEL[n.type].toLowerCase() + " " + n.label,
          onClick:() => nav(n, root), onKeyDown:(e) => { if (e.key === "Enter" || e.key === " "){ e.preventDefault(); nav(n, root); } }},
        h("title", null, n.label + (n.sub ? ", " + n.sub : "")),
        h("rect", {x:-80, y:-hh / 2, width:160, height:hh, rx:12}),
        h("text", {x:-68, y:-hh / 2 + 15, className:"as-nt", fill:K_COLOR[n.type]}, K_LABEL[n.type]),
        h("text", {x:-68, y:-hh / 2 + 29, className:"as-nn"}, trunc(n.label, 22)),
        h("text", {x:-68, y:-hh / 2 + 41, className:"as-ns"}, trunc(n.sub, 27)),
        root ? h("text", {x:-68, y:hh / 2 - 7, className:"as-open"}, "Open record →") : null); }));
}
function Knowledge(p){
  const S = p.S, r = p.r;
  if (K_TYPES.indexOf(r.type) < 0 || !kExists(S, r)) return h(NotFound, {what:"Record", id:r.type + "/" + r.id, back:["Knowledge", "knowledge"]});
  const g = graphFor(S, r), root = g.root;
  return h("div", {className:"g", style:{gap:14}},
    h(Thread, {S, focus:root.key}),
    h("div", {className:"as-kg"},
      h(Card, {title:"Relationships of " + root.label, sub:"Click a node to move the focus. Every node is a live Pulse record.", icon:"knowledge",
          right:h(Btn, {sm:true, k:"ghost", icon:"back", onClick:() => window.history.back()}, "Back")},
        h("div", {style:{padding:"0 10px 12px"}}, h(GraphCanvas, {g})),
        g.more ? h("div", {className:"faint", style:{fontSize:12, padding:"0 18px 14px"}}, g.more + " more relations are on the record itself.") : null),
      h("div", {className:"as-stack"},
        h(Card, {pad:true},
          h("div", {className:"mono", style:{color:K_COLOR[root.type], fontSize:10.5, letterSpacing:".08em"}}, K_LABEL[root.type]),
          h("div", {style:{fontSize:17, fontWeight:600, color:"var(--ink)", marginTop:4, overflowWrap:"anywhere"}}, root.label),
          root.sub ? h("div", {className:"dim", style:{marginTop:2}}, root.sub) : null,
          h(KV, {rows:kSummary(S, r), style:{marginTop:14}}),
          h("div", {style:{marginTop:14}}, h(Btn, {k:"pri", sm:true, icon:"arrow", onClick:() => MP.go(MP.link(r))}, "Open record"))),
        h(Card, {title:"Relationships", sub:g.edges.length + " linked record" + (g.edges.length === 1 ? "" : "s"), icon:"link"},
          h("div", {className:"cb"}, g.edges.length ? g.edges.map(e => { const n = g.nodes.find(x => x.key === e.to);
            return h("div", {key:e.to, className:"as-rel-row"},
              h("span", {className:"mono faint", style:{width:92, flex:"none", fontSize:10.5}}, e.rel),
              h("button", {type:"button", className:"ref", style:{minWidth:0, flex:1}, onClick:() => MP.go("knowledge/" + n.type + "/" + n.id), title:"Focus the graph here"},
                h("span", {style:{overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}, n.label)),
              h(Btn, {sm:true, k:"ghost", icon:"arrow", "aria-label":"Open " + n.label, title:"Open record", onClick:() => MP.go(MP.link(n))})); })
            : h("div", {className:"faint"}, "No linked records."))))));
}
MP.pages.knowledge = {
  title:"Knowledge",
  sub:"How Myers records connect. Every node opens a real record.",
  render:(route, S) => h(Knowledge, {S, r:route.parts.length >= 2 ? {type:route.parts[0], id:route.parts.slice(1).join("/")} : {type:"job", id:"2491"}})
};
})();
