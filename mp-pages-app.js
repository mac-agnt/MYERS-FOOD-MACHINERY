/* Myers Pulse: Engineer app.
   A mobile-first WEB app (not a native app) that each engineer opens on their phone.
   Two render modes share one <FieldApp eng=...>:
     render(route, S)        desktop management preview: phone frame + "What the office sees"
     renderMobile(route, S)  full screen, used for the Engineer role and #/m (or #/m/<engineer>)
   The engineer sees only their own jobs and the customer, machine, parts and documents those jobs need.
   No prices, no management data, no other engineers. Every tap goes through MP.act.* so the office
   screens, stock, documents, timelines and subsistence move with it. */
(function(){
"use strict";
const MP = window.MP, h = MP.h, F = MP.F, U = MP.util, Q = MP.q, A = MP.act, UI = MP.ui;
const R = window.React;
const {useState, useEffect, useRef} = R;
const {Icon, Badge, Status, Card, Btn, Av, Ref, KV} = UI;
const TODAY = U.TODAY;

/* ---------- styles (prefix fa-) ----------
   The phone always uses the light --phone-* tokens. The app root carries data-theme="light" so the
   status tones (--ok, --warn, --bad, --accent-soft) resolve to the light-theme values inside the phone. */
const CSS = `
.fa{position:relative;display:flex;flex-direction:column;height:100%;min-height:0;overflow:hidden;background:var(--phone-bg);color:var(--phone-ink);font-family:var(--sans);font-size:16px;line-height:1.42;-webkit-tap-highlight-color:transparent;overflow-wrap:break-word;text-align:left}
.fa *{box-sizing:border-box}
.fa p{margin:6px 0 0}
.fa-screen{display:flex;flex-direction:column;flex:1;min-height:0;background:var(--phone-bg)}
.fa-screen.dark{background:var(--phone-ink);color:var(--phone-card)}
.fa.framed .fa-screen,.fa.framed .fa-sheet.cam{padding-top:47px}
.fa.mob .fa-screen,.fa.mob .fa-sheet.cam{padding-top:env(safe-area-inset-top)}
.fa-hd{flex:none;display:flex;align-items:center;gap:8px;min-height:60px;padding:6px 12px 6px 16px}
.fa-hd.bk{padding-left:4px}
.fa-hd-t{flex:1;min-width:0}
.fa-title{font-size:18px;font-weight:650;letter-spacing:-.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.2}
.fa-lbl{font-family:var(--mono);font-size:11.5px;letter-spacing:.09em;text-transform:uppercase;color:var(--phone-dim);font-weight:500}
.dark .fa-lbl,.cam .fa-lbl{color:rgba(255,255,255,.64)}
.cam .fa-card .fa-lbl{color:var(--phone-dim)}
.fa-brand{display:flex;align-items:center;gap:10px;min-width:0}
.fa-logo{width:34px;height:34px;flex:none;border-radius:10px;background:var(--phone-acc);color:var(--phone-card);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px}
.fa-ib{width:48px;height:48px;flex:none;border:0;border-radius:999px;background:none;color:inherit;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;text-decoration:none;transition:transform .1s var(--ease)}
.fa-ib:active{transform:scale(.94)}
.fa-ib.box{background:var(--phone-card);box-shadow:inset 0 0 0 1px var(--phone-line)}
.fa-ib.acc{color:var(--phone-acc)}
.dark .fa-ib,.cam .fa-ib{color:var(--phone-card)}
.cam .fa-card .fa-ib{color:var(--phone-ink)}
.fa-ib:focus-visible,.fa-btn:focus-visible,.fa-tile:focus-visible,.fa-li:focus-visible,.fa-chip:focus-visible,.fa-esc:focus-visible,.fa-textbtn:focus-visible,.fa-shutter:focus-visible,.fa-segb:focus-visible,.fa-opt:focus-visible{outline:3px solid var(--phone-acc);outline-offset:2px}
.fa-esc{height:32px;padding:0 12px;border-radius:999px;border:1px solid var(--phone-line);background:var(--phone-card);color:var(--phone-dim);font:600 12.5px var(--sans);cursor:pointer;white-space:nowrap;flex:none}
.fa-scroll{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;padding:2px 16px 28px;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}
.fa-scroll::-webkit-scrollbar{width:0}
.fa-foot{flex:none;display:grid;gap:10px;padding:12px 16px calc(12px + env(safe-area-inset-bottom));background:var(--phone-card);border-top:1px solid var(--phone-line)}
.fa.framed .fa-foot{padding-bottom:30px}
.dark .fa-foot{background:var(--phone-ink);border-top-color:rgba(255,255,255,.1)}
.fa-two{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.35fr);gap:10px}
.fa-note{font-size:14px;color:var(--phone-dim);text-align:center}
.fa-note.warn{color:var(--warn)}
.fa-card{background:var(--phone-card);border:1px solid var(--phone-line);border-radius:16px;padding:16px;margin-top:12px}
.fa-card.hi{border-color:var(--phone-acc);box-shadow:inset 0 0 0 1px var(--phone-acc)}
.fa-h1{font-size:26px;font-weight:650;letter-spacing:-.02em;line-height:1.15;margin:4px 0 2px}
.fa-h2{font-size:21px;font-weight:650;letter-spacing:-.015em;line-height:1.2}
.fa-strong{font-size:17px;font-weight:650;line-height:1.3}
.fa-dim{color:var(--phone-dim)}
.fa-mono{font-family:var(--mono)}
.fa-big{font-size:17px}
.fa-sm{font-size:14px}
.fa-row{display:flex;align-items:center;gap:12px;min-width:0}
.fa-grow{flex:1;min-width:0}
.fa-sep{height:1px;background:var(--phone-line);margin:14px 0}
.fa-bignum{font-size:34px;font-weight:650;letter-spacing:-.02em;font-variant-numeric:tabular-nums;line-height:1.1}
.fa-time{font-family:var(--mono);font-size:15px;font-weight:600}
.fa-btn{min-height:48px;padding:0 18px;border-radius:999px;border:1px solid var(--phone-line);background:var(--phone-card);color:var(--phone-ink);font:650 15.5px var(--sans);letter-spacing:.02em;display:inline-flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;text-decoration:none;text-align:center;transition:transform .1s var(--ease),opacity .15s var(--ease);width:100%;white-space:nowrap}
.fa-btn:active{transform:translateY(1px) scale(.99)}
.fa-btn.pri{min-height:56px;background:var(--phone-acc);border-color:var(--phone-acc);color:var(--phone-card);font-size:17px;letter-spacing:.04em}
.fa-btn.ink{background:var(--phone-ink);border-color:var(--phone-ink);color:var(--phone-card)}
.fa-btn.lite{background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.22);color:var(--phone-card)}
.fa-btn[disabled]{opacity:.42;cursor:not-allowed;transform:none}
.fa-btn svg{flex:none}
.fa-btns{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}
.fa-btns+.fa-btn{margin-top:10px}
.fa-textbtn{min-height:44px;padding:0 4px;border:0;background:none;color:var(--phone-acc);font:600 15px var(--sans);cursor:pointer;display:inline-flex;align-items:center;gap:6px}
.dark .fa-textbtn,.cam .fa-textbtn{color:var(--phone-card);opacity:.8}
.fa-pill{display:inline-flex;align-items:center;gap:5px;height:26px;padding:0 10px;border-radius:999px;font-size:13px;font-weight:600;white-space:nowrap;background:var(--phone-bg);color:var(--phone-dim);box-shadow:inset 0 0 0 1px var(--phone-line)}
.fa-pill.ok{background:var(--ok-soft);color:var(--ok);box-shadow:none}
.fa-pill.warn{background:var(--warn-soft);color:var(--warn);box-shadow:none}
.fa-pill.bad{background:var(--bad-soft);color:var(--bad);box-shadow:none}
.fa-pill.acc{background:var(--accent-soft);color:var(--phone-acc);box-shadow:none}
.fa-new{display:flex;align-items:center;gap:8px;margin:-16px -16px 14px;padding:10px 16px;border-radius:15px 15px 0 0;background:var(--phone-acc);color:var(--phone-card);font-weight:650;font-size:14.5px}
.fa-kv{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;margin-top:12px;font-size:15px}
.fa-kv dt{color:var(--phone-dim)}.fa-kv dd{margin:0;min-width:0}
.fa-issue{margin-top:10px;font-size:15.5px}
.fa-li{display:flex;align-items:center;gap:12px;width:100%;min-height:64px;padding:10px 0;border:0;border-top:1px solid var(--phone-line);background:none;color:inherit;text-align:left;font:inherit;cursor:pointer}
.fa-li:first-of-type{border-top:0}
.fa-li .t{font-family:var(--mono);font-size:14px;font-weight:600;width:48px;flex:none}
.fa-list{margin-top:6px}
.fa-hrow,.fa-prow{display:grid;grid-template-columns:64px minmax(0,1fr);gap:10px;padding:11px 0;align-items:start}
.fa-hrow+.fa-hrow,.fa-prow+.fa-prow{border-top:1px solid var(--phone-line)}
.fa-hrow .d{font-family:var(--mono);font-size:14px;font-weight:600;padding-top:1px}
.fa-prow{grid-template-columns:minmax(0,1fr) auto;align-items:center}
.fa-tiles{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}
.fa-tile{min-height:108px;display:flex;flex-direction:column;justify-content:space-between;align-items:flex-start;gap:10px;padding:14px;border-radius:16px;border:1px solid var(--phone-line);background:var(--phone-card);color:var(--phone-ink);font:700 15px var(--sans);letter-spacing:.03em;text-align:left;cursor:pointer;transition:transform .1s var(--ease)}
.fa-tile:active{transform:scale(.985)}
.fa-tile svg{color:var(--phone-acc)}
.fa-tile .s{display:block;font:500 13px var(--sans);letter-spacing:0;color:var(--phone-dim);margin-top:3px}
.fa-tile.hi{background:var(--phone-acc);border-color:var(--phone-acc);color:var(--phone-card)}
.fa-tile.hi svg{color:var(--phone-card)}.fa-tile.hi .s{color:rgba(255,255,255,.82)}
.fa-tile.wide{grid-column:1/-1;min-height:68px;flex-direction:row;align-items:center;justify-content:flex-start;gap:14px}
.fa-banner{display:flex;align-items:center;gap:12px;margin-top:12px;padding:12px 14px;border-radius:12px;background:var(--warn-soft);color:var(--warn);font-weight:600;font-size:15px}
.fa-banner .fa-btn{width:auto;min-height:44px;flex:none}
.fa-subbar{position:relative;height:8px;border-radius:8px;background:var(--phone-line);margin:14px 0 4px}
.fa-subbar i{position:absolute;left:0;top:0;bottom:0;width:100%;border-radius:8px;background:var(--phone-acc);transform-origin:left;transition:transform .5s var(--ease)}
.fa-subbar b{position:absolute;top:-3px;width:2px;height:14px;margin-left:-1px;background:var(--phone-ink);opacity:.5}
.fa-ticks{position:relative;height:18px;font-family:var(--mono);font-size:11.5px;color:var(--phone-dim)}
.fa-ticks span{position:absolute;transform:translateX(-50%)}
.fa-ticks span:last-child{transform:translateX(-100%)}
.fa-priv{display:flex;gap:8px;align-items:flex-start;margin:14px 2px 0;font-size:13px;color:var(--phone-dim)}
.fa-priv svg{flex:none;margin-top:1px}
.fa-okline{display:flex;align-items:center;gap:8px;margin-top:12px;padding:10px 12px;border-radius:12px;background:var(--ok-soft);color:var(--ok);font-weight:650}
.fa-sum{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:14px}
.fa-sum div b{display:block;font-size:17px;font-weight:650;font-variant-numeric:tabular-nums}
.fa-sum div span{font-size:12.5px;color:var(--phone-dim)}
.fa-step{display:inline-flex;align-items:center;border:1px solid var(--phone-line);border-radius:999px;background:var(--phone-card);overflow:hidden}
.fa-step button{width:52px;height:52px;border:0;background:none;color:var(--phone-ink);font:600 24px var(--sans);cursor:pointer}
.fa-step button[disabled]{opacity:.3;cursor:not-allowed}
.fa-step b{min-width:44px;text-align:center;font-size:20px;font-variant-numeric:tabular-nums}
.fa-flbl{display:block;font-size:14px;font-weight:650;margin:16px 0 6px}
.fa-in,.fa-ta{width:100%;min-height:52px;border-radius:12px;border:1px solid var(--phone-line);background:var(--phone-card);color:var(--phone-ink);padding:0 14px;font:16px var(--sans);outline:none}
.fa-ta{min-height:112px;padding:12px 14px;resize:vertical;line-height:1.42;display:block}
.fa-in:focus,.fa-ta:focus{border-color:var(--phone-acc);box-shadow:0 0 0 3px var(--accent-soft)}
.fa-in[readonly]{background:var(--phone-bg);color:var(--phone-dim)}
.fa-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.fa-chip{min-height:48px;padding:0 16px;border-radius:999px;border:1px solid var(--phone-line);background:var(--phone-card);color:var(--phone-ink);font:500 15px var(--sans);cursor:pointer;text-align:left}
.fa-chip.on{background:var(--accent-soft);border-color:var(--phone-acc);color:var(--phone-acc)}
.dark .fa-chip,.cam .fa-chip{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.2);color:var(--phone-card)}
.dark .fa-chip.on,.cam .fa-chip.on{background:var(--phone-card);border-color:var(--phone-card);color:var(--phone-ink)}
.fa-err{margin-top:6px;font-size:14px;color:var(--bad)}
.fa-seg{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}
.fa-segb{min-height:52px;border-radius:12px;border:1px solid var(--phone-line);background:var(--phone-card);color:var(--phone-ink);font:600 15px var(--sans);cursor:pointer}
.fa-segb.on{border-color:var(--phone-acc);box-shadow:inset 0 0 0 1px var(--phone-acc);color:var(--phone-acc);background:var(--accent-soft)}
.fa-opt{display:flex;align-items:center;gap:14px;width:100%;min-height:72px;margin-top:10px;padding:12px 16px;border-radius:16px;border:1px solid var(--phone-line);background:var(--phone-card);color:var(--phone-ink);font:inherit;text-align:left;cursor:pointer}
.fa-opt b{display:block;font-size:16px;font-weight:700;letter-spacing:.02em}
.fa-opt span{display:block;font-size:13.5px;color:var(--phone-dim);margin-top:1px}
.fa-opt svg{flex:none;color:var(--phone-acc)}
.fa-opt.pri{min-height:92px;background:var(--phone-acc);border-color:var(--phone-acc);color:var(--phone-card)}
.fa-opt.pri svg,.fa-opt.pri span{color:var(--phone-card)}.fa-opt.pri span{opacity:.85}
.fa-opt.bad svg{color:var(--bad)}
/* sheets */
.fa-scrim{position:absolute;inset:0;z-index:20;background:var(--scrim);animation:mpFade .2s var(--ease) both}
.fa-sheet{position:absolute;left:0;right:0;bottom:0;z-index:21;max-height:90%;display:flex;flex-direction:column;background:var(--phone-card);border-radius:22px 22px 0 0;box-shadow:0 -12px 40px rgba(0,0,0,.18);animation:faUp .26s var(--ease) both}
.fa-sheet .grab{flex:none;width:40px;height:5px;border-radius:3px;background:var(--phone-line);margin:8px auto 2px}
.fa-sheet .sh{flex:none;display:flex;align-items:center;gap:8px;padding:4px 8px 0 16px}
.fa-sheet .sb{flex:1;min-height:0;overflow:auto;padding:2px 16px calc(20px + env(safe-area-inset-bottom))}
.fa.framed .fa-sheet .sb{padding-bottom:30px}
.fa-sheet.cam{top:0;max-height:none;border-radius:0;background:var(--phone-ink);color:var(--phone-card)}
/* camera */
.fa-cam{flex:1;min-height:0;display:flex;flex-direction:column;padding:0 16px 10px}
.fa-inst{font-size:17px;font-weight:650;text-align:center;margin:2px 0 10px}
.fa-vf{position:relative;flex:1;min-height:260px;border-radius:18px;overflow:hidden;display:flex;align-items:center;justify-content:center;background:radial-gradient(120% 70% at 50% 42%,rgba(255,255,255,.13),rgba(255,255,255,0) 62%),linear-gradient(180deg,rgba(255,255,255,.02),rgba(255,255,255,.08))}
.fa-vf.frozen{box-shadow:inset 0 0 0 2px var(--phone-acc)}
.fa-vf .tag{position:absolute;left:12px;top:12px;height:26px;padding:0 10px;border-radius:999px;background:rgba(255,255,255,.14);font:600 12px var(--mono);letter-spacing:.06em;display:flex;align-items:center}
.fa-frame{position:relative;padding:18px}
.fa-frame>i{position:absolute;width:30px;height:30px;border:3px solid var(--phone-card);opacity:.92}
.fa-frame>i:nth-child(1){left:0;top:0;border-right:0;border-bottom:0;border-radius:10px 0 0 0}
.fa-frame>i:nth-child(2){right:0;top:0;border-left:0;border-bottom:0;border-radius:0 10px 0 0}
.fa-frame>i:nth-child(3){left:0;bottom:0;border-right:0;border-top:0;border-radius:0 0 0 10px}
.fa-frame>i:nth-child(4){right:0;bottom:0;border-left:0;border-top:0;border-radius:0 0 10px 0}
.fa-flash{position:absolute;inset:0;z-index:30;background:var(--phone-card);pointer-events:none;animation:faFlash .38s ease-out both}
.fa-shutrow{display:flex;align-items:center;justify-content:center;gap:18px;padding:8px 0 2px}
.fa-shutter{width:78px;height:78px;border-radius:50%;border:4px solid var(--phone-card);background:none;padding:5px;cursor:pointer;flex:none}
.fa-shutter i{display:block;width:100%;height:100%;border-radius:50%;background:var(--phone-card);transition:transform .1s var(--ease)}
.fa-shutter:active i{transform:scale(.9)}
.fa-shutter[disabled]{opacity:.4;cursor:default}
.fa-ext{display:grid;gap:6px;margin-top:10px}
.fa-ext div{display:flex;justify-content:space-between;gap:12px;font-size:14.5px;padding:9px 12px;border-radius:12px;background:rgba(255,255,255,.08);animation:faIn .3s var(--ease) both}
.fa-ext div span{opacity:.7}
.fa-ext div b{font-family:var(--mono);font-weight:600;text-align:right}
.fa-anal{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:10px;font:600 13px var(--mono);letter-spacing:.12em}
.fa-anal i{width:8px;height:8px;border-radius:50%;background:var(--phone-acc);animation:mpPulse 1s ease-in-out infinite}
/* the part bag */
.fa-bag{position:relative;width:226px;height:262px;border-radius:6px 6px 14px 14px;transform:rotate(-3deg);background:linear-gradient(155deg,rgba(255,255,255,.27),rgba(255,255,255,.07) 38%,rgba(255,255,255,.13) 70%,rgba(255,255,255,.21));box-shadow:inset 0 0 0 1px rgba(255,255,255,.4),inset 0 -20px 30px rgba(255,255,255,.05),0 18px 40px rgba(0,0,0,.45)}
.fa-bag.sm{transform:rotate(-3deg) scale(.5);transform-origin:0 0;margin:0 -113px -131px 0}
.fa-bag-seal{position:absolute;left:0;right:0;top:0;height:18px;border-radius:6px 6px 0 0;background:repeating-linear-gradient(90deg,rgba(255,255,255,.44) 0 2px,rgba(255,255,255,.14) 2px 5px);box-shadow:0 1px 0 rgba(255,255,255,.5)}
.fa-bag-zip{position:absolute;left:8px;right:8px;top:30px;height:3px;border-radius:2px;background:rgba(255,255,255,.36)}
.fa-bag-label{position:absolute;left:20px;right:20px;top:46px;padding:9px 10px 8px;background:var(--phone-card);color:var(--phone-ink);border-radius:3px;font-family:var(--mono);box-shadow:0 1px 3px rgba(0,0,0,.3);overflow:hidden}
.fa-bl-brand{font-size:7.5px;letter-spacing:.14em;font-weight:700}
.fa-bl-sku{font-size:20px;font-weight:700;letter-spacing:.02em;margin-top:3px;line-height:1.1}
.fa-bl-desc{font:600 8.8px/1.25 var(--sans);margin-top:2px}
.fa-bl-row{display:flex;justify-content:space-between;font-size:8.8px;font-weight:700;margin-top:5px}
.fa-bl-bars{display:flex;height:24px;margin-top:6px}
.fa-bl-bars i{display:block;height:100%;background:var(--phone-ink)}
.fa-scanline{position:absolute;left:0;right:0;top:0;height:3px;background:var(--phone-acc);box-shadow:0 0 14px 3px var(--phone-acc);animation:faScan 1.05s var(--ease) infinite alternate}
.fa-bag-part{position:absolute;left:50%;bottom:28px;width:98px;height:36px;margin-left:-49px;border-radius:9px;background:var(--phone-ink);opacity:.8}
.fa-bag-part:before{content:"";position:absolute;left:12px;top:10px;width:16px;height:16px;border-radius:50%;background:rgba(255,255,255,.35);box-shadow:inset 0 0 0 4px rgba(255,255,255,.15)}
.fa-bag-part:after{content:"";position:absolute;right:-34px;top:12px;width:40px;height:22px;border:4px solid var(--phone-ink);border-left:0;border-radius:0 18px 18px 0}
.fa-bag-glare{position:absolute;inset:0;border-radius:inherit;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.2) 42%,transparent 52%);pointer-events:none}
/* result and confirmation */
.fa-idhead{display:flex;align-items:center;gap:12px;margin-top:6px}
.fa-idhead .ck{width:44px;height:44px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;background:var(--ok-soft);color:var(--ok)}
.fa-field{padding:12px 0}
.fa-field+.fa-field{border-top:1px solid var(--phone-line)}
.fa-field .v{font-size:17px;font-weight:600;margin-top:2px}
.fa-field .v.sku{font:700 26px var(--mono);letter-spacing:.01em}
.fa-done-list{display:grid;gap:8px;margin-top:14px}
.fa-done-list div{display:flex;gap:12px;align-items:flex-start;padding:12px 14px;border-radius:12px;background:var(--phone-card);border:1px solid var(--phone-line);animation:faIn .32s var(--ease) both}
.fa-done-list div svg{flex:none;color:var(--ok);margin-top:1px}
.fa-done-list div.warn{background:var(--warn-soft);border-color:transparent;color:var(--warn)}
.fa-done-list div.warn svg{color:var(--warn)}
.fa-done-list b{display:block;font-weight:650}
.fa-done-list span{display:block;font-size:13.5px;color:var(--phone-dim);margin-top:1px}
.fa-bigck{width:72px;height:72px;border-radius:50%;margin:18px auto 10px;display:flex;align-items:center;justify-content:center;background:var(--ok-soft);color:var(--ok);animation:faIn .3s var(--ease) both}
.fa-center{text-align:center}
.fa-sig{position:relative;margin-top:8px;border-radius:12px;border:1px dashed var(--phone-dim);background:var(--phone-card)}
.fa-sig canvas{display:block;width:100%;height:150px;touch-action:none;cursor:crosshair;color:var(--phone-ink)}
.fa-sig .ph{position:absolute;left:0;right:0;top:58px;text-align:center;color:var(--phone-dim);pointer-events:none;font-size:15px}
.fa-sig .base{position:absolute;left:18px;right:18px;bottom:34px;height:1px;background:var(--phone-line);pointer-events:none}
.fa-check{display:flex;gap:12px;align-items:flex-start;padding:12px 0}
.fa-check+.fa-check{border-top:1px solid var(--phone-line)}
.fa-check .ic{width:28px;height:28px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;background:var(--ok-soft);color:var(--ok)}
.fa-check .ic.no{background:var(--warn-soft);color:var(--warn)}
.fa-toggle{display:flex;align-items:center;gap:12px;min-height:52px;margin-top:8px;font-size:15.5px;cursor:pointer}
.fa-toggle input{width:24px;height:24px;accent-color:var(--phone-acc);flex:none}
/* desktop preview */
.fa-desk{display:grid;grid-template-columns:auto minmax(0,1fr);gap:26px;align-items:start}
.fa-left{display:flex;flex-direction:column;align-items:center;gap:12px;position:sticky;top:0}
.fa-pick{display:flex;align-items:center;gap:10px;width:100%}
.fa-pick .sel{flex:1;min-width:0;width:auto}
.fa-phone-wrap{position:relative;flex:none}
.fa-phone{position:absolute;left:0;top:0;width:414px;height:868px;transform-origin:0 0;padding:12px;border-radius:56px;background:var(--phone-ink);box-shadow:0 0 0 1px var(--border-strong),0 30px 70px rgba(0,0,0,.35)}
.fa-screenbox{position:relative;width:390px;height:844px;border-radius:44px;overflow:hidden;background:var(--phone-bg);display:flex;flex-direction:column;isolation:isolate}
.fa-sbar{position:absolute;left:0;right:0;top:0;z-index:35;height:47px;display:flex;align-items:center;justify-content:space-between;padding:4px 30px 0 36px;color:var(--phone-ink);font:650 15px var(--sans);pointer-events:none;font-variant-numeric:tabular-nums}
.fa-sbar .ic{display:flex;align-items:center;gap:6px}
.fa-sig4{display:flex;align-items:flex-end;gap:2px;height:12px}
.fa-sig4 i{display:block;width:3px;border-radius:1px;background:currentColor}
.fa-batt{position:relative;width:25px;height:12px;border-radius:4px;box-shadow:inset 0 0 0 1.5px currentColor;opacity:.9}
.fa-batt:before{content:"";position:absolute;left:3px;top:3px;bottom:3px;width:14px;border-radius:1.5px;background:currentColor}
.fa-batt:after{content:"";position:absolute;right:-3px;top:4px;width:2px;height:4px;border-radius:0 1px 1px 0;background:currentColor}
.fa-notch{position:absolute;top:11px;left:50%;width:122px;height:34px;margin-left:-61px;border-radius:20px;background:var(--phone-ink);z-index:40}
.fa-appbox{flex:1;min-height:0;position:relative;display:flex;flex-direction:column}
.fa-homebar{position:absolute;bottom:8px;left:50%;width:134px;height:5px;margin-left:-67px;border-radius:3px;background:var(--phone-ink);z-index:40;opacity:.8;pointer-events:none}
.fa-screenbox:has(.fa-screen.dark,.fa-sheet.cam) .fa-sbar{color:var(--phone-card)}
.fa-screenbox:has(.fa-screen.dark,.fa-sheet.cam) .fa-homebar{background:var(--phone-card)}
.fa-right{display:grid;gap:14px;min-width:0}
.fa-o-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));border-top:1px solid var(--border)}
.fa-o-sec{padding:14px 18px;min-width:0}
.fa-o-sec:nth-child(odd){border-right:1px solid var(--border)}
.fa-o-sec:nth-child(n+3){border-top:1px solid var(--border)}
.fa-o-h{font-size:11.5px;color:var(--dim);margin-bottom:8px}
.fa-o-num{font-size:26px;font-weight:600;letter-spacing:-.02em;font-variant-numeric:tabular-nums;line-height:1.1}
.fa-act{display:grid;grid-template-columns:44px minmax(0,1fr);gap:10px;padding:9px 18px;border-top:1px solid var(--border)}
.fa-act.new{animation:mpUp .3s var(--ease) both,mpFlash 1.6s var(--ease)}
.fa-url{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:2px 4px;color:var(--dim);font-size:12.5px}
.fa-mob-root{position:fixed;inset:0;height:100vh;height:100dvh;background:var(--phone-bg);z-index:1}
@keyframes faUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
@keyframes faIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes faFlash{from{opacity:.96}to{opacity:0}}
@keyframes faScan{from{transform:translateY(0)}to{transform:translateY(118px)}}
@media (max-width:900px){.fa-desk{grid-template-columns:1fr}.fa-left{position:static}.fa-o-grid{grid-template-columns:1fr}.fa-o-sec:nth-child(odd){border-right:0}.fa-o-sec:nth-child(n+2){border-top:1px solid var(--border)}}
@media (max-height:700px){.fa-vf{min-height:220px}.fa-bag{transform:rotate(-3deg) scale(.86)}}
@media (prefers-reduced-motion: reduce){.fa-flash{display:none}}
`;
if (typeof document !== "undefined" && document.head && !document.getElementById("fa-css")){
  const st = document.createElement("style"); st.id = "fa-css"; st.textContent = CSS; document.head.appendChild(st);
}

/* ---------- helpers ---------- */
const DAYLONG = (() => { const d = U.fromKey(TODAY); return U.WDAY[d.getDay()] + " " + d.getDate() + " " + U.MONTH[d.getMonth()]; })();
const ddMon = (k) => { const d = U.fromKey(k); return U.pad(d.getDate()) + " " + U.MON[d.getMonth()]; };
const first = (name) => String(name || "").split(" ")[0];
const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
const RM = () => { try { return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); } catch(e){ return false; } };
const isDone = (j) => Q.DONE.indexOf(j.status) >= 0;
const isMeasure = (j) => j.type === "Site measurement";
const live = (j) => !!(j.started && !j.ended);
const partShort = (sku) => { const P = Q.part(sku); return P ? P.name.split(",")[0] : sku; };
const sentence = (s) => { const m = String(s || "").match(/^[^.]*\.?/); return m ? m[0].trim() : ""; };
const shortIssue = (j) => { const s = sentence(j.issue); return s.length > 96 ? s.slice(0, 94).replace(/\s+\S*$/, "") + "…" : s; };
const contactOf = (j) => { const c = Q.cust(j.cust); return c.contacts.find(x => x.name === j.contact) || c.contacts[0] || {name:"Site contact", phone:"", role:""}; };
const telHref = (p) => "tel:" + String(p || "").replace(/[^\d+]/g, "");
const mapsHref = (j) => { const s = Q.site(j.site); return "https://maps.google.com/?q=" + s.pos[0] + "," + s.pos[1]; };
const assignedToday = (j) => (j.timeline || []).some(t => t.d === TODAY && /^(Assigned to|Reassigned)/.test(t.text));
const labelMachine = (j) => !!(j.machine && /Label/.test(Q.model(j.machine).type));
const packs = (j) => { const m = String(j.reported || j.issue || "").match(/(\d+)\s*packs/); return m ? m[1] : null; };
/* One short line for a past visit, the way an engineer would say it. */
function histText(j){
  if (j.type === "Planned maintenance") return /routine|six-monthly/i.test(j.issue) ? "Routine service" : "Planned maintenance";
  if (j.parts && j.parts.length) return cap(partShort(j.parts[0].sku).toLowerCase()) + " replaced";
  return sentence((j.report && j.report.summary) || j.issue).replace(/\.$/, "");
}
const ENG_STATUS = {"Scheduled":["Scheduled",""], "Travelling":["Travelling","acc"], "On Site":["On site","ok"], "Paused":["Paused","warn"], "Awaiting Part":["Waiting on part","warn"], "Unassigned":["Unassigned","warn"]};
const engStatus = (s) => Q.DONE.indexOf(s) >= 0 ? ["Complete","ok"] : ENG_STATUS[s] || [s, ""];
const bandLabel = (S, i) => S.rules.subsistence.bands[i].min + "+ hours";

function Pill(p){ return h("span", {className:"fa-pill " + (p.k || "")}, p.children); }
function JobPill(p){ const x = engStatus(p.j.status); return h(Pill, {k:x[1]}, x[0]); }
function FBtn(p){ const {k, icon, children, ...rest} = p; return h("button", Object.assign({type:"button", className:"fa-btn " + (k || "")}, rest), icon ? h(Icon, {n:icon, s:20}) : null, children); }
function FLink(p){ const ext = /^https?:/.test(p.href);
  return h("a", {className:"fa-btn " + (p.k || ""), href:p.href, target:ext ? "_blank" : null, rel:ext ? "noopener" : null, "aria-label":p.label}, p.icon ? h(Icon, {n:p.icon, s:20}) : null, p.children); }
function Lbl(p){ return h("div", {className:"fa-lbl", style:p.style}, p.children); }

/* ---------- screen shell ---------- */
function Screen(p){
  const c = p.ctx;
  return h("div", {className:"fa-screen" + (p.dark ? " dark" : "")},
    h("header", {className:"fa-hd" + (p.onBack ? " bk" : "")},
      p.onBack ? h("button", {type:"button", className:"fa-ib", onClick:p.onBack, "aria-label":p.backLabel || "Back"}, h(Icon, {n:p.backIcon || "back", s:22})) : null,
      h("div", {className:"fa-hd-t"}, p.titleEl || h(F, null, p.kicker ? h(Lbl, null, p.kicker) : null, h("div", {className:"fa-title"}, p.title))),
      p.right || null, p.dark ? null : c.escBtn),
    p.body || h("div", {className:"fa-scroll"}, p.children),
    p.foot ? h("div", {className:"fa-foot"}, p.foot) : null);
}

/* ---------- the app ---------- */
function initStack(eng){
  const n = Q.engNow(eng), st = [{s:"home"}], j = n.job;
  if (j && ["Travelling","On Site","Paused"].indexOf(j.status) >= 0){ st.push({s:"job", id:j.id}); if (live(j)) st.push({s:"active", id:j.id}); }
  return st;
}
function FieldApp(p){
  const S = p.S, eng = p.eng, E = Q.eng(eng);
  const [stack, setStack] = useState(() => p.init || initStack(eng));
  const [sheet, setSheet] = useState(p.initSheet || null);
  const n = Q.engNow(eng);
  const ctx = {S, eng, E, n, framed:!!p.framed,
    push:(x) => { setSheet(null); setStack(s => s.concat([x])); },
    pop:() => { setSheet(null); setStack(s => s.length > 1 ? s.slice(0, -1) : s); },
    go:(list) => { setSheet(null); setStack([{s:"home"}].concat(list || [])); },
    sheet:(x) => setSheet(x), close:() => setSheet(null),
    escBtn: p.escape ? h("button", {type:"button", className:"fa-esc", onClick:p.escape, title:"Back to the office screens"}, "Office view") : null};
  const top = stack[stack.length - 1];
  const SC = SCREENS[top.s] || Home;
  const SH = sheet ? SHEETS[sheet.k] : null;
  return h("div", {className:"fa " + (p.framed ? "framed" : "mob"), "data-theme":"light"},
    h(SC, {key:stack.length + ":" + top.s + ":" + (top.id || top.mid || ""), ctx, top}),
    SH ? h(F, null, SH.cam ? null : h("div", {className:"fa-scrim", onClick:ctx.close}), h(SH.C, {key:sheet.k, ctx, sh:sheet})) : null);
}
MP.FieldApp = FieldApp;

/* ---------- HOME ---------- */
function Home(p){
  const c = p.ctx, S = c.S, n = c.n, E = c.E, rec = Q.subDay(c.eng, TODAY);
  const greet = (S.clock < 720 ? "Good morning, " : "Good afternoon, ") + first(E.name);
  const brand = h("div", {className:"fa-brand"}, h("span", {className:"fa-logo", "aria-hidden":"true"}, "M"),
    h("div", {style:{minWidth:0}}, h("div", {className:"fa-title", style:{fontSize:16}}, "Myers Pulse"), h("div", {className:"fa-dim", style:{fontSize:12.5}}, E.name + " · " + Q.loc(E.van).name)));
  const qr = h("button", {type:"button", className:"fa-ib box", "aria-label":"Scan machine QR", title:"Scan machine QR", onClick:() => c.sheet({k:"qr"})}, h(Icon, {n:"qr", s:22}));
  const head = h(F, null, h("div", {className:"fa-h1"}, greet), h("div", {className:"fa-dim fa-big"}, DAYLONG));
  if (n.status === "On leave") return h(Screen, {ctx:c, titleEl:brand},
    head, h("section", {className:"fa-card"}, h(Lbl, null, "Today"), h("div", {className:"fa-h2", style:{marginTop:6}}, "On annual leave"),
      h("p", {className:"fa-dim"}, "No jobs are assigned to you and location sharing is off. Enjoy the day.")));
  const jobs = n.jobs;
  const focus = n.job && n.job.status !== "Awaiting Part" ? n.job : n.next;
  const toBase = n.status === "Travelling" && n.place === "base";
  const allDone = jobs.length > 0 && jobs.every(j => isDone(j) || j.status === "Awaiting Part");
  let main = null, summary = false;
  if (toBase) main = h(BaseTrip, {ctx:c, rec});
  else if (focus) main = h(JobCard, {ctx:c, j:focus});
  else if (n.status === "On site" && allDone) main = h(HeadBack, {ctx:c});
  else if (n.status === "Signed off" || (n.status === "At base" && allDone)){ main = h(DaySummary, {ctx:c, rec}); summary = true; }
  else main = h("section", {className:"fa-card"}, h(Lbl, null, "Jobs"), h("div", {className:"fa-strong", style:{marginTop:6}}, "No jobs for you yet today"),
    h("p", {className:"fa-dim"}, "New jobs from the office appear here, with a notification."));
  const rest = jobs.filter(j => j !== focus);
  const t = S.rules.tracking;
  return h(Screen, {ctx:c, titleEl:brand, right:qr},
    head,
    h("div", {className:"fa-row", style:{marginTop:12, gap:8}}, h(Lbl, null, "Today"),
      h("span", {className:"fa-strong"}, jobs.length + " job" + (jobs.length === 1 ? "" : "s")),
      jobs.length ? h("span", {className:"fa-dim"}, "· " + n.done.length + " done") : null),
    main,
    rest.length ? h("section", {className:"fa-card", style:{paddingTop:10, paddingBottom:6}}, h(Lbl, null, focus ? "Rest of today" : "Today’s jobs"),
      h("div", {className:"fa-list"}, rest.map(j => h("button", {key:j.id, type:"button", className:"fa-li", onClick:() => c.push({s:"job", id:j.id})},
        h("span", {className:"t"}, j.start || "--:--"),
        h("div", {className:"fa-grow"}, h("div", {style:{fontWeight:650}}, Q.cust(j.cust).name), h("div", {className:"fa-dim fa-sm"}, "Job #" + j.id + " · " + (j.machine ? Q.model(j.machine).name : j.type))),
        h(JobPill, {j}))))) : null,
    summary ? null : h(SubCard, {S, rec}),
    h("p", {className:"fa-priv"}, h(Icon, {n:"rules", s:16}), "Location shared " + t.from + " to " + t.to + " while on duty, for " + t.reason.toLowerCase() + "."));
}
function JobCard(p){
  const c = p.ctx, j = p.j, n = c.n, cu = Q.cust(j.cust), si = Q.site(j.site), ct = contactOf(j), M = j.machine ? Q.model(j.machine) : null;
  const isNew = j.status === "Scheduled" && assignedToday(j);
  const open = () => c.push({s:"job", id:j.id});
  let lbl, pri;
  if (j.status === "Travelling"){ lbl = "On the way · ETA " + (n.eta != null ? U.hm(n.eta) : "--:--"); pri = h(FBtn, {k:"pri", icon:"check", onClick:() => A.fieldArrive(c.eng)}, "ARRIVED"); }
  else if ((j.status === "On Site" || j.status === "Paused") && live(j)){ lbl = "Job in progress since " + j.started; pri = h(FBtn, {k:"pri", onClick:() => c.go([{s:"job", id:j.id},{s:"active", id:j.id}])}, "CONTINUE JOB"); }
  else if (j.status === "On Site"){ lbl = "On site"; pri = h(FBtn, {k:"pri", icon:"play", onClick:() => { A.fieldStart(j.id); c.go([{s:"job", id:j.id},{s:"active", id:j.id}]); }}, "START JOB"); }
  else { lbl = "Next job"; pri = h(FBtn, {k:"pri", onClick:open}, "OPEN JOB"); }
  return h("section", {className:"fa-card" + (isNew ? " hi" : ""), "aria-label":lbl},
    isNew ? h("div", {className:"fa-new"}, h(Icon, {n:"attention", s:18}), "New job from the office") : null,
    h("div", {className:"fa-row", style:{justifyContent:"space-between"}}, h(Lbl, null, lbl), h("span", {className:"fa-time"}, j.start || "")),
    h("div", {className:"fa-h2", style:{marginTop:6}}, cu.name),
    h("div", {className:"fa-dim"}, si.name + ", " + si.town.split(",")[0]),
    h("dl", {className:"fa-kv"},
      h("dt", null, M ? "Machine" : "Visit"), h("dd", null, M ? M.name : j.type + (isMeasure(j) ? ", not chargeable" : "")),
      M ? h(F, null, h("dt", null, "Serial"), h("dd", {className:"fa-mono"}, j.machine)) : null),
    h("div", {className:"fa-issue"}, shortIssue(j)),
    h("div", {className:"fa-btns"}, h(FLink, {href:mapsHref(j), icon:"nav", label:"Navigate to " + cu.name}, "NAVIGATE"), h(FLink, {href:telHref(ct.phone), icon:"phone", label:"Call " + ct.name}, "CALL")),
    pri,
    j.status !== "Scheduled" ? h("div", {className:"fa-center", style:{marginTop:4}}, h("button", {type:"button", className:"fa-textbtn", onClick:open}, "Job details", h(Icon, {n:"arrow", s:15}))) : null);
}
function HeadBack(p){
  const c = p.ctx, n = c.n;
  return h("section", {className:"fa-card"}, h(Lbl, null, "All jobs done"), h("div", {className:"fa-h2", style:{marginTop:6}}, "No more jobs today"),
    h("p", {className:"fa-dim"}, "You are at " + Q.placeName(n.place) + ". Head back when you are ready. Pulse records your return to the Myers zone on its own."),
    h("div", {style:{marginTop:14}}, h(FBtn, {k:"pri", icon:"nav", onClick:() => A.fieldDepart(c.eng, null)}, "HEAD BACK TO BASE")));
}
function BaseTrip(p){
  const c = p.ctx, n = c.n, S = c.S;
  return h("section", {className:"fa-card hi"}, h(Lbl, null, "Heading back to base"),
    h("div", {className:"fa-row", style:{marginTop:6, alignItems:"baseline"}}, h("span", {className:"fa-h2"}, "ETA " + (n.eta != null ? U.hm(n.eta) : "--:--")), h("span", {className:"fa-dim"}, MP.geo.BASE.name)),
    h("p", {className:"fa-dim"}, "The subsistence timer stops by itself when you are back inside the " + S.rules.subsistence.radius + " km zone."),
    h("div", {style:{marginTop:14}}, h(FBtn, {k:"pri", icon:"check", onClick:() => A.fieldArrive(c.eng)}, "ARRIVED AT BASE")));
}
function DaySummary(p){
  const c = p.ctx, S = c.S, n = c.n, rec = p.rec;
  const d = Q.day(c.eng, TODAY), so = d ? d.ev.slice().reverse().find(e => e.type === "signoff") : null;
  const signed = n.status === "Signed off";
  return h("section", {className:"fa-card"}, h(Lbl, null, "Day summary"),
    rec.exit != null ? h(F, null,
      h("div", {className:"fa-bignum", style:{marginTop:8}}, U.dur(rec.away)),
      h("div", {className:"fa-dim"}, "Away from base · out " + U.hm(rec.exit) + ", back " + (rec.ret != null ? U.hm(rec.ret) : "not yet")),
      h("div", {className:"fa-sum"},
        h("div", null, h("b", null, rec.band != null ? bandLabel(S, rec.band) : "Below " + S.rules.subsistence.bands[0].min + "h"), h("span", null, "Band")),
        h("div", null, h("b", null, n.done.length + " of " + n.jobs.length), h("span", null, "Jobs done")),
        h("div", null, h("b", null, U.dur(n.travel)), h("span", null, "Travel"))),
      rec.band != null ? h("div", {className:"fa-okline"}, h(Icon, {n:"check", s:18}), U.eur2(rec.allowance) + " · calculated automatically") : null)
    : h(F, null, h("div", {className:"fa-strong", style:{marginTop:6}}, "Inside the Myers zone all day"), h("p", {className:"fa-dim"}, "No subsistence today. " + n.done.length + " of " + n.jobs.length + " jobs done.")),
    h("div", {style:{marginTop:14}}, signed ? h("p", {className:"fa-dim fa-center"}, "Day finished. Signed off at " + (so ? U.hm(so.t) : U.hm(S.clock)) + ".")
      : h(FBtn, {k:"pri", onClick:() => A.finishDay(c.eng)}, "FINISH DAY")));
}
function SubCard(p){
  const S = p.S, rec = p.rec, r = S.rules.subsistence, bands = r.bands.slice().sort((a, b) => a.min - b.min), topH = bands[bands.length - 1].min;
  let title, line;
  if (rec.exit == null){ title = "Inside Myers zone"; line = "The subsistence timer starts on its own when you leave the " + r.radius + " km zone."; }
  else if (rec.inProgress){ title = "Outside Myers zone since " + U.hm(rec.exit); line = U.dur(rec.away) + " · " + (rec.band != null ? "qualifies, " + bandLabel(S, rec.band) + ", " + U.eur2(rec.allowance) : "qualifies at " + bands[0].min + "h"); }
  else { title = "Back in Myers zone at " + U.hm(rec.ret); line = U.dur(rec.away) + " away · " + (rec.band != null ? bandLabel(S, rec.band) + ", " + U.eur2(rec.allowance) : "below " + bands[0].min + "h"); }
  const v = Math.max(0, Math.min(1, rec.away / (topH * 60)));
  return h("section", {className:"fa-card"},
    h("div", {className:"fa-row"}, h(Icon, {n:"subsistence", s:24, style:{color:"var(--phone-acc)", flex:"none"}}),
      h("div", {className:"fa-grow"}, h(Lbl, null, "Subsistence"), h("div", {className:"fa-strong"}, title))),
    h("div", {className:"fa-dim", style:{marginTop:6}}, line),
    rec.exit != null ? h(F, null,
      h("div", {className:"fa-subbar", role:"img", "aria-label":U.dur(rec.away) + " of " + topH + " hours"}, h("i", {style:{transform:"scaleX(" + v + ")"}}), bands.slice(0, -1).map(b => h("b", {key:b.min, style:{left:(b.min / topH * 100) + "%"}}))),
      h("div", {className:"fa-ticks"}, h("span", {style:{left:"0%", transform:"none"}}, "0h"), bands.map(b => h("span", {key:b.min, style:{left:(b.min / topH * 100) + "%"}}, b.min + "h")))) : null);
}

/* ---------- JOB ---------- */
function Gone(p){ return h(Screen, {ctx:p.ctx, title:"Job", onBack:p.ctx.pop}, h("section", {className:"fa-card"}, h("div", {className:"fa-strong"}, "This job is not on your list"), h("p", {className:"fa-dim"}, "The office may have moved it. Your current jobs are on the home screen."))); }
function JobScreen(p){
  const c = p.ctx, S = c.S, n = c.n, j = Q.job(p.top.id);
  if (!j || j.eng !== c.eng) return h(Gone, {ctx:c});
  const cu = Q.cust(j.cust), si = Q.site(j.site), ct = contactOf(j), m = j.machine ? Q.mach(j.machine) : null, M = m ? Q.model(j.machine) : null;
  const van = c.E.van, meas = isMeasure(j);
  const hist = m ? Q.machineJobs(m.id).filter(x => x.id !== j.id && (x.date < TODAY || isDone(x))) : [];
  const manuals = m ? Q.docsFor({type:"machine", id:m.id}).filter(d => d.kind === "Manual") : [];
  const busy = n.jobs.find(x => x.id !== j.id && live(x) && ["On Site","Paused"].indexOf(x.status) >= 0);
  const tripElsewhere = n.status === "Travelling" && (!n.job || n.job.id !== j.id);
  const isNew = j.status === "Scheduled" && assignedToday(j);
  let foot;
  if (j.status === "Scheduled"){
    const blocked = busy ? "Finish Job #" + busy.id + " first" : tripElsewhere ? "Finish your current trip first" : null;
    foot = h(F, null, blocked ? h("div", {className:"fa-note"}, blocked) : null,
      h("div", {className:"fa-two"}, h(FLink, {href:mapsHref(j), icon:"nav"}, "NAVIGATE"), h(FBtn, {k:"pri", disabled:!!blocked, onClick:() => A.fieldDepart(c.eng, j.id)}, "START TRAVEL")));
  } else if (j.status === "Travelling"){
    foot = h(F, null, h("div", {className:"fa-note"}, "On the way · ETA " + (n.eta != null ? U.hm(n.eta) : "--:--") + " · " + cu.name + " has been told"),
      h("div", {className:"fa-two"}, h(FLink, {href:mapsHref(j), icon:"nav"}, "NAVIGATE"), h(FBtn, {k:"pri", onClick:() => A.fieldArrive(c.eng)}, "ARRIVED")));
  } else if ((j.status === "On Site" || j.status === "Paused") && !j.started){
    foot = h(FBtn, {k:"pri", icon:"play", onClick:() => { A.fieldStart(j.id); c.push({s:"active", id:j.id}); }}, "START JOB");
  } else if ((j.status === "On Site" || j.status === "Paused") && live(j)){
    foot = h(FBtn, {k:"pri", onClick:() => c.push({s:"active", id:j.id})}, "CONTINUE JOB");
  } else if (j.status === "Awaiting Part" && live(j)){
    foot = h(F, null, h("div", {className:"fa-note warn"}, "Waiting on a part. The office has been told."), h(FBtn, {k:"pri", onClick:() => { A.resume(j.id); c.push({s:"active", id:j.id}); }}, "RESUME JOB"));
  } else if (isDone(j)){
    foot = h("div", {className:"fa-note"}, "Completed" + (j.ended ? " at " + j.ended : "") + ". " + (DONE_WORDS[j.status] || ["Sent to the office"])[0] + ".");
  }
  return h(Screen, {ctx:c, onBack:c.pop, title:"Job #" + j.id, foot},
    isNew ? h("div", {className:"fa-card hi", style:{padding:"12px 16px"}}, h("div", {className:"fa-row", style:{color:"var(--phone-acc)", fontWeight:650, gap:8}}, h(Icon, {n:"attention", s:18}), "New job from the office")) : null,
    h("div", {style:{marginTop:10}},
      h("div", {className:"fa-row", style:{gap:8, flexWrap:"wrap"}}, h(Lbl, null, "Job #" + j.id + " · " + cu.name.split(" ")[0]), j.prio === "Urgent" || j.prio === "High" ? h(Pill, {k:j.prio === "Urgent" ? "bad" : "warn"}, j.prio + " priority") : null, h(JobPill, {j})),
      h("div", {className:"fa-h1"}, cu.name),
      h("div", {className:"fa-dim fa-big"}, (j.start ? j.start + " · " : "") + j.type + (meas ? ", not chargeable" : ""))),
    h("section", {className:"fa-card"},
      h(Lbl, null, "Customer contact"),
      h("div", {className:"fa-row", style:{marginTop:6}},
        h("div", {className:"fa-grow"}, h("div", {className:"fa-strong"}, ct.name), h("div", {className:"fa-dim fa-sm"}, ct.role),
          h("a", {href:telHref(ct.phone), className:"fa-mono", style:{color:"var(--phone-acc)", fontSize:16, fontWeight:600, textDecoration:"none", display:"inline-block", marginTop:4}}, ct.phone)),
        h("a", {className:"fa-ib box acc", href:telHref(ct.phone), "aria-label":"Call " + ct.name}, h(Icon, {n:"phone", s:22}))),
      h("div", {className:"fa-sep"}),
      h(Lbl, null, "Site"),
      h("div", {className:"fa-row", style:{marginTop:6}},
        h("div", {className:"fa-grow"}, h("div", {className:"fa-strong"}, si.name), h("div", {className:"fa-dim fa-sm"}, si.town)),
        h("a", {className:"fa-ib box acc", href:mapsHref(j), target:"_blank", rel:"noopener", "aria-label":"Navigate to " + si.name}, h(Icon, {n:"nav", s:22})))),
    h("section", {className:"fa-card"}, h(Lbl, null, "Machine"),
      m ? h("div", {className:"fa-row", style:{marginTop:6, alignItems:"flex-start"}},
        h("div", {className:"fa-grow"}, h("div", {className:"fa-strong"}, M.name), h("div", {className:"fa-dim fa-sm"}, M.type),
          h("div", {className:"fa-mono", style:{fontSize:16, fontWeight:600, marginTop:6}}, m.id),
          h("div", {className:"fa-dim fa-sm", style:{marginTop:2}}, (m.installed ? "Installed " + U.dmy(m.installed) + " · " : "") + (Q.warrantyActive(m.id) ? "Under warranty to " + U.dmy(m.warrantyEnd) : "Out of warranty"))),
        h("button", {type:"button", className:"fa-ib box acc", "aria-label":"Show machine QR and record", onClick:() => c.sheet({k:"qr", mid:m.id})}, h(Icon, {n:"qr", s:22})))
      : h("p", {className:"fa-dim"}, meas ? "No machine on this visit. Measure the space and photograph it for the quote." : "Machine not identified yet. Scan the Myers QR tag on site.")),
    h("section", {className:"fa-card"}, h(Lbl, null, "Issue"),
      h("div", {className:"fa-big", style:{marginTop:6}}, j.issue),
      j.reported && j.reported !== j.issue ? h("p", {className:"fa-dim fa-sm"}, "“" + j.reported + "” " + ct.name) : null),
    m ? h("section", {className:"fa-card", style:{paddingBottom:8}}, h("div", {className:"fa-row", style:{justifyContent:"space-between"}}, h(Lbl, null, "History"),
        hist.length ? h("button", {type:"button", className:"fa-textbtn", onClick:() => c.push({s:"history", mid:m.id, cur:j.id})}, "All " + hist.length) : null),
      hist.length ? hist.slice(0, 3).map(x => h("div", {key:x.id, className:"fa-hrow"}, h("span", {className:"d"}, ddMon(x.date)), h("div", null, h("div", {style:{fontWeight:600}}, histText(x)), h("div", {className:"fa-dim fa-sm"}, "Job #" + x.id + (x.date.slice(0, 4) !== TODAY.slice(0, 4) ? " · " + x.date.slice(0, 4) : "")))))
        : h("p", {className:"fa-dim"}, "No earlier visits on this machine.")) : null,
    !meas && (j.possibleParts || []).length ? h("section", {className:"fa-card", style:{paddingBottom:8}}, h(Lbl, null, "Possible parts"),
      j.possibleParts.map(sku => { const P = Q.part(sku), q = (S.stock[van] || {})[sku] || 0;
        return h("div", {key:sku, className:"fa-prow"}, h("div", {style:{minWidth:0}}, h("div", {className:"fa-mono", style:{fontWeight:700, fontSize:15}}, sku), h("div", {className:"fa-dim fa-sm"}, P.name)),
          h(Pill, {k:q > 0 ? "ok" : "warn"}, q > 0 ? "Van stock: " + q : "Not in van")); })) : null,
    manuals.length ? h("section", {className:"fa-card", style:{paddingBottom:8}}, h(Lbl, null, "Documents"),
      manuals.map(d => h("div", {key:d.id, className:"fa-prow"}, h("div", {className:"fa-row", style:{gap:10}}, h(Icon, {n:"documents", s:22, style:{color:"var(--phone-acc)", flex:"none"}}), h("div", {style:{minWidth:0}}, h("div", {style:{fontWeight:600}}, d.name), h("div", {className:"fa-dim fa-sm"}, "PDF · " + d.size))),
        h("button", {type:"button", className:"fa-textbtn", onClick:() => MP.toast(d.name, "Opened on the phone. Kept for offline use.", "info")}, "View")))) : null);
}

/* ---------- ACTIVE JOB ---------- */
function Active(p){
  const c = p.ctx, S = c.S, j = Q.job(p.top.id);
  if (!j || j.eng !== c.eng) return h(Gone, {ctx:c});
  if (isDone(j)) return h(Done, p);
  const cu = Q.cust(j.cust), M = j.machine ? Q.model(j.machine) : null, meas = isMeasure(j);
  const mins = j.started ? Math.max(0, S.clock - U.toMin(j.started)) : 0;
  const paused = j.status === "Paused", waiting = j.status === "Awaiting Part";
  const earlier = j.machine ? Q.machineJobs(j.machine).filter(x => x.id !== j.id).length : 0;
  const T = (icon, label, sub, fn, k) => h("button", {key:label, type:"button", className:"fa-tile " + (k || ""), onClick:fn}, h(Icon, {n:icon, s:26}), h("span", null, label, h("span", {className:"s"}, sub)));
  const tiles = meas ? [
    T("note", "ADD MEASUREMENT", j.notes.length ? j.notes.length + " recorded" : "One tap or type", () => c.sheet({k:"note", id:j.id})),
    T("camera", "TAKE PHOTO", j.photos + " on this job", () => c.sheet({k:"photo", id:j.id})),
    T("alert", "REPORT ISSUE", "Access or safety", () => c.sheet({k:"issue", id:j.id}), "wide")
  ] : [
    T("note", "ADD NOTE", j.notes.length ? j.notes.length + " so far" : "One tap or type", () => c.sheet({k:"note", id:j.id})),
    T("camera", "TAKE PHOTO", j.photos + " on this job", () => c.sheet({k:"photo", id:j.id})),
    T("parts", "ADD PART", "Scan the bag label", () => c.sheet({k:"addpart", id:j.id}), "hi"),
    T("alert", "REPORT ISSUE", "Part, access, safety", () => c.sheet({k:"issue", id:j.id})),
    j.machine ? T("history", "VIEW MACHINE HISTORY", earlier + " earlier visits on " + j.machine, () => c.push({s:"history", mid:j.machine, cur:j.id}), "wide") : null
  ];
  return h(Screen, {ctx:c, onBack:c.pop, kicker:"Job #" + j.id, title:cu.name,
    foot:h(F, null, paused || waiting ? h("div", {className:"fa-note"}, "Resume the job to complete it") : null,
      h(FBtn, {k:"pri", icon:"check", disabled:paused || waiting, onClick:() => c.push({s:"complete", id:j.id})}, "COMPLETE JOB"))},
    h("section", {className:"fa-card"},
      h("div", {className:"fa-row", style:{justifyContent:"space-between", alignItems:"flex-end"}},
        h("div", null, h(Lbl, null, "Job started"), h("div", {className:"fa-bignum"}, j.started)),
        h("div", {style:{textAlign:"right"}}, h(Lbl, null, "On site"), h("div", {className:"fa-bignum", style:{color:"var(--phone-acc)"}}, U.dur(mins)))),
      h("div", {className:"fa-dim", style:{marginTop:8}}, cu.name + (M ? " · " + M.name + " " + j.machine : " · " + j.type))),
    paused || waiting ? h("div", {className:"fa-banner", role:"status"}, h("span", {className:"fa-grow"}, waiting ? "Waiting on a part. The office has been told." : "Work paused. The office has been told."),
      h(FBtn, {k:"ink", onClick:() => A.resume(j.id)}, "RESUME")) : null,
    h("div", {className:"fa-tiles"}, tiles.filter(Boolean)),
    h(Recorded, {ctx:c, j}));
}
function Recorded(p){
  const j = p.j, meas = isMeasure(j);
  const rows = [];
  if (!meas) rows.push(h("div", {key:"parts", className:"fa-check"}, h("span", {className:"ic" + (j.parts.length ? "" : " no")}, h(Icon, {n:"parts", s:15})),
    h("div", {className:"fa-grow"}, h("div", {style:{fontWeight:600}}, j.parts.length ? j.parts.length + " part" + (j.parts.length > 1 ? "s" : "") + " recorded" : "No parts yet"),
      j.parts.map((x, i) => h("div", {key:i, className:"fa-dim fa-sm"}, x.sku + " " + partShort(x.sku) + " × " + x.qty + ", " + Q.loc(x.from).name)))));
  rows.push(h("div", {key:"ph", className:"fa-check"}, h("span", {className:"ic" + (j.photos ? "" : " no")}, h(Icon, {n:"camera", s:15})), h("div", {style:{fontWeight:600}}, j.photos ? j.photos + " photo" + (j.photos > 1 ? "s" : "") : "No photos yet")));
  rows.push(h("div", {key:"nt", className:"fa-check"}, h("span", {className:"ic" + (j.notes.length ? "" : " no")}, h(Icon, {n:"note", s:15})),
    h("div", {className:"fa-grow"}, h("div", {style:{fontWeight:600}}, j.notes.length ? j.notes.length + (meas ? " measurement" : " note") + (j.notes.length > 1 ? "s" : "") : meas ? "No measurements yet" : "No notes yet"),
      j.notes.slice(-3).map((x, i) => h("div", {key:i, className:"fa-dim fa-sm"}, x.t + "  " + x.text)))));
  return h("section", {className:"fa-card", style:{paddingTop:12, paddingBottom:4}}, h(Lbl, null, "Recorded so far"), rows);
}

/* ---------- MACHINE HISTORY ---------- */
function History(p){
  const c = p.ctx, mid = p.top.mid, m = Q.mach(mid);
  if (!m) return h(Gone, {ctx:c});
  const M = Q.model(mid), js = Q.machineJobs(mid), parts = Q.machineParts(mid), si = Q.site(m.site);
  return h(Screen, {ctx:c, onBack:c.pop, kicker:mid, title:"Machine history"},
    h("div", {style:{marginTop:10}}, h("div", {className:"fa-h2"}, M.name), h("div", {className:"fa-dim"}, Q.cust(m.cust).name + ", " + si.name),
      h("div", {className:"fa-dim fa-sm", style:{marginTop:2}}, (m.installed ? "Installed " + U.dmy(m.installed) + " · " : "") + js.length + " visits on record")),
    h("section", {className:"fa-card", style:{paddingBottom:6}},
      js.length ? js.map(x => { const pp = parts.filter(q => q.job === x.id);
        return h("div", {key:x.id, className:"fa-hrow"}, h("span", {className:"d"}, ddMon(x.date), h("div", {className:"fa-dim", style:{fontSize:12, fontWeight:400}}, x.date.slice(0, 4))),
          h("div", {style:{minWidth:0}},
            h("div", {className:"fa-row", style:{gap:8, flexWrap:"wrap"}}, h("span", {style:{fontWeight:650}}, x.id === p.top.cur ? "This visit" : histText(x)), x.id === p.top.cur ? h(JobPill, {j:x}) : null),
            h("div", {className:"fa-dim fa-sm", style:{marginTop:2}}, "Job #" + x.id + " · " + (x.eng === c.eng ? "you" : x.type)),
            x.report && x.id !== p.top.cur ? h("div", {className:"fa-sm", style:{marginTop:4}}, x.report.summary) : x.id === p.top.cur ? h("div", {className:"fa-sm", style:{marginTop:4}}, x.issue) : null,
            pp.length ? h("div", {style:{marginTop:6, display:"flex", flexWrap:"wrap", gap:6}}, pp.map((q, i) => h(Pill, {key:i}, q.sku + " × " + q.qty))) : null)); })
      : h("p", {className:"fa-dim"}, "No visits on record yet.")));
}

/* ---------- COMPLETE ---------- */
function suggestSummary(j){
  if (isMeasure(j)){ const ns = j.notes.map(x => x.text.replace(/\.$/, ""));
    return "Site measured for the quote." + (ns.length ? " " + ns.join(". ") + "." : "") + " Photos attached."; }
  const lab = labelMachine(j), tail = lab ? ", labels applied correctly." : ", running correctly.";
  const parts = j.parts.map(x => partShort(x.sku).toLowerCase() + " " + x.sku + (x.qty > 1 ? " (× " + x.qty + ")" : ""));
  let s = parts.length ? cap(parts.join(" and ")) + " replaced." : "Inspected and adjusted, no parts needed.";
  const test = j.notes.find(x => /^Tested/i.test(x.text)), pk = packs(j);
  s += " " + (test ? test.text.replace(/\.$/, "") + tail : pk ? "Tested at " + pk + " packs/min" + tail : "Tested at line speed" + tail);
  j.notes.filter(x => x !== test).forEach(x => { s += " " + x.text.replace(/\.$/, "") + "."; });
  return s;
}
function Complete(p){
  const c = p.ctx, S = c.S, j = Q.job(p.top.id);
  const [summary, setSummary] = useState("");
  const ct = j ? contactOf(j) : {name:""};
  const [name, setName] = useState(ct.name);
  const [inked, setInked] = useState(false);
  const [noParts, setNoParts] = useState(false);
  if (!j || j.eng !== c.eng) return h(Gone, {ctx:c});
  if (isDone(j)) return h(Done, p);
  const meas = isMeasure(j), tm = Q.jobTimes(j);
  const needSig = !meas;
  const complete = () => {
    const signedBy = inked && name.trim() ? name.trim() : undefined;
    A.completeJob(j.id, {summary:summary.trim(), signedBy, noParts: !j.parts.length && (meas || noParts)});
    c.go([{s:"done", id:j.id}]);
  };
  const warn = !summary.trim() ? "Add a short summary to complete" : needSig && !inked ? "No signature: the office will review before invoicing" : !meas && !j.parts.length && !noParts ? "No parts recorded: tick “No parts used” if that is right" : null;
  return h(Screen, {ctx:c, onBack:c.pop, kicker:"Job #" + j.id, title:"Complete job",
    foot:h(F, null, warn ? h("div", {className:"fa-note" + (summary.trim() ? " warn" : "")}, warn) : null, h(FBtn, {k:"pri", icon:"check", disabled:!summary.trim(), onClick:complete}, "COMPLETE JOB"))},
    h("div", {style:{marginTop:8}}, h("div", {className:"fa-h2"}, Q.cust(j.cust).name), h("div", {className:"fa-dim"}, (j.machine ? Q.model(j.machine).name + " " + j.machine : j.type) + " · started " + j.started)),
    h("label", {className:"fa-flbl", htmlFor:"fa-sum"}, meas ? "Measurements recorded" : "Work summary"),
    h("textarea", {id:"fa-sum", className:"fa-ta", value:summary, onChange:(e) => setSummary(e.target.value), placeholder:meas ? "What did you measure?" : "What did you find and fix?"}),
    h("div", {style:{marginTop:8}}, h(FBtn, {icon:"check", onClick:() => setSummary(suggestSummary(j))}, "Use suggested summary")),
    h("div", {className:"fa-dim fa-sm", style:{marginTop:6}}, "Suggested from your parts and notes: “" + suggestSummary(j) + "”"),
    h("section", {className:"fa-card", style:{paddingTop:12, paddingBottom:4}}, h(Lbl, null, "Checklist"),
      h("div", {className:"fa-check"}, h("span", {className:"ic"}, h(Icon, {n:"clock", s:15})), h("div", null, h("div", {style:{fontWeight:600}}, "Time recorded automatically"), h("div", {className:"fa-dim fa-sm"}, "On site " + U.dur(tm.onsite) + ", travel " + U.dur(tm.travel)))),
      meas ? null : h("div", {className:"fa-check"}, h("span", {className:"ic" + (j.parts.length || noParts ? "" : " no")}, h(Icon, {n:"parts", s:15})),
        h("div", {className:"fa-grow"}, h("div", {style:{fontWeight:600}}, j.parts.length ? "Parts recorded" : "No parts recorded"),
          j.parts.map((x, i) => h("div", {key:i, className:"fa-dim fa-sm"}, x.sku + " " + partShort(x.sku) + " × " + x.qty)),
          j.parts.length ? null : h("label", {className:"fa-toggle"}, h("input", {type:"checkbox", checked:noParts, onChange:(e) => setNoParts(e.target.checked)}), "No parts used on this job"),
          j.parts.length ? null : h("button", {type:"button", className:"fa-textbtn", onClick:() => c.sheet({k:"addpart", id:j.id})}, "Add a part"))),
      h("div", {className:"fa-check"}, h("span", {className:"ic" + (j.photos ? "" : " no")}, h(Icon, {n:"camera", s:15})),
        h("div", {className:"fa-grow"}, h("div", {style:{fontWeight:600}}, j.photos ? j.photos + " photo" + (j.photos > 1 ? "s" : "") + " on the job" : "No photos yet"),
          h("button", {type:"button", className:"fa-textbtn", onClick:() => c.sheet({k:"photo", id:j.id})}, j.photos ? "Take another" : "TAKE PHOTO")))),
    h("label", {className:"fa-flbl", htmlFor:"fa-cn"}, "Customer name" + (meas ? " (optional)" : "")),
    h("input", {id:"fa-cn", className:"fa-in", value:name, onChange:(e) => setName(e.target.value), autoComplete:"off"}),
    h("div", {className:"fa-flbl"}, "Customer signature" + (meas ? " (optional)" : "")),
    h(SigPad, {inked, onInk:setInked}));
}
function SigPad(p){
  const ref = useRef(null), drawing = useRef(false), last = useRef(null);
  useEffect(() => { const cv = ref.current; if (!cv || !cv.getContext) return;
    const dpr = window.devicePixelRatio || 1; cv.width = Math.round(cv.offsetWidth * dpr); cv.height = Math.round(cv.offsetHeight * dpr);
    const g = cv.getContext("2d"); g.scale(dpr, dpr); g.lineWidth = 2.4; g.lineCap = "round"; g.lineJoin = "round"; g.strokeStyle = getComputedStyle(cv).color; }, []);
  const pt = (e) => { const cv = ref.current, r = cv.getBoundingClientRect(), k = r.width ? cv.offsetWidth / r.width : 1; return [(e.clientX - r.left) * k, (e.clientY - r.top) * k]; };
  const down = (e) => { e.preventDefault(); drawing.current = true; last.current = pt(e); try { ref.current.setPointerCapture(e.pointerId); } catch(x){} };
  const move = (e) => { if (!drawing.current) return; const q = pt(e), g = ref.current.getContext("2d");
    g.beginPath(); g.moveTo(last.current[0], last.current[1]); g.lineTo(q[0], q[1]); g.stroke(); last.current = q; if (!p.inked) p.onInk(true); };
  const up = () => { drawing.current = false; };
  const clear = () => { const cv = ref.current, g = cv.getContext("2d"); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); g.restore(); p.onInk(false); };
  return h(F, null, h("div", {className:"fa-sig"},
      h("canvas", {ref, role:"img", "aria-label":"Signature pad. Draw with a finger or mouse.", onPointerDown:down, onPointerMove:move, onPointerUp:up, onPointerCancel:up, onPointerLeave:up}),
      p.inked ? null : h("div", {className:"ph"}, "Sign here"), h("div", {className:"base"})),
    h("div", {className:"fa-row", style:{justifyContent:"space-between", marginTop:4}}, h("span", {className:"fa-dim fa-sm"}, p.inked ? "Signed" : "Not signed yet"),
      h("button", {type:"button", className:"fa-textbtn", onClick:clear, disabled:!p.inked}, "Clear")));
}

