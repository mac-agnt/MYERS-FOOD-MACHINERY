# Myers Service OS: build plan for Tom Myers' Friday demo

Source: client requirements doc (10 sections). Target: extend `Pulse v4 Glass.dc.html` from "operations overview" into the full service operation, where one record is entered once and flows to invoice.

Demo date: **Friday 25 Sep 2026** (tomorrow). Section 11 splits the plan into Friday must-haves and post-demo work.

---

## 1. The one idea the demo must land

> Enter it once. The customer's call becomes the job, the job becomes the engineer's job sheet, the job sheet becomes the invoice, the warranty claim and the machine's history. No Trello, no WhatsApp, no triplicate docket, no retyping.

Every screen should show where its data came from ("from JOB-2481, captured by Eoin on site, 14:32") and where it goes next. That provenance line is the visual proof of "no duplicate entry".

### The golden thread (one job, end to end, used in the walkthrough)

| Step | Old way | Myers Service OS | Screen |
|---|---|---|---|
| 1 | Carrigdown Poultry phones: tray sealer fault | Call logged in Service Desk, customer + machine picked from register (serial auto-fills warranty status) | Service Desk |
| 2 | Typed into Trello | JOB-2481 created automatically, urgency + SLA clock set | Jobs |
| 3 | Coordinator plans by memory | Dispatch suggests Eoin: nearest, has part in van, 2 free hours, groups with a Monaghan PM visit | Dispatch Board |
| 4 | WhatsApp message | Job pushed to Eoin's app with customer, machine, fault, address, history, manual | Engineer App |
| 5 | Drive, no record | Geofence: arrived 09:42, on site 1h 38m | Time & Travel |
| 6 | Paper triplicate | Digital job sheet: diagnosis, work done, part fitted (from van), part removed, photos, signature | Engineer App |
| 7 | Copy posted back, retyped | Job sheet lands complete in the system at 11:20 | Jobs, Ready to Invoice |
| 8 | Invoice typed manually | Warranty job: labour to customer at €0, part auto-raised as claim WC-0318 to Nordvak; mileage/call-out billed per contract | Invoicing, Warranty |
| 9 | Stock sheet updated later (maybe) | Eoin's van −1 heater element, replenishment transfer suggested from warehouse | Parts & Vans |
| 10 | History scattered | Machine record shows the visit, part, photos, signature, time, claim | Asset record |

