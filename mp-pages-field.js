/* Myers Pulse: Engineers (roster + profile) and Subsistence (today, day view, monthly report, exceptions).
   Every figure comes from MP.q (engNow, subDay, subTimeline, subMonth, track), so rule changes recalculate everywhere. */
(function(){
"use strict";
const MP = window.MP, h = MP.h, F = MP.F, U = MP.util, Q = MP.q, A = MP.act, UI = MP.ui, G = MP.geo, R = window.React;
const {Card, Badge, Status, Btn, Av, Ref, Chip, Icon, IrelandMap, Table, Tabs, KV, Empty, Timeline} = UI;
const TODAY = U.TODAY;

/* ---------- actions this file adds ---------- */
/* Export is read-only, but it belongs in the audit trail. */
if (!A.logSubExport) A.logSubExport = (kind, n, month) => {
  const S = MP.get(); MP.tick();
  MP.log(Q.staffName(), "person", "Exported subsistence " + (kind === "csv" ? "CSV" : "report") + " for " + month + " (" + n + " row" + (n === 1 ? "" : "s") + ")", []);
  MP.toast(kind === "csv" ? "CSV exported" : "Report exported", "For payroll and accounts. Pulse does not run payroll.", "ok");
  MP.commit();
};

/* ---------- styles (one tag, fx- prefix) ---------- */
const CSS = `
.fx-stats{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));border-top:1px solid var(--border)}
.fx-stat{padding:12px 16px;border-left:1px solid var(--border);min-width:0}
.fx-stat:first-child{border-left:0}
.fx-stat .l{font-family:var(--mono);font-size:10px;letter-spacing:.08em;color:var(--faint);text-transform:uppercase;white-space:nowrap}
.fx-stat .v{font-size:19px;font-weight:600;letter-spacing:-.01em;margin-top:4px;font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fx-stat .s{font-size:11.5px;color:var(--faint);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fx-split{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(320px,1fr);gap:14px;align-items:start}
.fx-split2{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.25fr);gap:14px;align-items:start}
.fx-rep{display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:14px;align-items:start}
.fx-prog{position:relative;height:14px;min-width:140px}
.fx-prog .fill{position:absolute;left:0;top:5px;height:4px;width:100%;border-radius:4px;background:var(--accent);transform-origin:left;transition:transform .25s var(--ease)}
.fx-prog .tick{position:absolute;top:1px;bottom:1px;width:1px;background:var(--border-strong)}
.fx-mx th,.fx-mx td{text-align:center}
.fx-mx th:first-child,.fx-mx td:first-child{text-align:left}
.fx-mx td.on,.fx-mx th.on{background:var(--accent-faint)}
.fx-res{display:grid;grid-template-columns:170px 1fr;gap:12px;align-items:baseline;padding:11px 0;border-top:1px solid var(--border)}
.fx-res:first-child{border-top:0;padding-top:2px}
.fx-res .l{font-family:var(--mono);font-size:10.5px;letter-spacing:.08em;color:var(--faint);text-transform:uppercase}
.fx-res .v{font-size:19px;font-weight:600;letter-spacing:-.01em;font-variant-numeric:tabular-nums}
.fx-flag{border:1px solid var(--border-strong);border-radius:12px;padding:11px 13px;margin-top:10px;background:var(--warn-soft)}
.fx-flag.done{background:var(--surface-faint)}
.fx-exc{display:grid;grid-template-columns:200px minmax(0,1fr) auto;gap:18px;padding:16px 18px;align-items:start}
.fx-exc.done{opacity:.55}
.fx-exc .k{font-family:var(--mono);font-size:11px;letter-spacing:.08em;font-weight:600}
.fx-exc .q{font-size:11px;color:var(--faint);font-family:var(--mono);letter-spacing:.06em;text-transform:uppercase;margin:10px 0 2px}
.fx-cb{width:15px;height:15px;accent-color:var(--accent);cursor:pointer;margin:0;vertical-align:middle}
.fx-list{list-style:none;margin:0;padding:0}
.fx-list li{display:flex;align-items:center;gap:10px;padding:8px 0;border-top:1px solid var(--border)}
.fx-list li:first-child{border-top:0}
.fx-filters{display:grid;grid-template-columns:repeat(4,minmax(150px,1fr));gap:10px;padding:0 18px 14px}
@media (max-width:1200px){.fx-stats{grid-template-columns:repeat(4,minmax(0,1fr))}.fx-stat:nth-child(5){border-left:0}.fx-stat:nth-child(n+5){border-top:1px solid var(--border)}}
@media (max-width:1100px){.fx-split,.fx-split2,.fx-rep{grid-template-columns:1fr}.fx-exc{grid-template-columns:1fr;gap:10px}}
@media (max-width:720px){.fx-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.fx-stat:nth-child(odd){border-left:0}.fx-stat:nth-child(n+3){border-top:1px solid var(--border)}.fx-filters{grid-template-columns:1fr 1fr}.fx-res{grid-template-columns:1fr;gap:2px}}
`;
try { if (document.getElementById && !document.getElementById("fx-css")){ const st = document.createElement("style"); st.id = "fx-css"; st.textContent = CSS; document.head.appendChild(st); } } catch(e){}

/* ---------- helpers ---------- */
const MFRS = ["LabelPro","Ishida","MetalCheck","Sealtek","VacuPak","SliceMaster"];
const MFR_SKILL = {LabelPro:["Label systems"], Ishida:["Weighing","Checkweighers"], MetalCheck:["Metal detection"], Sealtek:["Tray sealing"], VacuPak:["Vacuum packing"], SliceMaster:["Slicing"]};
const ENG_TONE = () => MP.ENG_TONE || {};
const nd = (s) => String(s == null ? "" : s).replace(/\s*[–—]\s*/g, " to ");     // engine text uses an en dash for ranges
const longDate = (k) => U.WDAY[U.weekday(k)] + " " + U.fromKey(k).getDate() + " " + U.MONTH[U.fromKey(k).getMonth()];
const engList = (S) => Object.values(S.engineers);
const bandsOf = (S) => S.rules.subsistence.bands.slice().sort((a, b) => a.min - b.min);
const bandShort = (S, b) => b == null ? "None" : "Band " + (b + 1) + " (" + S.rules.subsistence.bands[b].min + "h+)";
const bandBig = (S, b) => b == null ? "None" : S.rules.subsistence.bands[b].min + "+ hours";
const SUB_TONE = {"Auto-calculated":"ok", "Reviewed":"ok", "Confirmed":"ok", "In progress":"acc", "Review required":"warn", "Inside zone":"line", "Below threshold":"line", "On leave":"line", "No data":"line"};
const retText = (r) => r.inProgress ? "Running" : r.ret == null ? "" : U.hm(r.ret) + (r.flags.some(f => f.type === "noReturn") ? " last seen" : r.flags.some(f => f.type === "manual") ? " manual" : "");
function subState(n){
  if (n.status === "On leave") return ["On leave", "line"];
  const s = n.sub; if (!s || s.exit == null) return ["Inside zone", ""];
  if (s.band != null) return ["Qualifying", "ok"];
  if (s.inProgress) return ["Running", "acc"];
  return ["Below threshold", "line"];
}
function engDates(S, eng){ return Object.keys(S.days).filter(k => k.split("|")[0] === eng).map(k => k.split("|")[1]).sort(); }
function trackPts(tr){
  const pts = [];
  const push = (p) => { const l = pts[pts.length - 1]; if (!l || l[0] !== p[0] || l[1] !== p[1]) pts.push(p); };
  tr.segs.forEach(s => { push(s.p0); push(s.p1); });
  return pts;
}
function projection(S, rec){
  if (!rec.inProgress || rec.exit == null) return [];
  return bandsOf(S).filter(b => rec.away < b.min * 60).map(b => ({b, at:rec.exit + b.min * 60}));
}
function stat(l, v, s, color){ return h("div", {className:"fx-stat"}, h("div", {className:"l"}, l), h("div", {className:"v", style:{color:color || "var(--ink)"}}, v), s ? h("div", {className:"s"}, s) : null); }
function Prog(p){
  const S = p.S, bands = bandsOf(S), max = (bands[bands.length - 1].min + 1) * 60, v = Math.max(0, Math.min(1, p.away / max));
  return h("div", {className:"fx-prog", role:"img", "aria-label":U.dur(p.away) + " of " + bands.map(b => b.min + "h").join(" and ")},
    bands.map(b => h("i", {key:b.min, className:"tick", style:{left:(b.min * 60 / max * 100) + "%"}, title:b.min + "h threshold"})),
    h("i", {className:"fill", style:{transform:"scaleX(" + v + ")", background:p.band != null ? "var(--ok)" : "var(--accent)", opacity:p.away ? 1 : 0}}));
}

/* ======================================================================
   ENGINEERS
   ====================================================================== */
MP.pages.engineers = {
  title:(r, S) => r.parts[0] && S.engineers[r.parts[0]] ? S.engineers[r.parts[0]].name : "Engineers",
  sub:(r, S) => { const E = r.parts[0] && S.engineers[r.parts[0]];
    if (E) return Q.loc(E.van).name + " · " + E.phone;
    const working = engList(S).filter(e => ["At base","Travelling","On site"].indexOf(Q.engNow(e.id).status) >= 0).length;
    return engList(S).length + " engineers · " + working + " working today · skills, certifications, vans and availability"; },
  render:(route, S) => route.parts[0] ? h(Profile, {S, id:route.parts[0]}) : h(Roster, {S, route})
};

function Roster(p){
  const S = p.S, [cert, setCert] = R.useState(p.route.query.cert || "");
  const all = engList(S).map(e => Q.engNow(e.id));
  const rows = all.filter(n => !cert || Q.eng(n.id).certs.indexOf(cert) >= 0);
  const low = Q.lowStock().filter(l => l.kind === "van");
  const count = (st) => all.filter(n => n.status === st).length;
  const out = all.filter(n => n.sub && n.sub.exit != null && (n.sub.inProgress)).length;
  return h("div", {className:"g", style:{gap:14}},
    h("div", {className:"row wrap", style:{gap:"8px 10px"}},
      h("span", {className:"dim", style:{fontSize:12}}, "Certified on"),
      h(Chip, {k:!cert ? "acc" : null, onClick:() => setCert("")}, "Any"),
      MFRS.map(m => h(Chip, {key:m, k:cert === m ? "acc" : null, onClick:() => setCert(cert === m ? "" : m)}, m)),
      h("span", {className:"sp1"}),
      h("span", {className:"mono faint"}, count("On site") + " on site · " + count("Travelling") + " travelling · " + count("At base") + " at base · " + out + " outside the zone now")),
    h(Card, {title:"Roster", sub:"Live at " + U.hm(S.clock) + ". Click an engineer for his day, van stock and subsistence." + (cert ? " Showing " + cert + " certified only." : ""), icon:"engineers"},
      h(Table, {onRow:(n) => MP.go("engineers/" + n.id), rows, empty:"No engineer holds that certification",
        cols:[
          {t:"Engineer", r:(n) => { const E = Q.eng(n.id); return h("div", {className:"row", style:{gap:9}}, h(Av, {e:E, s:28}), h("div", null, h("div", {style:{color:"var(--ink)", fontWeight:500, whiteSpace:"nowrap"}}, E.name), h("div", {className:"mono faint"}, E.phone))); }},
          {t:"Van", r:(n) => { const E = Q.eng(n.id), lo = low.filter(l => l.loc === E.van).length;
            return h("div", null, h(Ref, {r:{type:"location", id:E.van}}), lo ? h("div", {style:{marginTop:3}}, h(Badge, {k:"warn", title:"Lines below the van minimum"}, lo + " below min")) : null); }},
          {t:"Status", r:(n) => h(Badge, {k:ENG_TONE()[n.status] || ""}, n.status)},
          {t:"Where", r:(n) => n.status === "On leave" ? h("span", {className:"faint"}, "Annual leave") : h("div", {style:{whiteSpace:"nowrap"}}, n.where || "Not signed on", n.status === "Travelling" && n.eta ? h("div", {className:"mono faint"}, "ETA " + U.hm(n.eta)) : null)},
          {t:"Current or next job", r:(n) => n.job ? h("div", null, h(Ref, {r:{type:"job", id:n.job.id}}), h("div", {className:"dim", style:{fontSize:12}}, Q.cust(n.job.cust).name))
            : n.next ? h("div", null, h("span", {className:"mono faint"}, "Next " + (n.next.start || "") + " "), h(Ref, {r:{type:"job", id:n.next.id}}), h("div", {className:"dim", style:{fontSize:12}}, Q.cust(n.next.cust).name))
            : h("span", {className:"faint"}, n.status === "On leave" ? "" : "No more jobs today")},
          {t:"Jobs", num:true, r:(n) => h("span", {className:"mono"}, n.done.length + "/" + n.jobs.length)},
          {t:"Travel", num:true, r:(n) => h("span", {className:"mono"}, n.travel ? U.dur(n.travel) : "0m")},
          {t:"Outside zone", num:true, r:(n) => h("span", {className:"mono", style:{color:n.sub && n.sub.exit != null ? "var(--ink)" : "var(--faint)"}}, n.sub && n.sub.exit != null ? U.dur(n.away) : "0m")},
          {t:"Subsistence", r:(n) => { const s = subState(n); return h(Badge, {k:s[1]}, s[0]); }},
          {t:"Skills", r:(n) => h("div", {className:"row wrap", style:{gap:4, maxWidth:280}}, Q.eng(n.id).skills.map(s => h("span", {key:s, className:"b line"}, s)))}
        ]})),
    h("div", {className:"fx-split2"}, h(RosterMap, {S, rows}), h(CertMatrix, {S, cert, setCert})));
}

function RosterMap(p){
  const S = p.S, ns = p.rows;
  const points = [{pos:G.BASE.pos, kind:"base", label:"Myers"}]
    .concat(ns.filter(n => n.status === "Travelling" && n.place).map(n => ({pos:Q.placePos(n.place), r:4, color:"var(--dim)", title:"Destination: " + Q.placeName(n.place)})))
    .concat(ns.filter(n => ["Travelling","On site","At base"].indexOf(n.status) >= 0).map(n => ({pos:n.pos, kind:"eng", label:Q.eng(n.id).initials, color:Q.eng(n.id).tint, pulse:n.status === "Travelling", title:n.name + ", " + n.status + (n.where ? ", " + n.where : ""), onClick:() => MP.go("engineers/" + n.id)})));
  const lines = ns.filter(n => n.status === "Travelling" && n.place).map(n => ({pts:[n.pos, Q.placePos(n.place)], dash:true, color:Q.eng(n.id).tint, op:.8}));
  return h(Card, {title:"Where they are", sub:"Dashed line: heading to. Shaded circle: " + S.rules.subsistence.radius + " km qualifying zone.", icon:"subsistence"},
    h("div", {style:{padding:"0 12px 12px"}}, h(IrelandMap, {points, lines, zone:{pos:G.BASE.pos, km:S.rules.subsistence.radius}, h:470, maxH:470})));
}

function CertMatrix(p){
  const S = p.S, engs = engList(S);
  const cover = (m) => engs.filter(e => e.certs.indexOf(m) >= 0 && !e.leave);
  return h(Card, {title:"Certification matrix", sub:"Who can be sent to which manufacturer. Click a column to filter the roster.", icon:"rules"},
    h("div", {className:"tbl-wrap"}, h("table", {className:"tbl fx-mx"},
      h("thead", null, h("tr", null, h("th", null, "Engineer"), MFRS.map(m => h("th", {key:m, className:p.cert === m ? "on" : ""},
        h("button", {type:"button", className:"ref", style:{color:p.cert === m ? "var(--accent)" : "var(--faint)", fontSize:11}, onClick:() => p.setCert(p.cert === m ? "" : m)}, m))))),
      h("tbody", null,
        engs.map(e => h("tr", {key:e.id},
          h("td", null, h("div", {className:"row", style:{gap:8}}, h(Av, {e, s:22}), h(Ref, {r:{type:"engineer", id:e.id}}), e.leave ? h(Badge, {k:"line"}, "Leave") : null)),
          MFRS.map(m => { const c = e.certs.indexOf(m) >= 0, sk = !c && MFR_SKILL[m].some(s => e.skills.indexOf(s) >= 0);
            return h("td", {key:m, className:p.cert === m ? "on" : "", title:c ? e.name + ": " + m + " certified" : sk ? e.name + ": skilled, not certified" : ""},
              c ? h(Icon, {n:"check", s:15, style:{color:e.leave ? "var(--faint)" : "var(--accent)"}}) : sk ? h("span", {className:"faint", style:{fontSize:11}}, "Skill") : h("span", {className:"faint"}, "")); }))),
        h("tr", null, h("td", {className:"dim", style:{fontSize:12}}, "Certified and working today"),
          MFRS.map(m => { const c = cover(m); return h("td", {key:m, className:p.cert === m ? "on" : "", title:c.map(e => e.name).join(", ")},
            h("span", {className:"mono", style:{color:c.length <= 1 ? "var(--warn)" : "var(--ink)"}}, c.length)); }))))),
    h("div", {className:"faint", style:{padding:"4px 18px 14px", fontSize:12}},
      MFRS.filter(m => cover(m).length <= 1).map(m => m + ": " + (cover(m).length ? "only " + cover(m)[0].name : "nobody") + (engs.some(e => e.leave && e.certs.indexOf(m) >= 0) ? " (" + engs.filter(e => e.leave && e.certs.indexOf(m) >= 0).map(e => e.name.split(" ")[0]).join(", ") + " on leave)" : "")).join(". ") + (MFRS.some(m => cover(m).length <= 1) ? ". Single cover, plan around it." : "")));
}

/* ---------- engineer profile ---------- */
function currentLine(n){
  if (n.status === "On leave") return "Annual leave. Location is not tracked.";
  if (n.status === "Travelling") return (n.place === "base" ? "Heading back to Myers base" : "Travelling to " + Q.placeName(n.place)) + (n.eta ? ", ETA " + U.hm(n.eta) : "") + (n.job ? ", Job #" + n.job.id : "");
  if (n.status === "On site") return "On site at " + Q.placeName(n.place) + (n.job ? ", Job #" + n.job.id : "") + (n.since != null ? ", since " + U.hm(n.since) : "");
  if (n.status === "At base") return "At Myers base" + (n.next ? ". Next: " + n.next.start + " " + Q.cust(n.next.cust).name : n.jobs.length ? ". Today’s jobs are done." : ".");
  if (n.status === "Signed off") return "Signed off for the day.";
  return "Not signed on yet.";
}
function Profile(p){
  const S = p.S, E = S.engineers[p.id];
  if (!E) return h(Card, {pad:true}, h(Empty, {title:"No engineer with that id", icon:"engineers"}, h(Btn, {sm:true, onClick:() => MP.go("engineers")}, "All engineers")));
  const n = Q.engNow(E.id), sub = n.sub, leave = n.status === "On leave";
  const label = (["At base","Travelling","On site"].indexOf(n.status) >= 0 ? "ACTIVE" : n.status.toUpperCase());
  const proj = sub ? projection(S, sub) : [];
  const subVal = leave ? ["ON LEAVE", "Not tracked", null]
    : sub && sub.band != null ? ["QUALIFIES", U.eur2(sub.allowance) + ", " + bandShort(S, sub.band).toLowerCase() + (sub.inProgress ? ", running" : ""), "var(--ok)"]
    : sub && sub.inProgress ? ["NOT YET", proj.length ? "Qualifies at " + U.hm(proj[0].at) : "", null]
    : sub && sub.exit != null ? ["NOT QUALIFYING", "Back after " + U.dur(sub.away), null]
    : ["NOT YET", "Inside the zone", null];
  const doneN = n.done.length;
  return h("div", {className:"g", style:{gap:14}},
    h("div", null, h(Btn, {k:"ghost", sm:true, icon:"back", onClick:() => MP.go("engineers")}, "All engineers")),
    h(Card, null,
      h("div", {className:"row wrap", style:{padding:"16px 18px", gap:"12px 16px", alignItems:"center"}},
        h(Av, {e:E, s:46}),
        h("div", {style:{minWidth:0, flex:"1 1 320px"}},
          h("div", {className:"mono faint", style:{letterSpacing:".08em"}}, E.name.toUpperCase() + " · " + label),
          h("div", {className:"row wrap", style:{gap:10, marginTop:2}}, h("span", {style:{fontSize:20, fontWeight:600, letterSpacing:"-.01em"}}, E.name), h(Badge, {k:ENG_TONE()[n.status] || ""}, n.status)),
          h("div", {style:{marginTop:4, color:"var(--body)"}}, h("span", {className:"dim"}, "Current: "), currentLine(n),
            n.job ? h(F, null, " ", h(Ref, {r:{type:"job", id:n.job.id}}, "Open job")) : null)),
        h("div", {className:"row wrap", style:{gap:8}},
          h(Btn, {sm:true, k:"ghost", icon:"chat", onClick:() => MP.openAI("Where is " + E.name.split(" ")[0] + "?")}, "Ask Pulse"),
          h(Btn, {sm:true, icon:"subsistence", onClick:() => MP.go("subsistence/day/" + E.id + "/" + TODAY)}, "Subsistence today"),
          h(Btn, {sm:true, k:"pri", icon:"field", onClick:() => MP.go("field"), title:E.id === "sean" ? "The engineer web app, as Sean sees it" : "The demo engineer app is signed in as Sean Murphy"}, E.id === "sean" ? "Open his app" : "Engineer app"))),
      h("div", {className:"fx-stats"},
        stat("Jobs", n.jobs.length, n.jobs.length ? n.jobs.map(j => "#" + j.id).join(", ") : "None today"),
        stat("Complete", doneN, n.jobs.length ? (n.jobs.length - doneN) + " to go" : ""),
        stat("Travel", U.dur(n.travel), "Today"),
        stat("On site", U.dur(n.onsite), n.status === "On site" ? "Clock running" : ""),
        stat("Outside base zone", leave ? "-" : sub && sub.exit != null ? U.dur(sub.away) : "0m", leave ? "" : sub && sub.exit != null ? "Since " + U.hm(sub.exit) + (sub.inProgress ? ", running" : sub.ret != null ? ", back " + U.hm(sub.ret) : "") : "Inside " + S.rules.subsistence.radius + " km"),
        stat("Subsistence", subVal[0], subVal[1], subVal[2]),
        stat("Parts used", n.parts, n.parts ? "Scanned or recorded today" : "None today"))),
    h("div", {className:"fx-split"},
      h("div", {className:"g", style:{gap:14}},
        h(Schedule, {S, n}),
        h(TodayTimeline, {S, E}),
        h(RecentDays, {S, E})),
      h("div", {className:"g", style:{gap:14}},
        h(DayMap, {S, eng:E.id, d:TODAY, title:"Today’s track", h:330}),
        h(VanStock, {S, E}),
        h(Skills, {S, E}),
        h(Contact, {S, E, n}))));
}
function Schedule(p){
  const n = p.n;
  return h(Card, {title:"Today’s schedule", sub:n.jobs.length ? n.done.length + " of " + n.jobs.length + " complete" : "", icon:"jobs"},
    h(Table, {onRow:(j) => MP.go("jobs/" + j.id), rows:n.jobs, empty:n.status === "On leave" ? "On annual leave" : "No jobs booked today",
      cols:[
        {t:"Time", w:60, r:(j) => h("span", {className:"mono"}, j.start || "")},
        {t:"Job", w:70, r:(j) => h("span", {className:"mono", style:{color:"var(--ink)"}}, "#" + j.id)},
        {t:"Customer", r:(j) => h("div", null, h("div", {style:{color:"var(--ink)"}}, Q.cust(j.cust).name), h("div", {className:"faint", style:{fontSize:11.5}}, Q.site(j.site).town.split(",")[0] + " · " + (j.machine ? Q.model(j.machine).name : j.type)))},
        {t:"Type", r:(j) => h("span", {className:"dim"}, j.type + (j.billable && j.type !== "Site measurement" ? "" : ", non-billable"))},
        {t:"Status", r:(j) => h(Status, {j})}
      ]}));
}
/* Map the engine's subsistence timeline kinds onto the shared timeline styles. */
const TL_KIND = {zone:"zone", stop:"engineer", job:"ai", move:"", warn:"warn", muted:"system"};
function tlItems(S, eng, d){
  const rec = Q.subDay(eng, d);
  const items = Q.subTimeline(eng, d).map(e => {
    let text = e.text, sub = e.sub;
    if (e.kind === "stop") { text = "Arrived " + e.sub; const st = Object.values(S.sites).filter(s => Q.placeName(s.id) === e.sub); sub = st.length === 1 ? st[0].name + ", " + st[0].town : ""; }
    if (e.job && /Job #/.test(e.text)){ const pre = e.text.split("Job #")[0]; text = h(F, null, pre, h(Ref, {r:{type:"job", id:e.job}}, "Job #" + e.job)); }
    if (e.nonBillable && e.text === "Site measurement"){ text = h(F, null, "Site measurement ", h(Badge, {k:"warn", style:{marginLeft:4}}, "NON-BILLABLE VISIT"));
      const j = Q.job(e.job); sub = (j ? Q.cust(j.cust).name + ". " : "") + "Time outside the zone still counts, whatever the billing."; }
    else if (e.nonBillable) sub = "Non-billable. Still counts toward subsistence.";
    if (e.kind === "warn") text = nd(text);
    return {t:U.hm(e.t), text, sub:nd(sub), kind:TL_KIND[e.kind] != null ? TL_KIND[e.kind] : ""};
  });
  if (rec.inProgress) items.push({t:U.hm(S.clock), text:"Now: still outside the qualifying zone", sub:U.dur(rec.away) + " away so far", kind:"ai"});
  return items;
}
function TodayTimeline(p){
  const S = p.S, items = tlItems(S, p.E.id, TODAY);
  return h(Card, {title:"Location timeline today", sub:"From the phone’s location events and job actions", icon:"history",
      right:h(Btn, {sm:true, k:"ghost", onClick:() => MP.go("subsistence/day/" + p.E.id + "/" + TODAY)}, "Day view")},
    h("div", {className:"cb"}, items.length ? h(Timeline, {items}) : h(Empty, {title:p.E.leave ? "On annual leave" : "No location events yet"})));
}
function RecentDays(p){
  const S = p.S, E = p.E, days = engDates(S, E.id).reverse().slice(0, 10).map(d => Q.subDay(E.id, d));
  return h(Card, {title:"Last 10 days", sub:"Subsistence per day. Click a day for the full calculation.", icon:"subsistence",
      right:h(Btn, {sm:true, k:"ghost", onClick:() => MP.go("subsistence/report")}, "Monthly report")},
    h(Table, {rows:days.map(r => Object.assign({key:r.key}, r)), onRow:(r) => MP.go("subsistence/day/" + E.id + "/" + r.d), empty:"No days recorded",
      cols:[
        {t:"Date", r:(r) => h("span", {style:{whiteSpace:"nowrap"}}, U.wdm(r.d))},
        {t:"Exit", r:(r) => h("span", {className:"mono"}, r.exit != null ? U.hm(r.exit) : "")},
        {t:"Return", r:(r) => h("span", {className:"mono"}, retText(r))},
        {t:"Away", num:true, r:(r) => h("span", {className:"mono"}, r.exit != null ? U.dur(r.away) : "")},
        {t:"Allowance", num:true, r:(r) => h("span", {className:"mono", style:{color:r.band != null ? "var(--ink)" : "var(--faint)"}}, r.band != null ? U.eur2(r.allowance) : "€0.00")},
        {t:"Status", r:(r) => h(Badge, {k:SUB_TONE[r.status] || ""}, r.status)}
      ]}));
}
function VanStock(p){
  const S = p.S, E = p.E, van = E.van, st = S.stock[van] || {}, mins = S.vanMin[van] || {};
  const rows = Object.keys(Object.assign({}, st, mins)).map(sku => ({key:sku, sku, qty:st[sku] || 0, min:mins[sku] != null ? mins[sku] : null}))
    .map(r => Object.assign(r, {low:r.min != null && r.qty < r.min}))
    .sort((a, b) => (b.low - a.low) || ((b.min != null) - (a.min != null)) || a.sku.localeCompare(b.sku));
  const value = rows.reduce((n, r) => n + r.qty * (Q.part(r.sku) ? Q.part(r.sku).cost : 0), 0), lowN = rows.filter(r => r.low).length;
  return h(Card, {title:"Van stock, " + Q.loc(van).name, sub:rows.length + " lines · " + U.eur(value) + " at cost" + (lowN ? " · " + lowN + " below van minimum" : ""), icon:"parts",
      right:h(Btn, {sm:true, k:"ghost", onClick:() => MP.go("parts/location/" + van)}, "Open " + Q.loc(van).name)},
    h(Table, {rows, onRow:(r) => MP.go("parts/" + r.sku), empty:"Van is empty",
      cols:[
        {t:"Part", r:(r) => h("div", null, h(Ref, {r:{type:"part", id:r.sku}}), h("div", {className:"faint", style:{fontSize:11.5}}, Q.part(r.sku) ? Q.part(r.sku).name : ""))},
        {t:"Qty", num:true, r:(r) => h("span", {className:"mono", style:{color:r.low ? "var(--warn)" : "var(--ink)", fontWeight:r.low ? 600 : 400}}, r.qty)},
        {t:"Van min", num:true, r:(r) => h("span", {className:"mono faint"}, r.min != null ? r.min : "")},
        {t:"", r:(r) => r.low ? h(Badge, {k:"warn"}, "Below min") : null}
      ]}));
}
function Skills(p){
  const E = p.E, models = Object.keys(MP.ref.MODELS).filter(k => E.certs.indexOf(MP.ref.MODELS[k].mfr) >= 0).map(k => MP.ref.MODELS[k].name);
  return h(Card, {title:"Skills and certifications", icon:"rules"},
    h("div", {className:"cb"},
      h("div", {className:"row wrap", style:{gap:6}}, E.certs.map(c => h("span", {key:c, className:"b acc"}, c + " certified")), E.skills.map(s => h("span", {key:s, className:"b line"}, s))),
      h("div", {className:"dim", style:{fontSize:12, marginTop:10}}, "Certified models: " + (models.join(", ") || "None"))));
}
function Contact(p){
  const S = p.S, E = p.E, n = p.n, tr = S.rules.tracking;
  const inHours = S.clock >= U.toMin(tr.from) && S.clock <= U.toMin(tr.to);
  const jobs = Q.jobs(j => j.eng === E.id && j.date >= "2026-01-01" && j.date < TODAY);
  return h(Card, {title:"Contact and tracking", icon:"phone"},
    h("div", {className:"cb"}, h(KV, {rows:[
      ["Phone", h("a", {className:"ref", href:"tel:" + E.phone.replace(/\s/g, "")}, E.phone)],
      ["Van", h(Ref, {r:{type:"location", id:E.van}})],
      ["Tracking", n.status === "On leave" ? h(Badge, {k:"line"}, "Off, annual leave") : h("span", null, h(Badge, {k:inHours ? "ok" : "line"}, inHours ? "Active" : "Paused"), " " + tr.from + " to " + tr.to)],
      ["Reason", tr.reason.charAt(0) + tr.reason.slice(1).toLowerCase()],
      ["Retention", tr.retention + " days"],
      ["Jobs in 2026", jobs.length + " before today"]
    ]})));
}

/* A zoomed map of one engineer-day: track, zone, stops, last known position. */
function DayMap(p){
  const S = p.S, dayObj = Q.day(p.eng, p.d), E = Q.eng(p.eng), isToday = p.d === TODAY, R0 = S.rules.subsistence.radius;
  const tr = dayObj && !dayObj.leave ? Q.track(dayObj, isToday ? MP.now() : null) : {segs:[]};
  const pts = trackPts(tr), rec = Q.subDay(p.eng, p.d);
  const stops = rec.stops.map(s => ({pos:Q.placePos(s.place), r:4.5, color:s.billable === false ? "var(--warn)" : "var(--dim)", label:Q.placeName(s.place), title:Q.placeName(s.place) + (s.arr != null ? ", " + U.hm(s.arr) + (s.dep != null ? " to " + U.hm(s.dep) : "") : "")}));
  const points = [{pos:G.BASE.pos, kind:"base", label:"Myers"}].concat(stops);
  const lines = pts.length > 1 ? [{pts, color:E.tint, w:2, op:.95}] : [];
  if (isToday){ const n = Q.engNow(p.eng);
    if (n.status === "Travelling" && n.place){ lines.push({pts:[n.pos, Q.placePos(n.place)], dash:true, color:E.tint, op:.7}); points.push({pos:Q.placePos(n.place), r:4, color:"var(--dim)", title:"Heading to " + Q.placeName(n.place)}); }
    if (["Travelling","On site","At base"].indexOf(n.status) >= 0) points.push({pos:n.pos, kind:"eng", label:E.initials, color:E.tint, pulse:n.status === "Travelling", title:E.name + ", " + n.status});
  } else if (tr.lost && tr.last){ points.push({pos:tr.last.pos, r:6, color:"var(--warn)", label:"Last seen " + U.hm(tr.last.t), title:"Last location received " + U.hm(tr.last.t)}); }
  const fit = [G.BASE.pos].concat(pts, stops.map(s => s.pos), points.map(x => x.pos));
  return h(Card, {title:p.title || "Track", sub:R0 + " km qualifying zone shaded. " + (pts.length > 1 ? "Solid line: where he drove." : "No movement recorded."), icon:"subsistence"},
    h("div", {style:{padding:"0 12px 12px"}}, h(IrelandMap, {points, lines, zone:{pos:G.BASE.pos, km:R0}, fit, fitPad:.18, h:p.h || 340, maxH:p.h || 340, label:"Map of " + E.name + "’s route on " + longDate(p.d)})));
}

/* ======================================================================
   SUBSISTENCE
   ====================================================================== */
MP.pages.subsistence = {
  title:"Subsistence",
  sub:(r, S) => { if (r.parts[0] === "day" && S.engineers[r.parts[1]] && r.parts[2]) return S.engineers[r.parts[1]].name + " · " + longDate(r.parts[2]);
    if (r.parts[0] === "report") return "Monthly report for payroll and accounts";
    if (r.parts[0] === "exceptions") return "Flagged automatically, cleared by a manager";
    return "Calculated automatically from location events. Not payroll."; },
  render:(route, S) => h(SubPage, {S, route})
};
function exceptionsAll(S){
  return Object.values(S.days).filter(d => !d.leave).map(d => Q.subDay(d.eng, d.d)).filter(r => r.flags.length)
    .sort((a, b) => (!!a.review - !!b.review) || b.d.localeCompare(a.d) || Q.eng(a.eng).name.localeCompare(Q.eng(b.eng).name));
}
function SubPage(p){
  const S = p.S, r = p.route, tab = r.parts[0] === "report" ? "report" : r.parts[0] === "exceptions" ? "exceptions" : r.parts[0] === "day" ? "day" : "today";
  const openExc = exceptionsAll(S).filter(x => !x.review).length;
  return h("div", {className:"g", style:{gap:14}},
    h(RuleStrip, {S}),
    h("div", {className:"row wrap", style:{gap:10}},
      h(Tabs, {value:tab, onChange:(k) => MP.go(k === "today" ? "subsistence" : "subsistence/" + k), items:[["today","Today"],["report","Monthly report"],["exceptions","Exceptions", openExc]]}),
      h(Btn, {sm:true, k:"ghost", icon:"rules", onClick:() => MP.go("rules")}, "Rules"),
      h("span", {className:"sp1"}),
      tab === "day" ? h(Btn, {sm:true, k:"ghost", icon:"back", onClick:() => MP.go("subsistence")}, "Back to today") : null),
    tab === "report" ? h(Report, {S}) : tab === "exceptions" ? h(Exceptions, {S}) : tab === "day" ? h(DayView, {S, eng:r.parts[1], d:r.parts[2]}) : h(SubToday, {S}));
}
function RuleStrip(p){
  const S = p.S, r = S.rules.subsistence, bands = bandsOf(S);
  const txt = "Base: " + G.BASE.name + " · Qualifying radius " + r.radius + " km · " + bands.map((b, i) => "Band " + (i + 1) + " ≥" + b.min + "h " + U.eur2(b.amount)).join(" · ");
  return h(Card, {style:{padding:"11px 16px"}},
    h("div", {className:"row wrap", style:{gap:"6px 12px"}},
      h(Icon, {n:"subsistence", s:15, style:{color:"var(--accent)"}}),
      h("span", {style:{color:"var(--ink)", fontWeight:500}}, txt),
      h(Badge, {k:"acc", title:r.note}, "CONFIGURABLE RULE"),
      h("span", {className:"sp1"}),
      h("span", {className:"faint", style:{fontSize:12}}, "Illustrative figures from the meeting, confirm with payroll before go-live.")));
}

/* ----- today ----- */
function SubToday(p){
  const S = p.S;
  const rows = engList(S).map(e => { const rec = Q.subDay(e.id, TODAY), n = Q.engNow(e.id); return Object.assign({key:e.id, n}, rec); });
  const out = rows.filter(r => r.inProgress).length, q = rows.filter(r => r.band != null), total = q.reduce((n, r) => n + r.allowance, 0);
  const bands = bandsOf(S);
  return h(Card, {title:"Today, Monday 28 September", icon:"clock",
      sub:out + " outside the zone now · " + q.length + " qualifying so far · " + U.eur2(total) + " so far. Times move with the live clock (" + U.hm(S.clock) + ").",
      right:h(Btn, {sm:true, k:"ghost", onClick:() => MP.go("subsistence/day/sean/" + TODAY)}, "Sean’s day")},
    h(Table, {rows, onRow:(r) => MP.go("subsistence/day/" + r.eng + "/" + TODAY),
      cols:[
        {t:"Engineer", r:(r) => h("div", {className:"row", style:{gap:8}}, h(Av, {e:r.eng, s:24}), h("div", null, h("div", {style:{color:"var(--ink)", whiteSpace:"nowrap"}}, Q.eng(r.eng).name), h("div", {className:"faint", style:{fontSize:11.5, whiteSpace:"nowrap"}}, r.n.status === "On leave" ? "Annual leave" : r.n.where || r.n.status)))},
        {t:"Exit", r:(r) => h("span", {className:"mono"}, r.exit != null ? U.hm(r.exit) : h("span", {className:"faint"}, r.status === "On leave" ? "" : "Not left"))},
        {t:"Return", r:(r) => h("span", {className:"mono"}, r.inProgress ? h("span", {className:"faint"}, "Not yet") : retText(r))},
        {t:"Time away", r:(r) => r.exit == null ? h("span", {className:"faint mono"}, "0m") : h("span", {className:"row", style:{gap:6}}, r.inProgress ? h("i", {className:"live", style:{background:"var(--accent)"}}) : null,
          h("span", {className:"mono", style:{color:"var(--ink)"}}, U.dur(r.away)), r.inProgress ? h("span", {className:"faint", style:{fontSize:11.5}}, "running") : null)},
        {t:h("span", null, "Toward " + bands.map(b => b.min + "h").join(" / ")), r:(r) => r.status === "On leave" ? null : h(Prog, {S, away:r.away, band:r.band})},
        {t:"Band", r:(r) => h("span", {className:r.band != null ? "" : "faint"}, bandShort(S, r.band))},
        {t:"Allowance", num:true, r:(r) => h("span", {className:"mono", style:{color:r.band != null ? "var(--ok)" : "var(--faint)"}}, U.eur2(r.allowance))},
        {t:"Status", r:(r) => { const pr = projection(S, r); return h("div", null, h(Badge, {k:SUB_TONE[r.status] || ""}, r.status),
          r.inProgress && pr.length ? h("div", {className:"faint", style:{fontSize:11.5, marginTop:3, whiteSpace:"nowrap"}}, "Qualifies at " + U.hm(pr[0].at)) : null); }}
      ]}));
}

/* ----- one engineer-day: the showcase ----- */
function DayView(p){
  const S = p.S, E = S.engineers[p.eng], d = p.d && /^\d{4}-\d{2}-\d{2}$/.test(p.d) ? p.d : TODAY;
  if (!E) return h(Card, {pad:true}, h(Empty, {title:"No engineer with that id", icon:"engineers"}));
  const dates = engDates(S, E.id), prev = dates.filter(x => x < d).pop(), next = dates.filter(x => x > d)[0];
  const rec = Q.subDay(E.id, d), dayObj = Q.day(E.id, d), items = dayObj ? tlItems(S, E.id, d) : [];
  const header = h(Card, {style:{padding:"14px 18px"}},
    h("div", {className:"row wrap", style:{gap:"10px 14px"}},
      h(Av, {e:E, s:36}),
      h("div", {style:{minWidth:0}}, h("div", {style:{fontSize:18, fontWeight:600, letterSpacing:"-.01em"}}, E.name + " · " + longDate(d)),
        h("div", {className:"dim", style:{fontSize:12}}, Q.loc(E.van).name + (d === TODAY ? " · live, clock " + U.hm(S.clock) : "") + " · ", h(Ref, {r:{type:"engineer", id:E.id}}, "Engineer profile"))),
      h("span", {className:"sp1"}),
      h("label", {className:"sr", style:{position:"absolute", width:1, height:1, overflow:"hidden", clip:"rect(0 0 0 0)"}, htmlFor:"fx-eng"}, "Engineer"),
      h("select", {id:"fx-eng", className:"sel", style:{width:190, height:32}, value:E.id, onChange:(e) => MP.go("subsistence/day/" + e.target.value + "/" + d)},
        engList(S).map(x => h("option", {key:x.id, value:x.id}, x.name))),
      h(Btn, {sm:true, icon:"back", disabled:!prev, onClick:() => MP.go("subsistence/day/" + E.id + "/" + prev), "aria-label":"Previous day with data", title:prev ? U.wdm(prev) : "No earlier day"}, prev ? U.wdm(prev) : "Previous"),
      h(Btn, {sm:true, disabled:!next, onClick:() => MP.go("subsistence/day/" + E.id + "/" + next), "aria-label":"Next day with data", title:next ? U.wdm(next) : "No later day"}, next ? U.wdm(next) : "Next", h(Icon, {n:"arrow", s:13})),
      d !== TODAY ? h(Btn, {sm:true, k:"ghost", onClick:() => MP.go("subsistence/day/" + E.id + "/" + TODAY)}, "Today") : null));
  if (!dayObj || rec.status === "No data") return h("div", {className:"g", style:{gap:14}}, header, h(Card, {pad:true}, h(Empty, {title:"No location data for " + E.name + " on " + longDate(d), icon:"subsistence"}, "Not working that day, or before tracking started.")));
  if (rec.status === "On leave") return h("div", {className:"g", style:{gap:14}}, header, h(Card, {pad:true}, h(Empty, {title:E.name + " is on annual leave", icon:"subsistence"}, "Location is not tracked on leave days. No allowance.")));
  return h("div", {className:"g", style:{gap:14}}, header,
    h("div", {className:"fx-split"},
      h("div", {className:"g", style:{gap:14}},
        h(Card, {title:"Timeline", sub:"Every zone crossing, stop and job, as recorded", icon:"history"},
          h("div", {className:"cb"}, items.length ? h(Timeline, {items}) : h(Empty, {title:"No events yet"}),
            rec.stops.some(s => s.billable === false) ? h("div", {className:"faint", style:{fontSize:12, marginTop:4}}, "Non-billable visits still count. Subsistence is based on time outside the zone, not on what was charged.") : null)),
        h(Calc, {S, rec})),
      h("div", {className:"g", style:{gap:14}},
        h(Result, {S, rec, E}),
        h(DayMap, {S, eng:E.id, d, title:"Track and qualifying zone", h:340}))));
}
function Result(p){
  const S = p.S, rec = p.rec, E = p.E, proj = projection(S, rec);
  const statusTxt = rec.status === "Auto-calculated" ? "AUTO-CALCULATED" : rec.status.toUpperCase();
  const actionable = !rec.inProgress && rec.exit != null && !rec.review;
  const manual = rec.flags.some(f => f.type === "manual");
  return h(Card, {title:"Result", sub:rec.inProgress ? "Provisional until he is back inside the zone" : rec.provisional ? "Held until a manager reviews the flags" : "Calculated from the location events", icon:"check"},
    h("div", {className:"cb"},
      h("div", {className:"fx-res"}, h("div", {className:"l"}, rec.inProgress ? "Away so far" : "Total away"),
        h("div", {className:"v row", style:{gap:8}}, rec.inProgress ? h("i", {className:"live", style:{background:"var(--accent)"}}) : null, rec.exit != null ? U.dur(rec.away) : "0m")),
      h("div", {className:"fx-res"}, h("div", {className:"l"}, "Qualifying band"), h("div", {className:"v"}, rec.band != null ? bandBig(S, rec.band).toUpperCase() : h("span", {className:"dim"}, rec.inProgress ? "NOT YET" : "NONE"))),
      h("div", {className:"fx-res"}, h("div", {className:"l"}, "Calculated allowance"), h("div", {className:"v", style:{color:rec.band != null ? "var(--ok)" : "var(--dim)"}}, U.eur2(rec.allowance),
        rec.provisional && rec.band != null ? h("span", {className:"faint", style:{fontSize:12, fontWeight:400, marginLeft:8}}, "held") : null)),
      h("div", {className:"fx-res"}, h("div", {className:"l"}, "Status"), h("div", null, h(Badge, {k:SUB_TONE[rec.status] || ""}, statusTxt),
        rec.review ? h("div", {className:"faint", style:{fontSize:12, marginTop:4}}, rec.review.status + " by " + rec.review.by + ", " + rec.review.t) : null)),
      rec.inProgress && proj.length ? h("div", {className:"fx-flag", style:{background:"var(--accent-faint)"}},
        h("div", {style:{color:"var(--ink)", fontWeight:500}}, proj.map(x => "Qualifies at " + x.b.min + "h (" + U.hm(x.at) + ")").join(" · ")),
        h("div", {className:"dim", style:{fontSize:12, marginTop:2}}, "If he is still outside the zone then. The timer stops when he crosses back in.")) : null,
      rec.flags.map((f, i) => h("div", {key:i, className:"fx-flag" + (rec.review ? " done" : "")},
        h("div", {className:"row"}, h(Icon, {n:"alert", s:14, style:{color:"var(--warn)"}}), h("b", {style:{fontSize:12.5}}, f.title.toUpperCase()), h("span", {className:"sp1"}), rec.review ? h(Badge, {k:"ok"}, rec.review.status) : h(Badge, {k:"warn"}, f.type === "manual" ? "Manager confirmation required" : "Review required")),
        h("div", {style:{marginTop:4, color:"var(--body)"}}, nd(f.text)), f.note ? h("div", {className:"dim", style:{fontSize:12, marginTop:2}}, "Note: “" + f.note + "”") : null,
        h("div", {className:"dim", style:{fontSize:12, marginTop:4}}, why(S, rec, f)))),
      actionable ? h("div", {className:"row wrap", style:{gap:8, marginTop:14}},
        rec.flags.length ? h(Btn, {k:"pri", icon:"check", onClick:() => A.markReviewed(rec.key)}, manual ? "Confirm manual return" : "Mark reviewed")
          : h(Btn, {icon:"check", onClick:() => A.markReviewed(rec.key)}, "Mark reviewed"),
        h("span", {className:"faint", style:{fontSize:12}}, rec.flags.length ? "Clears it from Needs Attention and releases the allowance to the report." : "Optional for clean days. Recorded in Activity.")) : null));
}
function why(S, rec, f){
  const amt = U.eur2(rec.allowance), band = rec.band != null ? "band " + (rec.band + 1) + ", " + amt : "below the " + bandsOf(S)[0].min + "h threshold";
  if (f.type === "gap"){ const inside = rec.exit != null && rec.ret != null && f.from >= rec.exit && (f.to || f.from) <= rec.ret;
    return (rec.band != null ? "Allowance " + amt + " held until reviewed. " : "") + (inside ? "The gap sits between his exit (" + U.hm(rec.exit) + ") and return (" + U.hm(rec.ret) + "), so the " + U.dur(rec.away) + " assumes he stayed outside the zone." : "Check the missing period before the figure is used."); }
  if (f.type === "noReturn") return "Away time is counted to the last location received: " + U.dur(rec.away) + ", " + band + ". Confirm when he actually got back before it goes to payroll.";
  if (f.type === "manual") return "Away time uses the return he entered: " + U.dur(rec.away) + ", " + band + ". A manager confirms it before it counts.";
  return "Review before the figure is used.";
}
function Calc(p){
  const S = p.S, rec = p.rec, r = S.rules.subsistence, bands = bandsOf(S);
  const jobsStops = rec.stops.filter(s => s.billable !== false), nonCharge = rec.stops.filter(s => s.billable === false);
  const gaps = rec.flags.filter(f => f.type === "gap");
  const stopRow = (s, i) => h("li", {key:i},
    h("span", {className:"mono faint", style:{width:98, flex:"none"}}, U.hm(s.arr) + (s.dep != null ? " to " + U.hm(s.dep) : "")),
    h("div", {style:{minWidth:0, flex:1}}, s.job ? h(Ref, {r:{type:"job", id:s.job}}, "Job #" + s.job) : h("span", {className:"dim"}, "Customer visit"), h("span", {className:"dim"}, " · "), h(Ref, {r:{type:"site", id:s.place}}, Q.placeName(s.place)),
      s.jobType ? h("div", {className:"faint", style:{fontSize:11.5}}, s.jobType) : null),
    s.billable === false ? h(Badge, {k:"warn"}, "Non-billable") : h(Badge, {k:"line"}, s.job ? "Chargeable" : "No job linked"));
  const formula = rec.exit == null ? "He did not leave the " + r.radius + " km zone. No allowance."
    : rec.inProgress ? "Running: now (" + U.hm(S.clock) + ") minus first exit (" + U.hm(rec.exit) + ") = " + U.dur(rec.away) + "."
    : "Final return (" + U.hm(rec.ret) + ") minus first exit (" + U.hm(rec.exit) + ") = " + U.dur(rec.away) + ". " +
      (rec.band != null ? U.dur(rec.away) + " is at least " + r.bands[rec.band].min + "h, so band " + (rec.band + 1) + " applies: " + U.eur2(rec.allowance) + "." : "Below " + bands[0].min + "h, so no allowance.");
  return h(Card, {title:"How it was calculated", sub:"Same inputs, same answer. Change a rule and this recalculates.", icon:"rules"},
    h("div", {className:"cb"},
      h(KV, {rows:[
        ["First exit", rec.exit != null ? U.hm(rec.exit) + ", crossed the " + r.radius + " km line" : "Did not leave the zone"],
        ["Final return", rec.inProgress ? "Not yet, still outside" : rec.ret == null ? "None" : U.hm(rec.ret) + (rec.flags.some(f => f.type === "manual") ? ", marked manually by the engineer" : rec.flags.some(f => f.type === "noReturn") ? ", last location (no return detected)" : ", back inside the zone")],
        ["Qualifying radius", r.radius + " km around " + G.BASE.name],
        ["Band thresholds", bands.map((b, i) => "Band " + (i + 1) + " ≥" + b.min + "h " + U.eur2(b.amount)).join(", ")],
        ["Location gaps", gaps.length ? gaps.map(g => U.hm(g.from) + (g.to != null ? " to " + U.hm(g.to) + " (" + U.dur(g.to - g.from) + ")" : " onwards")).join(", ") : "None"]
      ]}),
      h("div", {style:{margin:"12px 0 4px", padding:"10px 12px", borderRadius:12, background:"var(--surface-faint)", border:"1px solid var(--border)", color:"var(--body)"}}, formula),
      h("div", {className:"sec", style:{marginTop:14}}, "Associated jobs"),
      jobsStops.length ? h("ul", {className:"fx-list"}, jobsStops.map(stopRow)) : h("div", {className:"faint", style:{fontSize:12}}, "None"),
      h("div", {className:"sec", style:{marginTop:14}}, "Non-chargeable stops"),
      nonCharge.length ? h("ul", {className:"fx-list"}, nonCharge.map(stopRow)) : h("div", {className:"faint", style:{fontSize:12}}, "None")));
}

/* ----- monthly report ----- */
const MONTHS = [["2026-09","September 2026"],["2026-08","August 2026"]];
function Report(p){
  const S = p.S, [f, setF] = R.useState({eng:"all", month:"2026-09", band:"q", review:"all"}), [sel, setSel] = R.useState({});
  const set = (k, v) => { setF(Object.assign({}, f, {[k]:v})); setSel({}); };
  const all = Q.subMonth(f.month);
  const qual = all.filter(r => r.band != null);
  const reviewN = all.filter(r => r.status === "Review required").length;
  const rows = all.filter(r => (f.eng === "all" || r.eng === f.eng)
      && (f.band === "all" ? true : f.band === "q" ? r.band != null : f.band === "none" ? r.band == null && r.exit != null : String(r.band) === f.band)
      && (f.review === "all" || (f.review === "review" ? r.status === "Review required" : f.review === "auto" ? r.status === "Auto-calculated" : f.review === "done" ? !!r.review : r.inProgress)))
    .map(r => Object.assign({key:r.key}, r));
  const selectable = rows.filter(r => !r.review && !r.inProgress);
  const selKeys = Object.keys(sel).filter(k => sel[k] && rows.some(r => r.key === k));
  const allOn = selectable.length > 0 && selectable.every(r => sel[r.key]);
  const monthLabel = (MONTHS.find(m => m[0] === f.month) || MONTHS[0])[1];
  const bands = bandsOf(S);
  const per = engList(S).map(e => { const rs = all.filter(r => r.eng === e.id); const q = rs.filter(r => r.band != null);
    return {id:e.id, days:q.length, b:bands.map((b, i) => q.filter(r => r.band === S.rules.subsistence.bands.indexOf(b)).length), amt:q.reduce((n, r) => n + r.allowance, 0), review:rs.filter(r => r.status === "Review required").length}; })
    .filter(x => x.days || x.review);
  const csv = () => {
    const esc = (v) => { v = String(v == null ? "" : v); return /[",\n]/.test(v) ? "\"" + v.replace(/"/g, "\"\"") + "\"" : v; };
    const head = ["Engineer","Date","Exit","Return","Time away","Band","Allowance","Status","Flags"];
    const lines = [head].concat(rows.map(r => [Q.eng(r.eng).name, r.d, r.exit != null ? U.hm(r.exit) : "", r.inProgress ? "" : r.ret != null ? U.hm(r.ret) : "", r.exit != null ? U.dur(r.away) : "",
      r.band != null ? "Band " + (r.band + 1) : "None", r.allowance.toFixed(2), r.status, r.flags.map(x => nd(x.title + ": " + x.text)).join("; ")]));
    download("myers-subsistence-" + f.month + ".csv", lines.map(l => l.map(esc).join(",")).join("\r\n") + "\r\n", "text/csv;charset=utf-8");
    A.logSubExport("csv", rows.length, monthLabel);
  };
  const report = () => { download("myers-subsistence-" + f.month + "-report.html", reportHtml(S, monthLabel, rows, per), "text/html;charset=utf-8"); A.logSubExport("report", rows.length, monthLabel); };
  const total = qual.reduce((n, r) => n + r.allowance, 0);
  return h("div", {className:"g", style:{gap:14}},
    h("div", {className:"row wrap", style:{gap:10}},
      h("div", null, h("div", {className:"mono faint", style:{letterSpacing:".08em"}}, "SUBSISTENCE · " + monthLabel.toUpperCase()),
        h("div", {className:"dim", style:{fontSize:12, marginTop:2}}, "Not payroll. This report goes to payroll/accounts.")),
      h("span", {className:"sp1"}),
      h(Btn, {icon:"download", onClick:csv, disabled:!rows.length}, "Export CSV"),
      h(Btn, {icon:"documents", onClick:report, disabled:!rows.length}, "Export report")),
    h("div", {className:"g", style:{gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))"}},
      h(UI.Kpi, {label:"Total allowances", value:U.eur2(total), sub:all.some(r => r.inProgress) ? "Includes today, still running" : "At current rules", onClick:() => set("band", "q")}),
      h(UI.Kpi, {label:"Qualifying days", value:qual.length, sub:bands.map((b, i) => qual.filter(r => r.band === S.rules.subsistence.bands.indexOf(b)).length + " at band " + (i + 1)).join(", "), onClick:() => setF({eng:"all", month:f.month, band:"q", review:"all"})}),
      h(UI.Kpi, {label:"Engineers", value:new Set(qual.map(r => r.eng)).size, sub:"With at least one qualifying day", onClick:() => set("eng", "all")}),
      h(UI.Kpi, {label:"Requires review", value:reviewN, color:reviewN ? "var(--warn)" : null, sub:reviewN ? "Allowance held until cleared" : "All clear", onClick:() => setF({eng:"all", month:f.month, band:"all", review:"review"})})),
    h("div", {className:"fx-rep"},
      h(Card, {title:"Days", sub:rows.length + " row" + (rows.length === 1 ? "" : "s") + (selKeys.length ? " · " + selKeys.length + " selected" : ""), icon:"subsistence",
          right:h(Btn, {sm:true, k:selKeys.length ? "pri" : null, icon:"check", disabled:!selKeys.length, onClick:() => { A.markReviewed(selKeys); setSel({}); }}, "Mark reviewed" + (selKeys.length ? " (" + selKeys.length + ")" : ""))},
        h("div", {className:"fx-filters"},
          fsel("fx-f-eng", "Employee", f.eng, (v) => set("eng", v), [["all","All engineers"]].concat(engList(S).map(e => [e.id, e.name]))),
          fsel("fx-f-month", "Month", f.month, (v) => set("month", v), MONTHS.map(m => [m[0], m[1] + (m[0] === "2026-09" ? "" : " (no data)"), m[0] !== "2026-09"])),
          fsel("fx-f-band", "Qualifying band", f.band, (v) => set("band", v), [["q","All qualifying"],["all","All days"]].concat(bands.map((b, i) => [String(S.rules.subsistence.bands.indexOf(b)), "Band " + (i + 1) + " (" + b.min + "h+)"]), [["none","Not qualifying"]])),
          fsel("fx-f-rev", "Review status", f.review, (v) => set("review", v), [["all","Any status"],["review","Requires review"],["auto","Auto-calculated"],["done","Reviewed or confirmed"],["progress","In progress"]])),
        h(Table, {rows, onRow:(r) => MP.go("subsistence/day/" + r.eng + "/" + r.d), empty:all.length ? "No days match these filters" : "No location data for " + monthLabel, emptyIcon:"subsistence",
          cols:[
            {t:h("input", {type:"checkbox", className:"fx-cb", "aria-label":"Select all rows that can be reviewed", checked:allOn, disabled:!selectable.length,
                onChange:() => { const n = {}; if (!allOn) selectable.forEach(r => n[r.key] = true); setSel(n); }}), w:34,
              r:(r) => r.review || r.inProgress ? null : h("input", {type:"checkbox", className:"fx-cb", "aria-label":"Select " + Q.eng(r.eng).name + " " + r.d, checked:!!sel[r.key],
                onClick:(e) => e.stopPropagation(), onChange:() => setSel(Object.assign({}, sel, {[r.key]:!sel[r.key]}))})},
            {t:"Engineer", r:(r) => h("div", {className:"row", style:{gap:8, whiteSpace:"nowrap"}}, h(Av, {e:r.eng, s:22}), Q.eng(r.eng).name)},
            {t:"Date", r:(r) => h("span", {style:{whiteSpace:"nowrap"}}, U.wdm(r.d))},
            {t:"Exit", r:(r) => h("span", {className:"mono"}, r.exit != null ? U.hm(r.exit) : "")},
            {t:"Return", r:(r) => h("span", {className:"mono", style:{color:r.flags.length && !r.review ? "var(--warn)" : null}}, retText(r))},
            {t:"Time away", num:true, r:(r) => h("span", {className:"mono", style:{color:"var(--ink)"}}, r.exit != null ? U.dur(r.away) : "")},
            {t:"Band", r:(r) => h("span", {className:r.band != null ? "" : "faint", style:{whiteSpace:"nowrap"}}, bandShort(S, r.band))},
            {t:"Allowance", num:true, r:(r) => h("span", {className:"mono", style:{color:r.band == null ? "var(--faint)" : r.provisional ? "var(--warn)" : "var(--ink)"}, title:r.provisional ? "Held until reviewed" : null}, U.eur2(r.allowance))},
            {t:"Status", r:(r) => h(Badge, {k:SUB_TONE[r.status] || ""}, r.status)}
          ]})),
      h(Card, {title:"Per engineer", sub:monthLabel + ", qualifying days", icon:"engineers"},
        h(Table, {rows:per.map(x => Object.assign({key:x.id}, x)), onRow:(x) => set("eng", x.id), empty:"No qualifying days",
          cols:[
            {t:"Engineer", r:(x) => h("span", {style:{whiteSpace:"nowrap", color:f.eng === x.id ? "var(--accent)" : "var(--ink)"}}, Q.eng(x.id).name)},
            {t:"Days", num:true, r:(x) => h("span", {className:"mono", title:x.b.map((n, i) => n + " at band " + (i + 1)).join(", ")}, x.days)},
            {t:"Allowance", num:true, r:(x) => h("span", {className:"mono"}, U.eur2(x.amt))},
            {t:"Review", num:true, r:(x) => x.review ? h(Badge, {k:"warn"}, x.review) : h("span", {className:"faint mono"}, "0")}
          ]}),
        h("div", {className:"row", style:{padding:"10px 18px 14px", borderTop:"1px solid var(--border)"}}, h("span", {className:"dim"}, "Month total"), h("span", {className:"sp1"}), h("b", {className:"mono", style:{fontSize:13}}, U.eur2(total))))));
}
function fsel(id, label, value, on, opts){
  return h("div", null, h("label", {className:"lbl", htmlFor:id}, label),
    h("select", {id, className:"sel", value, onChange:(e) => on(e.target.value)}, opts.map(o => h("option", {key:o[0], value:o[0], disabled:!!o[2]}, o[1]))));
}
function download(name, text, type){
  try {
    const blob = new Blob([text], {type}); const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = name; a.style.display = "none";
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1500);
  } catch(e){ MP.toast("Export failed", String(e.message || e), "warn"); }
}
function reportHtml(S, month, rows, per){
  const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const r = S.rules.subsistence, bands = bandsOf(S), q = rows.filter(x => x.band != null);
  const tr = (cells, th) => "<tr>" + cells.map(c => th ? "<th>" + esc(c) + "</th>" : "<td>" + esc(c) + "</td>").join("") + "</tr>";
  return "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><title>Myers Food Machinery, subsistence " + esc(month) + "</title><style>" +
    "body{font:13px/1.45 system-ui,sans-serif;color:#1b1f23;margin:32px;max-width:980px}h1{font-size:20px;margin:0 0 4px}h2{font-size:14px;margin:26px 0 8px}" +
    "p{margin:4px 0;color:#555}table{border-collapse:collapse;width:100%}th,td{text-align:left;padding:6px 8px;border-bottom:1px solid #ddd;font-size:12px}th{color:#666;font-weight:600}" +
    ".n{text-align:right}.tot{font-weight:600}@media print{body{margin:12mm}}</style></head><body>" +
    "<h1>Subsistence report, " + esc(month) + "</h1><p>Myers Food Machinery. Generated by Myers Pulse on " + esc(U.dmy(TODAY)) + " at " + esc(U.hm(S.clock)) + " by " + esc(Q.staffName()) + ".</p>" +
    "<p>Rules: base " + esc(G.BASE.name) + ", qualifying radius " + r.radius + " km, " + esc(bands.map((b, i) => "band " + (i + 1) + " at least " + b.min + "h " + U.eur2(b.amount)).join(", ")) + ". " + esc(r.note) + "</p>" +
    "<p><b>Not payroll.</b> This report goes to payroll/accounts. Rows marked Review required are held until a manager clears them.</p>" +
    "<h2>Per engineer</h2><table>" + tr(["Engineer","Qualifying days","Allowance","Requires review"], true) +
    per.map(x => tr([Q.eng(x.id).name, x.days, U.eur2(x.amt), x.review])).join("") +
    "<tr class=\"tot\"><td>Total</td><td>" + per.reduce((n, x) => n + x.days, 0) + "</td><td>" + esc(U.eur2(per.reduce((n, x) => n + x.amt, 0))) + "</td><td>" + per.reduce((n, x) => n + x.review, 0) + "</td></tr></table>" +
    "<h2>Days (" + rows.length + " rows, " + q.length + " qualifying, as filtered)</h2><table>" + tr(["Engineer","Date","Exit","Return","Time away","Band","Allowance","Status"], true) +
    rows.map(x => tr([Q.eng(x.eng).name, U.wdm(x.d) + " " + x.d.slice(0, 4), x.exit != null ? U.hm(x.exit) : "", retText(x), x.exit != null ? U.dur(x.away) : "", x.band != null ? "Band " + (x.band + 1) : "None", U.eur2(x.allowance), x.status])).join("") +
    "</table><script>window.addEventListener('load',function(){setTimeout(function(){window.print()},300)})<\/script></body></html>";
}

/* ----- exceptions ----- */
const EXC = {
  gap:{k:"GPS GAP", happened:(r, f) => "Location unavailable " + U.hm(f.from) + (f.to != null ? " to " + U.hm(f.to) + " (" + U.dur(f.to - f.from) + ")" : " onwards") + ". The phone stopped reporting position while he was out."},
  noReturn:{k:"NO RETURN DETECTED", happened:(r, f) => "Last location " + U.hm(f.t) + ", still outside the qualifying zone. Pulse never saw him cross back inside " + MP.get().rules.subsistence.radius + " km."},
  manual:{k:"MANUAL ADJUSTMENT", happened:(r, f) => Q.eng(r.eng).name.split(" ")[0] + " manually marked: Returned " + U.hm(f.t) + "."}
};
function Exceptions(p){
  const S = p.S, list = exceptionsAll(S), open = list.filter(r => !r.review);
  return h("div", {className:"g", style:{gap:14}},
    h("div", {className:"dim", style:{fontSize:12.5}}, open.length ? open.length + " record" + (open.length === 1 ? "" : "s") + " flagged automatically. Resolving one clears it from Needs Attention and releases the allowance to the monthly report."
      : "Nothing waiting. Every flagged day has been reviewed."),
    list.length ? h(Card, null, list.map((r, i) => r.flags.map((f, j) => { const x = EXC[f.type] || {k:f.title.toUpperCase(), happened:() => nd(f.text)}, done = !!r.review, manual = f.type === "manual";
      return h("div", {key:r.key + j, className:"fx-exc" + (done ? " done" : ""), style:{borderTop:i || j ? "1px solid var(--border)" : 0}},
        h("div", null, h("div", {className:"k", style:{color:done ? "var(--dim)" : "var(--warn)"}}, x.k),
          h("div", {className:"row", style:{gap:8, marginTop:8}}, h(Av, {e:r.eng, s:26}), h("div", null, h("div", {style:{color:"var(--ink)", fontWeight:500}}, Q.eng(r.eng).name), h("div", {className:"faint", style:{fontSize:12}}, U.wdm(r.d))))),
        h("div", {style:{minWidth:0}},
          h("div", {style:{color:"var(--ink)", fontWeight:500}}, nd(f.text)),
          h("div", {className:"q"}, "What happened"), h("div", {style:{color:"var(--body)"}}, x.happened(r, f), f.note ? " Note: “" + f.note + "”" : ""),
          h("div", {className:"q"}, "Why it matters"), h("div", {style:{color:"var(--body)"}}, why(S, r, f)),
          done ? h("div", {className:"faint", style:{fontSize:12, marginTop:8}}, r.review.status + " by " + r.review.by + ", " + r.review.t) : null),
        h("div", {className:"col", style:{gap:8, alignItems:"stretch", minWidth:170}},
          done ? h(Badge, {k:"ok"}, r.review.status) : h(Badge, {k:"warn"}, manual ? "Manager confirmation required" : "Review required"),
          h(Btn, {sm:true, onClick:() => MP.go("subsistence/day/" + r.eng + "/" + r.d)}, "Review day"),
          done ? null : h(Btn, {sm:true, k:"pri", icon:"check", onClick:() => A.markReviewed(r.key)}, manual ? "Confirm" : "Mark reviewed"))); })))
    : h(Card, {pad:true}, h(Empty, {title:"No exceptions this month", icon:"check"}, "GPS gaps, missing returns and manual adjustments appear here automatically.")));
}
})();