/* ---------- DONE ---------- */
const DONE_WORDS = {
  "Ready for Invoice":["Ready for invoice", "Pulse checked labour, travel, parts, report, photos and sign-off. The office sends it to QuickBooks. Nothing more needed from you."],
  "Review Required":["Sent for a quick review", "The office will check it before invoicing"],
  "Closed":["Visit closed", "A non-billable visit, so nothing goes for invoicing. Your notes and photos are on the record for the quote."],
  "Sent to QuickBooks":["With the office", "Already sent to QuickBooks by the office."],
  "Engineer Complete":["Sent to the office", "The office will take it from here."]
};
function Done(p){
  const c = p.ctx, n = c.n, j = Q.job(p.top.id);
  if (!j) return h(Gone, {ctx:c});
  const w = DONE_WORDS[j.status] || DONE_WORDS["Engineer Complete"];
  const detail = j.status === "Review Required" ? w[1] + (j.reviewReason ? ": " + j.reviewReason.charAt(0).toLowerCase() + j.reviewReason.slice(1) : "") + ". You don’t need to do anything unless they call." : w[1];
  const nx = n.next;
  const foot = nx ? h(F, null, h(FBtn, {k:"pri", onClick:() => c.go([{s:"job", id:nx.id}])}, "NEXT JOB · " + (nx.start || "") + " " + Q.cust(nx.cust).name.toUpperCase()), h(FBtn, {onClick:() => c.go()}, "Home"))
    : n.status === "On site" ? h(F, null, h(FBtn, {k:"pri", icon:"nav", onClick:() => { A.fieldDepart(c.eng, null); c.go(); }}, "HEAD BACK TO BASE"), h(FBtn, {onClick:() => c.go()}, "Home"))
    : h(FBtn, {k:"pri", onClick:() => c.go()}, "Home");
  return h(Screen, {ctx:c, onBack:() => c.go(), backIcon:"close", backLabel:"Close", kicker:"Job #" + j.id, title:"Job complete", foot},
    h("div", {className:"fa-bigck"}, h(Icon, {n:"check", s:36, w:2.4})),
    h("div", {className:"fa-center"}, h("div", {className:"fa-h2"}, "Job complete · sent to the office"),
      h("div", {className:"fa-dim", style:{marginTop:4}}, Q.cust(j.cust).name + ", Job #" + j.id + (j.ended ? ", completed " + j.ended : ""))),
    h("section", {className:"fa-card"}, h(Lbl, null, "What happens next"),
      h("div", {className:"fa-row", style:{marginTop:8, gap:8}}, h(Status, {s:j.status})),
      h("div", {className:"fa-strong", style:{marginTop:8}}, w[0]),
      h("p", {className:"fa-dim"}, detail)));
}

