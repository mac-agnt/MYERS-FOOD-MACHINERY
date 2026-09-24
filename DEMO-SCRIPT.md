# Myers Pulse demo script

> Myers can see every machine, customer, engineer, service job, spare part, SLA and installation from one operational system, reducing downtime and keeping nothing trapped in calls, inboxes or job sheets.

All figures are demo data, not claimed real figures. Manufacturer names (Nordvak, Traymaster, Weighline, Brodmann, Ferrox, Fillwright, Labelux) are placeholders to swap for the brands Myers actually supplies.

## Start and stop

1. Double-click **Start Demo.command**. Chrome opens at **http://pulse.localhost:8080**.
2. Close that Terminal window when you're done. That stops the demo.

If another demo already holds port 8080, run `python3 serve.py 8097` and open http://pulse.localhost:8097.
The first time, macOS may ask whether Terminal can access your Downloads folder: click **Allow**.
No internet needed; React and the fonts are bundled in `vendor/`.

## The three story threads (same numbers everywhere)

| Thread | Numbers | Where it shows |
|---|---|---|
| A · Service | 9 open jobs · 3 urgent · 2 awaiting parts · oldest urgent 19h | Home briefing, Service → Jobs, Dashboard, Briefing agent, Activity |
| B · Preventative maintenance | 27 due in 30 days · 7 this week · 4 unscheduled | Home briefing, Service → SLA Planner, Dispatch, SLA Planner agent |
| C · Project delivery | 6 active projects · €284,000 · 2 installs this week · 1 blocked | Home briefing, Work → Projects / Installations, Dashboard |

## Suggested walk-through

1. **Home.** Read the morning briefing aloud. Click each of the three thread tiles.
2. **Service → Jobs.** Open JOB-2481 (Carrigdown, 19h). Follow the links: customer → machine → part → wiring diagram.
3. **Service → Dispatch.** One board per engineer, nationwide. The Unassigned lane holds the urgent Slane Road job and the 4 unbooked PM visits.
4. **Service → SLA Planner.** 27 rows; switch to Unscheduled (4). Each has a proposed engineer and a reason.
5. **Work → Installations.** Blackwater is ready (6 of 6); Carrigdown is blocked (4 of 6). Each has commissioning and operator training.
6. **Records → Customers / Technical Library.** Every account with machines, projects, SLA and history; every model with its four documents.
7. **Agents.** Seven agents: Briefing, Ops Watchdog, Service Dispatcher, Parts Finder, Machine Expert, Project Coordinator, SLA Planner.

## Questions Helios answers

| Ask | Helios shows | Key words it listens for |
|---|---|---|
| What service jobs are open? | 9 open, the 3 urgent ones in a table | jobs, urgent, breakdown, engineer, service |
| What maintenance is due this week? | 27 due, 7 this week, the 4 unscheduled with proposed engineers | maintenance, PM, SLA, due |
| Which jobs are waiting on parts? | The 2 jobs, their parts and arrival | parts, stock, spares |
| How are the installations going? | 6 projects, €284,000, Carrigdown blocked | install, project, commissioning |
| Show me the Carrigdown tray sealer history | Serial, warranty, open job, documents | history, serial, machine, manual |
| Who owes us money? | €71,800 overdue, top three accounts | owe, debt, money |
| Draft an update to Carrigdown Poultry | A write tool: drafts it and waits for your yes | draft, update, email, chase |
| Propose Eoin for Slane Road | A write tool: assignment waits for your yes | propose / assign + Eoin or Slane |
| Book the proposed slots | A write tool: 4 PM offers wait for your yes | book + slots / visits |

On a **NEEDS YOUR YES** card, **Confirm** replays the stored arguments and records it in the audit log; **Edit draft** drafts again.
Anything else gets the "registered tool" reply with buttons for the questions above.

## Watch out for

- Actions on record panels (Approve courier, Propose Eoin, Chase site readiness) record a proposal; they deliberately do not change the story numbers.
- Dates are computed from today. "This week" means the next five working days, so late in the week an install can fall on Monday.
- Stay in dark mode for the demo; light mode works but was checked less.
