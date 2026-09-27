/* Myers Pulse: reference data and seed.
   ONE source of demo data for every screen. DEMO DATA, not claimed real figures.
   The demo day is Monday 28 September 2026. The story clock starts at 07:02.
   Plain JS, no build step. Exposes window.MP.util, MP.geo, MP.seed(). */
(function(){
"use strict";
const MP = window.MP = window.MP || {};

/* ---------- helpers ---------- */
const pad = (n) => String(n).padStart(2, "0");
const hm = (m) => { m = Math.round(m); return pad(Math.floor(m / 60)) + ":" + pad(((m % 60) + 60) % 60); };
const toMin = (s) => { const p = String(s).split(":"); return (+p[0]) * 60 + (+p[1] || 0); };
const dur = (m) => { m = Math.max(0, Math.round(m)); const h = Math.floor(m / 60), mm = m % 60; return h ? h + "h " + pad(mm) + "m" : mm + "m"; };
const eur = (n) => "€" + Math.round(n).toLocaleString("en-IE");
const eur2 = (n) => "€" + Number(n).toLocaleString("en-IE", {minimumFractionDigits:2, maximumFractionDigits:2});
function rng(seed){ let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hash(obj){ const s = JSON.stringify(obj); let h = 2166136261; for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16).padStart(8, "0"); }
const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTH = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const WD = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const WDAY = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const TODAY = "2026-09-28";
const key = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
const fromKey = (k) => { const p = k.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); };
const addDays = (k, n) => { const d = fromKey(k); d.setDate(d.getDate() + n); return key(d); };
const dm = (k) => { const d = fromKey(k); return d.getDate() + " " + MON[d.getMonth()]; };            // 28 Sep
const dmy = (k) => { const d = fromKey(k); return d.getDate() + " " + MON[d.getMonth()] + " " + d.getFullYear(); }; // 28 Sep 2026
const dLong = (k) => { const d = fromKey(k); return d.getDate() + " " + MONTH[d.getMonth()] + " " + d.getFullYear(); }; // 12 March 2022
const wdm = (k) => { const d = fromKey(k); return WD[d.getDay()] + " " + d.getDate() + " " + MON[d.getMonth()]; }; // Mon 28 Sep
const weekday = (k) => fromKey(k).getDay();
/* Friendly relative day for the demo date. */
function rel(k){
  if (k === TODAY) return "Today";
  if (k === addDays(TODAY, -1)) return "Yesterday";
  if (k === addDays(TODAY, 1)) return "Tomorrow";
  const diff = Math.round((fromKey(k) - fromKey(TODAY)) / 864e5);
  if (diff < 0 && diff > -7) return WDAY[weekday(k)];
  return dm(k);
}
MP.util = {pad, hm, toMin, dur, eur, eur2, rng, hash, MON, MONTH, WD, WDAY, TODAY, key, fromKey, addDays, dm, dmy, dLong, wdm, weekday, rel};

/* ---------- geography ---------- */
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
  const R = 6371, r = Math.PI / 180, dLat = (b[0] - a[0]) * r, dLng = (b[1] - a[1]) * r;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
const lerp = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
/* A point `d` km from a towards b (straight line). */
const along = (a, b, d) => lerp(a, b, Math.min(1, d / Math.max(0.001, km(a, b))));
/* Road minutes: straight line x 1.2 road factor at 100 km/h average (mostly motorway), plus 5 minutes to park. */
const driveMin = (a, b) => Math.round(km(a, b) * 1.2 / 100 * 60 + 5);
const BASE = {id:"base", name:"Myers Food Machinery", short:"Myers base", pos:[52.266,-8.268]};
MP.geo = {COAST, km, lerp, along, driveMin, BASE};

/* ---------- reference data ---------- */
const MODELS = {
  LP200:{name:"LabelPro LP200", type:"Label printer/applicator", mfr:"LabelPro", skill:"Label systems"},
  LA300:{name:"LabelPro LA-300", type:"Label applicator", mfr:"LabelPro", skill:"Label systems"},
  CCW:{name:"Ishida CCW-RV", type:"Multihead weigher", mfr:"Ishida", skill:"Weighing"},
  DACS:{name:"Ishida DACS-G", type:"Checkweigher", mfr:"Ishida", skill:"Weighing"},
  MX4:{name:"MetalCheck X4", type:"Metal detector", mfr:"MetalCheck", skill:"Metal detection"},
  TS600:{name:"Sealtek TS-600", type:"Tray sealer", mfr:"Sealtek", skill:"Tray sealing"},
  VP2:{name:"VacuPak VP-2", type:"Vacuum packer", mfr:"VacuPak", skill:"Vacuum packing"},
  SL12:{name:"SliceMaster SL-12", type:"Slicer", mfr:"SliceMaster", skill:"Slicing"}
};
const SUPPLIERS = {LabelPro:"LabelPro UK", Ishida:"Ishida Europe", MetalCheck:"MetalCheck Ltd", Sealtek:"Sealtek Packaging", VacuPak:"VacuPak GmbH", SliceMaster:"SliceMaster Ireland", Generic:"Bearing & Drive Supplies"};

const ENGINEERS = [
  {id:"sean", name:"Sean Murphy", initials:"SM", van:"van04", phone:"087 214 6630", tint:"#8fe3c8",
   skills:["Label systems","Packaging lines","Electrical diagnostics"], certs:["LabelPro","Ishida"]},
  {id:"david", name:"David Ryan", initials:"DR", van:"van02", phone:"086 551 2094", tint:"#9fc8ff",
   skills:["Metal detection","Checkweighers","Inspection systems"], certs:["MetalCheck","Ishida"]},
  {id:"gary", name:"Gary Doyle", initials:"GD", van:"van03", phone:"087 903 4471", tint:"#f0c77a",
   skills:["Mechanical","Conveyors","Label systems"], certs:["LabelPro"]},
  {id:"declan", name:"Declan Byrne", initials:"DB", van:"van01", phone:"085 772 1180", tint:"#c9b8ff",
   skills:["Tray sealing","Vacuum packing","Pneumatics"], certs:["Sealtek","VacuPak"]},
  {id:"mark", name:"Mark Kavanagh", initials:"MK", van:"van05", phone:"087 640 3318", tint:"#ffb39a",
   skills:["Slicing","Mechanical","Food safety guarding"], certs:["SliceMaster"]},
  {id:"aoife", name:"Aoife Kelly", initials:"AK", van:"van06", phone:"086 118 7042", tint:"#7fd6ea",
   skills:["Weighing","Controls and PLC","Label systems"], certs:["Ishida","LabelPro"]},
  {id:"shane", name:"Shane Doherty", initials:"SD", van:"van07", phone:"087 355 9026", tint:"#b8e07a",
   skills:["Installations","Commissioning","Electrical"], certs:["Sealtek","Ishida","MetalCheck"]},
  {id:"liam", name:"Liam O’Connor", initials:"LO", van:"van08", phone:"085 290 6613", tint:"#d9c2a5",
   skills:["Vacuum packing","Refrigeration","Mechanical"], certs:["VacuPak"], leave:true}
];
const STAFF = [
  {id:"tom", name:"Tom Myers", initials:"TM", role:"owner", title:"Managing Director"},
  {id:"karen", name:"Karen Nolan", initials:"KN", role:"manager", title:"Service Manager"},
  {id:"brian", name:"Brian Kearney", initials:"BK", role:"manager", title:"Operations Manager"},
  {id:"pat", name:"Pat Hayes", initials:"PH", role:"stores", title:"Stores"}
];

/* Customers and sites. Sites carry the coordinates; machines sit on sites. */
const CUSTOMERS = [
  {id:"glenmore", name:"Glenmore Foods", qb:"QB-C-0142", contacts:[{name:"Paul Byrne", role:"Production Manager", phone:"087 412 9930", email:"paul.byrne@glenmorefoods.ie"},{name:"Emer Walsh", role:"Accounts", phone:"045 861 220", email:"accounts@glenmorefoods.ie"}],
   sites:[{id:"glenmore-naas", name:"Naas Production Facility", town:"Naas, Co. Kildare", pos:[53.216,-6.667]},
          {id:"glenmore-kilcullen", name:"Kilcullen Dispatch Centre", town:"Kilcullen, Co. Kildare", pos:[53.130,-6.745]}]},
  {id:"freshpak", name:"FreshPak", qb:"QB-C-0188", contacts:[{name:"Niall Fitzgerald", role:"Engineering Lead", phone:"086 733 1045", email:"niall@freshpak.ie"}],
   sites:[{id:"freshpak-portlaoise", name:"Portlaoise Packing Plant", town:"Portlaoise, Co. Laois", pos:[53.034,-7.300]}]},
  {id:"greenfarm", name:"GreenFarm Foods", qb:"QB-C-0203", contacts:[{name:"Orla Brennan", role:"Operations Manager", phone:"087 118 5520", email:"orla.brennan@greenfarmfoods.ie"}],
   sites:[{id:"greenfarm-tullamore", name:"Tullamore Plant", town:"Tullamore, Co. Offaly", pos:[53.274,-7.488]}]},
  {id:"murphy", name:"Murphy Foods", qb:"QB-C-0231", contacts:[{name:"Ger Murphy", role:"Owner", phone:"090 647 2210", email:"ger@murphyfoods.ie"}],
   sites:[{id:"murphy-athlone", name:"Athlone Kitchen", town:"Athlone, Co. Westmeath", pos:[53.423,-7.940]}]},
  {id:"coastline", name:"Coastline Seafoods", qb:"QB-C-0119", contacts:[{name:"Fiona Power", role:"Plant Manager", phone:"058 412 88", email:"fiona@coastlineseafoods.ie"}],
   sites:[{id:"coastline-dungarvan", name:"Dungarvan Quay", town:"Dungarvan, Co. Waterford", pos:[52.088,-7.625]}]},
  {id:"lakeside", name:"Lakeside Meats", qb:"QB-C-0157", contacts:[{name:"Colm Hogan", role:"Production Supervisor", phone:"067 331 402", email:"colm@lakesidemeats.ie"}],
   sites:[{id:"lakeside-nenagh", name:"Nenagh Plant", town:"Nenagh, Co. Tipperary", pos:[52.862,-8.197]}]},
  {id:"ashfield", name:"Ashfield Dairies", qb:"QB-C-0104", contacts:[{name:"Siobhán Kiely", role:"QA Manager", phone:"022 214 90", email:"siobhan@ashfielddairies.ie"}],
   sites:[{id:"ashfield-mallow", name:"Mallow Creamery", town:"Mallow, Co. Cork", pos:[52.139,-8.645]}]},
  {id:"harbour", name:"Harbour Kitchen Sauces", qb:"QB-C-0176", contacts:[{name:"Declan Roche", role:"Operations", phone:"021 463 1170", email:"droche@harbourkitchen.ie"}],
   sites:[{id:"harbour-midleton", name:"Midleton Kitchen", town:"Midleton, Co. Cork", pos:[51.916,-8.175]}]},
  {id:"slaney", name:"Slaney Valley Poultry", qb:"QB-C-0212", contacts:[{name:"Tadhg Nolan", role:"Engineering Manager", phone:"053 923 4410", email:"tadhg@slaneyvalley.ie"}],
   sites:[{id:"slaney-enniscorthy", name:"Enniscorthy Plant", town:"Enniscorthy, Co. Wexford", pos:[52.502,-6.558]}]},
  {id:"kerrigan", name:"Kerrigan’s Butchers", qb:"QB-C-0133", contacts:[{name:"Joe Kerrigan", role:"Owner", phone:"052 612 2081", email:"joe@kerrigansbutchers.ie"}],
   sites:[{id:"kerrigan-clonmel", name:"Clonmel Shop and Prep Room", town:"Clonmel, Co. Tipperary", pos:[52.355,-7.704]}]},
  {id:"burren", name:"Burren Artisan Cheese", qb:"QB-C-0198", contacts:[{name:"Máire Considine", role:"Owner", phone:"065 707 4412", email:"maire@burrencheese.ie"}],
   sites:[{id:"burren-ennis", name:"Ennis Dairy", town:"Ennis, Co. Clare", pos:[52.843,-8.986]}]},
  {id:"tullyvin", name:"Tullyvin Bakery", qb:"QB-C-0165", contacts:[{name:"Ronan Smyth", role:"Bakery Manager", phone:"049 437 1182", email:"ronan@tullyvinbakery.ie"}],
   sites:[{id:"tullyvin-cavan", name:"Cavan Bakehouse", town:"Cavan", pos:[53.990,-7.360]}]},
  {id:"atlantic", name:"Atlantic Catch", qb:"QB-C-0121", contacts:[{name:"Aidan Flaherty", role:"Site Manager", phone:"091 562 330", email:"aidan@atlanticcatch.ie"}],
   sites:[{id:"atlantic-galway", name:"Galway Docks", town:"Galway", pos:[53.270,-9.050]}]},
  {id:"kildare", name:"Kildare Chilling Co.", qb:"QB-C-0146", contacts:[{name:"Brendan Moore", role:"Maintenance Lead", phone:"045 521 887", email:"bmoore@kildarechilling.ie"}],
   sites:[{id:"kildare-town", name:"Kildare Town Plant", town:"Kildare", pos:[53.158,-6.911]}]},
  {id:"funshion", name:"Funshion Valley Foods", qb:"QB-C-0171", contacts:[{name:"Karen Barry", role:"Owner", phone:"025 243 17", email:"karen@funshionvalley.ie"}],
   sites:[{id:"funshion-kilworth", name:"Kilworth Kitchen", town:"Kilworth, Co. Cork", pos:[52.176,-8.246]}]}
];

/* Machines: [serial, model, customer, site, installed, warranty end] */
const MACHINES = [
  ["LP200-48023","LP200","glenmore","glenmore-naas","2022-03-12","2023-03-12"],
  ["CCW-71044","CCW","glenmore","glenmore-naas","2021-06-02","2023-06-02"],
  ["MCX4-7702","MX4","glenmore","glenmore-naas","2021-06-02","2023-06-02"],
  ["TS600-3310","TS600","glenmore","glenmore-naas","2023-01-19","2025-01-19"],
  ["LP200-51188","LP200","glenmore","glenmore-naas","2024-10-08","2026-10-08"],
  ["DACS-2291","DACS","glenmore","glenmore-kilcullen","2020-09-15","2022-09-15"],
  ["MCX4-8012","MX4","glenmore","glenmore-kilcullen","2022-11-30","2024-11-30"],
  ["VP2-6620","VP2","glenmore","glenmore-kilcullen","2019-04-11","2020-04-11"],
  ["MCX4-8841","MX4","freshpak","freshpak-portlaoise","2025-11-14","2027-11-14"],
  ["CCW-73310","CCW","freshpak","freshpak-portlaoise","2025-11-14","2027-11-14"],
  ["TS600-4102","TS600","freshpak","freshpak-portlaoise","2024-02-20","2026-02-20"],
  ["LA300-20917","LA300","greenfarm","greenfarm-tullamore","2021-08-23","2022-08-23"],
  ["MCX4-6618","MX4","greenfarm","greenfarm-tullamore","2020-03-05","2022-03-05"],
  ["SL12-9051","SL12","murphy","murphy-athlone","2018-05-17","2019-05-17"],
  ["VP2-7415","VP2","coastline","coastline-dungarvan","2022-07-01","2023-07-01"],
  ["TS600-2877","TS600","coastline","coastline-dungarvan","2021-03-09","2023-03-09"],
  ["SL12-9377","SL12","lakeside","lakeside-nenagh","2020-10-12","2021-10-12"],
  ["DACS-2745","DACS","lakeside","lakeside-nenagh","2023-05-30","2025-05-30"],
  ["DACS-2803","DACS","ashfield","ashfield-mallow","2023-09-04","2025-09-04"],
  ["LP200-47110","LP200","harbour","harbour-midleton","2021-12-01","2022-12-01"],
  ["TS600-5230","TS600","slaney","slaney-enniscorthy",null,null],
  ["MCX4-8156","MX4","slaney","slaney-enniscorthy","2023-02-14","2025-02-14"],
  ["SL12-8830","SL12","kerrigan","kerrigan-clonmel","2019-09-26","2020-09-26"],
  ["VP2-6934","VP2","burren","burren-ennis","2020-06-18","2021-06-18"],
  ["LP200-44982","LP200","tullyvin","tullyvin-cavan","2020-01-27","2021-01-27"],
  ["DACS-2512","DACS","atlantic","atlantic-galway","2021-04-12","2023-04-12"],
  ["TS600-3988","TS600","kildare","kildare-town","2022-08-08","2024-08-08"],
  ["VP2-7780","VP2","funshion","funshion-kilworth","2024-03-03","2026-03-03"]
];

/* Parts: [sku, name, manufacturer, models, stores bin, unit cost, reorder level (all locations), main stores qty] */
const PARTS = [
  ["MX-44721","Optical Sensor, Label Applicator","LabelPro",["LP200","LA300"],"B-14-03",184,4,1],
  ["LP-PH107","Printhead, 107 mm","LabelPro",["LP200"],"B-14-01",612,2,2],
  ["LP-PR107","Print roller, 107 mm","LabelPro",["LP200"],"B-14-02",96,3,5],
  ["LP-BELT","Drive belt, LP200 applicator","LabelPro",["LP200"],"B-14-05",58,4,7],
  ["LA-PAD","Tamp pad assembly, LA-300","LabelPro",["LA300"],"B-15-01",141,2,3],
  ["IS-LC6","Load cell, 6 kg","Ishida",["CCW","DACS"],"C-02-04",398,2,1],
  ["IS-GATE","Pool hopper gate spring kit","Ishida",["CCW"],"C-02-07",44,6,14],
  ["IS-BELT","Checkweigher infeed belt","Ishida",["DACS"],"C-03-01",167,2,4],
  ["MC-77401","Detector head control board","MetalCheck",["MX4"],"C-06-02",536,1,1],
  ["MC-TP15","Test piece set, 1.5 mm Fe / NFe / SS","MetalCheck",["MX4"],"C-06-05",38,6,18],
  ["MC-BELT","Reject conveyor belt, X4","MetalCheck",["MX4"],"C-06-08",210,2,3],
  ["ST-HEAT","Heater element, TS-600","Sealtek",["TS600"],"D-01-02",274,2,1],
  ["ST-SEAL","Seal gasket, 600 mm","Sealtek",["TS600"],"D-01-04",36,8,22],
  ["VP-OIL","Vacuum pump oil, 1 L","VacuPak",["VP2"],"D-04-01",19,12,46],
  ["VP-GSK","Lid gasket, VP-2","VacuPak",["VP2"],"D-04-03",52,6,11],
  ["SL-BLD","Slicer blade, 350 mm","SliceMaster",["SL12"],"D-07-01",229,2,3],
  ["BRG-6204","Bearing 6204-2RS","Generic",["LA300","SL12","MX4"],"A-03-11",14,10,0],
  ["GEN-PROX","Proximity sensor M12, PNP","Generic",[],"A-05-02",42,8,16],
  ["GEN-RELAY","Relay 24 V DC, plug-in","Generic",[],"A-05-06",11,20,64],
  ["GEN-FUSE","Control fuse kit","Generic",[],"A-01-01",9,40,188],
  ["GEN-LUBE","Food-grade lubricant, 400 ml","Generic",[],"A-08-01",13,30,142],
  ["GEN-CTIE","Cable ties 300 mm, bag of 100","Generic",[],"A-09-04",6,40,410],
  ["GEN-SOL","Solenoid valve 5/2, 24 V","Generic",["TS600","VP2"],"A-06-03",88,4,6],
  ["GEN-ESTOP","E-stop button assembly","Generic",[],"A-05-09",34,4,9]
];

/* Van stock: location id -> {sku: qty}. Van minimums: same shape. */
const VAN_STOCK = {
  van01:{"VP-OIL":6,"VP-GSK":3,"ST-SEAL":4,"ST-HEAT":1,"GEN-SOL":1,"GEN-FUSE":10,"GEN-LUBE":4,"GEN-CTIE":8,"GEN-RELAY":6,"GEN-PROX":2},
  van02:{"MC-TP15":3,"MC-BELT":1,"MC-77401":0,"IS-BELT":1,"GEN-PROX":3,"GEN-FUSE":12,"GEN-LUBE":4,"GEN-CTIE":8,"GEN-RELAY":6,"BRG-6204":2},
  van03:{"BRG-6204":0,"LA-PAD":1,"LP-BELT":1,"GEN-PROX":2,"GEN-FUSE":10,"GEN-LUBE":5,"GEN-CTIE":9,"GEN-RELAY":5,"GEN-ESTOP":1},
  van04:{"MX-44721":2,"LP-PR107":1,"LP-BELT":2,"IS-GATE":4,"GEN-PROX":3,"GEN-FUSE":12,"GEN-LUBE":5,"GEN-CTIE":10,"GEN-RELAY":6,"GEN-ESTOP":1},
  van05:{"SL-BLD":1,"BRG-6204":3,"GEN-FUSE":10,"GEN-LUBE":6,"GEN-CTIE":8,"GEN-RELAY":5,"GEN-PROX":1},
  van06:{"MX-44721":1,"IS-LC6":0,"IS-GATE":6,"IS-BELT":1,"LP-PR107":1,"GEN-PROX":2,"GEN-FUSE":10,"GEN-LUBE":4,"GEN-CTIE":8,"GEN-RELAY":6},
  van07:{"ST-SEAL":6,"MC-TP15":2,"GEN-SOL":1,"GEN-ESTOP":2,"GEN-PROX":4,"GEN-FUSE":14,"GEN-LUBE":6,"GEN-CTIE":12,"GEN-RELAY":8},
  van08:{"VP-OIL":8,"VP-GSK":2,"GEN-FUSE":8,"GEN-LUBE":4,"GEN-CTIE":6,"GEN-RELAY":4}
};
const VAN_MIN = {
  van01:{"VP-OIL":4,"VP-GSK":2,"ST-SEAL":2,"GEN-FUSE":6},
  van02:{"MC-TP15":2,"MC-BELT":1,"MC-77401":1,"GEN-FUSE":6},
  van03:{"BRG-6204":2,"LP-BELT":1,"GEN-FUSE":6},
  van04:{"MX-44721":2,"LP-BELT":1,"IS-GATE":2,"GEN-FUSE":6},
  van05:{"SL-BLD":1,"BRG-6204":2,"GEN-FUSE":6},
  van06:{"MX-44721":1,"IS-LC6":1,"IS-GATE":2,"GEN-FUSE":6},
  van07:{"ST-SEAL":2,"MC-TP15":1,"GEN-FUSE":6},
  van08:{"VP-OIL":4,"GEN-FUSE":6}
};

MP.ref = {MODELS, SUPPLIERS, ENGINEERS, STAFF, CUSTOMERS, MACHINES, PARTS, VAN_STOCK, VAN_MIN};

/* ======================================================================
   SEED: builds the full starting state. Called on first load and on reset.
   ====================================================================== */
MP.seed = function(){
  const R = rng(20260928);
  const S = {v:3, clock:toMin("07:02"), role:"owner", demoStep:0};

  /* --- customers, sites, machines --- */
  S.customers = {}; S.sites = {};
  CUSTOMERS.forEach(c => {
    S.customers[c.id] = {id:c.id, name:c.name, qb:c.qb, contacts:c.contacts, sites:c.sites.map(s => s.id), syncedFrom:"QuickBooks"};
    c.sites.forEach(s => S.sites[s.id] = Object.assign({cust:c.id}, s));
  });
  S.machines = {};
  MACHINES.forEach(r => {
    S.machines[r[0]] = {id:r[0], model:r[1], cust:r[2], site:r[3], installed:r[4], warrantyEnd:r[5],
      status: r[4] ? "Active" : "Installing", qr:"MFM-" + r[0]};
  });

  /* --- people, locations, stock --- */
  S.engineers = {}; ENGINEERS.forEach(e => S.engineers[e.id] = Object.assign({}, e));
  S.staff = {}; STAFF.forEach(p => S.staff[p.id] = Object.assign({}, p));
  S.locations = {main:{id:"main", name:"Main Stores", kind:"stores"}};
  ENGINEERS.forEach(e => S.locations[e.van] = {id:e.van, name:"Van " + e.van.slice(3), kind:"van", eng:e.id});
  S.parts = {};
  PARTS.forEach(p => S.parts[p[0]] = {sku:p[0], name:p[1], mfr:p[2], models:p[3], bin:p[4], cost:p[5], sell:Math.round(p[5] * 1.4), reorder:p[6],
    supplier:SUPPLIERS[p[2]], reorderQty: Math.max(p[6] * 2 + 2, 10)});
  S.stock = {main:{}}; PARTS.forEach(p => S.stock.main[p[0]] = p[7]);
  Object.keys(VAN_STOCK).forEach(v => S.stock[v] = Object.assign({}, VAN_STOCK[v]));
  S.vanMin = JSON.parse(JSON.stringify(VAN_MIN));
  /* Reorder requests already raised (awaiting delivery). */
  S.reorders = [
    {id:"RO-0331", sku:"BRG-6204", qty:20, supplier:"Bearing & Drive Supplies", status:"Ordered", raised:"2026-09-24", by:"Pat Hayes", eta:"2026-09-29", note:"For Job #2488, Van 03 and stores"},
    {id:"RO-0329", sku:"LP-PH107", qty:2, supplier:"LabelPro UK", status:"Ordered", raised:"2026-09-22", by:"Pat Hayes", eta:"2026-09-30", note:"For Job #2476"},
    {id:"RO-0330", sku:"IS-LC6", qty:3, supplier:"Ishida Europe", status:"Ordered", raised:"2026-09-23", by:"Pat Hayes", eta:"2026-10-02", note:"For Job #2482"},
    {id:"RO-0332", sku:"ST-HEAT", qty:4, supplier:"Sealtek Packaging", status:"Ordered", raised:"2026-09-25", by:"Pat Hayes", eta:"2026-09-29", note:"For Job #2486"},
    {id:"RO-0327", sku:"MC-77401", qty:2, supplier:"MetalCheck Ltd", status:"Ordered", raised:"2026-09-18", by:"Pat Hayes", eta:"2026-10-01", note:"Warranty replacement stock"},
    {id:"RO-0333", sku:"GEN-SOL", qty:6, supplier:"Bearing & Drive Supplies", status:"Ordered", raised:"2026-09-25", by:"Pat Hayes", eta:"2026-10-01", note:"Stores top-up"}
  ];
  /* Part movement ledger (newest first). */
  S.moves = [
    {d:"2026-09-26", t:"10:12", type:"Transferred", sku:"MX-44721", qty:2, from:"main", to:"van04", by:"Pat Hayes"},
    {d:"2026-09-24", t:"14:40", type:"Used", sku:"MX-44721", qty:1, from:"van06", job:"2479", eng:"aoife", by:"Aoife Kelly"},
    {d:"2026-09-21", t:"09:05", type:"Received", sku:"MX-44721", qty:10, to:"main", supplier:"LabelPro UK", by:"Pat Hayes"},
    {d:"2026-09-25", t:"10:40", type:"Used", sku:"ST-SEAL", qty:2, from:"van01", job:"2487", eng:"declan", by:"Declan Byrne"},
    {d:"2026-09-25", t:"11:52", type:"Used", sku:"LP-PR107", qty:1, from:"van02", job:"2483", eng:"david", by:"David Ryan"},
    {d:"2026-09-24", t:"16:02", type:"Transferred", sku:"BRG-6204", qty:3, from:"main", to:"van05", by:"Pat Hayes"},
    {d:"2026-09-23", t:"08:30", type:"Received", sku:"GEN-CTIE", qty:120, to:"main", supplier:"Bearing & Drive Supplies", by:"Pat Hayes"},
    {d:"2026-09-18", t:"12:15", type:"Used", sku:"MC-77401", qty:1, from:"van02", job:"2478", eng:"david", by:"David Ryan"}
  ];

  /* --- jobs --- */
  S.jobs = {};
  const J = (o) => { S.jobs[o.id] = Object.assign({type:"Breakdown", billable:true, prio:"Normal", status:"Closed", eng:null, date:TODAY, start:null, dur:120,
    source:"Phone", parts:[], possibleParts:[], notes:[], docs:[], timeline:[], photos:0, report:null, signoff:null, qb:null, warranty:null, draft:false}, o); return S.jobs[o.id]; };
  const tl = (d, t, text, by, kind) => ({d, t, text, by, kind: kind || "person"});

  /* History: past jobs on every machine. Fixed story jobs first. */
  J({id:"2104", cust:"glenmore", site:"glenmore-naas", machine:"LP200-48023", date:"2025-11-12", start:"09:30", eng:"sean", issue:"Applicator arm slipping, labels skewed on pack",
    resolution:"Drive belt worn through. Replaced and re-tensioned, 200-pack test run clean.", parts:[{sku:"LP-BELT", qty:1, from:"van04"}], actual:95, travel:96, status:"Closed"});
  J({id:"2211", cust:"glenmore", site:"glenmore-naas", machine:"LP200-48023", date:"2026-02-03", start:"10:15", eng:"gary", issue:"Labels missed intermittently above 35 packs a minute",
    resolution:"Optical sensor failing under vibration. Replaced MX-44721, bracket re-seated.", parts:[{sku:"MX-44721", qty:1, from:"van03"}], actual:110, travel:98, status:"Closed"});
  J({id:"2402", cust:"glenmore", site:"glenmore-naas", machine:"LP200-48023", type:"Planned maintenance", date:"2026-07-18", start:"08:30", eng:"sean", issue:"Routine service, six-monthly",
    resolution:"Routine service complete. Sensor alignment checked, rollers cleaned, drive belt at 60 percent.", parts:[], actual:80, travel:94, status:"Closed"});
  J({id:"2478", cust:"freshpak", site:"freshpak-portlaoise", machine:"MCX4-8841", type:"Warranty", billable:false, date:"2026-09-18", start:"09:00", eng:"david",
    issue:"Detector failing ferrous test piece intermittently", resolution:"Detector head control board failed. Replaced MC-77401 under warranty, validation passed.",
    parts:[{sku:"MC-77401", qty:1, from:"van02"}], actual:140, travel:88, status:"Closed", warranty:"W-1062"});
  J({id:"2479", cust:"harbour", site:"harbour-midleton", machine:"LP200-47110", date:"2026-09-24", start:"13:30", eng:"aoife", issue:"Label placement drifting on the lid",
    resolution:"Optical sensor contaminated and cracked. Replaced MX-44721, cleaned guide.", parts:[{sku:"MX-44721", qty:1, from:"van06"}], actual:75, travel:28, status:"Closed"});

  // Generated history across the other machines (Nov 2025 to 24 Sep 2026).
  const faults = {
    LP200:["Labels creased on the leading edge","Print fading on the right side","Applicator not returning home","Ribbon breaking mid-run"],
    LA300:["Tamp pad not picking up labels","Labels missed at speed","Noisy drive on start-up"],
    CCW:["Weights drifting high on heads 3 and 7","Pool hopper gate sticking","Target weight giveaway rising"],
    DACS:["Rejecting good packs","Infeed belt tracking off","Zero drift through the shift"],
    MX4:["Failing stainless test piece","False rejects on wet product","Reject arm slow to return"],
    TS600:["Seal not holding on one edge","Film not cutting cleanly","Heater slow to reach temperature"],
    VP2:["Vacuum level low on cycle","Lid gasket leaking","Pump oil milky"],
    SL12:["Blade chatter on hard cheese","Guard interlock fault","Slice thickness varying"]
  };
  const resolutions = ["Adjusted and tested at line speed.","Worn part replaced, test run clean.","Cleaned, re-aligned and calibrated.","Settings restored, operator shown the check."];
  const engBySkill = (model) => { const sk = MODELS[model].skill; const m = ENGINEERS.filter(e => !e.leave && (e.skills.indexOf(sk) >= 0 || e.certs.indexOf(MODELS[model].mfr) >= 0)); return (m.length ? m : ENGINEERS)[Math.floor(R() * (m.length || ENGINEERS.length))].id; };
  const partsFor = (model) => PARTS.filter(p => p[3].indexOf(model) >= 0 && p[0] !== "MX-44721" && p[0] !== "MC-77401");
  const gen = [];
  const glenCount = 11;  // Glenmore 2026: 9 generated + 2 below + #2211, #2402, #2440, #2466, #2491, #2500 = 17 jobs YTD
  const machineIds = Object.keys(S.machines).filter(id => S.machines[id].installed && S.machines[id].cust !== "glenmore");
  const pickDate = (from, to) => { let d = addDays(from, Math.floor(R() * Math.round((fromKey(to) - fromKey(from)) / 864e5))); while (weekday(d) === 0 || weekday(d) === 6) d = addDays(d, 1); return d; };
  for (let i = 0; i < 118; i++){
    let mid = machineIds[Math.floor(R() * machineIds.length)];
    if (i < glenCount - 2) mid = ["CCW-71044","MCX4-7702","TS600-3310","LP200-51188","DACS-2291","MCX4-8012","VP2-6620"][i % 7];
    const m = S.machines[mid], pm = R() < .3;
    const date = pickDate(i < glenCount - 2 ? "2026-01-05" : "2025-11-03", "2026-09-17");
    const pp = partsFor(m.model); const part = !pm && pp.length && R() < .6 ? pp[Math.floor(R() * pp.length)] : null;
    gen.push({cust:m.cust, site:m.site, machine:mid, type: pm ? "Planned maintenance" : "Breakdown", date, start:hm(7 * 60 + 30 + Math.floor(R() * 14) * 30), eng:engBySkill(m.model),
      issue: pm ? "Planned maintenance visit" : faults[m.model][Math.floor(R() * faults[m.model].length)],
      resolution: pm ? "Planned maintenance complete, all checks passed." : resolutions[Math.floor(R() * resolutions.length)],
      parts: part ? [{sku:part[0], qty:1, from:ENGINEERS.find(e => e.id === "sean").van}] : [], actual:60 + Math.floor(R() * 5) * 20, travel:30 + Math.floor(R() * 7) * 12, status:"Closed"});
  }
  // Two extra Glenmore breakdowns earlier in 2026 so the YTD count lands on 17.
  gen.push({cust:"glenmore", site:"glenmore-kilcullen", machine:"DACS-2291", type:"Breakdown", date:"2026-04-14", start:"11:00", eng:"david", issue:"Rejecting good packs", resolution:"Load cell cable chafed, re-routed and recalibrated.", parts:[], actual:90, travel:92, status:"Closed"});
  gen.push({cust:"glenmore", site:"glenmore-naas", machine:"CCW-71044", type:"Breakdown", date:"2026-06-09", start:"09:00", eng:"aoife", issue:"Pool hopper gate sticking", resolution:"Gate spring kit replaced on heads 2 and 5.", parts:[{sku:"IS-GATE", qty:2, from:"van06"}], actual:70, travel:95, status:"Closed"});
  gen.sort((a, b) => a.date.localeCompare(b.date));
  // Job numbers follow the calendar: 2090 in early Nov 2025 up to about 2465 in mid-September.
  const used = new Set(["2104","2211","2402","2419","2433","2440","2455","2461","2463","2466"]);
  const span = (fromKey("2026-09-17") - fromKey("2025-11-03")) / 864e5;
  gen.forEach(g => { let id = 2090 + Math.round((fromKey(g.date) - fromKey("2025-11-03")) / 864e5 / span * 375);
    while (used.has(String(id))) id++; used.add(String(id));
    g.parts.forEach(p => { p.from = S.engineers[g.eng].van; }); J(Object.assign({id:String(id)}, g)); });
  // Ensure every closed history job has an engineer report and a timeline line.
  Object.values(S.jobs).forEach(j => {
    if (j.status !== "Closed") return;
    j.report = {summary:j.resolution, by:j.eng, d:j.date};
    j.signoff = {name:(S.customers[j.cust].contacts[0] || {}).name, d:j.date};
    j.timeline = [tl(j.date, j.start, (j.type === "Planned maintenance" ? "Planned visit completed by " : "Completed by ") + S.engineers[j.eng].name, S.engineers[j.eng].name, "engineer")];
  });

  /* QuickBooks history: jobs already handed over. [job, QB ref, status, value, invoiced, paid] */
  const QBH = [
    ["2468","QB-10418","Paid",1185,"2026-09-08","2026-09-21"],["2469","QB-10419","Paid",640,"2026-09-09","2026-09-23"],["2470","QB-10420","Paid",2210,"2026-09-10","2026-09-25"],
    ["2471","QB-10421","Paid",915,"2026-09-11","2026-09-25"],["2472","QB-10422","Invoiced",1470,"2026-09-15",null],["2473","QB-10423","Invoiced",388,"2026-09-16",null],
    ["2474","QB-10424","Invoiced",2860,"2026-09-17",null],["2475","QB-10425","Invoiced",730,"2026-09-21",null],["2477","QB-10426","Invoiced",1325,"2026-09-22",null],["2480","QB-10427","Sent",0,null,null]
  ];
  // Jobs 2468 to 2477 and 2480 are recent closed jobs; create them if the generator did not.
  const recentMachines = ["DACS-2745","TS600-2877","SL12-8830","VP2-6934","MCX4-6618","CCW-73310","TS600-3988","DACS-2512","VP2-7780","TS600-4102","MCX4-8156"];
  QBH.forEach((r, i) => {
    const mid = recentMachines[i % recentMachines.length], m = S.machines[mid];
    const d = r[4] ? addDays(r[4], -1) : "2026-09-24";
    const pp = partsFor(m.model); const part = pp.length ? pp[i % pp.length] : null;
    const j = J({id:r[0], cust:m.cust, site:m.site, machine:mid, date:d, start:"09:30", eng:engBySkill(m.model), issue:faults[m.model][i % faults[m.model].length],
      resolution:resolutions[i % resolutions.length], parts: part ? [{sku:part[0], qty:1, from:"main"}] : [], actual:90 + (i % 4) * 25, travel:40 + (i % 5) * 15,
      status: r[2] === "Paid" ? "Closed" : "Sent to QuickBooks"});
    j.parts.forEach(p => p.from = S.engineers[j.eng].van);
    j.report = {summary:j.resolution, by:j.eng, d:j.date}; j.signoff = {name:(S.customers[j.cust].contacts[0] || {}).name, d:j.date};
    j.qb = {ref:r[1], status:r[2], value:r[3], sentD: r[4] ? addDays(r[4], 0) : "2026-09-25", sentT:"16:40", invoiceD:r[4], paidD:r[5], invoiceNo: r[2] !== "Sent" ? "INV-" + (6100 + i) : null};
    j.timeline = [tl(j.date, "09:30", "Completed by " + S.engineers[j.eng].name, S.engineers[j.eng].name, "engineer"),
      tl(j.qb.sentD, "16:40", "Sent to QuickBooks as " + r[1], "Brian Kearney", "person")];
    if (r[4]) j.timeline.push(tl(r[4], "18:00", "QuickBooks: invoiced " + j.qb.invoiceNo, "QuickBooks", "qb"));
    if (r[5]) j.timeline.push(tl(r[5], "18:00", "QuickBooks: paid", "QuickBooks", "qb"));
  });

  /* Friday's completed jobs: 5 ready for invoice (est. €14,680) and 1 needing review. */
  const FRI = "2026-09-25";
  // [job, customer, site, machine, engineer, issue, resolution, parts, est. value, minutes on site, travel minutes, start]
  const ready = [
    ["2481","ashfield","ashfield-mallow","DACS-2803","aoife","Rejecting good packs after the weekend clean","Load cell connector corroded. Replaced connector and proximity sensor, recalibrated, 500-pack verification.",[{sku:"GEN-PROX",qty:1,from:"van06"}],4120,195,38,"08:10"],
    ["2483","tullyvin","tullyvin-cavan","LP200-44982","david","Print fading on the right side","Print roller glazed. Replaced roller and drive belt, test run clean. Printhead still on order under #2476.",[{sku:"LP-PR107",qty:1,from:"van02"},{sku:"LP-BELT",qty:1,from:"van02"}],2860,164,175,"09:44"],
    ["2484","kerrigan","kerrigan-clonmel","SL12-8830","mark","Blade chatter on hard cheese","Blade and bearings replaced, guard interlock tested.",[{sku:"SL-BLD",qty:1,from:"van05"},{sku:"BRG-6204",qty:2,from:"van05"}],3315,210,52,"08:40"],
    ["2493","slaney","slaney-enniscorthy","MCX4-8156","shane","Annual validation and service","Validated at 1.5 mm Fe, 2.0 mm NFe, 2.5 mm SS. Certificate issued.",[{sku:"MC-TP15",qty:1,from:"van07"}],1905,150,138,"09:20"],
    ["2487","coastline","coastline-dungarvan","TS600-2877","declan","Seal not holding on the left edge","Seal gasket and heater contact replaced, seal tests passed.",[{sku:"ST-SEAL",qty:2,from:"van01"}],2480,175,58,"08:05"]
  ];
  ready.forEach(r => {
    const j = J({id:r[0], cust:r[1], site:r[2], machine:r[3], eng:r[4], date:FRI, start:r[11], issue:r[5], status:"Ready for Invoice",
      parts:r[7], actual:r[9], travel:r[10], estOverride:r[8], source:"Phone", resolution:r[6]});
    const end = hm(toMin(r[11]) + r[9]);
    j.report = {summary:r[6], by:r[4], d:FRI}; j.signoff = {name:(S.customers[r[1]].contacts[0] || {}).name, d:FRI};
    j.photos = 3;
    j.timeline = [tl("2026-09-24", "16:20", "Logged from a phone call", "Karen Nolan"), tl(FRI, r[11], S.engineers[r[4]].name + " started the job", S.engineers[r[4]].name, "engineer"),
      tl(FRI, end, "Completed and signed off on site", S.engineers[r[4]].name, "engineer"), tl(FRI, hm(toMin(end) + 1), "Checks passed: labour, travel, parts, report, photos, sign-off. Ready for invoice.", "Pulse", "system")];
  });
  const rev = J({id:"2485", cust:"murphy", site:"murphy-athlone", machine:"SL12-9051", eng:"gary", date:FRI, start:"13:00", issue:"Slice thickness varying on cooked ham", status:"Review Required",
    resolution:"Feed gate re-shimmed and carriage bearing replaced. Customer not on site at completion.", parts:[{sku:"BRG-6204",qty:1,from:"van03"}], actual:150, travel:45, source:"Email"});
  rev.report = {summary:rev.resolution, by:"gary", d:FRI}; rev.photos = 2; rev.signoff = null; rev.reviewReason = "Missing: customer confirmation (nobody on site to sign)";
  rev.timeline = [tl(FRI, "13:00", "Gary Doyle started the job", "Gary Doyle", "engineer"), tl(FRI, "15:30", "Completed on site", "Gary Doyle", "engineer"),
    tl(FRI, "15:31", "Held for review: no customer confirmation recorded", "Pulse", "system")];

  /* Open jobs waiting on parts (older). */
  const wait = [
    ["2476","tullyvin","tullyvin-cavan","LP200-44982","aoife","2026-09-22","Printhead burnt out, print missing on the left third","LP-PH107","RO-0329"],
    ["2482","atlantic","atlantic-galway","DACS-2512","david","2026-09-23","Load cell reading unstable, weights jumping ±6 g","IS-LC6","RO-0330"],
    ["2486","kildare","kildare-town","TS600-3988","declan","2026-09-25","Heater element open circuit, sealer down on line 1","ST-HEAT","RO-0332"]
  ];
  wait.forEach(w => { const j = J({id:w[0], cust:w[1], site:w[2], machine:w[3], eng:w[4], date:w[5], start:"10:00", issue:w[6], status:"Awaiting Part", possibleParts:[w[7]], awaiting:{sku:w[7], reorder:w[8]}, prio: w[0] === "2486" ? "High" : "Normal"});
    j.timeline = [tl(w[5], "10:00", S.engineers[w[4]].name + " diagnosed the fault on site", S.engineers[w[4]].name, "engineer"), tl(w[5], "10:40", "Waiting on " + w[7] + ". Reorder " + w[8] + " raised.", "Pat Hayes")]; });

  /* ---------- TODAY: Monday 28 September ---------- */
  const T = (o) => J(Object.assign({date:TODAY}, o));
  // The Glenmore request: drafted by the Service Coordinator, not yet confirmed.
  T({id:"2491", cust:"glenmore", site:"glenmore-naas", machine:"LP200-48023", prio:"High", status:"Unassigned", draft:true, source:"Email", requestId:"RQ-3107",
    contact:"Paul Byrne", skill:"Label systems", start:"08:45", dur:150,
    issue:"Label printer/applicator missing approximately two labels per minute while line running around 40 packs/min.",
    reported:"Label printer/applicator on Line 2 is missing labels at approximately 40 packs per minute.",
    possibleParts:["MX-44721"], aiClass:"Likely sensor/alignment issue",
    timeline:[tl(TODAY, "06:51", "Service request received by email from Paul Byrne", "Email", "system"),
      tl(TODAY, "06:53", "AI triage: Glenmore Foods, Naas, LabelPro LP200 (LP200-48023), high priority. Draft job created.", "Service Coordinator", "ai")]});
  T({id:"2492", cust:"freshpak", site:"freshpak-portlaoise", machine:"MCX4-8841", prio:"Urgent", status:"Travelling", eng:"david", source:"Phone", contact:"Niall Fitzgerald",
    skill:"Metal detection", start:"08:20", dur:150, billable:false, type:"Warranty",
    issue:"Metal detector faulting on start-up. Production line stopped.", reported:"Line 1 is stopped, the detector throws a fault as soon as the belt starts.",
    possibleParts:["MC-BELT","MC-77401"],
    timeline:[tl(TODAY, "06:56", "Phone call from Niall Fitzgerald: line 1 stopped", "Karen Nolan"), tl(TODAY, "06:57", "Under warranty (MCX4-8841, installed 14 Nov 2025). Billing set to warranty.", "Pulse", "system"),
      tl(TODAY, "06:58", "David Ryan assigned (Dispatch Assistant suggestion, confirmed by Karen Nolan)", "Karen Nolan"), tl(TODAY, "07:00", "David Ryan departed Myers base", "David Ryan", "engineer")]});
  T({id:"2490", cust:"coastline", site:"coastline-dungarvan", machine:"VP2-7415", prio:"Urgent", status:"Travelling", eng:"declan", source:"Manual", contact:"Fiona Power",
    skill:"Vacuum packing", start:"08:00", dur:120, issue:"Vacuum packer not reaching vacuum, packs rejected at QA.",
    possibleParts:["VP-GSK","VP-OIL"], timeline:[tl("2026-09-27", "19:40", "Logged by Karen Nolan from an out-of-hours call", "Karen Nolan"), tl(TODAY, "06:50", "Declan Byrne signed on", "Declan Byrne", "engineer")]});
  T({id:"2489", cust:"lakeside", site:"lakeside-nenagh", machine:"SL12-9377", prio:"Urgent", status:"Scheduled", eng:"mark", source:"Phone", contact:"Colm Hogan",
    skill:"Slicing", start:"09:20", dur:105, issue:"Slicer guard interlock tripping, slicer stopped mid-batch.", possibleParts:["GEN-PROX"],
    timeline:[tl("2026-09-27", "17:05", "Phone call from Colm Hogan", "Karen Nolan")]});
  T({id:"2488", cust:"greenfarm", site:"greenfarm-tullamore", machine:"LA300-20917", prio:"Normal", status:"Awaiting Part", eng:"gary", source:"Email", contact:"Orla Brennan",
    skill:"Mechanical", start:null, dur:90, issue:"Label applicator drive noisy, labels skewing on the tray.", possibleParts:["BRG-6204"], awaiting:{sku:"BRG-6204", reorder:"RO-0331"},
    timeline:[tl("2026-09-24", "15:20", "Gary Doyle diagnosed a failed drive bearing", "Gary Doyle", "engineer"), tl(TODAY, "06:20", "Bearing 6204-2RS unavailable in Van 03 and Main Stores. Delivery due tomorrow.", "Parts Assistant", "ai")]});
  T({id:"2494", cust:"ashfield", site:"ashfield-mallow", machine:null, prio:"Normal", status:"Scheduled", eng:"aoife", type:"Planned maintenance", billable:true, source:"Planned",
    skill:"Weighing", start:"08:00", dur:95, issue:"Planned maintenance, checkweigher (serial not recorded on booking).", dataIssue:"Machine serial number missing",
    timeline:[tl("2026-09-21", "11:00", "Planned visit booked by Karen Nolan", "Karen Nolan")]});
  T({id:"2495", cust:"harbour", site:"harbour-midleton", machine:"LP200-47110", prio:"Normal", status:"Scheduled", eng:"aoife", type:"Planned maintenance", source:"Planned",
    skill:"Label systems", start:"11:30", dur:95, issue:"Follow-up check after sensor replacement on 24 Sep, plus six-monthly service.",
    timeline:[tl("2026-09-24", "16:10", "Follow-up visit booked by Aoife Kelly", "Aoife Kelly", "engineer")]});
  T({id:"2496", cust:"murphy", site:"murphy-athlone", machine:null, prio:"Low", status:"Scheduled", eng:"sean", type:"Site measurement", billable:false, source:"Manual",
    skill:"Packaging lines", start:"13:15", dur:45, issue:"Measure the prep room for a proposed tray sealing line. For the quote, not chargeable.", contact:"Ger Murphy",
    timeline:[tl("2026-09-23", "10:30", "Visit booked by Tom Myers for a new-line quote", "Tom Myers")]});
  T({id:"2497", cust:"slaney", site:"slaney-enniscorthy", machine:"TS600-5230", prio:"Normal", status:"Travelling", eng:"shane", type:"Installation", billable:true, source:"Planned",
    skill:"Installations", start:"09:05", dur:455, issue:"Install and commission new Sealtek TS-600 on line 3.", contact:"Tadhg Nolan",
    timeline:[tl("2026-09-15", "12:00", "Installation booked by Tom Myers", "Tom Myers"), tl(TODAY, "06:40", "Shane Doherty departed Myers base", "Shane Doherty", "engineer")]});
  T({id:"2498", cust:"kerrigan", site:"kerrigan-clonmel", machine:"SL12-8830", prio:"Normal", status:"Scheduled", eng:"mark", type:"Planned maintenance", source:"Planned",
    skill:"Slicing", start:"13:30", dur:70, issue:"Planned maintenance and guard check after Friday’s blade change.", timeline:[tl("2026-09-25", "14:10", "Booked by Mark Kavanagh", "Mark Kavanagh", "engineer")]});
  T({id:"2499", cust:"burren", site:"burren-ennis", machine:"VP2-6934", prio:"Normal", status:"Scheduled", eng:"declan", type:"Planned maintenance", source:"Planned",
    skill:"Vacuum packing", start:"13:00", dur:90, issue:"Planned maintenance, pump oil change and gasket check.", timeline:[tl("2026-09-18", "09:00", "Booked by Karen Nolan", "Karen Nolan")]});
  T({id:"2500", cust:"glenmore", site:"glenmore-kilcullen", machine:"MCX4-8012", prio:"Normal", status:"Scheduled", eng:"gary", type:"Planned maintenance", source:"Planned",
    skill:"Metal detection", start:"10:00", dur:105, issue:"Planned maintenance and validation, metal detector.", timeline:[tl("2026-09-24", "15:40", "Moved to Gary while #2488 waits on its bearing", "Karen Nolan")]});

  /* --- service desk requests --- */
  S.requests = [
    {id:"RQ-3107", channel:"Email", at:"06:51", d:TODAY, from:"Paul Byrne", fromAddr:"paul.byrne@glenmorefoods.ie", subject:"Line 2 labeller missing labels",
     body:"Hi, label printer/applicator on Line 2 is missing labels at approximately 40 packs per minute. Roughly two a minute going through bare. We can run slower for now but need someone out today if at all possible. Serial on the plate is LP200-48023. Thanks, Paul (Naas)",
     status:"Triaged", job:"2491",
     ai:{cust:"glenmore", site:"glenmore-naas", machine:"LP200-48023", urgency:"High", cls:"Likely sensor/alignment issue", conf:{cust:.99, site:.96, machine:.99, urgency:.88},
       similar:["2211"], parts:["MX-44721"], action:"Engineer inspection required today", eng:"sean"}},
    {id:"RQ-3108", channel:"Phone", at:"07:00", d:TODAY, from:"Ronan Smyth, Tullyvin Bakery", fromAddr:"Phone transcript", subject:"Voicemail transcript",
     body:"Ronan in Tullyvin here. Just checking where we are with the printhead for the labeller, is it in yet? We are hand-labelling the sliced pans in the meantime. Call me back on 049 437 1182.",
     status:"New", ai:{cust:"tullyvin", site:"tullyvin-cavan", machine:"LP200-44982", urgency:"Normal", cls:"Update request on an open job", conf:{cust:.97, site:.97, machine:.9, urgency:.7},
       duplicateOf:"2476", parts:["LP-PH107"], action:"Link to Job #2476 and send the delivery date"}},
    {id:"RQ-3109", channel:"Website", at:"07:01", d:TODAY, from:"myers.ie service form", fromAddr:"Aidan Flaherty, Atlantic Catch", subject:"Service request: checkweigher",
     body:"Machine: checkweigher. Problem: still drifting after last week, plus the reject flap is slow. Urgency: this week. Contact: Aidan Flaherty 091 562 330.",
     status:"New", ai:{cust:"atlantic", site:"atlantic-galway", machine:null, urgency:"Normal", cls:"Recurring fault, likely linked to Job #2482 (load cell on order)", conf:{cust:.98, site:.98, machine:.55, urgency:.7},
       duplicateOf:"2482", parts:["IS-LC6"], action:"Confirm which checkweigher, then link to Job #2482", needsInfo:"Which checkweigher: the DACS-G on line 1 (DACS-2512)?"}},
    {id:"RQ-3106", channel:"Phone", at:"06:56", d:TODAY, from:"Niall Fitzgerald, FreshPak", fromAddr:"Service line", subject:"Line 1 stopped, metal detector fault",
     body:"Line 1 is stopped, the detector throws a fault as soon as the belt starts. We need someone straight away.", status:"Job created", job:"2492",
     ai:{cust:"freshpak", site:"freshpak-portlaoise", machine:"MCX4-8841", urgency:"Urgent", cls:"Breakdown, production stopped", conf:{cust:.99, site:.99, machine:.93, urgency:.97}, eng:"david"}},
    {id:"RQ-3105", channel:"Manual", at:"19:40", d:"2026-09-27", from:"Karen Nolan (out-of-hours call)", fromAddr:"Manual entry", subject:"Coastline vacuum packer",
     body:"Fiona Power called: VP-2 not reaching vacuum, packs failing QA. Wants someone first thing.", status:"Job created", job:"2490",
     ai:{cust:"coastline", site:"coastline-dungarvan", machine:"VP2-7415", urgency:"Urgent", cls:"Breakdown, vacuum level", conf:{cust:.99, site:.99, machine:.95, urgency:.9}, eng:"declan"}}
  ];

  /* --- warranty claims --- */
  S.claims = {};
  const WC = (o) => S.claims[o.id] = Object.assign({docs:[]}, o);
  WC({id:"W-1062", cust:"freshpak", machine:"MCX4-8841", part:"MC-77401", job:"2478", mfr:"MetalCheck", stage:"Credit due", status:"Awaiting credit", value:742, submitted:"2026-09-18",
    approved:"2026-09-25", ref:"MC-RMA-55120", note:"Approved by MetalCheck on 25 Sep. Credit note to follow."});
  WC({id:"W-1059", cust:"slaney", machine:"MCX4-8156", part:"MC-BELT", job:"2455", mfr:"MetalCheck", stage:"Awaiting manufacturer", status:"Submitted", value:388, submitted:"2026-09-07", due:"2026-09-21", overdue:true, ref:"MC-RMA-54982"});
  WC({id:"W-1060", cust:"freshpak", machine:"CCW-73310", part:"IS-LC6", job:"2461", mfr:"Ishida", stage:"Awaiting manufacturer", status:"Submitted", value:512, submitted:"2026-09-11", due:"2026-10-09", ref:"ISH-W-20771"});
  WC({id:"W-1063", cust:"glenmore", machine:"LP200-51188", part:"LP-PR107", job:"2466", mfr:"LabelPro", stage:"Active", status:"Preparing", value:161, submitted:null, note:"Old roller photographed, awaiting return label from LabelPro"});
  WC({id:"W-1061", cust:"funshion", machine:"VP2-7780", part:"VP-GSK", job:"2463", mfr:"VacuPak", stage:"Credit due", status:"Awaiting credit", value:94, submitted:"2026-09-14", approved:"2026-09-22", ref:"VP-88213"});
  WC({id:"W-1057", cust:"freshpak", machine:"TS600-4102", part:"ST-HEAT", job:"2433", mfr:"Sealtek", stage:"Closed", status:"Credited", value:436, submitted:"2026-08-19", approved:"2026-08-28", credited:"2026-09-04", ref:"SLT-4410"});
  WC({id:"W-1058", cust:"glenmore", machine:"LP200-51188", part:"LP-BELT", job:"2440", mfr:"LabelPro", stage:"Closed", status:"Credited", value:118, submitted:"2026-08-26", approved:"2026-09-02", credited:"2026-09-10", ref:"LP-CL-7781"});
  WC({id:"W-1055", cust:"ashfield", machine:"DACS-2803", part:"IS-BELT", job:"2419", mfr:"Ishida", stage:"Closed", status:"Rejected", value:201, submitted:"2026-08-05", ref:"ISH-W-20390", note:"Rejected: belt damage judged as wear, not a defect."});
  // Warranty jobs referenced by claims but not generated above.
  [["2455","slaney","MCX4-8156","2026-09-04","shane","Reject belt split at the joint","MC-BELT"],["2461","freshpak","CCW-73310","2026-09-09","aoife","Head 4 load cell failing","IS-LC6"],
   ["2466","glenmore","LP200-51188","2026-09-16","sean","Print roller delaminating","LP-PR107"],["2463","funshion","VP2-7780","2026-09-12","liam","Lid gasket split","VP-GSK"],
   ["2433","freshpak","TS600-4102","2026-08-18","declan","Heater element failed","ST-HEAT"],["2440","glenmore","LP200-51188","2026-08-25","gary","Drive belt snapped","LP-BELT"],
   ["2419","ashfield","DACS-2803","2026-08-04","aoife","Infeed belt worn","IS-BELT"]].forEach(r => {
    const m = S.machines[r[2]];
    const j = J({id:r[0], cust:r[1], site:m.site, machine:r[2], date:r[3], start:"10:00", eng:r[4], type:"Warranty", billable:false, issue:r[5], resolution:"Replaced under warranty, claim raised.",
      parts:[{sku:r[6], qty:1, from:S.engineers[r[4]].van}], actual:90, travel:70, status:"Closed"});
    j.report = {summary:j.resolution, by:r[4], d:r[3]}; j.signoff = {name:(S.customers[r[1]].contacts[0] || {}).name, d:r[3]};
    j.timeline = [tl(r[3], "10:00", "Completed under warranty by " + S.engineers[r[4]].name, S.engineers[r[4]].name, "engineer")];
    j.warranty = Object.keys(S.claims).find(k => S.claims[k].job === r[0]);
  });

  /* --- documents: every file is linked to at least one record --- */
  S.docs = {};
  let dn = 5100;
  const D = (o) => { const id = "D-" + (dn++); S.docs[id] = Object.assign({id, d:TODAY, t:"", by:"", size:"", links:{}}, o); return id; };
  Object.keys(MODELS).forEach(k => {
    const mm = MODELS[k];
    const man = D({kind:"Manual", name:mm.name + " operator and service manual", d:"2025-01-10", by:"Imported", size:"6.2 MB", links:{model:k}});
    Object.values(S.machines).filter(m => m.model === k).forEach(m => { S.machines[m.id].docs = (S.machines[m.id].docs || []).concat([man]); });
  });
  Object.values(S.machines).forEach(m => {
    if (MODELS[m.model].type === "Metal detector" && m.installed){ const c = D({kind:"Certificate", name:"Validation certificate, " + m.id, d:"2026-03-10", by:"Imported", size:"220 KB", links:{machine:m.id, cust:m.cust}}); m.docs.push(c); }
    if (m.installed){ const c = D({kind:"Certificate", name:"Installation and handover, " + m.id, d:m.installed, by:"Imported", size:"480 KB", links:{machine:m.id, cust:m.cust}}); m.docs.push(c); }
  });
  Object.values(S.jobs).forEach(j => {
    if (j.report && j.status !== "Unassigned"){ j.docs.push(D({kind:"Service report", name:"Service report, Job #" + j.id, d:j.date, t:"", by:S.engineers[j.eng].name, size:"180 KB", links:{job:j.id, machine:j.machine, cust:j.cust}})); }
  });
  ["2211","2402","2104"].forEach(id => { const j = S.jobs[id]; j.docs.push(D({kind:"Photo", name:"Machine photo, Line 2 labeller", d:j.date, by:S.engineers[j.eng].name, size:"2.1 MB", links:{job:j.id, machine:j.machine, cust:j.cust}})); });
  S.jobs["2211"].docs.push(D({kind:"Photo", name:"Old part: optical sensor MX-44721", d:"2026-02-03", by:"Gary Doyle", size:"1.8 MB", links:{job:"2211", machine:"LP200-48023", cust:"glenmore", part:"MX-44721"}}));
  ["2481","2483","2484","2493","2487"].forEach(id => { const j = S.jobs[id];
    j.docs.push(D({kind:"Photo", name:"Arrival photo, Job #" + id, d:j.date, t:"09:02", by:S.engineers[j.eng].name, size:"2.4 MB", links:{job:id, machine:j.machine, cust:j.cust}}));
    j.docs.push(D({kind:"Photo", name:"Completed work, Job #" + id, d:j.date, t:"12:30", by:S.engineers[j.eng].name, size:"2.2 MB", links:{job:id, machine:j.machine, cust:j.cust}}));
    j.docs.push(D({kind:"Signature", name:"Customer sign-off, Job #" + id, d:j.date, t:"12:39", by:S.engineers[j.eng].name, size:"24 KB", links:{job:id, cust:j.cust}})); });
  // Warranty documents
  const wdocs = {"W-1062":["Claim form W-1062","Photo: failed board MC-77401","Service report, Job #2478","Validation certificate after repair"],
    "W-1059":["Claim form W-1059","Photo: split reject belt"], "W-1060":["Claim form W-1060","Load cell test readings"], "W-1063":["Photo: delaminated roller"],
    "W-1061":["Claim form W-1061","Photo: split gasket"], "W-1057":["Claim form W-1057","Credit note SLT-CN-2231"], "W-1058":["Claim form W-1058","Credit note LP-CN-1180"], "W-1055":["Claim form W-1055","Rejection letter"]};
  Object.keys(wdocs).forEach(w => { const c = S.claims[w]; wdocs[w].forEach(n => { const id = D({kind: n.indexOf("Photo") === 0 ? "Photo" : n.indexOf("Credit") === 0 ? "Credit note" : "Warranty", name:n, d:c.submitted || "2026-09-20", by:"Karen Nolan", size:"360 KB",
    links:{warranty:w, machine:c.machine, cust:c.cust, job:c.job, part: n.indexOf("Photo") === 0 ? c.part : undefined}}); c.docs.push(id); }); });
  // Quotes synced from QuickBooks (read-only)
  S.quotes = [
    {id:"QT-2291", cust:"murphy", title:"Tray sealing line, prep room (pending site measurement)", value:38600, status:"Draft in QuickBooks", d:"2026-09-23"},
    {id:"QT-2284", cust:"glenmore", title:"Second LabelPro LP200 for Line 3", value:14250, status:"Sent", d:"2026-09-15"},
    {id:"QT-2279", cust:"slaney", title:"Sealtek TS-600 supply and install", value:61400, status:"Accepted", d:"2026-08-28"}
  ];
  S.quotes.forEach(q => D({kind:"Quote", name:q.id + " " + q.title, d:q.d, by:"QuickBooks", size:"140 KB", links:{cust:q.cust, quote:q.id}}));

  /* --- engineer days: location events per engineer per day (September) --- */
  S.days = {};
  const place = (id) => id === "base" ? BASE.pos : S.sites[id].pos;
  const day = (eng, d) => { const k = eng + "|" + d; return S.days[k] = S.days[k] || {eng, d, ev:[]}; };
  const ev = (eng, d, o) => day(eng, d).ev.push(o);
  /* Build a whole day from a compact itinerary. stops: [siteId, arriveMin, departMin, jobId|null, billable] */
  function buildDay(eng, d, signOn, stops, backAt, extra){
    ev(eng, d, {t:signOn, type:"signon", place:"base"});
    let from = "base", dep = signOn + 8 + Math.floor(R() * 10);
    stops.forEach(s => {
      ev(eng, d, {t:dep, type:"depart", from, to:s[0], eta:s[1]});
      ev(eng, d, {t:s[1], type:"arrive", place:s[0]});
      if (s[3]){ ev(eng, d, {t:s[1] + 4, type:"jobStart", job:s[3]}); ev(eng, d, {t:s[2] - 6, type:"jobEnd", job:s[3], billable:s[4] !== false}); }
      from = s[0]; dep = s[2];
    });
    if (backAt != null){ ev(eng, d, {t:dep, type:"depart", from, to:"base", eta:backAt}); ev(eng, d, {t:backAt, type:"arrive", place:"base"}); ev(eng, d, {t:backAt + 12, type:"signoff", place:"base"}); }
    if (extra) extra.forEach(x => ev(eng, d, x));
    day(eng, d).ev.sort((a, b) => a.t - b.t);
  }
  // History for 1 to 25 September: a plausible day per engineer per weekday.
  const siteIds = Object.keys(S.sites);
  const nearSites = ["funshion-kilworth"], midSites = ["ashfield-mallow","harbour-midleton","kerrigan-clonmel","coastline-dungarvan","lakeside-nenagh"];
  const farSites = siteIds.filter(s => nearSites.indexOf(s) < 0 && midSites.indexOf(s) < 0);
  for (let dd = 1; dd <= 25; dd++){
    const d = "2026-09-" + pad(dd); if (weekday(d) === 0 || weekday(d) === 6) continue;
    ENGINEERS.forEach(e => {
      if (e.id === "liam" && (dd >= 21 || dd === 9)) return;       // annual leave from the 21st, and a day off
      const r = R();
      const on = toMin("06:40") + Math.floor(R() * 7) * 5;
      if (r < .34){ // workshop or local day: never leaves the zone
        const stops = R() < .5 ? [["funshion-kilworth", on + 40, on + 190, null, true]] : [];
        buildDay(e.id, d, on, stops, stops.length ? stops[0][2] + 12 : null, stops.length ? null : [{t:on + 540, type:"signoff", place:"base"}]);
        return;
      }
      if (r < .66){ // one nearby customer, back well inside five hours
        const s = ["ashfield-mallow","harbour-midleton","funshion-kilworth"][Math.floor(R() * 3)];
        const arr = on + 12 + driveMin(BASE.pos, place(s)), onsite = 80 + Math.floor(R() * 6) * 15;
        buildDay(e.id, d, on, [[s, arr, arr + onsite, null, true]], arr + onsite + driveMin(place(s), BASE.pos));
        return;
      }
      const long = r > .9;
      const pool = long ? farSites : midSites.concat(farSites.slice(0, 4));
      const n = long ? 2 : 1;
      let stops = [], t = on + 12, cur = BASE.pos;
      for (let i = 0; i < n; i++){
        const s = pool[Math.floor(R() * pool.length)]; if (stops.find(x => x[0] === s)) continue;
        const arr = t + driveMin(cur, place(s)), onsite = (long ? 150 : 110) + Math.floor(R() * 6) * 20;
        stops.push([s, arr, arr + onsite, null, R() > .12]); t = arr + onsite + (R() < .4 ? 25 : 5); cur = place(s);
      }
      buildDay(e.id, d, on, stops, t + driveMin(cur, BASE.pos));
    });
  }
  /* The three September exceptions from the brief. */
  // Sean, Thu 24 Sep: location unavailable 14:17 to 14:53.
  S.days["sean|2026-09-24"] = {eng:"sean", d:"2026-09-24", ev:[]};
  buildDay("sean", "2026-09-24", toMin("06:55"), [["lakeside-nenagh", toMin("08:32"), toMin("11:10"), null, true],["greenfarm-tullamore", toMin("12:22"), toMin("13:55"), null, true]], toMin("16:28"),
    [{t:toMin("14:17"), type:"gapStart"},{t:toMin("14:53"), type:"gapEnd"}]);
  // David, Fri 25 Sep: no return detected, last location 18:14.
  S.days["david|2026-09-25"] = {eng:"david", d:"2026-09-25", ev:[]};
  buildDay("david", "2026-09-25", toMin("06:45"), [["tullyvin-cavan", toMin("09:40"), toMin("12:30"), null, true],["glenmore-kilcullen", toMin("14:20"), toMin("16:35"), null, true]], null,
    [{t:toMin("16:35"), type:"depart", from:"glenmore-kilcullen", to:"base", eta:toMin("18:50")},{t:toMin("18:14"), type:"lastSeen", pos:along(BASE.pos, S.sites["glenmore-kilcullen"].pos, 58)}]);
  // Gary, Fri 25 Sep: engineer manually marked return 17:48.
  S.days["gary|2026-09-25"] = {eng:"gary", d:"2026-09-25", ev:[]};
  buildDay("gary", "2026-09-25", toMin("07:05"), [["greenfarm-tullamore", toMin("09:05"), toMin("12:10"), null, true],["murphy-athlone", toMin("12:55"), toMin("15:40"), null, true]], null,
    [{t:toMin("15:40"), type:"depart", from:"murphy-athlone", to:"base", eta:toMin("17:48")},{t:toMin("17:48"), type:"manualReturn", note:"Phone battery died on the M8. Back at base 17:48."}]);

  // Friday 25 Sep for the engineers whose completed jobs are waiting for QuickBooks.
  [["aoife","06:50",[["ashfield-mallow","08:04","11:40","2481"]],"13:05"],["mark","06:55",[["kerrigan-clonmel","08:36","12:20","2484"]],"13:20"],
   ["shane","06:45",[["slaney-enniscorthy","09:14","11:58","2493"]],"14:40"],["declan","06:48",[["coastline-dungarvan","07:59","11:10","2487"],["harbour-midleton","12:05","13:30",null]],"14:20"]].forEach(f => {
    S.days[f[0] + "|" + FRI] = {eng:f[0], d:FRI, ev:[]};
    buildDay(f[0], FRI, toMin(f[1]), f[2].map(s => [s[0], toMin(s[1]), toMin(s[2]), s[3], true]), toMin(f[3]));
  });
  // Link the exception days to the jobs they served.
  S.days["david|" + FRI].ev.filter(e => e.place === "tullyvin-cavan" && e.type === "arrive").forEach(e => { e.job = "2483"; });
  S.days["gary|" + FRI].ev.filter(e => e.place === "murphy-athlone" && e.type === "arrive").forEach(e => { e.job = "2485"; });

  /* Today. Everything before 07:02 has happened; the rest waits in the script and appears as the clock moves. */
  const X = (id) => S.sites[S.jobs[id].site].pos;
  const today = [];   // {eng, e:{...event}}
  const push = (eng, list) => list.forEach(e => today.push({eng, e}));
  push("david", [{t:toMin("06:41"), type:"signon", place:"base"},{t:toMin("07:00"), type:"depart", from:"base", to:"freshpak-portlaoise", eta:toMin("08:21"), job:"2492"},
    {t:toMin("08:21"), type:"arrive", place:"freshpak-portlaoise", job:"2492"},{t:toMin("08:27"), type:"jobStart", job:"2492"},
    {t:toMin("09:48"), type:"part", job:"2492", sku:"MC-BELT", qty:1, from:"van02"},{t:toMin("10:40"), type:"jobEnd", job:"2492", billable:false},
    {t:toMin("11:05"), type:"depart", from:"freshpak-portlaoise", to:"base", eta:toMin("12:34")},{t:toMin("12:34"), type:"arrive", place:"base"},{t:toMin("16:30"), type:"signoff", place:"base"}]);
  push("declan", [{t:toMin("06:50"), type:"signon", place:"base"},{t:toMin("06:58"), type:"depart", from:"base", to:"coastline-dungarvan", eta:toMin("07:56"), job:"2490"},
    {t:toMin("07:56"), type:"arrive", place:"coastline-dungarvan", job:"2490"},{t:toMin("08:02"), type:"jobStart", job:"2490"},
    {t:toMin("09:20"), type:"part", job:"2490", sku:"VP-GSK", qty:1, from:"van01"},{t:toMin("10:05"), type:"jobEnd", job:"2490", billable:true},
    {t:toMin("10:40"), type:"depart", from:"coastline-dungarvan", to:"burren-ennis", eta:toMin("13:02"), job:"2499"},{t:toMin("13:02"), type:"arrive", place:"burren-ennis", job:"2499"},
    {t:toMin("13:08"), type:"jobStart", job:"2499"},{t:toMin("14:35"), type:"jobEnd", job:"2499", billable:true},
    {t:toMin("14:48"), type:"depart", from:"burren-ennis", to:"base", eta:toMin("16:44")},{t:toMin("16:44"), type:"arrive", place:"base"},{t:toMin("16:56"), type:"signoff", place:"base"}]);
  push("mark", [{t:toMin("06:52"), type:"signon", place:"base"},{t:toMin("08:05"), type:"depart", from:"base", to:"lakeside-nenagh", eta:toMin("09:18"), job:"2489"},
    {t:toMin("09:18"), type:"arrive", place:"lakeside-nenagh", job:"2489"},{t:toMin("09:24"), type:"jobStart", job:"2489"},
    {t:toMin("10:31"), type:"part", job:"2489", sku:"GEN-PROX", qty:1, from:"van05"},{t:toMin("11:05"), type:"jobEnd", job:"2489", billable:true},
    {t:toMin("11:30"), type:"depart", from:"lakeside-nenagh", to:"kerrigan-clonmel", eta:toMin("12:52"), job:"2498"},{t:toMin("12:52"), type:"arrive", place:"kerrigan-clonmel", job:"2498"},
    {t:toMin("13:30"), type:"jobStart", job:"2498"},{t:toMin("14:38"), type:"jobEnd", job:"2498", billable:true},
    {t:toMin("14:50"), type:"depart", from:"kerrigan-clonmel", to:"base", eta:toMin("15:34")},{t:toMin("15:34"), type:"arrive", place:"base"},{t:toMin("16:30"), type:"signoff", place:"base"}]);
  push("gary", [{t:toMin("06:57"), type:"signon", place:"base"},{t:toMin("07:40"), type:"depart", from:"base", to:"glenmore-kilcullen", eta:toMin("09:32"), job:"2500"},
    {t:toMin("09:32"), type:"arrive", place:"glenmore-kilcullen", job:"2500"},{t:toMin("10:00"), type:"jobStart", job:"2500"},{t:toMin("11:44"), type:"jobEnd", job:"2500", billable:true},
    {t:toMin("12:05"), type:"depart", from:"glenmore-kilcullen", to:"base", eta:toMin("13:52")},{t:toMin("13:52"), type:"arrive", place:"base"},{t:toMin("16:30"), type:"signoff", place:"base"}]);
  push("aoife", [{t:toMin("06:55"), type:"signon", place:"base"},{t:toMin("07:24"), type:"depart", from:"base", to:"ashfield-mallow", eta:toMin("07:57"), job:"2494"},
    {t:toMin("07:57"), type:"arrive", place:"ashfield-mallow", job:"2494"},{t:toMin("08:03"), type:"jobStart", job:"2494"},{t:toMin("09:38"), type:"jobEnd", job:"2494", billable:true},
    {t:toMin("10:48"), type:"depart", from:"ashfield-mallow", to:"harbour-midleton", eta:toMin("11:24"), job:"2495"},{t:toMin("11:24"), type:"arrive", place:"harbour-midleton", job:"2495"},
    {t:toMin("11:30"), type:"jobStart", job:"2495"},{t:toMin("13:02"), type:"jobEnd", job:"2495", billable:true},
    {t:toMin("13:15"), type:"depart", from:"harbour-midleton", to:"base", eta:toMin("14:04")},{t:toMin("14:04"), type:"arrive", place:"base"},{t:toMin("16:30"), type:"signoff", place:"base"}]);
  push("shane", [{t:toMin("06:30"), type:"signon", place:"base"},{t:toMin("06:40"), type:"depart", from:"base", to:"slaney-enniscorthy", eta:toMin("09:02"), job:"2497"},
    {t:toMin("09:02"), type:"arrive", place:"slaney-enniscorthy", job:"2497"},{t:toMin("09:10"), type:"jobStart", job:"2497"},{t:toMin("16:10"), type:"jobEnd", job:"2497", billable:true},
    {t:toMin("16:20"), type:"depart", from:"slaney-enniscorthy", to:"base", eta:toMin("18:24")},{t:toMin("18:24"), type:"arrive", place:"base"},{t:toMin("18:30"), type:"signoff", place:"base"}]);
  push("sean", [{t:toMin("06:58"), type:"signon", place:"base"}]);
  // Split into what has already happened and what is still to come.
  S.script = [];
  today.sort((a, b) => a.e.t - b.e.t).forEach(x => { if (x.e.t <= S.clock) ev(x.eng, TODAY, x.e); else S.script.push(x); });
  Object.keys(S.days).forEach(k => S.days[k].ev.sort((a, b) => a.t - b.t));
  // Awaiting-part engineer on leave: Liam has an entry so his status reads "On leave".
  S.days["liam|" + TODAY] = {eng:"liam", d:TODAY, ev:[], leave:true};

  /* --- subsistence rules (configurable) and review state --- */
  S.rules = {
    subsistence:{base:"Myers Food Machinery (main yard)", radius:10, bands:[{min:5, amount:20},{min:10, amount:50}], note:"Illustrative figures from the meeting. Confirm with payroll before go-live."},
    tracking:{from:"07:00", to:"18:30", reason:"Dispatch, job verification and subsistence", retention:90},
    invoice:{labour:85, travel:65, callout:95, checks:["labour","travel","parts","report","photos","signoff"]},
    stock:{vanMinimums:true, reorderOnTotal:true}
  };
  S.subReview = {};   // "eng|date" -> {status:"Reviewed"|"Confirmed", by, t}
  // Earlier weeks already reviewed by Karen.
  Object.keys(S.days).forEach(k => { const d = S.days[k].d; if (d < "2026-09-21") S.subReview[k] = {status:"Reviewed", by:"Karen Nolan", t:"2026-09-21 09:10"}; });

  /* --- activity (audit trail, newest last) and AI actions --- */
  S.activity = [];
  const A = (d, t, actor, kind, text, refs) => S.activity.push({d, t, actor, kind, text, refs: refs || []});
  A("2026-09-25", "12:41", "Pulse", "system", "Jobs #2481, #2483, #2484, #2493 and #2487 passed completion checks and moved to Ready for Invoice", [{type:"job", id:"2481"}]);
  A("2026-09-25", "15:31", "Pulse", "system", "Job #2485 held for review: no customer confirmation recorded", [{type:"job", id:"2485"}]);
  A("2026-09-25", "16:40", "Brian Kearney", "person", "Sent Job #2480 to QuickBooks as QB-10427", [{type:"job", id:"2480"}]);
  A("2026-09-25", "18:14", "Pulse", "system", "No return detected for David Ryan. Last location 18:14, outside the qualifying zone", [{type:"engineer", id:"david"}]);
  A("2026-09-25", "18:20", "Gary Doyle", "engineer", "Manually marked return to base at 17:48", [{type:"engineer", id:"gary"}]);
  A("2026-09-27", "19:40", "Karen Nolan", "person", "Logged Job #2490 for Coastline Seafoods from an out-of-hours call", [{type:"job", id:"2490"}]);
  A(TODAY, "06:20", "Parts Assistant", "ai", "Checked #2488: bearing 6204-2RS not in Van 03 or Main Stores. RO-0331 due tomorrow", [{type:"job", id:"2488"},{type:"part", id:"BRG-6204"}]);
  A(TODAY, "06:30", "Shane Doherty", "engineer", "Signed on", [{type:"engineer", id:"shane"}]);
  A(TODAY, "06:40", "Shane Doherty", "engineer", "Departed for Slaney Valley Poultry, Job #2497", [{type:"job", id:"2497"}]);
  A(TODAY, "06:41", "David Ryan", "engineer", "Signed on", [{type:"engineer", id:"david"}]);
  A(TODAY, "06:50", "Declan Byrne", "engineer", "Signed on", [{type:"engineer", id:"declan"}]);
  A(TODAY, "06:51", "Email", "system", "Service request received from Paul Byrne, Glenmore Foods", [{type:"request", id:"RQ-3107"}]);
  A(TODAY, "06:52", "Mark Kavanagh", "engineer", "Signed on", [{type:"engineer", id:"mark"}]);
  A(TODAY, "06:53", "Service Coordinator", "ai", "Triaged RQ-3107: Glenmore Foods, Naas, LabelPro LP200 LP200-48023, high. Draft Job #2491 created", [{type:"request", id:"RQ-3107"},{type:"job", id:"2491"}]);
  A(TODAY, "06:53", "Machine Expert", "ai", "Machine history retrieved for LP200-48023: optical sensor replaced 03 Feb for the same symptom", [{type:"machine", id:"LP200-48023"}]);
  A(TODAY, "06:55", "Aoife Kelly", "engineer", "Signed on", [{type:"engineer", id:"aoife"}]);
  A(TODAY, "06:56", "Karen Nolan", "person", "Logged FreshPak breakdown from a phone call. Job #2492, urgent", [{type:"job", id:"2492"}]);
  A(TODAY, "06:57", "Gary Doyle", "engineer", "Signed on", [{type:"engineer", id:"gary"}]);
  A(TODAY, "06:58", "Karen Nolan", "person", "Assigned David Ryan to Job #2492 (Dispatch Assistant suggestion)", [{type:"job", id:"2492"}]);
  A(TODAY, "06:58", "Sean Murphy", "engineer", "Signed on", [{type:"engineer", id:"sean"}]);
  A(TODAY, "06:58", "Declan Byrne", "engineer", "Departed for Coastline Seafoods, Job #2490", [{type:"job", id:"2490"}]);
  A(TODAY, "07:00", "David Ryan", "engineer", "Departed for FreshPak, Job #2492", [{type:"job", id:"2492"}]);
  A(TODAY, "07:01", "Operations Watchdog", "ai", "Morning checks: 3 subsistence exceptions from last week, 5 jobs ready for QuickBooks, 1 job missing a machine serial", []);

  S.ai = [   // AI actions: what each agent did or proposed
    {id:"AI-1", agent:"coordinator", d:TODAY, t:"06:53", text:"Triaged RQ-3107 and drafted Job #2491 for Glenmore Foods", status:"Awaiting confirmation", refs:[{type:"job", id:"2491"}]},
    {id:"AI-2", agent:"dispatch", d:TODAY, t:"06:53", text:"Recommended Sean Murphy for Job #2491: LabelPro certified, MX-44721 in Van 04, free until 13:15", status:"Awaiting confirmation", refs:[{type:"job", id:"2491"},{type:"engineer", id:"sean"}]},
    {id:"AI-3", agent:"dispatch", d:TODAY, t:"06:57", text:"Recommended David Ryan for Job #2492 FreshPak: MetalCheck certified, nearest free engineer", status:"Accepted by Karen Nolan", refs:[{type:"job", id:"2492"}]},
    {id:"AI-4", agent:"machine", d:TODAY, t:"06:53", text:"Matched the Glenmore symptom to Job #2211 (optical sensor, 03 Feb)", status:"Done", refs:[{type:"machine", id:"LP200-48023"},{type:"job", id:"2211"}]},
    {id:"AI-5", agent:"parts", d:TODAY, t:"06:20", text:"Flagged #2488 waiting on bearing 6204-2RS, due tomorrow on RO-0331", status:"Done", refs:[{type:"job", id:"2488"}]},
    {id:"AI-6", agent:"watchdog", d:TODAY, t:"07:01", text:"Raised 3 subsistence exceptions, 1 missing serial and 1 overdue warranty response", status:"Done", refs:[]},
    {id:"AI-7", agent:"coordinator", d:TODAY, t:"07:01", text:"Matched RQ-3108 (Tullyvin voicemail) to open Job #2476", status:"Awaiting confirmation", refs:[{type:"request", id:"RQ-3108"},{type:"job", id:"2476"}]},
    {id:"AI-8", agent:"watchdog", d:"2026-09-25", t:"18:20", text:"Flagged Gary Doyle’s manual return time for manager confirmation", status:"Done", refs:[{type:"engineer", id:"gary"}]}
  ];

  S.resolved = {};    // needs-attention items dismissed by a person
  S.qbNext = 10428;   // next QuickBooks reference
  S.jobNext = 2501;
  S.docNext = dn;
  S.reorderNext = 334;
  S.claimNext = 1064;
  S.integrations = {qb:{lastSync:"07:00", status:"Connected"}};
  return S;
};
})();
