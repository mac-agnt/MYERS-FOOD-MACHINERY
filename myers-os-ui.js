/* Myers Service OS: shell, styles and shared UI primitives.
   Mounted beside the Pulse page and shown over its main area when one of the
   Service OS rail items is active. Plain React.createElement, no build step. */
(function(){
"use strict";
const MOS = window.MOS = window.MOS || {};
const R = window.React, h = R.createElement, F = R.Fragment;
const {useState, useEffect, useRef, useMemo} = R;
MOS.h = h; MOS.F = F;

/* ---------- styles ---------- */
const CSS = `
.os-root{position:fixed;top:0;bottom:0;right:0;z-index:40;background:var(--bg);color:var(--ink);font-family:'Instrument Sans',system-ui,sans-serif;
  display:flex;flex-direction:column;font-size:13px;line-height:1.45;-webkit-font-smoothing:antialiased}
.os-root *{box-sizing:border-box}
.os-root button{font-family:inherit}
.os-glow{position:absolute;inset:0;pointer-events:none;background:radial-gradient(900px 500px at 20% -10%,var(--glow-a),transparent 70%),radial-gradient(700px 600px at 110% 110%,var(--glow-b),transparent 70%)}
.os-top{position:relative;z-index:2;flex:none;display:flex;align-items:center;gap:12px;padding:14px 22px 12px}
.os-crumb{display:flex;align-items:center;gap:10px;min-width:0}
.os-crumb h1{margin:0;font-size:19px;font-weight:600;letter-spacing:-.01em;white-space:nowrap}
.os-crumb .sub{color:var(--dim);font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.os-tabs{display:inline-flex;gap:2px;padding:3px;border:1px solid var(--border);border-radius:999px;background:var(--surface);backdrop-filter:blur(20px)}
.os-tab{height:30px;padding:0 13px;border:0;border-radius:999px;background:none;color:var(--dim);cursor:pointer;font-size:12.5px;display:flex;align-items:center;gap:7px;transition:background .2s var(--ease),color .2s var(--ease)}
.os-tab:hover{color:var(--ink)}
.os-tab.on{background:var(--pill-bg);color:var(--pill-ink)}
.os-tab .n{font-family:'IBM Plex Mono',monospace;font-size:10px;opacity:.7}
.os-roles{margin-left:auto;display:flex;align-items:center;gap:8px}
.os-roles select{height:32px;border-radius:999px;border:1px solid var(--border);background:var(--surface);color:var(--ink);padding:0 12px;font:inherit;font-size:12.5px;cursor:pointer}
.os-roles select option{background:var(--bg)}
.os-body{position:relative;z-index:1;flex:1;min-height:0;overflow:auto;padding:4px 22px 40px}
.os-body::-webkit-scrollbar{width:10px}.os-body::-webkit-scrollbar-thumb{background:var(--track);border-radius:10px}
.os-grid{display:grid;gap:14px}
.os-card{background:var(--surface);border:1px solid var(--border);border-radius:16px;backdrop-filter:blur(24px)}
.os-card.pad{padding:16px 18px}
.os-card h3{margin:0 0 2px;font-size:13.5px;font-weight:600}
.os-card .hd{display:flex;align-items:center;gap:10px;padding:14px 18px 10px}
.os-card .hd .sp{flex:1}
.os-card .hd p{margin:0;color:var(--dim);font-size:12px}
.os-mono{font-family:'IBM Plex Mono',monospace;font-size:11.5px}
.os-dim{color:var(--dim)}.os-faint{color:var(--faint)}
.os-kpi{padding:14px 16px;cursor:pointer;transition:border-color .2s var(--ease),background .2s var(--ease)}
.os-kpi:hover{border-color:var(--border-strong);background:var(--surface-2)}
.os-kpi .l{color:var(--dim);font-size:12px}
.os-kpi .v{font-size:26px;font-weight:600;letter-spacing:-.02em;margin-top:4px;font-variant-numeric:tabular-nums}
.os-kpi .s{color:var(--faint);font-size:11.5px;margin-top:2px}
.os-t{width:100%;border-collapse:collapse}
.os-t th{text-align:left;font-weight:500;color:var(--faint);font-size:11px;padding:8px 12px;border-bottom:1px solid var(--border);white-space:nowrap}
.os-t td{padding:10px 12px;border-bottom:1px solid var(--border);vertical-align:middle}
.os-t tr:last-child td{border-bottom:0}
.os-t tr.click{cursor:pointer}.os-t tr.click:hover td{background:var(--surface-faint)}
.os-t tr.sel td{background:var(--accent-faint)}
.os-t td.num,.os-t th.num{text-align:right;font-variant-numeric:tabular-nums}
.os-b{display:inline-flex;align-items:center;gap:5px;height:21px;padding:0 8px;border-radius:999px;font-size:11px;font-weight:500;white-space:nowrap;background:var(--track);color:var(--body)}
.os-b.ok{background:var(--ok-soft);color:var(--ok)}.os-b.warn{background:var(--warn-soft);color:var(--warn)}.os-b.bad{background:var(--bad-soft);color:var(--bad)}
.os-b.acc{background:var(--accent-soft);color:var(--accent)}.os-b.line{background:none;border:1px solid var(--border-strong);color:var(--dim)}
.os-btn{height:32px;padding:0 13px;border-radius:999px;border:1px solid var(--border-strong);background:var(--surface-2);color:var(--ink);cursor:pointer;font-size:12.5px;display:inline-flex;align-items:center;gap:7px;white-space:nowrap;transition:background .18s var(--ease),border-color .18s var(--ease),transform .12s var(--ease)}
.os-btn:hover{border-color:var(--accent-line)}
.os-btn:active{transform:translateY(1px)}
.os-btn.pri{background:var(--accent);border-color:var(--accent);color:var(--on-accent);font-weight:600}
.os-btn.pri:hover{background:var(--accent-hover)}
.os-btn.ghost{background:none;border-color:transparent;color:var(--dim)}.os-btn.ghost:hover{color:var(--ink);background:var(--surface)}
.os-btn.sm{height:26px;padding:0 10px;font-size:11.5px}
.os-btn[disabled]{opacity:.45;cursor:not-allowed}
.os-in,.os-sel,.os-ta{width:100%;height:34px;border-radius:10px;border:1px solid var(--border-strong);background:var(--surface-faint);color:var(--ink);padding:0 11px;font:inherit;font-size:13px;outline:none}
.os-ta{height:auto;min-height:74px;padding:9px 11px;resize:vertical;line-height:1.45}
.os-in:focus,.os-sel:focus,.os-ta:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.os-sel option{background:var(--bg)}
.os-lbl{display:block;font-size:11.5px;color:var(--dim);margin:0 0 5px}
.os-field{margin-bottom:12px}
.os-av{width:26px;height:26px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;color:#0c1218;flex:none}
.os-prov{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--faint);font-family:'IBM Plex Mono',monospace}
.os-prov i{width:5px;height:5px;border-radius:50%;background:var(--accent);display:inline-block}
.os-drawer-scrim{position:absolute;inset:0;z-index:30;background:var(--scrim);animation:osFade .2s var(--ease) both}
.os-drawer{position:absolute;top:10px;right:10px;bottom:10px;z-index:31;width:min(620px,calc(100% - 20px));background:var(--overlay);border:1px solid var(--border-strong);border-radius:18px;
  backdrop-filter:blur(30px);display:flex;flex-direction:column;box-shadow:0 30px 80px rgba(0,0,0,.35);animation:osIn .28s cubic-bezier(.2,.8,.2,1) both}
.os-drawer .dh{flex:none;padding:16px 18px 12px;border-bottom:1px solid var(--border);display:flex;gap:12px;align-items:flex-start}
.os-drawer .db{flex:1;overflow:auto;padding:14px 18px 20px}
.os-drawer .df{flex:none;padding:12px 84px 12px 18px;border-top:1px solid var(--border);display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}
@keyframes osIn{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:none}}
@keyframes osFade{from{opacity:0}to{opacity:1}}
@keyframes osUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes osPulse{0%,100%{opacity:1}50%{opacity:.35}}
.os-anim{animation:osUp .32s cubic-bezier(.2,.8,.2,1) both}
.os-toasts{position:absolute;right:20px;bottom:84px;z-index:60;display:flex;flex-direction:column;gap:8px;width:360px;pointer-events:none}
.os-toast{pointer-events:auto;padding:11px 14px;border-radius:14px;background:var(--tooltip);color:var(--tooltip-ink);border:1px solid var(--border);box-shadow:0 18px 40px rgba(0,0,0,.35);animation:osUp .3s cubic-bezier(.2,.8,.2,1) both;display:flex;gap:10px}
.os-toast b{font-weight:600;font-size:12.5px;display:block}
.os-toast span{font-size:11.5px;opacity:.72;display:block;margin-top:2px}
.os-toast .dot{width:8px;height:8px;border-radius:50%;margin-top:5px;flex:none;background:var(--ok)}
.os-toast.flow .dot{background:var(--accent)}.os-toast.warn .dot{background:var(--warn)}.os-toast.info .dot{background:var(--dim)}
.os-empty{padding:28px;text-align:center;color:var(--dim)}
.os-split{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:14px}
.os-row{display:flex;align-items:center;gap:10px}
.os-wrap{flex-wrap:wrap}
.os-sp{flex:1}
.os-bar{height:6px;border-radius:6px;background:var(--track);overflow:hidden}
.os-bar i{display:block;height:100%;border-radius:6px;background:var(--accent);transition:transform .5s var(--ease);transform-origin:left}
.os-kan{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(196px,1fr);gap:12px;overflow-x:auto;padding-bottom:8px}
.os-col{background:var(--surface-faint);border:1px solid var(--border);border-radius:16px;padding:10px;min-height:200px}
.os-col .ch{display:flex;align-items:center;gap:8px;padding:2px 4px 10px;font-weight:600;font-size:12.5px}
.os-kc{background:var(--surface-2);border:1px solid var(--border);border-radius:12px;padding:11px 12px;margin-bottom:8px;cursor:pointer;transition:border-color .18s var(--ease),transform .18s var(--ease)}
.os-kc:hover{border-color:var(--accent-line);transform:translateY(-1px)}
.os-kc.new{box-shadow:0 0 0 1px var(--accent-line)}
.os-tl{position:relative;padding-left:16px}
.os-tl:before{content:"";position:absolute;left:4px;top:4px;bottom:4px;width:1px;background:var(--border-strong)}
.os-tl .e{position:relative;padding:0 0 12px}
.os-tl .e:before{content:"";position:absolute;left:-15px;top:5px;width:7px;height:7px;border-radius:50%;background:var(--dim)}
.os-tl .e.app:before{background:var(--accent)}.os-tl .e.geofence:before{background:var(--ok)}.os-tl .e.system:before,.os-tl .e.agent:before{background:var(--warn)}
.os-chip{display:inline-flex;align-items:center;height:22px;padding:0 9px;border-radius:999px;font-size:11px;border:1px solid var(--border-strong);color:var(--body);background:var(--surface-faint);white-space:nowrap}
.os-chip.acc{border-color:var(--accent-line);color:var(--accent);background:var(--accent-faint)}
.os-seg{display:inline-flex;border:1px solid var(--border-strong);border-radius:999px;padding:2px}
.os-seg button{height:26px;border:0;background:none;color:var(--dim);padding:0 11px;border-radius:999px;cursor:pointer;font-size:12px}
.os-seg button.on{background:var(--accent-soft);color:var(--accent)}
.os-live{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--ok);animation:osPulse 1.6s ease-in-out infinite}
.os-confirm{border:1px solid var(--accent-line);background:var(--accent-faint);border-radius:14px;padding:12px 14px}
.os-confirm .k{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.08em;color:var(--accent)}
@media (prefers-reduced-motion: reduce){.os-root *{animation:none!important;transition:none!important}}
`;

/* ---------- primitives ---------- */
const cx = (...a) => a.filter(Boolean).join(" ");
function Badge(p){ return h("span", {className:cx("os-b", p.k)}, p.children); }
function Btn(p){ const {k, sm, ...rest} = p; return h("button", Object.assign({className:cx("os-btn", k, sm && "sm")}, rest)); }
function Card(p){ return h("div", {className:cx("os-card", p.pad && "pad", p.className), style:p.style, onClick:p.onClick}, p.children); }
function CardHead(p){ return h("div", {className:"hd"}, h("div", null, h("h3", null, p.title), p.sub ? h("p", null, p.sub) : null), h("div", {className:"sp"}), p.right || null); }
function Kpi(p){ return h("div", {className:"os-card os-kpi", onClick:p.onClick}, h("div", {className:"l"}, p.label), h("div", {className:"v", style:{color:p.color || "var(--ink)"}}, p.value), p.sub ? h("div", {className:"s"}, p.sub) : null); }
function Av(p){ const e = typeof p.e === "string" ? MOS.q.eng(p.e) : p.e; if (!e) return h("span", {className:"os-av", style:{background:"var(--track)", color:"var(--dim)"}}, "?");
  return h("span", {className:"os-av", title:e.name, style:{background:e.tint, width:p.s || 26, height:p.s || 26, fontSize:(p.s || 26) * .38}}, e.initials); }
function Prov(p){ return h("div", {className:"os-prov", style:p.style}, h("i"), p.children); }
function Tabs(p){ return h("div", {className:"os-tabs"}, p.items.map(t => h("button", {key:t[0], className:cx("os-tab", p.value === t[0] && "on"), onClick:() => p.onChange(t[0])}, t[1], t[2] != null ? h("span", {className:"n"}, t[2]) : null))); }
function Seg(p){ return h("div", {className:"os-seg"}, p.items.map(t => h("button", {key:t[0], className:p.value === t[0] ? "on" : "", onClick:() => p.onChange(t[0])}, t[1]))); }
function Bar(p){ const v = Math.max(0, Math.min(1, p.v)); return h("div", {className:"os-bar", style:p.style}, h("i", {style:{transform:"scaleX(" + v + ")", background:p.color || (p.v > 1 ? "var(--bad)" : p.v > .9 ? "var(--warn)" : "var(--accent)")}})); }
function Field(p){ return h("div", {className:"os-field"}, h("label", {className:"os-lbl"}, p.label, p.hint ? h("span", {className:"os-faint", style:{marginLeft:6}}, p.hint) : null), p.children); }
function Drawer(p){
  useEffect(() => { const k = (e) => { if (e.key === "Escape") p.onClose(); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, []);
  return h(F, null, h("div", {className:"os-drawer-scrim", onClick:p.onClose}),
    h("div", {className:"os-drawer", style:p.wide ? {width:"min(820px,calc(100% - 20px))"} : null},
      h("div", {className:"dh"}, h("div", {style:{flex:1, minWidth:0}}, p.kicker ? h("div", {className:"os-mono os-faint", style:{marginBottom:3}}, p.kicker) : null,
        h("div", {style:{fontSize:17, fontWeight:600, letterSpacing:"-.01em"}}, p.title), p.sub ? h("div", {className:"os-dim", style:{marginTop:2}}, p.sub) : null),
        h(Btn, {k:"ghost", sm:true, onClick:p.onClose, "aria-label":"Close"}, "Close")),
      h("div", {className:"db"}, p.children),
      p.foot ? h("div", {className:"df"}, p.foot) : null));
}
function Table(p){
  return h("table", {className:"os-t"},
    h("thead", null, h("tr", null, p.cols.map((c, i) => h("th", {key:i, className:c.num ? "num" : "", style:c.w ? {width:c.w} : null}, c.t)))),
    h("tbody", null, p.rows.length ? p.rows.map((r, ri) => h("tr", {key:r.key || ri, className:cx(p.onRow && "click", p.sel && p.sel === r.key && "sel"), onClick:p.onRow ? () => p.onRow(r) : null},
      p.cols.map((c, i) => h("td", {key:i, className:c.num ? "num" : ""}, c.r(r))))) : h("tr", null, h("td", {colSpan:p.cols.length}, h("div", {className:"os-empty"}, p.empty || "Nothing here")))));
}
/* Confirmation bound to hashed arguments: the Pulse convention for write tools. */
function Confirm(p){
  return h("div", {className:"os-confirm os-anim"},
    h("div", {className:"os-row"}, h("span", {className:"k"}, "NEEDS YOUR YES · " + p.tool), h("span", {className:"os-sp"}), h("span", {className:"os-mono os-faint"}, "args " + MOS.util.hash(p.args))),
    h("div", {style:{margin:"6px 0 10px", color:"var(--body)"}}, p.summary),
    h("div", {className:"os-row"}, h(Btn, {k:"pri", sm:true, onClick:p.onYes}, p.yes || "Confirm"), h(Btn, {k:"ghost", sm:true, onClick:p.onNo}, "Not now")));
}
const PRIO = {P1:["P1 Breakdown","bad"], P2:["P2 Same day","warn"], P3:["P3 This week",""], P4:["P4 Planned","line"]};
function Prio(p){ const x = PRIO[p.p] || [p.p, ""]; return h(Badge, {k:x[1]}, x[0]); }
const STATUS_K = {New:"warn", Scheduled:"", Dispatched:"acc", Travelling:"acc", "On site":"ok", "In progress":"ok", "Awaiting parts":"bad", Completed:"ok", Reviewed:"acc", Invoiced:"line", Remote:"line"};
function St(p){ return h(Badge, {k:STATUS_K[p.s] || ""}, p.s); }

/* Ireland map with plotted points; offline, no tiles. */
function IrelandMap(p){
  const W = p.w || 420, H = p.h || 500, pad = 14;
  const lat0 = 55.45, lat1 = 51.35, lng0 = -10.6, lng1 = -5.4;
  const kx = (W - pad * 2) / ((lng1 - lng0) * 0.6), ky = (H - pad * 2) / (lat0 - lat1), k = Math.min(kx, ky);
  const X = (lng) => pad + (lng - lng0) * 0.6 * k, Y = (lat) => pad + (lat0 - lat) * k;
  const coast = MOS.geo.COAST.map(c => X(c[1]).toFixed(1) + "," + Y(c[0]).toFixed(1)).join(" ");
  return h("svg", {viewBox:"0 0 " + W + " " + H, width:"100%", style:{display:"block", maxHeight:p.maxH || H}},
    h("polygon", {points:coast, fill:"var(--surface-2)", stroke:"var(--border-strong)", strokeWidth:1, strokeLinejoin:"round"}),
    (p.lines || []).map((l, i) => h("polyline", {key:"l" + i, points:l.pts.map(q => X(q[1]).toFixed(1) + "," + Y(q[0]).toFixed(1)).join(" "), fill:"none", stroke:l.color || "var(--accent)", strokeWidth:1.6, strokeDasharray:l.dash ? "4 4" : null, opacity:l.op || .85})),
    (p.points || []).map((q, i) => h("g", {key:"p" + i, transform:"translate(" + X(q.pos[1]).toFixed(1) + "," + Y(q.pos[0]).toFixed(1) + ")", style:{cursor:q.onClick ? "pointer" : "default"}, onClick:q.onClick},
      q.kind === "eng" ? h(F, null, h("circle", {r:11, fill:q.color || "var(--accent)", stroke:"var(--bg)", strokeWidth:2}), h("text", {textAnchor:"middle", dy:3.5, fontSize:8.5, fontWeight:700, fill:"#0c1218"}, q.label))
        : q.kind === "base" ? h(F, null, h("rect", {x:-6, y:-6, width:12, height:12, rx:2, fill:"var(--ink)"}), h("text", {x:9, dy:4, fontSize:10, fill:"var(--dim)"}, q.label))
        : h(F, null, h("circle", {r:q.r || 5, fill:q.color || "var(--dim)", stroke:"var(--bg)", strokeWidth:1.5, opacity:q.op || 1}), q.label ? h("text", {x:8, dy:3.5, fontSize:9.5, fill:"var(--dim)"}, q.label) : null))));
}

MOS.ui = {cx, Badge, Btn, Card, CardHead, Kpi, Av, Prov, Tabs, Seg, Bar, Field, Drawer, Table, Confirm, Prio, St, IrelandMap};

/* ---------- hook: re-render on store change ---------- */
function useStore(){ const [, f] = useState(0); useEffect(() => MOS.subscribe(() => f(x => x + 1)), []); return MOS.get(); }
MOS.useStore = useStore;

/* ---------- module registry ---------- */
MOS.modules = MOS.modules || {};
MOS.order = ["tower","desk","dispatch","field","time","workshop","commercial","parts","warranty","assets"];
MOS.NAV = {tower:"OS:tower", desk:"OS:desk", dispatch:"OS:dispatch", field:"OS:field", time:"OS:time", workshop:"OS:workshop", commercial:"OS:commercial", parts:"OS:parts", warranty:"OS:warranty", assets:"OS:assets"};
MOS.ROLES = [["coordinator","Service coordinator","desk"],["engineer","Engineer (Eoin)","field"],["workshop","Workshop manager","workshop"],["stores","Stores and parts","parts"],["accounts","Accounts","commercial/invoicing"],["management","Management","tower"]];

/* routing inside a module: "module/tab/id" held in memory, rail picks the module */
let route = {mod:"tower", tab:null, id:null}; const routeL = new Set();
MOS.nav = function(path){
  const p = String(path).split("/"); route = {mod:p[0], tab:p[1] || null, id:p[2] || null};
  routeL.forEach(f => f());
  if (window.__pulse && window.__pulse.page !== "OS:" + p[0]) window.__pulse.go("OS:" + p[0]);
};
MOS.here = () => route;
MOS.setTab = (tab) => { route = Object.assign({}, route, {tab, id:null}); routeL.forEach(f => f()); };
MOS.open = (id) => { route = Object.assign({}, route, {id}); routeL.forEach(f => f()); };
function useRoute(){ const [, f] = useState(0); useEffect(() => { routeL.add(() => f(x => x + 1)); }, []); return route; }
MOS.useRoute = useRoute;

/* ---------- toasts ---------- */
function Toasts(){
  const [, f] = useState(0); useEffect(() => MOS.onToast(() => f(x => x + 1)), []);
  return h("div", {className:"os-toasts", "aria-live":"polite"}, MOS.toasts().map(t => h("div", {key:t.id, className:"os-toast " + t.kind}, h("i", {className:"dot"}), h("div", null, h("b", null, t.text), t.sub ? h("span", null, t.sub) : null))));
}

/* ---------- error boundary: one broken view never blanks the whole module ---------- */
class Boundary extends R.Component {
  constructor(p){ super(p); this.state = {err:null}; }
  static getDerivedStateFromError(err){ return {err}; }
  componentDidCatch(err){ console.error("[Service OS]", err); }
  componentDidUpdate(prev){ if (prev.k !== this.props.k && this.state.err) this.setState({err:null}); }
  render(){ return this.state.err ? h("div", {className:"os-card pad"}, h("b", null, "This view hit a problem."), h("div", {className:"os-dim"}, String(this.state.err.message || this.state.err))) : this.props.children; }
}

/* ---------- shell ---------- */
function Shell(p){
  const s = useStore(), r = useRoute();
  const mod = MOS.modules[r.mod];
  const bodyRef = useRef(null);
  useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = 0; }, [r.mod, r.tab]);
  if (!mod) return null;
  const tabs = mod.tabs ? mod.tabs(s) : null, tab = r.tab || (tabs ? tabs[0][0] : null);
  const role = MOS.ROLES.find(x => x[0] === s.role) || MOS.ROLES[0];
  return h("div", {className:"os-root", "data-theme":p.theme, style:{left:p.left}},
    h("div", {className:"os-glow"}),
    h("div", {className:"os-top"},
      h("div", {className:"os-crumb"}, h("h1", null, mod.title), h("span", {className:"sub"}, mod.sub)),
      tabs ? h("div", {style:{marginLeft:14}}, h(Tabs, {items:tabs, value:tab, onChange:(t) => MOS.setTab(t)})) : null,
      h("div", {className:"os-roles"},
        h("span", {className:"os-faint", style:{fontSize:12}}, "Viewing as"),
        h("select", {value:s.role, onChange:(e) => { const x = MOS.ROLES.find(y => y[0] === e.target.value); MOS.act.role(x[0]); if (x[0] === "engineer") MOS.act.fieldEng("eo"); MOS.nav(x[2]); }},
          MOS.ROLES.map(x => h("option", {key:x[0], value:x[0]}, x[1]))),
        h("button", {className:"os-btn ghost sm", title:"Put every number back to the starting position", onClick:() => { MOS.show && MOS.show(null); MOS.reset(); }}, "Reset demo"))),
    h("div", {className:"os-body", ref:bodyRef}, h(Boundary, {k:r.mod + "/" + tab}, h("div", {key:r.mod + "/" + tab, className:"os-anim"}, mod.render(s, tab, r.id)))),
    MOS.DrawerHost ? h(Boundary, {k:"drawer"}, h(MOS.DrawerHost)) : null,
    h(Toasts));
}

/* Mount once the Pulse page is up; follow its page, theme and rail width. */
function App(){
  const [page, setPage] = useState(null), [theme, setTheme] = useState("dark"), [left, setLeft] = useState(64);
  useEffect(() => {
    const nav = () => document.querySelector("nav");
    const measure = () => { const n = nav(); if (n){ const b = n.getBoundingClientRect(); setLeft(Math.round(b.right)); } };
    // The rail can be re-created when it opens, so measure after every page render too.
    MOS.sync = (pg, th) => { queueMicrotask(() => { setPage(pg); setTheme(th); measure(); }); requestAnimationFrame(measure); setTimeout(measure, 450); };
    const ro = new ResizeObserver(measure); const t = setInterval(() => { const n = nav(); if (n){ ro.observe(n); measure(); clearInterval(t); } }, 200);
    window.addEventListener("resize", measure);
    return () => { clearInterval(t); ro.disconnect(); window.removeEventListener("resize", measure); };
  }, []);
  if (!page || page.indexOf("OS:") !== 0 || !window.__pulse) return null;
  MOS.init(window.__pulse.data);
  const mod = page.slice(3);
  if (MOS.here().mod !== mod){ const cur = MOS.here(); MOS._silent = true; route = {mod, tab: cur.mod === mod ? cur.tab : null, id:null}; }
  return h(Shell, {theme, left});
}

function boot(){
  if (!document.getElementById("os-css")){ const st = document.createElement("style"); st.id = "os-css"; st.textContent = CSS; document.head.appendChild(st); }
  const el = document.createElement("div"); el.id = "myers-os"; document.body.appendChild(el);
  const root = window.ReactDOM.createRoot ? window.ReactDOM.createRoot(el) : null;
  if (root) root.render(h(App)); else window.ReactDOM.render(h(App), el);
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