/* ---------- PARTS: scan, search, manual ---------- */
function barcode(sku){
  const r = U.rng(parseInt(U.hash(sku), 16)); const out = [];
  for (let i = 0; i < 46; i++) out.push([1 + Math.floor(r() * 3), 1 + Math.floor(r() * 2)]);
  return out;
}
function Bag(p){
  const rd = p.r;
  return h("div", {className:"fa-bag" + (p.small ? " sm" : ""), role:p.small ? null : "img", "aria-label":p.small ? null : "Parts bag with label " + rd.sku + ", " + rd.desc + ", location " + rd.bin},
    h("div", {className:"fa-bag-seal"}), h("div", {className:"fa-bag-zip"}),
    h("div", {className:"fa-bag-part", "aria-hidden":"true"}),
    h("div", {className:"fa-bag-label", "aria-hidden":"true"},
      h("div", {className:"fa-bl-brand"}, "MYERS FOOD MACHINERY"),
      h("div", {className:"fa-bl-sku"}, rd.sku),
      h("div", {className:"fa-bl-desc"}, rd.desc),
      h("div", {className:"fa-bl-row"}, h("span", null, "LOC " + rd.bin), h("span", null, "QTY 1")),
      h("div", {className:"fa-bl-bars"}, barcode(rd.sku).map((b, i) => h("i", {key:i, style:{width:b[0], marginRight:b[1]}}))),
      p.scan ? h("div", {className:"fa-scanline"}) : null),
    h("div", {className:"fa-bag-glare"}));
}
function Frame(p){ return h("div", {className:"fa-frame"}, h("i"), h("i"), h("i"), h("i"), p.children); }
function Stepper(p){
  return h("div", {className:"fa-step", role:"group", "aria-label":"Quantity"},
    h("button", {type:"button", "aria-label":"One less", disabled:p.v <= 1, onClick:() => p.set(Math.max(1, p.v - 1))}, "−"),
    h("b", {"aria-live":"polite"}, p.v),
    h("button", {type:"button", "aria-label":"One more", disabled:p.v >= (p.max || 9), onClick:() => p.set(Math.min(p.max || 9, p.v + 1))}, "+"));
}
function PartFlow(p){
  const c = p.ctx, S = c.S, E = c.E, van = E.van, j = Q.job(p.top.id);
  const mode0 = p.top.mode || "scan";
  const [phase, setPhase] = useState(mode0 === "scan" ? "aim" : mode0);   // aim, frozen, analysing, search, manual, result, done
  const [read] = useState(() => j ? A.readLabel(j.id) : null);
  const [pick, setPick] = useState(null);
  const [qty, setQty] = useState(1);
  const [from, setFrom] = useState(van);
  const [editing, setEditing] = useState(false);
  const [res, setRes] = useState(null);
  const [qs, setQs] = useState("");
  const [msku, setMsku] = useState("");
  const [mdesc, setMdesc] = useState("");
  useEffect(() => {
    if (phase === "frozen"){ const t = setTimeout(() => setPhase("analysing"), RM() ? 40 : 300); return () => clearTimeout(t); }
    if (phase === "analysing"){ const t = setTimeout(() => { setPick({sku:read.sku, desc:read.desc, bin:read.bin, match:read.match, how:"scan"}); setQty(1); setFrom(read.inVan > 0 ? van : "main"); setPhase("result"); }, RM() ? 160 : 1120); return () => clearTimeout(t); }
  }, [phase]);
  if (!j || j.eng !== c.eng) return h(Gone, {ctx:c});
  const M = j.machine ? Q.mach(j.machine) : null;
  const choose = (P, how, q) => { setPick({sku:P.sku, desc:P.name, bin:P.bin, match:null, how}); setQty(q || 1); setFrom((S.stock[van][P.sku] || 0) > 0 ? van : "main"); setEditing(false); setPhase("result"); };

  /* camera: aim, frozen, analysing */
  if (phase === "aim" || phase === "frozen" || phase === "analysing"){
    const busy = phase !== "aim";
    const ext = [["Part number", read.sku], ["Description", read.desc], ["Location", read.bin], ["Quantity", "1"]];
    return h(Screen, {ctx:c, dark:true, onBack:c.pop, backIcon:"close", backLabel:"Close camera", kicker:"Job #" + j.id, title:"Scan part label",
      body:h("div", {className:"fa-cam"},
        h("div", {className:"fa-inst"}, phase === "aim" ? "Photograph the part label" : "Photo taken"),
        h("div", {className:"fa-vf" + (busy ? " frozen" : "")},
          h("span", {className:"tag"}, busy ? "FROZEN" : "LIVE"),
          h(Frame, null, h(Bag, {r:read, scan:phase === "analysing"})),
          busy ? h("div", {key:"flash", className:"fa-flash"}) : null),
        phase === "analysing" ? h(F, null, h("div", {className:"fa-anal", role:"status"}, h("i"), "ANALYSING LABEL..."),
          h("div", {className:"fa-ext"}, ext.map((x, i) => h("div", {key:x[0], style:{animationDelay:(150 + i * 230) + "ms"}}, h("span", null, x[0]), h("b", null, x[1]))))) : null),
      foot:h(F, null,
        h("div", {className:"fa-shutrow"}, h("button", {type:"button", className:"fa-shutter", disabled:busy, "aria-label":"Take photo", onClick:() => setPhase("frozen")}, h("i"))),
        h("div", {className:"fa-center"}, h("button", {type:"button", className:"fa-textbtn", disabled:busy, onClick:() => setPhase("search")}, "No label? Search instead")))});
  }

  /* search */
  if (phase === "search"){
    const q = qs.trim().toLowerCase();
    const list = Object.values(S.parts).filter(P => !q || (P.sku + " " + P.name).toLowerCase().indexOf(q) >= 0)
      .map(P => ({P, v:S.stock[van][P.sku] || 0, fit: M && P.models.indexOf(M.model) >= 0 ? 1 : 0}))
      .sort((a, b) => ((b.v > 0) - (a.v > 0)) || (b.fit - a.fit) || a.P.sku.localeCompare(b.P.sku));
    const inVan = list.filter(x => x.v > 0), other = list.filter(x => x.v <= 0);
    const row = (x) => h("button", {key:x.P.sku, type:"button", className:"fa-li", onClick:() => choose(x.P, "search")},
      h("div", {className:"fa-grow"}, h("div", {className:"fa-mono", style:{fontWeight:700}}, x.P.sku), h("div", {className:"fa-dim fa-sm"}, x.P.name)),
      h(Pill, {k:x.v > 0 ? "ok" : ""}, x.v > 0 ? "Van " + x.v : "Not in van"));
    return h(Screen, {ctx:c, onBack:c.pop, kicker:"Job #" + j.id, title:"Search parts"},
      h("label", {className:"fa-flbl", htmlFor:"fa-q"}, "Part number or name"),
      h("input", {id:"fa-q", className:"fa-in", value:qs, onChange:(e) => setQs(e.target.value), placeholder:"e.g. sensor, MX-44721", autoComplete:"off", spellCheck:false, type:"search"}),
      inVan.length ? h("section", {className:"fa-card", style:{paddingTop:12, paddingBottom:2}}, h(Lbl, null, "In " + Q.loc(van).name), inVan.map(row)) : null,
      other.length ? h("section", {className:"fa-card", style:{paddingTop:12, paddingBottom:2}}, h(Lbl, null, "Other Myers parts"), other.slice(0, 12).map(row)) : null,
      !list.length ? h("p", {className:"fa-dim", style:{marginTop:14}}, "Nothing matches “" + qs + "”. Try the part number from the bag.") : null);
  }

  /* manual entry */
  if (phase === "manual"){
    const code = msku.trim().toUpperCase(), exact = S.parts[code] || null;
    const sugg = code.length >= 2 && !exact ? Object.values(S.parts).filter(P => P.sku.indexOf(code) === 0 || P.sku.replace("-", "").indexOf(code.replace("-", "")) === 0).slice(0, 4) : [];
    return h(Screen, {ctx:c, onBack:c.pop, kicker:"Job #" + j.id, title:"Enter part",
      foot:h(FBtn, {k:"pri", disabled:!exact, onClick:() => choose(exact, "manual", qty)}, "USE THIS PART")},
      h("label", {className:"fa-flbl", htmlFor:"fa-sku"}, "Part number"),
      h("input", {id:"fa-sku", className:"fa-in fa-mono", value:msku, onChange:(e) => setMsku(e.target.value), placeholder:"As printed on the label", autoComplete:"off", autoCapitalize:"characters", spellCheck:false}),
      sugg.length ? h("div", {className:"fa-chips"}, sugg.map(P => h("button", {key:P.sku, type:"button", className:"fa-chip", onClick:() => setMsku(P.sku)}, h("span", {className:"fa-mono"}, P.sku)))) : null,
      code.length >= 5 && !exact && !sugg.length ? h("div", {className:"fa-err"}, "Not in the Myers parts list. Check the label, or search instead.") : null,
      h("label", {className:"fa-flbl", htmlFor:"fa-desc"}, "Description"),
      h("input", {id:"fa-desc", className:"fa-in", value:exact ? exact.name : mdesc, readOnly:!!exact, onChange:(e) => setMdesc(e.target.value), placeholder:"Filled in from the part number"}),
      h("div", {className:"fa-flbl"}, "Quantity"),
      h(Stepper, {v:qty, set:setQty}));
  }

  /* result */
  if (phase === "result" && pick){
    const inFrom = (S.stock[from] || {})[pick.sku] || 0;
    return h(Screen, {ctx:c, onBack:() => { if (pick.how === "scan") setPhase("aim"); else setPhase(pick.how === "manual" ? "manual" : "search"); }, backLabel:pick.how === "scan" ? "Retake photo" : "Back", kicker:"Job #" + j.id, title:"Add part",
      foot:h("div", {className:"fa-two"}, h(FBtn, {onClick:() => setEditing(!editing), "aria-expanded":editing}, editing ? "DONE" : "EDIT"),
        h(FBtn, {k:"pri", icon:"check", onClick:() => { const r = A.confirmPart(j.id, pick.sku, qty, from); setRes({r, sku:pick.sku, qty, from, how:pick.how}); setPhase("done"); }}, "CONFIRM PART"))},
      h("div", {className:"fa-idhead"}, h("span", {className:"ck"}, h(Icon, {n:"check", s:24, w:2.2})),
        h("div", {className:"fa-grow"}, h("div", {className:"fa-h2"}, pick.how === "scan" ? "PART IDENTIFIED" : "PART SELECTED"),
          h("div", {className:"fa-dim fa-sm"}, pick.how === "scan" ? "Read from the label photo" : pick.how === "manual" ? "Entered by hand" : "Picked from the parts list")),
        pick.how === "scan" ? h("div", {style:{width:113, height:131, overflow:"hidden", flex:"none", borderRadius:10, background:"var(--phone-ink)", padding:"6px 0 0 6px"}, "aria-hidden":"true"}, h(Bag, {r:read, small:true})) : null),
      h("section", {className:"fa-card", style:{paddingTop:4, paddingBottom:4}},
        h("div", {className:"fa-field"}, h(Lbl, null, "Part number"), h("div", {className:"v sku"}, pick.sku)),
        h("div", {className:"fa-field"}, h(Lbl, null, "Description"), h("div", {className:"v"}, pick.desc)),
        h("div", {className:"fa-field"}, h(Lbl, null, "Storage location"), h("div", {className:"v fa-mono"}, pick.bin)),
        pick.match != null ? h("div", {className:"fa-field fa-row", style:{justifyContent:"space-between"}}, h(Lbl, null, "Match"), h(Pill, {k:"ok"}, pick.match.toFixed(1) + "%")) : null),
      h("section", {className:"fa-card"},
        h("div", {className:"fa-row", style:{justifyContent:"space-between"}}, h("div", null, h(Lbl, null, "Quantity"), h("div", {className:"fa-dim fa-sm"}, "How many did you fit?")), h(Stepper, {v:qty, set:setQty, max:Math.max(1, Math.min(9, inFrom || 9))})),
        h("div", {className:"fa-sep"}),
        h("div", {className:"fa-row", style:{justifyContent:"space-between"}}, h(Lbl, null, "From"),
          h("span", {className:"fa-strong"}, Q.loc(from).name + " ", h("span", {className:"fa-dim", style:{fontWeight:400}}, "(" + inFrom + (from === van ? " in van" : " in stores") + ")"))),
        inFrom < qty ? h("div", {className:"fa-err"}, "Only " + inFrom + " recorded in " + Q.loc(from).name + ". Stock will show 0 and stores will be told.") : null),
      editing ? h("section", {className:"fa-card"}, h(Lbl, null, "Taken from"),
        h("div", {className:"fa-seg"}, [van, "main"].map(l => h("button", {key:l, type:"button", className:"fa-segb" + (from === l ? " on" : ""), "aria-pressed":from === l, onClick:() => setFrom(l)}, Q.loc(l).name + " (" + ((S.stock[l] || {})[pick.sku] || 0) + ")"))),
        h("div", {style:{marginTop:10}}, h(FBtn, {icon:"search", onClick:() => { setEditing(false); setPhase("search"); }}, "PICK A DIFFERENT PART"))) : null);
  }

  /* done: everything that updated together */
  if (phase === "done" && res){
    const cu = Q.cust(j.cust), L = Q.loc(res.from).name, r = res.r;
    const items = [
      ["Added to Job #" + j.id, res.sku + " " + partShort(res.sku) + " × " + res.qty],
      [L + " stock " + r.before + " → " + r.after, "Stores see it straight away"],
      ["Part history: " + E.name + ", " + cu.name + (j.machine ? ", " + j.machine : "") + ", Job #" + j.id + ", " + U.dm(TODAY), null],
      j.machine ? ["Machine history updated", Q.model(j.machine).name + " " + j.machine] : null,
      res.how === "scan" ? ["Label photo stored", "On the job and the part record"] : null
    ].filter(Boolean);
    const flags = r.flags.map((f, i) => i ? f.charAt(0).toLowerCase() + f.slice(1) : f);
    const reorder = r.flags.some(f => /^Total/.test(f));
    return h(Screen, {ctx:c, onBack:c.pop, kicker:"Job #" + j.id, title:"Part added",
      foot:h(FBtn, {k:"pri", onClick:c.pop}, "BACK TO JOB")},
      h("div", {className:"fa-bigck"}, h(Icon, {n:"check", s:36, w:2.4})),
      h("div", {className:"fa-center"}, h("div", {className:"fa-h2"}, "Part added"), h("div", {className:"fa-dim", style:{marginTop:2}}, "Everything below updated at " + U.hm(S.clock))),
      h("div", {className:"fa-done-list"},
        items.map((x, i) => h("div", {key:i, style:{animationDelay:(i * 140) + "ms"}}, h(Icon, {n:"check", s:20, w:2.2}), h("div", {style:{minWidth:0}}, h("b", null, x[0]), x[1] ? h("span", null, x[1]) : null))),
        flags.length ? h("div", {className:"warn", style:{animationDelay:(items.length * 140) + "ms"}}, h(Icon, {n:"alert", s:20}),
          h("div", null, h("b", null, "Low stock: " + flags.join("; ") + "."), h("span", {style:{color:"inherit", opacity:.85}}, reorder ? "Reorder suggestion sent to stores." : "Van top-up flagged to stores."))) : null));
  }
  return h(Gone, {ctx:c});
}