Keep existing IDs and numbers (JOB-2481, Carrigdown, Eoin O'…, 9 open jobs / 3 urgent / 2 awaiting parts) so the old story threads still agree.

---

## 2. Information architecture (new sidebar)

Existing rail stays; groups extend. New or expanded modules marked ★.

```
Home                     Helios chat + morning briefing (existing, extend)
Control Tower ★          Management dashboard (req 10)

SERVICE
  Service Desk ★         Intake: calls, emails, web requests -> jobs (req 1, 2)
  Jobs                   Existing list, upgraded to full job lifecycle
  Dispatch Board ★       Map + engineer timelines + auto-plan (req 1)
  SLA Planner            Existing (PM visits)

FIELD
  Engineer App ★         Phone-frame preview of the engineer's day (req 3)
  Time & Travel ★        Day timelines, geofence events, utilisation, discrepancies (req 4)

WORKSHOP ★
  Workshop Board         Bays kanban: booked in -> quoted -> approved -> in progress -> QC -> ready (req 8)
  Workshop Job           Labour by engineer, parts, materials, live cost vs quote

COMMERCIAL
  Quotes ★               Quote builder, approval link, convert to job (req 9)
  Invoicing ★            Ready to invoice queue, draft invoices, sent, overdue (req 2, 9)
  Hire ★                 Hire fleet, on-hire contracts, off-hire inspections (req 7)
  Projects / Installs    Existing

PARTS ★ (replaces Parts & Stock)
  Stock                  Warehouse + all vans, one grid
  Vans                   Per-engineer van stock, min levels, replenishment
  Movements              Full ledger: warehouse -> van -> job -> returned/scrapped
  Reorders               Low-stock alerts, suggested POs

WARRANTY ★
  Claims                 Auto-raised claims, status pipeline, credits
  Returns                Faulty parts: tagged, held, shipped, assessed, outcome
  Manufacturers          Claim success rate, avg credit days, per brand

ASSETS ★
  Machine Register       Every machine: new, used, on hire, customer-owned, in workshop
  Asset record           Universal record page, tabs (req 7 list)

RECORDS                  Customers, Contacts, Technical Library (existing)

ADMIN
  Tracking & Privacy ★   GPS policy, engineer consent, retention, audit (req 4 privacy)
  Integrations ★         Email inbox, phone/VoIP, Trello import, accounting (Xero/Sage), manufacturer portals
  Agents, Approvals, Activity, Automation, Settings (existing)
```

Roles (switcher in the top bar, drives nav + home):
- **Service Coordinator** (Home = Service Desk + Dispatch)
- **Engineer** (Home = Engineer App, full-screen phone layout)
- **Workshop Manager**
- **Stores / Parts**
- **Accounts** (Home = Invoicing + Warranty credits)
- **Management** (Home = Control Tower)

Role switching is the fastest way to show "same data, each person's view" on Friday.

---

## 3. Data model (the record spine)

All modules read and write these. Every record carries `source` (who/what created it) and `links[]`, which is what the provenance line renders.

| Entity | Key fields | Links to |
|---|---|---|
| Customer | name, sites[], contract (SLA tier, call-out rate, labour rate, travel billing), account status, balance | sites, assets, jobs, quotes, invoices |
| Site | address, lat/lng, access notes, opening hours, contact | customer, assets |
| Asset | serial, make, model, category, ownership (`myers-new`, `myers-used`, `hire`, `customer`), status (`in-stock`, `installed`, `on-hire`, `in-workshop`, `refurb`, `sold`, `scrapped`), location (site / workshop bay / depot), install date, warranty (start, end, cover: parts / parts+labour), hire contract, photos, docs | customer, site, jobs, parts, quotes, invoices, claims, time entries |
| Request | channel (phone, email, web, agent), raw text, caller, received at, triage (breakdown / service / PM / quote), urgency | becomes Job or Quote |
| Job | JOB-####, type (breakdown, service, PM, install, workshop, warranty), urgency (P1-P4), SLA due, status (see §4), asset, site, assigned engineer(s), planned slot, planned duration, job sheet, billing mode (`chargeable`, `warranty`, `contract`, `goodwill`), follow-up of | request, asset, quote, time entries, part movements, invoice, claim |
| Job sheet | diagnosis, work carried out, parts fitted[], parts removed[], notes, photos[], signature (name, image, time), customer email for copy, follow-up required + reason | job |
| Engineer | name, home base lat/lng, skills/brands, van, standard hours, working pattern, phone | time entries, van, jobs |
| Van | reg, engineer, stock[] with min levels | parts |
| Part | SKU, description, manufacturer, cost, sell, compatible models, warehouse qty, min level, bin | movements |
| Part movement | type (`receive`, `transfer-to-van`, `fit`, `remove`, `return-to-stock`, `return-to-manufacturer`, `scrap`, `adjust`), qty, from, to, job, by, at | part, job, claim |
| Time entry / Geo event | engineer, type (`day-start`, `depart`, `arrive-site`, `job-start`, `job-end`, `depart-site`, `arrive-base`, `day-end`, `break`, `private`), source (`geofence`, `manual`, `app`), at, site/job | engineer, job |
| Quote | Q-####, customer, asset, lines (labour hrs, parts, materials, other), valid until, status (`draft`, `sent`, `viewed`, `approved`, `declined`, `expired`), approval (name, time, PO no.) | becomes Job / Workshop job |
| Workshop job | WS-###, asset, arrived at, reason, bay, work required, stages, engineers + hours, parts, materials, photos, quote | quote, invoice |
| Invoice | INV-#####, customer, lines generated from job sheet + time + parts + contract rates, status (`draft`, `approved`, `sent`, `paid`, `overdue`), sync to accounting | job/workshop job, customer |
| Warranty claim | WC-####, manufacturer, asset serial, job, part fitted, part removed, failure description, photos, status (`auto-drafted`, `submitted`, `acknowledged`, `return-requested`, `part-shipped`, `assessed`, `credited`, `rejected`), credit amount, replacement received | job, movements, manufacturer |
| Hire contract | HC-###, asset, customer, start, end, rate, off-hire inspection | asset, invoices |

---

## 4. Job lifecycle (single state machine used everywhere)

```
Request -> New -> Scheduled -> Dispatched -> Travelling -> On site -> In progress
        -> Completed (signed) -> Reviewed -> Invoiced -> Closed
Side exits: Awaiting parts, Follow-up required (spawns linked job), Cancelled
```

Each transition writes a time-stamped event with source (coordinator, engineer app, geofence, automation). The job page shows this as a vertical timeline; it doubles as the audit trail.

---

## 5. Module specs

### 5.1 Service Desk (req 1, 2)
- **Intake inbox**: phone calls (logged by coordinator, or VoIP caller-ID auto-matches customer), emails (auto-parsed: customer from sender domain, machine from serial/model mention, fault summary), web form, Helios.
- **One-screen triage form**: customer (search), site (auto if one), machine (picker from that site's assets, shows warranty badge + last visit + open jobs), fault, urgency (P1 breakdown line-down / P2 same-day / P3 this week / P4 planned), preferred window, contact. Duplicate detection ("JOB-2477 already open on this machine").
- **Create job** button: request becomes job; nothing retyped later.
- Demo seed: 4 unprocessed requests (2 emails, 1 voicemail transcript, 1 web form). One email auto-parsed with highlighted extracted fields.

### 5.2 Jobs (upgrade)
- List with saved views: Today, Unassigned, Urgent, Awaiting parts, Follow-up, Ready to review, Warranty.
- Job page tabs: Overview (fault, asset, SLA clock), Job sheet (engineer's capture, read-only for office), Time (planned vs actual bar), Parts (fitted/removed with movement links), Photos, Billing (preview of invoice lines + billing mode), Timeline.
- "Review & approve" button for coordinator: moves Completed -> Reviewed, drafts invoice.

### 5.3 Dispatch Board (req 1)
Layout: left = unassigned jobs queue; centre = map (Ireland, pins for jobs coloured by urgency, engineer positions/home bases); bottom/right = one timeline row per engineer (start, travel blocks, job blocks, finish; early starters like 05:00 Dublin run visible).
- **Auto-plan** button ("Plan tomorrow"): scores each job/engineer by urgency + SLA due, drive time from previous stop, skills/brand match, part availability in van, shift start/finish, clustering by area. Shows proposal as ghost blocks with reason chips ("in van", "12 min from previous", "Nordvak certified"). Coordinator accepts all / per job. Helios convention: proposal, then confirm.
- Drag job onto engineer row; conflicts flagged (over shift, missing skill, part not in van).
- Utilisation bar per engineer (planned hours / available).
- **Dispatch** = push to engineer app (replaces WhatsApp); shows "Delivered / Seen 07:12".
- Map: static SVG Ireland outline with plotted coordinates is enough for the demo (no tile server, works offline).

### 5.4 Engineer App (req 3)
Shown in a phone frame inside the desktop demo, plus full-screen when role = Engineer.
Screens:
1. **My day**: start-day button (records time + location), list of jobs in order, drive times, van stock warnings.
2. **Job detail**: customer, site + navigate button, contact call button, machine (serial, model, warranty badge, last 3 visits, manual link), reported fault, access notes.
3. **Start job** -> timer running.
4. **Job sheet**: diagnosis (text + common-fault chips per model), work carried out, parts fitted (scan/search, defaults to own van stock, qty), parts removed (condition: faulty / warranty return / scrap; auto-prompts warranty tag if job is warranty), notes, photos (before/after, attach to part), follow-up required toggle + reason.
5. **Sign-off**: summary the customer sees (work, parts, time on site), customer name + signature pad, email copy toggle.
6. **Complete** -> sync confirmation "Sent to office 11:20. Invoice draft ready. Warranty claim WC-0318 drafted."
- Offline indicator ("Saved on phone, will sync") to answer the obvious rural-coverage question.
- Signature pad must actually draw (canvas) in the demo; it's the moment that kills the triplicate docket.

### 5.5 Time & Travel (req 4)
- **Day timeline per engineer**: coloured segments: travel, on site, break, private; event markers with source icon (geofence / manual / app). Example: Eoin, day start 05:02 from home (Navan), arrive Dublin site 06:10, etc.
- **Table**: per engineer per day: start, finish, total hours, travel h, on-site h, jobs, utilisation %, overtime.
- **Discrepancies**: planned vs actual per job (e.g. "JOB-2486 planned 1h, actual 2h40, reason given: seized bearing"), missing clock-outs, geofence vs manual mismatches. Framed as "planning accuracy", not surveillance.
- **Salespeople**: same day-timeline, visits instead of jobs.
- Feeds: job cost (labour), invoice labour lines, payroll export (CSV).

### 5.6 Tracking & Privacy (req 4, GDPR)
Must be on screen in the demo; it shows we thought about it.
- Tracking only between Start day and End day. "Private / off duty" toggle stops it instantly.
- **Geofence events, not breadcrumb trails**: system stores arrive/depart at known sites + day start/end location, not a continuous path. Live position shown to office only while on duty, coarse (engineer's current job/site, or "travelling").
- Lawful basis: legitimate interest (job costing, lone-worker safety, customer billing), documented in a DPIA; not consent-based (employer consent is weak under GDPR), but engineers get a clear notice and in-app acknowledgment.
- Engineer sees everything recorded about them (My data screen) and can annotate/correct.
- Retention: raw geo events 90 days, aggregated time entries kept with job (billing/tax 6 years).
- Access: role-based; audit log of who viewed whose location.
- Not used for automated disciplinary decisions; discrepancies need human review.
- Screen shows policy settings as toggles + "DPIA completed" status + consent log.

### 5.7 Parts & Vans (req 5)
- **Stock grid**: SKU rows, columns Warehouse | Van: Eoin | Van: … | Total | On order | Min; red cells below min.
- **Part page**: where every unit is, movement history, compatible machines, jobs used on, warranty returns.
- **Movements ledger**: filterable, each row links job/claim/transfer.
- **Van page**: engineer's van stock, "used today" (from job sheets), replenishment suggestion ("move 2x heater element from warehouse, pick list ready").
- **Reorders**: low-stock alerts, suggested PO per supplier, awaiting-parts jobs shown next to the part they block (ties to the existing 2 awaiting-parts jobs).
- All consumption comes from job sheets. Nobody types stock usage.

### 5.8 Warranty (req 6)
Pipeline (kanban): Auto-drafted -> Submitted -> Return requested -> Part shipped -> Assessed -> Credited / Rejected.
- **Auto-draft rule**: job billing mode = warranty AND part fitted -> claim drafted with serial, install date, failure, photos, part numbers, labour hours (if manufacturer covers labour). Coordinator reviews, then submits (email pack / portal export). Helios write tool, needs a yes.
- Removed faulty part gets a return tag number; tracked in Returns until shipped/assessed/scrapped.
- Outcome recorded: credit amount, replacement part received (stock movement `receive` linked to claim), rejection reason -> option to rebill customer.
- **Manufacturers view**: open claim value per brand, avg days to credit, rejection rate. Demo headline: "€14,260 in warranty credits outstanding; 6 claims over 60 days".

### 5.9 Assets / Machine Register (req 7)
- Register list with ownership + status facets: New stock, Used stock, On hire, Customer-owned, In workshop.
- **Asset record tabs**: Overview (owner, serial, location, status, warranty badge + expiry, hire info), Service history (jobs timeline), Parts (fitted/removed over life), Time (engineer hours on this asset), Quotes, Invoices, Warranty claims, Photos & docs, Manual (Technical Library link).
- Lifetime cost-to-serve card (labour + parts − warranty credits) for management.
- QR label idea: engineer scans the machine plate to open the asset (mention; mock the scan button).

### 5.10 Workshop (req 8)
- **Board**: bays as columns or stage kanban. Card: WS-###, machine, customer, days on site, quote status, % budget used.
- **Book-in form**: date arrived, customer, asset (pick or create), reason, condition photos, accessories received, required by.
- **Workshop job page**: work required checklist; labour log (engineer, date, hours; from app timer or manual); parts (from warehouse, movement written automatically); materials/other costs; photos per stage.
- **Live cost vs quote**: labour € + parts € + materials € = total, bar against quoted value, margin %. Warning at 90% of quote.
- Complete -> invoice draft from actual or quoted (toggle: fixed-price vs time & materials).
- Seed: 5 machines on site, one over budget, one awaiting customer approval, one ready for collection.

### 5.11 Quotes (req 9)
- Builder: pick customer + asset, add labour (hrs x rate from customer contract), parts (live price + stock availability), materials, other; margin shown internally.
- Send: PDF preview + approval link (customer page mock: "Approve / Decline, PO number, name").
- **Approved -> Convert to job/workshop job** with all lines carried; later the invoice reconciles quote vs actual.
- Pipeline: awaiting approval (count + value), expiring soon, chase via Helios draft.

### 5.12 Invoicing (req 2, 9)
- **Ready to invoice** queue: jobs Reviewed + workshop jobs completed + hire periods due. Each shows auto-built lines and flags (missing PO, warranty mix, over quote).
- Line generation: call-out + labour (actual time rounded per contract) + travel (per contract) + parts at sell price; warranty lines at €0 with note; contract/SLA customers bill against contract.
- Bulk approve -> sent by email with signed job sheet PDF attached -> synced to accounting (Xero/Sage: show "Synced" badge; integration mocked).
- Metrics: days from job completion to invoice (old: ~9 days, new: same day; mark as demo estimate), unbilled work value.

### 5.13 Hire (req 7)
- Fleet list (hire assets), availability calendar, on-hire contracts, off-hire inspection checklist (engineer app form), damage -> quote.
- Monthly hire invoices generated into Invoicing queue.

### 5.14 Control Tower (req 10)
One screen, role Management. Tiles each click through to the filtered list:
- Jobs today: scheduled / in progress / completed
- Engineer status strip: each engineer, current state (travelling, on site at X, break, off duty), utilisation today
- Outstanding jobs by urgency + SLA at risk
- Parts: stock value (warehouse vs vans), below-min count, parts used this week
- Warranty: open claims, credits outstanding
- Workshop: machines on site, over-budget
- Quotes awaiting approval (count + €)
- Ready to invoice (count + €), invoiced this month, overdue debt (existing €71,800)
- Revenue vs cost this month (labour cost, parts cost, margin), trend sparkline
- "Before vs after" strip: re-keying steps removed (10 -> 1), docket books (0), WhatsApp dispatches (0). Label as target outcomes.

### 5.15 Integrations (req 10)
Cards with status: Email inbox (service@ parsing), Phone/VoIP caller-ID, Trello (one-off import of open cards; shows "142 cards imported"), WhatsApp (retired, replaced by app push), Xero/Sage (invoice sync), Manufacturer portals (claim export), Google Maps (drive times). All mocked, but show the migration path so Tom sees Trello and the docket book go away cleanly.

---

## 6. Automations (event -> effect)

| Trigger | Effect | Needs a yes? |
|---|---|---|
| Email to service@ | Request parsed, customer/machine matched | No (read) |
| Request triaged | Job created, SLA clock set | Coordinator clicks Create |
| Job P1 unassigned > 30 min | Alert + auto-plan suggestion | Proposal |
| Plan accepted | Push to engineer app, customer ETA SMS draft | Yes for SMS |
| Geofence arrive site | Job status On site, arrival stamped | No |
| Part fitted on job sheet | Van stock −1, movement written | No |
| Van stock < min | Replenishment transfer proposed | Stores confirms |
| Warehouse < min | PO suggested | Yes |
| Job signed + warranty | Claim drafted | Submit needs yes |
| Part removed (warranty) | Return tag + Returns entry | No |
| Job completed | Review task for coordinator; invoice draft | Approve needs yes |
| Follow-up flagged | Linked follow-up job created, parts check | Scheduling proposal |
| Quote approved | Job/workshop job created with lines | No |
| Workshop cost > 90% quote | Alert workshop manager | No |
| Claim > 60 days no credit | Chase draft to manufacturer | Yes |
| Invoice overdue | Existing chase flow | Yes |

These go into the existing Automation page as registered rules with run counts.

## 7. Helios additions

New questions (add to DEMO-SCRIPT): 
- "Plan tomorrow for the engineers" -> proposal board, needs yes
- "Where is everyone right now?" -> engineer status table (privacy-respecting wording)
- "What's ready to invoice?" -> €, count, top items; "Send them" = write tool
- "Which warranty claims are outstanding?" -> by manufacturer
- "What's in Eoin's van?" / "Who has a heater element?"
- "How long did the Carrigdown job take vs planned?"
- "What's in the workshop?" / "Is WS-112 over budget?"
- "Which quotes are waiting on customers?" -> "Chase them" = write tool
- "Show the history of serial NV-TS-40218"

New write tools (proposal + hashed-args confirmation per project convention): `dispatch.plan_day`, `dispatch.assign`, `invoice.approve_and_send`, `warranty.submit_claim`, `quote.send` / `quote.chase`, `stock.transfer_to_van`, `purchasing.raise_po`, `customer.send_eta`.

New agents: Dispatcher (exists, extend with auto-plan), Warranty Clerk, Invoicing Clerk, Stores Keeper, Workshop Costing.

---

## 8. Seed data (all consistent, dates computed from today)

- 7 engineers (existing Eoin + 6), 2 salespeople, varied start times (one 05:00 Dublin run), home bases around Cavan/Meath/Monaghan/Louth.
- 60 customers (existing), ~180 assets: 40 new stock, 15 used, 22 on hire, ~100 customer-owned, 5 in workshop.
- Jobs: existing 9 open + today's 14 scheduled + 40 completed last 30 days (for time/utilisation/invoice history).
- Requests: 4 unprocessed.
- Parts: 60 SKUs, warehouse + 7 vans, 4 below min, 300 movements.
- Warranty: 18 claims across pipeline, €14,260 outstanding, 6 over 60 days, 3 parts awaiting return.
- Quotes: 7 awaiting approval, €38,450.
- Workshop: 5 on site.
- Invoices: 11 ready to invoice €9,870; existing €71,800 overdue unchanged.
- Hire: 22 on hire, 3 off-hire this week.

All labelled demo data; manufacturer names stay placeholders (Nordvak etc.).

---

## 9. Design direction

Keep v4 Glass shell (dark glass, lime accent, icon rail) for continuity with what Tom has seen, but new operational screens get denser, calmer treatment: fewer glass cards, more tables/timelines with hairline separators, status colours reserved for semantic state (urgency, SLA risk, stock below min). Engineer App uses a light, high-contrast, big-touch-target style (it is used outdoors, gloves on); that contrast inside the phone frame also sells "purpose-built for engineers".

---

## 10. Technical implementation approach

Current state: one 623 KB `Pulse v4 Glass.dc.html` + `support.js`, React 18 vendored, served by `serve.py` with a file whitelist.

Plan:
1. **Split new work into separate files** to keep the monolith editable: `myers/data.js` (seed + generators), `myers/store.js` (in-memory store with the entity model, event log, automations engine so actions actually move numbers), `myers/pages/*.js` (one per module), `myers/engineer-app.js`. Load after `support.js`. Add each to the `FILES` map in `serve.py` (and `vercel.json` if deploying).
2. Register new routes + nav entries through the existing navigation registry so nav, Helios tools and metrics stay registry-driven (project convention).
3. **Actions mutate the store** (unlike existing record-panel actions which only log proposals). Completing the job sheet on the phone must visibly change Ready to Invoice, van stock, Warranty and Control Tower counts. This is the demo's centrepiece; everything else can be static.
4. Add a **"Reset demo"** button in Settings (restores seed; state also in sessionStorage so a refresh mid-demo is safe).
5. Map: inline SVG Ireland outline + projected lat/lng, no network dependency.
6. Signature: `<canvas>` pointer events.
7. Verify via preview pane at desktop 1440 and the phone frame; zero console errors.

---

## 11. Phasing

### Friday (must work live, in this order of priority)
1. Store + seed + role switcher (foundation for everything live).
2. Service Desk: email request -> Create job (JOB-2492).
3. Dispatch Board: timelines + map + Auto-plan proposal -> accept -> "Sent to Eoin's phone".
4. Engineer App: day, job detail, job sheet, parts fitted/removed, photos (preset images), signature, complete.
5. Ripple: Jobs timeline, Ready to Invoice (invoice draft), Van stock −1, Warranty claim drafted, Asset history updated, Control Tower counters.
6. Control Tower.
7. Time & Travel (Eoin's day + discrepancies) + Tracking & Privacy page.
8. Warranty pipeline + Parts stock grid (static beyond the ripple).
9. Helios: 4 new answers (plan tomorrow, ready to invoice, warranty outstanding, what's in Eoin's van).

### Friday stretch (static/clickable screens, no live logic)
Workshop board + one workshop job with cost vs quote; Quotes list + one quote -> convert; Machine Register + asset tabs; Hire list; Integrations page.

### After Friday (proposal scope)
Real routing optimiser, real VoIP/email ingestion, offline-first mobile app (PWA or React Native), Xero/Sage sync, manufacturer claim templates per brand, payroll export, customer portal (approvals, job history, signed dockets), QR asset labels, DPIA document.

Rough effort for Friday core: 1 long day of focused build. The stretch list is another half day. If time is short, cut from the bottom of the Friday list, never item 4 or 5.

---

## 12. Friday demo script (10 minutes)

1. **Control Tower** (1 min): "This is your business right now." Point at engineer strip, ready to invoice, warranty credits outstanding.
2. **Service Desk** (1 min): open the Carrigdown-style email, fields already extracted, Create job. "That's the only time anyone types it."
3. **Dispatch** (2 min): Plan tomorrow. Read two reason chips aloud. Accept. "That replaced Trello and the WhatsApp."
4. **Engineer App** (3 min): switch role to Eoin. Start day (05:02). Open job, machine history, fit part from van, tag the removed part, take photo, customer signs on screen, complete. "That replaced the triplicate docket."
5. **Ripple** (2 min): back to office. Job reviewed, invoice drafted with lines already there. Van stock dropped. Warranty claim WC-0318 drafted with serial and photos. Machine history shows the visit.
6. **Time & Privacy** (1 min): Eoin's day timeline, planned vs actual. Then the privacy page: only on duty, geofence events not trails, engineer sees own data.
7. Close on Workshop/Quotes as "same pattern, workshop side" if built, else describe.

---

## 13. Open questions for Tom (ask Friday, not blockers)

1. Accounting package (Xero, Sage, other)? Invoice numbering must continue theirs.
2. How are warranty claims submitted today, per manufacturer (portal, email form, spreadsheet)?
3. Do engineers have company phones/tablets? Android or iOS? Coverage black spots?
4. Labour/travel billing rules: per hour, per 15 min, fixed call-out, mileage?
5. Contract/SLA customers: billed per visit or fixed fee?
6. Number of engineers, salespeople, vans; any subcontractors?
7. Is there an existing parts list/stock spreadsheet to import? Part numbering scheme?
8. Hire: how many machines, how billed (weekly/monthly)?
9. Union or staff-rep consultation needed for GPS?
10. Which manufacturers do they actually supply (to replace placeholder brand names)?
