# Project notes

## Source of truth
Pulse is an attached local codebase folder (`Pulse/`), not a GitHub repo. Browse with the
`local_*` tools (`local_ls`, `local_read`, `local_grep`). Key docs:

- `Pulse/docs/ARCHITECTURE.md` — layers, record spine, module contract, permissions, Helios chain
- `Pulse/docs/HELIOS.md` — tools, effects (read/write/external), confirmation hashes, channels
- `Pulse/packages/core/src/domain/core-module.ts` — core routes + navigation (sections: primary, work, data, admin)
- `Pulse/apps/demo/pulse.config.ts` — client config: branding, terminology, modules, home widgets, features
- `Pulse/packages/modules/site-visits` — the reusable module fixture

## Mockup files
- `Pulse v4 Glass.dc.html` — current direction: dark liquid glass, lime accent, icon rail with
  hover labels, Home = Helios chat + right rail, plus the real page set (inbox, work queues,
  approvals, directories, universal record page, insights, automations, system health, modules,
  notifications, settings).
- `Pulse v2.dc.html`, `Pulse v3 Apple.dc.html`, `Pulse v3 Console.dc.html`, `Pulse Home.dc.html` — earlier directions, keep.

## Current demo: Myers Pulse (production scope, about €30k)
- Requirements: `MYERS-30K-SCOPE.md` (client brief after Tom reviewed the broad demo, plus how conflicting numbers were reconciled).
- Entry: `myers-pulse.html`. Files: `mp-data.js` (the ONE seed: customers, sites, machines, jobs, parts, stock, engineer days),
  `mp-core.js` (store, story clock, selectors `MP.q`, actions `MP.act`, subsistence engine, needs-attention, AI answers `MP.ask`),
  `mp-ui.js` (tokens, primitives `MP.ui`, hash router, sidebar, AI panel, demo story), `mp-pages-*.js` (pages register in `MP.pages`).
- Demo day is Monday 28 Sep 2026; the story clock starts 07:02 and every action moves it forward. Sean's canonical day is scripted
  in `MP.STORY`; other engineers' days are in `S.script` and play out as the clock moves.
- Every mutation goes through `MP.act.*` so jobs, stock, documents, activity and subsistence stay in sync. Never add a second data set.
- Pulse stops at Ready for Invoice; QuickBooks owns invoices and payments. AI proposes; a person confirms.
- `DEMO-SCRIPT.md` is the walkthrough. New files must be added to `FILES` in `serve.py`.

## Running the demo
- `python3 serve.py` (or double-click `Start Demo.command`) serves `myers-pulse.html` at http://pulse.localhost:8080 (engineer app alone:
  `/#/m`; the earlier broad demo: `/v4`). The preview pane can't read ~/Downloads, so start the server from the shell and attach the pane
  via `.claude/launch.json`. `vendor/` holds React 18.3.1 and the fonts so the demo runs offline.

## Earlier directions (kept for reference, not linked from the new demo)
- `Pulse v4 Glass.dc.html` with `myers-os-*.js`: the broad demo Tom reviewed. `MYERS-SERVICE-OS-PLAN.md` is its plan.

## Conventions the mockups should keep
- Helios never executes write/external tools; it proposes and waits for a confirmation bound to hashed arguments.
- The action inbox answers three things per item: what happened, why it matters, what I can do.
