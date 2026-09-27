/* Myers Pulse: AI agents, Activity, Needs Attention, Systems, Team & Permissions, Rules.
   Everything is derived from MP.get() / MP.q. Mutations go through MP.act.* only. */
(function(){
"use strict";
const MP = window.MP, h = MP.h, F = MP.F, U = MP.util, Q = MP.q, A = MP.act, UI = MP.ui, R = window.React;
const {Card, Badge, Status, Btn, Av, Ref, Chip, Icon, Table, Empty, KV, Bar, Tabs} = UI;
const cx = UI.cx, TODAY = U.TODAY;
const useState = (v) => R.useState(v), useRef = (v) => R.useRef(v);

/* ---------- page styles (one tag, adm- prefix) ---------- */
const CSS = `
.adm-list>*+*{border-top:1px solid var(--border)}
.adm-tile{width:30px;height:30px;border-radius:9px;background:var(--accent-soft);color:var(--accent);display:inline-flex;align-items:center;justify-content:center;flex:none}
.adm-clip{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.adm-split{display:grid;gap:16px;grid-template-columns:minmax(0,1.7fr) minmax(300px,1fr);align-items:start}
.adm-2{display:grid;grid-template-columns:1fr 1fr;gap:14px 22px}
.adm-ul{list-style:none;margin:0;padding:0;display:grid;gap:7px}
.adm-ul li{display:flex;gap:8px;align-items:flex-start;color:var(--body)}
.adm-ul li svg{flex:none;margin-top:2px}
.adm-blk{padding:14px 18px;border-top:1px solid var(--border)}
.adm-chk{display:grid;grid-template-columns:minmax(150px,.8fr) minmax(0,1.6fr) auto;gap:12px;align-items:center;padding:9px 0}
.adm-chk+.adm-chk{border-top:1px solid var(--border)}
.adm-rec{display:grid;grid-template-columns:70px minmax(0,1fr) auto;gap:12px;padding:10px 0;align-items:start}
.adm-rec+.adm-rec{border-top:1px solid var(--border)}
.adm-refs{display:flex;flex-wrap:wrap;gap:6px;margin-top:5px}
.adm-rc{display:inline-flex;align-items:center;height:22px;padding:0 9px;border-radius:999px;border:1px solid var(--border);background:var(--surface-faint);font-size:11.5px;max-width:280px;min-width:0}
.adm-rc .ref{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;max-width:100%}
.adm-day{display:flex;align-items:baseline;gap:10px;padding:16px 18px 8px;border-top:1px solid var(--border)}
.adm-day:first-child{border-top:0}
.adm-day b{font-size:12.5px;font-weight:600;color:var(--ink)}
.adm-arow{display:grid;grid-template-columns:46px minmax(140px,200px) minmax(0,1fr);gap:12px;padding:8px 18px;align-items:start;border-top:1px solid var(--border)}
.adm-arow:hover{background:var(--surface-faint)}
.adm-new{animation:admFlash 2.6s var(--ease)}
@keyframes admFlash{0%,35%{background:var(--accent-soft)}100%{background:transparent}}
.adm-actor{display:flex;gap:8px;align-items:flex-start;min-width:0}
.adm-actor svg{margin-top:2px;flex:none}
.adm-item{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr) minmax(230px,auto);gap:18px;padding:14px 18px;align-items:start}
.adm-colh{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr) minmax(230px,auto);gap:18px;padding:0 18px 8px}
.adm-acts{display:flex;flex-wrap:wrap;gap:6px;justify-content:flex-end;align-items:center}
.adm-hint{font-size:11.5px;color:var(--faint);text-align:right;flex-basis:100%}
.adm-conn{display:grid;grid-template-columns:30px minmax(0,1fr) auto;gap:12px;padding:12px 18px;align-items:start}
.adm-sync{display:grid;grid-template-columns:minmax(0,1.3fr) 150px minmax(0,1fr) 18px;gap:10px;align-items:center;padding:8px 0}
.adm-sync+.adm-sync{border-top:1px solid var(--border)}
.adm-fig{font-size:22px;font-weight:600;letter-spacing:-.015em;font-variant-numeric:tabular-nums;line-height:1.1}
.adm-mx td,.adm-mx th{text-align:center}
.adm-mx td:first-child,.adm-mx th:first-child{text-align:left}
.adm-rules{display:grid;gap:16px;grid-template-columns:minmax(300px,.85fr) minmax(0,1.3fr);align-items:start}
.adm-range{width:100%;accent-color:var(--accent)}
.adm-err{color:var(--bad);font-size:11.5px;margin-top:4px}
.adm-cmp{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
.adm-ex{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1.2fr) 70px minmax(0,1fr) minmax(0,1fr);gap:10px;padding:10px 0;align-items:center}
.adm-ex+.adm-ex{border-top:1px solid var(--border)}
@media (max-width:1100px){.adm-split,.adm-rules{grid-template-columns:1fr}}
@media (max-width:1000px){.adm-item{grid-template-columns:1fr;gap:8px}.adm-acts{justify-content:flex-start}.adm-hint{text-align:left}.adm-colh{display:none}}
@media (max-width:900px){.adm-arow{grid-template-columns:44px minmax(0,1fr)}.adm-arow>.adm-atext{grid-column:1/-1}.adm-2,.adm-cmp{grid-template-columns:1fr 1fr}.adm-chk{grid-template-columns:1fr auto}.adm-chk>.adm-cr{grid-column:1/-1;order:3}.adm-ex{grid-template-columns:1fr 1fr}}
@media (max-width:620px){.adm-2{grid-template-columns:1fr}.adm-sync{grid-template-columns:minmax(0,1fr) 18px}.adm-sync>.adm-hide{display:none}}
`;
(function(){ try { if (document.getElementById("adm-css")) return; const st = document.createElement("style"); st.id = "adm-css"; st.textContent = CSS; document.head.appendChild(st); } catch(e){} })();

/* ---------- actions this file needs (engine gaps) ---------- */
/* Tracking hours: A.setTracking exists but does not log; this one writes to Activity and toasts. */
A.saveTracking = (patch) => {
  const S = MP.get(); MP.tick(); S.rules.tracking = Object.assign({}, S.rules.tracking, patch);
  MP.log(Q.staffName(), "person", "Changed location tracking hours to " + S.rules.tracking.from + " to " + S.rules.tracking.to, []);
  MP.toast("Tracking hours saved", "Location is recorded " + S.rules.tracking.from + " to " + S.rules.tracking.to + " on working days only.", "ok"); MP.commit();
};
/* Restore a dismissed Needs Attention item. */
A.unresolve = (id) => {
  const S = MP.get(); if (!S.resolved[id]) return; MP.tick(); delete S.resolved[id];
  MP.log(Q.staffName(), "person", "Restored a dismissed item to Needs Attention (" + id.replace(/:.*/, "") + ")", []); MP.commit();
};
/* Data migration review items (Systems). */
A.resolveMigration = (key, text, refs) => {
  const S = MP.get(); MP.tick(); S.migReview = S.migReview || {};
  S.migReview[key] = {by:Q.staffName(), t:U.hm(S.clock)};
  MP.log(Q.staffName(), "person", "Data migration: " + text, refs || []);
  MP.toast("Migration item resolved", text, "ok"); MP.commit();
};

/* ---------- small helpers ---------- */
const plural = (n, one, many) => n + " " + (n === 1 ? one : (many || one + "s"));
const dayLabel = (d) => d === TODAY ? "Today" : U.WDAY[U.weekday(d)] + " " + U.dm(d);
const when = (d, t) => d === TODAY ? t : U.wdm(d).slice(0, 3) + " " + U.dm(d) + ", " + t;
const aiTone = (s) => /^Awaiting/.test(s) ? "warn" : /^Accepted/.test(s) ? "ok" : /^Overridden/.test(s) ? "" : "line";
const byTimeDesc = (a, b) => (b.d + b.t).localeCompare(a.d + a.t);
function Li(p){ return h("li", null, h(Icon, {n:p.icon || "check", s:13, style:{color:p.color || "var(--ok)"}}), h("span", null, p.children)); }
function Head(p){ return h("div", {className:"sec", style:Object.assign({marginBottom:10}, p.style)}, p.children); }

/* ======================================================================
   1. AGENTS
   ====================================================================== */
const AG = {
  coordinator:{icon:"desk", can:["Read","Propose"], canText:"Reads requests, proposes draft jobs",
    purpose:"Reads every inbound request, recognises the customer, site and machine, sets priority and drafts the job.",
    handles:["Classifying email, phone and website requests","Recognising the customer, site and machine from the text","Setting priority from the symptom and production impact","Drafting jobs for a person to confirm","Spotting follow-ups that belong to an open job"],
    reads:["service@myers.ie inbox","Phone call transcripts","Website service form","Customers and sites (from QuickBooks)","Machine register"],
    proposes:[["jobs.draft","Draft job with customer, machine and priority"],["requests.link","Link a follow-up to an open job"],["requests.reply","Reply asking for missing details"]],
    never:["Creates a job without a person confirming it","Assigns an engineer","Replies to a customer on its own"]},
  dispatch:{icon:"dispatch", can:["Read","Propose"], canText:"Reads locations and skills, proposes engineers",
    purpose:"Ranks engineers for each job on certification, location, van stock and the day already booked.",
    handles:["Engineer availability","Live location and drive time","Skills and manufacturer certification","Route consideration across the day","Allocation suggestions with reasons"],
    reads:["Engineer locations (working hours only)","Today’s schedule and bookings","Skills and certifications","Van stock"],
    proposes:[["dispatch.rank_engineers","Ranked engineers with reasons for and against"],["jobs.assign","Recommended engineer for a job"]],
    never:["Assigns an engineer","Moves a customer’s booking","Contacts the customer"]},
  parts:{icon:"parts", can:["Read","Propose"], canText:"Reads stock, proposes reorders",
    purpose:"Looks up parts, knows where each one is, predicts likely parts and watches stock levels.",
    handles:["Part lookup by number, description or label photo","Stock across Main Stores and eight vans","Likely parts for a fault","Low stock and van minimums","Reorder recommendations"],
    reads:["Parts database","Stock by location","Part movements","Open reorder requests","Label photos from the field"],
    proposes:[["parts.create_reorder_request","Reorder request with quantity and supplier"],["parts.transfer","Van top-up from Main Stores"]],
    never:["Orders parts from a supplier","Moves stock","Changes prices"]},
  machine:{icon:"machines", can:["Read"], canText:"Reads history, suggests causes",
    purpose:"Knows each machine’s history: previous faults, repairs, parts and manuals.",
    handles:["Service history for every machine","Recurring fault detection","Manual and document lookup","Previous repairs and the parts they used"],
    reads:["Machine register","Job history and engineer reports","Manuals and certificates","Part history per machine"],
    proposes:[["machines.history","History summary sent to the engineer’s phone"],["machines.similar_faults","Likely cause from similar past jobs"]],
    never:["Changes a machine record","Closes or edits a job"]},
  watchdog:{icon:"attention", can:["Read","Flag"], canText:"Reads everything, raises alerts",
    purpose:"Checks the operation all day and raises only what a manager has to act on.",
    handles:["Overdue and urgent jobs","Delayed engineers","Missing documents","Jobs stuck awaiting parts","Unreviewed subsistence exceptions","Completed jobs not sent to QuickBooks","Overdue warranty responses"],
    reads:["Every job, timeline and document","Engineer locations and ETAs","Subsistence records","QuickBooks handover status","Warranty claims"],
    proposes:[["attention.raise","Needs Attention items"],["briefing.today","Morning briefing"],["quickbooks.send_jobs","Sending ready jobs to QuickBooks"]],
    never:["Sends anything to QuickBooks","Marks subsistence reviewed","Changes a job status"]}
};
const AG_KEYS = ["coordinator","dispatch","parts","machine","watchdog"];

MP.pages.agents = {
  title:"Agents",
  sub:(r, S) => { const n = S.ai.filter(a => /^Awaiting/.test(a.status)).length; return "Five assistants that read and propose. People decide." + (n ? " " + plural(n, "proposal") + " waiting." : ""); },
  render:(route, S) => h(AgentsPage, {route, S})
};

function agentStats(S, k){
  const list = S.ai.filter(a => a.agent === k).slice().sort(byTimeDesc);
  return {list, today:list.filter(a => a.d === TODAY).length, pending:list.filter(a => /^Awaiting/.test(a.status)), last:list[0] || null};
}

function AgentsPage(p){
  const S = p.S, sel = AG_KEYS.indexOf(p.route.parts[0]) >= 0 ? p.route.parts[0] : "coordinator";
  const rows = AG_KEYS.map(k => Object.assign({id:k}, agentStats(S, k)));
  return h("div", {className:"g", style:{gap:16}},
    h(Card, {title:"Agent roster", sub:"Every agent reads live records. Anything that changes data is proposed to a person.", icon:"agents",
        right:h(Btn, {sm:true, k:"ghost", icon:"activity", onClick:() => MP.go("activity?type=ai")}, "AI activity")},
      h(Table, {rows, sel, onRow:(r) => MP.go("agents/" + r.id), cols:[
        {t:"Agent", r:(r) => h("div", {className:"row", style:{gap:10, minWidth:0}}, h("span", {className:"adm-tile"}, h(Icon, {n:AG[r.id].icon, s:16})),
          h("div", {style:{minWidth:0}}, h("div", {style:{color:"var(--ink)", fontWeight:600}}, MP.AGENTS[r.id].name), h("div", {className:"dim", style:{fontSize:12}}, AG[r.id].purpose)))},
        {t:"Can", w:170, r:(r) => h("div", null, h("div", {className:"row", style:{gap:4}}, AG[r.id].can.map(c => h(Badge, {key:c, k:c === "Read" ? "line" : "acc"}, c))), h("div", {className:"faint", style:{fontSize:11, marginTop:3}}, AG[r.id].canText))},
        {t:"Today", w:60, num:true, r:(r) => h("span", {className:"mono", style:{color:"var(--ink)"}}, r.today)},
        {t:"Waiting on a person", w:150, r:(r) => r.pending.length ? h(Badge, {k:"warn"}, plural(r.pending.length, "proposal")) : h("span", {className:"faint"}, "None")},
        {t:"Last action", w:110, r:(r) => r.last ? h("span", {className:"mono dim"}, r.last.d === TODAY ? r.last.t : U.wdm(r.last.d).slice(0, 3) + " " + r.last.t) : h("span", {className:"faint"}, "None")}
      ]})),
    h("div", {className:"adm-split"},
      h(AgentDetail, {S, k:sel, st:rows.find(r => r.id === sel)}),
      h("div", {className:"g", style:{gap:16}}, h(BriefingCard, {S}), h(AskCard))));
}

/* Where a person confirms a pending proposal. */
function proposalTarget(a){
  const rq = a.refs.find(r => r.type === "request"); if (rq) return ["Open in Service Desk", "desk/" + rq.id];
  const jr = a.refs.find(r => r.type === "job");
  if (jr){ const j = Q.job(jr.id); if (j && j.requestId && (j.draft || !j.eng)) return [a.agent === "dispatch" ? "Assign in Service Desk" : "Confirm in Service Desk", "desk/" + j.requestId]; return ["Open Job #" + jr.id, "jobs/" + jr.id]; }
  const pr = a.refs.find(r => r.type === "part"); if (pr) return ["Open reorder panel", "parts/" + pr.id];
  const er = a.refs.find(r => r.type === "engineer"); if (er) return ["Open engineer", "engineers/" + er.id];
  return ["Open Needs Attention", "attention"];
}

function AgentDetail(p){
  const S = p.S, k = p.k, ag = AG[k], st = p.st, name = MP.AGENTS[k].name;
  return h(Card, {title:name, sub:ag.purpose, right:h(Btn, {sm:true, k:"ghost", icon:"chat", onClick:() => MP.openAI()}, "Ask Pulse")},
    st.pending.length ? h("div", {className:"adm-blk"}, h(Head, null, "Waiting on a person"),
      h("div", {className:"g", style:{gap:10}}, st.pending.map(a => { const t = proposalTarget(a);
        return h("div", {key:a.id, className:"confirm"},
          h("div", {className:"row wrap", style:{gap:8}}, h("span", {className:"k"}, "PROPOSED · " + when(a.d, a.t)), h("span", {className:"sp1"}), h(Badge, {k:"warn"}, "Awaiting confirmation")),
          h("div", {style:{margin:"6px 0 10px", color:"var(--body)"}}, a.text),
          h("div", {className:"row wrap", style:{gap:8}}, h(Btn, {k:"pri", sm:true, icon:"arrow", onClick:() => MP.go(t[1])}, t[0]),
            a.refs.map((r, i) => h("span", {key:i, className:"adm-rc"}, h(Ref, {r}))))); }))) : null,
    h("div", {className:"adm-blk"}, h(Head, null, k === "watchdog" ? "Live checks" : "Right now"), h(LiveChecks, {S, k})),
    h("div", {className:"adm-blk adm-2"},
      h("div", null, h(Head, null, "Handles"), h("ul", {className:"adm-ul"}, ag.handles.map(x => h(Li, {key:x}, x)))),
      h("div", null, h(Head, null, "Reads"), h("ul", {className:"adm-ul"}, ag.reads.map(x => h(Li, {key:x, icon:"documents", color:"var(--dim)"}, x))))),
    h("div", {className:"adm-blk adm-2"},
      h("div", null, h(Head, null, k === "machine" ? "Can suggest" : "Can propose"), h("ul", {className:"adm-ul"}, ag.proposes.map(x => h("li", {key:x[0]},
        h(Icon, {n:"arrow", s:13, style:{color:"var(--accent)"}}), h("span", null, x[1], h("span", {className:"mono faint", style:{marginLeft:6}}, x[0])))))),
      h("div", null, h(Head, null, "Never does"), h("ul", {className:"adm-ul"}, ag.never.map(x => h(Li, {key:x, icon:"close", color:"var(--bad)"}, x))),
        h("div", {className:"faint", style:{fontSize:11.5, marginTop:8}}, "A person confirms every change. The confirmation is bound to the exact arguments."))),
    h("div", {className:"adm-blk"}, h("div", {className:"row", style:{marginBottom:4}}, h(Head, {style:{margin:0}}, "Recent actions"), h("span", {className:"sp1"}), h("span", {className:"mono faint"}, plural(st.list.length, "entry", "entries"))),
      st.list.length ? st.list.map(a => h("div", {key:a.id, className:"adm-rec"},
        h("span", {className:"mono dim"}, a.d === TODAY ? a.t : U.wdm(a.d).slice(0, 3) + " " + a.t),
        h("div", {style:{minWidth:0}}, h("div", {style:{color:"var(--ink)"}}, a.text), a.refs.length ? h("div", {className:"adm-refs"}, a.refs.map((r, i) => h("span", {key:i, className:"adm-rc"}, h(Ref, {r})))) : null),
        h(Badge, {k:aiTone(a.status)}, a.status)))
      : h(Empty, {title:"No actions yet today", icon:"agents"}, name + " records every suggestion here.")));
}

/* Checks each agent runs against the live records. Watchdog: the seven operational checks from the brief. */
function checksFor(S, k){
  const jobs = Object.values(S.jobs), now = S.clock;
  if (k === "watchdog"){
    const urgent = jobs.filter(j => j.prio === "Urgent" && Q.OPEN.indexOf(j.status) >= 0);
    const late = jobs.filter(j => (j.status === "Scheduled" && j.date === TODAY && j.start && U.toMin(j.start) + 15 < now) || (j.date < TODAY && ["Unassigned","Scheduled","Travelling","On Site","Paused"].indexOf(j.status) >= 0));
    const delayed = Object.keys(S.engineers).map(Q.engNow).filter(n => n.status === "Travelling" && n.eta != null && n.eta < now);
    const noDocs = jobs.filter(j => ["Engineer Complete","Review Required","Ready for Invoice"].indexOf(j.status) >= 0 && Q.jobChecks(j).some(c => (c.k === "photos" || c.k === "report") && !c.ok));
    const waiting = jobs.filter(j => j.status === "Awaiting Part").sort((a, b) => a.date.localeCompare(b.date));
    const oldest = waiting[0], oDays = oldest ? Math.round((U.fromKey(TODAY) - U.fromKey(oldest.date)) / 864e5) : 0;
    const subs = Q.needs().filter(n => n.cat === "SUBSISTENCE");
    const ready = jobs.filter(j => j.status === "Ready for Invoice"), held = jobs.filter(j => ["Engineer Complete","Review Required"].indexOf(j.status) >= 0);
    const warr = Object.values(S.claims).filter(c => c.overdue && c.stage === "Awaiting manufacturer");
    return [
      {label:"Urgent and overdue jobs", n:urgent.length + late.length, tone:urgent.length ? "bad" : null, go:"jobs?view=urgent",
        text:plural(urgent.length, "urgent job") + " open" + (late.length ? ", " + plural(late.length, "job") + " past its start time" : ", none past start time")},
      {label:"Delayed engineers", n:delayed.length, go:"engineers",
        text:delayed.length ? delayed.map(n => n.name + ", ETA was " + U.hm(n.eta)).join("; ") : "Everyone on the road is within their ETA"},
      {label:"Missing documents", n:noDocs.length, go:noDocs[0] ? "jobs/" + noDocs[0].id : "documents",
        text:noDocs.length ? noDocs.map(j => "#" + j.id).join(", ") + " complete without photos or a report" : "Every completed job has photos and a report"},
      {label:"Stuck awaiting parts", n:waiting.length, go:"jobs?view=parts",
        text:waiting.length ? plural(waiting.length, "job") + ", oldest #" + oldest.id + " " + Q.cust(oldest.cust).name + " since " + U.wdm(oldest.date) + " (" + plural(oDays, "day") + ")" : "No jobs waiting on parts"},
      {label:"Subsistence exceptions", n:subs.length, go:"subsistence/exceptions",
        text:subs.length ? subs.length + " unreviewed: " + subs.map(s => s.head).join("; ") : "All exceptions reviewed"},
      {label:"Completed, not in QuickBooks", n:ready.length + held.length, go:"jobs?view=ready",
        text:ready.length || held.length ? plural(ready.length, "job") + " ready (" + U.eur(ready.reduce((n, j) => n + Q.jobValue(j).total, 0)) + " est.)" + (held.length ? ", " + held.length + " held for review" : "") : "Every completed job has reached QuickBooks"},
      {label:"Overdue warranty responses", n:warr.length, go:warr[0] ? "warranties/" + warr[0].id : "warranties",
        text:warr.length ? warr.map(c => c.id + ", " + c.mfr + ", due " + U.dm(c.due)).join("; ") : "No manufacturer responses overdue"}
    ];
  }
  if (k === "coordinator"){
    const waiting = S.requests.filter(r => r.status === "New" || r.status === "Triaged"), today = S.requests.filter(r => r.d === TODAY);
    const drafts = jobs.filter(j => j.draft);
    const ch = {}; today.forEach(r => ch[r.channel] = (ch[r.channel] || 0) + 1);
    return [
      {label:"Requests waiting for a person", n:waiting.length, go:"desk", text:waiting.length ? waiting.map(r => r.id + " " + (r.ai && r.ai.cust ? Q.cust(r.ai.cust).name : r.from)).join(", ") : "Every request has been handled"},
      {label:"Draft jobs not confirmed", n:drafts.length, go:drafts[0] && drafts[0].requestId ? "desk/" + drafts[0].requestId : "desk", text:drafts.length ? drafts.map(j => "#" + j.id + " " + Q.cust(j.cust).name).join(", ") : "No drafts waiting"},
      {label:"Requests read today", n:0, info:true, go:"desk", text:plural(today.length, "request") + ": " + Object.keys(ch).map(c => ch[c] + " " + c.toLowerCase()).join(", ")}
    ];
  }
  if (k === "dispatch"){
    const noEng = Q.jobsToday().filter(j => !j.eng && Q.OPEN.indexOf(j.status) >= 0);
    const ns = Object.keys(S.engineers).map(Q.engNow);
    return [
      {label:"Today’s jobs without an engineer", n:noEng.length, go:"dispatch", text:noEng.length ? noEng.map(j => "#" + j.id + " " + Q.cust(j.cust).name + (j.draft ? " (draft)" : "")).join(", ") : "Every job today has an engineer"},
      {label:"Engineers on the road", n:0, info:true, go:"engineers", text:ns.filter(n => n.status === "Travelling").map(n => n.name.split(" ")[0] + (n.eta ? " ETA " + U.hm(n.eta) : "")).join(", ") || "Nobody travelling"},
      {label:"Engineers on site", n:0, info:true, go:"engineers", text:ns.filter(n => n.status === "On site").map(n => n.name.split(" ")[0] + (n.job ? " #" + n.job.id : "")).join(", ") || "Nobody on site yet"}
    ];
  }
  if (k === "parts"){
    const low = Q.lowStock(), re = low.filter(l => l.kind === "reorder" && !l.open), van = low.filter(l => l.kind === "van");
    const open = S.reorders.filter(r => r.status === "Requested" || r.status === "Ordered");
    return [
      {label:"Below reorder level, no order", n:re.length, go:re[0] ? "parts/" + re[0].sku : "parts", text:re.length ? re.map(l => l.sku + " (" + l.qty + " of " + l.min + ")").join(", ") : "Every line below its reorder level has an order raised"},
      {label:"Van lines below minimum", n:van.length, go:"parts", text:van.length ? van.slice(0, 4).map(l => Q.loc(l.loc).name + " " + l.sku).join(", ") + (van.length > 4 ? " and " + (van.length - 4) + " more" : "") : "Every van at or above its minimum"},
      {label:"Reorders awaiting delivery", n:0, info:true, go:"parts", text:plural(open.length, "request") + (open.length ? ", next due " + U.wdm(open.map(r => r.eta).sort()[0]) : "")}
    ];
  }
  // machine
  const rep = [];
  Object.values(S.machines).forEach(m => { const c = {}; Q.machineParts(m.id).filter(x => x.d >= "2026-01-01").forEach(x => c[x.sku] = (c[x.sku] || 0) + x.qty); Object.keys(c).forEach(s => { if (c[s] >= 2) rep.push({m:m.id, sku:s, n:c[s]}); }); });
  const noSerial = jobs.filter(j => j.dataIssue && !j.machine);
  const withHist = Q.jobsToday().filter(j => j.machine);
  return [
    {label:"Repeat parts this year", n:rep.length, go:rep[0] ? "machines/" + rep[0].m : "machines", text:rep.length ? rep.slice(0, 3).map(x => x.m + ": " + x.sku + " × " + x.n).join(", ") : "No part replaced twice on one machine this year"},
    {label:"Jobs missing a machine", n:noSerial.length, go:noSerial[0] ? "jobs/" + noSerial[0].id : "machines", text:noSerial.length ? noSerial.map(j => "#" + j.id + " " + Q.cust(j.cust).name).join(", ") + ": history cannot attach" : "Every job has its machine"},
    {label:"History ready for today", n:0, info:true, go:"machines", text:withHist.length + " of " + Q.jobsToday().length + " jobs today have machine history attached"}
  ];
}
function LiveChecks(p){
  const list = checksFor(p.S, p.k);
  return h("div", null, list.map(c => h("div", {key:c.label, className:"adm-chk"},
    h("div", {style:{color:"var(--ink)", fontWeight:500}}, c.label),
    h("div", {className:"dim adm-cr", style:{fontSize:12.5}}, c.text),
    h("div", {className:"row", style:{gap:8, justifyContent:"flex-end"}},
      c.info ? null : c.n ? h(Badge, {k:c.tone || "warn"}, String(c.n)) : h(Badge, {k:"ok"}, "Clear"),
      h(Btn, {sm:true, k:"ghost", onClick:() => MP.go(c.go), "aria-label":"Open " + c.label}, "Open")))));
}

function BriefingCard(p){
  const b = Q.briefing();
  return h(Card, {title:"Morning briefing", sub:"Operations Watchdog · 07:01, kept current", icon:"attention"},
    h("div", {className:"cb"},
      h("div", {className:"g", style:{gridTemplateColumns:"1fr 1fr", gap:"10px 16px", marginBottom:14}}, b.today.map(t => h("div", {key:t[1]},
        h("div", {className:"adm-fig"}, t[0]), h("div", {className:"dim", style:{fontSize:12}}, t[1])))),
      h(Head, null, "Watch"),
      b.watch.length ? h("ul", {className:"adm-ul"}, b.watch.map((w, i) => h("li", {key:i}, h(Icon, {n:"arrow", s:13, style:{color:"var(--accent)"}}),
        h("button", {type:"button", className:"ref", style:{color:"var(--body)"}, onClick:() => MP.go(w.go)}, w.text))))
      : h("div", {className:"dim"}, "Nothing to watch. The day is on track.")));
}
function AskCard(){
  return h(Card, {title:"Ask Pulse", sub:"Plain questions, answered from Myers records", icon:"chat"},
    h("div", {className:"cb"},
      h("p", {style:{margin:"0 0 12px", color:"var(--body)"}}, "Answers are read from live records. Anything that changes data waits for your yes."),
      h("div", {className:"col", style:{gap:6, alignItems:"flex-start"}}, MP.SUGGEST.map(s => h(Chip, {key:s, onClick:() => MP.openAI(s)}, s)))));
}

/* ======================================================================
   2. ACTIVITY
   ====================================================================== */
const KIND = {person:["People","Person","engineers","var(--body)"], engineer:["Engineers","Engineer","field","var(--ok)"], ai:["AI","AI agent","agents","var(--accent)"],
  system:["System","System","systems","var(--faint)"], qb:["QuickBooks","QuickBooks","qb","var(--ok)"]};
const KIND_KEYS = ["person","engineer","ai","system","qb"];

MP.pages.activity = {
  title:"Activity",
  sub:(r, S) => "Complete audit trail · " + plural(S.activity.length, "entry", "entries") + " from people, engineers, AI, system and QuickBooks",
  render:(route, S) => h(ActivityPage, {route, S})
};
function parseRef(s){ const i = String(s).indexOf(":"); return i > 0 ? {type:s.slice(0, i), id:s.slice(i + 1)} : null; }
const refMatch = (r, f) => (r.type === f.type && r.id === f.id) || (f.type === "job" && r.type === "qb" && r.id === f.id);

function ActivityPage(p){
  const S = p.S, route = p.route;
  const [type, setType] = useState(KIND[route.query.type] ? route.query.type : "all");
  const [q, setQ] = useState("");
  const seen = useRef(S.activity.length);
  const f = route.query.ref ? parseRef(route.query.ref) : null;
  let items = S.activity.map((a, i) => Object.assign({}, a, {key:"a" + i, seq:i, isNew:i >= seen.current}));
  if (f){
    items = items.filter(a => a.refs.some(r => refMatch(r, f)));
    const j = f.type === "job" ? Q.job(f.id) : null;
    if (j) j.timeline.forEach((e, i) => { if (!items.some(a => a.d === e.d && a.t === e.t && a.text === e.text))
      items.push({d:e.d, t:e.t, actor:e.by, kind:KIND[e.kind] ? e.kind : "person", text:e.text, refs:[], key:"t" + i, seq:-1, tl:true}); });
  }
  const needle = q.trim().toLowerCase();
  if (needle) items = items.filter(a => (a.text + " " + a.actor + " " + a.refs.map(r => Q.label(r) + " " + r.id).join(" ")).toLowerCase().indexOf(needle) >= 0);
  const counts = {all:items.length}; KIND_KEYS.forEach(k => counts[k] = items.filter(a => a.kind === k).length);
  if (type !== "all") items = items.filter(a => a.kind === type);
  items.sort((a, b) => (b.d + b.t).localeCompare(a.d + a.t) || (a.tl ? 1 : 0) - (b.tl ? 1 : 0) || b.seq - a.seq);
  const groups = []; items.forEach(a => { const g = groups[groups.length - 1]; if (g && g.d === a.d) g.list.push(a); else groups.push({d:a.d, list:[a]}); });
  return h("div", {className:"g", style:{gap:16}},
    h(Card, null,
      h("div", {className:"ch row wrap", style:{gap:10}},
        h(Tabs, {value:type, onChange:setType, items:[["all","All",counts.all]].concat(KIND_KEYS.map(k => [k, KIND[k][0], counts[k]]))}),
        h("span", {className:"sp1"}),
        f ? h(Chip, {k:"acc", onClick:() => MP.go("activity"), title:"Clear record filter"}, "Record: " + Q.label(f), h(Icon, {n:"close", s:11})) : null,
        h("div", {style:{position:"relative", width:240, maxWidth:"100%"}},
          h(Icon, {n:"search", s:14, style:{position:"absolute", left:10, top:10, color:"var(--faint)"}}),
          h("input", {className:"in", value:q, onChange:(e) => setQ(e.target.value), placeholder:"Search activity", "aria-label":"Search activity", style:{paddingLeft:30}}))),
      f && f.type === "job" ? h("div", {className:"dim", style:{padding:"0 18px 10px", fontSize:12}}, "Showing every audit entry that references Job #" + f.id + ", plus the job’s own timeline.") : null,
      groups.length ? groups.map(g => h(F, {key:g.d},
        h("div", {className:"adm-day"}, h("b", null, dayLabel(g.d)), h("span", {className:"mono faint"}, plural(g.list.length, "entry", "entries"))),
        g.list.map(a => h(ActRow, {key:a.key, a}))))
      : h("div", {style:{borderTop:"1px solid var(--border)"}}, h(Empty, {title:"No matching activity", icon:"activity"}, f || needle || type !== "all" ? "Try clearing the filters." : "Every action in Pulse is recorded here."))));
}
function ActRow(p){
  const a = p.a, K = KIND[a.kind] || KIND.system, seen = {};
  const refs = a.refs.filter(r => { const k = r.type + ":" + r.id; if (seen[k]) return false; seen[k] = 1; return true; });
  return h("div", {className:cx("adm-arow", a.isNew && "adm-new")},
    h("span", {className:"mono dim", style:{paddingTop:1}}, a.t),
    h("div", {className:"adm-actor"}, h(Icon, {n:K[2], s:14, style:{color:K[3]}}),
      h("div", {style:{minWidth:0}}, h("div", {className:"adm-clip", style:{color:"var(--ink)", fontWeight:500}}, a.actor), h("div", {className:"faint", style:{fontSize:11}}, K[1] + (a.tl ? ", job timeline" : "")))),
    h("div", {className:"adm-atext", style:{minWidth:0}}, h("div", {style:{color:"var(--body)"}}, a.text),
      refs.length ? h("div", {className:"adm-refs"}, refs.map((r, i) => h("span", {key:i, className:"adm-rc"}, h(Ref, {r})))) : null));
}

/* ======================================================================
   3. NEEDS ATTENTION
   ====================================================================== */
const CATS = ["URGENT","APPROVAL","STOCK","WARRANTY","SUBSISTENCE","DATA"];
const CAT_LABEL = {ALL:"All", URGENT:"Urgent", APPROVAL:"Approval", STOCK:"Stock", WARRANTY:"Warranty", SUBSISTENCE:"Subsistence", DATA:"Data"};
const EMPTY = {ALL:["Nothing needs you right now","New items appear here the moment Pulse spots them."], URGENT:["No urgent jobs open","Breakdowns that stop production appear here first."],
  APPROVAL:["Nothing waiting for approval","AI drafts, held jobs and ready-for-invoice work land here."], STOCK:["Stock is healthy","Parts below the reorder level or holding up a job appear here."],
  WARRANTY:["No warranty follow-ups","Overdue manufacturer responses appear here."], SUBSISTENCE:["No subsistence exceptions","GPS gaps, missing returns and manual adjustments appear here."],
  DATA:["Records are complete","Jobs missing a machine or serial appear here."]};
const HINT = {urgent:"Resolves automatically when the job is complete.", data:"Resolves automatically when the machine is linked.", part:"Resolves automatically when the part arrives and the job moves on.",
  review:"Clears when the job is marked ready or the claim is submitted.", ready:"Clears as the jobs are sent to QuickBooks.", sub:"Clears when a manager reviews the day."};
const DISMISSABLE = {request:true, stock:true, warranty:true};
const WHY = {urgent:"Customer production is stopped or at risk until this is fixed.", request:"Nothing is created or assigned until a person confirms it.", part:"The job cannot be finished until the part arrives.",
  stock:"Stock across all locations is below the reorder level.", review:"A held job cannot go to QuickBooks until someone reviews it.", ready:"The work is done but not yet invoiced.",
  warranty:"Credit owed to Myers is waiting on the manufacturer.", sub:"The allowance stays provisional until a manager reviews it.", data:"Without the machine, its history and warranty cannot attach to the job."};
const prefixOf = (id) => id.slice(0, id.indexOf(":"));

MP.pages.attention = {
  title:"Needs Attention",
  sub:() => { const n = Q.needs(); return plural(n.length, "item") + " in one queue" + (n.some(x => x.cat === "URGENT") ? ", " + n.filter(x => x.cat === "URGENT").length + " urgent" : ""); },
  render:(route, S) => h(AttentionPage, {route, S})
};
function AttentionPage(p){
  const S = p.S, all = Q.needs();
  const cat = CATS.indexOf(p.route.query.cat) >= 0 ? p.route.query.cat : "ALL";
  const list = cat === "ALL" ? all : all.filter(n => n.cat === cat);
  const [dis, setDis] = useState(null), [note, setNote] = useState("");
  const resolved = Object.keys(S.resolved).map(id => Object.assign({id}, S.resolved[id])).sort((a, b) => b.t.localeCompare(a.t));
  const tabItems = [["ALL","All",all.length]].concat(CATS.map(c => [c, CAT_LABEL[c], all.filter(n => n.cat === c).length]));
  return h("div", {className:"g", style:{gap:16}},
    h("div", {className:"row wrap", style:{gap:10}}, h(Tabs, {value:cat, onChange:(c) => MP.go(c === "ALL" ? "attention" : "attention?cat=" + c), items:tabItems}),
      h("span", {className:"sp1"}), h(Btn, {sm:true, k:"ghost", icon:"chat", onClick:() => MP.openAI("Give me the morning briefing")}, "Ask for a summary")),
    h(Card, null,
      list.length ? h(F, null,
        h("div", {className:"adm-colh", style:{paddingTop:14}}, h("div", {className:"sec", style:{margin:0}}, "What happened"), h("div", {className:"sec", style:{margin:0}}, "Why it matters"), h("div", {className:"sec", style:{margin:0, textAlign:"right"}}, "What you can do")),
        h("div", {className:"adm-list", style:{borderTop:"1px solid var(--border)"}}, list.map(n => h(NeedItem, {key:n.id, n, S, dis, setDis, note, setNote}))))
      : h(Empty, {title:EMPTY[cat][0], icon:"check"}, EMPTY[cat][1])),
    h(Card, {title:"Resolved today", sub:"Items a person dismissed. Items that fix themselves leave the queue on their own.", icon:"check"},
      resolved.length ? h("div", {className:"adm-list", style:{borderTop:"1px solid var(--border)"}}, resolved.map(r => h("div", {key:r.id, className:"row wrap", style:{padding:"10px 18px", gap:12}},
        h("span", {className:"mono dim"}, r.t), h("span", {style:{color:"var(--ink)"}}, resolvedLabel(r.id)), h("span", {className:"dim"}, "by " + r.by + (r.note ? ": " + r.note : "")),
        h("span", {className:"sp1"}), h(Btn, {sm:true, k:"ghost", icon:"reset", onClick:() => A.unresolve(r.id)}, "Restore"))))
      : h("div", {className:"cb dim"}, "Nothing dismissed yet today.")));
}
function resolvedLabel(id){
  const k = prefixOf(id), v = id.slice(k.length + 1);
  return ({request:"Service request " + v, stock:"Stock alert " + v, warranty:"Warranty " + v + " overdue response", urgent:"Urgent Job #" + v, part:"Job #" + v + " awaiting part",
    review:"Job #" + v + " review", ready:"Ready for invoice batch", sub:"Subsistence exception " + v.replace("|", ", "), data:"Job #" + v + " missing data"})[k] || id;
}
function NeedItem(p){
  const n = p.n, S = p.S, k = prefixOf(n.id), rest = n.id.slice(k.length + 1);
  const openLabel = k === "request" ? "Open in Service Desk" : k === "ready" ? "Review ready jobs" : k === "sub" ? "Open day" : "Open";
  const acts = [];
  if (k === "sub"){ const rec = Q.subDay(rest.split("|")[0], rest.split("|")[1]);
    acts.push(h(Btn, {key:"rv", k:"pri", sm:true, icon:"check", onClick:() => A.markReviewed(rest)}, rec.flags.some(f => f.type === "manual") ? "Confirm return time" : "Mark reviewed")); }
  if (n.action && A[n.action.fn]) acts.push(h(Btn, {key:"ac", k:"pri", sm:true, onClick:() => A[n.action.fn](n.action.arg)}, n.action.label));
  acts.push(h(Btn, {key:"op", sm:true, icon:"arrow", onClick:() => MP.go(n.go)}, openLabel));
  if (DISMISSABLE[k] && p.dis !== n.id) acts.push(h(Btn, {key:"ds", sm:true, k:"ghost", onClick:() => { p.setDis(n.id); p.setNote(""); }}, "Dismiss"));
  return h("div", {className:"adm-item"},
    h("div", {style:{minWidth:0}},
      h("div", {className:"row", style:{gap:8}}, h(Badge, {k:MP.CAT_TONE ? MP.CAT_TONE[n.cat] : ""}, n.cat), h("span", {className:"faint", style:{fontSize:11.5}}, n.title)),
      h("div", {style:{color:"var(--ink)", fontWeight:500, marginTop:6}}, n.head),
      n.refs && n.refs.length ? h("div", {className:"adm-refs"}, n.refs.map((r, i) => h("span", {key:i, className:"adm-rc"}, h(Ref, {r})))) : null),
    h("div", {style:{minWidth:0}},
      h("div", {style:{color:"var(--body)"}}, n.detail),
      n.meta ? h("div", {className:"mono faint", style:{marginTop:4}}, n.meta) : null,
      WHY[k] ? h("div", {className:"dim", style:{fontSize:12, marginTop:4}}, WHY[k]) : null),
    h("div", {className:"adm-acts"},
      k === "data" ? h(MachinePicker, {jobId:rest, S}) : null,
      acts,
      p.dis === n.id ? h("form", {className:"row", style:{gap:6, flexBasis:"100%", justifyContent:"flex-end"}, onSubmit:(e) => { e.preventDefault(); A.resolve(n.id, p.note.trim()); p.setDis(null); }},
        h("input", {className:"in", style:{height:28, maxWidth:220}, value:p.note, onChange:(e) => p.setNote(e.target.value), placeholder:"Note (optional)", "aria-label":"Dismiss note", autoFocus:true}),
        h(Btn, {sm:true, k:"pri", type:"submit"}, "Dismiss"), h(Btn, {sm:true, k:"ghost", onClick:() => p.setDis(null)}, "Cancel")) : null,
      HINT[k] ? h("div", {className:"adm-hint"}, HINT[k]) : null));
}
/* DATA: pick the machine from the customer's register. Suggests the model type named in the booking. */
function MachinePicker(p){
  const j = Q.job(p.jobId), S = p.S;
  const ms = Object.values(S.machines).filter(m => m.cust === j.cust);
  const txt = (j.issue || "").toLowerCase();
  const sug = ms.find(m => txt.indexOf(MP.ref.MODELS[m.model].type.toLowerCase()) >= 0) || ms[0];
  const [mid, setMid] = useState(sug ? sug.id : "");
  if (!ms.length) return h("span", {className:"faint"}, "No machines on record for this customer");
  return h("div", {className:"row", style:{gap:6, flexBasis:"100%", justifyContent:"flex-end"}},
    h("label", {className:"faint", style:{fontSize:11.5}, htmlFor:"adm-mp-" + j.id}, "Machine"),
    h("select", {id:"adm-mp-" + j.id, className:"sel", style:{height:28, maxWidth:260, fontSize:12}, value:mid, onChange:(e) => setMid(e.target.value)},
      ms.map(m => h("option", {key:m.id, value:m.id}, m.id + " · " + MP.ref.MODELS[m.model].name + (sug && m.id === sug.id ? " (suggested)" : "")))),
    h(Btn, {sm:true, k:"pri", disabled:!mid, onClick:() => A.fixMachine(j.id, mid)}, "Link machine"));
}

/* ======================================================================
   4. SYSTEMS
   ====================================================================== */
MP.pages.systems = {
  title:"Systems",
  sub:"QuickBooks, email and imported records. Pulse sends approved job information; QuickBooks owns the invoice.",
  render:(route, S) => h(SystemsPage, {route, S})
};
function ago(t){ const m = MP.now() - U.toMin(t); if (m <= 0) return "just now"; if (m === 1) return "1 min ago"; if (m < 60) return m + " mins ago"; return U.dur(m) + " ago"; }

function SystemsPage(p){
  const S = p.S, qbJobs = Object.values(S.jobs).filter(j => j.qb).sort((a, b) => ((b.qb.sentD || "") + (b.qb.sentT || "")).localeCompare((a.qb.sentD || "") + (a.qb.sentT || "")) || b.id.localeCompare(a.id));
  const month = qbJobs.filter(j => (j.qb.sentD || "") >= "2026-09-01");
  const lastSent = qbJobs[0];
  const custN = Object.keys(S.customers).length, siteN = Object.keys(S.sites).length;
  const sync = [
    ["Customers", "from", "Synced, " + custN + " customers", S.integrations.qb.lastSync],
    ["Customer addresses", "from", siteN + " sites and delivery addresses", S.integrations.qb.lastSync],
    ["Quotes", "from", S.quotes.length + " quotes, read only", S.integrations.qb.lastSync],
    ["Ready-for-invoice jobs", "to", plural(month.length, "job") + " sent this month", lastSent ? (lastSent.qb.sentD === TODAY ? lastSent.qb.sentT : U.dm(lastSent.qb.sentD)) : "None"],
    ["Invoice status", "from", month.filter(j => j.qb.status === "Invoiced").length + " invoiced, awaiting payment", S.integrations.qb.lastSync],
    ["Payment status", "from", month.filter(j => j.qb.status === "Paid").length + " paid this month", S.integrations.qb.lastSync]
  ];
  return h("div", {className:"g", style:{gap:16}},
    h(Card, {title:"QuickBooks", sub:"Accounting system of record", icon:"qb", right:h(Badge, {k:"ok", dot:true}, "CONNECTED")},
      h("div", {className:"adm-split", style:{padding:"0 18px 16px", gridTemplateColumns:"minmax(260px,.8fr) minmax(0,1.5fr)"}},
        h("div", null,
          h(KV, {rows:[["Company", "Myers Food Machinery Ltd"], ["Last sync", h("span", null, ago(S.integrations.qb.lastSync), h("span", {className:"mono faint", style:{marginLeft:6}}, "at " + S.integrations.qb.lastSync))],
            ["Handover", plural(month.length, "job") + " this month"], ["Mode", "Pulse sends, QuickBooks invoices"]]}),
          h("div", {className:"confirm", style:{marginTop:14}}, h("div", {className:"k"}, "LEDGER"),
            h("div", {style:{marginTop:6, color:"var(--body)"}}, "Pulse never writes to the ledger. It sends approved job information; QuickBooks creates and owns the invoice.")),
          h("div", {className:"row", style:{marginTop:14}}, h(Btn, {k:"pri", icon:"reset", onClick:() => A.qbSync()}, "Sync now"),
            h("span", {className:"faint", style:{fontSize:11.5}}, "Reads invoice and payment status back"))),
        h("div", null, h(Head, null, "What syncs"),
          sync.map(s => h("div", {key:s[0], className:"adm-sync"},
            h("div", {style:{color:"var(--ink)"}}, s[0]),
            h("div", {className:"row adm-hide", style:{gap:6, color:s[1] === "to" ? "var(--accent)" : "var(--dim)", fontSize:12}}, h(Icon, {n:s[1] === "to" ? "arrow" : "back", s:13}), s[1] === "to" ? "To QuickBooks" : "From QuickBooks"),
            h("div", {className:"dim adm-hide", style:{fontSize:12}}, s[2], h("span", {className:"mono faint", style:{marginLeft:6}}, s[3])),
            h(Icon, {n:"check", s:14, style:{color:"var(--ok)"}})))))),
    h(Card, {title:"Recent handovers", sub:"Jobs sent to QuickBooks, newest first. Statuses are read back from QuickBooks.", icon:"history"},
      h(Table, {rows:qbJobs.slice(0, 14), onRow:(j) => MP.go("jobs/" + j.id), empty:"Nothing sent to QuickBooks yet", cols:[
        {t:"QuickBooks ref", r:(j) => h("span", {className:"mono", style:{color:"var(--ink)"}}, j.qb.ref)},
        {t:"Job", r:(j) => h(Ref, {r:{type:"job", id:j.id}})},
        {t:"Customer", r:(j) => h(Ref, {r:{type:"customer", id:j.cust}})},
        {t:"Value", num:true, r:(j) => j.qb.value ? h("span", {className:"mono"}, U.eur(j.qb.value)) : h("span", {className:"faint"}, "Pending")},
        {t:"Status", r:(j) => h(Status, {s:j.qb.status})},
        {t:"Sent", r:(j) => h("span", {className:"mono dim"}, U.rel(j.qb.sentD) + (j.qb.sentT ? " " + j.qb.sentT : ""))},
        {t:"Invoice", r:(j) => j.qb.invoiceNo ? h("span", {className:"mono"}, j.qb.invoiceNo) : h("span", {className:"faint"}, "Not yet")},
        {t:"Paid", r:(j) => j.qb.paidD ? h("span", {className:"mono dim"}, U.dm(j.qb.paidD)) : h("span", {className:"faint"}, "Not yet")}
      ]})),
    h("div", {className:"adm-split", style:{gridTemplateColumns:"minmax(0,1fr) minmax(0,1.1fr)"}},
      h(Connections, {S}), h(Migration, {S})));
}
function Connections(p){
  const S = p.S, em = S.requests.filter(r => r.channel === "Email").sort((a, b) => (b.d + b.at).localeCompare(a.d + a.at))[0];
  const contacts = Object.values(S.customers).reduce((n, c) => n + c.contacts.length, 0);
  const vans = Object.values(S.locations).filter(l => l.kind === "van").length;
  const rows = [
    {icon:"desk", name:"Email", detail:"service@myers.ie", badge:["CONNECTED","ok"], note:em ? "Last message " + em.at + " from " + em.from + ". Read by the Service Coordinator." : "No messages yet"},
    {icon:"customers", name:"Customer database", detail:"Old customer spreadsheet, matched to QuickBooks", badge:["IMPORTED","line"], note:Object.keys(S.customers).length + " customers, " + Object.keys(S.sites).length + " sites, " + contacts + " contacts"},
    {icon:"parts", name:"Parts database", detail:"Stores sheet and supplier catalogues", badge:["IMPORTED","line"], note:Object.keys(S.parts).length + " part numbers, stock in Main Stores and " + vans + " vans"},
    {icon:"machines", name:"Machine records", detail:"Installed machine register", badge:["IMPORTED","line"], note:Object.keys(S.machines).length + " machines with serials, install dates and warranty ends"},
    {icon:"documents", name:"Historical documents", detail:"Service reports, manuals and certificates", badge:["INDEXING","acc"], bar:782 / 832, note:"782 of 832 indexed. " + Object.keys(S.docs).length + " already linked to records in Pulse."}
  ];
  return h(Card, {title:"Other connections", sub:"Where Pulse gets its records", icon:"link"},
    h("div", {className:"adm-list", style:{borderTop:"1px solid var(--border)"}}, rows.map(r => h("div", {key:r.name, className:"adm-conn"},
      h("span", {className:"adm-tile", style:{background:"var(--surface-2)", color:"var(--dim)"}}, h(Icon, {n:r.icon, s:15})),
      h("div", {style:{minWidth:0}}, h("div", {style:{color:"var(--ink)", fontWeight:500}}, r.name, h("span", {className:"dim", style:{fontWeight:400, marginLeft:8}}, r.detail)),
        h("div", {className:"dim", style:{fontSize:12, marginTop:3}}, r.note),
        r.bar ? h("div", {className:"row", style:{marginTop:8, gap:10}}, h(Bar, {v:r.bar, style:{flex:1}}), h("span", {className:"mono dim"}, Math.round(r.bar * 100) + "%")) : null),
      h(Badge, {k:r.badge[1], dot:r.badge[1] === "ok"}, r.badge[0])))));
}
function Migration(p){
  const S = p.S, mr = S.migReview || {}, j94 = Q.job("2494");
  const items = [
    {key:"dup-glenmore-ltd", title:"Duplicate customer: Glenmore Foods Ltd", text:"Row 412 of the old customer spreadsheet repeats Glenmore Foods (QB-C-0142) with a Ltd suffix and the Naas address.",
      refs:[{type:"customer", id:"glenmore"}], done:mr["dup-glenmore-ltd"], btn:"Merge into Glenmore Foods", log:"merged duplicate customer Glenmore Foods Ltd into Glenmore Foods"},
    {key:"dup-glenmore-kilcullen", title:"Duplicate customer: Glenmore Foods, Kilcullen", text:"Entered as a separate customer in the old spreadsheet. It is the Kilcullen Dispatch Centre site of Glenmore Foods.",
      refs:[{type:"customer", id:"glenmore"}], done:mr["dup-glenmore-kilcullen"], btn:"Make it a site", log:"linked Glenmore Foods, Kilcullen as a site of Glenmore Foods"},
    {key:"machine-2494", title:"Machine with no serial on the old register", text:"Ashfield Dairies checkweigher at Mallow. The register has no serial, so Job #2494 was booked without one.",
      refs:[{type:"job", id:"2494"}, {type:"customer", id:"ashfield"}], done:j94 && j94.machine ? {by:"Linked", t:j94.machine} : null, auto:true},
    {key:"part-lppr107", title:"Part number mismatch: LP-PR107", text:"The stores sheet lists LP-PR-107; the LabelPro catalogue lists LP-PR107 (Print roller, 107 mm). Same bin, B-14-02.",
      refs:[{type:"part", id:"LP-PR107"}], done:mr["part-lppr107"], btn:"Use catalogue number", log:"kept LabelPro catalogue number LP-PR107 for the print roller"}
  ];
  const left = items.filter(i => !i.done).length;
  return h(Card, {title:"Data migration", sub:"Getting Myers’ existing records into Pulse", icon:"download"},
    h("div", {className:"cb"},
      h("div", {className:"adm-cmp", style:{marginBottom:12}},
        [["12,418","records imported"],["782","documents indexed"],["94%","complete"],[String(left), left === 1 ? "requires review" : "require review"]].map(x => h("div", {key:x[1]},
          h("div", {className:"adm-fig", style:x[1].indexOf("review") >= 0 && left ? {color:"var(--warn)"} : null}, x[0]), h("div", {className:"dim", style:{fontSize:12}}, x[1])))),
      h(Bar, {v:.94}),
      h("div", {className:"adm-list", style:{marginTop:12}}, items.map(i => h("div", {key:i.key, style:{padding:"11px 0"}},
        h("div", {className:"row wrap", style:{gap:8}}, h("span", {style:{color:"var(--ink)", fontWeight:500}}, i.title), h("span", {className:"sp1"}),
          i.done ? h(Badge, {k:"ok"}, i.auto ? "Resolved: " + i.done.t : "Resolved by " + i.done.by) : h(Badge, {k:"warn"}, "Review")),
        h("div", {className:"dim", style:{fontSize:12, marginTop:3}}, i.text),
        h("div", {className:"row wrap", style:{gap:8, marginTop:7}},
          i.refs.map((r, x) => h("span", {key:x, className:"adm-rc"}, h(Ref, {r}))), h("span", {className:"sp1"}),
          i.done ? null : i.auto ? h(Btn, {sm:true, k:"pri", onClick:() => MP.go("attention?cat=DATA")}, "Link machine")
            : h(Btn, {sm:true, k:"pri", onClick:() => A.resolveMigration(i.key, i.log, i.refs)}, i.btn)))))));
}

/* ======================================================================
   5. TEAM & PERMISSIONS
   ====================================================================== */
MP.pages.team = {
  title:"Team & Permissions",
  sub:"Who can see and do what. Engineers only ever see their own work.",
  render:(route, S) => h(TeamPage, {route, S})
};
const Y = true, N = false;
const MATRIX = [
  ["Command Centre", Y, Y, N, N],
  ["Service Desk", Y, Y, N, N],
  ["Jobs", "All jobs", "All jobs", "Own jobs only", "View, parts used"],
  ["Dispatch", Y, Y, N, N],
  ["Engineers and locations", Y, Y, "Own location only", N],
  ["Subsistence", "View and review", "View and review", "Own days only", N],
  ["Parts and stock", Y, Y, "Own van, add to own jobs", Y],
  ["Transfers and reorders", Y, Y, N, Y],
  ["Machines", Y, Y, "Machines on own jobs", "View"],
  ["Warranties", Y, Y, N, N],
  ["Customers and documents", Y, Y, "Own jobs only", "Documents only"],
  ["QuickBooks handover", Y, "Send ready jobs", N, N],
  ["Settings and rules", Y, "Rules only", N, N],
  ["AI agents", Y, Y, "Machine history on the phone", "Parts suggestions"]
];
const ROLE_COLS = ["owner","manager","engineer","stores"];
function cell(v){
  if (v === true) return h("span", {title:"Full access", "aria-label":"Full access", style:{color:"var(--ok)", display:"inline-flex"}}, h(Icon, {n:"check", s:15}));
  if (v === false) return h("span", {className:"faint", style:{fontSize:12}}, "No access");
  return h("span", {style:{fontSize:12, color:"var(--body)"}}, v);
}
function TeamPage(p){
  const S = p.S;
  const people = Object.values(S.staff).map(s => ({id:s.id, p:s, role:s.role, title:s.title, uses:"Desktop and tablet", van:null}))
    .concat(Object.values(S.engineers).map(e => ({id:e.id, p:e, role:"engineer", title:"Service engineer, " + e.skills.slice(0, 2).join(", ").toLowerCase(), uses:"Mobile web app", van:e.van, leave:e.leave})));
  const n = (r) => people.filter(x => x.role === r).length;
  return h("div", {className:"g", style:{gap:16}},
    h(Card, {title:"View as", sub:"Switch role to see exactly what each person sees", icon:"team"},
      h("div", {className:"cb row wrap", style:{gap:8}}, Object.keys(MP.ROLES).map(k => h(Btn, {key:k, k:S.role === k ? "pri" : null, onClick:() => { A.role(k); MP.go(MP.ROLES[k].home); }},
        h(Av, {e:MP.ROLES[k].person, s:18}), "View as " + MP.ROLES[k].label)))),
    h(Card, {title:"Roles and access", sub:"Four roles. Everyone signs in as themselves; every action is recorded in Activity.", icon:"rules"},
      h("div", {className:"tbl-wrap"}, h("table", {className:"tbl adm-mx"},
        h("thead", null, h("tr", null, h("th", null, "Area"), ROLE_COLS.map(r => h("th", {key:r}, MP.ROLES[r].label.replace(" (Sean)", ""), h("div", {className:"faint", style:{fontWeight:400}}, plural(n(r), "person", "people")))))),
        h("tbody", null, MATRIX.map(row => h("tr", {key:row[0]}, h("td", {style:{color:"var(--ink)"}}, row[0]), row.slice(1).map((v, i) => h("td", {key:i}, cell(v))))))))),
    h("div", {className:"adm-split"},
      h(Card, {title:"People", sub:plural(people.length, "person", "people") + " with access", icon:"engineers"},
        h(Table, {rows:people, onRow:(r) => r.role === "engineer" ? MP.go("engineers/" + r.id) : null, cols:[
          {t:"Person", r:(r) => h("div", {className:"row", style:{gap:8}}, h(Av, {e:r.p, s:24}), h("span", {style:{color:"var(--ink)"}}, r.p.name))},
          {t:"Role", r:(r) => h(Badge, {k:r.role === "owner" ? "acc" : r.role === "engineer" ? "" : "line"}, r.role === "engineer" ? "Engineer" : MP.ROLES[r.role].label)},
          {t:"Title", r:(r) => h("span", {className:"dim"}, r.title)},
          {t:"Uses", r:(r) => h("span", {className:"dim"}, r.uses)},
          {t:"Van", r:(r) => r.van ? h(F, null, h(Ref, {r:{type:"location", id:r.van}}), r.leave ? h(Badge, {k:"line", style:{marginLeft:6}}, "On leave") : null) : h("span", {className:"faint"}, "None")}
        ]})),
      h(Card, {title:"What engineers never see", sub:"The phone app shows the engineer’s own day and nothing else", icon:"field"},
        h("div", {className:"cb"},
          h("p", {style:{margin:"0 0 12px", color:"var(--body)"}}, "Engineers use only the mobile web app. No desktop screens, no management views."),
          h("ul", {className:"adm-ul"}, ["Other engineers’ locations or travel","Anyone else’s subsistence","Prices, job values or estimates","QuickBooks values, invoices or payment status","Needs Attention, Activity or settings"].map(x => h(Li, {key:x, icon:"close", color:"var(--bad)"}, x))),
          h("div", {style:{marginTop:12}}, h(Head, null, "They do see"),
            h("ul", {className:"adm-ul"}, ["Their own jobs, customer contact and machine history","Van stock and parts for their jobs","Their own location record and subsistence days"].map(x => h(Li, {key:x}, x))))))));
}

/* ======================================================================
   6. RULES
   ====================================================================== */
MP.pages.rules = {
  title:"Rules",
  sub:"Subsistence, location tracking, stock and job completion. Changes are recorded in Activity.",
  render:(route, S) => h(RulesPage, {route, S})
};
const MEETING = {radius:10, bands:[{min:5, amount:20},{min:10, amount:50}]};
const RULE_TABS = [["subsistence","Subsistence"],["tracking","Location tracking"],["stock","Stock"],["invoice","Job completion"]];
/* Evaluate selectors under different subsistence rules without saving. The engine memo keys include the rule values. */
function withRules(rules, fn){ const S = MP.get(); const prev = S.rules.subsistence; S.rules.subsistence = Object.assign({}, prev, rules); try { return fn(); } finally { S.rules.subsistence = prev; } }

function RulesPage(p){
  const tab = RULE_TABS.some(t => t[0] === p.route.query.tab) ? p.route.query.tab : "subsistence";
  return h("div", {className:"g", style:{gap:16}},
    h("div", null, h(Tabs, {value:tab, onChange:(k) => MP.go("rules?tab=" + k), items:RULE_TABS})),
    tab === "subsistence" ? h(SubRules, {S:p.S}) : tab === "tracking" ? h(TrackRules, {S:p.S}) : tab === "stock" ? h(StockRules, {S:p.S}) : h(InvoiceRules, {S:p.S}));
}

function monthSummary(list){
  const q = list.filter(r => r.band != null);
  return {days:q.length, total:q.reduce((n, r) => n + r.allowance, 0), engs:new Set(q.map(r => r.eng)).size, b1:q.filter(r => r.band === 0).length, b2:q.filter(r => r.band === 1).length,
    review:list.filter(r => r.status === "Review required").length};
}
function bandText(r){ if (r.status === "On leave" || r.status === "No data") return r.status; if (r.band != null) return "Band " + (r.band + 1) + ", " + U.eur2(r.allowance); return r.exit == null ? "Inside zone" : r.inProgress ? "Running" : "Below threshold"; }
function span(r){ if (r.exit == null) return r.d === TODAY ? "Not out of the zone yet" : "Stayed inside the zone"; return "Out " + U.hm(r.exit) + (r.inProgress ? ", still out" : r.ret != null ? ", back " + U.hm(r.ret) : ", no return"); }

function SubRules(p){
  const S = p.S, saved = S.rules.subsistence;
  const fromRules = (r) => ({radius:String(r.radius), b1m:String(r.bands[0].min), b1a:String(r.bands[0].amount), b2m:String(r.bands[1].min), b2a:String(r.bands[1].amount)});
  const [d, setD] = useState(() => fromRules(saved));
  const set = (k) => (e) => setD(Object.assign({}, d, {[k]:e.target.value}));
  const num = (v) => { const x = parseFloat(v); return isFinite(x) ? x : NaN; };
  const draft = {radius:num(d.radius), bands:[{min:num(d.b1m), amount:num(d.b1a)}, {min:num(d.b2m), amount:num(d.b2a)}]};
  const err = {};
  if (!(draft.radius >= 5 && draft.radius <= 30)) err.radius = "Choose a radius between 5 and 30 km.";
  if (!(draft.bands[0].min > 0 && draft.bands[0].min <= 24)) err.b1m = "Hours between 0 and 24.";
  if (!(draft.bands[1].min > draft.bands[0].min && draft.bands[1].min <= 24)) err.b2m = "Band 2 must start after Band 1.";
  if (!(draft.bands[0].amount >= 0)) err.b1a = "Enter an amount.";
  if (!(draft.bands[1].amount >= 0)) err.b2a = "Enter an amount.";
  const valid = !Object.keys(err).length;
  const same = (a, b) => a.radius === b.radius && a.bands.every((x, i) => b.bands[i] && x.min === b.bands[i].min && x.amount === b.bands[i].amount);
  const dirty = valid && !same(draft, saved), isMeeting = same(saved, MEETING);
  const cur = monthSummary(Q.subMonth("2026-09"));
  const nxt = dirty ? monthSummary(withRules(draft, () => Q.subMonth("2026-09"))) : null;
  const short = withRules(MEETING, () => Q.subMonth("2026-09")).filter(r => r.d !== TODAY && r.exit != null && r.band == null && !r.flags.length && r.away >= 150).sort((a, b) => b.away - a.away)[0];
  const ex = [["sean", TODAY, "The demo day"], ["sean", "2026-09-24", "GPS gap day"]].concat(short ? [[short.eng, short.d, "Short day"]] : []);
  const save = () => { A.setRules({radius:draft.radius, bands:draft.bands.map(b => ({min:b.min, amount:b.amount}))});
    const m = monthSummary(Q.subMonth("2026-09")); MP.toast("Subsistence rules saved", "September now: " + m.days + " qualifying days, " + U.eur2(m.total) + ".", "ok"); };
  const reset = () => { setD(fromRules(MEETING)); A.setRules({radius:MEETING.radius, bands:MEETING.bands.map(b => Object.assign({}, b))}); MP.toast("Meeting figures restored", "10 km, 5 hours €20, 10 hours €50.", "ok"); };
  const inp = (k, label, suffix, step) => h("div", {className:"fld"}, h("label", {className:"lbl", htmlFor:"adm-" + k}, label),
    h("div", {className:"row", style:{gap:6}}, h("input", {id:"adm-" + k, className:"in", type:"number", inputMode:"decimal", step:step || 1, min:0, value:d[k], onChange:set(k), "aria-invalid":!!err[k], style:{maxWidth:120}}), h("span", {className:"dim"}, suffix)),
    err[k] ? h("div", {className:"adm-err"}, err[k]) : null);
  const delta = (a, b, fmt) => b == null || a === b ? null : h("span", {className:"mono", style:{color:b > a ? "var(--ok)" : "var(--warn)", marginLeft:6, fontSize:12}}, (b > a ? "+" : "") + fmt(b - a));
  return h("div", {className:"adm-rules"},
    h(Card, {title:"Subsistence rule", sub:"How Pulse turns time outside the zone into an allowance", icon:"subsistence", right:h(Badge, {k:"acc"}, "CONFIGURABLE RULE")},
      h("div", {className:"cb"},
        h("div", {className:"confirm", style:{marginBottom:14, background:"var(--warn-soft)", borderColor:"var(--warn-soft)"}}, h("div", {style:{color:"var(--body)", fontSize:12.5}}, "Figures are illustrative, taken from the meeting. Confirm with payroll before go-live.")),
        h(UI.Field, {label:"Base location"}, h("div", {style:{color:"var(--ink)"}}, saved.base)),
        h("div", {className:"fld"}, h("label", {className:"lbl", htmlFor:"adm-radius"}, "Qualifying radius"),
          h("div", {className:"row", style:{gap:10}},
            h("input", {type:"range", className:"adm-range", min:5, max:30, step:1, value:isFinite(draft.radius) ? draft.radius : 10, onChange:set("radius"), "aria-label":"Qualifying radius slider"}),
            h("input", {id:"adm-radius", className:"in", type:"number", min:5, max:30, value:d.radius, onChange:set("radius"), style:{width:74}}), h("span", {className:"dim"}, "km")),
          err.radius ? h("div", {className:"adm-err"}, err.radius) : h("div", {className:"faint", style:{fontSize:11.5, marginTop:4}}, "Time counts from the first exit to the final return across this circle, whether or not the stop is billable.")),
        h("div", {className:"sec", style:{marginTop:6}}, "Band 1"),
        h("div", {className:"adm-2", style:{gap:"0 14px"}}, inp("b1m", "Minimum time away", "hours", .5), inp("b1a", "Allowance", "€ per day", 1)),
        h("div", {className:"sec"}, "Band 2"),
        h("div", {className:"adm-2", style:{gap:"0 14px"}}, inp("b2m", "Minimum time away", "hours", .5), inp("b2a", "Allowance", "€ per day", 1)),
        h("div", {className:"row wrap", style:{gap:8, marginTop:4}},
          h(Btn, {k:"pri", disabled:!dirty, onClick:save}, "Save rules"),
          dirty ? h(Btn, {k:"ghost", onClick:() => setD(fromRules(saved))}, "Discard changes") : null,
          h("span", {className:"sp1"}),
          h(Btn, {k:"ghost", icon:"reset", disabled:isMeeting && !dirty, onClick:reset}, "Reset to meeting figures")),
        h("div", {className:"faint", style:{fontSize:11.5, marginTop:10}}, "Pulse produces the subsistence report for payroll. It does not pay anyone."))),
    h(Card, {title:"Preview: September 2026", sub:dirty ? "Saved rules compared with your changes. Nothing changes until you save." : "Live results under the saved rules. Change a figure to compare.", icon:"history",
        right:h(Btn, {sm:true, k:"ghost", onClick:() => MP.go("subsistence/report")}, "Monthly report")},
      h("div", {className:"cb"},
        h("div", {className:"adm-cmp"},
          [["Qualifying days", cur.days, nxt && nxt.days, String], ["Total allowances", cur.total, nxt && nxt.total, U.eur2], ["Band 1 days", cur.b1, nxt && nxt.b1, String], ["Band 2 days", cur.b2, nxt && nxt.b2, String]].map(x => h("div", {key:x[0]},
            h("div", {className:"adm-fig"}, x[3](x[2] != null ? x[2] : x[1]), delta(x[1], x[2], x[3])),
            h("div", {className:"dim", style:{fontSize:12}}, x[0], x[2] != null && x[2] !== x[1] ? h("span", {className:"faint"}, ", was " + x[3](x[1])) : null)))),
        h("div", {className:"faint", style:{fontSize:11.5, marginTop:8}}, plural(cur.engs, "engineer") + " qualifying under the saved rules. " + plural(cur.review, "day") + " still need review. Today’s figures are still running."),
        h("div", {style:{marginTop:16}}, h(Head, null, "Example days"),
          ex.map(e => { const rs = Q.subDay(e[0], e[1]), rn = dirty ? withRules(draft, () => Q.subDay(e[0], e[1])) : null, show = rn || rs;
            return h("div", {key:e[0] + e[1], className:"adm-ex"},
              h("div", {style:{minWidth:0}}, h("div", {style:{color:"var(--ink)"}}, Q.eng(e[0]).name.split(" ")[0] + ", " + U.wdm(e[1])), h("div", {className:"faint", style:{fontSize:11.5}}, e[2])),
              h("div", {className:"dim", style:{fontSize:12}}, span(show)),
              h("span", {className:"mono"}, show.exit != null ? U.dur(show.away) : "0m"),
              h("div", {style:{fontSize:12}}, h("div", {className:"faint", style:{fontSize:10.5}}, dirty ? "Saved" : "Result"), h("span", {style:{color:rs.band != null ? "var(--ok)" : "var(--dim)"}}, bandText(rs))),
              h("div", {style:{fontSize:12}}, rn ? h(F, null, h("div", {className:"faint", style:{fontSize:10.5}}, "With changes"),
                h("span", {style:{color:rn.allowance !== rs.allowance ? "var(--accent)" : "var(--dim)", fontWeight:rn.allowance !== rs.allowance ? 600 : 400}}, bandText(rn))) : h("span", {className:"faint"}, rs.status)));
          })))));
}

function TrackRules(p){
  const S = p.S, t = S.rules.tracking;
  const [from, setFrom] = useState(t.from), [to, setTo] = useState(t.to);
  const ok = /^\d\d:\d\d$/.test(from) && /^\d\d:\d\d$/.test(to) && U.toMin(from) < U.toMin(to);
  const on = S.clock >= U.toMin(t.from) && S.clock <= U.toMin(t.to);
  const leave = Object.values(S.engineers).filter(e => e.leave);
  return h("div", {className:"adm-split", style:{gridTemplateColumns:"minmax(0,1.3fr) minmax(280px,1fr)"}},
    h(Card, {title:"Location tracking", sub:"Privacy rules for engineer location", icon:"subsistence", right:h(Badge, {k:on ? "ok" : "line", dot:on}, on ? "TRACKING ACTIVE" : "OUTSIDE HOURS")},
      h("div", {className:"cb"},
        h(KV, {rows:[["Status", "Active " + t.from + " to " + t.to + " on working days"], ["Reason", t.reason], ["Retention", t.retention + " days, then deleted"],
          ["Engineers", "Can see their own location record and subsistence days"], ["Not tracked", "Outside working hours, or on leave" + (leave.length ? " (" + leave.map(e => e.name).join(", ") + " today)" : "")],
          ["Management", "Sees location only in the context of working activity: dispatch, jobs and subsistence"]]}))),
    h(Card, {title:"Working hours", sub:"Location is recorded only inside these hours", icon:"clock"},
      h("div", {className:"cb"},
        h("div", {className:"adm-2", style:{gap:"0 14px"}},
          h(UI.Field, {label:"From", id:"adm-tf"}, h("input", {id:"adm-tf", className:"in", type:"time", value:from, onChange:(e) => setFrom(e.target.value)})),
          h(UI.Field, {label:"To", id:"adm-tt"}, h("input", {id:"adm-tt", className:"in", type:"time", value:to, onChange:(e) => setTo(e.target.value)}))),
        !ok ? h("div", {className:"adm-err", style:{marginBottom:8}}, "The end time must be after the start time.") : null,
        h("div", {className:"row", style:{gap:8}}, h(Btn, {k:"pri", disabled:!ok || (from === t.from && to === t.to), onClick:() => A.saveTracking({from, to})}, "Save hours"),
          from !== t.from || to !== t.to ? h(Btn, {k:"ghost", onClick:() => { setFrom(t.from); setTo(t.to); }}, "Discard") : null))));
}

function StockRules(p){
  const S = p.S, low = Q.lowStock();
  const near = Object.values(S.parts).map(P => ({P, tot:Q.stockTotal(P.sku), open:Q.openReorder(P.sku)})).filter(x => x.tot <= x.P.reorder).sort((a, b) => (a.tot - a.P.reorder) - (b.tot - b.P.reorder));
  const vans = Object.values(S.locations).filter(l => l.kind === "van").map(l => ({l, lines:Object.keys(S.vanMin[l.id] || {}).length, below:low.filter(x => x.kind === "van" && x.loc === l.id)}));
  return h("div", {className:"adm-split", style:{gridTemplateColumns:"minmax(0,1.3fr) minmax(300px,1fr)"}},
    h(Card, {title:"Reorder on total across locations", sub:"A part is flagged when Main Stores plus every van falls below its reorder level", icon:"parts", right:h(Badge, {k:"ok"}, "ACTIVE")},
      h("div", {className:"cb dim", style:{paddingBottom:10}}, "The Parts Assistant suggests a reorder with quantity and supplier. A person creates the request; the order itself is placed in QuickBooks."),
      h(Table, {rows:near.map(x => Object.assign({id:x.P.sku}, x)), onRow:(r) => MP.go("parts/" + r.id), empty:"Every part is above its reorder level", cols:[
        {t:"Part", r:(r) => h("div", null, h("span", {className:"mono", style:{color:"var(--ink)"}}, r.P.sku), h("div", {className:"faint", style:{fontSize:11.5}}, r.P.name))},
        {t:"Total", num:true, r:(r) => h("span", {className:"mono"}, r.tot)},
        {t:"Reorder level", num:true, r:(r) => h("span", {className:"mono dim"}, r.P.reorder)},
        {t:"Status", r:(r) => r.open ? h(Badge, {k:"line"}, r.open.id + " " + r.open.status.toLowerCase()) : r.tot < r.P.reorder ? h(Badge, {k:"warn"}, "Reorder required") : h(Badge, null, "At level")}
      ]})),
    h(Card, {title:"Van minimums", sub:"Each van carries a minimum for the parts its engineer uses most", icon:"engineers", right:h(Badge, {k:"ok"}, "ACTIVE")},
      h("div", {className:"adm-list", style:{borderTop:"1px solid var(--border)"}}, vans.map(v => h("div", {key:v.l.id, className:"row", style:{padding:"9px 18px", gap:10}},
        h(Ref, {r:{type:"location", id:v.l.id}}), h("span", {className:"faint", style:{fontSize:12}}, Q.eng(v.l.eng).name), h("span", {className:"sp1"}),
        h("span", {className:"mono faint"}, v.lines + " lines"),
        v.below.length ? h(Badge, {k:"warn", title:v.below.map(b => b.sku + " " + b.qty + " of " + b.min).join(", ")}, v.below.length + " below") : h(Badge, {k:"ok"}, "OK"))))));
}

const CHECK_HELP = {machine:"The job is linked to a machine with a serial.", labour:"Time on site recorded from job start and finish.", travel:"Travel time recorded from departure and arrival.",
  parts:"Parts scanned or entered, or the engineer confirmed none were used.", report:"The engineer’s completion report is filled in.", photos:"At least one photo on the job.", signoff:"Customer signature or confirmation by phone."};
function InvoiceRules(p){
  const S = p.S, R0 = S.rules.invoice;
  const pending = Object.values(S.jobs).filter(j => ["Engineer Complete","Review Required"].indexOf(j.status) >= 0);
  const checks = Q.jobChecks({machine:"x", parts:[], docs:[], photos:0, date:"", eng:null});
  return h("div", {className:"adm-split", style:{gridTemplateColumns:"minmax(0,1.3fr) minmax(280px,1fr)"}},
    h(Card, {title:"Job completion checks", sub:"Every check must pass before a job can be Ready for Invoice", icon:"check", right:h(Badge, {k:"ok"}, "ACTIVE")},
      h("div", {className:"adm-list", style:{borderTop:"1px solid var(--border)"}}, checks.map((c, i) => { const fails = pending.filter(j => !Q.jobChecks(j).find(x => x.k === c.k).ok);
        return h("div", {key:c.k, className:"row", style:{padding:"10px 18px", gap:12, alignItems:"flex-start"}},
          h("span", {className:"mono faint", style:{width:18, paddingTop:1}}, String(i + 1)),
          h("div", {style:{flex:1, minWidth:0}}, h("div", {style:{color:"var(--ink)"}}, c.label), h("div", {className:"dim", style:{fontSize:12}}, CHECK_HELP[c.k])),
          fails.length ? h("div", {className:"row wrap", style:{gap:6, justifyContent:"flex-end"}}, h(Badge, {k:"warn"}, "Holding " + fails.length), fails.map(j => h("span", {key:j.id, className:"adm-rc"}, h(Ref, {r:{type:"job", id:j.id}}))))
            : h(Badge, {k:"ok"}, "Nothing held")); })),
      h("div", {className:"cb faint", style:{paddingTop:10, fontSize:11.5}}, "A failed check holds the job for review. Warranty and non-billable jobs never go to QuickBooks.")),
    h(Card, {title:"Rates used for estimates", sub:"For the estimated value shown on jobs", icon:"qb"},
      h("div", {className:"cb"},
        h(KV, {rows:[["Labour", U.eur(R0.labour) + " per hour"], ["Travel", U.eur(R0.travel) + " per hour"], ["Call-out", U.eur(R0.callout) + " per breakdown"], ["Parts", "Cost plus 40%"]]}),
        h("div", {className:"confirm", style:{marginTop:14}}, h("div", {style:{color:"var(--body)"}}, "Estimates only. Prices on the invoice come from QuickBooks.")))));
}
})();
