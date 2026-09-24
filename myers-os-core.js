/* Myers Service OS: core (helpers, seed data, store, automations).
   DEMO DATA, not claimed real figures. Builds on the records the Pulse page already holds
   (customers, machines, jobs, parts) so counts agree with the rest of the demo.
   Everything here is front end only: state lives in memory and in sessionStorage. */
(function(){
"use strict";
const MOS = window.MOS = window.MOS || {};

/* ---------- small helpers ---------- */
const pad = (n) => String(n).padStart(2, "0");
const hm = (mins) => pad(Math.floor(mins / 60)) + ":" + pad(Math.round(mins % 60));
const toMin = (s) => { const p = String(s).split(":"); return (+p[0]) * 60 + (+p[1] || 0); };
const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
const eur = (n) => "€" + Math.round(n).toLocaleString("en-IE");
const eur2 = (n) => "€" + n.toLocaleString("en-IE", {minimumFractionDigits:2, maximumFractionDigits:2});
const dur = (m) => { m = Math.max(0, Math.round(m)); const hh = Math.floor(m / 60), mm = m % 60; return hh ? hh + "h" + (mm ? " " + pad(mm) + "m" : "") : mm + "m"; };
function rng(seed){ let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const TODAY = new Date(); TODAY.setHours(0,0,0,0);
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const WD = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const dm = (d) => d.getDate() + " " + MON[d.getMonth()];
function workday(n){
  let d = new Date(TODAY);
  while (d.getDay() === 0 || d.getDay() === 6) d = addDays(d, 1);
  const step = n < 0 ? -1 : 1; let left = Math.abs(n);
  while (left > 0){ d = addDays(d, step); if (d.getDay() !== 0 && d.getDay() !== 6) left -= 1; }
  return d;
}
function dayLabel(n){
  const d = workday(n), cal = Math.round((d - TODAY) / 864e5);
  return cal === 0 ? "Today" : cal === 1 ? "Tomorrow" : cal === -1 ? "Yesterday" : WD[d.getDay()] + " " + dm(d);
}
function hash(obj){ const s = JSON.stringify(obj); let h = 2166136261; for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16).padStart(8, "0"); }
MOS.util = {pad, hm, toMin, nowMin, eur, eur2, dur, rng, TODAY, addDays, dm, workday, dayLabel, hash, WD, MON};

/* ---------- geography ---------- */
const BASE = {name:"Myers depot, Mitchelstown", lat:52.266, lng:-8.268};
const TOWN = {
  blackwater:[52.138,-8.276], carrigdown:[52.355,-8.683], atlantic:[51.651,-9.910], slaneroad:[53.652,-6.681],
  kilcoran:[52.375,-7.924], liffey:[53.216,-6.666], mulcahy:[52.355,-7.704], shannonside:[52.713,-8.500],
  corrib:[53.268,-8.924], glenbeigh:[52.106,-9.785], ardmore:[51.951,-7.726], knockmealdown:[52.137,-7.931],
  ballyduff:[52.147,-8.050], suirside:[52.349,-7.413], leeroad:[51.898,-8.475], roaringwater:[51.550,-9.263]
};
const COAST = [[55.38,-7.37],[55.17,-6.97],[55.21,-6.52],[55.23,-6.15],[55.05,-5.99],[54.86,-5.81],[54.72,-5.72],[54.66,-5.88],[54.66,-5.67],[54.50,-5.45],
  [54.33,-5.44],[54.25,-5.85],[54.06,-6.00],[54.03,-6.25],[53.95,-6.37],[53.84,-6.24],[53.63,-6.19],[53.45,-6.10],[53.38,-6.06],[53.34,-6.21],[53.27,-6.10],
  [53.10,-6.05],[52.97,-5.99],[52.80,-6.14],[52.62,-6.21],[52.47,-6.35],[52.34,-6.45],[52.17,-6.36],[52.18,-6.60],[52.13,-6.93],[52.24,-6.97],[52.13,-7.10],
  [52.10,-7.40],[52.05,-7.55],[51.95,-7.72],[51.93,-7.85],[51.82,-8.05],[51.80,-8.28],[51.70,-8.50],[51.60,-8.53],[51.56,-8.88],[51.53,-8.95],[51.48,-9.37],
  [51.45,-9.82],[51.60,-9.55],[51.60,-9.95],[51.58,-10.18],[51.75,-10.12],[51.80,-10.35],[51.90,-10.36],[52.07,-9.97],[52.10,-10.47],[52.25,-10.20],[52.27,-9.75],
  [52.41,-9.93],[52.58,-9.36],[52.64,-9.49],[52.56,-9.93],[52.85,-9.44],[52.97,-9.43],[53.12,-9.28],[53.20,-8.95],[53.27,-9.05],[53.26,-9.55],[53.33,-9.90],
  [53.40,-10.20],[53.55,-10.08],[53.62,-9.90],[53.80,-9.52],[53.90,-10.05],[54.00,-10.18],[54.23,-10.03],[54.30,-9.98],[54.28,-9.60],[54.32,-9.35],[54.22,-9.10],
  [54.25,-8.75],[54.30,-8.50],[54.43,-8.45],[54.63,-8.20],[54.62,-8.45],[54.64,-8.78],[54.83,-8.55],[55.00,-8.40],[55.15,-8.28],[55.18,-7.95],[55.27,-7.63],
  [55.15,-7.55],[55.28,-7.35]];
function km(a, b){
  const R = 6371, r = Math.PI / 180, dLat = (b[0]-a[0])*r, dLng = (b[1]-a[1])*r;
  const x = Math.sin(dLat/2)**2 + Math.cos(a[0]*r) * Math.cos(b[0]*r) * Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
// Road minutes: straight line x 1.3 road factor at 72 km/h average, plus 6 min to park and walk in.
const drive = (a, b) => Math.round(km(a, b) * 1.3 / 72 * 60 + 6);
MOS.geo = {BASE, TOWN, COAST, km, drive};

/* ---------- seed ---------- */
function seed(P){
  const R = rng(20260925);
  const cust = {}; P.CUSTOMERS.forEach(c => { cust[c.id] = Object.assign({}, c, {pos:TOWN[c.id],
    rates:{labour: c.plan === "gold" ? 78 : c.plan === "silver" ? 84 : 92, callout: c.plan === "gold" ? 0 : 65, travel: c.plan === "standard" ? 0.85 : 0.6}}); });

  // Field engineers from the page, plus the workshop pair and the two on the road selling.
  const engineers = [
    {id:"sm", name:"Sean Murphy", initials:"SM", kind:"field", patch:"Munster", home:"Mitchelstown", pos:[52.266,-8.268], start:"07:00", end:"16:30",
     van:"222-C-4471", brands:["Traymaster","Nordvak","Ferrox","Brodmann"], phone:"087 214 6630", tint:"#7fd4e6"},
    {id:"eo", name:"Eoin O’Brien", initials:"EO", kind:"field", patch:"Leinster and Connacht", home:"Newbridge, Co. Kildare", pos:[53.181,-6.797], start:"05:30", end:"16:00",
     van:"231-KE-1180", brands:["Nordvak","Weighline","Brodmann","Labelux"], phone:"086 390 1142", tint:"#b6c8d4", early:"Starts 05:30 on Dublin days to beat the M50"},
    {id:"mk", name:"Martin Keane", initials:"MK", kind:"field", patch:"Installs, commissioning, warranty", home:"Fermoy", pos:[52.138,-8.276], start:"07:30", end:"17:00",
     van:"212-C-9023", brands:["Nordvak","Traymaster","Weighline","Fillwright","Labelux"], phone:"087 771 0458", tint:"#c9d6de"},
    {id:"pn", name:"Pádraig Nolan", initials:"PN", kind:"workshop", patch:"Workshop lead", home:"Mitchelstown", pos:[52.266,-8.268], start:"08:00", end:"16:30", tint:"#e0b452", brands:["All"]},
    {id:"kb", name:"Kevin Barry", initials:"KB", kind:"workshop", patch:"Workshop technician", home:"Mitchelstown", pos:[52.266,-8.268], start:"08:00", end:"16:30", tint:"#6fd0a0", brands:["All"]},
    {id:"pw", name:"Paul Walsh", initials:"PW", kind:"sales", patch:"Sales, Munster", home:"Cork", pos:[51.898,-8.475], start:"08:30", end:"17:30", tint:"#9aabb5"},
    {id:"tm", name:"Tom Myers", initials:"TM", kind:"sales", patch:"Sales, Leinster", home:"Mitchelstown", pos:[52.266,-8.268], start:"08:00", end:"18:00", tint:"#00b8d8"}
  ];
  const engById = {}; engineers.forEach(e => engById[e.id] = e);

  // Parts catalogue: the page's reserved parts plus the common consumables vans carry.
  const catalogue = {};
  P.PARTS.forEach(p => { catalogue[p.sku] = {sku:p.sku, name:p.name, model:p.model, mfr:p.mfr, wh:p.stock, min:p.reorderAt, onOrder:p.onOrder, eta:p.eta,
    cost: 40 + Math.round(R() * 260), bin:"A" + (10 + Math.floor(R() * 40))}; });
  [["PT-TS-SEAL","Seal bar silicone rubber, 600 mm","TS-600",18,6],["PT-TS-PTFE","PTFE cover tape, 25 m","TS-400",24,8],["PT-VC-LID","Vacuum lid gasket","VC-1",9,4],
   ["PT-VC-OIL","Vacuum pump oil, 1 L","VC-2",30,10],["PT-FW-JAW","Crimp jaw heater","FW-300",4,2],["PT-CW-LC","Load cell, 6 kg","CW-20",2,2],
   ["PT-MD-TP","Metal detector test pack set","MD-40",11,4],["PT-BS-BLD","Slicer blade set, 12 mm","BS-12",6,3],["PT-MN-PL8","Mincer plate, 8 mm","MN-32",7,3],
   ["PT-LB-RL","Print roller, 107 mm","LB-100",5,2],["PT-FC-OR","Capping head O-ring kit","FC-8",12,5],["PT-GEN-FUSE","Control fuse kit","TF-420",20,8],
   ["PT-GEN-PROX","Proximity sensor M12","TF-420",8,4],["PT-TF-CHN","Thermoformer chain link set","TF-420",3,2]].forEach(r => {
    const mfr = P.MODELS[r[2]].mfr;
    catalogue[r[0]] = {sku:r[0], name:r[1], model:r[2], mfr, wh:r[3], min:r[4], onOrder:0, eta:"", cost: 12 + Math.round(R() * 140), bin:"B" + (10 + Math.floor(R() * 40))};
  });
  Object.values(catalogue).forEach(p => { p.sell = Math.round(p.cost * 1.45); });
  // Low stock story: 4 warehouse lines below minimum.
  catalogue["PT-CW-LC"].wh = 1; catalogue["PT-FW-JAW"].wh = 1;

  const vans = {
    sm:{"PK-VC2":1,"PT-TS-SEAL":3,"PT-TS-PTFE":2,"PT-VC-OIL":4,"PT-BS-BLD":1,"PT-MN-PL8":1,"PT-GEN-FUSE":3,"PT-HE600":0,"PT-BS12-IL":1},
    eo:{"PT-FW500-PE":1,"PT-CW30-RA":1,"PT-VC-LID":2,"PT-VC-OIL":3,"PT-MD-TP":1,"PT-LB-RL":1,"PT-GEN-PROX":2,"PT-GEN-FUSE":2,"PT-CW-LC":0,"PT-PS350-BK":0},
    mk:{"PT-FC8-CH":2,"PT-FC-OR":2,"PT-LB200-GS":1,"PT-GEN-PROX":1,"PT-TS-SEAL":1,"PT-MD-TP":1,"PT-GEN-FUSE":2,"PT-TF-CHN":1}
  };
  const vanMin = {sm:{"PT-TS-SEAL":2,"PT-VC-OIL":2,"PT-GEN-FUSE":2,"PK-VC2":1}, eo:{"PT-VC-OIL":2,"PT-GEN-FUSE":2,"PT-GEN-PROX":1,"PT-CW-LC":1,"PT-CW30-RA":1},
    mk:{"PT-FC-OR":1,"PT-GEN-FUSE":2,"PT-FC8-CH":2,"PT-TS-SEAL":1}};

  const machines = {};
  P.MACHINES.forEach(m => {
    machines[m.id] = {id:m.id, cust:m.cust, model:m.model, type:m.type, mfr:m.mfr, serial:m.serial, installed:m.installed.getTime(),
      warrantyEnd:m.warrantyEnd.getTime(), underWarranty:m.underWarranty, ownership:"customer", status:"installed", location:cust[m.cust].town,
      lastPM:m.lastPM.getTime(), plan:m.plan};
  });
  // Myers-owned stock, hire fleet and machines in for work.
  const extra = [
    ["HR-0101","TS-400","TS4-21-0612","hire","on-hire","ballyduff"],["HR-0102","VC-2","VC2-22-0907","hire","on-hire","atlantic"],
    ["HR-0103","CW-20","CW20-22-0331","hire","on-hire","slaneroad"],["HR-0104","FW-300","FW3-21-0288","hire","available",null],
    ["HR-0105","VC-1","VC1-23-4410","hire","on-hire","corrib"],["HR-0106","MD-40","MD40-21-0877","hire","on-hire","liffey"],
    ["HR-0107","TS-600","TS6-22-0719","hire","available",null],["HR-0108","BS-12","BS12-22-0633","hire","on-hire","leeroad"],
    ["NS-2201","TF-420","TF4-26-0331","myers-new","in-stock",null],["NS-2202","TS-600","TS6-26-0918","myers-new","in-stock",null],
    ["NS-2203","LB-200","LB2-26-0712","myers-new","in-stock",null],["NS-2204","CW-30","CW30-26-0402","myers-new","reserved","kilcoran"],
    ["NS-2205","BF-400","BF4-26-0150","myers-new","in-stock",null],["US-1301","VC-2","VC2-18-0333","myers-used","refurb",null],
    ["US-1302","MN-32","MN32-17-0290","myers-used","in-stock",null],["US-1303","BS-12","BS12-16-0101","myers-used","in-stock",null],
    ["US-1304","FW-500","FW5-19-0044","myers-used","refurb",null],
    ["MC-0721","DV-4","DV4-17-0022","customer","in-workshop","leeroad"],["MC-0722","BC-120","BC12-18-0065","customer","in-workshop","suirside"],
    ["MC-0723","PS-350","PS35-20-0081","customer","in-workshop","kilcoran"]
  ];
  extra.forEach((r, i) => {
    const mdl = P.MODELS[r[1]], inst = addDays(TODAY, -Math.round(200 + R() * 1400));
    machines[r[0]] = {id:r[0], cust:r[5], model:r[1], type:mdl.type, mfr:mdl.mfr, serial:r[2], installed:inst.getTime(),
      warrantyEnd: r[3] === "myers-new" ? addDays(TODAY, 730).getTime() : addDays(inst, 730).getTime(), underWarranty: r[3] === "myers-new",
      ownership:r[3], status:r[4], location: r[4] === "in-workshop" || r[4] === "refurb" ? "Workshop, Mitchelstown" : r[5] ? cust[r[5]].town : "Depot, Mitchelstown",
      lastPM: addDays(TODAY, -Math.round(30 + R() * 200)).getTime(), plan: r[5] ? cust[r[5]].plan : null};
  });

  /* Jobs: the page's 9 open jobs, today's planned work, and a history of completed jobs. */
  const statusMap = {"Awaiting parts":"Awaiting parts", Travelling:"Travelling", Unassigned:"New", Scheduled:"Scheduled", "On site":"On site", "Remote diagnosis":"Remote"};
  const prioMap = {Urgent:"P1", High:"P2", Normal:"P3"};
  const jobs = [];
  const mkEv = (t, label, by, src) => ({t, label, by, src: src || "office"});
  P.JOBS.forEach(j => {
    const slot = j.slot, day = slot ? slot[0] : null;
    const tm = slot && /\d\d:\d\d/.exec(slot[1]); const start = tm ? tm[0] : null;
    jobs.push({id:j.id, cust:j.customer, machine:j.machine, fault:j.fault, prio:prioMap[j.prio], type: j.status === "Remote diagnosis" ? "Remote" : "Breakdown",
      status:statusMap[j.status] || j.status, eng:j.eng, day, start, dur: j.id === "JOB-2477" ? 120 : 90, source:j.source,
      billing: machines[j.machine] && machines[j.machine].underWarranty ? "warranty" : "chargeable", parts:j.parts.slice(), openedH:j.openedH,
      sla:j.sla, sheet:null, events: j.log.map(l => mkEv(l[0], l[2], l[1])).reverse(), invoice:null, claim:null});
  });
  const J = (o) => jobs.push(Object.assign({prio:"P4", type:"PM", status:"Scheduled", dur:90, source:"SLA Planner", billing:"contract", parts:[], openedH:48, sheet:null,
    events:[mkEv("Last week","Planned maintenance visit booked from SLA plan","SLA Planner","agent")], invoice:null, claim:null}, o));
  J({id:"JOB-2490", cust:"liffey", machine:"MC-0455", fault:"Planned maintenance, metal detector validation", eng:"eo", day:0, start:"11:00", dur:60, status:"Dispatched"});
  J({id:"JOB-2491", cust:"slaneroad", machine:"MC-0238", fault:"Planned maintenance, metal detector", eng:"eo", day:0, start:"06:15", dur:60, status:"Completed", sheet:"seeded"});
  J({id:"JOB-2493", cust:"blackwater", machine:"MC-0118", fault:"Annual service, thermoform packer", eng:"mk", day:1, start:"08:00", dur:180, parts:["PK-TF420-PM"]});
  J({id:"JOB-2494", cust:"leeroad", machine:"MC-0373", fault:"Planned maintenance, bread slicer", eng:"sm", day:0, start:"07:30", dur:75, status:"Completed", sheet:"seeded"});
  J({id:"JOB-2492", cust:"shannonside", machine:"MC-0657", fault:"Seal bar heating unevenly, film wrinkling on one edge", prio:"P2", type:"Breakdown", eng:"mk", day:0, start:"13:30", dur:90,
    status:"Dispatched", source:"Phone", billing:"warranty", parts:["PT-TS-SEAL"], sla:"Silver · under warranty",
    events:[mkEv("Today 07:40","Logged from phone call with Orla Quinlan, warranty flag set from the serial","Lara Costello"), mkEv("Today 07:52","Sent to Martin’s phone","Pulse","system")]});
  J({id:"JOB-2495", cust:"blackwater", machine:"MC-0122", fault:"Planned maintenance, cheese block cutter", eng:"mk", day:0, start:"08:00", dur:90, status:"In progress"});
  // Unscheduled PM visits the SLA Planner could not book (the page's 4).
  [["JOB-2496","suirside","MC-0206",1],["JOB-2497","knockmealdown","MC-0290",2],["JOB-2498","roaringwater","MC-0318",3],["JOB-2499","ballyduff","MC-0508",4]].forEach(r =>
    J({id:r[0], cust:r[1], machine:r[2], fault:"Planned maintenance due " + dayLabel(r[3]).toLowerCase(), eng:null, day:null, start:null, status:"New", dueDay:r[3],
      events:[mkEv("Today 06:00","Due within the SLA window, no slot booked yet","SLA Planner","agent")]}));
  // Completed history, last 20 working days, feeds time, invoices and asset history.
  const skuFor = (model) => { const c = Object.values(catalogue).filter(p => p.model === model); return (c.length ? c[Math.floor(R() * c.length)] : catalogue["PT-GEN-FUSE"]).sku; };
  const machIds = Object.keys(machines).filter(id => machines[id].ownership === "customer" && machines[id].status === "installed");
  const faults = ["Seal integrity failing on start-up","Reject arm slow to return","Blade wear, cut quality dropping","Vacuum level low on cycle","Film tracking off centre",
    "Label applicator missing on fast runs","Motor overload tripping","Touch screen unresponsive","Door interlock fault","Temperature controller drifting","Planned maintenance"];
  for (let i = 0; i < 44; i++){
    const mid = machIds[Math.floor(R() * machIds.length)], m = machines[mid], d = -(1 + Math.floor(R() * 20));
    const eng = ["sm","eo","mk"][Math.floor(R() * 3)], pm = i >= 11 && R() < .35, planned = pm ? 90 : 60 + Math.floor(R() * 4) * 30;
    const actual = Math.round(planned * (0.75 + R() * 0.8));
    jobs.push({id:"JOB-" + (2420 + i), cust:m.cust, machine:mid, fault: pm ? "Planned maintenance" : faults[Math.floor(R() * (faults.length - 1))], prio: pm ? "P4" : ["P1","P2","P3"][Math.floor(R() * 3)],
      type: pm ? "PM" : "Breakdown", status: i < 11 ? "Reviewed" : "Invoiced", eng, day:d, start: hm(7 * 60 + Math.floor(R() * 16) * 30), dur:planned, actual,
      source:["Phone","Email","Website","SLA Planner"][Math.floor(R() * 4)], billing: i < 11 ? "chargeable" : pm ? "contract" : m.underWarranty ? "warranty" : "chargeable", parts:[], openedH:0,
      sheet:"seeded", seedParts: pm ? [] : [skuFor(m.model)], events:[mkEv(dayLabel(d),"Completed and signed on the app", engById[eng].name, "app")], invoice:null, claim:null});
  }
  jobs.sort((a, b) => b.id.localeCompare(a.id));

  /* Requests waiting in the Service Desk. */
  const requests = [
    {id:"RQ-0612", channel:"Email", from:"Ciara Doyle <ciara@liffeyfresh.ie>", at:"08:52", subject:"Labeller on line 2 missing labels",
     body:"Hi, the Labelux print-and-apply on line 2 keeps missing labels when we run above 40 packs a minute. Plate says LB2-20-0480. We can slow the line for today but need someone tomorrow at the latest. Eoin is here today for the metal detector, could he look at it? Thanks, Ciara",
     extract:{cust:"liffey", machine:"MC-0457", fault:"Print-and-apply labeller missing labels above 40 packs a minute, line 2", prio:"P2", window:"Tomorrow at the latest"}, confidence:{cust:.98, machine:.97, fault:.9, prio:.8}},
    {id:"RQ-0613", channel:"Phone", from:"Rory Keating, Kilcoran Craft Bakery", at:"09:14", subject:"Voicemail transcript",
     body:"Rory here from Kilcoran. The divider in the bakery, the Brodmann one, is making a knocking noise, getting worse. It's still going but I don't want it to go mid-bake. Can someone look at it this week? 052 74 419.",
     extract:{cust:"kilcoran", machine:null, fault:"Knocking noise on dough divider, getting worse", prio:"P3", window:"This week"}, confidence:{cust:.95, machine:0, fault:.85, prio:.7}},
    {id:"RQ-0614", channel:"Website", from:"myers.ie service form", at:"09:31", subject:"Service request: Ardmore Bay Seafoods",
     body:"Machine: metal detector MD-40. Problem: fails the ferrous test piece at 1.5 mm about 1 in 5 times. Urgency: Production affected. Contact: Colm Prendergast 024 94 316.",
     extract:{cust:"ardmore", machine:"MC-0510", fault:"Fails 1.5 mm ferrous test intermittently", prio:"P1", window:"Today"}, confidence:{cust:1, machine:.97, fault:.95, prio:.9}},
    {id:"RQ-0615", channel:"Email", from:"Orla Quinlan <orla@shannonsidedairies.ie>", at:"09:40", subject:"Re: capping torque",
     body:"Hi Martin, just following up on the capping torque issue, is there any update on when you are coming? Orla",
     extract:{cust:"shannonside", machine:"MC-0655", fault:"Follow-up on open job", prio:"P3", window:""}, confidence:{cust:1, machine:.9, fault:.5, prio:.5}, duplicateOf:"JOB-2479"}
  ];

  /* Warranty claims across the pipeline. */
  const claimStages = ["Drafted","Submitted","Return requested","Part shipped","Assessed","Credited","Rejected"];
  const mfrs = ["Nordvak","Traymaster","Weighline","Brodmann","Ferrox","Fillwright","Labelux"];
  const claims = [];
  const CLAIM_V = [1480,920,2310,640,1175,1890,385,760,1320,540,2150,690,430,980,1265,820,1540,210];
  const cstage = ["Submitted","Submitted","Return requested","Return requested","Part shipped","Part shipped","Part shipped","Assessed","Assessed","Credited","Credited","Credited","Credited","Rejected","Submitted","Return requested","Credited","Drafted"];
  const warrantyMachines = Object.values(machines).filter(m => m.ownership === "customer");
  const skus = Object.keys(catalogue);
  cstage.forEach((st, i) => {
    const m = warrantyMachines[(i * 7 + 3) % warrantyMachines.length], sku = skus[(i * 5) % skus.length], part = catalogue[sku];
    const age = [72, 66, 64, 61, 70, 63, 12, 40, 22, 90, 55, 34, 18, 48, 9, 16, 30, 1][i];
    claims.push({id:"WC-" + String(300 + i).padStart(4, "0"), mfr: i < 7 ? mfrs[i] : mfrs[Math.floor(R() * mfrs.length)], machine:m.id, cust:m.cust, serial:m.serial,
      job:"JOB-" + (2380 + i), sku, part:part.name, value:CLAIM_V[i], labour: i % 3 === 0 ? 2 : 0, stage:st, age,
      returnTag: st === "Drafted" || st === "Submitted" ? null : "RT-" + (5100 + i), credit: st === "Credited" ? CLAIM_V[i] : 0,
      failure:["Element open circuit after 4 months","Bearing collapse, noise on run-up","Sensor output erratic","Seal failed within warranty","Board fault, no output on channel 2"][i % 5],
      outcome: st === "Rejected" ? "Rejected: damage consistent with wash-down ingress, not a manufacturing fault" : st === "Credited" ? "Credited in full" : "", history:[]});
  });
  // Tune outstanding value to the headline: 6 claims over 60 days.
  const quotes = [
    {id:"Q-1180", cust:"suirside", machine:"MC-0722", title:"Bowl cutter refurbishment, BC-120", status:"Awaiting approval", sent:3, valid:27, lines:[
      ["labour","Strip, inspect and rebuild bowl drive",14,78],["part","Bowl drive bearing set",1,420],["part","Knife head and blade set",1,690],["material","Food-safe paint and seals",1,145],["other","Collection and redelivery",1,160]]},
    {id:"Q-1181", cust:"leeroad", machine:"MC-0721", title:"Dough divider overhaul, DV-4", status:"Converted", job:"WS-112", sent:9, valid:21, approvedBy:"Eimear Lynch", po:"LRB-2291", lines:[
      ["labour","Overhaul divider head and drive",18,78],["part","Divider piston set",1,860],["part","Drive belt kit",1,120],["material","Seals and lubricant",1,95]]},
    {id:"Q-1182", cust:"kilcoran", machine:"MC-0723", title:"Portion slicer carriage rebuild", status:"Converted", job:"WS-114", sent:12, valid:18, approvedBy:"Rory Keating", po:"KCB-0417", lines:[
      ["labour","Carriage rebuild and calibration",9,84],["part","Carriage bearing kit",2,210],["part","Slide rail",1,340]]},
    {id:"Q-1183", cust:"mulcahy", machine:"MC-0613", title:"Burger former plate upgrade", status:"Awaiting approval", sent:6, valid:24, lines:[
      ["labour","Fit and set up new mould plate",4,92],["part","Mould plate, 110 mm",1,1180]]},
    {id:"Q-1184", cust:"atlantic", machine:"MC-0588", title:"Checkweigher load cell replacement", status:"Awaiting approval", sent:2, valid:28, lines:[
      ["labour","Replace and calibrate load cell",3,84],["part","Load cell, 6 kg",1,640],["other","Calibration certificate",1,90]]},
    {id:"Q-1185", cust:"corrib", machine:"MC-0699", title:"Vacuum packer lid and pump service", status:"Awaiting approval", sent:11, valid:19, lines:[
      ["labour","Pump service and lid rebuild",5,84],["part","Vacuum lid gasket",2,88],["part","Pump service kit",1,310]]},
    {id:"Q-1186", cust:"ballyduff", machine:"HR-0101", title:"Hire extension, TS-400, 3 months", status:"Awaiting approval", sent:1, valid:29, lines:[["other","Hire, 3 months at €1,450",3,1450]]},
    {id:"Q-1187", cust:"blackwater", machine:"MC-0122", title:"Cheese cutter wire frame upgrade", status:"Awaiting approval", sent:14, valid:16, lines:[
      ["labour","Fit upgraded frame",6,78],["part","Wire frame assembly",1,2380],["material","Cutting wire, 50 m",2,68]]},
    {id:"Q-1188", cust:"roaringwater", machine:"MC-0318", title:"Replacement VC-1 chamber lid", status:"Awaiting approval", sent:4, valid:26, lines:[
      ["labour","Fit lid and test",3,84],["part","Chamber lid assembly",1,3950]]},
    {id:"Q-1178", cust:"glenbeigh", machine:"MC-0540", title:"Labeller applicator upgrade", status:"Declined", sent:30, valid:0, lines:[["labour","Fit applicator",4,92],["part","Tamp applicator",1,1840]]},
    {id:"Q-1179", cust:"shannonside", machine:"MC-0657", title:"Tray sealer tooling change", status:"Approved", sent:20, valid:10, approvedBy:"Orla Quinlan", po:"SSD-1187", lines:[["labour","Tooling change",6,84],["part","Tool set",1,2900]]}
  ];

  /* Workshop jobs: 5 machines on site. */
  const wsStages = ["Booked in","Quoted","Awaiting approval","In progress","QC and test","Ready for collection"];
  const wsJobs = [
    {id:"WS-112", machine:"MC-0721", cust:"leeroad", arrived:-9, stage:"In progress", quote:"Q-1181", reason:"Divider weight inconsistent, head worn", required:4, bay:"Bay 2",
     work:[["Strip down and inspect",true],["Replace piston set",true],["Replace drive belts",false],["Rebuild head and seals",false],["Weight trials, 200 cycles",false]],
     labour:[["pn",-8,3.5],["kb",-8,2],["pn",-7,4],["kb",-6,3],["pn",-2,3.5]], parts:[["Divider piston set",1,860]], materials:[["Seals and lubricant",95]], photos:3, fixed:true},
    {id:"WS-113", machine:"MC-0722", cust:"suirside", arrived:-5, stage:"Awaiting approval", quote:"Q-1180", reason:"Bowl drive noisy, knife head chipped", required:10, bay:"Bay 3",
     work:[["Strip down and inspect",true],["Quote sent",true],["Rebuild bowl drive",false],["Knife head and blade set",false],["Paint and seals",false]],
     labour:[["kb",-5,3]], parts:[], materials:[], photos:6, fixed:true},
    {id:"WS-114", machine:"MC-0723", cust:"kilcoran", arrived:-12, stage:"QC and test", quote:"Q-1182", reason:"Carriage sticking, rail worn", required:1, bay:"Bay 1",
     work:[["Strip and inspect",true],["Replace bearing kit",true],["Replace slide rail",true],["Calibrate carriage",true],["Run-in test",false]],
     labour:[["pn",-11,4],["kb",-10,3],["pn",-9,3],["kb",-4,2.5],["pn",-3,2],["kb",-1,2]], parts:[["Carriage bearing kit",2,210],["Slide rail",1,340]], materials:[["Grease and fixings",38]], photos:5, fixed:false},
    {id:"WS-115", machine:"US-1301", cust:null, arrived:-20, stage:"In progress", quote:null, reason:"Used stock refurb for resale", required:14, bay:"Bay 4",
     work:[["Strip and inspect",true],["Replace pump",true],["New lid gaskets",false],["Repaint",false],["Test and certify",false]],
     labour:[["kb",-19,4],["kb",-15,3],["pn",-12,2],["kb",-6,4]], parts:[["Vacuum pump",1,1650],["Vacuum lid gasket",2,88]], materials:[["Paint",120]], photos:4, fixed:false, internal:true, budget:3200},
    {id:"WS-116", machine:"US-1304", cust:null, arrived:-2, stage:"Booked in", quote:null, reason:"Trade-in from Liffey Fresh, assess for resale", required:20, bay:"Yard",
     work:[["Clean and inspect",false],["Assessment report",false]], labour:[], parts:[], materials:[], photos:2, fixed:false, internal:true, budget:2400}
  ];

  /* Hire contracts. */
  const hire = [
    {id:"HC-041", asset:"HR-0101", cust:"ballyduff", start:-120, end:12, rate:1450, period:"month", note:"Extension quoted, Q-1186"},
    {id:"HC-042", asset:"HR-0102", cust:"atlantic", start:-40, end:3, rate:420, period:"week", note:"Off-hire inspection due"},
    {id:"HC-043", asset:"HR-0103", cust:"slaneroad", start:-15, end:2, rate:310, period:"week", note:"Covering MC-0233 fault"},
    {id:"HC-044", asset:"HR-0105", cust:"corrib", start:-70, end:40, rate:1100, period:"month", note:""},
    {id:"HC-045", asset:"HR-0106", cust:"liffey", start:-20, end:4, rate:290, period:"week", note:"Off-hire inspection due"},
    {id:"HC-046", asset:"HR-0108", cust:"leeroad", start:-9, end:30, rate:260, period:"week", note:"Loan while DV-4 in workshop"}
  ];

  /* Invoices already raised (history) plus the draft queue built from reviewed jobs. */
  const invoices = [];
  let invNo = 40880;
  jobs.filter(j => j.status === "Invoiced").forEach((j, i) => {
    invoices.push({id:"INV-" + (invNo++), cust:j.cust, source:j.id, kind:"job", status: i % 6 === 0 ? "Overdue" : i % 3 === 0 ? "Sent" : "Paid",
      total: j.billing === "warranty" ? 0 : j.billing === "contract" ? 0 : 180 + Math.round(R() * 900), day:j.day, lines:null, sync:"Synced"});
  });

  /* Time: today's geo events per engineer, generated from their jobs. Live actions append to these. */
  const geo = {};
  const addGeo = (id, t, type, label, src, job) => { (geo[id] = geo[id] || []).push({t, type, label, src: src || "geofence", job: job || null}); };
  addGeo("eo","05:31","day-start","Started day at home, Newbridge","app");
  addGeo("eo","06:10","arrive","Arrived Slane Road Kitchens, Navan","geofence","JOB-2491");
  addGeo("eo","06:14","job-start","Started JOB-2491","app","JOB-2491");
  addGeo("eo","07:22","job-end","Completed JOB-2491, signed by Aisling Reilly","app","JOB-2491");
  addGeo("eo","07:26","depart","Left Slane Road Kitchens","geofence");
  addGeo("eo","08:40","arrive","Arrived Liffey Fresh Foods, Naas","geofence","JOB-2477");
  addGeo("sm","06:58","day-start","Started day at home, Mitchelstown","app");
  addGeo("sm","07:24","arrive","Arrived Lee Road Bakehouse, Cork","geofence","JOB-2494");
  addGeo("sm","07:30","job-start","Started JOB-2494","app","JOB-2494");
  addGeo("sm","08:51","job-end","Completed JOB-2494, signed by Eimear Lynch","app","JOB-2494");
  addGeo("sm","08:55","depart","Left Lee Road Bakehouse","geofence");
  addGeo("sm","09:05","break","Break, 15 min","app");
  addGeo("sm","09:20","travel","Travelling to Atlantic Catch, Castletownbere","app","JOB-2486");
  addGeo("mk","07:34","day-start","Started day at home, Fermoy","app");
  addGeo("mk","07:52","arrive","Arrived Blackwater Valley Cheese, Fermoy","geofence","JOB-2495");
  addGeo("mk","08:02","job-start","Started JOB-2495","app","JOB-2495");
  addGeo("pw","08:31","day-start","Started day, Cork","app");
  addGeo("pw","09:40","arrive","Arrived Ardmore Bay Seafoods (sales visit)","geofence");
  addGeo("tm","08:02","day-start","Started day, Mitchelstown depot","app");

  // Weekly time history: per engineer per day [start, finish, travel h, on-site h, jobs, planned h].
  const week = {};
  ["sm","eo","mk"].forEach(id => {
    week[id] = [];
    for (let d = -5; d <= -1; d++){
      const e = engById[id], st = toMin(e.start) + Math.round((R() - .5) * 40) - (id === "eo" && R() < .5 ? 60 : 0);
      const travel = 1.6 + R() * 2.4, onsite = 4.2 + R() * 2.6, jobsN = 2 + Math.floor(R() * 3), planned = onsite * (0.8 + R() * 0.3);
      week[id].push({day:d, start:hm(st), end:hm(st + Math.round((travel + onsite + 0.5) * 60)), travel, onsite, jobs:jobsN, planned});
    }
  });

  const movements = [];
  let mvNo = 9100;
  const mv = (type, sku, qty, from, to, ref, by, when) => movements.push({id:"MV-" + (mvNo++), type, sku, qty, from, to, ref, by, when});
  mv("receive","PT-FC8-CH",4,"Fillwright","Warehouse","PO-3312","Stores","Mon 10:12");
  mv("transfer","PT-FC8-CH",2,"Warehouse","Van · Martin Keane","TR-221","Stores","Mon 15:40");
  mv("fit","PT-GEN-FUSE",1,"Van · Sean Murphy","JOB-2438","JOB-2438","Sean Murphy","Tue 11:08");
  mv("remove","PT-GEN-FUSE",1,"MC-0612","Scrap","JOB-2438","Sean Murphy","Tue 11:09");
  mv("fit","PT-VC-LID",1,"Van · Eoin O’Brien","JOB-2441","JOB-2441","Eoin O’Brien","Tue 14:52");
  mv("return","PT-LB-RL",1,"Van · Eoin O’Brien","Warehouse","RET-88","Eoin O’Brien","Wed 17:20");
  mv("receive","PK-VC2",2,"Nordvak","Warehouse","PO-3315","Stores","Wed 09:40");
  mv("remove","PT-HE600",1,"MC-0342","Held for inspection","JOB-2481","Sean Murphy","Yesterday 16:40");
  mv("fit","PT-TS-SEAL",1,"Van · Sean Murphy","JOB-2494","JOB-2494","Sean Murphy","Today 08:30");
  mv("fit","PT-MD-TP",0,"Van · Eoin O’Brien","JOB-2491","JOB-2491","Eoin O’Brien","Today 07:10");
  mv("ship","PT-CW-LC",1,"Returns shelf","Weighline","WC-0304","Stores","Yesterday 12:15");
  vans.sm["PT-TS-SEAL"] = 2;

  const pos = {sm:[52.02,-8.95], eo:TOWN.liffey, mk:TOWN.blackwater, pw:TOWN.ardmore, tm:[52.266,-8.268], pn:[52.266,-8.268], kb:[52.266,-8.268]};
  const status = {sm:"Travelling", eo:"On site", mk:"On site", pw:"Sales visit", tm:"At depot", pn:"Workshop", kb:"Workshop"};

  return {v:4, role:"coordinator", cust, engineers, catalogue, vans, vanMin, machines, jobs, requests, claims, claimStages, quotes, wsJobs, wsStages, hire,
    invoices, invNo, geo, week, movements, mvNo, pos, status, claimNo:318, quoteNo:1189, jobNo:2500, wsNo:117, poNo:3320, trNo:222,
    feed:[], proposals:null, tracking:{onDuty:{sm:true, eo:true, mk:true, pw:true, tm:true, pn:true, kb:true}, retention:90, trails:false, coarse:true, dpia:true,
      acks:{sm:"12 Sep", eo:"12 Sep", mk:"14 Sep", pw:"12 Sep", tm:"12 Sep", pn:"15 Sep", kb:"15 Sep"}},
    audit:[], field:{eng:"eo", screen:"day", job:null}, poDrafts:[]};
}

/* ---------- store ---------- */
const KEY = "myers-os-v4";
let S = null, listeners = new Set(), P = null;
function save(){ try { sessionStorage.setItem(KEY, JSON.stringify(S)); } catch(e){} }
function emit(){ save(); listeners.forEach(f => f()); }
MOS.init = function(pageData){
  P = pageData;
  if (S) return;
  try { const raw = sessionStorage.getItem(KEY); if (raw){ const x = JSON.parse(raw); if (x && x.v === 4) S = x; } } catch(e){}
  if (!S){ S = seed(P); ensureDerived(); }
};
MOS.get = () => S;
MOS.page = () => P;
MOS.subscribe = (f) => { listeners.add(f); return () => listeners.delete(f); };
MOS.reset = () => { S = seed(P); ensureDerived(); toast("Demo reset to the starting position", "info"); emit(); };
function set(mut){ mut(S); emit(); }
MOS.set = set;

/* toasts: the visible "ripple" of one entry flowing through the system */
let toasts = [], toastNo = 0; const toastL = new Set();
function toast(text, kind, sub){ const t = {id:++toastNo, text, kind: kind || "ok", sub: sub || ""}; toasts = toasts.concat([t]).slice(-5);
  toastL.forEach(f => f()); setTimeout(() => { toasts = toasts.filter(x => x.id !== t.id); toastL.forEach(f => f()); }, 5200 + toasts.length * 500); }
MOS.toast = toast; MOS.toasts = () => toasts; MOS.onToast = (f) => { toastL.add(f); return () => toastL.delete(f); };
function feed(text, kind, ref){ S.feed.unshift({t:hm(nowMin()), text, kind: kind || "office", ref: ref || null}); S.feed = S.feed.slice(0, 60); }
MOS.feed = feed;

/* ---------- derived / queries ---------- */
function ensureDerived(){
  // Draft invoices for reviewed jobs that have none yet.
  S.jobs.filter(j => j.status === "Reviewed" && !j.invoice).forEach(j => draftInvoiceFor(j, true));
}
const Q = MOS.q = {
  cust: (id) => S.cust[id], eng: (id) => S.engineers.find(e => e.id === id), mach: (id) => S.machines[id], part: (sku) => S.catalogue[sku],
  job: (id) => S.jobs.find(j => j.id === id), quote: (id) => S.quotes.find(q => q.id === id), claim: (id) => S.claims.find(c => c.id === id),
  inv: (id) => S.invoices.find(i => i.id === id), ws: (id) => S.wsJobs.find(w => w.id === id),
  field: () => S.engineers.filter(e => e.kind === "field"),
  openJobs: () => S.jobs.filter(j => ["New","Scheduled","Dispatched","Travelling","On site","In progress","Awaiting parts","Remote"].indexOf(j.status) > -1),
  unassigned: () => S.jobs.filter(j => j.status === "New"),
  dayJobs: (day, eng) => S.jobs.filter(j => j.day === day && (!eng || j.eng === eng) && j.start).sort((a, b) => toMin(a.start) - toMin(b.start)),
  vanQty: (eng, sku) => (S.vans[eng] || {})[sku] || 0,
  vanOwner: (sku) => Object.keys(S.vans).filter(e => (S.vans[e][sku] || 0) > 0),
  totalStock: (sku) => S.catalogue[sku].wh + Object.keys(S.vans).reduce((n, e) => n + (S.vans[e][sku] || 0), 0),
  lowWh: () => Object.values(S.catalogue).filter(p => p.wh < p.min),
  lowVan: () => { const out = []; Object.keys(S.vanMin).forEach(e => Object.keys(S.vanMin[e]).forEach(sku => { const q = Q.vanQty(e, sku); if (q < S.vanMin[e][sku]) out.push({eng:e, sku, qty:q, min:S.vanMin[e][sku]}); })); return out; },
  stockValue: () => { let wh = 0, van = 0; Object.values(S.catalogue).forEach(p => { wh += p.wh * p.cost; Object.keys(S.vans).forEach(e => van += (S.vans[e][p.sku] || 0) * p.cost); }); return {wh, van}; },
  readyToInvoice: () => S.invoices.filter(i => i.status === "Draft"),
  quoteTotal: (q) => q.lines.reduce((n, l) => n + l[2] * l[3], 0),
  claimsOpen: () => S.claims.filter(c => ["Credited","Rejected"].indexOf(c.stage) < 0),
  wsCost: (w) => {
    const lab = w.labour.reduce((n, l) => n + l[2], 0) * 78, parts = w.parts.reduce((n, p) => n + p[1] * p[2], 0), mat = w.materials.reduce((n, m) => n + m[1], 0);
    const q = w.quote ? Q.quote(w.quote) : null, budget = q ? Q.quoteTotal(q) : (w.budget || 0);
    return {hours: w.labour.reduce((n, l) => n + l[2], 0), lab, parts, mat, total: lab + parts + mat, budget, pct: budget ? (lab + parts + mat) / budget : 0};
  },
  where: (id) => S.pos[id],
  site: (j) => S.cust[j.cust].pos
};

/* Planned route for an engineer on a day: travel legs between home and each job. */
MOS.route = function(eng, day){
  const e = Q.eng(eng), js = Q.dayJobs(day, eng).filter(j => j.status !== "Remote");
  let at = e.pos, prevEnd = toMin(e.start); const legs = [];
  js.forEach(j => {
    const to = S.cust[j.cust].pos, d = drive(at, to), st = toMin(j.start);
    legs.push({kind:"travel", from: Math.max(prevEnd, st - d), to: st, mins:d, job:j.id});
    legs.push({kind:"job", from: st, to: st + (j.actual || j.dur), job:j.id});
    at = to; prevEnd = st + (j.actual || j.dur);
  });
  if (js.length){ const d = drive(at, e.pos); legs.push({kind:"home", from: prevEnd, to: prevEnd + d, mins:d}); }
  return legs;
};
MOS.utilisation = function(eng, day){
  const e = Q.eng(eng), avail = toMin(e.end) - toMin(e.start);
  const legs = MOS.route(eng, day); const busy = legs.filter(l => l.kind === "job").reduce((n, l) => n + (l.to - l.from), 0);
  const travel = legs.filter(l => l.kind !== "job").reduce((n, l) => n + l.mins, 0);
  return {avail, busy, travel, pct: avail ? (busy + travel) / avail : 0, onsitePct: avail ? busy / avail : 0};
};

/* ---------- auto-plan: score every unassigned job against every engineer ---------- */
const PRIO_W = {P1:0, P2:1, P3:2, P4:3};
MOS.autoPlan = function(day){
  const pending = Q.unassigned().slice().sort((a, b) => PRIO_W[a.prio] - PRIO_W[b.prio]);
  const sim = {}; Q.field().forEach(e => sim[e.id] = Q.dayJobs(day, e.id).map(j => ({start:toMin(j.start), end:toMin(j.start) + j.dur, pos:S.cust[j.cust].pos})));
  const out = [];
  pending.forEach(j => {
    const m = S.machines[j.machine], site = S.cust[j.cust].pos;
    let best = null;
    Q.field().forEach(e => {
      const slots = sim[e.id].slice().sort((a, b) => a.start - b.start);
      // Today, nothing can start in the past: earliest is 30 minutes from now.
      const dayStart = day === 0 ? Math.max(toMin(e.start), nowMin() + 30) : toMin(e.start), dayEnd = toMin(e.end);
      // try inserting into every gap, keep the cheapest
      const done = slots.filter(x => x.end <= dayStart), live = slots.filter(x => x.end > dayStart);
      const startPos = done.length ? done[done.length - 1].pos : e.pos;
      const bounds = [{end:dayStart, pos:startPos}].concat(live);
      for (let i = 0; i < bounds.length; i++){
        const prev = bounds[i], next = live[i] || null;
        const tIn = drive(prev.pos, site), st = Math.ceil((prev.end + tIn) / 15) * 15, en = st + j.dur;
        const tOut = next ? drive(site, next.pos) : drive(site, e.pos);
        if (tIn > 120) continue;                  // never send anyone more than 2h for one job
        if (next && en + tOut > next.start) continue;
        if (!next && en + tOut > dayEnd + 30) continue;
        const brand = e.brands.indexOf(m.mfr) > -1, inVan = j.parts.length ? j.parts.every(sku => Q.vanQty(e.id, sku) > 0) : true;
        const cluster = slots.some(s => MOS.geo.km(s.pos, site) < 35);
        const late = j.prio === "P1" ? Math.max(0, st - nowMin() - 300) : 0;
        const score = tIn + (brand ? 0 : 90) + (inVan ? 0 : 60) - (cluster ? 25 : 0) + late * 2 + (st - dayStart) * 0.05;
        if (!best || score < best.score){
          const reasons = [];
          reasons.push((i === 0 ? "From home, " : "From previous stop, ") + dur(tIn));
          if (cluster) reasons.push("Grouped with nearby job");
          reasons.push(brand ? m.mfr + " trained" : "Not " + m.mfr + " trained");
          if (j.parts.length) reasons.push(inVan ? "Part in van" : "Part from warehouse");
          if (j.prio === "P1") reasons.push("Inside SLA window");
          best = {job:j.id, eng:e.id, start:hm(st), end:hm(en), travel:tIn, score, reasons, idx:i, pos:site, st, en};
        }
      }
    });
    if (best){ sim[best.eng].push({start:best.st, end:best.en, pos:site}); out.push(best); }
    else out.push({job:j.id, eng:null, reasons:["No engineer has room on " + dayLabel(day).toLowerCase()]});
  });
  return out;
};

/* ---------- actions ---------- */
const A = MOS.act = {};
A.role = (r) => set(s => { s.role = r; });

A.createJob = (reqId, form) => set(s => {
  const r = s.requests.find(x => x.id === reqId);
  const id = "JOB-" + (s.jobNo++);
  const m = s.machines[form.machine];
  const j = {id, cust:form.cust, machine:form.machine, fault:form.fault, prio:form.prio, type: form.prio === "P4" ? "PM" : "Breakdown", status:"New", eng:null, day:null, start:null,
    dur: form.prio === "P1" ? 90 : 75, source: r ? r.channel : "Phone", billing: m && m.underWarranty ? "warranty" : "chargeable",
    parts: form.parts || [], openedH:0, sla: slaText(s.cust[form.cust].plan), sheet:null, invoice:null, claim:null,
    events:[{t:"Today " + hm(nowMin()), label:"Job created from " + (r ? r.channel.toLowerCase() + " " + r.id : "phone call") + ", nothing retyped", by:"Lara Costello", src:"office"}]};
  s.jobs.unshift(j);
  if (r) r.done = id;
  feed(id + " created for " + s.cust[form.cust].name + " from " + (r ? r.channel.toLowerCase() : "a call"), "office", id);
  toast(id + " created", "ok", "Customer, machine, warranty and SLA carried from the request. Waiting in Dispatch.");
});
A.mergeRequest = (reqId, jobId) => set(s => {
  const r = s.requests.find(x => x.id === reqId); r.done = jobId;
  const j = s.jobs.find(x => x.id === jobId); j.events.push({t:"Today " + hm(nowMin()), label:"Customer chased by email, linked to this job", by:"Lara Costello", src:"office"});
  toast("Linked to " + jobId, "ok", "No duplicate job. Orla gets the booked time automatically.");
});
function slaText(plan){ return plan === "gold" ? "Gold · 8h on-site" : plan === "silver" ? "Silver · next working day" : "Standard · 2 working days"; }

A.plan = (day) => set(s => { s.proposals = {day, rows:MOS.autoPlan(day), hash:null}; s.proposals.hash = hash(s.proposals.rows.map(r => [r.job, r.eng, r.start])); });
A.dropProposal = (jobId) => set(s => { if (s.proposals) s.proposals.rows = s.proposals.rows.filter(r => r.job !== jobId); });
A.clearPlan = () => set(s => { s.proposals = null; });
A.acceptPlan = () => set(s => {
  const p = s.proposals; if (!p) return;
  let n = 0;
  p.rows.filter(r => r.eng).forEach(r => {
    const j = s.jobs.find(x => x.id === r.job); j.eng = r.eng; j.day = p.day; j.start = r.start; j.status = "Scheduled"; n++;
    j.events.push({t:"Today " + hm(nowMin()), label:"Scheduled for " + Q.eng(r.eng).name + ", " + dayLabel(p.day).toLowerCase() + " " + r.start + " (" + r.reasons.join(", ").toLowerCase() + ")", by:"Tom Myers, confirmed plan " + p.hash, src:"office"});
  });
  s.audit.unshift({t:hm(nowMin()), tool:"dispatch.plan_day", hash:p.hash, by:"Tom Myers", summary:n + " jobs scheduled"});
  feed(n + " jobs scheduled from the auto-plan", "office");
  toast(n + " jobs scheduled", "ok", "Plan " + p.hash + " confirmed. Send to phones when ready.");
  s.proposals = null;
});
A.assign = (jobId, eng, day, start) => set(s => {
  const j = s.jobs.find(x => x.id === jobId); j.eng = eng; j.day = day; j.start = start; j.status = "Scheduled";
  j.events.push({t:"Today " + hm(nowMin()), label:"Scheduled for " + Q.eng(eng).name + " " + dayLabel(day).toLowerCase() + " " + start, by:"Lara Costello", src:"office"});
  toast(jobId + " → " + Q.eng(eng).name, "ok", dayLabel(day) + " " + start);
});
A.unassign = (jobId) => set(s => { const j = s.jobs.find(x => x.id === jobId); j.eng = null; j.day = null; j.start = null; j.status = "New"; });
A.dispatch = (day) => set(s => {
  const js = s.jobs.filter(j => j.day === day && j.status === "Scheduled" && j.eng);
  const byEng = {};
  js.forEach(j => { j.status = "Dispatched"; byEng[j.eng] = (byEng[j.eng] || 0) + 1;
    j.events.push({t:"Today " + hm(nowMin()), label:"Sent to " + Q.eng(j.eng).name.split(" ")[0] + "’s phone with customer, machine, history and manual", by:"Pulse", src:"system"}); });
  Object.keys(byEng).forEach(e => feed(byEng[e] + " job" + (byEng[e] > 1 ? "s" : "") + " sent to " + Q.eng(e).name + "’s phone", "system"));
  toast(js.length + " job sheets sent to phones", "ok", "No WhatsApp. Each engineer gets the full job, not a message.");
});

/* field app actions */
function geoAdd(eng, type, label, src, job){ (S.geo[eng] = S.geo[eng] || []).push({t:hm(nowMin()), type, label, src: src || "app", job: job || null}); }
A.fieldEng = (e) => set(s => { s.field = {eng:e, screen:"day", job:null}; });
A.fieldGo = (screen, job) => set(s => { s.field.screen = screen; if (job !== undefined) s.field.job = job; });
A.startDay = (eng) => set(s => {
  s.tracking.onDuty[eng] = true; geoAdd(eng, "day-start", "Started day at home, " + Q.eng(eng).home, "app");
  s.status[eng] = "Starting"; feed(Q.eng(eng).name + " started the day", "field");
  toast("Day started " + hm(nowMin()), "ok", "Start time and location recorded. Tracking on while on duty only.");
});
A.returnToStock = (eng, sku) => set(s => { if (!Q.vanQty(eng, sku)) return; s.vans[eng][sku] -= 1; s.catalogue[sku].wh += 1;
  s.movements.unshift({id:"MV-" + (s.mvNo++), type:"return", sku, qty:1, from:"Van · " + Q.eng(eng).name, to:"Warehouse", ref:"RET-" + (90 + s.mvNo % 100), by:Q.eng(eng).name, when:"Today " + hm(nowMin())});
  toast(sku + " returned to the warehouse", "ok", "From " + Q.eng(eng).name.split(" ")[0] + "’s van"); });
A.endDay = (eng) => set(s => { geoAdd(eng, "day-end", "Finished day, home", "app"); s.status[eng] = "Off duty"; s.tracking.onDuty[eng] = false;
  feed(Q.eng(eng).name + " finished the day. Tracking off.", "field"); toast("Day finished", "ok", "Tracking stopped. Timesheet ready for review."); });
A.privateMode = (eng, on) => set(s => { s.tracking.onDuty[eng] = !on; geoAdd(eng, on ? "private" : "resume", on ? "Private time, location paused" : "Back on duty", "app");
  s.status[eng] = on ? "Private" : "On duty"; toast(on ? "Location paused" : "Back on duty", "info", on ? "Nothing recorded until back on duty." : ""); });
A.travel = (eng, jobId) => set(s => { const j = s.jobs.find(x => x.id === jobId);
  const last = (s.geo[eng] || []).slice(-1)[0];
  if (last && (last.type === "job-end" || last.type === "arrive")){ const site = Object.values(s.cust).find(c => last.label.indexOf(c.name) > -1); geoAdd(eng, "depart", "Left " + (site ? site.name : "site"), "geofence"); }
  j.status = "Travelling"; s.status[eng] = "Travelling";
  const eta = hm(nowMin() + drive(s.pos[eng], s.cust[j.cust].pos));
  toast("ETA " + eta + " texted to " + s.cust[j.cust].contact[0], "ok", "Sent automatically when the engineer sets off.");
  geoAdd(eng, "travel", "Travelling to " + s.cust[j.cust].name, "app", jobId);
  j.events.push({t:"Today " + hm(nowMin()), label:"On the way, ETA " + hm(nowMin() + drive(s.pos[eng], s.cust[j.cust].pos)), by:Q.eng(eng).name, src:"app"});
  feed(Q.eng(eng).name + " on the way to " + s.cust[j.cust].name, "field", jobId); });
A.arrive = (eng, jobId) => set(s => { const j = s.jobs.find(x => x.id === jobId); j.status = "On site"; s.status[eng] = "On site"; s.pos[eng] = s.cust[j.cust].pos;
  geoAdd(eng, "arrive", "Arrived " + s.cust[j.cust].name + ", " + s.cust[j.cust].town.split(",")[0], "geofence", jobId);
  j.events.push({t:"Today " + hm(nowMin()), label:"Arrived on site (geofence)", by:Q.eng(eng).name, src:"geofence"});
  feed(Q.eng(eng).name + " arrived at " + s.cust[j.cust].name + " (geofence)", "field", jobId);
  toast("Arrival recorded " + hm(nowMin()), "ok", "Geofence at " + s.cust[j.cust].name + ". Customer notified."); });
A.startJob = (eng, jobId) => set(s => { const j = s.jobs.find(x => x.id === jobId); j.status = "In progress"; j.startedAt = hm(nowMin());
  if (!j.sheet || j.sheet === "seeded") j.sheet = {diag:"", work:"", fitted:[], removed:[], notes:"", photos:[], sig:null, signedBy:"", followUp:false, followReason:"", email:true};
  geoAdd(eng, "job-start", "Started " + jobId, "app", jobId);
  j.events.push({t:"Today " + hm(nowMin()), label:"Job started", by:Q.eng(eng).name, src:"app"}); feed(Q.eng(eng).name + " started " + jobId, "field", jobId); });
A.sheet = (jobId, patch) => set(s => { const j = s.jobs.find(x => x.id === jobId); Object.assign(j.sheet, patch); });
A.fit = (eng, jobId, sku) => set(s => { const j = s.jobs.find(x => x.id === jobId); const inVan = Q.vanQty(eng, sku) > 0;
  j.sheet.fitted.push({sku, qty:1, from: inVan ? "van" : "warehouse"}); });
A.unfit = (jobId, i) => set(s => { const j = s.jobs.find(x => x.id === jobId); j.sheet.fitted.splice(i, 1); });
A.removed = (jobId, sku, cond) => set(s => { const j = s.jobs.find(x => x.id === jobId); j.sheet.removed.push({sku, cond}); });
A.unremove = (jobId, i) => set(s => { const j = s.jobs.find(x => x.id === jobId); j.sheet.removed.splice(i, 1); });
A.photo = (jobId, label) => set(s => { const j = s.jobs.find(x => x.id === jobId); j.sheet.photos.push({label, t:hm(nowMin()), hue: 180 + j.sheet.photos.length * 37}); });
A.billing = (jobId, b) => set(s => { const j = s.jobs.find(x => x.id === jobId); j.billing = b; });

/* The key moment: one completed job sheet updates everything downstream. */
A.complete = (eng, jobId) => set(s => {
  const j = s.jobs.find(x => x.id === jobId), e = Q.eng(eng), c = s.cust[j.cust], m = s.machines[j.machine];
  const t = hm(nowMin());
  j.status = "Completed"; j.completedAt = t;
  j.actual = j.startedAt ? Math.max(20, nowMin() - toMin(j.startedAt)) : j.dur;
  geoAdd(eng, "job-end", "Completed " + jobId + ", signed by " + (j.sheet.signedBy || c.contact[0]), "app", jobId);
  j.events.push({t:"Today " + t, label:"Completed and signed by " + (j.sheet.signedBy || c.contact[0]) + " on the phone", by:e.name, src:"app"});
  const ripple = [];
  // 1. parts: van stock down, movement ledger, warehouse pick for anything not in the van
  j.sheet.fitted.forEach(f => {
    if (f.from === "van" && Q.vanQty(eng, f.sku) > 0){ s.vans[eng][f.sku] -= 1; }
    else { s.catalogue[f.sku].wh = Math.max(0, s.catalogue[f.sku].wh - 1); }
    s.movements.unshift({id:"MV-" + (s.mvNo++), type:"fit", sku:f.sku, qty:1, from: f.from === "van" ? "Van · " + e.name : "Warehouse", to:jobId, ref:jobId, by:e.name, when:"Today " + t});
    ripple.push(f.sku + " fitted from " + (f.from === "van" ? e.name.split(" ")[0] + "’s van" : "warehouse"));
  });
  j.sheet.removed.forEach(r => {
    s.movements.unshift({id:"MV-" + (s.mvNo++), type:"remove", sku:r.sku, qty:1, from:j.machine, to: r.cond === "warranty" ? "Warranty return" : r.cond === "refurb" ? "Returns shelf" : "Scrap", ref:jobId, by:e.name, when:"Today " + t});
  });
  // van replenishment suggestion
  j.sheet.fitted.forEach(f => { const mn = (s.vanMin[eng] || {})[f.sku]; if (mn && Q.vanQty(eng, f.sku) < mn) ripple.push(e.name.split(" ")[0] + "’s van below minimum on " + f.sku + ", top-up proposed to stores"); });
  // 2. warranty claim, automatically, when a part is fitted on a warranty job
  if (j.billing === "warranty" && j.sheet.fitted.length){
    const f = j.sheet.fitted[0], p = s.catalogue[f.sku], rem = j.sheet.removed.find(r => r.cond === "warranty");
    const id = "WC-" + String(s.claimNo++).padStart(4, "0");
    s.claims.unshift({id, mfr:m.mfr, machine:m.id, cust:j.cust, serial:m.serial, job:jobId, sku:f.sku, part:p.name, value: p.cost + Math.round((Math.max(j.actual, 60) / 60) * 62), labour: +(Math.max(j.actual, 60) / 60).toFixed(1),
      stage:"Drafted", age:0, returnTag: rem ? "RT-" + (5200 + s.claimNo) : null, credit:0, failure: j.sheet.diag || j.fault, outcome:"", photos:j.sheet.photos.length, live:true,
      history:[{t:"Today " + t, label:"Drafted automatically from " + jobId + ": serial, install date, fault, part, photos and labour"}]});
    j.claim = id;
    ripple.push("Warranty claim " + id + " drafted to " + m.mfr);
    feed("Warranty claim " + id + " drafted to " + m.mfr + " from " + jobId, "system", id);
  }
  // 3. follow-up job
  if (j.sheet.followUp){
    const fid = "JOB-" + (s.jobNo++);
    s.jobs.unshift({id:fid, cust:j.cust, machine:j.machine, fault:"Follow-up: " + (j.sheet.followReason || "return visit"), prio:"P3", type:"Follow-up", status:"New", eng:null, day:null, start:null, dur:60,
      source:"Engineer app", billing:j.billing, parts:[], openedH:0, sla:slaText(c.plan), sheet:null, invoice:null, claim:null, followOf:jobId,
      events:[{t:"Today " + t, label:"Follow-up raised by " + e.name + " on " + jobId, by:e.name, src:"app"}]});
    ripple.push("Follow-up " + fid + " waiting in Dispatch");
  }
  // 4. invoice drafted from the sheet, waiting for a quick office review
  const invId = draftInvoiceFor(j, true); const inv = s.invoices.find(x => x.id === invId);
  ripple.push("Invoice " + invId + " drafted, " + eur2(inv.total) + " net" + (j.billing === "warranty" ? " (warranty, €0 parts and labour)" : ""));
  feed("Invoice " + invId + " drafted from " + jobId + ": " + eur2(inv.total), "system", invId);
  // 5. machine history + service record
  m.lastService = TODAY.getTime();
  s.status[eng] = "Completed job";
  feed(e.name + " completed " + jobId + " at " + c.name + ", signed by " + (j.sheet.signedBy || c.contact[0]), "field", jobId);
  feed(jobId + " job sheet received in the office with signature and " + j.sheet.photos.length + " photos", "system", jobId);
  ripple.push("Machine history for " + m.serial + " updated");
  toast(jobId + " completed on site", "ok", "Job sheet, signature and photos are in the office at " + t + ".");
  setTimeout(() => ripple.forEach((r, i) => setTimeout(() => toast(r, "flow"), i * 650)), 400);
});

/* office review: completed → reviewed, invoice drafted from the job sheet */
function draftInvoiceFor(j, quiet){
  const c = S.cust[j.cust], lines = [];
  const hrs = Math.max(0.5, Math.ceil(((j.actual || j.dur) / 60) * 4) / 4);
  const miles = Math.round(MOS.geo.km(BASE_POS(j), c.pos) * 1.3);
  if (j.billing === "warranty"){
    lines.push(["Labour, " + hrs + " h (warranty, claimed from manufacturer)", hrs, 0]);
    (j.sheet && j.sheet.fitted || []).forEach(f => lines.push([f.sku + " " + S.catalogue[f.sku].name + " (warranty)", 1, 0]));
    lines.push(["Travel, " + miles + " km", miles, c.rates.travel]);
  } else if (j.billing === "contract"){
    lines.push(["Planned maintenance visit, " + (c.plan ? c.plan.charAt(0).toUpperCase() + c.plan.slice(1) : "") + " service plan", 1, 0]);
    (j.sheet && j.sheet.fitted || []).forEach(f => lines.push([f.sku + " " + S.catalogue[f.sku].name, 1, S.catalogue[f.sku].sell]));
  } else {
    if (c.rates.callout) lines.push(["Call-out", 1, c.rates.callout]);
    lines.push(["Labour, " + hrs + " h at " + eur(c.rates.labour) + "/h", hrs, c.rates.labour]);
    lines.push(["Travel, " + miles + " km", miles, c.rates.travel]);
    const fitted = j.sheet && j.sheet.fitted && j.sheet.fitted.length ? j.sheet.fitted.map(f => f.sku) : (j.sheet === "seeded" ? (j.seedParts || []) : j.parts);
    fitted.forEach(sku => S.catalogue[sku] && lines.push([sku + " " + S.catalogue[sku].name, 1, S.catalogue[sku].sell]));
  }
  const total = lines.reduce((n, l) => n + l[1] * l[2], 0);
  const id = "INV-" + (S.invNo++);
  S.invoices.unshift({id, cust:j.cust, source:j.id, kind:"job", status:"Draft", total, lines, day:0, sync:"Not synced", po: j.cust === "liffey" ? "LFF-7731" : null,
    flags: j.billing === "warranty" ? ["Warranty: parts and labour at €0 to customer"] : c.plan === "gold" && !j.po ? [] : []});
  j.invoice = id;
  if (!quiet){ feed("Invoice " + id + " drafted from " + j.id + ": " + eur2(total), "system", id); }
  return id;
}
const BASE_POS = (j) => j.eng ? (Q.eng(j.eng) || {pos:[52.266,-8.268]}).pos : [52.266,-8.268];
A.review = (jobId) => set(s => {
  const j = s.jobs.find(x => x.id === jobId); j.status = "Reviewed";
  j.events.push({t:"Today " + hm(nowMin()), label:"Reviewed by Lara Costello", by:"Lara Costello", src:"office"});
  const id = j.invoice || draftInvoiceFor(j);
  toast(j.id + " reviewed, " + id + " ready to send", "ok", "Lines built from the job sheet, time on site and contract rates. No retyping.");
});
A.sendInvoices = (ids) => set(s => {
  const h = hash(ids);
  ids.forEach(id => { const i = s.invoices.find(x => x.id === id); i.status = "Sent"; i.sync = "Synced to Xero"; i.sentAt = hm(nowMin());
    const j = s.jobs.find(x => x.id === i.source); if (j){ j.status = "Invoiced"; j.events.push({t:"Today " + hm(nowMin()), label:"Invoiced " + id + ", emailed with signed job sheet", by:"Accounts", src:"office"}); } });
  s.audit.unshift({t:hm(nowMin()), tool:"invoice.approve_and_send", hash:h, by:"Tom Myers", summary:ids.length + " invoices sent"});
  feed(ids.length + " invoice" + (ids.length > 1 ? "s" : "") + " sent with signed job sheets and synced to Xero", "office");
  toast(ids.length + " invoice" + (ids.length > 1 ? "s" : "") + " sent", "ok", "Emailed with the signed job sheet PDF. Synced to Xero.");
});
A.markPaid = (id) => set(s => { const i = s.invoices.find(x => x.id === id); i.status = "Paid"; });

/* warranty */
const NEXT = {Drafted:"Submitted", Submitted:"Return requested", "Return requested":"Part shipped", "Part shipped":"Assessed", Assessed:"Credited"};
A.advanceClaim = (id, to) => set(s => {
  const c = s.claims.find(x => x.id === id); const nxt = to || NEXT[c.stage]; if (!nxt) return;
  c.stage = nxt; c.history = c.history || [];
  const lbl = {Submitted:"Submitted to " + c.mfr + " with serial, photos and job sheet", "Return requested":c.mfr + " asked for the faulty part back",
    "Part shipped":"Faulty part shipped, tag " + (c.returnTag || ("RT-" + (5300 + s.claimNo))), Assessed:c.mfr + " assessed the part: manufacturing fault",
    Credited:"Credit note received, " + eur(c.value) + ". Replacement part booked into stock", Rejected:"Rejected by " + c.mfr}[nxt];
  if (nxt === "Part shipped" && !c.returnTag) c.returnTag = "RT-" + (5300 + s.claimNo++);
  if (nxt === "Credited"){ c.credit = c.value; c.outcome = "Credited in full"; s.catalogue[c.sku].wh += 1;
    s.movements.unshift({id:"MV-" + (s.mvNo++), type:"receive", sku:c.sku, qty:1, from:c.mfr + " (warranty replacement)", to:"Warehouse", ref:c.id, by:"Stores", when:"Today " + hm(nowMin())}); }
  if (nxt === "Rejected"){ c.outcome = "Rejected: rebill customer or goodwill"; }
  c.history.push({t:"Today " + hm(nowMin()), label:lbl});
  if (nxt === "Submitted") s.audit.unshift({t:hm(nowMin()), tool:"warranty.submit_claim", hash:hash([c.id, c.serial, c.value]), by:"Tom Myers", summary:c.id + " to " + c.mfr});
  feed(c.id + ": " + lbl, "system", c.id);
  toast(c.id + " → " + nxt, nxt === "Rejected" ? "warn" : "ok", lbl);
});

/* parts */
A.transfer = (eng, sku, qty) => set(s => {
  const p = s.catalogue[sku]; const n = Math.min(qty, p.wh); if (n <= 0){ toast("No warehouse stock for " + sku, "warn"); return; }
  p.wh -= n; s.vans[eng][sku] = (s.vans[eng][sku] || 0) + n;
  const tr = "TR-" + (s.trNo++);
  s.movements.unshift({id:"MV-" + (s.mvNo++), type:"transfer", sku, qty:n, from:"Warehouse", to:"Van · " + Q.eng(eng).name, ref:tr, by:"Stores", when:"Today " + hm(nowMin())});
  feed(n + " × " + sku + " moved to " + Q.eng(eng).name + "’s van (" + tr + ")", "office");
  toast(tr + ": " + n + " × " + sku + " to " + Q.eng(eng).name.split(" ")[0] + "’s van", "ok", "Pick list printed for the stores bench.");
});
A.replenishAll = () => set(s => {
  let n = 0;
  Q.lowVan().forEach(l => { const need = l.min - l.qty + 1, p = s.catalogue[l.sku], q = Math.min(need, p.wh); if (q > 0){ p.wh -= q; s.vans[l.eng][l.sku] = (s.vans[l.eng][l.sku] || 0) + q; n += q;
    s.movements.unshift({id:"MV-" + (s.mvNo++), type:"transfer", sku:l.sku, qty:q, from:"Warehouse", to:"Van · " + Q.eng(l.eng).name, ref:"TR-" + (s.trNo++), by:"Stores", when:"Today " + hm(nowMin())}); } });
  toast(n + " parts moved to vans", "ok", "One pick list per van.");
});
A.raisePO = (skus) => set(s => {
  const po = "PO-" + (s.poNo++);
  skus.forEach(sku => { const p = s.catalogue[sku]; p.onOrder = (p.onOrder || 0) + Math.max(p.min * 2 - p.wh, 1); p.eta = "3 working days"; p.po = po; });
  s.audit.unshift({t:hm(nowMin()), tool:"purchasing.raise_po", hash:hash(skus), by:"Tom Myers", summary:po + ", " + skus.length + " lines"});
  feed(po + " raised for " + skus.length + " low-stock lines", "office");
  toast(po + " raised", "ok", skus.length + " lines, grouped by supplier.");
});

/* quotes */
A.quoteStatus = (id, status, extra) => set(s => {
  const q = s.quotes.find(x => x.id === id); q.status = status; Object.assign(q, extra || {});
  if (status === "Sent" || status === "Awaiting approval"){ q.sent = 0; q.valid = 30; }
  const w = s.wsJobs.find(x => x.quote === id);
  if (status === "Approved" && w){ q.status = "Converted"; q.job = w.id; if (w.stage === "Awaiting approval") w.stage = "In progress";
    toast(id + " approved, " + w.id + " released to the bench", "ok", "PO " + (q.po || "to follow") + ". Quoted lines are the budget for the job."); feed(id + " approved, " + w.id + " in progress", "workshop", w.id); return; }
  toast(id + ": " + status, "ok", status === "Approved" ? "Approved by " + (q.approvedBy || "customer") + ", PO " + (q.po || "to follow") : "");
  feed(id + " " + status.toLowerCase(), "office", id);
});
A.newQuote = (q) => set(s => { const id = "Q-" + (s.quoteNo++); s.quotes.unshift(Object.assign({id, status:"Draft", sent:null, valid:30}, q)); toast(id + " saved as draft", "ok"); });
A.convertQuote = (id) => set(s => {
  const q = s.quotes.find(x => x.id === id); const m = s.machines[q.machine];
  if (m && (m.ownership === "customer" && m.status === "in-workshop" || /refurb|overhaul|rebuild/i.test(q.title))){
    const wid = "WS-" + (s.wsNo++);
    s.wsJobs.push({id:wid, machine:q.machine, cust:q.cust, arrived:0, stage:"In progress", quote:id, reason:q.title, required:7, bay:"Bay 5",
      work:q.lines.filter(l => l[0] === "labour").map(l => [l[1], false]).concat([["QC and test", false]]), labour:[], parts:[], materials:[], photos:0, fixed:true});
    if (m){ m.status = "in-workshop"; m.location = "Workshop, Mitchelstown"; }
    q.status = "Converted"; q.job = wid;
    toast(id + " → " + wid, "ok", "Workshop job created with the quoted labour, parts and materials.");
  } else {
    const jid = "JOB-" + (s.jobNo++);
    s.jobs.unshift({id:jid, cust:q.cust, machine:q.machine, fault:q.title, prio:"P3", type:"Quoted work", status:"New", eng:null, day:null, start:null,
      dur: Math.round(q.lines.filter(l => l[0] === "labour").reduce((n, l) => n + l[2], 0) * 60) || 120, source:"Quote " + id, billing:"quoted", parts:[], openedH:0,
      sla:"Quoted work", sheet:null, invoice:null, claim:null, quote:id, events:[{t:"Today " + hm(nowMin()), label:"Created from approved quote " + id, by:"Pulse", src:"system"}]});
    q.status = "Converted"; q.job = jid;
    toast(id + " → " + jid, "ok", "Job created with the quoted lines. Waiting in Dispatch.");
  }
  feed(id + " converted to " + q.job, "office", q.job);
});

/* workshop */
A.wsStage = (id, stage) => set(s => { const w = s.wsJobs.find(x => x.id === id); w.stage = stage; toast(id + " → " + stage, "ok"); feed(id + " moved to " + stage.toLowerCase(), "workshop", id); });
A.wsHours = (id, eng, h) => set(s => { const w = s.wsJobs.find(x => x.id === id); w.labour.push([eng, 0, h]);
  const c = Q.wsCost(w); if (c.budget && c.pct > 0.9) toast(id + " at " + Math.round(c.pct * 100) + "% of quote", "warn", "Workshop manager alerted.");
  else toast(h + " h logged to " + id, "ok", Q.eng(eng).name); });
A.wsPart = (id, name, qty, price) => set(s => { const w = s.wsJobs.find(x => x.id === id); w.parts.push([name, qty, price]); toast("Part added to " + id, "ok", name + ", stock updated"); });
A.wsMat = (id, name, cost) => set(s => { const w = s.wsJobs.find(x => x.id === id); w.materials.push([name, cost]); });
A.wsTask = (id, i) => set(s => { const w = s.wsJobs.find(x => x.id === id); w.work[i][1] = !w.work[i][1]; });
A.wsInvoice = (id, mode) => set(s => {
  const w = s.wsJobs.find(x => x.id === id); const c = Q.wsCost(w); const q = w.quote ? Q.quote(w.quote) : null;
  const lines = mode === "quote" && q ? q.lines.map(l => [l[1], l[2], l[3]]) :
    [["Workshop labour, " + c.hours + " h", c.hours, 78]].concat(w.parts.map(p => [p[0], p[1], Math.round(p[2] * 1.3)])).concat(w.materials.map(m => [m[0], 1, Math.round(m[1] * 1.2)]));
  const total = lines.reduce((n, l) => n + l[1] * l[2], 0), inv = "INV-" + (s.invNo++);
  s.invoices.unshift({id:inv, cust:w.cust, source:id, kind:"workshop", status:"Draft", total, lines, day:0, sync:"Not synced",
    flags: q ? ["Quoted " + eur(Q.quoteTotal(q)) + ", actual cost " + eur(c.total) + (mode === "quote" ? ", billed at quote" : ", billed at actual")] : []});
  w.invoice = inv; w.stage = "Ready for collection";
  toast(inv + " drafted from " + id, "ok", mode === "quote" ? "Fixed price, as quoted" : "Time and materials at actual");
});
A.bookIn = (form) => set(s => {
  const wid = "WS-" + (s.wsNo++); const m = s.machines[form.machine];
  if (m){ m.status = "in-workshop"; m.location = "Workshop, Mitchelstown"; }
  s.wsJobs.push({id:wid, machine:form.machine, cust:form.cust, arrived:0, stage:"Booked in", quote:null, reason:form.reason, required:form.required || 10, bay:form.bay || "Yard",
    work:[["Clean and inspect", false],["Assessment and quote", false]], labour:[], parts:[], materials:[], photos:form.photos || 0, fixed:false});
  feed(wid + " booked in: " + (m ? m.type : "machine") + " from " + (form.cust ? s.cust[form.cust].name : "stock"), "workshop", wid);
  toast(wid + " booked in", "ok", "Machine record now shows it in the workshop.");
});

/* hire */
A.offHire = (id) => set(s => { const h = s.hire.find(x => x.id === id); h.closed = true; const m = s.machines[h.asset]; m.status = "available"; m.cust = null; m.location = "Depot, Mitchelstown";
  const inv = "INV-" + (s.invNo++); const total = h.period === "week" ? h.rate : h.rate;
  s.invoices.unshift({id:inv, cust:h.cust, source:h.id, kind:"hire", status:"Draft", total, lines:[["Hire " + m.model + " " + m.serial + ", final " + h.period, 1, h.rate]], day:0, sync:"Not synced", flags:[]});
  toast(h.id + " off-hired", "ok", "Inspection passed. Final hire invoice " + inv + " drafted."); });

/* tracking settings */
A.tracking = (patch) => set(s => { Object.assign(s.tracking, patch); });

/* manual job update from office (e.g. awaiting parts) */
A.jobStatus = (id, st) => set(s => { const j = s.jobs.find(x => x.id === id); j.status = st; j.events.push({t:"Today " + hm(nowMin()), label:"Status set to " + st, by:"Lara Costello", src:"office"}); });

/* Helios: live answers built from the store, returned in the page's answer shape. */
MOS.helios = function(q){
  if (!S) return null;
  const s = q.toLowerCase();
  const T = (text, cols, rows, actions, extra) => Object.assign({tool:extra && extra.tool || "service_os_query", effect: extra && extra.effect || "read", text, cols, rows, actions}, extra || {});
  if (/\bplan\b.*\b(tomorrow|today|day|engineers?)\b|\bauto.?plan/.test(s)){
    const day = /today/.test(s) ? 0 : 1, rows = MOS.autoPlan(day).filter(r => r.eng);
    return T("I scored every unassigned job against each engineer: drive time from the previous stop, " + "brand training, parts in the van, shift start and finish, and nearby jobs to group. " + rows.length + " jobs fit " + dayLabel(day).toLowerCase() + ". Scheduling is a write tool, so it waits for your yes on the dispatch board.",
      ["Job","Engineer","Slot","Why"], rows.map(r => [r.job, Q.eng(r.eng).name, r.start + " to " + r.end, r.reasons.slice(0, 2).join(", ")]),
      [["Open Dispatch Board",1,"os","dispatch"],["Where is everyone right now?",0]], {tool:"dispatch.plan_day", effect:"write"});
  }
  if (/\bwhere\b.*\b(everyone|engineers?|team|sean|eoin|martin)\b/.test(s)){
    return T("Here is where the team is, from their on-duty status. Location is only recorded between Start day and End day, and only as arrivals and departures at sites.",
      ["Person","Status","Now","Utilisation today"], S.engineers.filter(e => e.kind !== "workshop").map(e => { const g = (S.geo[e.id] || []).slice(-1)[0]; const u = e.kind === "field" ? Math.round(MOS.utilisation(e.id, 0).pct * 100) + "%" : ""; return [e.name, S.tracking.onDuty[e.id] ? S.status[e.id] : "Off duty", g ? g.t + " " + g.label : "Not started", u]; }),
      [["Open Time and Travel",1,"os","time"],["Open Control Tower",0,"os","tower"]], {tool:"engineer_status"});
  }
  if (/\b(ready to invoice|invoice|invoices|unbilled|bill)\b/.test(s)){
    const r = Q.readyToInvoice(), tot = r.reduce((n, i) => n + i.total, 0);
    return T(r.length + " invoices are drafted and ready, worth " + eur2(tot) + ". Every line came from a signed job sheet or a workshop job, so nobody typed them. Sending is a write tool, so it waits for your yes.",
      ["Invoice","Customer","From","Total"], r.slice(0, 8).map(i => [i.id, S.cust[i.cust] ? S.cust[i.cust].name : "", i.source, eur2(i.total)]),
      [["Open Invoicing",1,"os","commercial/invoicing"],["Which warranty claims are outstanding?",0]], {tool:"invoice_queue"});
  }
  if (/\b(warranty|claims?|manufacturer|credits?)\b/.test(s)){
    const open = Q.claimsOpen(), val = open.reduce((n, c) => n + c.value, 0), old = open.filter(c => c.age > 60).length;
    const by = {}; open.forEach(c => { by[c.mfr] = by[c.mfr] || [0, 0, 0]; by[c.mfr][0]++; by[c.mfr][1] += c.value; by[c.mfr][2] = Math.max(by[c.mfr][2], c.age); });
    return T(open.length + " warranty claims are open, worth " + eur(val) + " in credits. " + old + " are over 60 days with no credit. Claims are drafted automatically when an engineer fits a part on a warranty job.",
      ["Manufacturer","Open","Value","Oldest"], Object.keys(by).map(k => [k, String(by[k][0]), eur(by[k][1]), by[k][2] + " days"]),
      [["Open Warranty",1,"os","warranty"],["What’s ready to invoice?",0]], {tool:"warranty_claims"});
  }
  if (/\b(van|vans)\b|\bwho has\b/.test(s)){
    const eng = /sean/.test(s) ? "sm" : /martin/.test(s) ? "mk" : "eo", e = Q.eng(eng);
    const rows = Object.keys(S.vans[eng]).map(sku => [sku, S.catalogue[sku].name, String(S.vans[eng][sku]), (S.vanMin[eng] || {})[sku] ? String(S.vanMin[eng][sku]) : ""]);
    return T(e.name + "’s van (" + e.van + ") holds " + rows.reduce((n, r) => n + +r[2], 0) + " parts across " + rows.length + " lines. Stock drops automatically when a part is fitted on a job sheet.",
      ["SKU","Part","In van","Min"], rows, [["Open Parts and Vans",1,"os","parts/vans"],["Where is everyone right now?",0]], {tool:"van_stock"});
  }
  if (/\b(workshop|refurb|ws-\d+|bench)\b/.test(s)){
    return T(S.wsJobs.filter(w => w.stage !== "Collected").length + " machines are in the workshop. Cost is tracked live against the quote: labour from the bench timer, parts from stores, materials as used.",
      ["Job","Machine","Stage","Cost vs quote"], S.wsJobs.map(w => { const c = Q.wsCost(w); const m = S.machines[w.machine]; return [w.id, m.model + " " + (w.cust ? S.cust[w.cust].name : "Myers stock"), w.stage, eur(c.total) + (c.budget ? " of " + eur(c.budget) : "")]; }),
      [["Open Workshop",1,"os","workshop"],["Which quotes are waiting on customers?",0]], {tool:"workshop_jobs"});
  }
  if (/\bquotes?\b/.test(s)){
    const w = S.quotes.filter(q => q.status === "Awaiting approval");
    return T(w.length + " quotes are waiting on customers, worth " + eur(w.reduce((n, q) => n + Q.quoteTotal(q), 0)) + ". Once approved, a quote becomes the job or workshop job with its lines carried across.",
      ["Quote","Customer","Sent","Value"], w.map(q => [q.id, S.cust[q.cust].name, q.sent + " days ago", eur(Q.quoteTotal(q))]),
      [["Open Quotes",1,"os","commercial/quotes"],["What’s in the workshop?",0]], {tool:"quotes_pending"});
  }
  if (/\b(took|take|taking)\b.*\b(longer|planned|long)\b|planned vs actual|\bdiscrepanc/.test(s)){
    const rows = S.jobs.filter(j => j.actual && j.eng && Math.abs(j.actual - j.dur) > 25).slice(0, 8).map(j => [j.id, Q.eng(j.eng).name, dur(j.dur), dur(j.actual)]);
    return T("These jobs ran well over or under the time allowed. It is for planning accuracy: the times feed the next plan for that machine type.",
      ["Job","Engineer","Planned","Actual"], rows, [["Open Time and Travel",1,"os","time/discrepancies"]], {tool:"time_variance"});
  }
  return null;
};
})();
