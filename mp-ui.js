/* Myers Pulse: shell, styles and shared UI primitives.
   Plain React.createElement, no build step. Pages register themselves in MP.pages.

   Page contract:
     MP.pages.jobs = {title:"Jobs", sub:"...", render:(route, S) => element, roles:["owner","manager"]}
     route = {page:"jobs", parts:["2491"], query:{view:"ready"}, path:"jobs/2491"}
   Navigation:  MP.go("jobs/2491")   ·   links to records: h(UI.Ref, {r:{type:"job", id:"2491"}})
   Primitives:  MP.ui.* (see the export list at the bottom of the primitives section)
*/
(function(){
"use strict";
const MP = window.MP;
const R = window.React, h = R.createElement, F = R.Fragment;
const {useState, useEffect, useRef, useMemo} = R;
MP.h = h; MP.F = F;

/* ---------- styles ---------- */
const CSS = `
:root{
--bg:#0c1218;--surface:rgba(255,255,255,.042);--surface-2:rgba(255,255,255,.062);--surface-3:rgba(255,255,255,.085);--surface-faint:rgba(255,255,255,.022);
--overlay:rgba(16,25,34,.94);--tooltip:rgba(22,32,42,.98);--tooltip-ink:#f5f8fa;
--border:rgba(214,228,236,.08);--border-strong:rgba(214,228,236,.16);
--ink:#f5f8fa;--body:#c4ced4;--dim:#9aabb5;--faint:#6f7f89;
--accent:#00b8d8;--on-accent:#06202d;--accent-hover:#2cc9e4;--accent-soft:rgba(0,184,216,.14);--accent-faint:rgba(0,184,216,.06);--accent-line:rgba(0,184,216,.36);
--ok:#6fd0a0;--ok-soft:rgba(111,208,160,.13);--warn:#e0b452;--warn-soft:rgba(224,180,82,.14);--bad:#ef7a66;--bad-soft:rgba(239,122,102,.14);
--track:rgba(214,228,236,.09);--scrim:rgba(4,8,12,.55);--pill-bg:#f5f8fa;--pill-ink:#0c1218;
--glow-a:rgba(10,38,56,.55);--glow-b:rgba(0,184,216,.05);--map-land:rgba(255,255,255,.05);--map-line:rgba(214,228,236,.18);
--ease:cubic-bezier(.2,.8,.2,1);--mono:'IBM Plex Mono',ui-monospace,monospace;--sans:'Instrument Sans',system-ui,sans-serif;
--phone-bg:#f2f5f7;--phone-card:#ffffff;--phone-ink:#0e161d;--phone-dim:#56656f;--phone-line:#dde4e9;--phone-acc:#007f98;}
[data-theme="light"]{
--bg:#f3f6f8;--surface:rgba(255,255,255,.82);--surface-2:rgba(255,255,255,.96);--surface-3:#ffffff;--surface-faint:rgba(255,255,255,.5);
--overlay:rgba(255,255,255,.97);--tooltip:rgba(17,24,32,.96);--tooltip-ink:#ffffff;
--border:rgba(17,24,32,.09);--border-strong:rgba(17,24,32,.18);
--ink:#111820;--body:#34424c;--dim:#5f6f79;--faint:#86959f;
--accent:#0089a3;--on-accent:#ffffff;--accent-hover:#00778e;--accent-soft:rgba(0,137,163,.1);--accent-faint:rgba(0,137,163,.05);--accent-line:rgba(0,137,163,.32);
--ok:#12794a;--ok-soft:rgba(18,121,74,.11);--warn:#8f5c14;--warn-soft:rgba(150,96,26,.12);--bad:#b3261e;--bad-soft:rgba(179,38,30,.1);
--track:rgba(17,24,32,.08);--scrim:rgba(17,24,32,.25);--pill-bg:#111820;--pill-ink:#ffffff;
--glow-a:rgba(0,137,163,.06);--glow-b:rgba(10,38,56,.04);--map-land:rgba(17,24,32,.04);--map-line:rgba(17,24,32,.16);}
*{box-sizing:border-box}
html,body{margin:0;height:100%;background:var(--bg);color:var(--ink)}
body{font-family:var(--sans);font-size:13px;line-height:1.45;-webkit-font-smoothing:antialiased}
button,input,select,textarea{font-family:inherit}
#app{height:100%}
.mp{display:flex;height:100vh;height:100dvh;overflow:hidden;position:relative;background:var(--bg)}
.mp-glow{position:absolute;inset:0;pointer-events:none;background:radial-gradient(900px 520px at 22% -12%,var(--glow-a),transparent 70%),radial-gradient(700px 600px at 110% 110%,var(--glow-b),transparent 70%)}
/* sidebar */
.mp-side{position:relative;z-index:3;flex:none;width:236px;display:flex;flex-direction:column;border-right:1px solid var(--border);background:var(--surface-faint);transition:width .22s var(--ease)}
.mp-side.slim{width:64px}
.mp-brand{display:flex;align-items:center;gap:10px;height:60px;padding:0 16px;flex:none}
.mp-logo{width:30px;height:30px;border-radius:9px;background:var(--accent);color:var(--on-accent);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex:none;letter-spacing:-.02em}
.mp-brand b{font-size:13.5px;font-weight:600;white-space:nowrap;letter-spacing:-.005em}
.mp-brand b span{display:block;font-size:11px;color:var(--faint);font-weight:400}
.mp-nav{flex:1;overflow-y:auto;overflow-x:hidden;padding:4px 10px 12px}
.mp-nav::-webkit-scrollbar{width:0}
.mp-grp{font-family:var(--mono);font-size:9.5px;letter-spacing:.12em;color:var(--faint);padding:14px 10px 5px;white-space:nowrap}
.mp-side.slim .mp-grp{font-size:0;padding:8px 0 4px;margin:0 12px;border-top:1px solid var(--border)}
.mp-side.slim .mp-grp:first-child{border-top:0}
.mp-it{position:relative;display:flex;align-items:center;gap:11px;width:100%;height:34px;padding:0 10px;border:0;border-radius:10px;background:none;color:var(--dim);cursor:pointer;font-size:13px;text-align:left;white-space:nowrap;transition:background .15s var(--ease),color .15s var(--ease)}
.mp-it:hover{background:var(--surface-2);color:var(--ink)}
.mp-it.on{background:var(--accent-soft);color:var(--ink)}
.mp-it.on svg{color:var(--accent)}
.mp-it svg{flex:none}
.mp-it .n{margin-left:auto;font-family:var(--mono);font-size:10.5px;min-width:18px;height:18px;padding:0 5px;border-radius:9px;display:inline-flex;align-items:center;justify-content:center;background:var(--track);color:var(--body)}
.mp-it .n.hot{background:var(--bad-soft);color:var(--bad)}
.mp-side.slim .mp-it{justify-content:center;padding:0}
.mp-side.slim .mp-it .lbl,.mp-side.slim .mp-it .n,.mp-side.slim .mp-brand b{display:none}
.mp-side.slim .mp-it .n.hot{display:block;position:absolute;top:5px;right:9px;min-width:7px;width:7px;height:7px;padding:0;font-size:0}
.mp-me{flex:none;display:flex;align-items:center;gap:10px;padding:12px 16px;border-top:1px solid var(--border)}
.mp-me b{font-weight:500;font-size:12.5px;display:block;white-space:nowrap}
.mp-me span{font-size:11px;color:var(--faint);white-space:nowrap}
.mp-side.slim .mp-me .txt{display:none}
.mp-tip{position:fixed;z-index:90;pointer-events:none;background:var(--tooltip);color:var(--tooltip-ink);font-size:12px;padding:6px 10px;border-radius:8px;white-space:nowrap;box-shadow:0 10px 30px rgba(0,0,0,.3)}
/* main */
.mp-main{position:relative;z-index:1;flex:1;min-width:0;display:flex;flex-direction:column}
.mp-top{flex:none;display:flex;align-items:center;gap:12px;height:60px;padding:0 22px;border-bottom:1px solid var(--border)}
.mp-top h1{margin:0;font-size:17px;font-weight:600;letter-spacing:-.01em;white-space:nowrap}
.mp-top .sub{color:var(--dim);font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.mp-top .sp{flex:1}
.mp-clock{display:inline-flex;align-items:center;gap:8px;height:30px;padding:0 11px;border-radius:999px;border:1px solid var(--border);background:var(--surface);font-family:var(--mono);font-size:11.5px;color:var(--body);white-space:nowrap}
.mp-body{flex:1;min-height:0;overflow:auto;padding:18px 22px 60px;scroll-behavior:smooth}
.mp-body::-webkit-scrollbar{width:10px}.mp-body::-webkit-scrollbar-thumb{background:var(--track);border-radius:10px}
.mp-page{max-width:1480px;margin:0 auto}
/* primitives */
.g{display:grid;gap:14px}
.card{background:var(--surface);border:1px solid var(--border);border-radius:16px;min-width:0}
.card.pad{padding:16px 18px}
.card.flat{background:none}
.ch{display:flex;align-items:center;gap:10px;padding:14px 18px 10px;min-height:48px}
.ch h3{margin:0;font-size:13.5px;font-weight:600}
.ch p{margin:1px 0 0;color:var(--dim);font-size:12px}
.ch .sp{flex:1}
.cb{padding:0 18px 16px}
.kpi{padding:14px 16px;cursor:pointer;transition:border-color .18s var(--ease),background .18s var(--ease);text-align:left;font:inherit;color:inherit;width:100%}
.kpi:hover{border-color:var(--border-strong);background:var(--surface-2)}
.kpi .l{color:var(--dim);font-size:11.5px;font-family:var(--mono);letter-spacing:.06em;text-transform:uppercase}
.kpi .v{font-size:27px;font-weight:600;letter-spacing:-.02em;margin-top:6px;font-variant-numeric:tabular-nums;line-height:1.1}
.kpi .s{color:var(--faint);font-size:11.5px;margin-top:3px}
.mono{font-family:var(--mono);font-size:11.5px}
.dim{color:var(--dim)}.faint{color:var(--faint)}.ink{color:var(--ink)}
.row{display:flex;align-items:center;gap:10px}.wrap{flex-wrap:wrap}.col{display:flex;flex-direction:column}
.sp1{flex:1}
.tbl{width:100%;border-collapse:collapse}
.tbl th{text-align:left;font-weight:500;color:var(--faint);font-size:11px;padding:9px 12px;border-bottom:1px solid var(--border);white-space:nowrap}
.tbl td{padding:10px 12px;border-bottom:1px solid var(--border);vertical-align:middle}
.tbl tr:last-child td{border-bottom:0}
.tbl tr.click{cursor:pointer}.tbl tr.click:hover td{background:var(--surface-faint)}
.tbl tr.sel td{background:var(--accent-faint)}
.tbl .num{text-align:right;font-variant-numeric:tabular-nums}
.tbl-wrap{overflow-x:auto}
.b{display:inline-flex;align-items:center;gap:5px;height:21px;padding:0 8px;border-radius:999px;font-size:11px;font-weight:500;white-space:nowrap;background:var(--track);color:var(--body)}
.b.ok{background:var(--ok-soft);color:var(--ok)}.b.warn{background:var(--warn-soft);color:var(--warn)}.b.bad{background:var(--bad-soft);color:var(--bad)}
.b.acc{background:var(--accent-soft);color:var(--accent)}.b.line{background:none;box-shadow:inset 0 0 0 1px var(--border-strong);color:var(--dim)}
.b.solid{background:var(--accent);color:var(--on-accent)}
.b .d{width:6px;height:6px;border-radius:50%;background:currentColor}
.btn{height:32px;padding:0 13px;border-radius:999px;border:1px solid var(--border-strong);background:var(--surface-2);color:var(--ink);cursor:pointer;font-size:12.5px;display:inline-flex;align-items:center;justify-content:center;gap:7px;white-space:nowrap;transition:background .15s var(--ease),border-color .15s var(--ease),transform .1s var(--ease)}
.btn:hover{border-color:var(--accent-line)}
.btn:active{transform:translateY(1px)}
.btn.pri{background:var(--accent);border-color:var(--accent);color:var(--on-accent);font-weight:600}
.btn.pri:hover{background:var(--accent-hover)}
.btn.ghost{background:none;border-color:transparent;color:var(--dim)}.btn.ghost:hover{color:var(--ink);background:var(--surface-2)}
.btn.danger{color:var(--bad);border-color:var(--bad-soft)}
.btn.sm{height:26px;padding:0 10px;font-size:11.5px}
.btn.lg{height:38px;padding:0 18px;font-size:13px}
.btn[disabled]{opacity:.4;cursor:not-allowed;transform:none}
.btn:focus-visible,.mp-it:focus-visible,.tab:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.in,.sel,.ta{width:100%;height:34px;border-radius:10px;border:1px solid var(--border-strong);background:var(--surface-faint);color:var(--ink);padding:0 11px;font-size:13px;outline:none}
.ta{height:auto;min-height:78px;padding:9px 11px;resize:vertical;line-height:1.45}
.in:focus,.sel:focus,.ta:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.in::placeholder,.ta::placeholder{color:var(--faint)}
.sel option{background:var(--bg);color:var(--ink)}
.lbl{display:block;font-size:11.5px;color:var(--dim);margin:0 0 5px}
.fld{margin-bottom:12px}
.av{border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-weight:600;color:#0c1218;flex:none}
.tabs{display:inline-flex;gap:2px;padding:3px;border:1px solid var(--border);border-radius:999px;background:var(--surface)}
.tab{height:28px;padding:0 12px;border:0;border-radius:999px;background:none;color:var(--dim);cursor:pointer;font-size:12.5px;display:flex;align-items:center;gap:7px;white-space:nowrap;transition:background .15s var(--ease),color .15s var(--ease)}
.tab:hover{color:var(--ink)}
.tab.on{background:var(--pill-bg);color:var(--pill-ink)}
.tab .n{font-family:var(--mono);font-size:10px;opacity:.7}
.ref{display:inline-flex;align-items:center;gap:5px;color:var(--accent);cursor:pointer;background:none;border:0;padding:0;font:inherit;text-align:left}
.ref:hover{text-decoration:underline;text-underline-offset:3px}
.chip{display:inline-flex;align-items:center;gap:6px;height:24px;padding:0 10px;border-radius:999px;font-size:11.5px;border:1px solid var(--border-strong);color:var(--body);background:var(--surface-faint);white-space:nowrap;cursor:pointer;font-family:inherit}
.chip:hover{border-color:var(--accent-line);color:var(--ink)}
.chip.acc{border-color:var(--accent-line);color:var(--accent);background:var(--accent-faint)}
.chip.static{cursor:default}
.kv{display:grid;grid-template-columns:max-content 1fr;gap:7px 16px;font-size:12.5px}
.kv dt{color:var(--dim)}.kv dd{margin:0;color:var(--ink);min-width:0}
.sec{font-family:var(--mono);font-size:10px;letter-spacing:.1em;color:var(--faint);text-transform:uppercase;margin:0 0 8px}
.tl{position:relative;padding-left:18px}
.tl:before{content:"";position:absolute;left:5px;top:6px;bottom:6px;width:1px;background:var(--border-strong)}
.tl .e{position:relative;padding:0 0 12px;display:grid;grid-template-columns:44px 1fr;gap:10px}
.tl .e:before{content:"";position:absolute;left:-17px;top:5px;width:9px;height:9px;border-radius:50%;background:var(--bg);box-shadow:inset 0 0 0 2px var(--dim)}
.tl .e.ai:before{box-shadow:inset 0 0 0 2px var(--accent)}.tl .e.engineer:before{box-shadow:inset 0 0 0 2px var(--ok)}
.tl .e.system:before{box-shadow:inset 0 0 0 2px var(--faint)}.tl .e.qb:before{box-shadow:inset 0 0 0 2px #2ca01c}
.tl .e.warn:before{box-shadow:inset 0 0 0 2px var(--warn)}.tl .e.zone:before{background:var(--accent);box-shadow:none}
.tl .e.new{animation:mpFlash 1.6s var(--ease)}
.tl .t{font-family:var(--mono);font-size:11px;color:var(--dim);padding-top:1px}
.empty{padding:26px;text-align:center;color:var(--dim)}
.bar{height:6px;border-radius:6px;background:var(--track);overflow:hidden}
.bar i{display:block;height:100%;border-radius:6px;background:var(--accent);transform-origin:left;transition:transform .5s var(--ease)}
.drawer-scrim{position:fixed;inset:0;z-index:70;background:var(--scrim);animation:mpFade .2s var(--ease) both}
.drawer{position:fixed;top:10px;right:10px;bottom:10px;z-index:71;width:min(560px,calc(100vw - 20px));background:var(--overlay);border:1px solid var(--border-strong);border-radius:18px;backdrop-filter:blur(30px);-webkit-backdrop-filter:blur(30px);display:flex;flex-direction:column;box-shadow:0 30px 80px rgba(0,0,0,.35);animation:mpIn .26s var(--ease) both}
.drawer .dh{flex:none;padding:16px 18px 12px;border-bottom:1px solid var(--border);display:flex;gap:12px;align-items:flex-start}
.drawer .db{flex:1;overflow:auto;padding:16px 18px 20px}
.drawer .df{flex:none;padding:12px 18px;border-top:1px solid var(--border);display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}
.confirm{border:1px solid var(--accent-line);background:var(--accent-faint);border-radius:14px;padding:12px 14px}
.confirm .k{font-family:var(--mono);font-size:10px;letter-spacing:.08em;color:var(--accent)}
.toasts{position:fixed;right:18px;bottom:18px;z-index:95;display:flex;flex-direction:column;gap:8px;width:min(380px,calc(100vw - 36px));pointer-events:none}
.toast{pointer-events:auto;padding:11px 14px;border-radius:14px;background:var(--tooltip);color:var(--tooltip-ink);box-shadow:0 18px 40px rgba(0,0,0,.35);animation:mpUp .3s var(--ease) both;display:flex;gap:10px}
.toast b{font-weight:600;font-size:12.5px;display:block}
.toast span{font-size:11.5px;opacity:.74;display:block;margin-top:2px}
.toast .dot{width:8px;height:8px;border-radius:50%;margin-top:5px;flex:none;background:#6fd0a0}
.toast.flow .dot{background:#00b8d8}.toast.warn .dot{background:#e0b452}.toast.info .dot{background:#9aabb5}
.live{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--ok);animation:mpPulse 1.8s ease-in-out infinite}
.anim{animation:mpUp .3s var(--ease) both}
.skel{background:linear-gradient(90deg,var(--track),var(--surface-3),var(--track));background-size:200% 100%;animation:mpShim 1.2s linear infinite;border-radius:8px}
@keyframes mpIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:none}}
@keyframes mpFade{from{opacity:0}to{opacity:1}}
@keyframes mpUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes mpPulse{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes mpShim{from{background-position:200% 0}to{background-position:-200% 0}}
@keyframes mpFlash{0%{background:var(--accent-soft)}100%{background:transparent}}
/* AI panel */
.ai{position:fixed;top:0;right:0;bottom:0;z-index:80;width:min(460px,100vw);background:var(--overlay);border-left:1px solid var(--border-strong);backdrop-filter:blur(30px);-webkit-backdrop-filter:blur(30px);display:flex;flex-direction:column;box-shadow:-30px 0 80px rgba(0,0,0,.3);animation:mpIn .26s var(--ease) both}
.ai .hd{flex:none;display:flex;align-items:center;gap:10px;padding:0 16px;height:60px;border-bottom:1px solid var(--border)}
.ai .msgs{flex:1;overflow:auto;padding:16px}
.ai .q{margin:0 0 10px auto;max-width:85%;width:fit-content;background:var(--pill-bg);color:var(--pill-ink);padding:8px 12px;border-radius:14px 14px 4px 14px;font-size:13px}
.ai .a{margin:0 0 18px;animation:mpUp .3s var(--ease) both}
.ai .a p{margin:6px 0 10px;color:var(--body);line-height:1.55}
.ai .foot{flex:none;padding:12px 16px 16px;border-top:1px solid var(--border)}
.ai .tbl td,.ai .tbl th{padding:7px 8px;font-size:12px}
/* demo guide */
.guide{position:fixed;left:250px;bottom:16px;z-index:60;width:320px;background:var(--overlay);border:1px solid var(--border-strong);border-radius:16px;box-shadow:0 20px 50px rgba(0,0,0,.3);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);animation:mpUp .3s var(--ease) both}
.mp-side.slim ~ .mp-main .guide{left:78px}
.guide-pill{display:flex;align-items:center;gap:9px;width:auto;max-width:360px;height:36px;padding:0 14px;border-radius:999px;cursor:pointer;color:var(--body);font:inherit;font-size:12px;text-align:left}
.guide-pill:hover{border-color:var(--accent-line);color:var(--ink)}
.guide ol{margin:0;padding:0 14px 12px 14px;list-style:none;max-height:46vh;overflow:auto}
.guide li{display:grid;grid-template-columns:20px 1fr;gap:8px;padding:5px 0;font-size:12px;color:var(--dim)}
.guide li.done{color:var(--faint);text-decoration:line-through;text-decoration-color:var(--border-strong)}
.guide li.next{color:var(--ink)}
.guide li .i{font-family:var(--mono);font-size:10.5px;color:var(--faint);padding-top:1px}
.guide li.next .i{color:var(--accent)}
@media (max-width:1100px){.mp-side{width:64px}.mp-side .mp-it .lbl,.mp-side .mp-it .n,.mp-side .mp-brand b,.mp-side .mp-me .txt{display:none}.mp-side .mp-it{justify-content:center;padding:0}.mp-side .mp-grp{font-size:0;padding:8px 0 4px;margin:0 12px;border-top:1px solid var(--border)}.guide{left:78px}}
@media (max-width:720px){.mp-side{display:none}.mp-top{padding:0 14px}.mp-top .sub{display:none}.mp-body{padding:14px 14px 60px}.guide{left:14px;right:14px;width:auto}.hide-sm{display:none!important}}
@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
`;

/* ---------- icons (the Pulse set) ---------- */
const ICON = {
  home:"M4.4 4.4h6v6h-6v-6Z M13.6 4.4h6v3.6h-6V4.4Z M13.6 11.6h6v8h-6v-8Z M4.4 14h6v5.6h-6V14Z",
  desk:"M3 13h4l1.5 3h7l1.5-3h4 M3 13l2.4-7A2 2 0 0 1 7.3 4.6h9.4a2 2 0 0 1 1.9 1.4L21 13v4.4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V13Z",
  jobs:"M9.4 4.4h5.2a1.4 1.4 0 0 1 1.4 1.4v1.1h2.4A1.6 1.6 0 0 1 20 8.5v9.1a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 17.6V8.5a1.6 1.6 0 0 1 1.6-1.6H8V5.8a1.4 1.4 0 0 1 1.4-1.4Z M8 6.9h8 M9.6 13.3l1.8 1.8 3.4-3.6",
  dispatch:"M4 6h9 M4 12h6 M4 18h11 M16.5 4.5l3 3-3 3 M13.5 10.5l-3 3 3 3",
  engineers:"M12 12.5a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Z M5 20.2c.9-3.1 3.6-4.9 7-4.9s6.1 1.8 7 4.9",
  field:"M8 2.8h8a1.6 1.6 0 0 1 1.6 1.6v15.2a1.6 1.6 0 0 1-1.6 1.6H8a1.6 1.6 0 0 1-1.6-1.6V4.4A1.6 1.6 0 0 1 8 2.8Z M10.5 18h3 M9.5 8.5l1.8 1.8 3.4-3.4",
  subsistence:"M12 21s6.5-5.6 6.5-11a6.5 6.5 0 1 0-13 0C5.5 15.4 12 21 12 21Z M12 12.8a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z",
  parts:"M12 3 20 7.5v9L12 21l-8-4.5v-9L12 3Z M4 7.5l8 4.5 8-4.5 M12 12v9",
  machines:"M4 8.5h16v10H4z M7.5 8.5V6a1.5 1.5 0 0 1 1.5-1.5h6A1.5 1.5 0 0 1 16.5 6v2.5 M8 13h3 M14.5 13a1 1 0 1 0 0 .01",
  warranties:"M12 3 19.5 6v6c0 4.2-3.1 7.2-7.5 8.7C7.6 19.2 4.5 16.2 4.5 12V6L12 3Z M8.8 12l2.2 2.2 4.2-4.4",
  agents:"M8.5 3.6h7A2.4 2.4 0 0 1 17.9 6v5.6a2.4 2.4 0 0 1-2.4 2.4h-7A2.4 2.4 0 0 1 6.1 11.6V6a2.4 2.4 0 0 1 2.4-2.4Z M9.6 8.2h.01 M14.4 8.2h.01 M12 14v2.6 M7.6 20.4h8.8",
  customers:"M4.5 20V6.4A1.4 1.4 0 0 1 5.9 5h6.2a1.4 1.4 0 0 1 1.4 1.4V20 M13.5 10.5h4.6A1.4 1.4 0 0 1 19.5 12v8 M3 20h18 M7.5 8.5h2.5 M7.5 12h2.5 M7.5 15.5h2.5",
  documents:"M6.4 3.6h7.4l4.2 4.2v12.6H6.4V3.6Z M13.4 3.8v4.2h4.2 M9 12.4h6 M9 16h4",
  knowledge:"M7 7.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z M17.6 10.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z M9.4 21.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z M8.6 6.4l7.6 2.6 M15.8 11.4l-5.6 5.2",
  activity:"M2.5 12.5h3.6l2.1-6.4 3.2 12.2 2.6-8.4 1.8 2.6h5.7",
  attention:"M6 8.5a6 6 0 0 1 12 0c0 6.5 2.6 8.5 2.6 8.5H3.4S6 15 6 8.5Z M10.3 20.5a1.94 1.94 0 0 0 3.4 0",
  systems:"M6.6 4.4h10.8a2.2 2.2 0 0 1 2.2 2.2v10.8a2.2 2.2 0 0 1-2.2 2.2H6.6a2.2 2.2 0 0 1-2.2-2.2V6.6a2.2 2.2 0 0 1 2.2-2.2Z M4.4 9.6h15.2 M9.6 19.6V9.6",
  team:"M9 12a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 9 12Z M16.5 12.5a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z M2.6 19.6c.8-2.8 3.2-4.4 6.4-4.4s5.6 1.6 6.4 4.4 M17 15.4c2.2.4 3.7 1.8 4.3 4.2",
  rules:"M12 3.6 19.5 6v6.1c0 4-3.1 6.9-7.5 8.3-4.4-1.4-7.5-4.3-7.5-8.3V6L12 3.6Z M9.2 12.2l2 2 3.6-3.7",
  chat:"M21 11.5a8.4 8.4 0 0 1-9 8.4 9.9 9.9 0 0 1-4-.8L3 21l1.9-4.9A8.3 8.3 0 0 1 4 11.5 8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z M8 12h1.6l1.2-2.6 1.6 5 1.4-2.4H16",
  collapse:"M9 4v16 M15 9l-3 3 3 3",
  search:"m21 21-4.3-4.3 M10.8 18a7.2 7.2 0 1 0 0-14.4 7.2 7.2 0 0 0 0 14.4Z",
  sun:"M12 16.2a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4Z M12 2.5v2 M12 19.5v2 M2.5 12h2 M19.5 12h2 M5.3 5.3l1.4 1.4 M17.3 17.3l1.4 1.4 M5.3 18.7l1.4-1.4 M17.3 6.7l1.4-1.4",
  moon:"M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z",
  arrow:"M5 12h14 M13 6l6 6-6 6", back:"M19 12H5 M11 6l-6 6 6 6", close:"M6 6l12 12 M18 6 6 18", check:"M5 12.5l4.2 4.2L19 7",
  camera:"M4 8.5A1.5 1.5 0 0 1 5.5 7h2.2l1.5-2.2h5.6L16.3 7h2.2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-9Z M12 16a3.3 3.3 0 1 0 0-6.6 3.3 3.3 0 0 0 0 6.6Z",
  note:"M5 4.5h14v15H5z M8.5 9h7 M8.5 12.5h7 M8.5 16h4", phone:"M6.6 3.5h3l1.5 4-2 1.3a10 10 0 0 0 6.1 6.1l1.3-2 4 1.5v3A2.1 2.1 0 0 1 18.3 20 15.8 15.8 0 0 1 4 5.7a2.1 2.1 0 0 1 2.6-2.2Z",
  nav:"M3.5 11 20.5 3.5 13 20.5l-2-7.5-7.5-2Z", scan:"M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8 M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8 M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16 M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16 M4 12h16",
  alert:"M12 4 21 19.5H3L12 4Z M12 10v4.5 M12 17.2v.01", history:"M3.5 12a8.5 8.5 0 1 0 2.5-6 M3.5 4.5V9H8 M12 8v4.5l3 2",
  clock:"M12 21a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17Z M12 7.5v5l3.2 2", qr:"M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h2v2h-2z M18 14h2v2 M14 18h2v2 M18 18h2v2",
  plus:"M12 5v14 M5 12h14", download:"M12 4v11 M7 10l5 5 5-5 M5 19.5h14", link:"M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1 M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  play:"M7 4.5v15l12-7.5-12-7.5Z", reset:"M4 12a8 8 0 1 0 2.3-5.7 M4 4.5V9h4.5", guide:"M4 5.5h6a2 2 0 0 1 2 2V20a2 2 0 0 0-2-2H4V5.5Z M20 5.5h-6a2 2 0 0 0-2 2V20a2 2 0 0 1 2-2h6V5.5Z",
  qb:"M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z M9.5 8.2v7.6 M9.5 8.2h1.8a2.3 2.3 0 0 1 0 4.6H9.5 M14.5 15.8V8.2 M14.5 15.8h-1.8a2.3 2.3 0 0 1 0-4.6h1.8"
};
function Icon(p){ const d = ICON[p.n] || p.n; return h("svg", {width:p.s || 16, height:p.s || 16, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:p.w || 1.7, strokeLinecap:"round", strokeLinejoin:"round", style:p.style, "aria-hidden":"true"}, d.split(" M").map((seg, i) => h("path", {key:i, d:(i ? "M" : "") + seg}))); }

/* ---------- primitives ---------- */
const cx = (...a) => a.filter(Boolean).join(" ");
const STATUS_TONE = {"Unassigned":"warn","Scheduled":"","Travelling":"acc","On Site":"ok","Paused":"warn","Awaiting Part":"bad","Engineer Complete":"acc","Review Required":"warn",
  "Ready for Invoice":"ok","Sent to QuickBooks":"line","Closed":"line","Draft":"warn","Invoiced":"acc","Paid":"ok","Sent":"line"};
const PRIO_TONE = {Urgent:"bad", High:"warn", Normal:"", Low:"line"};
function Badge(p){ return h("span", {className:cx("b", p.k), title:p.title, style:p.style}, p.dot ? h("i", {className:"d"}) : null, p.children); }
function Status(p){ const s = p.j && p.j.draft ? "Draft" : p.s || (p.j && p.j.status); return h(Badge, {k:STATUS_TONE[s] || "", dot:p.dot}, s); }
function Prio(p){ return h(Badge, {k:PRIO_TONE[p.p] || ""}, p.p); }
function Btn(p){ const {k, sm, lg, icon, children, ...rest} = p; return h("button", Object.assign({type:"button", className:cx("btn", k, sm && "sm", lg && "lg")}, rest), icon ? h(Icon, {n:icon, s:sm ? 13 : 15}) : null, children); }
function Card(p){ return h("div", {className:cx("card", p.pad && "pad", p.flat && "flat", p.className), style:p.style, onClick:p.onClick, id:p.id}, p.title || p.right ? h(CardHead, {title:p.title, sub:p.sub, right:p.right, icon:p.icon}) : null, p.children); }
function CardHead(p){ return h("div", {className:"ch"}, p.icon ? h(Icon, {n:p.icon, s:16, style:{color:"var(--dim)"}}) : null, h("div", {style:{minWidth:0}}, h("h3", null, p.title), p.sub ? h("p", null, p.sub) : null), h("div", {className:"sp"}), p.right || null); }
function Kpi(p){ return h("button", {type:"button", className:"card kpi", onClick:p.onClick}, h("div", {className:"l"}, p.label), h("div", {className:"v", style:{color:p.color || "var(--ink)"}}, p.value), p.sub ? h("div", {className:"s"}, p.sub) : null); }
function Av(p){ const e = typeof p.e === "string" ? (MP.get().engineers[p.e] || MP.get().staff[p.e]) : p.e; const s = p.s || 26;
  if (!e) return h("span", {className:"av", style:{width:s, height:s, background:"var(--track)", color:"var(--dim)", fontSize:s * .38}}, "?");
  return h("span", {className:"av", title:e.name, style:{width:s, height:s, fontSize:s * .38, background:e.tint || "var(--surface-3)", color:e.tint ? "#0c1218" : "var(--ink)"}}, e.initials); }
function Tabs(p){ return h("div", {className:"tabs", role:"tablist"}, p.items.map(t => h("button", {key:t[0], type:"button", role:"tab", "aria-selected":p.value === t[0], className:cx("tab", p.value === t[0] && "on"), onClick:() => p.onChange(t[0])}, t[1], t[2] != null ? h("span", {className:"n"}, t[2]) : null))); }
function Bar(p){ const v = Math.max(0, Math.min(1, p.v)); return h("div", {className:"bar", style:p.style}, h("i", {style:{transform:"scaleX(" + v + ")", background:p.color || "var(--accent)"}})); }
function Field(p){ return h("div", {className:"fld"}, h("label", {className:"lbl", htmlFor:p.id}, p.label, p.hint ? h("span", {className:"faint", style:{marginLeft:6}}, p.hint) : null), p.children); }
function Empty(p){ return h("div", {className:"empty"}, p.icon ? h("div", {style:{marginBottom:8, color:"var(--faint)"}}, h(Icon, {n:p.icon, s:22})) : null, h("div", {style:{color:"var(--body)", fontWeight:500}}, p.title), p.children ? h("div", {style:{marginTop:4}}, p.children) : null); }
function Skel(p){ return h("div", {className:"skel", style:Object.assign({height:p.h || 14, width:p.w || "100%"}, p.style)}); }
function KV(p){ return h("dl", {className:"kv", style:p.style}, p.rows.filter(Boolean).map((r, i) => h(F, {key:i}, h("dt", null, r[0]), h("dd", null, r[1])))); }
function Sec(p){ return h("div", {className:"sec", style:p.style}, p.children); }
function Table(p){
  const head = h("thead", null, h("tr", null, p.cols.map((c, i) => h("th", {key:i, className:c.num ? "num" : "", style:c.w ? {width:c.w} : null}, c.t))));
  const rows = p.rows.length ? p.rows.map((r, ri) => h("tr", {key:r.key || r.id || ri, className:cx(p.onRow && "click", p.sel != null && p.sel === (r.key || r.id) && "sel"), onClick:p.onRow ? () => p.onRow(r) : null},
      p.cols.map((c, i) => h("td", {key:i, className:c.num ? "num" : "", style:c.style}, c.r(r)))))
    : h("tr", null, h("td", {colSpan:p.cols.length}, h(Empty, {title:p.empty || "Nothing here", icon:p.emptyIcon}, p.emptySub)));
  return h("div", {className:"tbl-wrap"}, h("table", {className:"tbl"}, head, h("tbody", null, rows)));
}
/* A clickable reference to any record. */
function Ref(p){ const r = p.r; if (!r || r.id == null) return h("span", {className:"faint"}, "None");
  return h("button", {type:"button", className:"ref", onClick:(e) => { e.stopPropagation(); MP.go(MP.link(r)); }, title:"Open " + MP.q.label(r)}, p.children || MP.q.label(r)); }
function Chip(p){ return h("button", {type:"button", className:cx("chip", p.k, !p.onClick && "static"), onClick:p.onClick, title:p.title}, p.icon ? h(Icon, {n:p.icon, s:12}) : null, p.children); }
function Timeline(p){
  return h("div", {className:"tl"}, p.items.map((e, i) => h("div", {key:i, className:cx("e", e.kind, e.isNew && "new")},
    h("div", {className:"t"}, e.t), h("div", null, h("div", {style:{color:"var(--ink)"}}, e.text), e.sub ? h("div", {className:"dim", style:{fontSize:12}}, e.sub) : null))));
}
function Drawer(p){
  useEffect(() => { const k = (e) => { if (e.key === "Escape") p.onClose(); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, []);
  return h(F, null, h("div", {className:"drawer-scrim", onClick:p.onClose}),
    h("div", {className:"drawer", role:"dialog", "aria-label":p.title, style:p.wide ? {width:"min(760px,calc(100vw - 20px))"} : null},
      h("div", {className:"dh"}, h("div", {style:{flex:1, minWidth:0}}, p.kicker ? h("div", {className:"mono faint", style:{marginBottom:3}}, p.kicker) : null,
        h("div", {style:{fontSize:16, fontWeight:600}}, p.title), p.sub ? h("div", {className:"dim", style:{marginTop:2}}, p.sub) : null),
        h(Btn, {k:"ghost", sm:true, onClick:p.onClose, "aria-label":"Close", icon:"close"})),
      h("div", {className:"db"}, p.children), p.foot ? h("div", {className:"df"}, p.foot) : null));
}
/* Write actions proposed by AI wait for a yes bound to the hashed arguments. */
function Confirm(p){
  return h("div", {className:"confirm anim"},
    h("div", {className:"row"}, h("span", {className:"k"}, "NEEDS YOUR YES · " + p.tool), h("span", {className:"sp1"}), h("span", {className:"mono faint", title:"Arguments hash. Confirming replays exactly these arguments."}, "args " + MP.util.hash(p.args))),
    h("div", {style:{margin:"6px 0 10px", color:"var(--body)"}}, p.summary),
    p.done ? h(Badge, {k:"ok"}, "Done · recorded in Activity") : h("div", {className:"row"}, h(Btn, {k:"pri", sm:true, onClick:p.onYes}, p.yes || "Confirm"), h(Btn, {k:"ghost", sm:true, onClick:p.onNo}, "Not now")));
}
/* QR code look-alike, deterministic from the machine id (stands in for the printed tag). */
function QR(p){
  const n = 21, s = p.s || 120, c = s / n; let hsh = parseInt(MP.util.hash(p.v), 16);
  const cells = [];
  const finder = (x, y) => (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++){
    if (finder(x, y)){ const fx = x >= n - 7 ? x - (n - 7) : x, fy = y >= n - 7 ? y - (n - 7) : y; const ring = Math.max(Math.abs(fx - 3), Math.abs(fy - 3)); if (ring === 3 || ring <= 1) cells.push([x, y]); continue; }
    hsh = (Math.imul(hsh ^ (x * 31 + y * 17), 2654435761) >>> 0); if (hsh % 5 < 2) cells.push([x, y]);
  }
  return h("svg", {width:s, height:s, viewBox:"0 0 " + s + " " + s, style:{background:"#fff", borderRadius:6, padding:6, boxSizing:"content-box"}, role:"img", "aria-label":"QR code " + p.v},
    cells.map((q, i) => h("rect", {key:i, x:q[0] * c, y:q[1] * c, width:c + .3, height:c + .3, fill:"#0c1218"})));
}
/* Ireland outline map. points: [{pos,[kind],label,color,onClick,r}], lines: [{pts,color,dash}], zone: {pos,km}, fit: [[lat,lng]...] zooms to those. */
function IrelandMap(p){
  const W = p.w || 440, H = p.h || 500, pad = 18;
  let lat0 = 55.45, lat1 = 51.35, lng0 = -10.6, lng1 = -5.4;
  if (p.fit && p.fit.length){ const la = p.fit.map(x => x[0]), ln = p.fit.map(x => x[1]); const m = p.fitPad || .25;
    lat0 = Math.max.apply(null, la) + m; lat1 = Math.min.apply(null, la) - m; lng0 = Math.min.apply(null, ln) - m * 1.6; lng1 = Math.max.apply(null, ln) + m * 1.6; }
  const cos = Math.cos((lat0 + lat1) / 2 * Math.PI / 180);
  const k = Math.min((W - pad * 2) / ((lng1 - lng0) * cos), (H - pad * 2) / (lat0 - lat1));
  const ox = (W - (lng1 - lng0) * cos * k) / 2, oy = (H - (lat0 - lat1) * k) / 2;
  const X = (lng) => ox + (lng - lng0) * cos * k, Y = (lat) => oy + (lat0 - lat) * k;
  const coast = MP.geo.COAST.map(c => X(c[1]).toFixed(1) + "," + Y(c[0]).toFixed(1)).join(" ");
  const kmPx = k / 111;
  return h("svg", {viewBox:"0 0 " + W + " " + H, width:"100%", style:{display:"block", maxHeight:p.maxH || H, overflow:"hidden"}, role:"img", "aria-label":p.label || "Map of engineer locations"},
    h("polygon", {points:coast, fill:"var(--map-land)", stroke:"var(--map-line)", strokeWidth:1, strokeLinejoin:"round"}),
    p.zone ? h("circle", {cx:X(p.zone.pos[1]), cy:Y(p.zone.pos[0]), r:Math.max(3, p.zone.km * kmPx), fill:"var(--accent-faint)", stroke:"var(--accent-line)", strokeDasharray:"3 3"}) : null,
    (p.lines || []).map((l, i) => h("polyline", {key:"l" + i, points:l.pts.map(q => X(q[1]).toFixed(1) + "," + Y(q[0]).toFixed(1)).join(" "), fill:"none", stroke:l.color || "var(--accent)", strokeWidth:l.w || 1.6, strokeDasharray:l.dash ? "4 4" : null, opacity:l.op || .85, strokeLinecap:"round", strokeLinejoin:"round"})),
    (p.points || []).map((q, i) => h("g", {key:"p" + i, transform:"translate(" + X(q.pos[1]).toFixed(1) + "," + Y(q.pos[0]).toFixed(1) + ")", style:{cursor:q.onClick ? "pointer" : "default"}, onClick:q.onClick},
      q.title ? h("title", null, q.title) : null,
      q.kind === "eng" ? h(F, null, q.pulse ? h("circle", {r:16, fill:q.color, opacity:.18}, h("animate", {attributeName:"r", values:"11;19;11", dur:"2.4s", repeatCount:"indefinite"})) : null,
          h("circle", {r:11.5, fill:q.color || "var(--accent)", stroke:"var(--bg)", strokeWidth:2}), h("text", {textAnchor:"middle", dy:3.6, fontSize:8.5, fontWeight:700, fill:"#0c1218", fontFamily:"var(--sans)"}, q.label))
        : q.kind === "base" ? h(F, null, h("rect", {x:-6, y:-6, width:12, height:12, rx:3, fill:"var(--ink)"}), q.label ? h("text", {x:10, dy:4, fontSize:10.5, fill:"var(--dim)", fontFamily:"var(--sans)"}, q.label) : null)
        : h(F, null, h("circle", {r:q.r || 4.5, fill:q.color || "var(--dim)", stroke:"var(--bg)", strokeWidth:1.5, opacity:q.op || 1}), q.label ? h("text", {x:8, dy:3.5, fontSize:10, fill:"var(--dim)", fontFamily:"var(--sans)"}, q.label) : null))));
}
MP.ui = {cx, Icon, ICON, Badge, Status, Prio, Btn, Card, CardHead, Kpi, Av, Tabs, Bar, Field, Empty, Skel, KV, Sec, Table, Ref, Chip, Timeline, Drawer, Confirm, QR, IrelandMap, STATUS_TONE, PRIO_TONE};

/* ---------- store hook ---------- */
MP.useStore = function(){ const [, f] = useState(0); useEffect(() => MP.subscribe(() => f(x => x + 1)), []); return MP.get(); };

/* ---------- routing (hash) ---------- */
function parse(){
  const raw = decodeURIComponent((location.hash || "").replace(/^#\/?/, "")) || "home";
  const [path, qs] = raw.split("?"); const parts = path.split("/").filter(Boolean);
  const query = {}; (qs || "").split("&").filter(Boolean).forEach(kv => { const [k, v] = kv.split("="); query[k] = v || ""; });
  return {page:parts[0] || "home", parts:parts.slice(1), query, path};
}
MP.route = parse;
MP.go = (path) => { const target = "#/" + path; if (location.hash !== target) location.hash = target; else window.dispatchEvent(new HashChangeEvent("hashchange")); };
function useRoute(){ const [r, set] = useState(parse()); useEffect(() => { const f = () => set(parse()); window.addEventListener("hashchange", f); return () => window.removeEventListener("hashchange", f); }, []); return r; }
MP.useRoute = useRoute;
MP.pages = MP.pages || {};

/* ---------- navigation model ---------- */
const NAV = [
  ["HOME", [["home","Command Centre","home"]]],
  ["SERVICE", [["desk","Service Desk","desk"],["jobs","Jobs","jobs"],["dispatch","Dispatch","dispatch"]]],
  ["FIELD", [["engineers","Engineers","engineers"],["field","Engineer app","field"],["subsistence","Subsistence","subsistence"]]],
  ["ASSETS", [["parts","Parts","parts"],["machines","Machines","machines"],["warranties","Warranties","warranties"]]],
  ["AI", [["agents","Agents","agents"]]],
  ["RECORDS", [["customers","Customers","customers"],["documents","Documents","documents"],["knowledge","Knowledge","knowledge"]]],
  ["ACTIVITY", [["activity","Activity","activity"],["attention","Needs Attention","attention"]]],
  ["SETTINGS", [["systems","Systems","systems"],["team","Team & Permissions","team"],["rules","Rules","rules"]]]
];
const ROLES = {
  owner:{label:"Owner / Director", person:"tom", pages:null, home:"home"},
  manager:{label:"Service Manager", person:"karen", pages:["home","desk","jobs","dispatch","engineers","field","subsistence","parts","machines","warranties","agents","customers","documents","knowledge","activity","attention","rules"], home:"home"},
  stores:{label:"Stores", person:"pat", pages:["parts","machines","jobs","documents","attention","activity"], home:"parts"},
  engineer:{label:"Engineer (Sean)", person:"sean", pages:["field"], home:"field"}
};
MP.ROLES = ROLES; MP.NAV = NAV;
MP.canSee = (page, role) => { const r = ROLES[role || MP.get().role]; return !r.pages || r.pages.indexOf(page) >= 0; };

/* ---------- toasts ---------- */
function Toasts(){
  const [, f] = useState(0); useEffect(() => MP.onToast(() => f(x => x + 1)), []);
  return h("div", {className:"toasts", "aria-live":"polite"}, MP.toasts().map(t => h("div", {key:t.id, className:"toast " + t.kind}, h("i", {className:"dot"}), h("div", null, h("b", null, t.text), t.sub ? h("span", null, t.sub) : null))));
}

/* ---------- error boundary ---------- */
class Boundary extends R.Component {
  constructor(p){ super(p); this.state = {err:null}; }
  static getDerivedStateFromError(err){ return {err}; }
  componentDidCatch(err){ console.error("[Myers Pulse]", err); }
  componentDidUpdate(prev){ if (prev.k !== this.props.k && this.state.err) this.setState({err:null}); }
  render(){ return this.state.err ? h(Card, {pad:true}, h("b", null, "This view hit a problem."), h("div", {className:"dim"}, String(this.state.err.message || this.state.err))) : this.props.children; }
}
MP.Boundary = Boundary;

/* ---------- AI panel ---------- */
let aiOpen = false, aiThread = []; const aiL = new Set();
MP.openAI = (q) => { aiOpen = true; aiL.forEach(f => f()); if (q) setTimeout(() => MP.askAI(q), 60); };
MP.closeAI = () => { aiOpen = false; aiL.forEach(f => f()); };
MP.askAI = (q) => { const id = aiThread.length; aiThread = aiThread.concat([{q, a:null, id}]); aiL.forEach(f => f());
  setTimeout(() => { aiThread = aiThread.map(x => x.id === id ? Object.assign({}, x, {a:MP.ask(q)}) : x); aiL.forEach(f => f()); }, 650); };
function AIPanel(){
  const [, f] = useState(0); useEffect(() => { const g = () => f(x => x + 1); aiL.add(g); return () => aiL.delete(g); }, []);
  MP.useStore();
  const [txt, setTxt] = useState(""); const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; });
  useEffect(() => { const k = (e) => { if (e.key === "Escape") MP.closeAI(); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, []);
  if (!aiOpen) return null;
  const U = MP.ui, send = () => { if (!txt.trim()) return; MP.askAI(txt.trim()); setTxt(""); };
  return h("aside", {className:"ai", "aria-label":"Pulse AI"},
    h("div", {className:"hd"}, h("span", {className:"mp-logo", style:{width:26, height:26, borderRadius:8}}, h(Icon, {n:"chat", s:15})),
      h("div", null, h("div", {style:{fontWeight:600}}, "Ask Pulse"), h("div", {className:"faint", style:{fontSize:11}}, "Answers from live Myers records. Changes wait for your yes.")),
      h("span", {className:"sp1"}), h(Btn, {k:"ghost", sm:true, icon:"close", onClick:MP.closeAI, "aria-label":"Close"})),
    h("div", {className:"msgs", ref},
      aiThread.length ? null : h("div", {className:"anim"}, h("div", {className:"dim", style:{marginBottom:10}}, "Ask about any job, engineer, machine, part, warranty or subsistence record."),
        h("div", {className:"col", style:{gap:6, alignItems:"flex-start"}}, MP.SUGGEST.map(s => h(Chip, {key:s, onClick:() => MP.askAI(s)}, s)))),
      aiThread.map(m => h(F, {key:m.id}, h("div", {className:"q"}, m.q),
        m.a ? h(Answer, {a:m.a, id:m.id}) : h("div", {className:"a"}, h("div", {className:"row", style:{gap:8}}, h(Skel, {w:90, h:10}), h(Skel, {w:140, h:10})), h(Skel, {h:10, style:{marginTop:10}}), h(Skel, {h:10, w:"70%", style:{marginTop:6}}))))),
    h("div", {className:"foot"},
      aiThread.length ? h("div", {className:"row wrap", style:{gap:6, marginBottom:10}}, MP.SUGGEST.slice(0, 4).map(s => h(Chip, {key:s, onClick:() => MP.askAI(s)}, s.length > 34 ? s.slice(0, 32) + "…" : s))) : null,
      h("form", {className:"row", onSubmit:(e) => { e.preventDefault(); send(); }},
        h("input", {className:"in", value:txt, onChange:(e) => setTxt(e.target.value), placeholder:"Ask Pulse about the operation", "aria-label":"Ask Pulse"}),
        h(Btn, {k:"pri", type:"submit", icon:"arrow", "aria-label":"Send"}))));
}
const doneProposals = {};
function Answer(p){
  const a = p.a, U = MP.ui, ag = MP.AGENTS[a.agent] || {name:"Pulse"};
  const [st, setSt] = useState(doneProposals[p.id] || null);
  return h("div", {className:"a"},
    h("div", {className:"row", style:{gap:8}}, h(Badge, {k:"acc"}, ag.name), a.tool ? h("span", {className:"mono faint"}, a.tool + " · read") : null),
    h("p", null, a.text),
    a.table && a.table.rows.length ? h("div", {className:"card", style:{marginBottom:10, overflow:"hidden"}}, h("div", {className:"tbl-wrap"}, h("table", {className:"tbl"},
      h("thead", null, h("tr", null, a.table.cols.map((c, i) => h("th", {key:i}, c)))), h("tbody", null, a.table.rows.map((r, i) => h("tr", {key:i}, r.map((c, j) => h("td", {key:j}, c)))))))) : null,
    a.confirm ? (st === "no" ? h("div", {className:"faint", style:{fontSize:12, marginBottom:8}}, "Not done. Nothing changed.") :
      h(Confirm, {tool:a.confirm.tool, args:a.confirm.args, summary:a.confirm.summary, yes:a.confirm.yes, done:st === "yes",
        onYes:() => { MP.runProposal(a.confirm.run); doneProposals[p.id] = "yes"; setSt("yes"); }, onNo:() => { doneProposals[p.id] = "no"; setSt("no"); }})) : null,
    a.suggest ? h("div", {className:"col", style:{gap:6, alignItems:"flex-start"}}, MP.SUGGEST.map(s => h(Chip, {key:s, onClick:() => MP.askAI(s)}, s))) : null,
    a.links ? h("div", {className:"row wrap", style:{gap:6, marginTop:10}}, a.links.map(l => h(Chip, {key:l[0], k:"acc", onClick:() => { MP.go(l[1]); }}, l[0], h(Icon, {n:"arrow", s:11})))) : null);
}

/* ---------- demo guide: the 18-step story ---------- */
const STEPS = [
  ["Command Centre: jobs, engineers, urgent work at a glance", (S) => true, "home"],
  ["Glenmore request arrives; AI reads customer, site, machine, urgency", (S) => !S.jobs["2491"].draft, "desk/RQ-3107"],
  ["Pulse drafted Job #2491: create it", (S) => !S.jobs["2491"].draft, "desk/RQ-3107"],
  ["Dispatch recommends Sean: assign him", (S) => S.jobs["2491"].eng === "sean", "desk/RQ-3107"],
  ["Sean gets the job on his phone", (S) => S.jobs["2491"].status !== "Scheduled" && S.jobs["2491"].eng === "sean", "field"],
  ["Sean leaves the Myers zone; subsistence timer starts", (S) => MP.q.subDay("sean", MP.util.TODAY).exit != null, "field"],
  ["Sean arrives at Glenmore and starts the job", (S) => !!S.jobs["2491"].started, "field"],
  ["Faulty optical sensor: photograph the part bag", (S) => S.jobs["2491"].parts.length > 0, "field"],
  ["Pulse reads MX-44721, Optical Sensor, B-14-03", (S) => S.jobs["2491"].parts.length > 0, "field"],
  ["Confirm: job, Van 04 stock, history, photo, reorder all update", (S) => S.jobs["2491"].parts.length > 0, "parts/MX-44721"],
  ["Sean completes the job", (S) => MP.q.DONE.indexOf(S.jobs["2491"].status) >= 0, "field"],
  ["Pulse checks travel, labour, parts, report, photos", (S) => MP.q.DONE.indexOf(S.jobs["2491"].status) >= 0, "jobs/2491"],
  ["Job #2491 is Ready for Invoice", (S) => ["Ready for Invoice","Sent to QuickBooks","Closed"].indexOf(S.jobs["2491"].status) >= 0, "jobs/2491"],
  ["Send it to QuickBooks", (S) => !!S.jobs["2491"].qb, "jobs/2491"],
  ["QuickBooks returns Invoiced, then Paid", (S) => S.jobs["2491"].qb && S.jobs["2491"].qb.status === "Paid", "systems"],
  ["Sean measures Murphy Foods (non-billable); timer keeps running", (S) => DONE_ANY(S, "2496"), "field"],
  ["Sean returns: 8h 24m away, 5+ hour band, €20", (S) => { const r = MP.q.subDay("sean", MP.util.TODAY); return r.ret != null && !r.inProgress; }, "subsistence/day/sean/2026-09-28"],
  ["Month-end subsistence report builds itself", (S) => false, "subsistence/report"]
];
const DONE_ANY = (S, id) => MP.q.DONE.indexOf(S.jobs[id].status) >= 0;
function Guide(p){
  const S = MP.useStore();
  const [open, setOpen] = useState(() => { try { return localStorage.getItem("mp-guide-open") === "1"; } catch(e){ return false; } });
  const tog = () => { setOpen(!open); try { localStorage.setItem("mp-guide-open", open ? "0" : "1"); } catch(e){} };
  const done = STEPS.map((s, i) => i === 0 ? true : s[1](S));
  let next = done.findIndex((d, i) => !d && i > 0); if (next < 0) next = STEPS.length - 1;
  if (!open) return h("button", {type:"button", className:"guide guide-pill", onClick:tog, "aria-expanded":false, title:"Show the demo story"},
    h(Icon, {n:"guide", s:14, style:{color:"var(--accent)", flex:"none"}}), h("span", {className:"mono faint", style:{flex:"none"}}, (next + 1) + "/" + STEPS.length),
    h("span", {style:{overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}, STEPS[next][0]));
  return h("div", {className:"guide", role:"complementary", "aria-label":"Demo story"},
    h("div", {className:"row", style:{padding:"12px 14px 8px"}}, h(Icon, {n:"guide", s:15, style:{color:"var(--accent)"}}), h("b", {style:{fontSize:12.5}}, "Demo story"),
      h("span", {className:"mono faint"}, (next + 1) + " / " + STEPS.length), h("span", {className:"sp1"}),
      h(Btn, {k:"ghost", sm:true, onClick:tog, "aria-label":"Collapse demo story"}, "Collapse"),
      h(Btn, {k:"ghost", sm:true, icon:"close", onClick:p.onClose, "aria-label":"Hide demo story"})),
    h("ol", null, STEPS.map((s, i) => h("li", {key:i, className:cx(done[i] && i !== next && "done", i === next && "next")},
      h("span", {className:"i"}, done[i] && i !== next ? "✓" : String(i + 1)),
      h("button", {type:"button", className:"ref", style:{color:"inherit"}, onClick:() => MP.go(s[2])}, s[0])))));
}

/* ---------- shell ---------- */
function Sidebar(p){
  const S = p.S, route = p.route, [tip, setTip] = useState(null);
  const counts = {
    desk: S.requests.filter(r => r.status === "New" || r.status === "Triaged").length,
    attention: MP.q.needs().length,
    jobs: Object.values(S.jobs).filter(j => j.status === "Ready for Invoice" || j.status === "Review Required").length,
    subsistence: MP.q.needs().filter(n => n.cat === "SUBSISTENCE").length
  };
  const hot = {desk:true, attention:true};
  const me = S.engineers[ROLES[S.role].person] || S.staff[ROLES[S.role].person];
  return h("nav", {className:cx("mp-side", p.slim && "slim"), "aria-label":"Main"},
    h("div", {className:"mp-brand"}, h("span", {className:"mp-logo"}, "M"), h("b", null, "Myers Pulse", h("span", null, "Myers Food Machinery"))),
    h("div", {className:"mp-nav"}, NAV.map(g => { const items = g[1].filter(it => MP.canSee(it[0], S.role)); if (!items.length) return null;
      return h(F, {key:g[0]}, h("div", {className:"mp-grp"}, g[0]), items.map(it => h("button", {key:it[0], type:"button", className:cx("mp-it", route.page === it[0] && "on"), "aria-current":route.page === it[0] ? "page" : null,
        onClick:() => MP.go(it[0]), onMouseEnter:(e) => { if (p.slim || window.innerWidth <= 1100){ const b = e.currentTarget.getBoundingClientRect(); setTip({label:it[1], x:b.right + 10, y:b.top + b.height / 2}); } }, onMouseLeave:() => setTip(null)},
        h(Icon, {n:it[2], s:17}), h("span", {className:"lbl"}, it[1]), counts[it[0]] ? h("span", {className:cx("n", hot[it[0]] && "hot")}, counts[it[0]]) : null))); })),
    h("div", {className:"mp-me"}, h(Av, {e:me, s:30}), h("div", {className:"txt"}, h("b", null, me.name), h("span", null, ROLES[S.role].label))),
    tip ? h("div", {className:"mp-tip", style:{left:tip.x, top:tip.y - 14}}, tip.label) : null);
}
function TopBar(p){
  const S = p.S, page = p.page;
  const [menu, setMenu] = useState(false);
  return h("header", {className:"mp-top"},
    h("button", {type:"button", className:"btn ghost sm hide-sm", onClick:p.toggleSlim, "aria-label":"Collapse sidebar", title:"Collapse sidebar"}, h(Icon, {n:"collapse", s:15})),
    h("h1", null, p.title), p.sub ? h("span", {className:"sub"}, p.sub) : null, h("span", {className:"sp"}),
    h("span", {className:"mp-clock", title:"Demo clock. It moves forward as the story happens."}, h("i", {className:"live"}), "Mon 28 Sep · " + MP.util.hm(S.clock)),
    S.role !== "engineer" ? h(Btn, {k:"pri", sm:true, icon:"chat", onClick:() => MP.openAI()}, "Ask Pulse") : null,
    h("div", {style:{position:"relative"}},
      h(Btn, {sm:true, onClick:() => setMenu(!menu), "aria-expanded":menu, "aria-haspopup":"menu"}, h(Av, {e:ROLES[S.role].person, s:18}), h("span", {className:"hide-sm"}, ROLES[S.role].label)),
      menu ? h(F, null, h("div", {style:{position:"fixed", inset:0, zIndex:84}, onClick:() => setMenu(false)}),
        h("div", {className:"card anim", role:"menu", style:{position:"absolute", right:0, top:38, zIndex:85, width:250, padding:6, background:"var(--overlay)", boxShadow:"0 20px 50px rgba(0,0,0,.35)"}},
          h("div", {className:"sec", style:{padding:"8px 10px 4px"}}, "View as"),
          Object.keys(ROLES).map(k => h("button", {key:k, type:"button", role:"menuitem", className:cx("mp-it", S.role === k && "on"), onClick:() => { setMenu(false); MP.act.role(k); MP.go(ROLES[k].home); }},
            h(Av, {e:ROLES[k].person, s:20}), h("span", {className:"lbl"}, ROLES[k].label))),
          h("div", {style:{height:1, background:"var(--border)", margin:"6px 4px"}}),
          h("button", {type:"button", role:"menuitem", className:"mp-it", onClick:() => { setMenu(false); p.toggleTheme(); }}, h(Icon, {n:p.theme === "dark" ? "sun" : "moon", s:15}), h("span", {className:"lbl"}, p.theme === "dark" ? "Light mode" : "Dark mode")),
          h("button", {type:"button", role:"menuitem", className:"mp-it", onClick:() => { setMenu(false); p.toggleGuide(); }}, h(Icon, {n:"guide", s:15}), h("span", {className:"lbl"}, p.guide ? "Hide demo story" : "Show demo story")),
          h("button", {type:"button", role:"menuitem", className:"mp-it", onClick:() => { setMenu(false); MP.reset(); MP.go("home"); }}, h(Icon, {n:"reset", s:15}), h("span", {className:"lbl"}, "Reset demo to 07:02"))))
        : null));
}
function App(){
  const S = MP.useStore(), route = useRoute();
  const [slim, setSlim] = useState(false), [theme, setTheme] = useState(() => { try { return localStorage.getItem("mp-theme") || "dark"; } catch(e){ return "dark"; } });
  const [guide, setGuide] = useState(() => { try { return localStorage.getItem("mp-guide") !== "0"; } catch(e){ return true; } });
  useEffect(() => { document.documentElement.dataset.theme = theme; try { localStorage.setItem("mp-theme", theme); } catch(e){} }, [theme]);
  const bodyRef = useRef(null);
  useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = 0; }, [route.path]);
  const toggleGuide = () => { setGuide(!guide); try { localStorage.setItem("mp-guide", guide ? "0" : "1"); } catch(e){} };
  const standalone = route.page === "m";     // #/m opens the engineer web app on its own, full screen, for a real phone
  const roleOk = MP.canSee(route.page, S.role) || standalone;
  const pg = MP.pages[roleOk ? route.page : ROLES[S.role].home] || MP.pages.home;
  useEffect(() => { if (!roleOk) MP.go(ROLES[S.role].home); }, [roleOk]);
  if (S.role === "engineer" || standalone){
    const F2 = MP.pages.field; return h(F, null, h(Boundary, {k:"m"}, F2 ? F2.renderMobile(route, S) : null), h(Toasts));
  }
  const title = typeof pg.title === "function" ? pg.title(route, S) : pg.title, sub = typeof pg.sub === "function" ? pg.sub(route, S) : pg.sub;
  return h("div", {className:"mp"},
    h("div", {className:"mp-glow"}),
    h(Sidebar, {S, route, slim}),
    h("main", {className:"mp-main"},
      h(TopBar, {S, title, sub, page:route.page, theme, toggleTheme:() => setTheme(theme === "dark" ? "light" : "dark"), toggleSlim:() => setSlim(!slim), guide, toggleGuide}),
      h("div", {className:"mp-body", ref:bodyRef}, h("div", {className:"mp-page"}, h(Boundary, {k:route.path}, h("div", {key:route.page, className:"anim"}, pg.render(route, S))))),
      guide ? h(Guide, {onClose:toggleGuide}) : null),
    h(AIPanel), h(Toasts));
}

function boot(){
  if (!document.getElementById("mp-css")){ const st = document.createElement("style"); st.id = "mp-css"; st.textContent = CSS; document.head.appendChild(st); }
  MP.init();
  const el = document.getElementById("app");
  const root = window.ReactDOM.createRoot(el); root.render(h(App));
}
MP.boot = boot;
})();