/* ---------- sheets ---------- */
function SheetBox(p){
  return h("div", {className:"fa-sheet" + (p.cam ? " cam" : ""), role:"dialog", "aria-modal":"true", "aria-label":p.title},
    p.cam ? null : h("div", {className:"grab"}),
    h("div", {className:"sh"}, h("div", {className:"fa-grow"}, p.kicker ? h(Lbl, null, p.kicker) : null, h("div", {className:"fa-title"}, p.title)),
      h("button", {type:"button", className:"fa-ib", onClick:p.onClose, "aria-label":"Close"}, h(Icon, {n:"close", s:22}))),
    h("div", {className:"sb"}, p.children));
}
function NoteSheet(p){
  const c = p.ctx, j = Q.job(p.sh.id), meas = isMeasure(j);
  const [txt, setTxt] = useState("");
  const pk = packs(j);
  const chips = meas ? ["Three-phase supply available", "Floor drain in place", "Access through the loading door", "Ceiling height checked"]
    : labelMachine(j) ? ["Sensor bracket loose", "Labels skipping at speed", pk ? "Tested at " + pk + " packs/min" : "Tested at line speed", "Customer shown the fix"]
    : ["Worn part found", "Adjusted and re-tested", "Tested at line speed", "Customer shown the fix"];
  const add = (s) => setTxt(t => t.trim() ? t.trim().replace(/\.?$/, ". ") + s : s);
  return h(SheetBox, {title:meas ? "Add measurement" : "Add note", kicker:"Job #" + j.id, onClose:c.close},
    h("div", {className:"fa-chips", style:{marginTop:4}}, chips.map(s => h("button", {key:s, type:"button", className:"fa-chip" + (txt.indexOf(s) >= 0 ? " on" : ""), onClick:() => add(s)}, s))),
    h("label", {className:"fa-flbl", htmlFor:"fa-note"}, "Note"),
    h("textarea", {id:"fa-note", className:"fa-ta", value:txt, onChange:(e) => setTxt(e.target.value), placeholder:meas ? "Tap above or type a measurement" : "Tap above or type"}),
    h("div", {style:{marginTop:12}}, h(FBtn, {k:"pri", disabled:!txt.trim(), onClick:() => { A.addNote(j.id, txt.trim()); c.close(); }}, "SAVE NOTE")));
}
function MachineSil(p){
  const st = {fill:"rgba(255,255,255,.06)", stroke:"rgba(255,255,255,.55)", strokeWidth:2, strokeLinejoin:"round"};
  if (p.room) return h("svg", {viewBox:"0 0 300 220", width:"86%", "aria-hidden":"true", style:{maxHeight:"80%"}},
    h("path", Object.assign({d:"M40 40 H260 V180 H170 M130 180 H40 Z"}, st)), h("path", {d:"M130 180 A40 40 0 0 1 170 180", fill:"none", stroke:"rgba(255,255,255,.35)", strokeDasharray:"4 4"}),
    h("path", {d:"M40 24 H260 M40 18 V30 M260 18 V30 M276 40 V180 M270 40 H282 M270 180 H282", stroke:"rgba(255,255,255,.4)", strokeWidth:1.5}),
    h("rect", Object.assign({x:200, y:56, width:44, height:26, rx:4}, st)), h("circle", Object.assign({cx:70, cy:150, r:10}, st)));
  return h("svg", {viewBox:"0 0 300 220", width:"86%", "aria-hidden":"true", style:{maxHeight:"80%"}},
    h("rect", Object.assign({x:20, y:150, width:260, height:16, rx:8}, st)),
    h("circle", Object.assign({cx:30, cy:158, r:6}, st)), h("circle", Object.assign({cx:270, cy:158, r:6}, st)),
    h("path", {d:"M50 166 V204 M250 166 V204 M40 204 H60 M240 204 H260", stroke:"rgba(255,255,255,.45)", strokeWidth:2}),
    [60, 110, 200].map(x => h("rect", Object.assign({key:x, x, y:128, width:34, height:22, rx:3}, st))),
    h("rect", Object.assign({x:150, y:40, width:78, height:66, rx:8}, st)),
    h("circle", Object.assign({cx:112, cy:64, r:28}, st)), h("circle", Object.assign({cx:112, cy:64, r:9}, st)),
    h("path", {d:"M189 106 V128 M176 128 H202 M140 64 H150", stroke:"rgba(255,255,255,.55)", strokeWidth:2}),
    h("rect", {x:162, y:52, width:22, height:10, rx:2, fill:"rgba(255,255,255,.3)"}));
}
function PhotoSheet(p){
  const c = p.ctx, j = Q.job(p.sh.id), meas = isMeasure(j);
  const labels = meas ? ["Arrival", "Room", "Services", "Access"] : ["Arrival", "Machine", "Old part", "Completed work"];
  const names = meas ? {Arrival:"Arrival photo", Room:"Room layout photo", Services:"Services photo", Access:"Access route photo"}
    : {"Arrival":"Arrival photo", "Machine":"Machine photo", "Old part":"Old part photo", "Completed work":"Completed work"};
  const [lab, setLab] = useState(labels[Math.min(j.photos, labels.length - 1)]);
  const [shots, setShots] = useState(0);
  const shoot = () => { A.addPhoto(j.id, names[lab]); setShots(s => s + 1); const i = labels.indexOf(lab); if (i < labels.length - 1) setLab(labels[i + 1]); };
  return h(SheetBox, {cam:true, title:"Take photo", kicker:"Job #" + j.id, onClose:c.close},
    h("div", {className:"fa-vf", style:{height:330, flex:"none", marginTop:6}},
      h("span", {className:"tag"}, lab.toUpperCase()),
      h(MachineSil, {room:meas}),
      shots ? h("div", {key:"f" + shots, className:"fa-flash"}) : null),
    h("div", {className:"fa-chips", role:"group", "aria-label":"Photo label"}, labels.map(l => h("button", {key:l, type:"button", className:"fa-chip" + (lab === l ? " on" : ""), "aria-pressed":lab === l, onClick:() => setLab(l)}, l))),
    h("div", {className:"fa-shutrow", style:{marginTop:12}},
      h("button", {type:"button", className:"fa-shutter", onClick:shoot, "aria-label":"Take " + lab.toLowerCase() + " photo"}, h("i"))),
    h("div", {className:"fa-center", style:{minHeight:22, marginTop:6, fontSize:14, opacity:.8}, role:"status"}, shots ? "Saved to Job #" + j.id + " · " + j.photos + " photo" + (j.photos === 1 ? "" : "s") + " on this job" : "Photos attach to the job, machine and customer"),
    shots ? h("div", {style:{marginTop:12}}, h(FBtn, {k:"lite", onClick:c.close}, "Done")) : null);
}
function IssueSheet(p){
  const c = p.ctx, j = Q.job(p.sh.id), stopped = j.status === "Paused" || j.status === "Awaiting Part";
  const go = (kind, text) => { A.reportIssue(j.id, kind, text); c.close(); };
  const O = (icon, title, sub, fn, k) => h("button", {type:"button", className:"fa-opt " + (k || ""), onClick:fn}, h(Icon, {n:icon, s:26}), h("div", null, h("b", null, title), h("span", null, sub)));
  return h(SheetBox, {title:"Report issue", kicker:"Job #" + j.id, onClose:c.close},
    stopped ? h("div", {className:"fa-banner", style:{marginTop:4}}, h("span", {className:"fa-grow"}, j.status === "Paused" ? "Work is paused" : "Waiting on a part"), h(FBtn, {k:"ink", onClick:() => { A.resume(j.id); c.close(); }}, "RESUME")) : null,
    isMeasure(j) ? null : O("parts", "Need a part not in the van", "The office sources it and the job waits on the part", () => go("part", "Needs a part not in the van")),
    O("machines", "Can’t access the machine", "Line running, area locked or no one on site", () => go("access", "Can’t access the machine")),
    O("alert", "Safety concern", "Stops work now and tells the office", () => go("pause", "Safety concern, work paused"), "bad"),
    h("p", {className:"fa-dim fa-sm", style:{marginTop:12}}, "The office sees it on the job straight away. For anything urgent, ring the office as well."));
}
function AddPartSheet(p){
  const c = p.ctx, j = Q.job(p.sh.id);
  const go = (mode) => c.push({s:"part", id:j.id, mode});
  return h(SheetBox, {title:"Add part", kicker:"Job #" + j.id, onClose:c.close},
    h("button", {type:"button", className:"fa-opt pri", onClick:() => go("scan")}, h(Icon, {n:"camera", s:30}), h("div", null, h("b", null, "SCAN LABEL"), h("span", null, "Photograph the label on the part bag"))),
    h("button", {type:"button", className:"fa-opt", onClick:() => go("search")}, h(Icon, {n:"search", s:26}), h("div", null, h("b", null, "SEARCH PART"), h("span", null, "Van stock first"))),
    h("button", {type:"button", className:"fa-opt", onClick:() => go("manual")}, h(Icon, {n:"note", s:26}), h("div", null, h("b", null, "MANUAL ENTRY"), h("span", null, "Type the part number"))));
}
/* QR: identifies the machine at the engineer's current site (or the one they are heading to). */
function qrMachine(c, mid){
  if (mid) return mid;
  const n = c.n, S = c.S, siteId = n.place && Q.site(n.place) ? n.place : null;
  if (siteId){ const jj = n.jobs.find(j => j.site === siteId && j.machine); if (jj) return jj.machine; const m = Object.values(S.machines).find(x => x.site === siteId); if (m) return m.id; }
  const cj = n.job || n.next; if (cj && cj.machine) return cj.machine;
  return "LP200-48023";
}
function QrSheet(p){
  const c = p.ctx, mid = qrMachine(c, p.sh.mid), m = Q.mach(mid), M = Q.model(mid);
  const [found, setFound] = useState(!!p.sh.mid);
  useEffect(() => { if (found) return; const t = setTimeout(() => setFound(true), RM() ? 200 : 1300); return () => clearTimeout(t); }, [found]);
  const hist = Q.machineJobs(mid).filter(x => x.date < TODAY || isDone(x)).slice(0, 3);
  const open = c.n.jobs.filter(j => j.machine === mid && !isDone(j));
  return h(SheetBox, {cam:true, title:found ? "Machine identified" : "Scan machine QR", onClose:c.close},
    h("div", {className:"fa-vf" + (found ? " frozen" : ""), style:{height:found ? 190 : 380, flex:"none", marginTop:6, transition:"none"}},
      h("span", {className:"tag"}, found ? "READ" : "LIVE"),
      h(Frame, null, h("div", {style:{position:"relative", overflow:"hidden", borderRadius:8}}, h(UI.QR, {v:m.qr, s:found ? 104 : 168}), found ? null : h("div", {className:"fa-scanline", style:{animationDuration:"1.3s"}})))),
    found ? h("div", {className:"fa-card", style:{color:"var(--phone-ink)", animation:"faUp .26s var(--ease) both"}},
      h(Lbl, null, "Machine " + m.qr),
      h("div", {className:"fa-h2", style:{marginTop:4}}, M.name),
      h("div", {className:"fa-dim"}, M.type + " · " + Q.cust(m.cust).name + ", " + Q.site(m.site).town.split(",")[0]),
      h("dl", {className:"fa-kv"}, h("dt", null, "Serial"), h("dd", {className:"fa-mono"}, m.id), h("dt", null, "Installed"), h("dd", null, m.installed ? U.dmy(m.installed) : "Being installed"),
        h("dt", null, "Warranty"), h("dd", null, Q.warrantyActive(mid) ? "Until " + U.dmy(m.warrantyEnd) : "Out of warranty"),
        open.length ? h(F, null, h("dt", null, "Your job"), h("dd", null, "#" + open[0].id + ", " + engStatus(open[0].status)[0].toLowerCase())) : null),
      hist.length ? h("div", {style:{marginTop:10}}, hist.map(x => h("div", {key:x.id, className:"fa-hrow"}, h("span", {className:"d"}, ddMon(x.date)), h("div", {style:{fontWeight:600}}, histText(x))))) : null,
      h("div", {className:"fa-btns"}, h(FBtn, {onClick:() => c.push({s:"history", mid, cur:open[0] ? open[0].id : null})}, "Full history"),
        open.length ? h(FBtn, {k:"pri", style:{minHeight:48, fontSize:15.5}, onClick:() => c.push({s:"job", id:open[0].id})}, "Open job") : h(FBtn, {k:"ink", onClick:c.close}, "Done")))
    : h("div", {className:"fa-center", style:{marginTop:14, fontSize:16, fontWeight:600}}, "Point at the Myers tag on the machine"));
}
const SHEETS = {note:{C:NoteSheet}, photo:{C:PhotoSheet, cam:true}, issue:{C:IssueSheet}, addpart:{C:AddPartSheet}, qr:{C:QrSheet, cam:true}};
const SCREENS = {home:Home, job:JobScreen, active:Active, history:History, complete:Complete, done:Done, part:PartFlow};

