/* Myers Service OS pages, part B: Time and Travel, Workshop, Commercial, Parts, Warranty, Assets. */
(function(){
"use strict";
const MOS = window.MOS, R = window.React, h = R.createElement, F = R.Fragment;
const {useState} = R;
const U = MOS.util, Q = MOS.q, A = MOS.act;
const {Badge, Btn, Card, CardHead, Kpi, Av, Prov, Tabs, Seg, Bar, Field, Drawer, Table, Confirm, Prio, St, IrelandMap} = MOS.ui;
const custName = (id) => id && MOS.get().cust[id] ? MOS.get().cust[id].name : "Myers stock";
const Stat2 = (p) => h(MOS.Stat2, p);

/* ================= TIME AND TRAVEL ================= */
MOS.modules.time = {title:"Time and Travel", sub:"Working hours, travel and time on site, from the app and site geofences",
  tabs:() => [["day","Today"],["week","Last 5 days"],["discrepancies","Planned vs actual"],["privacy","Tracking and privacy"]],
  render:(s, tab, id) => tab === "week" ? h(Week, {s}) : tab === "discrepancies" ? h(Discrep, {s}) : tab === "privacy" ? h(Privacy, {s}) : h(Today, {s, id})};
const EV_COL = {"day-start":"var(--dim)", travel:"var(--accent)", arrive:"var(--ok)", "job-start":"var(--ok)", "job-end":"var(--ok)", depart:"var(--dim)", break:"var(--warn)", private:"var(--faint)", resume:"var(--dim)", "day-end":"var(--dim)"};
function segments(evs, nowM){
  // Turn the event stream into coloured blocks: travel, on site, break, private.
  const out = []; let cur = null;
  const close = (t) => { if (cur){ cur.to = t; if (cur.to > cur.from) out.push(cur); cur = null; } };
  evs.forEach(e => { const t = U.toMin(e.t);
    if (e.type === "day-start" || e.type === "depart" || e.type === "travel" || e.type === "resume"){ close(t); cur = {kind:"travel", from:t}; }
    else if (e.type === "arrive"){ close(t); cur = {kind:"site", from:t, label:e.label.replace(/^Arrived /, "")}; }
    else if (e.type === "break"){ close(t); out.push({kind:"break", from:t, to:t + 15}); cur = {kind:"travel", from:t + 15}; }
    else if (e.type === "private"){ close(t); cur = {kind:"private", from:t}; }
    else if (e.type === "day-end"){ close(t); } });
  close(cur ? Math.min(nowM, cur.from + (cur.kind === "site" ? 150 : 120)) : nowM);
  return out;
}
function Today(p){
  const s = p.s, people = s.engineers.filter(e => e.kind !== "workshop");
  const [sel, setSel] = useState(p.id || "eo"); const e = Q.eng(sel), evs = s.geo[sel] || [];
  const segs = segments(evs, U.nowMin()), T0 = 5 * 60, T1 = 19 * 60, pct = (m) => ((m - T0) / (T1 - T0) * 100) + "%";
  const sum = (k) => segs.filter(x => x.kind === k).reduce((n, x) => n + x.to - x.from, 0);
  return h("div", {className:"os-grid"},
    h(Card, null,
      h("div", {style:{display:"grid", gridTemplateColumns:"200px 1fr", padding:"12px 14px 4px"}}, h("div"),
        h("div", {style:{position:"relative", height:18}}, Array.from({length:15}, (_, i) => h("span", {key:i, className:"os-mono os-faint", style:{position:"absolute", left:pct(T0 + i * 60), transform:"translateX(-50%)", fontSize:10}}, U.pad(5 + i))))),
      people.map(x => { const sg = segments(s.geo[x.id] || [], U.nowMin());
        return h("div", {key:x.id, onClick:() => setSel(x.id), style:{display:"grid", gridTemplateColumns:"200px 1fr", alignItems:"center", padding:"8px 14px", borderTop:"1px solid var(--border)", cursor:"pointer", background: sel === x.id ? "var(--accent-faint)" : "none"}},
          h("div", {className:"os-row"}, h(Av, {e:x}), h("div", null, h("div", {style:{fontWeight:500}}, x.name), h("div", {className:"os-faint", style:{fontSize:11}}, x.kind === "sales" ? "Sales" : "Rostered " + x.start + " to " + x.end))),
          h("div", {style:{position:"relative", height:26, borderRadius:7, background:"var(--surface-faint)"}},
            h("div", {style:{position:"absolute", top:-3, bottom:-3, left:pct(U.nowMin()), width:2, background:"var(--accent)", opacity:.7}}),
            sg.map((b, i) => h("div", {key:i, title:b.kind + " " + U.hm(b.from) + " to " + U.hm(b.to) + (b.label ? " · " + b.label : ""),
              style:{position:"absolute", top:4, bottom:4, left:pct(Math.max(T0, b.from)), width:"calc(" + pct(Math.min(T1, b.to)) + " - " + pct(Math.max(T0, b.from)) + ")", borderRadius:5,
                background: b.kind === "site" ? "var(--ok)" : b.kind === "travel" ? "repeating-linear-gradient(135deg,var(--accent-line) 0 4px,transparent 4px 8px)" : b.kind === "break" ? "var(--warn)" : "var(--track)"}})))); }),
      h("div", {className:"os-row", style:{padding:"10px 14px", borderTop:"1px solid var(--border)", gap:16}}, [["var(--ok)","On site"],["repeating-linear-gradient(135deg,var(--accent-line) 0 4px,transparent 4px 8px)","Travel"],["var(--warn)","Break"],["var(--track)","Private (nothing recorded)"]].map(l =>
        h("span", {key:l[1], className:"os-row os-dim", style:{gap:6, fontSize:12}}, h("i", {style:{width:14, height:8, borderRadius:3, background:l[0], display:"inline-block"}}), l[1])))),
    h("div", {className:"os-grid", style:{gridTemplateColumns:"minmax(0,1fr) minmax(0,1.3fr)"}},
      h(Card, null, h(CardHead, {title:e.name + ", today", sub:e.early || e.patch}),
        h("div", {style:{padding:"0 18px 16px"}}, h(Stat2, {l:"Day started", v:(evs.find(x => x.type === "day-start") || {}).t || "Not yet"}), h(Stat2, {l:"Travel", v:U.dur(sum("travel"))}),
          h(Stat2, {l:"On site", v:U.dur(sum("site"))}), h(Stat2, {l:"Breaks", v:U.dur(sum("break"))}), h(Stat2, {l:"Jobs completed", v:evs.filter(x => x.type === "job-end").length}),
          e.kind === "field" ? h(Stat2, {l:"Utilisation, planned", v:Math.round(MOS.utilisation(e.id, 0).pct * 100) + "%"}) : null)),
      h(Card, null, h(CardHead, {title:"Event log", sub:"Each entry shows where it came from"}),
        h("div", {style:{padding:"0 18px 14px", maxHeight:330, overflow:"auto"}}, h("div", {className:"os-tl"}, evs.slice().reverse().map((g, i) => h("div", {key:i, className:"e " + (g.src === "geofence" ? "geofence" : "app")},
          h("div", null, g.label, g.job ? h("a", {href:"#", onClick:(ev) => { ev.preventDefault(); MOS.show("job", g.job); }, style:{color:"var(--accent)", marginLeft:6, textDecoration:"none"}}, g.job) : null),
          h("div", {className:"os-mono os-faint"}, g.t + " · " + (g.src === "geofence" ? "site geofence" : "engineer app")))))))));
}
function Week(p){
  const s = p.s;
  const rows = []; Object.keys(s.week).forEach(id => s.week[id].forEach(d => rows.push(Object.assign({eng:id, key:id + d.day}, d))));
  const tot = (id) => s.week[id].reduce((n, d) => n + d.travel + d.onsite, 0);
  return h("div", {className:"os-grid"},
    h("div", {className:"os-grid", style:{gridTemplateColumns:"repeat(3,minmax(0,1fr))"}}, Object.keys(s.week).map(id => { const e = Q.eng(id), w = s.week[id];
      const on = w.reduce((n, d) => n + d.onsite, 0), tr = w.reduce((n, d) => n + d.travel, 0);
      return h(Card, {key:id, pad:true}, h("div", {className:"os-row"}, h(Av, {e}), h("div", {style:{fontWeight:600}}, e.name), h("span", {className:"os-sp"}), h("span", {className:"os-mono"}, tot(id).toFixed(1) + " h")),
        h("div", {className:"os-row", style:{marginTop:10, gap:4}}, h("div", {style:{flex:on, height:8, borderRadius:4, background:"var(--ok)"}}), h("div", {style:{flex:tr, height:8, borderRadius:4, background:"var(--accent-line)"}})),
        h("div", {className:"os-dim", style:{fontSize:12, marginTop:6}}, on.toFixed(1) + " h on site · " + tr.toFixed(1) + " h travel · " + Math.round(on / (on + tr) * 100) + "% productive")); })),
    h(Card, null, h(CardHead, {title:"Timesheets", sub:"Built from the app, reviewed by the coordinator, exported for payroll", right:h(Btn, {sm:true, onClick:() => MOS.toast("Payroll CSV exported", "ok", "15 timesheet rows, week to date")}, "Export for payroll")}),
      h(Table, {cols:[{t:"Engineer", r:r => h("div", {className:"os-row"}, h(Av, {e:r.eng, s:22}), Q.eng(r.eng).name)}, {t:"Day", r:r => U.dayLabel(r.day)}, {t:"Start", r:r => h("span", {className:"os-mono"}, r.start)},
        {t:"Finish", r:r => h("span", {className:"os-mono"}, r.end)}, {t:"Travel", num:true, r:r => r.travel.toFixed(1) + " h"}, {t:"On site", num:true, r:r => r.onsite.toFixed(1) + " h"}, {t:"Jobs", num:true, r:r => r.jobs},
        {t:"Allowed on site", num:true, r:r => r.planned.toFixed(1) + " h"}, {t:"", r:r => U.toMin(r.start) < 360 ? h(Badge, {k:"line"}, "Early start") : null}], rows})));
}
function Discrep(p){
  const s = p.s;
  const rows = s.jobs.filter(j => j.actual && j.eng).map(j => Object.assign({key:j.id, delta:j.actual - j.dur}, j)).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 16);
  const byType = {}; s.jobs.filter(j => j.actual).forEach(j => { const m = s.machines[j.machine]; const k = m.model; byType[k] = byType[k] || [0, 0, 0]; byType[k][0] += j.dur; byType[k][1] += j.actual; byType[k][2]++; });
  return h("div", {className:"os-grid", style:{gridTemplateColumns:"minmax(0,1.6fr) minmax(0,1fr)", alignItems:"start"}},
    h(Card, null, h(CardHead, {title:"Jobs furthest from the time allowed", sub:"For planning accuracy, reviewed by a person, never automatic"}),
      h(Table, {cols:[{t:"Job", r:r => h("span", {className:"os-mono"}, r.id)}, {t:"Customer", r:r => custName(r.cust)}, {t:"Engineer", r:r => Q.eng(r.eng).name},
        {t:"Allowed", num:true, r:r => U.dur(r.dur)}, {t:"Actual", num:true, r:r => U.dur(r.actual)},
        {t:"Difference", num:true, r:r => h(Badge, {k: r.delta > 30 ? "warn" : r.delta < -30 ? "ok" : "line"}, (r.delta > 0 ? "+" : "") + U.dur(Math.abs(r.delta)).replace(/^/, r.delta < 0 ? "-" : ""))}],
        rows, onRow:(r) => MOS.show("job", r.id)})),
    h(Card, null, h(CardHead, {title:"Time allowed by machine type", sub:"Feeds the next plan"}),
      h(Table, {cols:[{t:"Model", r:r => r.k}, {t:"Jobs", num:true, r:r => r.v[2]}, {t:"Avg allowed", num:true, r:r => U.dur(r.v[0] / r.v[2])}, {t:"Avg actual", num:true, r:r => U.dur(r.v[1] / r.v[2])},
        {t:"", r:r => r.v[1] / r.v[0] > 1.15 ? h(Btn, {sm:true, onClick:() => MOS.toast("Standard time for " + r.k + " raised to " + U.dur(r.v[1] / r.v[2]), "ok", "Auto-plan uses it from tomorrow")}, "Adjust") : null}],
        rows:Object.keys(byType).map(k => ({key:k, k, v:byType[k]})).sort((a, b) => b.v[1] / b.v[0] - a.v[1] / a.v[0]).slice(0, 10)})));
}
function Privacy(p){
  const s = p.s, t = s.tracking;
  const Toggle = (q) => h("div", {className:"os-row", style:{padding:"11px 0", borderBottom:"1px solid var(--border)", alignItems:"flex-start"}},
    h("div", {style:{flex:1}}, h("div", {style:{fontWeight:500}}, q.t), h("div", {className:"os-dim", style:{fontSize:12}}, q.d)),
    q.fixed ? h(Badge, {k:"ok"}, q.fixed) : h(Seg, {items:q.items, value:q.value, onChange:q.onChange}));
  return h("div", {className:"os-grid", style:{gridTemplateColumns:"minmax(0,1.3fr) minmax(0,1fr)", alignItems:"start"}},
    h(Card, null, h(CardHead, {title:"Tracking policy", sub:"Built so tracking is only used for job costing, billing and lone-worker safety"}),
      h("div", {style:{padding:"0 18px 12px"}},
        Toggle({t:"Only while on duty", d:"Nothing is recorded before Start day, after Finish day, or while an engineer is on Private.", fixed:"Always on"}),
        Toggle({t:"What is stored", d:"Arrive and depart events at known sites, plus the start and finish location. No continuous breadcrumb trail.", items:[[false,"Site events only"],[true,"Full trail"]], value:t.trails, onChange:(v) => A.tracking({trails:v})}),
        Toggle({t:"Live position shown to the office", d:"Coarse: the current site or ‘travelling’, not a moving dot on a street map.", items:[[true,"Coarse"],[false,"Precise"]], value:t.coarse, onChange:(v) => A.tracking({coarse:v})}),
        Toggle({t:"Keep raw location events for", d:"Timesheet totals stay with the job for billing and tax. Raw events are deleted after this.", items:[[30,"30 days"],[90,"90 days"],[180,"180 days"]], value:t.retention, onChange:(v) => A.tracking({retention:v})}),
        Toggle({t:"Engineers see their own data", d:"Each engineer can view everything recorded about them and add a note or correction.", fixed:"Always on"}),
        Toggle({t:"Automated decisions", d:"Discrepancies are flagged for a person to review. Nothing disciplinary is automatic.", fixed:"Human review"}),
        t.trails ? h("div", {className:"os-confirm", style:{marginTop:12, borderColor:"var(--warn)", background:"var(--warn-soft)"}}, h("b", {style:{color:"var(--warn)"}}, "Full trails need a stronger case"), h("div", {className:"os-dim"}, "Recording a continuous route is harder to justify under GDPR. Update the DPIA and consult staff before switching this on.")) : null)),
    h("div", {className:"os-grid"},
      h(Card, null, h(CardHead, {title:"Legal basis and records"}),
        h("div", {style:{padding:"0 18px 16px"}}, h(Stat2, {l:"Lawful basis", v:"Legitimate interest"}), h(Stat2, {l:"DPIA", v:t.dpia ? "Completed 11 Sep" : "Outstanding", c:t.dpia ? "var(--ok)" : "var(--warn)"}),
          h(Stat2, {l:"Staff notice issued", v:"12 Sep"}), h(Stat2, {l:"Who can view location", v:"Coordinator, management"}), h(Stat2, {l:"Access to location is logged", v:"Yes"}))),
      h(Card, null, h(CardHead, {title:"Engineer acknowledgements", sub:"Notice read in the app"}),
        h(Table, {cols:[{t:"", w:30, r:e => h(Av, {e, s:22})}, {t:"Person", r:e => e.name}, {t:"Acknowledged", r:e => t.acks[e.id] ? h(Badge, {k:"ok"}, t.acks[e.id]) : h(Badge, {k:"warn"}, "Pending")},
          {t:"Now", r:e => t.onDuty[e.id] ? h(Badge, {k:"acc"}, "On duty") : h(Badge, {k:"line"}, "Not tracked")}], rows:s.engineers.map(e => Object.assign({key:e.id}, e))}))));
}

/* ================= WORKSHOP ================= */
MOS.modules.workshop = {title:"Workshop", sub:"Machines in for repair and refurbishment, costed live against the quote",
  tabs:(s) => [["board","Board", s.wsJobs.filter(w => w.stage !== "Collected").length],["bookin","Book a machine in"]],
  render:(s, tab) => tab === "bookin" ? h(BookIn, {s}) : h(WsBoard, {s})};
function WsBoard(p){
  const s = p.s;
  const costs = s.wsJobs.map(w => Q.wsCost(w));
  return h("div", {className:"os-grid"},
    h("div", {className:"os-grid", style:{gridTemplateColumns:"repeat(4,minmax(0,1fr))"}},
      h(Kpi, {label:"Machines on site", value:s.wsJobs.filter(w => w.stage !== "Collected").length, sub:"Customer and Myers stock"}),
      h(Kpi, {label:"Labour logged", value:costs.reduce((n, c) => n + c.hours, 0).toFixed(1) + " h", sub:"From bench timers"}),
      h(Kpi, {label:"Work in progress value", value:U.eur(costs.reduce((n, c) => n + c.total, 0)), sub:"Labour, parts, materials at cost"}),
      h(Kpi, {label:"Near or over quote", value:costs.filter(c => c.budget && c.pct > .9).length, color:"var(--warn)", sub:"Alert at 90%"})),
    h("div", {className:"os-kan"}, s.wsStages.map(st => { const items = s.wsJobs.filter(w => w.stage === st);
      return h("div", {key:st, className:"os-col"}, h("div", {className:"ch"}, st, h("span", {className:"os-mono os-faint"}, items.length)),
        items.map(w => { const m = s.machines[w.machine], c = Q.wsCost(w);
          return h("div", {key:w.id, className:"os-kc", onClick:() => MOS.show("ws", w.id)},
            h("div", {className:"os-row"}, h("span", {className:"os-mono"}, w.id), h("span", {className:"os-sp"}), h("span", {className:"os-faint", style:{fontSize:11}}, w.bay)),
            h("div", {style:{fontWeight:600, marginTop:5}}, m.mfr + " " + m.model), h("div", {className:"os-dim", style:{fontSize:12}}, w.cust ? custName(w.cust) : "Myers used stock"),
            h("div", {className:"os-faint", style:{fontSize:11.5, marginTop:4}}, "On site " + Math.abs(w.arrived) + " days" + (w.required ? " · needed in " + w.required : "")),
            c.budget ? h("div", {style:{marginTop:8}}, h(Bar, {v:c.pct}), h("div", {className:"os-row", style:{marginTop:4, fontSize:11}}, h("span", {className:"os-dim"}, U.eur(c.total) + " of " + U.eur(c.budget)), h("span", {className:"os-sp"}), h("span", {className:"os-mono", style:{color: c.pct > .9 ? "var(--warn)" : "var(--dim)"}}, Math.round(c.pct * 100) + "%"))) : null); }));
    })));
}
MOS.drawers.ws = function(p){
  const s = MOS.get(), w = Q.ws(p.id); const [eng, setEng] = useState("pn"), [hrs, setHrs] = useState("2"); const [part, setPart] = useState("");
  if (!w) return null;
  const m = s.machines[w.machine], c = Q.wsCost(w), q = w.quote ? Q.quote(w.quote) : null, idx = s.wsStages.indexOf(w.stage);
  const foot = [];
  if (idx > -1 && idx < s.wsStages.length - 1 && !(w.stage === "Awaiting approval" && q && q.status !== "Approved")) foot.push(h(Btn, {key:"n", onClick:() => A.wsStage(w.id, s.wsStages[idx + 1])}, "Move to " + s.wsStages[idx + 1]));
  if (w.stage === "Awaiting approval" && q && q.status === "Awaiting approval") foot.push(h(Btn, {key:"q", onClick:() => MOS.show("quote", q.id)}, "Open " + q.id));
  if (!w.invoice && w.cust && ["QC and test","Ready for collection"].indexOf(w.stage) > -1){
    if (q) foot.push(h(Btn, {key:"iq", k:"pri", onClick:() => A.wsInvoice(w.id, "quote")}, "Invoice at quote " + U.eur(Q.quoteTotal(q))));
    foot.push(h(Btn, {key:"ia", k: q ? "" : "pri", onClick:() => A.wsInvoice(w.id, "actual")}, "Invoice time and materials"));
  }
  if (w.invoice) foot.push(h(Btn, {key:"io", onClick:() => MOS.show("invoice", w.invoice)}, "Open " + w.invoice));
  foot.push(h(Btn, {key:"a", onClick:() => MOS.show("asset", w.machine)}, "Machine record"));
  return h(Drawer, {wide:true, kicker:w.id + " · " + w.bay + " · arrived " + U.dm(U.addDays(U.TODAY, w.arrived)), title:m.mfr + " " + m.model + " " + m.type.toLowerCase(), sub:(w.cust ? custName(w.cust) : "Myers used stock") + " · " + m.serial + " · " + w.reason, onClose:p.close, foot},
    h("div", {className:"os-grid", style:{gridTemplateColumns:"repeat(4,minmax(0,1fr))"}},
      h(Kpi, {label:"Labour", value:U.eur(c.lab), sub:c.hours + " h at €78"}), h(Kpi, {label:"Parts", value:U.eur(c.parts), sub:w.parts.length + " lines"}),
      h(Kpi, {label:"Materials", value:U.eur(c.mat)}), h(Kpi, {label: q ? "Cost vs quote" : "Cost vs budget", value:U.eur(c.total), sub: c.budget ? "of " + U.eur(c.budget) + " · " + Math.round(c.pct * 100) + "%" : "", color: c.pct > .9 ? "var(--warn)" : null})),
    c.budget ? h(Bar, {v:c.pct, style:{margin:"12px 0 4px", height:8}}) : null,
    h("div", {className:"os-split", style:{marginTop:12}},
      h(Card, null, h(CardHead, {title:"Work required"}), h("div", {style:{padding:"0 18px 12px"}}, w.work.map((t, i) => h("label", {key:i, className:"os-row", style:{padding:"6px 0", cursor:"pointer"}},
        h("input", {type:"checkbox", checked:t[1], onChange:() => A.wsTask(w.id, i)}), h("span", {style:{textDecoration:t[1] ? "line-through" : "none", color:t[1] ? "var(--dim)" : "var(--ink)"}}, t[0]))))),
      h(Card, null, h(CardHead, {title:"Labour by engineer"}),
        h(Table, {cols:[{t:"Engineer", r:l => Q.eng(l[0]).name}, {t:"Day", r:l => l[1] === 0 ? "Today" : U.dm(U.addDays(U.TODAY, l[1]))}, {t:"Hours", num:true, r:l => l[2]}], rows:w.labour.slice().reverse(), empty:"No time logged yet"}),
        h("div", {className:"os-row", style:{padding:12, borderTop:"1px solid var(--border)"}},
          h("select", {className:"os-sel", value:eng, onChange:(e) => setEng(e.target.value), style:{width:150}}, s.engineers.filter(e => e.kind !== "sales").map(e => h("option", {key:e.id, value:e.id}, e.name))),
          h("input", {className:"os-in", value:hrs, onChange:(e) => setHrs(e.target.value), style:{width:70}}), h(Btn, {sm:true, onClick:() => +hrs > 0 && A.wsHours(w.id, eng, +hrs)}, "Log hours")))),
    h("div", {className:"os-split", style:{marginTop:12}},
      h(Card, null, h(CardHead, {title:"Parts from stores"}),
        h(Table, {cols:[{t:"Part", r:x => x[0]}, {t:"Qty", num:true, r:x => x[1]}, {t:"Cost", num:true, r:x => U.eur(x[1] * x[2])}], rows:w.parts, empty:"None yet"}),
        h("div", {className:"os-row", style:{padding:12, borderTop:"1px solid var(--border)"}},
          h("select", {className:"os-sel", value:part, onChange:(e) => setPart(e.target.value)}, h("option", {value:""}, "Pick from warehouse"), Object.values(s.catalogue).filter(x => x.model === m.model || x.sku.indexOf("GEN") > -1).map(x => h("option", {key:x.sku, value:x.sku}, x.sku + " " + x.name + " (" + x.wh + ")"))),
          h(Btn, {sm:true, disabled:!part, onClick:() => { const x = s.catalogue[part]; A.set(st => { st.catalogue[part].wh = Math.max(0, st.catalogue[part].wh - 1); st.movements.unshift({id:"MV-" + (st.mvNo++), type:"fit", sku:part, qty:1, from:"Warehouse", to:w.id, ref:w.id, by:"Workshop", when:"Today " + U.hm(U.nowMin())}); });
            A.wsPart(w.id, x.name, 1, x.cost); setPart(""); }}, "Add"))),
      h(Card, null, h(CardHead, {title:"Materials and other costs"}),
        h(Table, {cols:[{t:"Item", r:x => x[0]}, {t:"Cost", num:true, r:x => U.eur(x[1])}], rows:w.materials, empty:"None yet"}),
        h("div", {style:{padding:12, borderTop:"1px solid var(--border)"}}, h(Btn, {sm:true, onClick:() => A.wsMat(w.id, "Consumables", 24)}, "Add consumables €24")))),
    h(Card, {pad:true, style:{marginTop:12}}, h("div", {className:"os-row"}, h("div", {className:"os-lbl", style:{margin:0}}, "Photos"), h("span", {className:"os-sp"}), h("span", {className:"os-dim"}, w.photos + " on file")),
      h("div", {className:"os-row os-wrap", style:{marginTop:8}}, Array.from({length:Math.min(6, w.photos)}, (_, i) => h(MOS.Photo, {key:i, ph:{label:["Arrival","Strip","Wear","Parts","Rebuild","Test"][i], t:"", hue:200 + i * 30}})))),
    q ? h(Prov, {style:{marginTop:10}}, "Quote " + q.id + " " + q.status.toLowerCase() + (q.approvedBy ? " by " + q.approvedBy + ", PO " + q.po : "") + ". Lines carried into this job and on to the invoice.") : null);
};
A.set = (fn) => MOS.set(fn);
function BookIn(p){
  const s = p.s; const [cust, setCust] = useState(""), [mid, setMid] = useState(""), [reason, setReason] = useState(""), [req, setReq] = useState("10"), [photos, setPhotos] = useState(0);
  const ms = Object.values(s.machines).filter(m => m.cust === cust && m.status !== "in-workshop");
  return h(Card, {style:{maxWidth:760}}, h(CardHead, {title:"Book a machine in", sub:"Creates the workshop job and updates the machine record in one go"}),
    h("div", {style:{padding:"4px 18px 18px"}},
      h("div", {className:"os-split"},
        h(Field, {label:"Customer"}, h("select", {className:"os-sel", value:cust, onChange:(e) => { setCust(e.target.value); setMid(""); }}, h("option", {value:""}, "Choose"), Object.values(s.cust).map(c => h("option", {key:c.id, value:c.id}, c.name)))),
        h(Field, {label:"Machine"}, h("select", {className:"os-sel", value:mid, onChange:(e) => setMid(e.target.value)}, h("option", {value:""}, cust ? "Choose from their machines" : "Choose customer first"), ms.map(m => h("option", {key:m.id, value:m.id}, m.model + " " + m.type + " · " + m.serial))))),
      h(Field, {label:"Date arrived"}, h("input", {className:"os-in", value:U.dm(U.TODAY) + " " + U.TODAY.getFullYear(), readOnly:true})),
      h(Field, {label:"Reason for repair or refurbishment"}, h("textarea", {className:"os-ta", value:reason, onChange:(e) => setReason(e.target.value)})),
      h("div", {className:"os-split"}, h(Field, {label:"Needed back in (days)"}, h("input", {className:"os-in", value:req, onChange:(e) => setReq(e.target.value)})),
        h(Field, {label:"Condition photos"}, h("div", {className:"os-row"}, h(Btn, {sm:true, onClick:() => setPhotos(photos + 1)}, "Add photo"), h("span", {className:"os-dim"}, photos + " taken")))),
      h(Btn, {k:"pri", disabled:!cust || !mid || !reason, onClick:() => { A.bookIn({cust, machine:mid, reason, required:+req, photos}); MOS.setTab("board"); }}, "Book in")));
}

/* ================= COMMERCIAL: quotes, invoicing, hire ================= */
MOS.modules.commercial = {title:"Quotes and Invoicing", sub:"Quote, approval, job, invoice: one connected record",
  tabs:(s) => [["invoicing","Invoicing", Q.readyToInvoice().length],["quotes","Quotes", s.quotes.filter(q => q.status === "Awaiting approval").length],["hire","Hire"]],
  render:(s, tab) => tab === "quotes" ? h(Quotes, {s}) : tab === "hire" ? h(Hire, {s}) : h(Invoicing, {s})};
function Invoicing(p){
  const s = p.s; const [f, setF] = useState("Draft"); const [pick, setPick] = useState({}); const [ask, setAsk] = useState(false);
  const rows = s.invoices.filter(i => f === "All" || i.status === f).map(i => Object.assign({key:i.id}, i));
  const drafts = Q.readyToInvoice(), chosen = drafts.filter(i => pick[i.id] !== false).map(i => i.id);
  const completed = s.jobs.filter(j => j.status === "Completed");
  const sum = (st) => s.invoices.filter(i => i.status === st).reduce((n, i) => n + i.total, 0);
  return h("div", {className:"os-grid"},
    h("div", {className:"os-grid", style:{gridTemplateColumns:"repeat(4,minmax(0,1fr))"}},
      h(Kpi, {label:"Ready to invoice", value:U.eur(sum("Draft")), sub:drafts.length + " drafts, built from job sheets", color:"var(--accent)", onClick:() => setF("Draft")}),
      h(Kpi, {label:"Completed, awaiting review", value:completed.length, sub:"Review drafts the invoice", color: completed.length ? "var(--warn)" : null}),
      h(Kpi, {label:"Sent, unpaid", value:U.eur(sum("Sent")), onClick:() => setF("Sent")}),
      h(Kpi, {label:"Overdue", value:"€71,800", sub:"9 accounts, see Helios", color:"var(--bad)", onClick:() => setF("Overdue")})),
    completed.length ? h(Card, null, h(CardHead, {title:"Completed on site, waiting for a quick review", sub:"One click checks the job sheet and drafts the invoice"}),
      h(Table, {cols:[{t:"Job", r:j => h("span", {className:"os-mono"}, j.id)}, {t:"Customer", r:j => custName(j.cust)}, {t:"Engineer", r:j => j.eng ? Q.eng(j.eng).name : ""}, {t:"Billing", r:j => h(Badge, {k: j.billing === "warranty" ? "acc" : "line"}, j.billing)},
        {t:"", r:j => h("div", {className:"os-row"}, h(Btn, {sm:true, onClick:(e) => { e.stopPropagation(); MOS.show("job", j.id); }}, "Job sheet"), h(Btn, {sm:true, k:"pri", onClick:(e) => { e.stopPropagation(); A.review(j.id); }}, "Review and draft"))}],
        rows:completed.map(j => Object.assign({key:j.id}, j)), onRow:(j) => MOS.show("job", j.id)})) : null,
    h("div", {className:"os-row"}, h(Seg, {items:[["Draft","Ready to invoice"],["Sent","Sent"],["Overdue","Overdue"],["Paid","Paid"],["All","All"]], value:f, onChange:setF}), h("span", {className:"os-sp"}),
      f === "Draft" && drafts.length ? h(Btn, {k:"pri", disabled:!chosen.length, onClick:() => setAsk(true)}, "Approve and send " + chosen.length) : null),
    ask ? h(Confirm, {tool:"invoice.approve_and_send", args:chosen, summary:"Email " + chosen.length + " invoices, " + U.eur2(drafts.filter(i => chosen.indexOf(i.id) > -1).reduce((n, i) => n + i.total, 0)) + " net, each with its signed job sheet attached, and sync them to Xero.",
      yes:"Confirm and send", onYes:() => { A.sendInvoices(chosen); setAsk(false); setPick({}); }, onNo:() => setAsk(false)}) : null,
    h(Card, null, h(Table, {cols:[
      f === "Draft" ? {t:"", w:30, r:i => h("input", {type:"checkbox", checked:pick[i.id] !== false, onClick:(e) => e.stopPropagation(), onChange:(e) => setPick(Object.assign({}, pick, {[i.id]:e.target.checked}))})} : {t:"", w:1, r:() => null},
      {t:"Invoice", r:i => h("span", {className:"os-mono"}, i.id)}, {t:"Customer", r:i => custName(i.cust)}, {t:"From", r:i => h("span", {className:"os-mono os-dim"}, i.source)},
      {t:"Kind", r:i => h(Badge, {k:"line"}, i.kind)}, {t:"Notes", r:i => (i.flags || []).slice(0, 1).map((x, k) => h("span", {key:k, className:"os-dim", style:{fontSize:12}}, x))},
      {t:"Status", r:i => h(Badge, {k: i.status === "Draft" ? "acc" : i.status === "Overdue" ? "bad" : i.status === "Paid" ? "ok" : ""}, i.status)},
      {t:"Sync", r:i => h("span", {className:"os-faint", style:{fontSize:11.5}}, i.sync)}, {t:"Net", num:true, r:i => U.eur2(i.total)}],
      rows, onRow:(i) => MOS.show("invoice", i.id), empty:"No invoices here"})));
}
function Quotes(p){
  const s = p.s; const [f, setF] = useState("Awaiting approval"); const [creating, setCreating] = useState(false);
  const rows = s.quotes.filter(q => f === "All" || q.status === f).map(q => Object.assign({key:q.id}, q));
  const pend = s.quotes.filter(q => q.status === "Awaiting approval");
  return h("div", {className:"os-grid"},
    h("div", {className:"os-grid", style:{gridTemplateColumns:"repeat(4,minmax(0,1fr))"}},
      h(Kpi, {label:"Awaiting approval", value:U.eur(pend.reduce((n, q) => n + Q.quoteTotal(q), 0)), sub:pend.length + " quotes", onClick:() => setF("Awaiting approval")}),
      h(Kpi, {label:"Expiring within 20 days", value:pend.filter(q => q.valid <= 20).length, color:"var(--warn)"}),
      h(Kpi, {label:"Approved, not started", value:s.quotes.filter(q => q.status === "Approved").length, onClick:() => setF("Approved")}),
      h(Kpi, {label:"Win rate, 90 days", value:"64%", sub:"Demo figure"})),
    h("div", {className:"os-row"}, h(Seg, {items:[["Awaiting approval","Awaiting"],["Approved","Approved"],["Converted","Converted"],["Draft","Drafts"],["Declined","Declined"],["All","All"]], value:f, onChange:setF}),
      h("span", {className:"os-sp"}), h(Btn, {k:"pri", onClick:() => setCreating(true)}, "New quote")),
    creating ? h(QuoteBuilder, {s, done:() => { setCreating(false); setF("Draft"); }}) : null,
    h(Card, null, h(Table, {cols:[{t:"Quote", r:q => h("span", {className:"os-mono"}, q.id)}, {t:"Customer", r:q => custName(q.cust)}, {t:"For", r:q => q.title},
      {t:"Status", r:q => h(Badge, {k: q.status === "Approved" ? "ok" : q.status === "Awaiting approval" ? "warn" : q.status === "Converted" ? "acc" : "line"}, q.status)},
      {t:"Sent", r:q => q.sent != null ? q.sent + "d ago" : ""}, {t:"Valid", r:q => q.valid ? q.valid + " days" : ""}, {t:"Value", num:true, r:q => U.eur(Q.quoteTotal(q))}],
      rows, onRow:(q) => MOS.show("quote", q.id)})));
}
function QuoteBuilder(p){
  const s = p.s; const [cust, setCust] = useState(""), [mid, setMid] = useState(""), [title, setTitle] = useState(""), [lines, setLines] = useState([["labour","Labour",4,84]]);
  const ms = Object.values(s.machines).filter(m => m.cust === cust);
  const m = s.machines[mid], parts = m ? Object.values(s.catalogue).filter(x => x.model === m.model) : [];
  const tot = lines.reduce((n, l) => n + l[2] * l[3], 0), cost = lines.reduce((n, l) => n + l[2] * (l[0] === "labour" ? 38 : l[3] / 1.45), 0);
  const upd = (i, k, v) => setLines(lines.map((l, j) => j === i ? l.map((x, n) => n === k ? v : x) : l));
  return h(Card, null, h(CardHead, {title:"New quote", sub:"Rates from the customer’s contract, part prices and stock live from stores"}),
    h("div", {style:{padding:"4px 18px 18px"}},
      h("div", {className:"os-grid", style:{gridTemplateColumns:"1fr 1fr 1.4fr"}},
        h(Field, {label:"Customer"}, h("select", {className:"os-sel", value:cust, onChange:(e) => { setCust(e.target.value); setMid(""); const c = s.cust[e.target.value]; if (c) setLines([["labour","Labour",4,c.rates.labour]]); }}, h("option", {value:""}, "Choose"), Object.values(s.cust).map(c => h("option", {key:c.id, value:c.id}, c.name)))),
        h(Field, {label:"Machine"}, h("select", {className:"os-sel", value:mid, onChange:(e) => setMid(e.target.value)}, h("option", {value:""}, "Choose"), ms.map(x => h("option", {key:x.id, value:x.id}, x.model + " · " + x.serial)))),
        h(Field, {label:"Title"}, h("input", {className:"os-in", value:title, onChange:(e) => setTitle(e.target.value), placeholder:"What the customer is approving"}))),
      h("table", {className:"os-t"}, h("thead", null, h("tr", null, ["Type","Description","Qty","Price",""].map((x, i) => h("th", {key:i}, x)))),
        h("tbody", null, lines.map((l, i) => h("tr", {key:i}, h("td", null, h(Badge, {k:"line"}, l[0])), h("td", null, h("input", {className:"os-in", value:l[1], onChange:(e) => upd(i, 1, e.target.value)})),
          h("td", {style:{width:90}}, h("input", {className:"os-in", value:l[2], onChange:(e) => upd(i, 2, +e.target.value || 0)})), h("td", {style:{width:110}}, h("input", {className:"os-in", value:l[3], onChange:(e) => upd(i, 3, +e.target.value || 0)})),
          h("td", null, h(Btn, {k:"ghost", sm:true, onClick:() => setLines(lines.filter((_, j) => j !== i))}, "Remove")))))),
      h("div", {className:"os-row os-wrap", style:{marginTop:10}},
        h(Btn, {sm:true, onClick:() => setLines(lines.concat([["labour","Labour",2, cust ? s.cust[cust].rates.labour : 84]]))}, "Add labour"),
        parts.length ? h("select", {className:"os-sel", style:{width:260}, value:"", onChange:(e) => { const x = s.catalogue[e.target.value]; if (x) setLines(lines.concat([["part", x.sku + " " + x.name, 1, x.sell]])); }},
          h("option", {value:""}, "Add a part for " + m.model), parts.map(x => h("option", {key:x.sku, value:x.sku}, x.name + " · " + U.eur(x.sell) + " · " + Q.totalStock(x.sku) + " in stock"))) : null,
        h(Btn, {sm:true, onClick:() => setLines(lines.concat([["material","Materials",1,60]]))}, "Add materials"),
        h("span", {className:"os-sp"}), h("span", {className:"os-dim"}, "Margin " + (tot ? Math.round((1 - cost / tot) * 100) : 0) + "% (internal)"), h("span", {style:{fontWeight:600, marginLeft:12}}, U.eur(tot))),
      h("div", {className:"os-row", style:{marginTop:14}}, h(Btn, {k:"pri", disabled:!cust || !mid || !title, onClick:() => { A.newQuote({cust, machine:mid, title, lines:lines.map(l => l.slice())}); p.done(); }}, "Save draft"), h(Btn, {k:"ghost", onClick:p.done}, "Cancel"))));
}
MOS.drawers.quote = function(p){
  const s = MOS.get(), q = Q.quote(p.id); const [appr, setAppr] = useState(false);
  if (!q) return null;
  const c = s.cust[q.cust], tot = Q.quoteTotal(q), foot = [];
  if (q.status === "Draft") foot.push(h(Btn, {key:"s", k:"pri", onClick:() => A.quoteStatus(q.id, "Awaiting approval")}, "Send to " + c.contact[0]));
  if (q.status === "Awaiting approval"){ foot.push(h(Btn, {key:"c", onClick:() => MOS.toast("Chase drafted to " + c.contact[0], "ok", "Waits in Helios for your yes")}, "Chase")); foot.push(h(Btn, {key:"a", k:"pri", onClick:() => setAppr(true)}, "Customer approves (demo)")); }
  if (q.status === "Approved") foot.push(h(Btn, {key:"v", k:"pri", onClick:() => A.convertQuote(q.id)}, "Convert to job"));
  if (q.job) foot.push(h(Btn, {key:"j", onClick:() => MOS.show(q.job.indexOf("WS") === 0 ? "ws" : "job", q.job)}, "Open " + q.job));
  return h(Drawer, {kicker:q.id + " · " + q.status, title:q.title, sub:c.name + (s.machines[q.machine] ? " · " + s.machines[q.machine].model + " " + s.machines[q.machine].serial : ""), onClose:p.close, foot},
    appr ? h(Card, {pad:true, style:{marginBottom:12, borderColor:"var(--accent-line)"}},
      h("div", {className:"os-lbl"}, "What " + c.contact[0] + " sees on the approval link"),
      h("div", {style:{fontWeight:600, fontSize:15}}, "Myers Food Machinery · Quote " + q.id), h("div", {className:"os-dim"}, q.title + " · " + U.eur(tot) + " + VAT"),
      h("div", {className:"os-row", style:{marginTop:10}}, h("input", {className:"os-in", defaultValue:"PO-" + (4000 + (q.id.charCodeAt(4) * 7) % 900), id:"os-po", style:{width:140}}),
        h(Btn, {k:"pri", onClick:() => { A.quoteStatus(q.id, "Approved", {approvedBy:c.contact[0], po:document.getElementById("os-po").value}); setAppr(false); }}, "Approve"),
        h(Btn, {onClick:() => { A.quoteStatus(q.id, "Declined"); setAppr(false); }}, "Decline"))) : null,
    h(Card, null, h(Table, {cols:[{t:"Type", r:l => h(Badge, {k:"line"}, l[0])}, {t:"Description", r:l => l[1]}, {t:"Qty", num:true, r:l => l[2]}, {t:"Price", num:true, r:l => U.eur(l[3])}, {t:"Total", num:true, r:l => U.eur(l[2] * l[3])}], rows:q.lines}),
      h("div", {className:"os-row", style:{padding:"12px"}}, h("span", {className:"os-sp"}), h("b", null, U.eur(tot) + " + VAT"))),
    q.approvedBy ? h(Prov, {style:{marginTop:10}}, "Approved by " + q.approvedBy + ", PO " + q.po + ". Lines carry into the job and the invoice.") : h(Prov, {style:{marginTop:10}}, "Valid " + q.valid + " days. Approval by link, no re-keying."));
};
function Hire(p){
  const s = p.s; const fleet = Object.values(s.machines).filter(m => m.ownership === "hire");
  const live = s.hire.filter(x => !x.closed), rev = live.reduce((n, x) => n + (x.period === "week" ? x.rate * 4.33 : x.rate), 0);
  return h("div", {className:"os-grid"},
    h("div", {className:"os-grid", style:{gridTemplateColumns:"repeat(4,minmax(0,1fr))"}},
      h(Kpi, {label:"Hire fleet", value:fleet.length}), h(Kpi, {label:"On hire", value:live.length, sub:Math.round(live.length / fleet.length * 100) + "% utilised"}),
      h(Kpi, {label:"Monthly hire revenue", value:U.eur(rev)}), h(Kpi, {label:"Off-hire this week", value:live.filter(x => x.end <= 5).length, color:"var(--warn)"})),
    h(Card, null, h(CardHead, {title:"Contracts", sub:"Hire invoices generate on schedule into Invoicing"}),
      h(Table, {cols:[{t:"Contract", r:x => h("span", {className:"os-mono"}, x.id)}, {t:"Machine", r:x => { const m = s.machines[x.asset]; return m.model + " " + m.type.toLowerCase() + " · " + m.serial; }},
        {t:"Customer", r:x => custName(x.cust)}, {t:"From", r:x => U.dm(U.addDays(U.TODAY, x.start))}, {t:"To", r:x => x.closed ? "Returned" : U.dm(U.addDays(U.TODAY, x.end))},
        {t:"Rate", num:true, r:x => U.eur(x.rate) + "/" + x.period}, {t:"", r:x => x.note ? h("span", {className:"os-dim", style:{fontSize:12}}, x.note) : null},
        {t:"", r:x => !x.closed && x.end <= 5 ? h(Btn, {sm:true, onClick:(e) => { e.stopPropagation(); A.offHire(x.id); }}, "Off-hire inspection") : x.closed ? h(Badge, {k:"ok"}, "Closed") : null}],
        rows:s.hire.map(x => Object.assign({key:x.id}, x)), onRow:(x) => MOS.show("asset", x.asset)})),
    h(Card, null, h(CardHead, {title:"Available to hire"}), h(Table, {cols:[{t:"Asset", r:m => h("span", {className:"os-mono"}, m.id)}, {t:"Machine", r:m => m.mfr + " " + m.model + " " + m.type.toLowerCase()}, {t:"Serial", r:m => m.serial}, {t:"Location", r:m => m.location}],
      rows:fleet.filter(m => m.status === "available").map(m => Object.assign({key:m.id}, m)), onRow:(m) => MOS.show("asset", m.id), empty:"Whole fleet is out"})));
}

/* ================= PARTS AND VANS ================= */
MOS.modules.parts = {title:"Parts and Vans", sub:"Warehouse to van to job, every movement recorded from the job sheet",
  tabs:(s) => [["stock","Stock"],["vans","Vans", Q.lowVan().length],["movements","Movements"],["reorders","Reorders", Q.lowWh().length]],
  render:(s, tab) => tab === "vans" ? h(Vans, {s}) : tab === "movements" ? h(Moves, {s}) : tab === "reorders" ? h(Reorders, {s}) : h(Stock, {s})};
function Stock(p){
  const s = p.s, vans = Q.field(); const [qq, setQ] = useState("");
  const rows = Object.values(s.catalogue).filter(x => !qq || (x.sku + x.name + x.model + x.mfr).toLowerCase().indexOf(qq.toLowerCase()) > -1).map(x => Object.assign({key:x.sku}, x));
  const sv = Q.stockValue();
  return h("div", {className:"os-grid"},
    h("div", {className:"os-grid", style:{gridTemplateColumns:"repeat(4,minmax(0,1fr))"}},
      h(Kpi, {label:"Warehouse stock value", value:U.eur(sv.wh)}), h(Kpi, {label:"Stock in vans", value:U.eur(sv.van), sub:vans.length + " vans"}),
      h(Kpi, {label:"Below minimum", value:Q.lowWh().length, color:"var(--warn)", onClick:() => MOS.setTab("reorders")}),
      h(Kpi, {label:"Warranty returns held", value:s.claims.filter(c => c.returnTag && ["Return requested","Drafted","Submitted"].indexOf(c.stage) > -1).length, onClick:() => MOS.nav("warranty/returns")})),
    h(Card, null, h(CardHead, {title:"Where every part is", sub:"One grid across the warehouse and each van", right:h("input", {className:"os-in", placeholder:"Search parts", value:qq, onChange:(e) => setQ(e.target.value), style:{width:220}})}),
      h(Table, {cols:[{t:"SKU", r:x => h("span", {className:"os-mono"}, x.sku)}, {t:"Part", r:x => h("div", null, x.name, h("div", {className:"os-faint", style:{fontSize:11}}, x.mfr + " · " + x.model))},
        {t:"Warehouse", num:true, r:x => h("span", {style:{color: x.wh < x.min ? "var(--bad)" : "var(--ink)", fontWeight: x.wh < x.min ? 600 : 400}}, x.wh)}]
        .concat(vans.map(e => ({t:"Van " + e.initials, num:true, r:x => { const q = Q.vanQty(e.id, x.sku), mn = (s.vanMin[e.id] || {})[x.sku]; return h("span", {style:{color: mn && q < mn ? "var(--warn)" : q ? "var(--ink)" : "var(--faint)"}}, q || "·"); }})))
        .concat([{t:"Total", num:true, r:x => h("b", null, Q.totalStock(x.sku))}, {t:"Min", num:true, r:x => x.min}, {t:"On order", num:true, r:x => x.onOrder || ""}, {t:"Sell", num:true, r:x => U.eur(x.sell)}]),
        rows, onRow:(x) => MOS.show("part", x.sku)})));
}
MOS.drawers.part = function(p){
  const s = MOS.get(), x = Q.part(p.id); if (!x) return null;
  const mv = s.movements.filter(m => m.sku === x.sku);
  const compat = Object.values(s.machines).filter(m => m.model === x.model);
  return h(Drawer, {kicker:x.sku + " · bin " + x.bin, title:x.name, sub:x.mfr + " · fits " + x.model + " · cost " + U.eur(x.cost) + " · sell " + U.eur(x.sell), onClose:p.close,
    foot:Q.field().map(e => h(Btn, {key:e.id, sm:true, disabled:!x.wh, onClick:() => A.transfer(e.id, x.sku, 1)}, "Move 1 to " + e.name.split(" ")[0] + "’s van"))},
    h("div", {className:"os-grid", style:{gridTemplateColumns:"repeat(4,minmax(0,1fr))"}}, h(Kpi, {label:"Warehouse", value:x.wh}), ...Q.field().map(e => h(Kpi, {key:e.id, label:"Van " + e.name.split(" ")[0], value:Q.vanQty(e.id, x.sku)}))),
    h(Card, {style:{marginTop:12}}, h(CardHead, {title:"Movement history"}), h(Table, {cols:[{t:"When", r:m => h("span", {className:"os-mono"}, m.when)}, {t:"Type", r:m => h(Badge, {k:m.type === "fit" ? "acc" : m.type === "receive" ? "ok" : "line"}, m.type)}, {t:"From", r:m => m.from}, {t:"To", r:m => m.to}, {t:"Ref", r:m => h("span", {className:"os-mono"}, m.ref)}], rows:mv, empty:"No movements yet"})),
    h(Card, {style:{marginTop:12}}, h(CardHead, {title:"Machines it fits", sub:compat.length + " in the installed base"}), h(Table, {cols:[{t:"Machine", r:m => h("span", {className:"os-mono"}, m.id)}, {t:"Customer", r:m => custName(m.cust)}, {t:"Serial", r:m => m.serial}], rows:compat.slice(0, 8), onRow:(m) => MOS.show("asset", m.id)})));
};
function Vans(p){
  const s = p.s; const low = Q.lowVan();
  return h("div", {className:"os-grid"},
    low.length ? h(Card, {pad:true, style:{borderColor:"var(--warn)"}}, h("div", {className:"os-row"}, h("div", {style:{flex:1}}, h("div", {style:{fontWeight:600}}, low.length + " van lines below minimum"), h("div", {className:"os-dim"}, low.map(l => Q.eng(l.eng).name.split(" ")[0] + ": " + l.sku + " (" + l.qty + "/" + l.min + ")").join(" · "))),
      h(Btn, {k:"pri", onClick:() => A.replenishAll()}, "Replenish all from warehouse"))) : null,
    h("div", {className:"os-grid", style:{gridTemplateColumns:"repeat(3,minmax(0,1fr))"}}, Q.field().map(e => { const v = s.vans[e.id] || {}, used = s.movements.filter(m => m.type === "fit" && m.from === "Van · " + e.name && /Today/.test(m.when));
      return h(Card, {key:e.id}, h(CardHead, {title:e.name + "’s van", sub:e.van + " · " + e.patch, right:h(Av, {e})}),
        h(Table, {cols:[{t:"Part", r:sku => h("div", null, h("span", {className:"os-mono"}, sku), h("div", {className:"os-faint", style:{fontSize:11}}, s.catalogue[sku].name))},
          {t:"Qty", num:true, r:sku => { const mn = (s.vanMin[e.id] || {})[sku]; return h("span", {style:{color: mn && v[sku] < mn ? "var(--warn)" : "var(--ink)", fontWeight:600}}, v[sku] + (mn ? " / " + mn : "")); }},
          {t:"", r:sku => h("span", {className:"os-row", style:{gap:2}}, h(Btn, {k:"ghost", sm:true, title:"Move one from the warehouse", onClick:() => A.transfer(e.id, sku, 1)}, "+1"),
            h(Btn, {k:"ghost", sm:true, title:"Return one to the warehouse", disabled:!v[sku], onClick:() => A.returnToStock(e.id, sku)}, "Return"))}], rows:Object.keys(v)}),
        h("div", {style:{padding:"10px 18px 14px", borderTop:"1px solid var(--border)"}}, h("div", {className:"os-lbl"}, "Used today, from job sheets"), used.length ? used.map(m => h("div", {key:m.id, className:"os-dim"}, m.sku + " → " + m.to)) : h("div", {className:"os-faint"}, "Nothing yet"))); })));
}
function Moves(p){
  const s = p.s; const [t, setT] = useState("all");
  const rows = s.movements.filter(m => t === "all" || m.type === t);
  return h(Card, null, h(CardHead, {title:"Stock movement ledger", sub:"Nobody types stock usage; it comes from job sheets, transfers and deliveries",
    right:h(Seg, {items:[["all","All"],["fit","Fitted"],["remove","Removed"],["transfer","To vans"],["receive","Received"],["return","Returned"],["ship","Shipped"]], value:t, onChange:setT})}),
    h(Table, {cols:[{t:"Ref", r:m => h("span", {className:"os-mono os-faint"}, m.id)}, {t:"When", r:m => m.when}, {t:"Type", r:m => h(Badge, {k:m.type === "fit" ? "acc" : m.type === "receive" ? "ok" : m.type === "remove" ? "warn" : "line"}, m.type)},
      {t:"Part", r:m => h("span", null, h("span", {className:"os-mono"}, m.sku), " ", h("span", {className:"os-dim"}, s.catalogue[m.sku] ? s.catalogue[m.sku].name : ""))}, {t:"Qty", num:true, r:m => m.qty},
      {t:"From", r:m => m.from}, {t:"To", r:m => m.to}, {t:"Linked", r:m => h("a", {href:"#", style:{color:"var(--accent)", textDecoration:"none"}, onClick:(e) => { e.preventDefault(); const k = /^JOB/.test(m.ref) ? "job" : /^WC/.test(m.ref) ? "claim" : /^WS/.test(m.ref) ? "ws" : null; if (k) MOS.show(k, m.ref); }}, m.ref)}, {t:"By", r:m => m.by}],
      rows:rows.map(m => Object.assign({key:m.id}, m))}));
}
function Reorders(p){
  const s = p.s, low = Q.lowWh(); const [ask, setAsk] = useState(false);
  const blocked = s.jobs.filter(j => j.status === "Awaiting parts");
  return h("div", {className:"os-grid"},
    h(Card, null, h(CardHead, {title:"Below minimum in the warehouse", sub:"Suggested order brings each line back to twice the minimum", right:low.filter(x => !x.po).length ? h(Btn, {k:"pri", onClick:() => setAsk(true)}, "Raise purchase order") : null}),
      ask ? h("div", {style:{padding:"0 18px 12px"}}, h(Confirm, {tool:"purchasing.raise_po", args:low.map(x => x.sku), summary:"Raise purchase orders for " + low.filter(x => !x.po).length + " lines, grouped by manufacturer, " + U.eur(low.filter(x => !x.po).reduce((n, x) => n + Math.max(x.min * 2 - x.wh, 1) * x.cost, 0)) + " at cost.",
        yes:"Confirm and raise", onYes:() => { A.raisePO(low.filter(x => !x.po).map(x => x.sku)); setAsk(false); }, onNo:() => setAsk(false)})) : null,
      h(Table, {cols:[{t:"SKU", r:x => h("span", {className:"os-mono"}, x.sku)}, {t:"Part", r:x => x.name}, {t:"Supplier", r:x => x.mfr}, {t:"Warehouse", num:true, r:x => x.wh}, {t:"Min", num:true, r:x => x.min},
        {t:"Suggested", num:true, r:x => Math.max(x.min * 2 - x.wh, 1)}, {t:"On order", r:x => x.onOrder ? h(Badge, {k:"acc"}, x.onOrder + (x.po ? " · " + x.po : "") + (x.eta ? " · " + x.eta : "")) : h(Badge, {k:"warn"}, "Not ordered")}],
        rows:low.map(x => Object.assign({key:x.sku}, x)), empty:"Nothing below minimum", onRow:(x) => MOS.show("part", x.sku)})),
    h(Card, null, h(CardHead, {title:"Jobs waiting on parts", sub:"Shown beside the part that blocks them"}),
      h(Table, {cols:[{t:"Job", r:j => h("span", {className:"os-mono"}, j.id)}, {t:"Customer", r:j => custName(j.cust)}, {t:"Part", r:j => j.parts.map(x => x + " " + s.catalogue[x].name).join(", ")},
        {t:"Arrives", r:j => j.parts.map(x => s.catalogue[x].eta || "Not ordered").join(", ")}], rows:blocked.map(j => Object.assign({key:j.id}, j)), onRow:(j) => MOS.show("job", j.id)})));
}

/* ================= WARRANTY ================= */
MOS.modules.warranty = {title:"Warranty", sub:"Claims raise themselves when a part is fitted on a warranty job",
  tabs:(s) => [["claims","Claims", Q.claimsOpen().length],["returns","Faulty part returns"],["manufacturers","Manufacturers"]],
  render:(s, tab) => tab === "returns" ? h(Returns, {s}) : tab === "manufacturers" ? h(Mfrs, {s}) : h(Claims, {s})};
function Claims(p){
  const s = p.s, open = Q.claimsOpen();
  const stages = ["Drafted","Submitted","Return requested","Part shipped","Assessed","Credited"];
  return h("div", {className:"os-grid"},
    h("div", {className:"os-grid", style:{gridTemplateColumns:"repeat(4,minmax(0,1fr))"}},
      h(Kpi, {label:"Credits outstanding", value:U.eur(open.reduce((n, c) => n + c.value, 0)), sub:open.length + " open claims", color:"var(--accent)"}),
      h(Kpi, {label:"Over 60 days", value:open.filter(c => c.age > 60).length, color:"var(--warn)", sub:"Chase drafted by the Warranty Clerk"}),
      h(Kpi, {label:"Credited, 90 days", value:U.eur(s.claims.filter(c => c.stage === "Credited").reduce((n, c) => n + c.credit, 0))}),
      h(Kpi, {label:"Drafted, need review", value:s.claims.filter(c => c.stage === "Drafted").length, color: s.claims.some(c => c.stage === "Drafted") ? "var(--warn)" : null})),
    h("div", {className:"os-kan"}, stages.map(st => { const items = s.claims.filter(c => c.stage === st);
      return h("div", {key:st, className:"os-col"}, h("div", {className:"ch"}, st, h("span", {className:"os-mono os-faint"}, items.length), h("span", {className:"os-sp"}), h("span", {className:"os-faint", style:{fontSize:11, fontWeight:400}}, U.eur(items.reduce((n, c) => n + c.value, 0)))),
        items.map(c => h("div", {key:c.id, className:"os-kc" + (c.live ? " new" : ""), onClick:() => MOS.show("claim", c.id)},
          h("div", {className:"os-row"}, h("span", {className:"os-mono"}, c.id), h("span", {className:"os-sp"}), c.age > 60 ? h(Badge, {k:"warn"}, c.age + "d") : h("span", {className:"os-faint", style:{fontSize:11}}, c.age ? c.age + "d" : "New")),
          h("div", {style:{fontWeight:600, marginTop:5}}, c.mfr), h("div", {className:"os-dim", style:{fontSize:12}}, c.part), h("div", {className:"os-faint", style:{fontSize:11.5, marginTop:3}}, custName(c.cust) + " · " + c.serial),
          h("div", {className:"os-row", style:{marginTop:6}}, h("span", {className:"os-mono"}, U.eur(c.value)), h("span", {className:"os-sp"}), c.returnTag ? h(Badge, {k:"line"}, c.returnTag) : null)))); })),
    s.claims.filter(c => c.stage === "Rejected").length ? h(Card, null, h(CardHead, {title:"Rejected", sub:"Rebill the customer or record as goodwill"}),
      h(Table, {cols:[{t:"Claim", r:c => h("span", {className:"os-mono"}, c.id)}, {t:"Manufacturer", r:c => c.mfr}, {t:"Part", r:c => c.part}, {t:"Outcome", r:c => h("span", {className:"os-dim"}, c.outcome)}, {t:"Value", num:true, r:c => U.eur(c.value)}],
        rows:s.claims.filter(c => c.stage === "Rejected").map(c => Object.assign({key:c.id}, c)), onRow:(c) => MOS.show("claim", c.id)})) : null);
}
MOS.drawers.claim = function(p){
  const s = MOS.get(), c = Q.claim(p.id); const [ask, setAsk] = useState(false); if (!c) return null;
  const m = s.machines[c.machine], nxt = {Drafted:"Submit to " + c.mfr, Submitted:"Manufacturer asks for part", "Return requested":"Ship faulty part", "Part shipped":"Record assessment", Assessed:"Record credit"}[c.stage];
  const foot = [];
  if (c.stage === "Drafted") foot.push(h(Btn, {key:"s", k:"pri", onClick:() => setAsk(true)}, "Review and submit"));
  else if (nxt) foot.push(h(Btn, {key:"n", k:"pri", onClick:() => A.advanceClaim(c.id)}, nxt));
  if (c.stage === "Part shipped" || c.stage === "Assessed") foot.push(h(Btn, {key:"r", onClick:() => A.advanceClaim(c.id, "Rejected")}, "Record rejection"));
  if (Q.job(c.job)) foot.unshift(h(Btn, {key:"j", onClick:() => MOS.show("job", c.job)}, "Open " + c.job));
  return h(Drawer, {kicker:c.id + " · " + c.stage + (c.returnTag ? " · return tag " + c.returnTag : ""), title:c.mfr + " warranty claim", sub:c.part + " · " + U.eur(c.value), onClose:p.close, foot},
    ask ? h("div", {style:{marginBottom:12}}, h(Confirm, {tool:"warranty.submit_claim", args:[c.id, c.serial, c.sku, c.value], summary:"Submit " + c.id + " to " + c.mfr + " for " + U.eur(c.value) + ": serial " + c.serial + ", installed " + U.dm(new Date(m.installed)) + " " + new Date(m.installed).getFullYear() + ", part " + c.sku + ", " + c.labour + " h labour, job sheet and photos attached.",
      yes:"Confirm and submit", onYes:() => { A.advanceClaim(c.id); setAsk(false); }, onNo:() => setAsk(false)})) : null,
    h(Card, {pad:true}, h("div", {className:"os-lbl"}, "Claim pack, assembled automatically"),
      [["Manufacturer", c.mfr], ["Machine", m.mfr + " " + m.model + " " + m.type.toLowerCase()], ["Serial", m.serial], ["Installed", U.dm(new Date(m.installed)) + " " + new Date(m.installed).getFullYear()],
       ["Warranty to", U.dm(new Date(m.warrantyEnd)) + " " + new Date(m.warrantyEnd).getFullYear()], ["Customer", custName(c.cust)], ["Job", c.job], ["Part fitted", c.sku + " " + c.part],
       ["Failure", c.failure], ["Labour claimed", c.labour ? c.labour + " h" : "Parts only"], ["Photos", (c.photos || 2) + " from the job sheet"], ["Faulty part", c.returnTag ? "Tagged " + c.returnTag : "Held on the returns shelf"]].map(x =>
        h("div", {key:x[0], className:"os-row", style:{padding:"6px 0", borderBottom:"1px solid var(--border)"}}, h("span", {className:"os-dim", style:{width:130, flex:"none"}}, x[0]), h("span", null, x[1])))),
    c.outcome ? h(Card, {pad:true, style:{marginTop:12}}, h("div", {className:"os-lbl"}, "Outcome"), h("div", null, c.outcome), c.credit ? h("div", {className:"os-mono", style:{marginTop:4, color:"var(--ok)"}}, "Credit " + U.eur(c.credit)) : null) : null,
    h(Card, {pad:true, style:{marginTop:12}}, h("div", {className:"os-lbl"}, "History"), h("div", {className:"os-tl"}, (c.history && c.history.length ? c.history : [{t:c.age + " days ago", label:"Drafted from " + c.job}]).slice().reverse().map((x, i) => h("div", {key:i, className:"e system"}, h("div", null, x.label), h("div", {className:"os-mono os-faint"}, x.t))))),
    h(Prov, {style:{marginTop:10}}, "Raised because " + c.job + " was a warranty job and the engineer fitted " + c.sku + " on the app"));
};
function Returns(p){
  const s = p.s, rows = s.claims.filter(c => c.returnTag || c.stage === "Drafted" || c.stage === "Submitted").map(c => Object.assign({key:c.id}, c));
  const where = (c) => c.stage === "Drafted" || c.stage === "Submitted" ? "Returns shelf, Mitchelstown" : c.stage === "Return requested" ? "Packed, awaiting courier" : c.stage === "Part shipped" ? "With " + c.mfr : c.stage === "Assessed" ? "Assessed by " + c.mfr : c.stage === "Credited" ? "Closed, credited" : "Closed, rejected";
  return h(Card, null, h(CardHead, {title:"Faulty parts removed on warranty jobs", sub:"Tagged on the phone when removed, tracked until the manufacturer decides"}),
    h(Table, {cols:[{t:"Tag", r:c => h("span", {className:"os-mono"}, c.returnTag || "To tag")}, {t:"Part", r:c => c.part}, {t:"From machine", r:c => c.serial + " · " + custName(c.cust)}, {t:"Claim", r:c => h("span", {className:"os-mono"}, c.id)},
      {t:"Where it is", r:c => where(c)}, {t:"Outcome", r:c => c.stage === "Credited" ? h(Badge, {k:"ok"}, "Credited") : c.stage === "Rejected" ? h(Badge, {k:"bad"}, "Rejected") : c.stage === "Assessed" ? h(Badge, {k:"acc"}, "Fault confirmed") : h(Badge, {k:"line"}, "Pending")}],
      rows, onRow:(c) => MOS.show("claim", c.id)}));
}
function Mfrs(p){
  const s = p.s, by = {};
  s.claims.forEach(c => { const x = by[c.mfr] = by[c.mfr] || {mfr:c.mfr, n:0, open:0, val:0, cred:0, rej:0, days:[]}; x.n++; if (["Credited","Rejected"].indexOf(c.stage) < 0){ x.open++; x.val += c.value; } if (c.stage === "Credited"){ x.cred++; x.days.push(c.age); } if (c.stage === "Rejected") x.rej++; });
  return h(Card, null, h(CardHead, {title:"Manufacturer scorecard", sub:"Who pays, how fast, and how often they refuse"}),
    h(Table, {cols:[{t:"Manufacturer", r:x => h("b", null, x.mfr)}, {t:"Claims", num:true, r:x => x.n}, {t:"Open", num:true, r:x => x.open}, {t:"Outstanding", num:true, r:x => U.eur(x.val)},
      {t:"Avg days to credit", num:true, r:x => x.days.length ? Math.round(x.days.reduce((a, b) => a + b, 0) / x.days.length) : "·"}, {t:"Rejection rate", num:true, r:x => Math.round(x.rej / x.n * 100) + "%"}],
      rows:Object.values(by).map(x => Object.assign({key:x.mfr}, x)).sort((a, b) => b.val - a.val)}));
}

/* ================= ASSETS ================= */
MOS.modules.assets = {title:"Machine Register", sub:"Every machine: new, used, on hire, customer-owned or in the workshop",
  render:(s) => h(Assets, {s})};
const OWN = {customer:"Customer-owned", hire:"Hire fleet", "myers-new":"New stock", "myers-used":"Used stock"};
function Assets(p){
  const s = p.s; const [f, setF] = useState("all"); const [qq, setQ] = useState("");
  const all = Object.values(s.machines);
  const facet = (m) => f === "all" || (f === "on-hire" ? m.status === "on-hire" : f === "in-workshop" ? (m.status === "in-workshop" || m.status === "refurb") : m.ownership === f);
  const rows = all.filter(facet).filter(m => !qq || (m.id + m.serial + m.model + m.type + custName(m.cust)).toLowerCase().indexOf(qq.toLowerCase()) > -1).map(m => Object.assign({key:m.id}, m));
  const n = (fn) => all.filter(fn).length;
  return h("div", {className:"os-grid"},
    h("div", {className:"os-row os-wrap"}, h(Seg, {items:[["all","All " + all.length],["customer","Customer-owned " + n(m => m.ownership === "customer")],["myers-new","New stock " + n(m => m.ownership === "myers-new")],
      ["myers-used","Used stock " + n(m => m.ownership === "myers-used")],["on-hire","On hire " + n(m => m.status === "on-hire")],["in-workshop","In workshop " + n(m => m.status === "in-workshop" || m.status === "refurb")]], value:f, onChange:setF}),
      h("span", {className:"os-sp"}), h("input", {className:"os-in", placeholder:"Serial, model or customer", value:qq, onChange:(e) => setQ(e.target.value), style:{width:240}})),
    h(Card, null, h(Table, {cols:[{t:"Asset", r:m => h("span", {className:"os-mono"}, m.id)}, {t:"Machine", r:m => h("div", null, m.mfr + " " + m.model, h("div", {className:"os-faint", style:{fontSize:11}}, m.type))}, {t:"Serial", r:m => h("span", {className:"os-mono"}, m.serial)},
      {t:"Owner", r:m => m.ownership === "customer" ? custName(m.cust) : h(Badge, {k:"line"}, OWN[m.ownership])}, {t:"Location", r:m => m.location},
      {t:"Status", r:m => h(Badge, {k: m.status === "on-hire" ? "acc" : m.status === "in-workshop" || m.status === "refurb" ? "warn" : m.status === "installed" ? "" : "ok"}, m.status.replace("-", " "))},
      {t:"Warranty", r:m => m.underWarranty ? h(Badge, {k:"ok"}, "to " + U.dm(new Date(m.warrantyEnd))) : h("span", {className:"os-faint"}, "Expired")},
      {t:"Open jobs", num:true, r:m => Q.openJobs().filter(j => j.machine === m.id).length || ""}], rows, onRow:(m) => MOS.show("asset", m.id)})));
}
MOS.drawers.asset = function(p){
  const s = MOS.get(), m = s.machines[p.id]; const [tab, setTab] = useState("overview"); if (!m) return null;
  const jobs = s.jobs.filter(j => j.machine === m.id), claims = s.claims.filter(c => c.machine === m.id), quotes = s.quotes.filter(q => q.machine === m.id);
  const invs = s.invoices.filter(i => jobs.some(j => j.id === i.source) || s.wsJobs.some(w => w.machine === m.id && w.id === i.source));
  const ws = s.wsJobs.filter(w => w.machine === m.id), hireC = s.hire.filter(x => x.asset === m.id);
  const partsMv = s.movements.filter(x => jobs.some(j => j.id === x.ref) || x.from === m.id);
  const hours = jobs.reduce((n, j) => n + (j.actual || 0), 0) / 60 + ws.reduce((n, w) => n + Q.wsCost(w).hours, 0);
  const cost = hours * 38 + partsMv.filter(x => x.type === "fit").reduce((n, x) => n + (s.catalogue[x.sku] ? s.catalogue[x.sku].cost : 0), 0) - claims.reduce((n, c) => n + c.credit, 0);
  const T = [["overview","Overview"],["history","Service history", jobs.length + ws.length],["parts","Parts", partsMv.length],["money","Quotes and invoices", quotes.length + invs.length],["warranty","Warranty", claims.length]];
  return h(Drawer, {wide:true, kicker:m.id + " · " + (OWN[m.ownership] || m.ownership), title:m.mfr + " " + m.model + " " + m.type.toLowerCase(), sub:"Serial " + m.serial + " · " + (m.cust ? custName(m.cust) + ", " : "") + m.location, onClose:p.close},
    h(Tabs, {items:T, value:tab, onChange:setTab}),
    h("div", {style:{marginTop:14}},
      tab === "overview" ? h(F, null,
        h("div", {className:"os-grid", style:{gridTemplateColumns:"repeat(4,minmax(0,1fr))"}},
          h(Kpi, {label:"Status", value:m.status.replace("-", " ")}), h(Kpi, {label:"Engineer hours, life", value:hours.toFixed(1) + " h"}),
          h(Kpi, {label:"Cost to serve", value:U.eur(Math.max(0, cost)), sub:"Labour + parts − warranty credits"}), h(Kpi, {label:"Warranty", value:m.underWarranty ? "Active" : "Expired", sub:"to " + U.dm(new Date(m.warrantyEnd)) + " " + new Date(m.warrantyEnd).getFullYear(), color:m.underWarranty ? "var(--ok)" : null})),
        h("div", {className:"os-split", style:{marginTop:12}},
          h(Card, {pad:true}, h("div", {className:"os-lbl"}, "Details"),
            [["Owner", m.ownership === "customer" ? custName(m.cust) : "Myers Food Machinery"], ["Installed", U.dm(new Date(m.installed)) + " " + new Date(m.installed).getFullYear()], ["Last planned maintenance", U.dm(new Date(m.lastPM))],
             ["Service plan", m.plan ? m.plan.charAt(0).toUpperCase() + m.plan.slice(1) : "None"], ["Documents", "Manual, wiring diagram, parts list, cleaning guide"]].map(x =>
              h("div", {key:x[0], className:"os-row", style:{padding:"5px 0", borderBottom:"1px solid var(--border)"}}, h("span", {className:"os-dim", style:{width:170, flex:"none"}}, x[0]), h("span", null, x[1])))),
          hireC.length ? h(Card, {pad:true}, h("div", {className:"os-lbl"}, "Hire"), hireC.map(x => h("div", {key:x.id}, x.id + " · " + custName(x.cust) + " · " + U.eur(x.rate) + "/" + x.period + " · until " + U.dm(U.addDays(U.TODAY, x.end)))))
            : h(Card, {pad:true}, h("div", {className:"os-lbl"}, "Photos and documents"), h("div", {className:"os-row os-wrap"}, [0, 1, 2].map(i => h(MOS.Photo, {key:i, ph:{label:["Plate","Install","Last visit"][i], t:"", hue:190 + i * 40}})))))
      ) : tab === "history" ? h("div", {className:"os-tl"},
          ws.map(w => h("div", {key:w.id, className:"e system", style:{cursor:"pointer"}, onClick:() => MOS.show("ws", w.id)}, h("div", null, w.id + " workshop: " + w.reason), h("div", {className:"os-mono os-faint"}, w.stage + " · " + Q.wsCost(w).hours + " h"))),
          jobs.map(j => h("div", {key:j.id, className:"e app", style:{cursor:"pointer"}, onClick:() => MOS.show("job", j.id)}, h("div", null, j.id + " · " + j.fault),
            h("div", {className:"os-mono os-faint"}, (j.day != null ? U.dayLabel(j.day) : "Not booked") + " · " + (j.eng ? Q.eng(j.eng).name : "unassigned") + " · " + j.status + (j.actual ? " · " + U.dur(j.actual) : "")))),
          !jobs.length && !ws.length ? h("div", {className:"os-dim"}, "No service history yet") : null)
      : tab === "parts" ? h(Card, null, h(Table, {cols:[{t:"When", r:x => x.when}, {t:"Type", r:x => h(Badge, {k:x.type === "fit" ? "acc" : "warn"}, x.type)}, {t:"Part", r:x => x.sku + " " + (s.catalogue[x.sku] ? s.catalogue[x.sku].name : "")}, {t:"Job", r:x => x.ref}], rows:partsMv, empty:"No parts recorded against this machine"}))
      : tab === "money" ? h(F, null,
          h(Card, null, h(CardHead, {title:"Quotes"}), h(Table, {cols:[{t:"Quote", r:q => q.id}, {t:"For", r:q => q.title}, {t:"Status", r:q => q.status}, {t:"Value", num:true, r:q => U.eur(Q.quoteTotal(q))}], rows:quotes, onRow:(q) => MOS.show("quote", q.id), empty:"None"})),
          h(Card, {style:{marginTop:12}}, h(CardHead, {title:"Invoices"}), h(Table, {cols:[{t:"Invoice", r:i => i.id}, {t:"From", r:i => i.source}, {t:"Status", r:i => i.status}, {t:"Net", num:true, r:i => U.eur2(i.total)}], rows:invs, onRow:(i) => MOS.show("invoice", i.id), empty:"None"})))
      : h(Card, null, h(Table, {cols:[{t:"Claim", r:c => c.id}, {t:"Part", r:c => c.part}, {t:"Stage", r:c => c.stage}, {t:"Value", num:true, r:c => U.eur(c.value)}], rows:claims, onRow:(c) => MOS.show("claim", c.id), empty:m.underWarranty ? "No claims yet" : "Out of warranty"}))));
};
})();
