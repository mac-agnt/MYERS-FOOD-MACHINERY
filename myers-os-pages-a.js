/* Myers Service OS pages, part A: record drawers, Control Tower, Service Desk, Dispatch, Engineer App. */
(function(){
"use strict";
const MOS = window.MOS, R = window.React, h = R.createElement, F = R.Fragment;
const {useState, useEffect, useRef} = R;
const U = MOS.util, Q = MOS.q, A = MOS.act;
const {Badge, Btn, Card, CardHead, Kpi, Av, Prov, Tabs, Seg, Bar, Field, Drawer, Table, Confirm, Prio, St, IrelandMap} = MOS.ui;
const custName = (id) => id && MOS.get().cust[id] ? MOS.get().cust[id].name : "Myers stock";
const machLabel = (m) => m ? m.model + " " + m.type.toLowerCase() : "";

/* ================= drawer host ================= */
let drawer = null; const dl = new Set();
MOS.show = (kind, id) => { drawer = kind ? {kind, id} : null; dl.forEach(f => f()); };
MOS.DrawerHost = function(){
  const [, f] = useState(0); useEffect(() => { const g = () => f(x => x + 1); dl.add(g); return () => dl.delete(g); }, []);
  MOS.useStore();
  if (!drawer) return null;
  const D = MOS.drawers[drawer.kind]; if (!D) return null;
  return h(D, {id:drawer.id, close:() => MOS.show(null)});
};
MOS.drawers = MOS.drawers || {};

/* Job record: the single thread from request to invoice. */
MOS.drawers.job = function(p){
  const s = MOS.get(), j = Q.job(p.id); const [tab, setTab] = useState("overview");
  if (!j) return null;
  const c = s.cust[j.cust], m = s.machines[j.machine], e = j.eng ? Q.eng(j.eng) : null, sh = j.sheet && j.sheet !== "seeded" ? j.sheet : null;
  const inv = j.invoice ? Q.inv(j.invoice) : null;
  const tabs = [["overview","Overview"],["sheet","Job sheet"],["billing","Billing"],["timeline","Timeline", j.events.length]];
  const foot = [];
  if (j.status === "Completed") foot.push(h(Btn, {key:"r", k:"pri", onClick:() => A.review(j.id)}, "Review and draft invoice"));
  if (inv) foot.push(h(Btn, {key:"i", onClick:() => MOS.show("invoice", inv.id)}, "Open " + inv.id));
  if (j.claim) foot.push(h(Btn, {key:"c", onClick:() => MOS.show("claim", j.claim)}, "Open " + j.claim));
  foot.push(h(Btn, {key:"a", onClick:() => MOS.show("asset", j.machine)}, "Machine record"));
  if (j.status === "New") foot.push(h(Btn, {key:"d", onClick:() => { MOS.show(null); MOS.nav("dispatch"); }}, "Schedule in Dispatch"));
  return h(Drawer, {kicker:j.id + " · " + j.type + " · from " + j.source, title:c.name, sub:machLabel(m) + " · " + m.serial, onClose:p.close, foot},
    h("div", {className:"os-row os-wrap", style:{marginBottom:12}}, h(Prio, {p:j.prio}), h(St, {s:j.status}),
      h(Badge, {k: j.billing === "warranty" ? "acc" : "line"}, j.billing === "warranty" ? "Warranty" : j.billing === "contract" ? "Service plan" : j.billing === "quoted" ? "Quoted work" : "Chargeable"),
      j.sla ? h(Badge, {k:"line"}, j.sla) : null),
    h(Tabs, {items:tabs, value:tab, onChange:setTab}),
    h("div", {style:{marginTop:14}},
      tab === "overview" ? h(F, null,
        h(Card, {pad:true}, h("div", {className:"os-lbl"}, "Reported fault"), h("div", {style:{fontSize:14}}, j.fault),
          h(Prov, {style:{marginTop:8}}, "Entered once from " + j.source.toLowerCase() + ", carried to the engineer’s phone, the job sheet and the invoice")),
        h("div", {className:"os-split", style:{marginTop:12}},
          h(Card, {pad:true}, h("div", {className:"os-lbl"}, "Customer and site"), h("div", {style:{fontWeight:600}}, c.name), h("div", {className:"os-dim"}, c.town),
            h("div", {className:"os-dim", style:{marginTop:6}}, c.contact[0] + ", " + c.contact[1]), h("div", {className:"os-mono os-faint"}, c.contact[3])),
          h(Card, {pad:true}, h("div", {className:"os-lbl"}, "Engineer and slot"),
            e ? h("div", {className:"os-row"}, h(Av, {e}), h("div", null, h("div", {style:{fontWeight:600}}, e.name), h("div", {className:"os-dim"}, j.day != null ? U.dayLabel(j.day) + (j.start ? " · " + j.start : "") : "Not booked")))
              : h("div", {className:"os-dim"}, "Unassigned"),
            h("div", {className:"os-dim", style:{marginTop:8}}, "Allowed " + U.dur(j.dur) + (j.actual ? " · actual " + U.dur(j.actual) : "")))),
        h(Card, {pad:true, style:{marginTop:12}}, h("div", {className:"os-lbl"}, "Machine"),
          h("div", {className:"os-row"}, h("div", {style:{flex:1}}, h("div", {style:{fontWeight:600}}, m.mfr + " " + machLabel(m)), h("div", {className:"os-mono os-faint"}, m.id + " · " + m.serial)),
            m.underWarranty ? h(Badge, {k:"ok"}, "In warranty to " + U.dm(new Date(m.warrantyEnd))) : h(Badge, {k:"line"}, "Out of warranty"))))
      : tab === "sheet" ? (sh ? h(F, null,
          h(Prov, {style:{marginBottom:10}}, "Captured by " + (e ? e.name : "engineer") + " on the phone" + (j.completedAt ? ", received " + j.completedAt : ", in progress")),
          h(Card, {pad:true}, h("div", {className:"os-lbl"}, "Diagnosis"), h("div", null, sh.diag || "Not entered yet"),
            h("div", {className:"os-lbl", style:{marginTop:10}}, "Work carried out"), h("div", null, sh.work || "Not entered yet"),
            sh.notes ? h(F, null, h("div", {className:"os-lbl", style:{marginTop:10}}, "Engineer notes"), h("div", null, sh.notes)) : null),
          h(Card, {style:{marginTop:12}}, h(CardHead, {title:"Parts"}),
            h(Table, {cols:[{t:"Part", r:x => x.sku + " " + s.catalogue[x.sku].name}, {t:"Movement", r:x => x.kind}, {t:"From / to", r:x => x.where}],
              rows:sh.fitted.map(f => ({sku:f.sku, kind:"Fitted", where: f.from === "van" ? "From van" : "From warehouse"})).concat(sh.removed.map(r => ({sku:r.sku, kind:"Removed", where: r.cond === "warranty" ? "Warranty return" : r.cond === "refurb" ? "Returns shelf" : "Scrap"}))),
              empty:"No parts recorded"})),
          h("div", {className:"os-split", style:{marginTop:12}},
            h(Card, {pad:true}, h("div", {className:"os-lbl"}, "Photos"), h("div", {className:"os-row os-wrap"}, sh.photos.length ? sh.photos.map((ph, i) => h(Photo, {key:i, ph})) : h("span", {className:"os-dim"}, "None"))),
            h(Card, {pad:true}, h("div", {className:"os-lbl"}, "Customer signature"), sh.sig ? h("img", {src:sh.sig, style:{width:"100%", maxHeight:90, objectFit:"contain", background:"#f5f8fa", borderRadius:8}}) : h("div", {className:"os-dim"}, "Not signed yet"),
              sh.signedBy ? h("div", {className:"os-dim", style:{marginTop:6}}, sh.signedBy + (j.completedAt ? " at " + j.completedAt : "")) : null)),
          sh.followUp ? h(Card, {pad:true, style:{marginTop:12}}, h(Badge, {k:"warn"}, "Follow-up required"), h("div", {style:{marginTop:6}}, sh.followReason)) : null)
        : j.sheet === "seeded" ? h(Card, {pad:true}, h("div", {className:"os-dim"}, "Signed digital job sheet on file from the engineer app."), h(Prov, {style:{marginTop:8}}, "Replaces the paper triplicate docket"))
        : h("div", {className:"os-empty"}, "The job sheet fills in live as the engineer works on the phone."))
      : tab === "billing" ? (inv ? h(InvoiceBody, {inv}) : h(Card, {pad:true}, h("div", {className:"os-dim"}, j.status === "Completed" ? "Review the job to draft the invoice from the job sheet." : "The invoice is drafted automatically once the job is completed and reviewed."),
          h("div", {className:"os-row", style:{marginTop:10}}, h("span", {className:"os-dim"}, "Billing mode"),
            h(Seg, {items:[["chargeable","Chargeable"],["warranty","Warranty"],["contract","Service plan"]], value:j.billing, onChange:(b) => A.billing(j.id, b)}))))
      : h("div", {className:"os-tl"}, j.events.slice().reverse().map((ev, i) => h("div", {key:i, className:"e " + ev.src}, h("div", null, ev.label), h("div", {className:"os-mono os-faint"}, ev.t + " · " + ev.by + " · " + ev.src))))));
};
function Photo(p){ return h("div", {style:{width:84, height:64, borderRadius:8, background:"linear-gradient(135deg,hsl(" + p.ph.hue + " 25% 42%),hsl(" + (p.ph.hue + 40) + " 20% 22%))", position:"relative", overflow:"hidden", flex:"none"}},
  h("span", {style:{position:"absolute", left:6, bottom:5, fontSize:9.5, color:"#f5f8fa", fontFamily:"'IBM Plex Mono',monospace"}}, p.ph.label + " " + p.ph.t)); }
MOS.Photo = Photo;

function InvoiceBody(p){
  const inv = p.inv, s = MOS.get();
  return h(F, null,
    h(Card, null, h(Table, {cols:[{t:"Line", r:l => l[0]}, {t:"Qty", num:true, r:l => l[1]}, {t:"Rate", num:true, r:l => U.eur2(l[2])}, {t:"Amount", num:true, r:l => U.eur2(l[1] * l[2])}],
      rows:(inv.lines || [["Invoice total", 1, inv.total]])}),
      h("div", {className:"os-row", style:{padding:"12px 12px 14px", borderTop:"1px solid var(--border)"}}, h("span", {className:"os-dim"}, "Net"), h("span", {className:"os-sp"}), h("span", {className:"os-mono"}, U.eur2(inv.total)),
        h("span", {className:"os-dim", style:{marginLeft:18}}, "VAT 23%"), h("span", {className:"os-mono", style:{marginLeft:8}}, U.eur2(inv.total * .23)),
        h("span", {style:{marginLeft:18, fontWeight:600}}, "Total " + U.eur2(inv.total * 1.23)))),
    (inv.flags || []).map((f, i) => h("div", {key:i, style:{marginTop:8}}, h(Badge, {k:"acc"}, f))),
    h(Prov, {style:{marginTop:10}}, "Built from " + inv.source + (inv.kind === "job" ? ": job sheet, time on site from the app, parts fitted, " + custName(inv.cust) + " contract rates" : inv.kind === "workshop" ? ": bench hours, parts and materials" : ": hire contract")));
}
MOS.drawers.invoice = function(p){
  const s = MOS.get(), inv = Q.inv(p.id); const [ask, setAsk] = useState(false);
  if (!inv) return null;
  const foot = inv.status === "Draft" ? [h(Btn, {key:"s", k:"pri", onClick:() => setAsk(true)}, "Approve and send")] : inv.status === "Sent" || inv.status === "Overdue" ? [h(Btn, {key:"p", onClick:() => A.markPaid(inv.id)}, "Mark paid")] : [];
  if (inv.kind === "job" && Q.job(inv.source)) foot.unshift(h(Btn, {key:"j", onClick:() => MOS.show("job", inv.source)}, "Open " + inv.source));
  return h(Drawer, {kicker:inv.id + " · " + inv.status + " · " + inv.sync, title:custName(inv.cust), sub:"From " + inv.source + (inv.po ? " · PO " + inv.po : ""), onClose:p.close, foot},
    ask ? h("div", {style:{marginBottom:12}}, h(Confirm, {tool:"invoice.approve_and_send", args:[inv.id, inv.total], summary:"Email " + inv.id + " for " + U.eur2(inv.total * 1.23) + " to " + s.cust[inv.cust].contact[2] + " with the signed job sheet attached, then sync to Xero.",
      yes:"Confirm and send", onYes:() => { A.sendInvoices([inv.id]); setAsk(false); }, onNo:() => setAsk(false)})) : null,
    h(InvoiceBody, {inv}));
};

/* ================= CONTROL TOWER ================= */
MOS.modules.tower = {title:"Control Tower", sub:"The whole service operation, live", render:(s) => h(Tower, {s})};
function Tower(p){
  const s = p.s;
  const today = s.jobs.filter(j => j.day === 0 && j.eng);
  const inProg = today.filter(j => ["Travelling","On site","In progress"].indexOf(j.status) > -1).length;
  const done = today.filter(j => ["Completed","Reviewed","Invoiced"].indexOf(j.status) > -1).length;
  const open = Q.openJobs(), p1 = open.filter(j => j.prio === "P1").length, unassigned = Q.unassigned().length;
  const ready = Q.readyToInvoice(), readyV = ready.reduce((n, i) => n + i.total, 0);
  const quotes = s.quotes.filter(q => q.status === "Awaiting approval"), quotesV = quotes.reduce((n, q) => n + Q.quoteTotal(q), 0);
  const claims = Q.claimsOpen(), claimsV = claims.reduce((n, c) => n + c.value, 0), claimsOld = claims.filter(c => c.age > 60).length;
  const ws = s.wsJobs.filter(w => w.stage !== "Collected"), over = ws.filter(w => { const c = Q.wsCost(w); return c.budget && c.pct > .9; }).length;
  const sv = Q.stockValue(), lowWh = Q.lowWh().length, lowVan = Q.lowVan().length;
  const usedWeek = s.movements.filter(m => m.type === "fit").length + 23;
  const invoicedMonth = s.invoices.filter(i => i.status !== "Draft").reduce((n, i) => n + i.total, 0) + 38400;
  const labourCost = 21800 + s.jobs.filter(j => j.status === "Completed").length * 90, partsCost = 9400;
  const onHire = s.hire.filter(x => !x.closed).length;
  const field = s.engineers.filter(e => e.kind !== "workshop");
  return h("div", {className:"os-grid"},
    h("div", {className:"os-grid", style:{gridTemplateColumns:"repeat(6,minmax(0,1fr))"}},
      h(Kpi, {label:"Jobs today", value:today.length, sub:inProg + " in progress · " + done + " done", onClick:() => MOS.nav("dispatch")}),
      h(Kpi, {label:"Outstanding jobs", value:open.length, sub:p1 + " breakdowns · " + unassigned + " unassigned", color: unassigned ? "var(--warn)" : null, onClick:() => MOS.nav("dispatch")}),
      h(Kpi, {label:"Ready to invoice", value:U.eur(readyV), sub:ready.length + " drafted from job sheets", color:"var(--accent)", onClick:() => MOS.nav("commercial/invoicing")}),
      h(Kpi, {label:"Quotes awaiting approval", value:U.eur(quotesV), sub:quotes.length + " with customers", onClick:() => MOS.nav("commercial/quotes")}),
      h(Kpi, {label:"Warranty credits due", value:U.eur(claimsV), sub:claims.length + " open · " + claimsOld + " over 60 days", color: claimsOld ? "var(--warn)" : null, onClick:() => MOS.nav("warranty")}),
      h(Kpi, {label:"Machines in workshop", value:ws.length, sub:over ? over + " near or over quote" : "All inside quote", onClick:() => MOS.nav("workshop")})),
    h("div", {className:"os-grid", style:{gridTemplateColumns:"minmax(0,1.55fr) minmax(0,1fr)"}},
      h(Card, null, h(CardHead, {title:"Team right now", sub:"On-duty status from the app and site geofences", right:h("span", {className:"os-row os-dim", style:{fontSize:12}}, h("span", {className:"os-live"}), "Live")}),
        h(Table, {cols:[
          {t:"", w:34, r:e => h(Av, {e})},
          {t:"Person", r:e => h("div", null, h("div", {style:{fontWeight:500}}, e.name), h("div", {className:"os-faint", style:{fontSize:11.5}}, e.patch))},
          {t:"Status", r:e => h(Badge, {k: !s.tracking.onDuty[e.id] ? "line" : /On site|Workshop/.test(s.status[e.id]) ? "ok" : /Travel/.test(s.status[e.id]) ? "acc" : ""}, s.tracking.onDuty[e.id] ? s.status[e.id] : "Off duty")},
          {t:"Last event", r:e => { const g = (s.geo[e.id] || []).slice(-1)[0]; return g ? h("div", null, h("span", {className:"os-mono"}, g.t), " ", h("span", {className:"os-dim"}, g.label)) : h("span", {className:"os-faint"}, "Workshop bench timer"); }},
          {t:"Utilisation today", w:150, r:e => { if (e.kind !== "field") return h("span", {className:"os-faint"}, e.kind === "sales" ? "Sales visits" : "Bench"); const u = MOS.utilisation(e.id, 0); return h("div", null, h(Bar, {v:u.pct, color:"var(--accent)"}), h("div", {className:"os-faint", style:{fontSize:11, marginTop:3}}, Math.round(u.pct * 100) + "% · " + U.dur(u.travel) + " driving")); }}],
          rows:s.engineers.map(e => Object.assign({key:e.id}, e)), onRow:(e) => MOS.nav("time/day/" + e.id)})),
      h(Card, null, h(CardHead, {title:"Today’s map", sub:"Engineers and today’s sites"}),
        h("div", {style:{padding:"0 12px 12px"}}, h(IrelandMap, {w:380, h:420, maxH:380,
          lines: Q.field().map(e => ({pts:[e.pos].concat(Q.dayJobs(0, e.id).map(j => s.cust[j.cust].pos)), color:e.tint, dash:true, op:.6})),
          points: [{kind:"base", pos:[MOS.geo.BASE.lat, MOS.geo.BASE.lng], label:"Depot"}]
            .concat(today.map(j => ({pos:s.cust[j.cust].pos, r:5, color: j.prio === "P1" ? "var(--bad)" : ["Completed","Reviewed","Invoiced"].indexOf(j.status) > -1 ? "var(--ok)" : "var(--dim)", onClick:() => MOS.show("job", j.id)})))
            .concat(Q.unassigned().filter(j => j.prio === "P1").map(j => ({pos:s.cust[j.cust].pos, r:6, color:"var(--bad)", label:"Unassigned", onClick:() => MOS.show("job", j.id)})))
            .concat(field.filter(e => s.tracking.onDuty[e.id] && e.kind === "field").map(e => ({kind:"eng", pos:s.pos[e.id], label:e.initials, color:e.tint})))})))),
    h("div", {className:"os-grid", style:{gridTemplateColumns:"minmax(0,1.2fr) minmax(0,1fr) minmax(0,1fr)"}},
      h(Card, null, h(CardHead, {title:"Live flow", sub:"Every entry, once, moving through the system"}),
        h("div", {style:{padding:"0 18px 14px", maxHeight:300, overflow:"auto"}},
          s.feed.length ? h("div", {className:"os-tl"}, s.feed.slice(0, 14).map((f, i) => h("div", {key:i, className:"e " + (f.kind === "field" ? "app" : f.kind)}, h("div", null, f.text), h("div", {className:"os-mono os-faint"}, f.t + " · " + f.kind))))
            : h("div", {className:"os-dim", style:{padding:"10px 0"}}, "Quiet so far. Create a job in Service Desk or complete one on the Engineer App and watch it flow through here."))),
      h(Card, null, h(CardHead, {title:"Parts", sub:"Warehouse and vans"}),
        h("div", {style:{padding:"0 18px 16px"}},
          h(Stat2, {l:"Stock value, warehouse", v:U.eur(sv.wh)}), h(Stat2, {l:"Stock value, in vans", v:U.eur(sv.van)}),
          h(Stat2, {l:"Warehouse lines below minimum", v:lowWh, c: lowWh ? "var(--warn)" : null, go:"parts/reorders"}),
          h(Stat2, {l:"Van lines below minimum", v:lowVan, c: lowVan ? "var(--warn)" : null, go:"parts/vans"}),
          h(Stat2, {l:"Parts fitted this week", v:usedWeek, go:"parts/movements"}),
          h(Stat2, {l:"Hire machines out", v:onHire, go:"commercial/hire"}))),
      h(Card, null, h(CardHead, {title:"This month", sub:"Revenue and cost, demo figures"}),
        h("div", {style:{padding:"0 18px 16px"}},
          h(Stat2, {l:"Invoiced", v:U.eur(invoicedMonth)}), h(Stat2, {l:"Labour cost", v:U.eur(labourCost)}), h(Stat2, {l:"Parts cost", v:U.eur(partsCost)}),
          h(Stat2, {l:"Gross margin", v:Math.round((1 - (labourCost + partsCost) / invoicedMonth) * 100) + "%", c:"var(--ok)"}),
          h(Stat2, {l:"Completion to invoice", v:"Same day", sub:"was about 9 days with paper dockets"})))),
    h(Card, {pad:true}, h("div", {className:"os-row os-wrap", style:{gap:22}},
      h("div", {style:{fontWeight:600}}, "What changed"),
      [["Times each job is typed","10 → 1"],["Paper dockets","0"],["WhatsApp dispatches","0"],["Trello cards","0"],["Retyped invoices","0"]].map(x => h("div", {key:x[0], className:"os-row", style:{gap:8}}, h("span", {className:"os-dim"}, x[0]), h("span", {className:"os-mono", style:{color:"var(--accent)"}}, x[1]))),
      h("span", {className:"os-sp"}), h("span", {className:"os-faint", style:{fontSize:11.5}}, "Target outcomes for Myers"))));
}
function Stat2(p){ return h("div", {className:"os-row", style:{padding:"7px 0", borderBottom:"1px solid var(--border)", cursor:p.go ? "pointer" : "default"}, onClick:p.go ? () => MOS.nav(p.go) : null},
  h("div", {style:{flex:1}}, h("div", {className:"os-dim"}, p.l), p.sub ? h("div", {className:"os-faint", style:{fontSize:11}}, p.sub) : null), h("span", {className:"os-mono", style:{fontSize:13, color:p.c || "var(--ink)"}}, p.v)); }
MOS.Stat2 = Stat2;

/* ================= SERVICE DESK ================= */
MOS.modules.desk = {title:"Service Desk", sub:"Calls, emails and web requests become jobs",
  tabs:(s) => [["inbox","Inbox", s.requests.filter(r => !r.done).length],["call","Log a call"],["channels","Channels"]],
  render:(s, tab) => tab === "call" ? h(Triage, {key:"call", req:null}) : tab === "channels" ? h(Channels) : h(Inbox, {s})};
function Inbox(p){
  const s = p.s, open = s.requests.filter(r => !r.done), done = s.requests.filter(r => r.done);
  const [sel, setSel] = useState(open[0] ? open[0].id : null);
  const cur = s.requests.find(r => r.id === sel) || open[0];
  return h("div", {className:"os-grid", style:{gridTemplateColumns:"minmax(0,.9fr) minmax(0,1.6fr)", alignItems:"start"}},
    h(Card, null, h(CardHead, {title:"Incoming", sub:"service@myers.ie, service line, myers.ie form"}),
      open.concat(done).map(r => h("div", {key:r.id, onClick:() => setSel(r.id), style:{padding:"12px 18px", borderTop:"1px solid var(--border)", cursor:"pointer", background: cur && cur.id === r.id ? "var(--accent-faint)" : "none", opacity: r.done ? .55 : 1}},
        h("div", {className:"os-row"}, h(Badge, {k: r.channel === "Phone" ? "warn" : r.channel === "Website" ? "acc" : ""}, r.channel), h("span", {className:"os-mono os-faint"}, r.at), h("span", {className:"os-sp"}),
          r.done ? h(Badge, {k:"ok"}, "→ " + r.done) : r.duplicateOf ? h(Badge, {k:"warn"}, "Possible duplicate") : null),
        h("div", {style:{fontWeight:500, marginTop:6}}, r.subject), h("div", {className:"os-dim", style:{fontSize:12}}, r.from)))),
    cur ? h(Triage, {key:cur.id, req:cur}) : h(Card, {pad:true}, h("div", {className:"os-empty"}, "Inbox clear.")));
}
function Triage(p){
  const s = MOS.get(), r = p.req, ex = r ? r.extract : {cust:"", machine:null, fault:"", prio:"P3"};
  const [cust, setCust] = useState(ex.cust || ""), [mid, setMid] = useState(ex.machine || ""), [fault, setFault] = useState(ex.fault || ""), [prio, setPrio] = useState(ex.prio || "P3");
  const c = s.cust[cust], machines = Object.values(s.machines).filter(m => m.cust === cust && m.ownership === "customer");
  const m = s.machines[mid];
  const openOnMachine = m ? Q.openJobs().filter(j => j.machine === m.id) : [];
  const dup = r && r.duplicateOf ? Q.job(r.duplicateOf) : openOnMachine[0];
  const last = m ? s.jobs.filter(j => j.machine === m.id && ["Reviewed","Invoiced","Completed"].indexOf(j.status) > -1)[0] : null;
  const conf = (k) => r && r.confidence && r.confidence[k] != null ? h("span", {className:"os-faint", style:{marginLeft:6, fontSize:11}}, r.confidence[k] >= .9 ? "extracted" : r.confidence[k] > 0 ? "check this" : "not found") : null;
  if (r && r.done) return h(Card, {pad:true}, h("div", {className:"os-row"}, h(Badge, {k:"ok"}, "Handled"), h("span", null, r.id + " became " + r.done)),
    h("div", {className:"os-row", style:{marginTop:12}}, h(Btn, {onClick:() => MOS.show("job", r.done)}, "Open " + r.done), h(Btn, {onClick:() => MOS.nav("dispatch")}, "Go to Dispatch")));
  return h(Card, null,
    r ? h("div", {style:{padding:"16px 18px", borderBottom:"1px solid var(--border)"}},
      h("div", {className:"os-row"}, h("div", {style:{fontWeight:600}}, r.subject), h("span", {className:"os-sp"}), h("span", {className:"os-mono os-faint"}, r.id + " · " + r.at)),
      h("div", {className:"os-dim", style:{fontSize:12, marginTop:2}}, r.from),
      h("div", {style:{marginTop:10, padding:"10px 12px", borderRadius:10, background:"var(--surface-faint)", border:"1px solid var(--border)", whiteSpace:"pre-wrap", color:"var(--body)"}}, r.body),
      h(Prov, {style:{marginTop:8}}, "Customer, machine, fault and urgency read from the " + r.channel.toLowerCase() + ". Check, then create."))
      : h("div", {style:{padding:"16px 18px 4px"}}, h("div", {style:{fontWeight:600}}, "Log a phone call"), h("div", {className:"os-dim"}, "Pick the customer and the machine. Warranty, SLA and history fill in on their own.")),
    h("div", {style:{padding:"14px 18px"}},
      h("div", {className:"os-split"},
        h(Field, {label:h(F, null, "Customer", conf("cust"))}, h("select", {className:"os-sel", value:cust, onChange:(e) => { setCust(e.target.value); setMid(""); }},
          h("option", {value:""}, "Choose customer"), Object.values(s.cust).map(x => h("option", {key:x.id, value:x.id}, x.name)))),
        h(Field, {label:h(F, null, "Machine", conf("machine"))}, h("select", {className:"os-sel", value:mid, onChange:(e) => setMid(e.target.value), disabled:!cust},
          h("option", {value:""}, cust ? "Choose from " + machines.length + " machines on site" : "Choose customer first"), machines.map(x => h("option", {key:x.id, value:x.id}, x.model + " " + x.type + " · " + x.serial))))),
      c ? h("div", {className:"os-row os-wrap", style:{margin:"-2px 0 12px"}}, h(Badge, {k:c.plan === "gold" ? "acc" : "line"}, (c.plan.charAt(0).toUpperCase() + c.plan.slice(1)) + " service plan"),
        h(Badge, {k:"line"}, c.contact[0] + " · " + c.contact[3]), m ? (m.underWarranty ? h(Badge, {k:"ok"}, "In warranty: billed to " + m.mfr) : h(Badge, {k:"line"}, "Out of warranty")) : null,
        last ? h(Badge, {k:"line"}, "Last visit " + last.id) : null) : null,
      dup ? h("div", {className:"os-confirm", style:{marginBottom:12, borderColor:"var(--warn)", background:"var(--warn-soft)"}},
        h("div", {style:{fontWeight:600, color:"var(--warn)"}}, dup.id + " is already open on this machine"),
        h("div", {className:"os-dim", style:{margin:"4px 0 8px"}}, dup.fault + " · " + dup.status + (dup.eng ? " · " + Q.eng(dup.eng).name + " " + (dup.day != null ? U.dayLabel(dup.day).toLowerCase() : "") : "")),
        r ? h(Btn, {sm:true, onClick:() => A.mergeRequest(r.id, dup.id)}, "Link to " + dup.id + " instead") : null) : null,
      h(Field, {label:h(F, null, "Fault reported", conf("fault"))}, h("textarea", {className:"os-ta", value:fault, onChange:(e) => setFault(e.target.value)})),
      h(Field, {label:"Urgency"}, h(Seg, {items:[["P1","P1 Breakdown"],["P2","P2 Same day"],["P3","P3 This week"],["P4","P4 Planned"]], value:prio, onChange:setPrio})),
      h("div", {className:"os-row", style:{marginTop:6}},
        h(Btn, {k:"pri", disabled:!cust || !mid || !fault, onClick:() => { A.createJob(r ? r.id : null, {cust, machine:mid, fault, prio}); if (!r){ setCust(""); setMid(""); setFault(""); } }}, "Create job"),
        h("span", {className:"os-dim", style:{fontSize:12}}, "Goes straight to Dispatch. The engineer’s job sheet and the invoice start from this record."))));
}
function Channels(){
  const cards = [["Email: service@myers.ie","Connected","Parses customer, serial, model and fault from every email. 4 today."],["Phone line","Connected","Caller ID matches the customer; voicemail transcribed into the inbox."],
    ["myers.ie service form","Connected","Structured requests with photos straight in."],["Trello","Import complete","142 open cards imported once. Board archived, read-only."],
    ["WhatsApp","Retired","Jobs now go to the engineer app with the full record, not a message."],["Xero","Connected","Approved invoices sync with the signed job sheet attached."],
    ["Google Maps","Connected","Drive times for dispatch and ETAs."],["Manufacturer portals","Export ready","Warranty claim packs per manufacturer: Nordvak, Traymaster, Weighline, Brodmann, Ferrox, Fillwright, Labelux."]];
  return h("div", {className:"os-grid", style:{gridTemplateColumns:"repeat(4,minmax(0,1fr))"}}, cards.map(c => h(Card, {key:c[0], pad:true},
    h("div", {className:"os-row"}, h("div", {style:{fontWeight:600, flex:1}}, c[0]), h(Badge, {k: c[1] === "Retired" ? "line" : c[1] === "Connected" ? "ok" : "acc"}, c[1])), h("div", {className:"os-dim", style:{marginTop:8}}, c[2]))));
}

/* ================= DISPATCH ================= */
MOS.modules.dispatch = {title:"Dispatch Board", sub:"Plan by location, urgency, skills, parts and hours",
  render:(s) => h(Dispatch, {s})};
const T0 = 5 * 60, T1 = 19 * 60;
function Dispatch(p){
  const s = p.s; const [day, setDay] = useState(0); const [pick, setPick] = useState(null); const [ask, setAsk] = useState(false);
  const un = Q.unassigned().sort((a, b) => a.prio.localeCompare(b.prio));
  const prop = s.proposals && s.proposals.day === day ? s.proposals : null;
  const scheduled = s.jobs.filter(j => j.day === day && j.status === "Scheduled" && j.eng).length;
  const field = Q.field();
  const pct = (m) => ((m - T0) / (T1 - T0) * 100) + "%";
  const assignTo = (e) => {
    const j = Q.job(pick); const slots = Q.dayJobs(day, e.id); const last = slots[slots.length - 1];
    const from = last ? s.cust[last.cust].pos : e.pos, t = (last ? U.toMin(last.start) + last.dur : U.toMin(e.start)) + MOS.geo.drive(from, s.cust[j.cust].pos);
    A.assign(pick, e.id, day, U.hm(Math.ceil(t / 15) * 15)); setPick(null); };
  return h("div", {className:"os-grid"},
    h("div", {className:"os-row os-wrap"},
      h(Seg, {items:[[0, U.dayLabel(0)], [1, U.dayLabel(1)], [2, U.dayLabel(2)]], value:day, onChange:(d) => { setDay(d); A.clearPlan(); }}),
      h(Btn, {k:"pri", disabled:!un.length, onClick:() => A.plan(day)}, "Auto-plan " + U.dayLabel(day).toLowerCase()),
      h(Btn, {disabled:!scheduled, onClick:() => setAsk(true)}, "Send " + scheduled + " to phones"),
      pick ? h(Badge, {k:"acc"}, "Choose an engineer row for " + pick) : null,
      h("span", {className:"os-sp"}), h("span", {className:"os-dim", style:{fontSize:12}}, un.length + " unassigned · " + field.length + " field engineers")),
    ask ? h(Confirm, {tool:"dispatch.send_to_phones", args:[day, scheduled], summary:"Send " + scheduled + " job sheets for " + U.dayLabel(day).toLowerCase() + " to the engineers’ phones, with customer, machine history, fault, parts and manual. This replaces the WhatsApp messages.",
      yes:"Confirm and send", onYes:() => { A.dispatch(day); setAsk(false); }, onNo:() => setAsk(false)}) : null,
    prop ? h(Confirm, {tool:"dispatch.plan_day", args:prop.rows.map(r => [r.job, r.eng, r.start]),
      summary:h(F, null, "Schedule " + prop.rows.filter(r => r.eng).length + " jobs for " + U.dayLabel(day).toLowerCase() + ". Each one is placed where it adds the least driving, with a trained engineer who has the part and the hours. Plan " + prop.hash + ".",
        prop.rows.some(r => !r.eng) ? h("div", {className:"os-dim", style:{marginTop:6}}, prop.rows.filter(r => !r.eng).map(r => r.job).join(", ") + " could not be placed " + U.dayLabel(day).toLowerCase() + " and stay unassigned.") : null,
        h("div", {style:{marginTop:10}}, prop.rows.filter(r => r.eng).map(r => h("div", {key:r.job, className:"os-row os-wrap", style:{padding:"6px 0", borderTop:"1px solid var(--accent-line)"}},
          h("span", {className:"os-mono", style:{width:78}}, r.job), r.eng ? h(Av, {e:r.eng, s:20}) : null, h("span", {style:{width:150}}, r.eng ? Q.eng(r.eng).name + " " + r.start : "No slot"),
          r.reasons.map((x, i) => h("span", {key:i, className:"os-chip" + (/in van|trained|grouped|inside/i.test(x) && !/not/i.test(x) ? " acc" : "")}, x)),
          h("span", {className:"os-sp"}), h(Btn, {k:"ghost", sm:true, onClick:() => A.dropProposal(r.job)}, "Leave out"))))),
      yes:"Confirm plan", onYes:() => A.acceptPlan(), onNo:() => A.clearPlan()}) : null,
    h("div", {className:"os-grid", style:{gridTemplateColumns:"270px minmax(0,1fr)", alignItems:"start"}},
      h(Card, null, h(CardHead, {title:"Unassigned", sub:"Click a job, then an engineer"}),
        h("div", {style:{padding:"0 10px 10px"}}, un.length ? un.map(j => h("div", {key:j.id, className:"os-kc" + (pick === j.id ? " new" : ""), onClick:() => setPick(pick === j.id ? null : j.id)},
          h("div", {className:"os-row"}, h(Prio, {p:j.prio}), h("span", {className:"os-sp"}), h("span", {className:"os-mono os-faint"}, j.id)),
          h("div", {style:{fontWeight:500, marginTop:6}}, s.cust[j.cust].name), h("div", {className:"os-dim", style:{fontSize:12}}, j.fault),
          h("div", {className:"os-row", style:{marginTop:6}}, h("span", {className:"os-faint", style:{fontSize:11}}, s.cust[j.cust].town.split(",")[0] + " · " + U.dur(j.dur)), h("span", {className:"os-sp"}),
            h(Btn, {k:"ghost", sm:true, onClick:(e) => { e.stopPropagation(); MOS.show("job", j.id); }}, "Open"))))
          : h("div", {className:"os-empty"}, "Everything is scheduled."))),
      h("div", {className:"os-grid"},
        h(Card, null,
          h("div", {style:{display:"grid", gridTemplateColumns:"190px 1fr", padding:"12px 14px 4px"}}, h("div"),
            h("div", {style:{position:"relative", height:18}}, Array.from({length:15}, (_, i) => h("span", {key:i, className:"os-mono os-faint", style:{position:"absolute", left:pct(T0 + i * 60), transform:"translateX(-50%)", fontSize:10}}, U.pad(5 + i))))),
          field.map(e => {
            const legs = MOS.route(e.id, day), u = MOS.utilisation(e.id, day), ghost = prop ? prop.rows.filter(r => r.eng === e.id) : [];
            return h("div", {key:e.id, style:{display:"grid", gridTemplateColumns:"190px 1fr", alignItems:"center", padding:"8px 14px", borderTop:"1px solid var(--border)", background: pick ? "var(--accent-faint)" : "none", cursor: pick ? "pointer" : "default"}, onClick: pick ? () => assignTo(e) : null},
              h("div", {className:"os-row"}, h(Av, {e}), h("div", {style:{minWidth:0}}, h("div", {style:{fontWeight:500}}, e.name), h("div", {className:"os-faint", style:{fontSize:11}}, e.start + " to " + e.end + " · " + Math.round(u.pct * 100) + "% booked"))),
              h("div", {style:{position:"relative", height:46, borderRadius:8, background:"var(--surface-faint)"}},
                h("div", {style:{position:"absolute", top:0, bottom:0, left:pct(U.toMin(e.start)), width:"calc(" + pct(U.toMin(e.end)) + " - " + pct(U.toMin(e.start)) + ")", borderLeft:"1px dashed var(--border-strong)", borderRight:"1px dashed var(--border-strong)"}}),
                day === 0 ? h("div", {style:{position:"absolute", top:-4, bottom:-4, left:pct(U.nowMin()), width:2, background:"var(--accent)", borderRadius:2, opacity:.8}}) : null,
                legs.map((l, i) => {
                  const j = l.job ? Q.job(l.job) : null;
                  const style = {position:"absolute", top: l.kind === "job" ? 5 : 17, height: l.kind === "job" ? 36 : 12, left:pct(Math.max(T0, l.from)), width:"calc(" + pct(Math.min(T1, l.to)) + " - " + pct(Math.max(T0, l.from)) + ")", borderRadius:6, overflow:"hidden"};
                  if (l.kind !== "job") return h("div", {key:i, title:"Driving " + U.dur(l.mins), style:Object.assign(style, {background:"repeating-linear-gradient(135deg,var(--track) 0 4px,transparent 4px 8px)"})});
                  const doneJ = ["Completed","Reviewed","Invoiced"].indexOf(j.status) > -1;
                  return h("div", {key:i, onClick:(ev) => { ev.stopPropagation(); MOS.show("job", j.id); }, title:j.id + " " + s.cust[j.cust].name,
                    style:Object.assign(style, {cursor:"pointer", padding:"4px 7px", fontSize:11, lineHeight:1.25, color:"var(--ink)", background: doneJ ? "var(--ok-soft)" : j.prio === "P1" ? "var(--bad-soft)" : "var(--accent-soft)", border:"1px solid " + (doneJ ? "var(--ok)" : j.prio === "P1" ? "var(--bad)" : "var(--accent-line)")})},
                    h("div", {style:{fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}, s.cust[j.cust].name), h("div", {className:"os-faint", style:{whiteSpace:"nowrap"}}, j.start + " " + j.status));
                }),
                ghost.map(g => h("div", {key:"g" + g.job, style:{position:"absolute", top:5, height:36, left:pct(g.st), width:"calc(" + pct(g.en) + " - " + pct(g.st) + ")", borderRadius:6, border:"1.5px dashed var(--accent)", background:"var(--accent-faint)", padding:"4px 7px", fontSize:11, color:"var(--accent)", overflow:"hidden", whiteSpace:"nowrap"}},
                  h("div", {style:{fontWeight:600}}, g.job), h("div", null, "+" + U.dur(g.travel) + " drive"))))
            );
          })),
        h("div", {className:"os-grid", style:{gridTemplateColumns:"minmax(0,1fr) minmax(0,1.1fr)"}},
          h(Card, null, h(CardHead, {title:"Routes " + U.dayLabel(day).toLowerCase()}), h("div", {style:{padding:"0 12px 12px"}}, h(IrelandMap, {w:360, h:400, maxH:340,
            lines: field.map(e => ({pts:[e.pos].concat(Q.dayJobs(day, e.id).map(j => s.cust[j.cust].pos)).concat([e.pos]), color:e.tint})),
            points: field.map(e => ({kind:"eng", pos:e.pos, label:e.initials, color:e.tint})).concat(Q.jobsForMap(day).map(j => ({pos:s.cust[j.cust].pos, r:4.5, color: j.eng ? "var(--dim)" : "var(--bad)", onClick:() => MOS.show("job", j.id)})))
              .concat(prop ? prop.rows.filter(r => r.eng).map(r => ({pos:r.pos, r:6, color:"var(--accent)"})) : [])}))),
          h(Card, null, h(CardHead, {title:"How the plan is scored"}), h("div", {style:{padding:"0 18px 16px", color:"var(--body)"}},
            [["Urgency and SLA","P1 breakdowns first, inside the customer’s SLA window"],["Drive time","Inserted where it adds the least driving from the previous stop"],["Grouping","Jobs within 35 km of another stop are pulled together"],
             ["Skills","Engineer must be trained on the manufacturer"],["Parts","Prefers the engineer with the part already in the van"],["Hours","Respects each engineer’s own start and finish, like Eoin’s 05:30 Dublin runs"]].map(x =>
              h("div", {key:x[0], style:{padding:"6px 0", borderBottom:"1px solid var(--border)"}}, h("div", {style:{fontWeight:500}}, x[0]), h("div", {className:"os-dim", style:{fontSize:12}}, x[1])))))))));
}
Q.jobsForMap = (day) => MOS.get().jobs.filter(j => (j.day === day && j.eng) || j.status === "New");

/* ================= ENGINEER APP ================= */
MOS.modules.field = {title:"Engineer App", sub:"The job sheet on the engineer’s phone replaces the paper docket and WhatsApp", render:(s) => h(FieldPage, {s})};
function FieldPage(p){
  const s = p.s, f = s.field, e = Q.eng(f.eng);
  const mine = Q.dayJobs(0, e.id).concat(s.jobs.filter(j => j.eng === e.id && j.day === 0 && !j.start));
  return h("div", {className:"os-grid", style:{gridTemplateColumns:"minmax(0,1fr) 400px minmax(0,1fr)", alignItems:"start"}},
    h("div", {className:"os-grid"},
      h(Card, {pad:true}, h("div", {className:"os-lbl"}, "Phone of"), h("div", {className:"os-row os-wrap"}, Q.field().map(x => h(Btn, {key:x.id, k: x.id === e.id ? "pri" : "", sm:true, onClick:() => A.fieldEng(x.id)}, x.name))),
        h("div", {className:"os-dim", style:{marginTop:10}}, e.name + " · van " + e.van + " · " + e.start + " to " + e.end), e.early ? h("div", {className:"os-faint", style:{marginTop:2}}, e.early) : null),
      h(Card, {pad:true}, h("div", {style:{fontWeight:600, marginBottom:6}}, "What it replaces"),
        [["Trello card","The job arrives on the phone from Dispatch"],["WhatsApp message","Full record: customer, machine, history, manual, parts"],["Paper triplicate docket","Digital job sheet with photos and a signature"],["Retyping at the office","The sheet feeds the invoice, stock and warranty directly"]].map(x =>
          h("div", {key:x[0], className:"os-row", style:{padding:"6px 0", borderTop:"1px solid var(--border)", alignItems:"flex-start"}}, h("span", {style:{textDecoration:"line-through", color:"var(--faint)", width:150, flex:"none"}}, x[0]), h("span", {className:"os-dim"}, x[1]))))),
    h(Phone, {s, e, mine}),
    h(Card, null, h(CardHead, {title:"What the office sees", sub:"Updates as " + e.name.split(" ")[0] + " works", right:h("span", {className:"os-live"})}),
      h("div", {style:{padding:"0 18px 14px", maxHeight:560, overflow:"auto"}}, h("div", {className:"os-tl"},
        (s.geo[e.id] || []).slice().reverse().map((g, i) => h("div", {key:i, className:"e " + (g.src === "geofence" ? "geofence" : "app")}, h("div", null, g.label), h("div", {className:"os-mono os-faint"}, g.t + " · " + (g.src === "geofence" ? "site geofence" : "app")))))),
      s.feed.filter(x => x.kind === "system").length ? h("div", {style:{padding:"0 18px 16px"}}, h("div", {className:"os-lbl"}, "Flowed on automatically"),
        s.feed.filter(x => x.kind === "system").slice(0, 5).map((x, i) => h("div", {key:i, className:"os-row", style:{padding:"5px 0"}}, h(Badge, {k:"acc"}, x.t), h("span", {className:"os-dim"}, x.text)))) : null));
}
/* phone palette: light, high contrast, big targets (used outdoors with gloves) */
const PH = {bg:"#f3f6f8", card:"#ffffff", ink:"#0e161d", dim:"#56656f", line:"#dde4e9", acc:"#0089a3", ok:"#12794a", bad:"#b3261e", warn:"#8a5a12"};
function PBtn(p){ return h("button", {onClick:p.onClick, disabled:p.disabled, style:Object.assign({width:"100%", height:50, borderRadius:14, border:p.k === "pri" ? "0" : "1.5px solid " + PH.line, background:p.k === "pri" ? PH.acc : p.k === "ok" ? PH.ok : PH.card,
  color:p.k === "pri" || p.k === "ok" ? "#fff" : PH.ink, fontSize:15, fontWeight:600, cursor:"pointer", opacity:p.disabled ? .45 : 1, marginTop:8}, p.style)}, p.children); }
function PCard(p){ return h("div", {onClick:p.onClick, style:Object.assign({background:PH.card, borderRadius:16, padding:"13px 14px", marginBottom:10, border:"1px solid " + PH.line, cursor:p.onClick ? "pointer" : "default"}, p.style)}, p.children); }
function PL(p){ return h("div", {style:{fontSize:11.5, color:PH.dim, marginBottom:4, fontWeight:500}}, p.children); }
function Phone(p){
  const s = p.s, e = p.e, f = s.field; const j = f.job ? Q.job(f.job) : null;
  const started = (s.geo[e.id] || []).some(g => g.type === "day-start") && s.status[e.id] !== "Off duty";
  const onDuty = s.tracking.onDuty[e.id];
  let body, title = "My day", back = null;
  if (f.screen === "day" || !j){
    body = h(F, null,
      !started ? h(PCard, {style:{background:"#e6f4f7", borderColor:"#b8e0e8"}}, h("div", {style:{fontWeight:600}}, "Good morning, " + e.name.split(" ")[0]), h("div", {style:{color:PH.dim, fontSize:13}}, p.mine.length + " jobs today. Tracking starts only when you start your day."),
        h(PBtn, {k:"pri", onClick:() => A.startDay(e.id)}, "Start day " + U.hm(U.nowMin())))
      : h(PCard, null, h("div", {style:{display:"flex", alignItems:"center", gap:8}}, h("span", {style:{width:8, height:8, borderRadius:"50%", background: onDuty ? PH.ok : PH.dim}}), h("span", {style:{fontWeight:600, flex:1}}, onDuty ? "On duty" : "Private, location paused"),
          h("button", {onClick:() => A.privateMode(e.id, onDuty), style:{border:"1px solid " + PH.line, background:"#fff", borderRadius:10, height:32, padding:"0 10px", fontSize:12.5, color:PH.ink, cursor:"pointer"}}, onDuty ? "Go private" : "Back on duty")),
        h("div", {style:{color:PH.dim, fontSize:12.5, marginTop:4}}, "Started " + ((s.geo[e.id] || []).find(g => g.type === "day-start") || {}).t + " · only site arrivals and departures are recorded")),
      p.mine.map(x => { const c = s.cust[x.cust], doneJ = ["Completed","Reviewed","Invoiced"].indexOf(x.status) > -1;
        return h(PCard, {key:x.id, onClick:() => A.fieldGo("job", x.id), style:{opacity:doneJ ? .6 : 1, borderLeft:"4px solid " + (x.prio === "P1" ? PH.bad : doneJ ? PH.ok : PH.acc)}},
          h("div", {style:{display:"flex", fontSize:12, color:PH.dim}}, h("span", {style:{fontWeight:700, color:PH.ink}}, x.start || "Today"), h("span", {style:{flex:1, marginLeft:8}}, x.id), h("span", null, x.status)),
          h("div", {style:{fontWeight:600, fontSize:15, marginTop:4}}, c.name), h("div", {style:{fontSize:13, color:PH.dim}}, s.machines[x.machine].model + " · " + x.fault)); }),
      !p.mine.length ? h("div", {style:{color:PH.dim, textAlign:"center", padding:20}}, "Nothing booked today. Jobs appear here the moment Dispatch sends them.") : null,
      started && onDuty ? h(PBtn, {onClick:() => A.endDay(e.id)}, "Finish day") : null);
  } else {
    const c = s.cust[j.cust], m = s.machines[j.machine], sh = j.sheet && j.sheet !== "seeded" ? j.sheet : null;
    back = () => A.fieldGo(f.screen === "job" ? "day" : "job");
    const hist = s.jobs.filter(x => x.machine === m.id && x.id !== j.id).slice(0, 3);
    if (f.screen === "job"){
      title = j.id;
      body = h(F, null,
        h(PCard, null, h("div", {style:{fontWeight:700, fontSize:17}}, c.name), h("div", {style:{color:PH.dim, fontSize:13}}, c.town),
          h("div", {style:{display:"flex", gap:8, marginTop:10}}, h("a", {style:pill(), href:"#", onClick:(ev) => ev.preventDefault()}, "Navigate"), h("a", {style:pill(), href:"#", onClick:(ev) => ev.preventDefault()}, "Call " + c.contact[0].split(" ")[0])),
          h("div", {style:{fontSize:12.5, color:PH.dim, marginTop:10}}, "Site contact " + c.contact[0] + ", " + c.contact[1])),
        h(PCard, null, h(PL, null, "Reported fault"), h("div", {style:{fontSize:14.5}}, j.fault), h("div", {style:{fontSize:11.5, color:PH.dim, marginTop:6}}, "From " + j.source.toLowerCase() + ", " + (j.sla || ""))),
        h(PCard, null, h(PL, null, "Machine"), h("div", {style:{fontWeight:600}}, m.mfr + " " + m.model + " " + m.type.toLowerCase()), h("div", {style:{fontSize:12.5, color:PH.dim}}, "Serial " + m.serial),
          h("div", {style:{marginTop:6, fontSize:12.5, fontWeight:600, color: m.underWarranty ? PH.ok : PH.dim}}, m.underWarranty ? "In warranty: parts claimed from " + m.mfr : "Out of warranty"),
          hist.length ? h("div", {style:{marginTop:8, borderTop:"1px solid " + PH.line, paddingTop:8}}, h(PL, null, "Last visits"), hist.map(x => h("div", {key:x.id, style:{fontSize:12.5}}, x.id + " · " + x.fault))) : null,
          h("div", {style:{marginTop:8, fontSize:12.5, color:PH.acc, fontWeight:600}}, "Manual, wiring diagram, parts list")),
        j.parts.length ? h(PCard, null, h(PL, null, "Parts for this job"), j.parts.map(sku => h("div", {key:sku, style:{fontSize:13, display:"flex"}}, h("span", {style:{flex:1}}, sku + " " + s.catalogue[sku].name), h("b", {style:{color:Q.vanQty(e.id, sku) ? PH.ok : PH.warn}}, Q.vanQty(e.id, sku) ? "In van" : "Not in van")))) : null,
        ["Dispatched","Scheduled","New"].indexOf(j.status) > -1 ? h(PBtn, {k:"pri", onClick:() => A.travel(e.id, j.id)}, "On my way") : null,
        j.status === "Travelling" ? h(PBtn, {k:"pri", onClick:() => A.arrive(e.id, j.id)}, "Arrived (geofence)") : null,
        j.status === "On site" ? h(PBtn, {k:"pri", onClick:() => { A.startJob(e.id, j.id); A.fieldGo("sheet"); }}, "Start job") : null,
        j.status === "In progress" ? h(PBtn, {k:"pri", onClick:() => A.fieldGo("sheet")}, "Open job sheet") : null,
        ["Completed","Reviewed","Invoiced"].indexOf(j.status) > -1 ? h("div", {style:{textAlign:"center", color:PH.ok, fontWeight:600, padding:12}}, "Completed and signed") : null);
    } else if (f.screen === "sheet" && sh){
      title = "Job sheet";
      const fitList = Object.keys(s.vans[e.id] || {}).filter(sku => Q.vanQty(e.id, sku) > 0).concat(j.parts.filter(sku => !Q.vanQty(e.id, sku)));
      body = h(F, null,
        h("div", {style:{fontSize:12, color:PH.dim, margin:"0 2px 8px"}}, "Started " + (j.startedAt || "") + " · timer running · saved on the phone as you type"),
        h(PCard, null, h(PL, null, "Diagnosis"),
          h("div", {style:{display:"flex", flexWrap:"wrap", gap:6, marginBottom:8}}, faultChips(m.model).map(t => h("button", {key:t, onClick:() => A.sheet(j.id, {diag:t}), style:chip(sh.diag === t)}, t))),
          h("textarea", {value:sh.diag, onChange:(ev) => A.sheet(j.id, {diag:ev.target.value}), style:pta(), placeholder:"What was wrong"})),
        h(PCard, null, h(PL, null, "Work carried out"), h("textarea", {value:sh.work, onChange:(ev) => A.sheet(j.id, {work:ev.target.value}), style:pta(), placeholder:"What you did"}),
          !sh.work ? h("button", {onClick:() => A.sheet(j.id, {work:workText(j, m)}), style:Object.assign(chip(false), {marginTop:6})}, "Use suggested wording") : null),
        h(PCard, null, h(PL, null, "Parts fitted"),
          sh.fitted.map((x, i) => h("div", {key:i, style:{display:"flex", alignItems:"center", fontSize:13, padding:"5px 0"}}, h("span", {style:{flex:1}}, x.sku + " " + s.catalogue[x.sku].name), h("span", {style:{color:PH.dim, marginRight:8}}, x.from === "van" ? "van" : "warehouse"), h("button", {onClick:() => A.unfit(j.id, i), style:xbtn()}, "Remove"))),
          h("select", {value:"", onChange:(ev) => ev.target.value && A.fit(e.id, j.id, ev.target.value), style:psel()}, h("option", {value:""}, "Add a part from the van"),
            fitList.map(sku => h("option", {key:sku, value:sku}, sku + " " + s.catalogue[sku].name + (Q.vanQty(e.id, sku) ? " (" + Q.vanQty(e.id, sku) + " in van)" : " (warehouse)"))))),
        h(PCard, null, h(PL, null, "Parts removed"),
          sh.removed.map((x, i) => h("div", {key:i, style:{display:"flex", alignItems:"center", fontSize:13, padding:"5px 0"}}, h("span", {style:{flex:1}}, x.sku), h("span", {style:{color: x.cond === "warranty" ? PH.acc : PH.dim, marginRight:8, fontWeight:600}}, x.cond === "warranty" ? "Warranty return" : x.cond === "refurb" ? "Refurbish" : "Scrap"), h("button", {onClick:() => A.unremove(j.id, i), style:xbtn()}, "Remove"))),
          sh.fitted.length ? h("div", {style:{display:"flex", gap:6, flexWrap:"wrap"}}, sh.fitted.filter(x => !sh.removed.some(r => r.sku === x.sku)).map(x =>
            h("button", {key:x.sku, style:chip(false), onClick:() => A.removed(j.id, x.sku, j.billing === "warranty" ? "warranty" : "scrap")}, "Old " + x.sku + (j.billing === "warranty" ? ", tag for warranty" : ", scrap"))))
            : h("div", {style:{fontSize:12.5, color:PH.dim}}, "Fit a part first, then log the old one")),
        h(PCard, null, h(PL, null, "Notes"), h("textarea", {value:sh.notes, onChange:(ev) => A.sheet(j.id, {notes:ev.target.value}), style:pta(), placeholder:"Anything the office or next engineer should know"})),
        h(PCard, null, h(PL, null, "Photos"), h("div", {style:{display:"flex", gap:6, flexWrap:"wrap"}}, sh.photos.map((ph, i) => h(Photo, {key:i, ph}))),
          h("div", {style:{display:"flex", gap:6, marginTop:8}}, ["Before","Fault","After"].map(l => h("button", {key:l, onClick:() => A.photo(j.id, l), style:chip(false)}, "Take " + l.toLowerCase() + " photo")))),
        h(PCard, null, h("label", {style:{display:"flex", alignItems:"center", gap:10, fontSize:14, fontWeight:600}}, h("input", {type:"checkbox", checked:sh.followUp, onChange:(ev) => A.sheet(j.id, {followUp:ev.target.checked}), style:{width:20, height:20}}), "Needs a follow-up visit"),
          sh.followUp ? h("input", {value:sh.followReason, onChange:(ev) => A.sheet(j.id, {followReason:ev.target.value}), placeholder:"Why", style:Object.assign(psel(), {marginTop:8})}) : null),
        h(PCard, null, h(PL, null, "Billing"), h("div", {style:{fontSize:13.5, fontWeight:600, color: j.billing === "warranty" ? PH.acc : PH.ink}}, j.billing === "warranty" ? "Warranty: claim goes to " + m.mfr + " automatically" : j.billing === "contract" ? "Service plan visit" : "Chargeable, " + c.name + " rates")),
        h(PBtn, {k:"pri", disabled:!sh.diag || !sh.work, onClick:() => A.fieldGo("sign")}, "Customer sign-off"));
    } else if (f.screen === "sign" && sh){
      title = "Sign-off";
      body = h(SignOff, {s, e, j, c, sh});
    } else body = h("div", null);
  }
  return h("div", {style:{position:"sticky", top:0}},
    h("div", {style:{width:390, height:790, margin:"0 auto", borderRadius:54, padding:12, background:"#0b1116", boxShadow:"0 0 0 2px #26323c, 0 40px 90px rgba(0,0,0,.45)"}},
      h("div", {style:{width:"100%", height:"100%", borderRadius:43, overflow:"hidden", background:PH.bg, color:PH.ink, display:"flex", flexDirection:"column", fontFamily:"'Instrument Sans',system-ui,sans-serif"}},
        h("div", {style:{height:44, flex:"none", display:"flex", alignItems:"center", padding:"0 26px", fontSize:13, fontWeight:600}}, h("span", {style:{flex:1}}, U.hm(U.nowMin())), h("span", {style:{width:100, height:28, borderRadius:20, background:"#0b1116"}}), h("span", {style:{flex:1, textAlign:"right"}}, "4G")),
        h("div", {style:{flex:"none", display:"flex", alignItems:"center", gap:8, padding:"6px 16px 10px"}},
          back ? h("button", {onClick:back, style:{border:0, background:"none", color:PH.acc, fontSize:15, fontWeight:600, cursor:"pointer", padding:0}}, "‹ Back") : h("span", {style:{width:30, height:30, borderRadius:10, background:PH.acc, color:"#fff", fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13}}, "M"),
          h("span", {style:{fontWeight:700, fontSize:17, flex:1, textAlign: back ? "center" : "left"}}, title), h("span", {style:{fontSize:11, color:PH.dim}}, "Synced")),
        h("div", {style:{flex:1, overflow:"auto", padding:"0 14px 20px"}}, body))));
}
const pill = () => ({flex:1, textAlign:"center", height:40, lineHeight:"40px", borderRadius:12, background:"#e6f4f7", color:PH.acc, fontWeight:600, fontSize:13.5, textDecoration:"none"});
const chip = (on) => ({border:"1.5px solid " + (on ? PH.acc : PH.line), background:on ? "#e6f4f7" : "#fff", color:on ? PH.acc : PH.ink, borderRadius:10, padding:"7px 10px", fontSize:12.5, cursor:"pointer", fontWeight:500});
const pta = () => ({width:"100%", minHeight:70, borderRadius:12, border:"1.5px solid " + PH.line, padding:10, fontSize:14, fontFamily:"inherit", color:PH.ink, background:"#fff", resize:"vertical", outline:"none"});
const psel = () => ({width:"100%", height:44, borderRadius:12, border:"1.5px solid " + PH.line, padding:"0 10px", fontSize:14, fontFamily:"inherit", color:PH.ink, background:"#fff", marginTop:6});
const xbtn = () => ({border:0, background:"none", color:PH.bad, fontSize:12, cursor:"pointer"});
function faultChips(model){
  const base = {"FW-500":["Photo-eye misaligned","Photo-eye faulty","Film tension"], "FC-8":["Chuck insert worn","Torque clutch slipping","Air pressure low"], "CW-30":["Reject arm actuator failed","Load cell drift"],
    "MD-40":["Detection head fault","Test piece sensitivity"], "TS-400":["Seal rubber worn","Heater element fault","Film tension"], "TS-600":["Heater element open circuit","Thermocouple fault"], "BS-12":["Interlock switch failed","Blade worn"]}[model];
  return base || ["Worn component","Electrical fault","Operator setting"];
}
function workText(j, m){
  return {"FW-500":"Replaced registration photo-eye, realigned to film eye-mark, tested 400 packs on branded film at line speed. Registration within 1 mm.",
    "FC-8":"Replaced 38 mm capping chuck inserts, set clutch torque to spec, tested 200 caps with torque tester, all within tolerance.",
    "TS-400":"Replaced worn seal bar silicone rubber, cleaned and re-levelled seal plate, ran 150 trays at line speed. Seal even on all four edges.",
    "MD-40":"Validated detection head with ferrous, non-ferrous and stainless test packs at line speed. Passed. Validation record signed."}[m.model]
    || "Diagnosed and repaired fault on " + m.model + ", tested under production conditions and handed back to the operator.";
}
function SignOff(p){
  const {s, e, j, c, sh} = p; const cv = useRef(null); const [name, setName] = useState(sh.signedBy || c.contact[0]); const [inked, setInked] = useState(false);
  useEffect(() => {
    const el = cv.current; if (!el) return; const ctx = el.getContext("2d"); ctx.lineWidth = 2.4; ctx.lineCap = "round"; ctx.strokeStyle = PH.ink;
    let down = false;
    const pt = (ev) => { const r = el.getBoundingClientRect(); return [(ev.clientX - r.left) * el.width / r.width, (ev.clientY - r.top) * el.height / r.height]; };
    const d = (ev) => { down = true; const q = pt(ev); ctx.beginPath(); ctx.moveTo(q[0], q[1]); el.setPointerCapture(ev.pointerId); };
    const m = (ev) => { if (!down) return; const q = pt(ev); ctx.lineTo(q[0], q[1]); ctx.stroke(); setInked(true); };
    const u = () => { down = false; };
    el.addEventListener("pointerdown", d); el.addEventListener("pointermove", m); el.addEventListener("pointerup", u);
    return () => { el.removeEventListener("pointerdown", d); el.removeEventListener("pointermove", m); el.removeEventListener("pointerup", u); };
  }, []);
  const mins = j.startedAt ? Math.max(1, U.nowMin() - U.toMin(j.startedAt)) : j.dur;
  return h(F, null,
    h(PCard, null, h(PL, null, "Summary for " + c.contact[0]), h("div", {style:{fontSize:13.5}}, sh.work),
      h("div", {style:{fontSize:12.5, color:PH.dim, marginTop:8}}, "Time on site " + U.dur(mins) + " · " + sh.fitted.length + " part" + (sh.fitted.length === 1 ? "" : "s") + " fitted · " + sh.photos.length + " photos"),
      sh.fitted.map((x, i) => h("div", {key:i, style:{fontSize:12.5}}, "• " + s.catalogue[x.sku].name))),
    h(PCard, null, h(PL, null, "Customer signature"),
      h("canvas", {ref:cv, width:640, height:260, style:{width:"100%", height:130, borderRadius:12, border:"1.5px dashed " + PH.line, background:"#fff", touchAction:"none", cursor:"crosshair"}}),
      h("div", {style:{display:"flex", alignItems:"center", marginTop:6}}, h("span", {style:{fontSize:12, color:PH.dim, flex:1}}, "Sign with your finger"), h("button", {style:xbtn(), onClick:() => { const el = cv.current; el.getContext("2d").clearRect(0, 0, el.width, el.height); setInked(false); }}, "Clear")),
      h("input", {value:name, onChange:(ev) => setName(ev.target.value), style:psel(), placeholder:"Name"}),
      h("label", {style:{display:"flex", gap:8, alignItems:"center", fontSize:13, marginTop:8}}, h("input", {type:"checkbox", checked:sh.email, onChange:(ev) => A.sheet(j.id, {email:ev.target.checked})}), "Email a copy to " + c.contact[2])),
    h(PBtn, {k:"ok", disabled:!inked || !name, onClick:() => { A.sheet(j.id, {sig:cv.current.toDataURL("image/png"), signedBy:name}); A.complete(e.id, j.id); A.fieldGo("day", null); }}, "Complete job"));
}
})();
