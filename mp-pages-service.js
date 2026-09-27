/* Myers Pulse: Service Desk, Jobs and Dispatch.
   Registers MP.pages.desk, MP.pages.jobs, MP.pages.dispatch.
   Every number comes from MP.q; every change goes through MP.act. */
(function(){
"use strict";
const MP = window.MP, h = MP.h, F = MP.F, U = MP.util, Q = MP.q, A = MP.act, UI = MP.ui;
const {Card, Badge, Status, Prio, Btn, Av, Ref, Icon, Table, Tabs, KV, Empty, Skel, Timeline, QR, cx} = UI;
const R = window.React;
const TODAY = U.TODAY;

/* ---------- page styles (one tag, svc- prefix) ---------- */
const CSS = `
.svc-split{display:grid;grid-template-columns:minmax(280px,350px) minmax(0,1fr);gap:14px;align-items:start}
.svc-inbox{position:sticky;top:0}
.svc-rq{display:grid;grid-template-columns:30px minmax(0,1fr) auto;gap:10px;width:100%;text-align:left;background:none;border:0;border-top:1px solid var(--border);padding:12px 16px;color:inherit;font:inherit;cursor:pointer;transition:background .15s var(--ease)}
.svc-rq:hover{background:var(--surface-faint)}
.svc-rq.on{background:var(--accent-faint)}
.svc-rq:focus-visible{outline:2px solid var(--accent);outline-offset:-2px}
.svc-rq-from{display:block;color:var(--ink);font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.svc-rq-sub{display:block;color:var(--dim);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px}
.svc-ch{width:30px;height:30px;border-radius:10px;background:var(--surface-2);display:inline-flex;align-items:center;justify-content:center;color:var(--dim);flex:none}
.svc-quote{margin:0;padding:12px 14px;border-radius:12px;background:var(--surface-faint);border:1px solid var(--border);color:var(--body);white-space:pre-wrap;line-height:1.6;font-size:13px}
.svc-k{font-family:var(--mono);font-size:10px;letter-spacing:.1em;color:var(--accent);text-transform:uppercase}
.svc-fl{font-family:var(--mono);font-size:10px;letter-spacing:.1em;color:var(--faint);text-transform:uppercase}
.svc-fields{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;background:var(--border);border:1px solid var(--border);border-radius:12px;overflow:hidden}
.svc-f{padding:11px 13px;background:linear-gradient(var(--surface),var(--surface)),var(--bg);min-width:0}
.svc-f .v{margin-top:5px;color:var(--ink);min-height:21px}
.svc-conf{display:inline-flex;align-items:center;gap:6px;margin-top:6px;font-family:var(--mono);font-size:10.5px}
.svc-conf i{display:block;width:30px;height:4px;border-radius:4px;background:var(--track);overflow:hidden}
.svc-conf i b{display:block;height:100%;background:currentColor;transform-origin:left}
.svc-tri3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0;margin-top:14px;border-top:1px solid var(--border)}
.svc-tri3>div{padding:12px 14px 2px 0;min-width:0}
.svc-tri3>div+div{padding-left:14px;border-left:1px solid var(--border)}
.svc-ai{border-color:var(--accent-line);background:linear-gradient(160deg,var(--accent-faint),transparent 70%),var(--surface);padding:16px 18px}
.svc-why{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.svc-why li{display:flex;gap:8px;align-items:flex-start;color:var(--body)}
.svc-why li svg{color:var(--ok);margin-top:2px;flex:none}
.svc-why li.against svg{color:var(--warn)}
.svc-rank{display:grid}
.svc-rank-row{display:flex;align-items:center;gap:10px;padding:9px 0;border-top:1px solid var(--border)}
.svc-rank-row:first-child{border-top:0}
.svc-okic{width:34px;height:34px;border-radius:50%;background:var(--ok-soft);color:var(--ok);display:inline-flex;align-items:center;justify-content:center;flex:none}
.svc-inic{width:34px;height:34px;border-radius:50%;background:var(--accent-soft);color:var(--accent);display:inline-flex;align-items:center;justify-content:center;flex:none}
.svc-new{padding:4px 16px 14px;border-top:1px solid var(--border)}
.svc-tabsw{overflow-x:auto;max-width:100%;scrollbar-width:none}
.svc-tabsw::-webkit-scrollbar{display:none}
.svc-search{position:relative;width:280px;max-width:100%}
.svc-search svg{position:absolute;left:11px;top:9px;color:var(--faint);pointer-events:none}
.svc-search .in{padding-left:32px}
.svc-cb{width:16px;height:16px;accent-color:var(--accent);cursor:pointer;margin:0;vertical-align:middle}
.svc-jid{font-size:24px;font-weight:600;letter-spacing:-.02em;color:var(--ink);font-variant-numeric:tabular-nums}
.svc-railw{overflow-x:auto;margin-top:16px}
.svc-rail{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px;min-width:640px}
.svc-st i{display:block;height:4px;border-radius:4px;background:var(--track)}
.svc-st span{display:block;margin-top:7px;font-size:11.5px;color:var(--faint);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.svc-st.done i{background:var(--accent-line)}.svc-st.done span{color:var(--dim)}
.svc-st.cur i{background:var(--accent)}.svc-st.cur span{color:var(--ink);font-weight:600}
.svc-st.skip span{text-decoration:line-through;text-decoration-color:var(--border-strong)}
.svc-rec{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(300px,1fr);gap:14px;align-items:start}
.svc-tiles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.svc-tile{padding:10px 12px;border-radius:12px;background:var(--surface-faint);border:1px solid var(--border);min-width:0}
.svc-tile .v{font-size:17px;font-weight:600;color:var(--ink);font-variant-numeric:tabular-nums;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.svc-chk{list-style:none;margin:0;padding:0;display:grid;gap:7px}
.svc-chk li{display:grid;grid-template-columns:18px 1fr auto;gap:8px;align-items:center}
.svc-chk .y{color:var(--ok)}.svc-chk .n{color:var(--bad)}.svc-chk .p{color:var(--faint)}
.svc-doc{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:4px 12px;align-items:start;padding:10px 0;border-top:1px solid var(--border)}
.svc-doc:first-child{border-top:0}
.svc-trk{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin:12px 0}
.svc-trk div i{display:block;height:4px;border-radius:4px;background:var(--track)}
.svc-trk div.on i{background:var(--ok)}
.svc-trk div span{display:block;margin-top:6px;font-size:11.5px;color:var(--faint)}
.svc-trk div.on span{color:var(--ink)}
.svc-lines{display:grid;gap:6px}
.svc-lines>div{display:flex;justify-content:space-between;gap:12px;font-size:12.5px}
.svc-lines .tot{border-top:1px solid var(--border);padding-top:8px;margin-top:2px;font-weight:600;color:var(--ink);font-size:14px}
.svc-board-w{overflow-x:auto;padding-bottom:6px}
.svc-board{display:grid;grid-template-columns:repeat(6,minmax(212px,1fr));gap:10px;min-width:1300px}
.svc-col{background:var(--surface-faint);border:1px solid var(--border);border-radius:16px;padding:10px;min-height:460px;display:flex;flex-direction:column;gap:8px;transition:border-color .15s var(--ease),background .15s var(--ease)}
.svc-col.over{border-color:var(--accent-line);background:var(--accent-faint)}
.svc-colh{display:flex;align-items:center;gap:7px;padding:2px 4px 4px}
.svc-colh b{font-family:var(--mono);font-size:10.5px;letter-spacing:.1em;color:var(--dim);font-weight:500}
.svc-card{background:var(--surface-2);border:1px solid var(--border);border-radius:12px;padding:10px 11px;cursor:pointer;transition:border-color .15s var(--ease),opacity .15s var(--ease),transform .15s var(--ease)}
.svc-card:hover{border-color:var(--border-strong)}
.svc-card.drag{opacity:.4}
.svc-card[draggable="true"]{cursor:grab}
.svc-card:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.svc-cc{color:var(--ink);font-weight:600;margin-top:7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.svc-cm{font-size:12px;color:var(--body);margin-top:6px}
.svc-skill{height:20px;font-size:10.5px;padding:0 8px}
.svc-move{height:26px;font-size:11.5px;padding:0 8px;border-radius:8px;margin-top:9px}
.svc-pop{border:1px solid var(--accent-line);background:var(--overlay);border-radius:12px;padding:10px 11px;box-shadow:0 14px 34px rgba(0,0,0,.28)}
.svc-sch{min-width:1040px}
.svc-srow{display:grid;grid-template-columns:210px minmax(0,1fr) 190px;border-top:1px solid var(--border)}
.svc-sinfo{display:flex;align-items:center;gap:10px;padding:10px 14px 10px 18px;min-width:0}
.svc-track{position:relative;min-height:66px;background:linear-gradient(to right,var(--border) 1px,transparent 1px) 0 0/calc(100% / 13) 100%}
.svc-axis{position:relative;height:28px}
.svc-axis span{position:absolute;top:8px;padding-left:4px;font-family:var(--mono);font-size:10.5px;color:var(--faint)}
.svc-axis .nowl{color:var(--accent);transform:translateX(-50%);padding:0 5px;background:var(--bg);border-radius:6px;top:6px}
.svc-blk{position:absolute;top:9px;height:32px;border-radius:8px;padding:0 7px;font:inherit;font-size:11px;line-height:30px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;border:1px solid var(--border-strong);background:var(--surface-3);color:var(--ink);cursor:pointer;text-align:left;z-index:1}
.svc-blk:hover{filter:brightness(1.12)}
.svc-blk:focus-visible{outline:2px solid var(--accent);outline-offset:1px}
.svc-t-acc{background:var(--accent-soft);border-color:var(--accent-line)}
.svc-t-ok{background:var(--ok-soft);border-color:var(--ok)}
.svc-t-warn{background:var(--warn-soft);border-color:var(--warn)}
.svc-t-bad{background:var(--bad-soft);border-color:var(--bad)}
.svc-t-line{background:none;border-color:var(--border-strong);color:var(--dim)}
.svc-leg{position:absolute;top:47px;height:9px;border-radius:5px;background:repeating-linear-gradient(135deg,var(--dim) 0 2px,transparent 2px 5px);opacity:.55}
.svc-leg.fut{background:none;border:1px dashed var(--dim);opacity:.6}
.svc-leg.live{background:repeating-linear-gradient(135deg,var(--accent) 0 2px,transparent 2px 5px);opacity:.8}
.svc-now{position:absolute;top:0;bottom:0;width:0;border-left:1.5px solid var(--accent);z-index:2;pointer-events:none}
.svc-leave{position:absolute;inset:9px 0 9px 0;display:flex;align-items:center;padding-left:14px;color:var(--faint);font-size:12px;background:repeating-linear-gradient(135deg,var(--surface-faint) 0 6px,transparent 6px 12px);border-radius:8px}
.svc-ssum{padding:10px 16px;font-size:11.5px;color:var(--dim);display:grid;gap:2px;align-content:center;border-left:1px solid var(--border)}
.svc-legend{display:flex;flex-wrap:wrap;gap:14px;padding:12px 18px 14px;border-top:1px solid var(--border);font-size:11.5px;color:var(--dim)}
.svc-legend i{display:inline-block;width:22px;height:9px;border-radius:5px;margin-right:6px;vertical-align:-1px}
@media (max-width:1180px){.svc-rec{grid-template-columns:1fr}.svc-tri3{grid-template-columns:1fr}.svc-tri3>div+div{padding-left:0;border-left:0;border-top:1px solid var(--border)}}
@media (max-width:980px){.svc-split{grid-template-columns:1fr}.svc-inbox{position:static}.svc-fields{grid-template-columns:repeat(2,minmax(0,1fr))}}
`;
(function(){ try { if (typeof document === "undefined" || !document.createElement) return; if (document.getElementById && document.getElementById("svc-css")) return;
  const st = document.createElement("style"); st.id = "svc-css"; st.textContent = CSS; document.head.appendChild(st); } catch(e){} })();

/* ---------- shared helpers ---------- */
const DONE = Q.DONE, OPEN = Q.OPEN;
const isOpen = (j) => OPEN.indexOf(j.status) >= 0;
const LOCKED = ["Ready for Invoice","Sent to QuickBooks","Closed"];
const custName = (j) => Q.cust(j.cust).name;
const town = (j) => Q.site(j.site).town.split(",")[0];
const modelName = (j) => j.machine ? Q.model(j.machine).name : null;
const firstName = (n) => String(n || "").split(" ")[0];
const rel = (k) => { const r = U.rel(k); return r === "Tomorrow" || r === "Today" || r === "Yesterday" ? r.toLowerCase() : r; };
const when = (j) => j.date === TODAY ? (j.start ? "Today " + j.start : "Today") : U.dm(j.date) + (j.date.slice(0, 4) !== "2026" ? " " + j.date.slice(0, 4) : "") + (j.start ? " " + j.start : "");
function billing(j){
  if (j.type === "Warranty") return {label:"Warranty", k:"acc"};
  if (!j.billable || j.type === "Site measurement") return {label:"Non-billable", k:"line"};
  return {label:"Chargeable", k:"ok"};
}
function reorderFor(j){
  const a = j.awaiting || {};
  if (a.reorder) return MP.get().reorders.find(r => r.id === a.reorder) || null;
  return a.sku ? Q.openReorder(a.sku) || null : null;
}
function reviewReason(j){
  if (j.reviewReason) return j.reviewReason;
  const f = Q.jobChecks(j).filter(c => !c.ok);
  return f.length ? "Missing: " + f.map(c => c.label.toLowerCase()).join(", ") : "Held for a manager to check before it goes to QuickBooks.";
}
function mini(label, value, color){ return h("div", {className:"svc-tile"}, h("div", {className:"svc-fl"}, label), h("div", {className:"v", style:color ? {color} : null}, value)); }

/* Ranked engineers for a job (Dispatch Assistant). Used by the desk, the job record and dispatch. */
function RankList(p){
  const recs = p.recs || Q.recommend(p.jobId), list = p.limit ? recs.slice(0, p.limit) : recs;
  return h("div", {className:"svc-rank"}, list.map((r, i) => {
    const E = Q.eng(r.eng), cur = p.current === r.eng;
    return h("div", {key:r.eng, className:"svc-rank-row"},
      p.compact ? null : h("span", {className:"mono faint", style:{width:14, textAlign:"right"}}, i + 1),
      h(Av, {e:E, s:p.compact ? 24 : 28}),
      h("div", {style:{minWidth:0, flex:1}},
        h("div", {style:{color:"var(--ink)", fontWeight:500, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}, r.name,
          p.compact ? null : h("span", {className:"faint", style:{fontWeight:400, marginLeft:7, fontSize:12}}, Q.loc(E.van).name + ", ETA " + r.eta)),
        p.compact
          ? h("div", {className:"dim", style:{fontSize:11.5}}, r.against[0] ? h("span", {style:{color:"var(--warn)"}}, r.against[0]) : r.why[0])
          : h(F, null, h("div", {className:"dim", style:{fontSize:12}}, r.why.join(". ")),
              r.against.length ? h("div", {style:{fontSize:12, color:"var(--warn)"}}, r.against.join(". ")) : null)),
      cur ? h(Badge, {k:"ok"}, "Assigned")
        : h(Btn, {sm:true, k:i === 0 ? "pri" : null, onClick:() => p.onPick(r.eng), "aria-label":"Assign " + r.name}, "Assign"));
  }));
}

/* AI suggestion: recommended engineer with reasons. A person clicks Assign. */
function Suggest(p){
  const [choose, setChoose] = R.useState(!!p.open);
  const recs = Q.recommend(p.jobId), top = recs[0];
  if (!top) return null;
  const E = Q.eng(top.eng);
  const show = choose || p.open;
  return h("div", {className:"card svc-ai anim"},
    h("div", {className:"row wrap", style:{gap:8}}, h("span", {className:"svc-k"}, "AI suggestion"), h(Badge, {k:"acc"}, "Dispatch Assistant"), h("span", {className:"sp1"}),
      h("span", {className:"mono faint", title:"Arguments hash. Assign replays exactly these arguments."}, "jobs.assign · args " + U.hash({job:p.jobId, engineer:top.eng}))),
    h("div", {className:"row", style:{gap:12, marginTop:12}}, h(Av, {e:E, s:42}),
      h("div", {style:{minWidth:0}}, h("div", {className:"dim", style:{fontSize:12}}, "Recommended engineer"),
        h("div", {style:{fontSize:17, fontWeight:600, color:"var(--ink)", letterSpacing:"-.01em"}}, E.name),
        h("div", {className:"faint", style:{fontSize:12}}, Q.loc(E.van).name + ". ETA on site about " + top.eta + "."))),
    h("div", {className:"sec", style:{marginTop:14}}, "Why"),
    h("ul", {className:"svc-why"}, top.why.map(w => h("li", {key:w}, h(Icon, {n:"check", s:14}), w)),
      top.against.map(w => h("li", {key:w, className:"against"}, h(Icon, {n:"alert", s:14}), w))),
    h("div", {className:"row wrap", style:{gap:8, marginTop:14}},
      h(Btn, {k:"pri", icon:"check", onClick:() => A.assign(p.jobId, top.eng)}, "Assign " + firstName(E.name)),
      h(Btn, {onClick:() => setChoose(!show), "aria-expanded":show}, show ? "Hide the ranking" : "Choose another"),
      h("span", {className:"faint", style:{fontSize:12}}, "Nothing is sent until you assign.")),
    show ? h("div", {style:{marginTop:12, borderTop:"1px solid var(--border)", paddingTop:4}}, h(RankList, {recs, onPick:(e) => A.assign(p.jobId, e)})) : null);
}

/* ======================================================================
   1. SERVICE DESK
   ====================================================================== */
const CH_ICON = {Email:"M4 6.5h16v11H4z M4.6 7.2l7.4 5.6 7.4-5.6", Phone:"phone",
  Website:"M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17Z M3.5 12h17 M12 3.5c2.3 2.4 3.4 5.2 3.4 8.5s-1.1 6.1-3.4 8.5c-2.3-2.4-3.4-5.2-3.4-8.5S9.7 5.9 12 3.5Z", Manual:"note"};
const RQ_TONE = {"New":"acc", "Triaged":"warn", "Job created":"ok", "Linked":"line", "Awaiting customer":"line"};
const needsAction = (r) => r.status === "New" || r.status === "Triaged";
const rqTime = (r) => r.d === TODAY ? r.at : U.WD[U.weekday(r.d)] + " " + r.at;
const rqWho = (r) => r.ai && r.ai.cust ? Q.cust(r.ai.cust).name : r.from;

MP.pages.desk = {
  title:"Service Desk",
  sub:(r, S) => { const n = S.requests.filter(needsAction).length; return n ? n + " request" + (n === 1 ? "" : "s") + " need action. AI triage reads each one; people decide." : "Inbox clear. AI triage reads each new request as it lands."; },
  render:(route, S) => h(Desk, {S, route})
};

function Desk(p){
  const S = p.S, route = p.route;
  const [filter, setFilter] = R.useState("action");
  const [adding, setAdding] = R.useState(false);
  const [analysing, setAnalysing] = R.useState(null);
  R.useEffect(() => { if (!analysing) return; const t = setTimeout(() => setAnalysing(null), 700); return () => clearTimeout(t); }, [analysing]);
  const all = S.requests.slice().sort((a, b) => (b.d + b.at).localeCompare(a.d + a.at));
  const act = all.filter(needsAction);
  const list = filter === "action" ? act : all;
  const selId = route.parts[0] || "RQ-3107";
  const r = Q.request(selId);
  return h("div", {className:"svc-split"},
    h(Card, {className:"svc-inbox", title:"Inbox", sub:"Email, phone, website and manual", icon:"desk",
        right:h(Btn, {sm:true, icon:"plus", onClick:() => setAdding(!adding), "aria-expanded":adding}, "New request")},
      adding ? h(NewRequest, {onCancel:() => setAdding(false), onDone:(id) => { setAdding(false); setFilter("all"); setAnalysing(id); MP.go("desk/" + id); }}) : null,
      h("div", {style:{padding:"0 16px 12px"}}, h(Tabs, {value:filter, onChange:setFilter, items:[["action","Needs action",act.length],["all","All",all.length]]})),
      list.length ? list.map(x => h(RequestRow, {key:x.id, r:x, on:r && x.id === r.id}))
        : h("div", {style:{borderTop:"1px solid var(--border)"}}, h(Empty, {title:"Nothing needs action", icon:"check"}, "New email, calls and web requests appear here, already triaged."))),
    r ? h(RequestDetail, {key:r.id, S, r, analysing:analysing === r.id})
      : h(Card, {pad:true}, h(Empty, {title:"Request not found", icon:"desk"}, "Pick a request from the inbox.")));
}

function RequestRow(p){
  const r = p.r;
  return h("button", {type:"button", className:cx("svc-rq", p.on && "on"), onClick:() => MP.go("desk/" + r.id), "aria-current":p.on ? "true" : null},
    h("span", {className:"svc-ch", title:r.channel}, h(Icon, {n:CH_ICON[r.channel] || "note", s:15})),
    h("span", {style:{minWidth:0}},
      h("span", {className:"svc-rq-from"}, rqWho(r)),
      h("span", {className:"svc-rq-sub"}, r.subject),
      h("span", {className:"row", style:{gap:6, marginTop:6}}, h(Badge, {k:RQ_TONE[r.status] || ""}, r.status), h("span", {className:"faint", style:{fontSize:11}}, r.channel))),
    h("span", {className:"mono faint"}, rqTime(r)));
}

function NewRequest(p){
  const [ch, setCh] = R.useState("Phone"), [from, setFrom] = R.useState(""), [body, setBody] = R.useState("");
  const submit = (e) => { e.preventDefault(); if (!body.trim()) return; const id = A.newRequest({channel:ch, from:from.trim() || "Manual entry", body:body.trim()}); p.onDone(id); };
  return h("form", {className:"svc-new anim", onSubmit:submit},
    h("div", {className:"g", style:{gridTemplateColumns:"110px minmax(0,1fr)", gap:10, marginTop:12}},
      h("div", null, h("label", {className:"lbl", htmlFor:"svc-nr-ch"}, "Channel"),
        h("select", {id:"svc-nr-ch", className:"sel", value:ch, onChange:(e) => setCh(e.target.value)}, ["Phone","Email","Website","Manual"].map(c => h("option", {key:c, value:c}, c)))),
      h("div", null, h("label", {className:"lbl", htmlFor:"svc-nr-from"}, "From"),
        h("input", {id:"svc-nr-from", className:"in", value:from, onChange:(e) => setFrom(e.target.value), placeholder:"Name, company"}))),
    h("div", {style:{marginTop:10}}, h("label", {className:"lbl", htmlFor:"svc-nr-body"}, "Message"),
      h("textarea", {id:"svc-nr-body", className:"ta", rows:4, value:body, onChange:(e) => setBody(e.target.value), placeholder:"Paste the email or type what the caller said. Include the site and machine if you have them."})),
    h("div", {className:"row", style:{marginTop:10, gap:8}},
      h(Btn, {k:"pri", sm:true, type:"submit", disabled:!body.trim()}, "Add and triage"),
      h(Btn, {k:"ghost", sm:true, onClick:p.onCancel}, "Cancel")));
}

function draftReply(r){
  const ai = r.ai || {}, c = ai.cust ? Q.cust(ai.cust) : null;
  const first = c && c.contacts[0] ? firstName(c.contacts[0].name) : "there";
  const dup = ai.duplicateOf ? Q.job(ai.duplicateOf) : null;
  let ask;
  if (ai.needsInfo){
    ask = ai.needsInfo;
    if (dup && dup.awaiting){ const ro = reorderFor(dup), P = Q.part(dup.awaiting.sku);
      ask += " If it is, that fault is already open as Job #" + dup.id + (P ? " and the replacement " + P.name.split(",")[0].toLowerCase() : "") + (ro ? " is due " + U.wdm(ro.eta) : " is on order") + "."; }
  } else if (!ai.machine) ask = "Could you tell us which machine it is? The serial number is on the plate beside the control panel.";
  else ask = "Could you send a short video or photo of the fault and tell us roughly when it started?";
  return "Hi " + first + ",\n\nThanks for getting in touch. " + ask + "\n\nMyers Service\nservice@myers.ie";
}

function RequestDetail(p){
  const S = p.S, r = p.r, ai = r.ai || {};
  const job = r.job ? Q.job(r.job) : null;
  const dup = ai.duplicateOf && r.status !== "Linked" && !job ? Q.job(ai.duplicateOf) : null;
  const [compose, setCompose] = R.useState(!!(ai.needsInfo && r.status === "New"));
  const [choose, setChoose] = R.useState(false);
  const recJob = job && !job.eng && isOpen(job) ? job : null;
  const rec = recJob ? Q.recommend(recJob.id)[0] : null;
  const vanEng = rec ? rec.eng : job && job.eng ? job.eng : ai.eng || null;
  const info = () => setCompose(true);
  let action = null;
  if (r.status === "Linked" && job) action = h(LinkedCard, {r, job});
  else if (dup) action = h(DupCard, {S, r, job:dup, onInfo:compose || r.reply ? null : info});
  else if (job && job.draft) action = h(F, null, h(DraftCard, {job, onAssign:() => setChoose(true), onInfo:info}), h(Suggest, {key:"s" + choose, jobId:job.id, open:choose}));
  else if (job && !job.eng && isOpen(job)) action = h(F, null, h(CreatedCard, {job, onInfo:info}), h(Suggest, {jobId:job.id}));
  else if (job && job.eng) action = h(AssignedCard, {job});
  else if (job) action = h(CreatedCard, {job, onInfo:info});
  else action = h(NextStep, {r, onInfo:info});
  return h("div", {className:"g", style:{gap:14}},
    h(Card, {pad:true},
      h("div", {className:"row", style:{gap:10, alignItems:"flex-start"}},
        h("span", {className:"svc-ch"}, h(Icon, {n:CH_ICON[r.channel] || "note", s:15})),
        h("div", {style:{minWidth:0, flex:1}}, h("div", {style:{fontSize:15.5, fontWeight:600, color:"var(--ink)", letterSpacing:"-.01em"}}, r.subject),
          h("div", {className:"dim", style:{fontSize:12, marginTop:1}}, r.from + (r.fromAddr && r.fromAddr !== r.from ? ", " + r.fromAddr : ""))),
        h(Badge, {k:RQ_TONE[r.status] || ""}, r.status)),
      h("div", {className:"row wrap mono faint", style:{gap:16, margin:"10px 0 10px"}}, h("span", null, r.id), h("span", null, r.channel), h("span", null, U.rel(r.d) + " " + r.at)),
      h("blockquote", {className:"svc-quote"}, r.body)),
    p.analysing ? h(Analysing) : h(Triage, {S, r, vanEng, job, dup}),
    p.analysing ? null : action,
    compose && !r.reply && !p.analysing ? h(Composer, {r, onClose:() => setCompose(false)}) : null,
    r.reply ? h(Card, {pad:true},
      h("div", {className:"row", style:{gap:10}}, h("span", {className:"svc-inic"}, h(Icon, {n:"arrow", s:16})),
        h("div", null, h("div", {style:{fontWeight:600, color:"var(--ink)"}}, "Reply sent from service@myers.ie"), h("div", {className:"dim", style:{fontSize:12}}, "Waiting for the customer. Their answer lands back on " + r.id + "."))),
      h("blockquote", {className:"svc-quote", style:{marginTop:12}}, r.reply)) : null);
}

function Analysing(){
  return h(Card, {pad:true},
    h("div", {className:"row", style:{gap:8}}, h("span", {className:"svc-k"}, "AI triage"), h("span", {className:"dim"}, "Analysing the request: customer, site, machine, urgency")),
    h("div", {className:"svc-fields", style:{marginTop:12}}, [0,1,2,3,4,5].map(i => h("div", {key:i, className:"svc-f"}, h(Skel, {w:60, h:9}), h(Skel, {w:"75%", h:13, style:{marginTop:9}}), h(Skel, {w:40, h:5, style:{marginTop:9}})))),
    h("div", {className:"g", style:{gridTemplateColumns:"1fr 1fr 1fr", marginTop:14}}, [0,1,2].map(i => h("div", {key:i}, h(Skel, {w:90, h:9}), h(Skel, {h:11, style:{marginTop:10}}), h(Skel, {w:"60%", h:11, style:{marginTop:6}})))));
}

function Conf(p){
  if (p.v == null) return null;
  const c = p.v >= .85 ? "var(--ok)" : p.v >= .65 ? "var(--warn)" : "var(--bad)";
  return h("span", {className:"svc-conf", style:{color:c}, title:"AI confidence " + Math.round(p.v * 100) + "%"}, h("i", null, h("b", {style:{transform:"scaleX(" + p.v + ")"}})), Math.round(p.v * 100) + "%");
}
function Field(p){ return h("div", {className:"svc-f"}, h("div", {className:"svc-fl"}, p.l), h("div", {className:"v"}, p.children), h(Conf, {v:p.c})); }
const miss = (t) => h("span", {style:{color:"var(--warn)"}}, t);

function Triage(p){
  const S = p.S, r = p.r, ai = r.ai || {}, conf = ai.conf || {};
  const m = ai.machine ? Q.mach(ai.machine) : null, M = m ? Q.model(m.id) : null;
  const similar = (ai.similar || []).map(id => Q.job(id)).filter(Boolean);
  const van = p.vanEng ? Q.eng(p.vanEng).van : null;
  const aiT = (p.job && (p.job.timeline.find(e => e.kind === "ai") || {}).t) || null;
  return h(Card, {pad:true},
    h("div", {className:"row wrap", style:{gap:8}}, h("span", {className:"svc-k"}, "AI triage"), h(Badge, {k:"acc"}, "Service Coordinator"),
      h("span", {className:"faint", style:{fontSize:12}}, aiT ? "Read at " + aiT + ", from the message and Myers records" : "Read from the message and Myers records"),
      h("span", {className:"sp1"}), h(Btn, {sm:true, k:"ghost", icon:"chat", onClick:() => MP.openAI(m ? "Show me every issue we've had with " + (Q.cust(m.cust).name.split(" ")[0]) + "'s " + m.model + "." : "What jobs are still open today?")}, "Ask about this")),
    h("div", {className:"svc-fields", style:{marginTop:12}},
      h(Field, {l:"Customer", c:conf.cust}, ai.cust ? h(Ref, {r:{type:"customer", id:ai.cust}}) : miss("Not recognised")),
      h(Field, {l:"Site", c:conf.site}, ai.site ? h(F, null, h(Ref, {r:{type:"site", id:ai.site}}), h("div", {className:"faint", style:{fontSize:11.5}}, Q.site(ai.site).town)) : miss("Not identified")),
      h(Field, {l:"Machine", c:conf.machine}, m ? h(F, null, h(Ref, {r:{type:"machine", id:m.id}}, M.name), h("div", {className:"faint", style:{fontSize:11.5}}, M.type)) : miss("Not confirmed")),
      h(Field, {l:"Serial", c:conf.machine}, m ? h(Ref, {r:{type:"machine", id:m.id}}, h("span", {className:"mono", style:{fontSize:12.5}}, m.id)) : miss(ai.needsInfo ? "Ask the customer" : "Not given")),
      h(Field, {l:"Urgency", c:conf.urgency}, h(Prio, {p:ai.urgency || "Normal"})),
      h(Field, {l:"AI classification"}, ai.cls || "Needs more detail")),
    h("div", {className:"svc-tri3"},
      h("div", null, h("div", {className:"sec"}, "Similar past faults"),
        similar.length ? similar.map(j => h("div", {key:j.id, style:{marginBottom:8}},
            h("div", {className:"row", style:{gap:8}}, h(Ref, {r:{type:"job", id:j.id}}), h("span", {className:"mono faint"}, U.dmy(j.date))),
            h("div", {className:"dim", style:{fontSize:12, marginTop:2}}, j.resolution || j.issue),
            j.parts.length ? h("div", {className:"faint", style:{fontSize:11.5, marginTop:2}}, "Part: " + j.parts.map(x => x.sku).join(", ") + (j.eng ? ", " + Q.eng(j.eng).name : "")) : null))
          : h("div", {className:"faint", style:{fontSize:12, paddingBottom:10}}, p.dup ? "Same fault already open, see the match below." : m ? "No similar faults on this machine." : "Needs the machine first.")),
      h("div", null, h("div", {className:"sec"}, "Likely parts"),
        (ai.parts || []).length ? ai.parts.map(sku => { const P = Q.part(sku), where = Q.stockBy(sku).filter(x => x.qty > 0), inVan = van ? (S.stock[van][sku] || 0) : null, ro = Q.openReorder(sku);
          return h("div", {key:sku, style:{marginBottom:8}},
            h("div", {className:"row", style:{gap:8}}, h(Ref, {r:{type:"part", id:sku}}), h("span", {className:"dim", style:{fontSize:12, minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}, P.name)),
            van ? h("div", {style:{fontSize:12, marginTop:3, color:inVan > 0 ? "var(--ok)" : "var(--warn)"}}, Q.loc(van).name + " carries " + inVan + (inVan > 0 ? "" : ", not in the van")) : null,
            h("div", {className:"faint", style:{fontSize:11.5, marginTop:1}}, (where.filter(x => x.loc !== van).map(x => Q.loc(x.loc).name + " " + x.qty).join(", ") || "None elsewhere") + (ro ? ". " + ro.id + " due " + rel(ro.eta) : ""))); })
          : h("div", {className:"faint", style:{fontSize:12, paddingBottom:10}}, "None suggested yet.")),
      h("div", null, h("div", {className:"sec"}, "Suggested action"),
        h("div", {className:"row", style:{gap:8, alignItems:"flex-start", color:"var(--ink)"}}, h(Icon, {n:"arrow", s:14, style:{color:"var(--accent)", marginTop:2, flex:"none"}}), ai.action || "Review and decide"),
        ai.needsInfo ? h("div", {className:"faint", style:{fontSize:12, marginTop:6}}, "Question for the customer: " + ai.needsInfo) : null)));
}

function DraftCard(p){
  const j = p.job, aiT = (j.timeline.find(e => e.kind === "ai") || {}).t;
  return h(Card, {pad:true},
    h("div", {className:"row wrap", style:{gap:8}}, h("span", {className:"svc-inic"}, h(Icon, {n:"jobs", s:16})),
      h("div", {style:{minWidth:0, flex:1}}, h("div", {style:{fontSize:15, fontWeight:600, color:"var(--ink)"}}, "Draft Job #" + j.id),
        h("div", {className:"dim", style:{fontSize:12}}, "Drafted by the Service Coordinator" + (aiT ? " at " + aiT : "") + ". Nothing reaches an engineer until you confirm.")),
      h(Status, {j}), h(Prio, {p:j.prio})),
    h(KV, {style:{marginTop:14}, rows:[
      ["Customer", h(F, null, h(Ref, {r:{type:"customer", id:j.cust}}), h("span", {className:"dim"}, ", " + Q.site(j.site).name))],
      ["Machine", j.machine ? h(F, null, h(Ref, {r:{type:"machine", id:j.machine}}, modelName(j)), h("span", {className:"mono dim", style:{marginLeft:8}}, j.machine)) : miss("Not identified")],
      ["Issue", j.issue],
      ["Skill needed", j.skill || "Not set"],
      ["Suggested slot", j.start ? "Today, from " + j.start + ", about " + U.dur(j.dur) : "Not set"],
      ["Billing", billing(j).label + (j.machine && !Q.warrantyActive(j.machine) ? ", warranty expired" : "")]]}),
    h("div", {className:"row wrap", style:{gap:8, marginTop:14}},
      h(Btn, {k:"pri", icon:"check", onClick:() => A.confirmDraft(j.id)}, "Create job"),
      h(Btn, {icon:"engineers", onClick:p.onAssign}, "Assign engineer"),
      h(Btn, {k:"ghost", onClick:p.onInfo}, "Request more information"),
      h("span", {className:"sp1"}), h(Btn, {k:"ghost", sm:true, onClick:() => MP.go("jobs/" + j.id)}, "Open draft")));
}
function CreatedCard(p){
  const j = p.job;
  return h(Card, {pad:true}, h("div", {className:"row wrap", style:{gap:10}},
    h("span", {className:"svc-okic"}, h(Icon, {n:"check", s:16})),
    h("div", {style:{minWidth:0, flex:1}}, h("div", {style:{fontWeight:600, color:"var(--ink)", fontSize:14}}, "Job #" + j.id + " created"),
      h("div", {className:"dim", style:{fontSize:12}}, custName(j) + (j.machine ? ", " + modelName(j) : ", machine still to confirm") + ". " + (j.eng ? "" : "No engineer yet."))),
    h(Status, {j}), h(Btn, {sm:true, onClick:() => MP.go("jobs/" + j.id)}, "Open job"),
    isOpen(j) && !j.eng ? h(Btn, {sm:true, k:"ghost", onClick:p.onInfo}, "Request more information") : null));
}
function AssignedCard(p){
  const j = p.job, E = Q.eng(j.eng);
  return h(Card, {pad:true, className:"anim"}, h("div", {className:"row wrap", style:{gap:12}},
    h("span", {className:"svc-okic"}, h(Icon, {n:"check", s:16})),
    h("div", {style:{minWidth:0, flex:1}},
      h("div", {style:{fontWeight:600, color:"var(--ink)", fontSize:14.5}}, "Assigned to " + E.name + " · sent to " + (j.eng === "sean" ? "his" : firstName(E.name) + "’s") + " phone"),
      h("div", {className:"dim", style:{fontSize:12, marginTop:1}}, "Job #" + j.id + ", " + custName(j) + ". " + Q.loc(E.van).name + (j.start && j.status === "Scheduled" ? ", planned for " + j.start : "") + ".")),
    h(Status, {j})),
    h("div", {className:"row wrap", style:{gap:8, marginTop:12, paddingLeft:46}},
      h(Btn, {sm:true, icon:"jobs", onClick:() => MP.go("jobs/" + j.id)}, "Open Job #" + j.id),
      j.eng === "sean" ? h(Btn, {sm:true, icon:"field", onClick:() => MP.go("field")}, "Open engineer app") : null,
      h(Btn, {sm:true, k:"ghost", icon:"dispatch", onClick:() => MP.go("dispatch")}, "Dispatch board")));
}
function DupCard(p){
  const S = p.S, r = p.r, j = p.job, a = j.awaiting || {}, ro = reorderFor(j), P = a.sku ? Q.part(a.sku) : null;
  return h(Card, {pad:true},
    h("div", {className:"row wrap", style:{gap:10}}, h("span", {className:"svc-inic"}, h(Icon, {n:"link", s:16})),
      h("div", {style:{minWidth:0, flex:1}}, h("div", {style:{fontSize:15, fontWeight:600, color:"var(--ink)"}}, "Matches open Job #" + j.id),
        h("div", {className:"dim", style:{fontSize:12}}, custName(j) + ", " + (modelName(j) || "machine") + (j.machine ? " (" + j.machine + ")" : "") + ". Opened " + U.dm(j.date) + ".")),
      h(Status, {j})),
    h(KV, {style:{marginTop:14}, rows:[
      ["Fault on the job", j.issue],
      j.eng ? ["Engineer", h(Ref, {r:{type:"engineer", id:j.eng}})] : null,
      P ? ["Waiting on", h(F, null, h(Ref, {r:{type:"part", id:a.sku}}), h("span", {className:"dim"}, " " + P.name))] : null,
      ro ? ["Reorder", h(F, null, h("span", {className:"mono"}, ro.id), h("span", {className:"dim"}, ", " + ro.qty + " from " + ro.supplier + ", due " + U.wdm(ro.eta)))] : null]}),
    h("div", {className:"faint", style:{fontSize:12, marginTop:12}}, "Linking adds this " + r.channel.toLowerCase() + " to the job timeline and drafts a reply with the part date. No second job is created."),
    h("div", {className:"row wrap", style:{gap:8, marginTop:12}},
      h(Btn, {k:"pri", icon:"link", onClick:() => A.linkRequest(r.id, j.id)}, "Link to Job #" + j.id),
      p.onInfo ? h(Btn, {onClick:p.onInfo}, "Request more information") : null,
      h(Btn, {k:"ghost", onClick:() => MP.go("jobs/" + j.id)}, "Open job")));
}
function LinkedCard(p){
  const j = p.job, ro = reorderFor(j);
  return h(Card, {pad:true}, h("div", {className:"row wrap", style:{gap:10}},
    h("span", {className:"svc-okic"}, h(Icon, {n:"link", s:16})),
    h("div", {style:{minWidth:0, flex:1}}, h("div", {style:{fontWeight:600, color:"var(--ink)", fontSize:14}}, "Linked to Job #" + j.id + ". No duplicate created."),
      h("div", {className:"dim", style:{fontSize:12}}, custName(j) + ". " + j.status + (j.awaiting && j.awaiting.sku ? ", waiting on " + j.awaiting.sku + (ro ? " due " + rel(ro.eta) : "") : "") + ".")),
    h(Status, {j}), h(Btn, {sm:true, onClick:() => MP.go("jobs/" + j.id)}, "Open job")));
}
function NextStep(p){
  const r = p.r, ai = r.ai || {};
  return h(Card, {pad:true},
    h("div", {className:"row", style:{gap:10}}, h("span", {className:"svc-inic"}, h(Icon, {n:"arrow", s:16})),
      h("div", {style:{minWidth:0}}, h("div", {style:{fontWeight:600, color:"var(--ink)", fontSize:14}}, ai.cust ? "No job yet" : "Customer not recognised"),
        h("div", {className:"dim", style:{fontSize:12}}, ai.cust ? "Create the job, then Pulse suggests the engineer." : "Ask who is calling and which site before a job can be created."))),
    h("div", {className:"row wrap", style:{gap:8, marginTop:12}},
      ai.cust ? h(Btn, {k:"pri", icon:"plus", onClick:() => A.createFromRequest(r.id)}, "Create job") : null,
      h(Btn, {k:ai.cust ? null : "pri", onClick:p.onInfo}, "Request more information")));
}
function Composer(p){
  const r = p.r, ai = r.ai || {}, c = ai.cust ? Q.cust(ai.cust) : null;
  const to = c && c.contacts[0] ? c.contacts[0].name + " <" + c.contacts[0].email + ">" : r.fromAddr || r.from;
  const [txt, setTxt] = R.useState(() => draftReply(r));
  return h(Card, {pad:true, className:"anim"},
    h("div", {className:"row wrap", style:{gap:8}}, h("b", {style:{color:"var(--ink)"}}, "Request more information"), h(Badge, {k:"acc"}, "Drafted by AI"), h("span", {className:"sp1"}), h("span", {className:"mono faint"}, "From service@myers.ie")),
    h("label", {className:"lbl", htmlFor:"svc-reply-" + r.id, style:{marginTop:12}}, "To " + to),
    h("textarea", {id:"svc-reply-" + r.id, className:"ta", rows:7, value:txt, onChange:(e) => setTxt(e.target.value)}),
    h("div", {className:"row", style:{gap:8, marginTop:10}},
      h(Btn, {k:"pri", icon:"arrow", disabled:!txt.trim(), onClick:() => { A.requestInfo(r.id, txt.trim()); p.onClose(); }}, "Send"),
      h(Btn, {k:"ghost", onClick:p.onClose}, "Cancel"),
      h("span", {className:"faint", style:{fontSize:12}}, "Edit before sending. The request waits for the answer.")));
}

/* ======================================================================
   2. JOBS
   ====================================================================== */
const VIEWS = [
  ["today", "Today", (j) => j.date === TODAY],
  ["open", "Open", (j) => isOpen(j)],
  ["urgent", "Urgent", (j) => j.prio === "Urgent" && isOpen(j)],
  ["parts", "Awaiting parts", (j) => j.status === "Awaiting Part"],
  ["review", "Review", (j) => j.status === "Review Required" || j.status === "Engineer Complete"],
  ["ready", "Ready for invoice", (j) => j.status === "Ready for Invoice"],
  ["sent", "Sent to QuickBooks", (j) => !!j.qb],
  ["all", "All", () => true]
];
const VIEW = {}; VIEWS.forEach(v => VIEW[v[0]] = v);
function matchQ(j, q){
  const s = q.toLowerCase().replace(/^#/, "");
  const hay = [j.id, custName(j), j.machine || "", modelName(j) || "", j.eng ? Q.eng(j.eng).name : "", Q.site(j.site).town, j.issue || ""].join(" ").toLowerCase();
  return hay.indexOf(s) >= 0;
}
function viewRows(view){
  if (view === "today") return Q.jobsToday();
  if (view === "sent") return Q.jobs(VIEW.sent[2]).sort((a, b) => (b.qb.sentD + b.qb.sentT).localeCompare(a.qb.sentD + a.qb.sentT));
  return Q.jobs(VIEW[view][2]);
}

MP.pages.jobs = {
  title:(r) => r.parts[0] ? "Job #" + r.parts[0] : "Jobs",
  sub:(r, S) => { if (r.parts[0]){ const j = Q.job(r.parts[0]); return j ? custName(j) + (j.machine ? ", " + modelName(j) : "") + (j.date !== TODAY ? ", " + U.dmy(j.date) : "") : "Not found"; }
    return "Every service job, from request to QuickBooks"; },
  render:(r, S) => r.parts[0] ? h(JobRecord, {key:r.parts[0], S, id:r.parts[0]}) : h(JobsList, {S, route:r})
};

function JobsList(p){
  const S = p.S, view = VIEW[p.route.query.view] ? p.route.query.view : "today";
  const [q, setQ] = R.useState("");
  const base = viewRows(view);
  const rows = q.trim() ? base.filter(j => matchQ(j, q.trim())) : base;
  const elsewhere = q.trim() && !rows.length && view !== "all" ? Q.jobs().filter(j => matchQ(j, q.trim())).length : 0;
  const cap = 80, shown = rows.slice(0, cap);
  const money = view === "ready" || view === "sent";
  const cols = [
    {t:"Job", w:70, r:(j) => h("span", {className:"mono", style:{color:"var(--ink)"}}, "#" + j.id)},
    {t:"Date", w:110, r:(j) => h("span", {className:"dim", style:{whiteSpace:"nowrap"}}, when(j))},
    {t:"Customer / site", r:(j) => h("div", null, h("div", {style:{color:"var(--ink)"}}, custName(j)), h("div", {className:"faint", style:{fontSize:11.5}}, Q.site(j.site).name + ", " + town(j)))},
    {t:"Machine", r:(j) => j.machine ? h("div", null, h("div", null, modelName(j)), h("div", {className:"mono faint"}, j.machine)) : h("span", {className:"faint"}, j.type === "Site measurement" ? "Site measurement" : "Not recorded")},
    {t:"Engineer", r:(j) => j.eng ? h("div", {className:"row", style:{gap:7, whiteSpace:"nowrap"}}, h(Av, {e:j.eng, s:22}), Q.eng(j.eng).name) : h("span", {className:"faint"}, "Unassigned")},
    {t:"Status", r:(j) => h("div", {className:"row", style:{gap:6}}, h(Status, {j}), view === "sent" && j.qb ? h(Badge, {k:UI.STATUS_TONE[j.qb.status]}, j.qb.status) : null)},
    {t:"Priority", r:(j) => h(Prio, {p:j.prio})}
  ];
  if (view === "sent") cols.splice(6, 0, {t:"QuickBooks", r:(j) => h("span", {className:"mono"}, j.qb.ref)});
  if (money) cols.push({t:"Est. value", num:true, r:(j) => h("span", {className:"mono", style:{color:"var(--ink)"}}, U.eur(j.qb ? (j.qb.value || Q.jobValue(j).total) : Q.jobValue(j).total))});
  return h("div", {className:"g", style:{gap:14}},
    h("div", {className:"row wrap", style:{gap:10}},
      h("div", {className:"svc-tabsw"}, h(Tabs, {value:view, onChange:(v) => MP.go(v === "today" ? "jobs" : "jobs?view=" + v), items:VIEWS.map(v => [v[0], v[1], v[0] === "all" ? Object.keys(S.jobs).length : Q.jobs(v[2]).length])})),
      h("span", {className:"sp1"}),
      h("div", {className:"svc-search"}, h(Icon, {n:"search", s:15}),
        h("input", {className:"in", type:"search", value:q, onChange:(e) => setQ(e.target.value), placeholder:"Job, customer, serial or engineer", "aria-label":"Search jobs"}))),
    view === "ready" ? h(ReadyView, {S, q:q.trim()}) :
    h(Card, null,
      h(Table, {rows:shown, cols, onRow:(j) => MP.go("jobs/" + j.id), empty:q.trim() ? "No jobs match “" + q.trim() + "”" : "No jobs in this view", emptyIcon:"jobs",
        emptySub:elsewhere ? h(Btn, {sm:true, k:"ghost", onClick:() => MP.go("jobs?view=all")}, elsewhere + " match" + (elsewhere === 1 ? "" : "es") + " in All jobs") : null}),
      rows.length > cap ? h("div", {className:"faint", style:{padding:"10px 14px 14px", fontSize:12, borderTop:"1px solid var(--border)"}}, "Showing the newest " + cap + " of " + rows.length + " jobs. Search by job number, customer, serial or engineer to find older ones.") : null));
}

function ReadyView(p){
  const S = p.S, q = p.q;
  const ready = Q.jobs(VIEW.ready[2]).filter(j => !q || matchQ(j, q));
  const [off, setOff] = R.useState({});
  const sel = ready.filter(j => !off[j.id]);
  const total = sel.reduce((n, j) => n + Q.jobValue(j).total, 0);
  const review = Q.jobs(VIEW.review[2]).filter(j => !q || matchQ(j, q));
  const sentToday = Q.jobs(j => j.qb && j.qb.sentD === TODAY);
  const allOn = ready.length && sel.length === ready.length;
  const toggleAll = () => { const o = {}; if (allOn) ready.forEach(j => o[j.id] = true); setOff(o); };
  const cols = [
    {t:h("input", {type:"checkbox", className:"svc-cb", checked:!!allOn, onChange:toggleAll, "aria-label":"Select all ready jobs"}), w:34,
     r:(j) => h("input", {type:"checkbox", className:"svc-cb", checked:!off[j.id], onClick:(e) => e.stopPropagation(), onChange:() => setOff(Object.assign({}, off, {[j.id]:!off[j.id]})), "aria-label":"Include Job #" + j.id})},
    {t:"Job", w:70, r:(j) => h("span", {className:"mono", style:{color:"var(--ink)"}}, "#" + j.id)},
    {t:"Completed", r:(j) => h("span", {className:"dim"}, U.rel(j.date))},
    {t:"Customer", r:(j) => h("div", null, h("div", {style:{color:"var(--ink)"}}, custName(j)), h("div", {className:"faint", style:{fontSize:11.5}}, (modelName(j) || j.type) + (j.machine ? ", " + j.machine : "")))},
    {t:"Engineer", r:(j) => j.eng ? h("div", {className:"row", style:{gap:7, whiteSpace:"nowrap"}}, h(Av, {e:j.eng, s:22}), Q.eng(j.eng).name) : null},
    {t:"Checks", r:(j) => { const c = Q.jobChecks(j), ok = c.filter(x => x.ok).length; return h("span", {style:{color:ok === c.length ? "var(--ok)" : "var(--warn)"}}, ok + " of " + c.length); }},
    {t:"Est. value", num:true, r:(j) => h("span", {className:"mono", style:{color:"var(--ink)"}}, U.eur(Q.jobValue(j).total))}
  ];
  return h("div", {className:"g", style:{gap:14}},
    h(Card, {title:"Ready for invoice", icon:"qb", sub:"QuickBooks creates the invoice. Pulse sends the approved job details and reads the status back.",
        right:h("div", {style:{textAlign:"right"}}, h("div", {className:"svc-fl"}, "Selected, est."), h("div", {style:{fontSize:20, fontWeight:600, color:"var(--ink)", fontVariantNumeric:"tabular-nums"}}, U.eur(total)))},
      h(Table, {rows:ready, cols, onRow:(j) => MP.go("jobs/" + j.id), empty:"Nothing waiting for QuickBooks", emptyIcon:"check", emptySub:"Completed jobs land here once every check passes."}),
      ready.length ? h("div", {className:"row wrap", style:{gap:12, padding:"12px 18px 16px", borderTop:"1px solid var(--border)"}},
        h("span", {className:"dim"}, sel.length + " of " + ready.length + " selected. Sends customer, labour, travel, parts and the engineer report."),
        h("span", {className:"sp1"}),
        h(Btn, {k:"pri", lg:true, icon:"qb", disabled:!sel.length, onClick:() => { A.sendToQB(sel.map(j => j.id)); setOff({}); }}, "Send " + sel.length + " to QuickBooks")) : null),
    h("div", {className:"g", style:{gridTemplateColumns:"repeat(auto-fit,minmax(360px,1fr))", alignItems:"start"}},
      h(Card, {title:"Held for review", icon:"attention", sub:"Completed, but a manager has to check them first"},
        review.length ? h("div", {style:{padding:"0 18px 12px"}}, review.map(j => h("div", {key:j.id, className:"row", style:{gap:10, padding:"10px 0", borderTop:"1px solid var(--border)", alignItems:"flex-start"}},
            h("div", {style:{minWidth:0, flex:1}}, h("div", {className:"row wrap", style:{gap:8}}, h(Ref, {r:{type:"job", id:j.id}}), h("span", {style:{color:"var(--ink)"}}, custName(j)), h(Status, {j})),
              h("div", {className:"dim", style:{fontSize:12, marginTop:3}}, reviewReason(j))),
            h(Btn, {sm:true, onClick:() => MP.go("jobs/" + j.id)}, "Review"))))
          : h(Empty, {title:"Nothing held for review", icon:"check"})),
      sentToday.length ? h(Card, {title:"Sent today", icon:"qb", sub:"Status read back from QuickBooks at " + S.integrations.qb.lastSync, right:h(Btn, {sm:true, k:"ghost", icon:"reset", onClick:() => A.qbSync()}, "Sync")},
        h(Table, {rows:sentToday, onRow:(j) => MP.go("jobs/" + j.id), cols:[
          {t:"Reference", r:(j) => h("span", {className:"mono", style:{color:"var(--ink)"}}, j.qb.ref)},
          {t:"Job", r:(j) => h("span", {className:"mono"}, "#" + j.id)},
          {t:"Customer", r:(j) => custName(j)},
          {t:"QuickBooks", r:(j) => h(Badge, {k:UI.STATUS_TONE[j.qb.status]}, j.qb.status)},
          {t:"Value", num:true, r:(j) => h("span", {className:"mono"}, U.eur(j.qb.value))}]})) : null));
}

/* ---------- job record ---------- */
const RAIL = ["Unassigned","Scheduled","Travelling","On Site","Engineer Complete","Ready for Invoice","Sent to QuickBooks"];
const RAIL_LABEL = {"On Site":"On site", "Engineer Complete":"Engineer complete", "Ready for Invoice":"Ready for invoice"};
function railPos(j){
  const s = j.status;
  if (s === "Paused") return {i:3, side:"Paused", tone:"warn"};
  if (s === "Awaiting Part") return {i:3, side:"Awaiting part", tone:"bad"};
  if (s === "Review Required") return {i:4, side:"Review required", tone:"warn"};
  if (s === "Closed") return j.qb ? {i:7, end:"Closed. " + (j.qb.status === "Paid" ? "Paid in QuickBooks" + (j.qb.paidD ? " on " + U.dm(j.qb.paidD) : "") + "." : "")} :
    {i:5, skip:true, end:j.type === "Warranty" ? "Closed under warranty. No invoice." : "Closed as non-billable. Nothing sent to QuickBooks."};
  return {i:Math.max(0, RAIL.indexOf(s))};
}
function Rail(p){
  const j = p.j, pos = railPos(j), ro = j.status === "Awaiting Part" ? reorderFor(j) : null;
  return h(F, null,
    h("div", {className:"svc-railw"}, h("ol", {className:"svc-rail", "aria-label":"Job progress"}, RAIL.map((s, k) => {
      const st = pos.skip && k >= pos.i ? "skip" : k < pos.i ? "done" : k === pos.i ? "cur" : "";
      return h("li", {key:s, className:"svc-st " + st, "aria-current":st === "cur" ? "step" : null}, h("i"), h("span", null, RAIL_LABEL[s] || s));
    }))),
    pos.side || pos.end ? h("div", {className:"row wrap", style:{gap:8, marginTop:10}},
      pos.side ? h(Badge, {k:pos.tone}, pos.side) : null,
      h("span", {className:"dim", style:{fontSize:12}},
        pos.end || (j.status === "Awaiting Part" ? "Waiting on " + ((j.awaiting && j.awaiting.sku) || "a part") + (ro ? ", " + ro.id + " due " + rel(ro.eta) : "") + "."
          : j.status === "Review Required" ? reviewReason(j) : j.status === "Paused" ? "Engineer paused the work and reported an issue." : ""))) : null);
}

function JobRecord(p){
  const S = p.S, j = Q.job(p.id);
  if (!j) return h(Card, {pad:true}, h(Empty, {title:"Job #" + p.id + " not found", icon:"jobs"}, h(Btn, {sm:true, onClick:() => MP.go("jobs")}, "All jobs")));
  const bill = billing(j);
  const action = ["Engineer Complete","Review Required","Ready for Invoice"].indexOf(j.status) >= 0 || !!j.qb || j.status === "Closed";
  const right = [
    h(CustomerCard, {key:"c", j}),
    h(MachineCard, {key:"m", j}),
    h(EngineerCard, {key:"e", j}),
    h(TimesCard, {key:"t", j}),
    (j.status === "Closed" || j.status === "Sent to QuickBooks") && j.date !== TODAY ? null : h(ChecksCard, {key:"k", j})
  ];
  if (action) right.unshift(h(Endpoint, {key:"x", S, j}));
  return h("div", {className:"g", style:{gap:14}},
    h(Card, {pad:true},
      h("div", {className:"row wrap", style:{gap:"10px 18px", alignItems:"flex-start"}},
        h("div", {style:{minWidth:0, flex:"1 1 420px"}},
          h("div", {className:"row wrap", style:{gap:9}}, h("span", {className:"svc-jid"}, "Job #" + j.id),
            h(Status, {s:j.status}), j.draft ? h(Badge, {k:"warn"}, "AI draft") : null, h(Prio, {p:j.prio})),
          h("div", {className:"row wrap", style:{gap:"4px 8px", marginTop:6, fontSize:13.5}},
            h(Ref, {r:{type:"customer", id:j.cust}}), h("span", {className:"faint"}, "·"), h(Ref, {r:{type:"site", id:j.site}}, Q.site(j.site).name + ", " + town(j)),
            j.machine ? h(F, null, h("span", {className:"faint"}, "·"), h(Ref, {r:{type:"machine", id:j.machine}}, modelName(j))) : null)),
        h("div", {className:"row wrap", style:{gap:8, justifyContent:"flex-end"}},
          h(Badge, {k:bill.k}, bill.label), h(Badge, {k:"line"}, j.type),
          h("span", {className:"mono faint"}, when(j) + (j.dur && isOpen(j) ? ", " + U.dur(j.dur) : "")))),
      h(Rail, {j})),
    j.draft ? h(DraftBanner, {j}) : null,
    h("div", {className:"svc-rec"},
      h("div", {className:"g", style:{gap:14}},
        h(IssueCard, {j}), h(TimelineCard, {j}), h(PartsCard, {S, j}), h(DocsCard, {j}), h(NotesCard, {j})),
      h("div", {className:"g", style:{gap:14}}, right)));
}

function DraftBanner(p){
  const j = p.j, top = Q.recommend(j.id)[0], aiT = (j.timeline.find(e => e.kind === "ai") || {}).t;
  return h("div", {className:"card svc-ai"},
    h("div", {className:"row wrap", style:{gap:10}},
      h("span", {className:"svc-k"}, "AI draft"),
      h("span", {style:{color:"var(--body)", flex:"1 1 320px"}}, "The Service Coordinator drafted this job" + (aiT ? " at " + aiT : "") + (j.requestId ? " from " + j.requestId : "") + ". Nothing is scheduled until a person confirms it."),
      h(Btn, {k:"pri", sm:true, icon:"check", onClick:() => A.confirmDraft(j.id)}, "Create job"),
      top ? h(Btn, {sm:true, onClick:() => A.assign(j.id, top.eng)}, "Assign " + top.name) : null,
      j.requestId ? h(Btn, {sm:true, k:"ghost", onClick:() => MP.go("desk/" + j.requestId)}, "Open request") : null));
}

function IssueCard(p){
  const j = p.j, rq = j.requestId ? Q.request(j.requestId) : null;
  return h(Card, {title:"Reported issue", icon:"alert", right:j.aiClass ? h(Badge, {k:"acc"}, j.aiClass) : null},
    h("div", {className:"cb"},
      h("blockquote", {className:"svc-quote"}, j.reported || j.issue),
      j.reported && j.issue && j.reported !== j.issue ? h("div", {style:{marginTop:10, color:"var(--body)"}}, h("span", {className:"dim"}, "Summary: "), j.issue) : null,
      h("div", {className:"row wrap", style:{gap:"6px 14px", marginTop:10, fontSize:12}},
        h("span", {className:"dim"}, "Source: " + (j.source || "Unknown") + (rq ? ", " + rq.from : j.contact ? ", " + j.contact : "")),
        j.requestId ? h(Ref, {r:{type:"request", id:j.requestId}}, "Request " + j.requestId) : null,
        (j.possibleParts || []).length ? h("span", {className:"dim"}, "Likely parts: ") : null,
        (j.possibleParts || []).map(s => h(Ref, {key:s, r:{type:"part", id:s}}))),
      j.report ? h("div", {style:{marginTop:14, paddingTop:12, borderTop:"1px solid var(--border)"}},
        h("div", {className:"sec"}, "Engineer report"),
        h("div", {style:{color:"var(--ink)", lineHeight:1.55}}, j.report.summary),
        h("div", {className:"faint", style:{fontSize:12, marginTop:4}}, (j.report.by && Q.eng(j.report.by) ? Q.eng(j.report.by).name + ", " : "") + U.rel(j.report.d) + (j.ended ? " " + j.ended : "") +
          (j.signoff ? ". Signed off by " + j.signoff.name + "." : ". No customer sign-off."))) : null));
}

function TimelineCard(p){
  const j = p.j;
  const items = j.timeline.map((e, i) => ({e, i})).sort((a, b) => (a.e.d + a.e.t).localeCompare(b.e.d + b.e.t) || a.i - b.i).map(x => {
    const e = x.e; return {t:e.t, text:e.text, sub:(e.by || "") + (e.d !== TODAY ? (e.by ? ", " : "") + U.wdm(e.d) : ""), kind:e.kind === "person" ? "" : e.kind};
  });
  return h(Card, {title:"Job timeline", icon:"history", sub:items.length + " event" + (items.length === 1 ? "" : "s") + ", oldest first"},
    h("div", {className:"cb"}, items.length ? h(Timeline, {items}) : h(Empty, {title:"No events yet"})));
}

function PartsCard(p){
  const S = p.S, j = p.j;
  const rows = j.parts.map((x, i) => Object.assign({key:"p" + i}, x));
  const cost = j.parts.reduce((n, x) => n + Q.part(x.sku).cost * x.qty, 0);
  const a = j.awaiting, ro = j.status === "Awaiting Part" ? reorderFor(j) : null;
  return h(Card, {title:"Parts used", icon:"parts", sub:j.parts.length ? "Stock was reduced at the source location when each part was recorded" : null,
      right:j.parts.length ? h("span", {className:"mono dim"}, "Internal cost " + U.eur2(cost)) : null},
    j.status === "Awaiting Part" && a && a.sku ? h("div", {className:"cb"}, h("div", {className:"row wrap", style:{gap:8, padding:"10px 12px", borderRadius:12, background:"var(--bad-soft)"}},
      h(Icon, {n:"alert", s:15, style:{color:"var(--bad)"}}), h("span", {style:{color:"var(--ink)"}}, "Waiting on "), h(Ref, {r:{type:"part", id:a.sku}}),
      h("span", {className:"dim"}, Q.part(a.sku).name + (ro ? ". " + ro.id + ", " + ro.qty + " from " + ro.supplier + ", due " + U.wdm(ro.eta) : ". No reorder raised yet") + "."))) : null,
    rows.length ? h(Table, {rows, cols:[
      {t:"Part", r:(x) => h("div", null, h(Ref, {r:{type:"part", id:x.sku}}), h("div", {className:"faint", style:{fontSize:11.5}}, Q.part(x.sku).name))},
      {t:"Qty", num:true, w:44, r:(x) => h("span", {className:"mono"}, x.qty)},
      {t:"From", r:(x) => x.from ? h(Ref, {r:{type:"location", id:x.from}}) : null},
      {t:"When", r:(x) => h("span", {className:"mono dim"}, (j.date === TODAY ? "" : U.dm(j.date) + " ") + (x.t || ""))},
      {t:"By", r:(x) => h("span", {className:"dim"}, x.by && Q.eng(x.by) ? Q.eng(x.by).name : j.eng ? Q.eng(j.eng).name : "")},
      {t:"Label", r:(x) => x.doc ? h(Ref, {r:{type:"doc", id:x.doc}}, "Label photo") : h("span", {className:"faint"}, "None")},
      {t:"Cost", num:true, r:(x) => h("span", {className:"mono"}, U.eur2(Q.part(x.sku).cost * x.qty))}]})
    : h("div", {className:"cb"}, h("div", {className:"dim", style:{fontSize:12.5}}, j.noParts ? "The engineer recorded that no parts were used." : isOpen(j) ? "No parts recorded yet. Parts scanned on the engineer app appear here." : "No parts used on this job.")));
}

const LINKS = [["machine","machine","Machine "],["part","part","Part "],["warranty","warranty","Warranty "],["job","job","Job #"]];
function DocsCard(p){
  const j = p.j, docs = j.docs.map(id => Q.doc(id)).filter(Boolean).sort((a, b) => (a.d + a.t).localeCompare(b.d + b.t));
  return h(Card, {title:"Job documents", icon:"documents", sub:docs.length ? "Every file is linked to its job, machine and customer" : null, right:h("span", {className:"mono faint"}, docs.length)},
    h("div", {className:"cb"}, docs.length ? docs.map(d => {
      const also = LINKS.filter(l => d.links[l[0]] && !(l[0] === "job" && d.links.job === j.id));
      return h("div", {key:d.id, className:"svc-doc"},
        h(Badge, {k:d.kind === "Label photo" ? "acc" : d.kind === "Signature" ? "ok" : ""}, d.kind),
        h("div", {style:{minWidth:0}}, h(Ref, {r:{type:"doc", id:d.id}}, d.name),
          also.length ? h("div", {className:"row wrap", style:{gap:"2px 8px", fontSize:11.5, marginTop:2}}, h("span", {className:"faint"}, "Also on:"),
            also.map(l => h(Ref, {key:l[0], r:{type:l[1], id:d.links[l[0]]}}, l[2] + d.links[l[0]]))) : null),
        h("div", {className:"faint", style:{fontSize:11.5, textAlign:"right", whiteSpace:"nowrap"}}, (d.d === TODAY ? "" : U.dm(d.d) + " ") + (d.t || ""), h("div", null, d.by)));
    }) : h("div", {className:"dim", style:{fontSize:12.5}}, "No documents yet. Photos, the parts label, the report and the signature attach here from the engineer app.")));
}

function NotesCard(p){
  const j = p.j;
  return h(Card, {title:"Notes", icon:"note", right:h("span", {className:"mono faint"}, j.notes.length)},
    h("div", {className:"cb"}, j.notes.length ? j.notes.map((n, i) => h("div", {key:i, style:{padding:"8px 0", borderTop:i ? "1px solid var(--border)" : 0}},
        h("div", {style:{color:"var(--ink)"}}, n.text), h("div", {className:"faint", style:{fontSize:11.5, marginTop:2}}, (n.by && Q.eng(n.by) ? Q.eng(n.by).name + ", " : "") + n.t)))
      : h("div", {className:"dim", style:{fontSize:12.5}}, "No notes. Engineer notes from site appear here.")));
}

function CustomerCard(p){
  const j = p.j, c = Q.cust(j.cust), s = Q.site(j.site);
  const ct = c.contacts.find(x => x.name === j.contact) || c.contacts[0] || {};
  return h(Card, {title:"Customer", icon:"customers", right:h(Btn, {sm:true, k:"ghost", onClick:() => MP.go("customers/" + c.id)}, "Open")},
    h("div", {className:"cb"}, h(KV, {rows:[
      ["Customer", h(Ref, {r:{type:"customer", id:c.id}})],
      ["Site", h(F, null, s.name, h("div", {className:"faint", style:{fontSize:11.5}}, s.town))],
      ["Contact", h(F, null, ct.name || "None", ct.role ? h("span", {className:"faint"}, ", " + ct.role) : null)],
      ["Phone", h("span", {className:"mono", style:{fontSize:12.5}}, ct.phone || "None")],
      ["Email", ct.email ? h("span", {style:{wordBreak:"break-all"}}, ct.email) : "None"],
      ["QuickBooks", h("span", {className:"mono dim"}, c.qb)]]})));
}

function MachineCard(p){
  const j = p.j;
  if (!j.machine) return h(Card, {title:"Machine", icon:"machines", right:h(Badge, {k:"warn"}, "Missing")},
    h("div", {className:"cb"}, h("div", {className:"dim", style:{fontSize:12.5, marginBottom:10}}, j.type === "Site measurement" ? "No machine yet. This is a site measurement for a new line." : (j.dataIssue || "Machine not recorded") + ". Link it so history, warranty and parts attach to the right record."),
      j.type === "Site measurement" ? null : h(MachinePicker, {j})));
  const m = Q.mach(j.machine), M = Q.model(j.machine);
  const last = Q.machineJobs(j.machine).filter(x => x.id !== j.id && x.date <= j.date && DONE.indexOf(x.status) >= 0)[0];
  const wa = Q.warrantyActive(j.machine);
  return h(Card, {title:"Machine", icon:"machines", right:h(Btn, {sm:true, k:"ghost", onClick:() => MP.go("machines/" + m.id)}, "Open")},
    h("div", {className:"cb"}, h("div", {className:"row", style:{gap:14, alignItems:"flex-start"}},
      h(KV, {style:{flex:1, minWidth:0}, rows:[
        ["Model", M.name],
        ["Serial", h(Ref, {r:{type:"machine", id:m.id}}, h("span", {className:"mono", style:{fontSize:12.5}}, m.id))],
        ["Type", M.type],
        ["Installed", m.installed ? U.dLong(m.installed) : "Being installed"],
        ["Last service", last ? h(F, null, h(Ref, {r:{type:"job", id:last.id}}), h("span", {className:"dim"}, ", " + U.dmy(last.date)), h("div", {className:"faint", style:{fontSize:11.5}}, (last.resolution || last.issue).slice(0, 90))) : h("span", {className:"faint"}, "None on record")],
        ["Warranty", m.warrantyEnd ? h(F, null, h(Badge, {k:wa ? "ok" : "line"}, wa ? "Active" : "Expired"), h("span", {className:"dim", style:{marginLeft:7}}, (wa ? "until " : "ended ") + U.dmy(m.warrantyEnd))) : h("span", {className:"faint"}, "Starts at handover")]]}),
      h("button", {type:"button", onClick:() => MP.go("machines/" + m.id), "aria-label":"Open machine record " + m.id, title:"QR tag " + m.qr, style:{background:"none", border:0, padding:0, cursor:"pointer", flex:"none"}}, h(QR, {v:m.qr, s:58})))));
}
function MachinePicker(p){
  const j = p.j, ms = Object.values(MP.get().machines).filter(m => m.cust === j.cust);
  const want = j.skill;
  const sorted = ms.slice().sort((a, b) => (MP.ref.MODELS[b.model].skill === want) - (MP.ref.MODELS[a.model].skill === want));
  const [sel, setSel] = R.useState(sorted[0] ? sorted[0].id : "");
  if (!ms.length) return h("div", {className:"faint"}, "No machines on record for " + custName(j) + ".");
  const match = ms.filter(m => MP.ref.MODELS[m.model].skill === want);
  return h("div", null,
    h("label", {className:"lbl", htmlFor:"svc-mp-" + j.id}, "Machine at " + custName(j)),
    h("div", {className:"row", style:{gap:8}},
      h("select", {id:"svc-mp-" + j.id, className:"sel", value:sel, onChange:(e) => setSel(e.target.value)},
        sorted.map(m => h("option", {key:m.id, value:m.id}, m.id + ", " + MP.ref.MODELS[m.model].name + " (" + Q.site(m.site).name + ")"))),
      h(Btn, {k:"pri", sm:true, disabled:!sel, onClick:() => A.fixMachine(j.id, sel)}, "Link machine")),
    match.length === 1 ? h("div", {className:"faint", style:{fontSize:12, marginTop:6}}, "Suggested: " + match[0].id + " is the only " + MP.ref.MODELS[match[0].model].type.toLowerCase() + " on record for this customer.") : null);
}

function EngineerCard(p){
  const j = p.j, [pick, setPick] = R.useState(false);
  const canAssign = isOpen(j);
  if (!j.eng) return h(Card, {title:"Assigned engineer", icon:"engineers", right:h(Badge, {k:"warn"}, "Unassigned")},
    h("div", {className:"cb"}, canAssign ? h(F, null, h("div", {className:"dim", style:{fontSize:12.5, marginBottom:8}}, "Ranked by the Dispatch Assistant on skills, van stock, availability and distance."),
      h(RankList, {jobId:j.id, limit:pick ? null : 3, compact:false, onPick:(e) => A.assign(j.id, e)}),
      h(Btn, {sm:true, k:"ghost", onClick:() => setPick(!pick), style:{marginTop:6}}, pick ? "Show top 3" : "Show all engineers"))
      : h("div", {className:"faint"}, "No engineer recorded.")));
  const E = Q.eng(j.eng), live = j.date === TODAY ? Q.engNow(j.eng) : null;
  let line = null;
  if (live){
    if (live.status === "Travelling" && live.job && live.job.id === j.id && live.eta) line = "Travelling to site, ETA " + U.hm(live.eta);
    else if (live.status === "On site" && live.job && live.job.id === j.id) line = "On site since " + U.hm(live.since);
    else line = (live.job && live.job.id !== j.id ? "Now on Job #" + live.job.id + ", " + custName(live.job) + ". " : "") + (j.status === "Scheduled" && j.start ? "Booked for " + j.start + ", about " + U.dur(j.dur) + "." : "") || null;
  }
  return h(Card, {title:"Assigned engineer", icon:"engineers", right:canAssign ? h(Btn, {sm:true, k:pick ? "pri" : null, onClick:() => setPick(!pick), "aria-expanded":pick}, pick ? "Close" : "Reassign") : null},
    h("div", {className:"cb"},
      h("div", {className:"row", style:{gap:11}}, h(Av, {e:E, s:38}),
        h("div", {style:{minWidth:0, flex:1}}, h(Ref, {r:{type:"engineer", id:E.id}}, h("span", {style:{fontWeight:600, fontSize:14}}, E.name)),
          h("div", {className:"dim", style:{fontSize:12}}, h(Ref, {r:{type:"location", id:E.van}}), ", " + E.phone)),
        live ? h(Badge, {k:(MP.ENG_TONE || {})[live.status] || ""}, live.status) : null),
      line ? h("div", {style:{marginTop:10, color:"var(--ink)"}}, line) : null,
      h("div", {className:"row wrap", style:{gap:5, marginTop:10}}, E.skills.map(s => h("span", {key:s, className:cx("chip static", s === j.skill && "acc"), style:{height:22, fontSize:11}}, s)),
        E.certs.map(c => h("span", {key:c, className:"chip static", style:{height:22, fontSize:11}}, c + " certified"))),
      pick ? h("div", {style:{marginTop:12, borderTop:"1px solid var(--border)", paddingTop:4}}, h(RankList, {jobId:j.id, current:j.eng, onPick:(e) => { A.assign(j.id, e); setPick(false); }})) : null));
}

function TimesCard(p){
  const j = p.j, t = Q.jobTimes(j), v = Q.jobValue(j), n = j.parts.reduce((s, x) => s + x.qty, 0);
  return h(Card, {title:"Labour and travel", icon:"clock", sub:j.date === TODAY && isOpen(j) ? "Live from location and job events" : null},
    h("div", {className:"cb"}, h("div", {className:"svc-tiles"},
      mini("Travel", U.dur(t.travel)), mini("On site", U.dur(t.onsite)),
      mini("Engineer", j.eng ? Q.eng(j.eng).name : "None"), mini("Parts", n + (n === 1 ? " part" : " parts")),
      h("div", {className:"svc-tile", style:{gridColumn:"1 / -1"}}, h("div", {className:"svc-fl"}, "Parts, estimated internal value"),
        h("div", {className:"v"}, U.eur2(v.partsCost)), h("div", {className:"faint", style:{fontSize:11.5}}, "At cost. Selling prices are set in QuickBooks.")))));
}

function ChecksCard(p){
  const j = p.j, checks = Q.jobChecks(j), done = DONE.indexOf(j.status) >= 0;
  const ok = checks.filter(c => c.ok).length;
  return h(Card, {title:"Completion checks", icon:"check", sub:done ? ok + " of " + checks.length + " passed" : "Run when the engineer completes the job", right:done ? h(Badge, {k:ok === checks.length ? "ok" : "warn"}, ok + "/" + checks.length) : null},
    h("div", {className:"cb"}, h("ul", {className:"svc-chk"}, checks.map(c => h("li", {key:c.k},
      c.ok ? h("span", {className:"y", "aria-label":"Passed"}, h(Icon, {n:"check", s:15})) : done ? h("span", {className:"n", "aria-label":"Missing"}, h(Icon, {n:"close", s:15})) : h("span", {className:"p", "aria-label":"Pending"}, h(Icon, {n:"clock", s:14})),
      h("span", {style:{color:c.ok ? "var(--ink)" : done ? "var(--body)" : "var(--dim)"}}, c.label),
      h("span", {className:"mono faint"}, done || c.ok ? (c.v || (!c.ok && c.fix ? c.fix : "")) : ""))))));
}

function Endpoint(p){
  const S = p.S, j = p.j;
  if (j.qb) return h(QBPanel, {S, j});
  if (j.status === "Closed"){
    const c = j.warranty ? Q.claim(j.warranty) : null;
    return h(Card, {pad:true}, h("div", {className:"row", style:{gap:10}}, h("span", {className:"svc-inic"}, h(Icon, {n:c ? "warranties" : "check", s:16})),
      h("div", null, h("div", {style:{fontWeight:600, color:"var(--ink)"}}, c ? "Warranty job. No invoice." : "Non-billable. Nothing sent to QuickBooks."),
        c ? h("div", {className:"dim", style:{fontSize:12}}, "Claim ", h(Ref, {r:{type:"warranty", id:c.id}}), " with " + c.mfr + ", " + c.status.toLowerCase() + ", " + U.eur(c.value) + ".")
          : h("div", {className:"dim", style:{fontSize:12}}, j.type === "Site measurement" ? "Site measurement for a quote. Time still counts towards subsistence." : "Closed without an invoice."))));
  }
  if (j.status === "Ready for Invoice"){
    const v = Q.jobValue(j);
    return h(Card, {title:"Ready for invoice", icon:"qb", right:h(Badge, {k:"ok"}, "Checks passed"), className:"svc-ai", style:{padding:0}},
      h("div", {className:"cb"},
        j.estOverride ? h(F, null,
            h("div", {className:"svc-lines"}, v.lines.map((l, i) => h("div", {key:i}, h("span", {className:"dim"}, l.label), h("span", {className:"faint"}, "Included"))),
              h("div", {className:"tot"}, h("span", null, "Estimated value"), h("span", {className:"mono"}, U.eur(v.total)))),
            h("div", {className:"faint", style:{fontSize:11.5, marginTop:6}}, "Value agreed on the job sheet. QuickBooks prices the lines."))
          : h("div", {className:"svc-lines"}, v.lines.map((l, i) => h("div", {key:i}, h("span", {className:"dim"}, l.label), h("span", {className:"mono"}, U.eur2(l.amount)))),
              h("div", {className:"tot"}, h("span", null, "Estimated value"), h("span", {className:"mono"}, U.eur(v.total)))),
        h(Btn, {k:"pri", lg:true, icon:"qb", style:{width:"100%", marginTop:14}, onClick:() => A.sendToQB([j.id])}, "Send to QuickBooks"),
        h("div", {className:"faint", style:{fontSize:12, marginTop:8, textAlign:"center"}}, "Sends customer, labour, travel, parts and the report. QuickBooks creates the invoice.")));
  }
  // Engineer Complete / Review Required
  const claim = j.warranty ? Q.claim(j.warranty) : null;
  const blocking = Q.jobChecks(j).filter(c => !c.ok && c.k !== "signoff");
  return h(Card, {title:claim ? "Warranty claim review" : "Review before invoice", icon:"attention", right:h(Status, {s:j.status}), className:"svc-ai", style:{padding:0}},
    h("div", {className:"cb"},
      h("div", {style:{color:"var(--ink)", marginBottom:10}}, reviewReason(j)),
      !j.machine ? h("div", {style:{marginBottom:12}}, h(MachinePicker, {j})) : null,
      claim ? h("div", {className:"row wrap", style:{gap:8, marginBottom:12, padding:"10px 12px", borderRadius:12, background:"var(--surface-faint)", border:"1px solid var(--border)"}},
        h(Icon, {n:"warranties", s:15, style:{color:"var(--accent)"}}), h("span", null, "Drafted claim "), h(Ref, {r:{type:"warranty", id:claim.id}}),
        h("span", {className:"dim"}, "for " + claim.mfr + ", " + U.eur(claim.value) + ", " + claim.docs.length + " documents attached")) : null,
      blocking.length ? h("div", {style:{color:"var(--warn)", fontSize:12, marginBottom:10}}, "Fix first: " + blocking.map(c => c.label.toLowerCase()).join(", ") + ".") : null,
      h(Btn, {k:"pri", lg:true, icon:"check", disabled:!!blocking.length, style:{width:"100%"}, onClick:() => A.markReady(j.id)}, claim ? "Approve and submit claim" : "Mark ready for invoice"),
      h("div", {className:"faint", style:{fontSize:12, marginTop:8, textAlign:"center"}},
        claim ? "Submits the claim to " + claim.mfr + ". The job closes with no invoice." :
        !j.signoff ? "Records the customer confirmation as confirmed by phone by " + Q.staffName() + "." : "Moves the job to Ready for Invoice.")));
}

function QBPanel(p){
  const S = p.S, j = p.j, qb = j.qb;
  const steps = ["Sent","Invoiced","Paid"], at = steps.indexOf(qb.status);
  const sentBy = (j.timeline.find(e => /^Sent to QuickBooks/.test(e.text)) || {}).by;
  return h(Card, {title:"QuickBooks", icon:"qb", right:h(Badge, {k:UI.STATUS_TONE[qb.status]}, qb.status)},
    h("div", {className:"cb"},
      h("div", {className:"row", style:{alignItems:"baseline", gap:10}}, h("span", {className:"mono", style:{fontSize:16, color:"var(--ink)"}}, qb.ref), h("span", {className:"sp1"}),
        h("span", {style:{fontSize:18, fontWeight:600, color:"var(--ink)", fontVariantNumeric:"tabular-nums"}}, U.eur(qb.value || Q.jobValue(j).total))),
      h("div", {className:"svc-trk", role:"list", "aria-label":"QuickBooks status"}, steps.map((s, i) => h("div", {key:s, role:"listitem", className:i <= at ? "on" : ""}, h("i"), h("span", null, s)))),
      h(KV, {rows:[
        ["Sent", U.rel(qb.sentD) + " " + (qb.sentT || "") + (sentBy ? " by " + sentBy : "")],
        ["Invoice", qb.invoiceNo ? h("span", {className:"mono"}, qb.invoiceNo + (qb.invoiceD ? ", " + U.dm(qb.invoiceD) : "")) : h("span", {className:"faint"}, "Not created yet")],
        ["Paid", qb.paidD ? U.dmy(qb.paidD) : h("span", {className:"faint"}, "Not yet")]]}),
      h("div", {className:"row wrap", style:{gap:8, marginTop:12}},
        h("span", {className:"faint", style:{fontSize:12, flex:"1 1 180px"}}, "Last read from QuickBooks " + S.integrations.qb.lastSync + ". The invoice lives in QuickBooks; Pulse only reads its status."),
        qb.status !== "Paid" ? h(Btn, {sm:true, icon:"reset", onClick:() => A.qbSync()}, "Sync from QuickBooks") : null)));
}

/* ======================================================================
   3. DISPATCH
   ====================================================================== */
const COLS = [
  ["un", "UNASSIGNED", ["Unassigned"], "Unassigned"],
  ["sch", "SCHEDULED", ["Scheduled"], "Scheduled"],
  ["trv", "TRAVELLING", ["Travelling"], "Travelling"],
  ["on", "ON SITE", ["On Site","Paused"], "On Site"],
  ["await", "AWAITING PARTS", ["Awaiting Part"], "Awaiting Part"],
  ["done", "COMPLETE", DONE, "Engineer Complete"]
];
const COL_NAME = {un:"Unassigned", sch:"Scheduled", trv:"Travelling", on:"On site", await:"Awaiting parts", done:"Complete"};
const colOf = (j) => (COLS.find(c => c[2].indexOf(j.status) >= 0) || COLS[0])[0];
const PRANK = {Urgent:0, High:1, Normal:2, Low:3};

MP.pages.dispatch = {
  title:"Dispatch",
  sub:(r) => r.query.view === "schedule" ? "Engineer day plan for Monday 28 September, 06:00 to 19:00" : "Today’s jobs plus open parts waits. Drag a card, or use Move to.",
  render:(route, S) => h(Dispatch, {S, route})
};

function Dispatch(p){
  const S = p.S, view = p.route.query.view === "schedule" ? "schedule" : "board";
  const today = Q.jobsToday();
  const un = today.filter(j => j.status === "Unassigned").length, urg = today.filter(j => j.prio === "Urgent" && isOpen(j)).length;
  return h("div", {className:"g", style:{gap:14}},
    h("div", {className:"row wrap", style:{gap:12}},
      h(Tabs, {value:view, onChange:(v) => MP.go(v === "board" ? "dispatch" : "dispatch?view=schedule"), items:[["board","Board"],["schedule","Schedule"]]}),
      h("span", {className:"dim"}, today.length + " jobs today, " + today.filter(j => DONE.indexOf(j.status) >= 0).length + " complete, " + un + " unassigned, " + urg + " urgent open"),
      h("span", {className:"sp1"}),
      h(Btn, {sm:true, k:"ghost", icon:"chat", onClick:() => MP.openAI("Who is closest to the FreshPak breakdown and qualified to work on the machine?")}, "Ask Dispatch Assistant")),
    view === "board" ? h(Board, {S}) : h(Schedule, {S}));
}

function Board(p){
  const S = p.S;
  const [drag, setDrag] = R.useState(null), [over, setOver] = R.useState(null), [pending, setPending] = R.useState(null);
  const seen = {}, jobs = [];
  Q.jobsToday().concat(Q.jobs(j => j.status === "Awaiting Part")).forEach(j => { if (!seen[j.id]){ seen[j.id] = 1; jobs.push(j); } });
  const move = (id, col) => {
    const j = Q.job(id), c = COLS.find(x => x[0] === col); if (!j || !c || colOf(j) === col) return;
    if (LOCKED.indexOf(j.status) >= 0) return;
    setPending(null);
    if (col === "un"){ if (j.eng) A.unassign(id); else A.setStatus(id, "Unassigned"); return; }
    if (!j.eng && (col === "sch" || col === "trv" || col === "on")){ setPending({id, col}); return; }
    A.setStatus(id, c[3]);
  };
  return h("div", {className:"svc-board-w"}, h("div", {className:"svc-board"}, COLS.map(c => {
    const list = jobs.filter(j => colOf(j) === c[0]).sort((a, b) => (PRANK[a.prio] - PRANK[b.prio]) || (a.date === TODAY) - (b.date === TODAY) || (a.start || "99").localeCompare(b.start || "99"));
    const urgent = list.filter(j => j.prio === "Urgent").length;
    return h("section", {key:c[0], className:cx("svc-col", over === c[0] && "over"), "aria-label":COL_NAME[c[0]] + ", " + list.length + " jobs",
        onDragOver:(e) => { if (!drag) return; e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = "move"; if (over !== c[0]) setOver(c[0]); },
        onDragLeave:(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOver(null); },
        onDrop:(e) => { e.preventDefault(); const id = (e.dataTransfer && e.dataTransfer.getData("text/plain")) || drag; setOver(null); setDrag(null); if (id) move(id, c[0]); }},
      h("div", {className:"svc-colh"}, h("b", null, c[1]), h("span", {className:"mono faint"}, list.length), h("span", {className:"sp1"}),
        urgent ? h(Badge, {k:"bad"}, urgent + " urgent") : null),
      pending && pending.col === c[0] ? h("div", {className:"svc-pop anim", role:"group", "aria-label":"Assign an engineer"},
        h("div", {style:{fontWeight:600, color:"var(--ink)", fontSize:12.5}}, "Job #" + pending.id + " needs an engineer"),
        h("div", {className:"dim", style:{fontSize:11.5, margin:"2px 0 4px"}}, "Pick one to move it to " + COL_NAME[c[0]].toLowerCase() + ". Ranked by the Dispatch Assistant."),
        h(RankList, {jobId:pending.id, limit:3, compact:true, onPick:(e) => { const t = COLS.find(x => x[0] === pending.col)[3]; A.assign(pending.id, e, t !== "Scheduled" ? {status:t} : null); setPending(null); }}),
        h(Btn, {sm:true, k:"ghost", onClick:() => setPending(null), style:{marginTop:4}}, "Cancel")) : null,
      list.map(j => h(BoardCard, {key:j.id, j, col:c[0], dragging:drag === j.id, onDrag:setDrag, onMove:move})),
      !list.length ? h("div", {className:"faint", style:{fontSize:12, textAlign:"center", padding:"18px 6px"}}, drag ? "Drop here" : "No jobs") : null);
  })));
}

function BoardCard(p){
  const j = p.j, locked = LOCKED.indexOf(j.status) >= 0 || !!j.qb;
  const n = j.eng && j.date === TODAY ? Q.engNow(j.eng) : null;
  const M = j.machine ? Q.model(j.machine) : null;
  const ro = j.status === "Awaiting Part" ? reorderFor(j) : null;
  let extra = null;
  if (j.status === "Travelling" && n && n.eta) extra = h("span", {style:{color:"var(--accent)"}}, "ETA " + U.hm(n.eta));
  else if (j.status === "On Site" && n && n.since) extra = h("span", {style:{color:"var(--ok)"}}, "On site since " + U.hm(n.since));
  else if (j.status === "Awaiting Part" && j.awaiting) extra = h("span", {style:{color:"var(--bad)"}}, "Waiting on " + (j.awaiting.sku || "part") + (ro ? ", due " + rel(ro.eta) : ""));
  return h("div", {className:cx("svc-card", p.dragging && "drag"), draggable:!locked, tabIndex:0, role:"button", "aria-label":"Job #" + j.id + ", " + custName(j) + ". Open job record.",
      onDragStart:(e) => { if (e.dataTransfer){ e.dataTransfer.setData("text/plain", j.id); e.dataTransfer.effectAllowed = "move"; } p.onDrag(j.id); },
      onDragEnd:() => p.onDrag(null),
      onClick:() => MP.go("jobs/" + j.id),
      onKeyDown:(e) => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")){ e.preventDefault(); MP.go("jobs/" + j.id); } }},
    h("div", {className:"row", style:{gap:6}}, h("span", {className:"mono", style:{color:"var(--ink)"}}, "#" + j.id), h(Prio, {p:j.prio}), j.draft ? h(Badge, {k:"warn"}, "Draft") : null,
      h("span", {className:"sp1"}), j.date !== TODAY ? h("span", {className:"mono faint", title:"Opened " + U.dmy(j.date)}, U.dm(j.date)) : null),
    h("div", {className:"svc-cc"}, custName(j)),
    h("div", {className:"faint", style:{fontSize:11.5}}, Q.site(j.site).name + ", " + town(j)),
    h("div", {className:"svc-cm"}, M ? M.type : j.type === "Site measurement" ? "Site measurement" : "Machine not recorded", M ? h("div", {className:"faint", style:{fontSize:11.5}}, M.name) : null),
    j.skill ? h("div", {style:{marginTop:7}}, h("span", {className:"chip static svc-skill"}, j.skill)) : null,
    h("div", {className:"row", style:{gap:7, marginTop:9, fontSize:12}},
      j.eng ? h(F, null, h(Av, {e:j.eng, s:20}), h("span", {style:{color:"var(--body)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}, Q.eng(j.eng).name))
        : h("span", {style:{color:"var(--warn)"}}, "Unassigned"),
      h("span", {className:"sp1"}),
      h("span", {className:"mono faint", style:{whiteSpace:"nowrap"}}, (j.start || "No slot") + " · " + U.dur(j.dur))),
    extra ? h("div", {style:{fontSize:11.5, marginTop:6}}, extra) : null,
    p.col === "done" ? h("div", {style:{marginTop:7}}, h(Status, {j}), j.qb ? h("span", {className:"mono faint", style:{marginLeft:6}}, j.qb.ref) : null) : null,
    locked ? null : h("select", {className:"sel svc-move", value:p.col, "aria-label":"Move Job #" + j.id + " to",
        onClick:(e) => e.stopPropagation(), onKeyDown:(e) => e.stopPropagation(), onChange:(e) => p.onMove(j.id, e.target.value)},
      COLS.map(c => h("option", {key:c[0], value:c[0]}, (c[0] === p.col ? "In: " : "Move to: ") + COL_NAME[c[0]]))));
}

/* ---------- schedule ---------- */
const H0 = 360, SPAN = 780;
const pct = (m) => Math.max(0, Math.min(100, (m - H0) / SPAN * 100));
function legs(evs, future){
  const out = []; let dep = null;
  evs.forEach(e => { if (e.type === "depart") dep = e; else if (e.type === "arrive" && dep){ out.push({t0:dep.t, t1:e.t, to:e.place, future}); dep = null; } });
  if (dep) out.push({t0:dep.t, t1:Math.max(dep.t + 5, dep.eta || dep.t + 30), to:dep.to, future, live:!future});
  return out;
}
function Schedule(p){
  const S = p.S, now = MP.now(), low = Q.lowStock();
  const hours = []; for (let x = 6; x < 19; x++) hours.push(x);
  return h(Card, {title:"Engineer schedule", icon:"clock", sub:"Jobs as booked. Travel from live location events; dashed travel is still to come."},
    h("div", {className:"tbl-wrap"}, h("div", {className:"svc-sch"},
      h("div", {className:"svc-srow", style:{borderTop:0}}, h("div"),
        h("div", {className:"svc-axis"}, hours.map(x => h("span", {key:x, style:{left:pct(x * 60) + "%"}}, U.pad(x) + ":00")),
          h("span", {className:"nowl", style:{left:pct(now) + "%"}}, "Now " + U.hm(now))),
        h("div")),
      Object.values(S.engineers).map(e => h(SchedRow, {key:e.id, e, S, now, low})))),
    h("div", {className:"svc-legend"},
      h("span", null, h("i", {className:"svc-t-acc", style:{border:"1px solid var(--accent-line)"}}), "Travelling"),
      h("span", null, h("i", {className:"svc-t-ok", style:{border:"1px solid var(--ok)"}}), "On site or ready"),
      h("span", null, h("i", {style:{border:"1px solid var(--border-strong)", background:"var(--surface-3)"}}), "Scheduled"),
      h("span", null, h("i", {style:{background:"repeating-linear-gradient(135deg,var(--dim) 0 2px,transparent 2px 5px)", opacity:.6}}), "Travel so far"),
      h("span", null, h("i", {style:{border:"1px dashed var(--dim)"}}), "Travel still to come"),
      h("span", null, h("i", {style:{width:2, height:12, background:"var(--accent)", borderRadius:0}}), "Now")));
}
function SchedRow(p){
  const e = p.e, S = p.S, n = Q.engNow(e.id);
  const jobs = Q.jobsToday().filter(j => j.eng === e.id && j.start);
  const dayObj = Q.day(e.id, TODAY);
  const past = legs(dayObj ? dayObj.ev : [], false), fut = legs((S.script || []).filter(x => x.eng === e.id).map(x => x.e), true);
  const all = past.concat(fut), planned = all.reduce((s, l) => s + (l.t1 - l.t0), 0);
  const alerts = p.low.filter(l => l.kind === "van" && l.loc === e.van);
  return h("div", {className:"svc-srow"},
    h("div", {className:"svc-sinfo"}, h(Av, {e, s:30}),
      h("div", {style:{minWidth:0, flex:1}},
        h("button", {type:"button", className:"ref", style:{color:"var(--ink)", fontWeight:600}, onClick:() => MP.go("engineers/" + e.id)}, e.name),
        h("div", {className:"row", style:{gap:6, marginTop:2}}, h("span", {className:"faint", style:{fontSize:11.5}}, Q.loc(e.van).name), h(Badge, {k:(MP.ENG_TONE || {})[n.status] || ""}, n.status)))),
    h("div", {className:"svc-track"},
      e.leave ? h("div", {className:"svc-leave"}, "On annual leave") : h(F, null,
        all.map((l, i) => h("div", {key:"l" + i, className:cx("svc-leg", l.future && "fut", l.live && "live"), style:{left:pct(l.t0) + "%", width:Math.max(.4, pct(l.t1) - pct(l.t0)) + "%"},
          title:"Travel to " + Q.placeName(l.to) + ", " + U.hm(l.t0) + " to " + U.hm(l.t1) + (l.live ? " (ETA)" : "")})),
        jobs.map(j => { const s = U.toMin(j.start), tone = UI.STATUS_TONE[j.status];
          return h("button", {key:j.id, type:"button", className:"svc-blk" + (tone ? " svc-t-" + tone : ""), style:{left:pct(s) + "%", width:Math.max(1.2, pct(s + (j.dur || 60)) - pct(s)) + "%"},
            title:"#" + j.id + " " + custName(j) + ", " + j.start + " for " + U.dur(j.dur) + ", " + j.status, onClick:() => MP.go("jobs/" + j.id)},
            h("b", {style:{fontWeight:600}}, custName(j)), h("span", {className:"mono", style:{opacity:.7, marginLeft:5}}, "#" + j.id)); })),
      h("div", {className:"svc-now", style:{left:pct(p.now) + "%"}})),
    h("div", {className:"svc-ssum"}, e.leave ? h("span", null, "Annual leave. Not tracked.") : h(F, null,
      h("span", null, h("b", {style:{color:"var(--ink)", fontWeight:600}}, n.done.length + "/" + n.jobs.length), " jobs done"),
      h("span", null, "Travel " + U.dur(n.travel) + " so far, " + U.dur(planned) + " planned"),
      alerts.length ? h("span", {style:{color:"var(--warn)"}, title:alerts.map(a => a.sku + " " + a.qty + " of " + a.min).join(", ")}, "Parts: " + alerts.map(a => a.sku + " " + a.qty + "/" + a.min).join(", "))
        : h("span", {className:"faint"}, "Van stock at minimum or above"))));
}
})();