/* ---------- desktop preview: phone frame + what the office sees ---------- */
function fitScale(){ const H = (typeof window !== "undefined" && window.innerHeight) || 900; return Math.max(.55, Math.min(1, (H - 196) / 868)); }
function StatusBar(p){
  return h("div", {className:"fa-sbar", "aria-hidden":"true"}, h("span", null, U.hm(p.S.clock)),
    h("span", {className:"ic"}, h("span", {className:"fa-sig4"}, [4, 6, 9, 12].map(v => h("i", {key:v, style:{height:v}}))), h("span", {style:{fontSize:12.5, fontWeight:700}}, "4G"), h("span", {className:"fa-batt"})));
}
function Phone(p){
  const s = p.scale;
  return h("div", {className:"fa-phone-wrap", style:{width:Math.round(414 * s), height:Math.round(868 * s)}},
    h("div", {className:"fa-phone", style:{transform:"scale(" + s + ")"}},
      h("div", {className:"fa-screenbox"},
        h(StatusBar, {S:p.S}), h("div", {className:"fa-notch"}),
        h("div", {className:"fa-appbox"}, h(FieldApp, {key:p.eng, S:p.S, eng:p.eng, framed:true})),
        h("div", {className:"fa-homebar"}))));
}
const SUB_TONE = {"In progress":"acc", "Auto-calculated":"ok", "Reviewed":"ok", "Confirmed":"ok", "Inside zone":"line", "Below threshold":"line", "Review required":"warn", "On leave":"line", "No data":"line"};
function OfficePanel(p){
  const S = p.S, eng = p.eng, E = Q.eng(eng), n = Q.engNow(eng), rec = Q.subDay(eng, TODAY);
  const j = n.job || n.next || n.done[n.done.length - 1] || n.jobs[0] || null;
  const sku = j ? (j.parts.length ? j.parts[j.parts.length - 1].sku : (j.possibleParts || [])[0]) : null;
  const vq = sku ? ((S.stock[E.van] || {})[sku] || 0) : null, vmin = sku ? (S.vanMin[E.van] || {})[sku] : null;
  const P = sku ? Q.part(sku) : null, tot = sku ? Q.stockTotal(sku) : null, ro = sku ? Q.openReorder(sku) : null;
  const url = (typeof location !== "undefined" && location.href ? String(location.href).split("#")[0] : "") + "#/m" + (eng === "sean" ? "" : "/" + eng);
  const when = !j ? "" : j.status === "Travelling" ? "ETA " + (n.eta != null ? U.hm(n.eta) : "") : live(j) ? "Started " + j.started + ", on site " + U.dur(S.clock - U.toMin(j.started)) : isDone(j) ? "Completed " + (j.ended || "") : j.status === "On Site" ? "Arrived " + (j.arrived || "") : "Booked " + (j.start || "");
  const r = S.rules.subsistence;
  return h(F, null,
    h(Card, {title:"What the office sees", sub:"Live from the records the phone writes to. Nothing to refresh.", icon:"engineers",
        right:h(Btn, {sm:true, k:"ghost", onClick:() => MP.go("engineers/" + eng)}, "Engineer profile")},
      h("div", {className:"fa-o-grid"},
        h("div", {className:"fa-o-sec"}, h("div", {className:"fa-o-h"}, "Engineer"),
          h("div", {className:"row", style:{gap:9}}, h(Av, {e:E, s:30}), h("div", {style:{minWidth:0, flex:1}}, h("div", {style:{fontWeight:600, color:"var(--ink)"}}, E.name), h("div", {className:"faint", style:{fontSize:11.5}}, Q.loc(E.van).name)),
            h(Badge, {k:(MP.ENG_TONE || {})[n.status] || ""}, n.status)),
          h("div", {className:"dim", style:{marginTop:10}}, n.status === "On leave" ? "Annual leave. Not tracked." : (n.where || "Not signed on") + (n.status === "Travelling" && n.eta != null ? ", ETA " + U.hm(n.eta) : "")),
          n.status === "On leave" ? null : h("div", {className:"mono faint", style:{marginTop:4}}, n.done.length + " of " + n.jobs.length + " jobs done · travel " + U.dur(n.travel))),
        h("div", {className:"fa-o-sec"}, h("div", {className:"fa-o-h"}, j ? (n.job ? "Current job" : n.next === j ? "Next job" : "Last job") : "Job"),
          j ? h(F, null, h("div", {className:"row", style:{gap:8, flexWrap:"wrap"}}, h(Ref, {r:{type:"job", id:j.id}}), h(Status, {j})),
            h("div", {style:{color:"var(--ink)", marginTop:6}}, Q.cust(j.cust).name), h("div", {className:"dim", style:{fontSize:12}}, (j.machine ? Q.model(j.machine).name + " · " : "") + when))
          : h("div", {className:"dim"}, "No jobs today.")),
        h("div", {className:"fa-o-sec"}, h("div", {className:"fa-o-h"}, "Van stock for this job"),
          sku ? h(F, null, h("div", {className:"row", style:{gap:10, alignItems:"baseline"}}, h("span", {className:"fa-o-num", style:{color:vmin != null && vq < vmin ? "var(--warn)" : "var(--ink)"}}, vq),
              h("span", {className:"dim"}, Q.loc(E.van).name + " · "), h(Ref, {r:{type:"part", id:sku}})),
            h("div", {className:"dim", style:{fontSize:12, marginTop:2}}, P.name + (vmin != null ? " · van minimum " + vmin : "")),
            h("div", {className:"row", style:{gap:8, marginTop:8, flexWrap:"wrap"}}, h("span", {className:"mono faint"}, "All locations " + tot + " of reorder level " + P.reorder),
              tot < P.reorder ? h(Badge, {k:ro ? "acc" : "warn"}, ro ? ro.id + " raised" : "Reorder required") : null))
          : h("div", {className:"dim"}, "No likely part on this job.")),
        h("div", {className:"fa-o-sec"}, h("div", {className:"fa-o-h"}, "Subsistence today"),
          rec.status === "On leave" ? h("div", {className:"dim"}, "On leave, not tracked.") : h(F, null,
            h("div", {className:"row", style:{gap:10, alignItems:"baseline"}}, h("span", {className:"fa-o-num"}, rec.exit != null ? U.dur(rec.away) : "0m"), h(Badge, {k:SUB_TONE[rec.status] || ""}, rec.status)),
            h(KV, {style:{marginTop:8, fontSize:12}, rows:[["Left zone", rec.exit != null ? U.hm(rec.exit) : "Not yet"], ["Back in zone", rec.ret != null ? U.hm(rec.ret) : rec.exit != null ? "Still out" : "n/a"],
              ["Band", rec.band != null ? bandLabel(S, rec.band) + ", " + U.eur2(rec.allowance) : "None yet (from " + r.bands.slice().sort((a, b) => a.min - b.min)[0].min + "h)"]]}))))),
    h(Card, {title:"Activity", sub:"Latest entries for " + E.name + " and their jobs, newest first", icon:"activity", right:h(Btn, {sm:true, k:"ghost", onClick:() => MP.go("activity")}, "All activity")},
      h(ActivityFeed, {S, eng})),
    h("div", {className:"fa-url"}, h(Icon, {n:"field", s:15}), "Open on a phone:", h("span", {className:"mono", style:{color:"var(--ink)"}}, url)));
}
function ActivityFeed(p){
  const S = p.S, eng = p.eng, E = Q.eng(eng), vanName = Q.loc(E.van).name + " ";
  const mine = Object.values(S.jobs).filter(j => j.eng === eng && j.date === TODAY);
  const ids = new Set(mine.map(j => j.id)), skus = new Set(); mine.forEach(j => j.parts.forEach(x => skus.add(x.sku)));
  const list = [];
  for (let i = S.activity.length - 1; i >= 0 && list.length < 8; i--){
    const a = S.activity[i]; if (a.d !== TODAY) continue;
    const hit = a.actor === E.name || a.text.indexOf(E.name) >= 0 || a.text.indexOf(vanName) === 0 ||
      a.refs.some(r => (r.type === "engineer" && r.id === eng) || (r.type === "job" && ids.has(r.id)) || (r.type === "part" && skus.has(r.id))) ||
      Array.from(ids).some(id => a.text.indexOf("#" + id) >= 0);
    if (hit) list.push({a, i});
  }
  const seen = useRef(null), max = S.activity.length, prev = seen.current == null ? max : seen.current;
  useEffect(() => { seen.current = max; });
  if (!list.length) return h(UI.Empty, {title:"Nothing yet today", icon:"activity"}, "Taps in the app show up here as they happen.");
  return h("div", {style:{paddingBottom:6}}, list.map(x => h("div", {key:x.i, className:"fa-act" + (x.i >= prev ? " new" : "")},
    h("span", {className:"mono dim", style:{paddingTop:1}}, x.a.t),
    h("div", {style:{minWidth:0}}, h("div", {style:{color:"var(--ink)"}}, x.a.text), h("div", {className:"faint", style:{fontSize:11.5}}, x.a.actor + (x.a.kind === "ai" ? " · AI agent" : x.a.kind === "qb" ? " · QuickBooks" : ""))))));
}
function FieldPage(p){
  const S = p.S, route = p.route;
  const eng = route.query && route.query.eng && S.engineers[route.query.eng] ? route.query.eng : "sean";
  const [scale, setScale] = useState(fitScale);
  useEffect(() => { const f = () => setScale(fitScale()); window.addEventListener("resize", f); return () => window.removeEventListener("resize", f); }, []);
  return h("div", {className:"fa-desk"},
    h("div", {className:"fa-left"},
      h("div", {className:"fa-pick", style:{width:Math.round(414 * scale)}},
        h("label", {className:"lbl", htmlFor:"fa-eng", style:{margin:0}}, "Engineer"),
        h("select", {id:"fa-eng", className:"sel", value:eng, onChange:(e) => MP.go("field" + (e.target.value === "sean" ? "" : "?eng=" + e.target.value))},
          Object.values(S.engineers).map(e => h("option", {key:e.id, value:e.id}, e.name + (e.leave ? " (on leave)" : ""))))),
      h(Phone, {S, eng, scale}),
      h("div", {className:"faint", style:{fontSize:11.5, textAlign:"center", maxWidth:Math.round(414 * scale)}}, "Every engineer gets the same app and sees only their own jobs.")),
    h("div", {className:"fa-right"}, h(OfficePanel, {S, eng})));
}
function Mobile(p){
  const S = p.S, route = p.route;
  const eng = S.role === "engineer" ? MP.ROLES.engineer.person : (route.page === "m" && route.parts[0] && S.engineers[route.parts[0]] ? route.parts[0] : "sean");
  const esc = S.role === "engineer" ? () => { A.role("owner"); MP.go("field"); } : null;
  return h("div", {className:"fa-mob-root"}, h(FieldApp, {key:eng, S, eng, escape:esc}));
}

MP.pages.field = {
  title:"Engineer app",
  sub:"Mobile web app the engineers use in the field",
  render:(route, S) => h(FieldPage, {S, route}),
  renderMobile:(route, S) => h(Mobile, {S, route})
};
})();
