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

## Service OS walkthrough (Friday, about 10 minutes)

The new rail items between the two dividers are the Service OS: Control Tower, Service Desk, Dispatch, Engineer App, Time and Travel, Workshop, Quotes and Invoicing, Parts and Vans, Warranty, Machine Register. The old Service, Work and Records pages are still below them.

The one line: **enter it once.** The call becomes the job, the job becomes the engineer's job sheet, the job sheet becomes the invoice, the warranty claim, the stock movement and the machine's history.

1. **Control Tower.** "This is the business right now." Team status, today's map, ready to invoice, warranty credits due, workshop.
2. **Service Desk.** Open Ciara's email (RQ-0612). Customer, machine, fault and urgency are already read from it. Click **Create job**. Show Orla's email (RQ-0615): it flags JOB-2479 as already open, so **Link** instead of creating a duplicate.
3. **Dispatch.** Click **Auto-plan today**. Read two reason chips aloud (drive time, "Grouped with nearby job", "Labelux trained", "Part in van"). **Confirm plan**, then **Send to phones**. "That replaced Trello and the WhatsApp."
4. **Engineer App**, Eoin's phone. Open JOB-2477 (Liffey, On site) → **Start job** → tap a diagnosis chip → **Use suggested wording** → add PT-FW500-PE from the van → log the old one → take two photos → **Customer sign-off** → sign with the mouse → **Complete job**. Watch the toasts: van stock down, invoice drafted, machine history updated. "That replaced the triplicate docket."
5. **Warranty version.** Switch the phone to Martin. JOB-2492 at Shannonside is a warranty job (the TS-400 is 18 months old). On my way → Arrived → Start job → fit PT-TS-SEAL, tag the old one for warranty → sign → complete. A claim to Traymaster appears in **Warranty** under Drafted, with serial, install date, photos and labour already filled in.
6. **Quotes and Invoicing.** Ready to invoice shows the drafts with lines already built. **Approve and send**, confirm. Synced to Xero.
7. **Time and Travel.** Eoin's day from 05:31. Then **Tracking and privacy**: only on duty, site arrivals rather than trails, engineers see their own data, 90-day retention, human review only.
8. **Workshop.** WS-114 is 138% of a fixed-price quote: that is what live costing catches. Open Q-1180 and click **Customer approves (demo)**: WS-113 moves to the bench.
9. **Parts and Vans / Machine Register** if there is time: the stock grid across the warehouse and every van; a machine record with history, parts, quotes, invoices and claims.

**Reset demo** (top right of any Service OS page) puts every number back. State survives a refresh; closing the tab also resets it.

### New Helios questions (live, they change as you use the pages)

| Ask | Shows |
|---|---|
| Plan tomorrow for the engineers | The proposed plan with reasons; scheduling waits for your yes |
| Where is everyone right now? | On-duty status and last site event per person |
| What’s ready to invoice? | Drafts built from job sheets, with totals |
| Which warranty claims are outstanding? | Open credits by manufacturer |
| What’s in Eoin’s van? (or Sean's, Martin's) | Van stock against minimums |
| What’s in the workshop? | Each machine, stage, cost against quote |
| Which quotes are waiting on customers? | Pending quotes and value |
| Which jobs took longer than planned? | Planned vs actual |

Service OS watch-outs: run it in the morning if you can; "today" slots are planned from now onwards, so late in the day Auto-plan today has little room (use Tomorrow). The map is a simple offline outline, not a street map.

## Watch out for

- Actions on record panels (Approve courier, Propose Eoin, Chase site readiness) record a proposal; they deliberately do not change the story numbers.
- Dates are computed from today. "This week" means the next five working days, so late in the week an install can fall on Monday.
- Stay in dark mode for the demo; light mode works but was checked less.
