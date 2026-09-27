/* Myers Pulse: Command Centre (home). */
(function(){
"use strict";
const MP = window.MP, h = MP.h, F = MP.F, U = MP.util, Q = MP.q, A = MP.act, UI = MP.ui;
const {Card, Kpi, Badge, Status, Prio, Btn, Av, Ref, Chip, Icon, IrelandMap, Table} = UI;

const CAT_TONE = {URGENT:"bad", APPROVAL:"acc", STOCK:"warn", WARRANTY:"", SUBSISTENCE:"warn", DATA:"line"};
MP.CAT_TONE = CAT_TONE;
const ENG_TONE = {"Travelling":"acc", "On site":"ok", "At base":"", "Signed off":"line", "On leave":"line", "Not signed on":"line"};
MP.ENG_TONE = ENG_TONE;

MP.pages.home = {
  title:"Command Centre",
  sub:(r, S) => "Monday 28 September · " + Object.values(S.engineers).filter(e => !e.leave).length + " engineers on",
  render:(route, S) => h(Home, {S})
};

function greet(S){ const who = MP.ROLES[S.role].person; const n = (S.staff[who] || S.engineers[who]).name.split(" ")[0]; return (S.clock < 720 ? "Good morning, " : "Good afternoon, ") + n; }

function Home(p){
  const S = p.S;
  const today = Q.jobsToday();
  const engs = Object.values(S.engineers);
  const active = engs.filter(e => ["At base","Travelling","On site"].indexOf(Q.engNow(e.id).status) >= 0).length;
  const urgent = Object.values(S.jobs).filter(j => j.prio === "Urgent" && Q.OPEN.indexOf(j.status) >= 0);
  const ready = Object.values(S.jobs).filter(j => j.status === "Ready for Invoice");
  const readyVal = ready.reduce((n, j) => n + Q.jobValue(j).total, 0);
  const awaiting = Object.values(S.jobs).filter(j => j.status === "Awaiting Part");
  const needs = Q.needs();
  return h("div", {className:"g", style:{gap:16}},
    h(Briefing, {S}),
    h("div", {className:"g", style:{gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))"}},
      h(Kpi, {label:"Jobs today", value:today.length, sub:today.filter(j => Q.DONE.indexOf(j.status) >= 0).length + " complete", onClick:() => MP.go("dispatch")}),
      h(Kpi, {label:"Engineers active", value:h(F, null, active, h("span", {style:{color:"var(--faint)", fontSize:18}}, " / " + engs.length)), sub:"1 on annual leave", onClick:() => MP.go("engineers")}),
      h(Kpi, {label:"Urgent jobs", value:urgent.length, color:urgent.length ? "var(--bad)" : null, sub:urgent.length ? "Production stopped or at risk" : "None open", onClick:() => MP.go("jobs?view=urgent")}),
      h(Kpi, {label:"Ready for invoice", value:U.eur(readyVal), sub:ready.length + " job" + (ready.length === 1 ? "" : "s") + ", est. value", onClick:() => MP.go("jobs?view=ready")}),
      h(Kpi, {label:"Awaiting parts", value:awaiting.length, sub:awaiting.filter(j => j.awaiting && j.awaiting.reorder).length + " on order", onClick:() => MP.go("jobs?view=parts")}),
      h(Kpi, {label:"Needs attention", value:needs.length, color:needs.some(n => n.cat === "URGENT") ? "var(--warn)" : null, sub:needs.filter(n => n.cat === "URGENT").length + " urgent", onClick:() => MP.go("attention")})),
    h("div", {className:"g home-split", style:{gridTemplateColumns:"minmax(0,1.75fr) minmax(300px,1fr)", alignItems:"start"}},
      h(LiveOps, {S, today}),
      h(Attention, {needs})),
    h(EngineerMap, {S}),
    h("style", null, "@media (max-width:1100px){.home-split{grid-template-columns:1fr!important}} @media (max-width:900px){.map-split{grid-template-columns:1fr!important}}"));
}

function Briefing(p){
  const S = p.S, b = Q.briefing();
  return h(Card, {className:"anim", style:{padding:"18px 20px", background:"linear-gradient(135deg,var(--accent-faint),transparent 60%),var(--surface)"}},
    h("div", {className:"row wrap", style:{gap:"8px 14px", alignItems:"baseline"}},
      h("div", {style:{fontSize:21, fontWeight:600, letterSpacing:"-.015em"}}, greet(S)),
      h("span", {className:"dim"}, "Monday 28 September"),
      h("span", {className:"sp1"}),
      h("span", {className:"mono faint"}, "Morning briefing · Operations Watchdog · 07:01"),
      h(Btn, {sm:true, k:"ghost", icon:"chat", onClick:() => MP.openAI("What jobs are still open today?")}, "Ask about today")),
    h("div", {className:"g brief-split", style:{gridTemplateColumns:"minmax(220px,.8fr) minmax(0,2fr)", gap:24, marginTop:14}},
      h("div", null, h("div", {className:"sec"}, "Today"),
        h("div", {className:"g", style:{gridTemplateColumns:"1fr 1fr", gap:"10px 18px"}}, b.today.map(t => h("div", {key:t[1]},
          h("div", {style:{fontSize:22, fontWeight:600, fontVariantNumeric:"tabular-nums", lineHeight:1.1}}, t[0]), h("div", {className:"dim", style:{fontSize:12}}, t[1]))))),
      h("div", null, h("div", {className:"sec"}, "Watch"),
        h("ul", {style:{margin:0, padding:0, listStyle:"none", display:"grid", gap:7}}, b.watch.map((w, i) => h("li", {key:i, className:"row", style:{alignItems:"flex-start", gap:9}},
          h("span", {style:{width:5, height:5, borderRadius:3, background:"var(--accent)", marginTop:7, flex:"none"}}),
          h("button", {type:"button", className:"ref", style:{color:"var(--body)"}, onClick:() => MP.go(w.go)}, w.text)))))),
    h("style", null, "@media (max-width:720px){.brief-split{grid-template-columns:1fr!important}}"));
}

const ORDER = {"On Site":0, "Travelling":1, "Unassigned":2, "Paused":3, "Awaiting Part":4, "Scheduled":5, "Engineer Complete":6, "Review Required":7, "Ready for Invoice":8, "Sent to QuickBooks":9, "Closed":10};
function LiveOps(p){
  const S = p.S, rows = p.today.slice().sort((a, b) => (ORDER[a.status] - ORDER[b.status]) || (a.start || "99").localeCompare(b.start || "99"));
  return h(Card, {title:"Live service operations", sub:"Today’s jobs, most active first", icon:"jobs", right:h(Btn, {sm:true, k:"ghost", onClick:() => MP.go("dispatch")}, "Open dispatch")},
    h(Table, {onRow:(j) => MP.go("jobs/" + j.id), rows,
      cols:[
        {t:"Job", w:70, r:(j) => h("span", {className:"mono", style:{color:"var(--ink)"}}, "#" + j.id)},
        {t:"Customer", r:(j) => h("div", null, h("div", {style:{color:"var(--ink)"}}, Q.cust(j.cust).name), h("div", {className:"faint", style:{fontSize:11.5}}, Q.site(j.site).town.split(",")[0]))},
        {t:"Machine", r:(j) => j.machine ? h("span", null, Q.model(j.machine).type) : h("span", {className:"faint"}, j.type === "Site measurement" ? "Site measurement" : "Serial missing")},
        {t:"Engineer", r:(j) => j.eng ? h("div", {className:"row", style:{gap:7}}, h(Av, {e:j.eng, s:22}), Q.eng(j.eng).name) : h("span", {className:"faint"}, "Unassigned")},
        {t:"Status", r:(j) => h(Status, {j})},
        {t:"Priority", r:(j) => h(Prio, {p:j.prio})}
      ]}));
}

function Attention(p){
  const list = p.needs.slice(0, 6);
  return h(Card, {title:"Needs attention", sub:"Only what a manager has to act on", icon:"attention", right:h(Btn, {sm:true, k:"ghost", onClick:() => MP.go("attention")}, "All " + p.needs.length)},
    h("div", {style:{padding:"0 10px 10px"}}, list.length ? list.map(n => h("button", {key:n.id, type:"button", onClick:() => MP.go(n.go),
      style:{display:"block", width:"100%", textAlign:"left", background:"none", border:0, borderRadius:12, padding:"10px 8px", cursor:"pointer", color:"inherit", font:"inherit", borderTop:"1px solid var(--border)"}},
      h("div", {className:"row", style:{gap:8}}, h(Badge, {k:CAT_TONE[n.cat]}, n.cat), h("span", {className:"faint", style:{fontSize:11.5}}, n.title)),
      h("div", {style:{color:"var(--ink)", fontWeight:500, marginTop:5}}, n.head),
      h("div", {className:"dim", style:{fontSize:12, marginTop:2}}, n.detail),
      n.meta ? h("div", {className:"mono faint", style:{marginTop:4}}, n.meta) : null))
    : h(UI.Empty, {title:"Nothing needs you right now", icon:"check"}, "New items appear here the moment Pulse spots them.")));
}

function EngineerMap(p){
  const S = p.S, engs = Object.values(S.engineers).map(e => Q.engNow(e.id));
  const today = Q.jobsToday();
  const points = [{pos:MP.geo.BASE.pos, kind:"base", label:"Myers"}]
    .concat(today.filter(j => Q.OPEN.indexOf(j.status) >= 0 || Q.DONE.indexOf(j.status) >= 0).map(j => ({pos:Q.site(j.site).pos, r:4, color: Q.DONE.indexOf(j.status) >= 0 ? "var(--ok)" : j.prio === "Urgent" ? "var(--bad)" : "var(--dim)", title:"#" + j.id + " " + Q.cust(j.cust).name, onClick:() => MP.go("jobs/" + j.id)})))
    .concat(engs.filter(n => ["Travelling","On site","At base"].indexOf(n.status) >= 0).map(n => ({pos:n.pos, kind:"eng", label:Q.eng(n.id).initials, color:Q.eng(n.id).tint, pulse:n.status === "Travelling", title:n.name + ", " + n.status, onClick:() => MP.go("engineers/" + n.id)})));
  const lines = engs.filter(n => n.status === "Travelling" && n.place).map(n => ({pts:[n.pos, Q.placePos(n.place)], dash:true, color:Q.eng(n.id).tint, op:.8}));
  return h(Card, {title:"Live engineer map", sub:"Positions at " + U.hm(S.clock) + ". Shaded circle: " + S.rules.subsistence.radius + " km Myers qualifying zone.", icon:"subsistence",
      right:h(Btn, {sm:true, k:"ghost", onClick:() => MP.go("engineers")}, "All engineers")},
    h("div", {className:"g map-split", style:{gridTemplateColumns:"minmax(260px,.9fr) minmax(0,1.6fr)", gap:0, borderTop:"1px solid var(--border)"}},
      h("div", {style:{padding:"12px 12px 8px", borderRight:"1px solid var(--border)"}}, h(IrelandMap, {points, lines, zone:{pos:MP.geo.BASE.pos, km:S.rules.subsistence.radius}, h:470, maxH:470})),
      h("div", {className:"eng-grid", style:{display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))"}}, engs.map(n => h(EngCard, {key:n.id, n, S})))));
}
function EngCard(p){
  const n = p.n, E = Q.eng(n.id), sub = n.sub;
  const subTxt = n.status === "On leave" ? "On leave" : sub && sub.band != null ? "Qualifying" : sub && sub.exit != null ? "Running · " + U.dur(sub.away) : "Inside zone";
  return h("button", {type:"button", onClick:() => MP.go("engineers/" + n.id), style:{textAlign:"left", background:"none", border:0, borderBottom:"1px solid var(--border)", borderRight:"1px solid var(--border)", padding:"14px 16px", cursor:"pointer", color:"inherit", font:"inherit", display:"block"}},
    h("div", {className:"row", style:{gap:9}}, h(Av, {e:E, s:28}), h("div", {style:{minWidth:0, flex:1}}, h("div", {style:{fontWeight:600, color:"var(--ink)"}}, E.name), h("div", {className:"faint", style:{fontSize:11.5}}, Q.loc(E.van).name)),
      h(Badge, {k:ENG_TONE[n.status] || ""}, n.status)),
    n.status === "On leave" ? h("div", {className:"dim", style:{marginTop:10, fontSize:12}}, "Annual leave. Not tracked.") : h(F, null,
      h("div", {style:{marginTop:10, color:"var(--body)", fontSize:12.5, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}, n.where || "Not signed on",
        n.status === "Travelling" && n.eta ? h("span", {className:"faint"}, " · ETA " + U.hm(n.eta)) : null),
      h("div", {className:"dim", style:{fontSize:12, marginTop:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}},
        n.job ? "Current: #" + n.job.id + " " + Q.cust(n.job.cust).name : n.next ? "Next: " + n.next.start + " " + Q.cust(n.next.cust).name : "No more jobs today"),
      h("div", {className:"g", style:{gridTemplateColumns:"repeat(4,auto)", justifyContent:"space-between", gap:6, marginTop:10}},
        mini("Jobs", n.done.length + "/" + n.jobs.length), mini("Travel", U.dur(n.travel)), mini("Away", sub && sub.exit != null ? U.dur(n.away) : "0m"),
        mini("Subsistence", subTxt, sub && sub.band != null ? "var(--ok)" : null))));
}
function mini(l, v, c){ return h("div", null, h("div", {className:"faint", style:{fontSize:10.5}}, l), h("div", {className:"mono", style:{color:c || "var(--ink)", fontSize:11.5, whiteSpace:"nowrap"}}, v)); }
MP.EngCard = EngCard;
})();
