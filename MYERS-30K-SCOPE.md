# Myers Food Machinery · Pulse €30k production-scope demo (client brief)

Source: brief after Tom Myers reviewed the broad demo. Goal: a tight, credible system worth about €30,000 of custom software.
Less breadth, more depth. Every screen needs a reason to exist. Everything interlocks. One mock-data source.

## 1. Core operating flow
Inquiry / service request → triage → customer + site identification → machine identification → job created → priority set →
engineer assigned → parts / requirements checked → job scheduled → engineer dispatched → travels → arrives on site →
work completed → parts recorded → photos / notes recorded → customer / job completion → management review if required →
READY FOR INVOICE → send relevant information to QuickBooks → QuickBooks handles finance.

In parallel: engineer location → travel history → geo-zone calculation → subsistence calculation → monthly subsistence report.
And: part used → stock reduced → job cost updated → van / store quantity updated → low stock check → reorder flag if required.

## 2. Scope
In: service operations, engineer field work, dispatch and planning, parts and inventory, machinery records, warranty tracking,
subsistence automation, management oversight, operational AI, QuickBooks integration, records / documents / audit trail.

Out (remove or never build): accounting ledger, bookkeeping, bank reconciliation, AP/AR, payment processing, VAT, full invoice editor,
purchase accounting, journals, supplier payments, payroll, credit control, invoice management, finance reports, full procurement,
fleet management, route optimisation engine, HR, native apps, e-commerce, marketing automation, CRM sales suite, manufacturing ERP.
Pulse stops at READY FOR INVOICE. QuickBooks is the source of truth for invoices, payments, accounting. Pulse may READ statuses back
(e.g. Invoice QB-10428 · PAID · value · paid date), but the invoice lives in QuickBooks.

## 3. Sidebar
HOME: Command Centre · SERVICE: Service Desk, Jobs, Dispatch · FIELD: Engineers, Subsistence (+ Engineer app preview) ·
ASSETS: Parts, Machines, Warranties · AI: Agents · RECORDS: Customers, Documents, Knowledge / Ontology ·
ACTIVITY: Activity, Needs Attention · SETTINGS: Systems, Team & Permissions, Rules.

## 4. Command Centre
Top row: Jobs today, Engineers active (7/8), Urgent jobs, Ready for invoice (€), Awaiting parts, Needs attention.
Live service operations table (Job, Customer, Machine, Engineer, Status, Priority). Job statuses: Unassigned, Scheduled, Travelling,
On Site, Paused, Awaiting Part, Engineer Complete, Review Required, Ready for Invoice, Closed (plus Sent to QuickBooks).
Live engineer map: name, location, current job, status, travel time today, jobs completed, next job, away from base, subsistence status.
Needs attention: only what managers must act on. Morning briefing: today numbers + short watch list.

## 5. Service Desk
Front door for inbound requirements (email, phone transcription, website, manual). Example: Glenmore Foods, "Label printer/applicator on
Line 2 is missing labels at approximately 40 packs per minute." Detected: customer, site (Naas Production Facility), machine (LabelPro LP200),
serial (LP200-48023), urgency (HIGH), AI classification (likely sensor/alignment issue), suggested action (engineer inspection today).
Buttons: CREATE JOB, ASSIGN ENGINEER, REQUEST MORE INFORMATION.
AI triage can: identify customer / site / machine / serial, classify, set urgency, search machine history, find similar faults,
identify likely parts, recommend engineer on skills/location, create a draft job. It must NOT silently perform high-impact actions.
Show AI SUGGESTION: recommended engineer + why (certified, distance, van carries likely part, availability) → ASSIGN / CHOOSE ANOTHER.

## 6. Job record (#2491)
Header: number, customer, machine, priority, status. Sections: Customer (site, contact, phone), Machine (model, serial, installed,
last service, warranty), Reported issue, Assigned engineer (van, ETA, skills), Job timeline (received, AI triage, assigned, departed,
arrived, started, part scanned, repair completed, report completed), Parts used (part, qty, source van), Job documents (arrival photo,
machine photo, old part photo, parts label, engineer report, customer signature), Labour / travel summary (travel, on site, engineer,
parts estimated internal value). Then MARK READY FOR INVOICE; then SEND TO QUICKBOOKS (sends approved operational information).

## 7. Dispatch
Not a generic Kanban. Columns: Unassigned, Scheduled, Travelling, On Site, Awaiting Parts, Complete. Draggable for demo.
Card: customer, site, machine, priority, required skill, engineer, scheduled time, estimated duration. Click opens job record.
Engineer scheduling: per engineer time blocks, travel total, jobs, parts alerts.

## 8. Engineer field web app (mobile-first web app, NOT a native app)
Simple. Home: "Good morning, Sean · Monday 28 September · Today N jobs · Next job (customer, time, machine, issue) · NAVIGATE,
CALL CUSTOMER, OPEN JOB". Job screen: customer contact, machine + serial, issue, history (dated), possible parts with van stock, START JOB.
Active job: JOB STARTED time, ADD NOTE, TAKE PHOTO, ADD PART, REPORT ISSUE, VIEW MACHINE HISTORY, COMPLETE JOB. Minimal typing, big targets.

## 9. Part label scanning (Tom's request)
Parts arrive in small plastic bags with a label: part number, description, stores location. ADD PART → SCAN LABEL (default),
SEARCH PART, MANUAL ENTRY. Camera UI: "Photograph the part label", Take Photo → "ANALYSING LABEL..." subtle scan animation →
PART IDENTIFIED: MX-44721 · Optical Sensor, Label Applicator · Storage B-14-03 · Match 98.7% · Quantity 1 → CONFIRM PART / EDIT.
On confirm, simultaneously: part added to job; Van 04 stock 2 → 1; part history (engineer, customer, machine, job, date);
job value; label photo stored in documents; low stock check → reorder suggestion. This interlock is critical.

## 10. Parts & inventory
Metrics: parts in stock, van stock value, low stock, awaiting delivery. Locations: Main Stores, Van 01..08.
Part record: number, name, manufacturer, stores location, quantity per location, reorder level, last used, history
(transferred, used, received). Reorder recommendations only (no procurement): REORDER REQUIRED · available · minimum · suggested ·
supplier · CREATE REORDER REQUEST (internal task / suggested email).

## 11. Machine register
Search by customer, machine, serial, model. Record: model, serial, customer, site, installed, status, warranty; service history
(every job); part history; documents (manuals, certificates, service reports, photos); open issues. QR identifier opens the record.

## 12. Warranties
Sections: ACTIVE CLAIMS, AWAITING MANUFACTURER, CREDIT DUE, CLOSED. Claim W-1062: FreshPak · MetalCheck X4 · MCX4-8841 · failed part
MC-77401 · Job #2478 · MetalCheck · AWAITING CREDIT · €742 · submitted 18 Sep · 4 documents. Links to customer, machine, job, part, documents.

## 13. Subsistence (client requested; currently manual)
Base: Myers Food Machinery. Qualifying radius 10 km (configurable, not hard-coded). Track: engineer, date, first exit from zone,
final return, total time outside, location gaps, associated jobs, non-chargeable stops, band. NOT based only on billable jobs:
all time legitimately outside the zone counts. Rules (Settings → Rules → Subsistence): radius; Band 1 ≥5 h €20; Band 2 ≥10 h €50;
labelled CONFIGURABLE RULE (illustrative figures from the meeting, not legal rules).
Day timeline example (Sean, Monday 28 Sep): exited zone 07:18 → Glenmore → Job #2491 → departed → Murphy Foods site measurement
(NON-BILLABLE VISIT) → returned to zone 15:42 · TOTAL AWAY 8h 24m · 5+ HOURS · €20.00 · AUTO-CALCULATED.
Monthly report September 2026: total allowances, qualifying days, engineers, requires review; table (engineer, date, exit, return,
time away, band, allowance, status); filters (employee, month, band, review status); EXPORT CSV, EXPORT REPORT, MARK REVIEWED.
Not payroll: a report for payroll/accounting.
Exceptions flagged automatically: GPS gap (Sean, 14:17–14:53), no return detected (David Ryan, last location 18:14),
manual adjustment (Gary Doyle marked returned 17:48, manager confirmation required).
Location privacy: tracking status active during working hours (07:00–18:30); reason: dispatch, job verification and subsistence.

## 14. Management engineer profile
Today: jobs, complete, travel, on site, outside base zone, subsistence, parts used, current activity.

## 15. Ready for invoice
Endpoint, not invoicing software. Job: customer, engineer, labour, travel, parts, completion report, customer confirmation,
status READY → SEND TO QUICKBOOKS → SENT TO QUICKBOOKS · Reference QB-10428 → later INVOICED, then PAID read back.

## 16. Settings
Systems: QuickBooks CONNECTED, last sync, sync list (customers, addresses, quotes, ready-for-invoice jobs, invoice status, payment status).
Do not imply Pulse modifies the ledger. Also Email connected; customer DB, parts DB, machine records imported; historical documents
indexing. Data migration: 12,418 records imported, 782 documents indexed, 94% complete, 4 require review.
Team & Permissions: Owner/Director (everything); Service Manager (desk, jobs, dispatch, engineers, machines, parts, warranties,
subsistence, reports); Engineer (own jobs, relevant customer/machine/docs, parts, job actions only); Stores (parts, transfers, stock, reorders).

## 17. Records
Customer: sites, machines, open jobs, jobs YTD; contacts; machines; service history; documents (reports, photos, quotes, manuals,
certificates); activity. Documents: everything captured in the field attaches to the right records; no orphaned files.
Knowledge / ontology: Myers-specific graph (Glenmore → Naas site → LP200 → Job #2491 → Sean → MX-44721 → Van 04); click opens records.

## 18. AI
Five agents: Service Coordinator (classification, drafts, priority, customer/machine recognition), Dispatch Assistant (availability,
location, skills, route consideration, allocation suggestions), Parts Assistant (lookup, stock location, likely parts, low stock,
reorder recommendations), Machine Expert (history, recurring faults, manuals, previous repairs), Operations Watchdog (overdue jobs,
delayed engineers, missing documents, stuck awaiting parts, unreviewed subsistence exceptions, completed jobs not sent to QuickBooks).
AI chat sample questions: Where is Sean? · What jobs are still open today? · Which engineers have qualified for subsistence this week? ·
Which parts are below minimum stock? · Show me every issue we've had with Glenmore's LP200 · What jobs are completed but haven't reached
QuickBooks? · Which warranty credits are still outstanding? · Who is closest to the FreshPak breakdown and qualified?
Morning briefing: concise. Activity log: complete audit trail (person, AI, system, QuickBooks). Needs Attention: one queue with
categories URGENT, APPROVAL, STOCK, WARRANTY, SUBSISTENCE, DATA; resolving removes the item.

## 19. Demo story (must work end to end)
1 Command Centre → 2 Glenmore enquiry, AI identifies customer/site/machine/problem/urgency → 3 draft job → 4 dispatch recommends Sean
→ 5 Sean receives job on mobile web → 6 leaves qualifying zone, subsistence timer starts → 7 arrives, starts job → 8 photographs part bag
→ 9 Pulse extracts MX-44721 / Optical Sensor / B-14-03 → 10 confirm: job, Van 04 stock, part history, machine history, image, reorder
check → 11 complete → 12 validates travel, labour, parts, report, photos → 13 READY FOR INVOICE → 14 send to QuickBooks → 15 INVOICED,
then PAID → 16 non-billable measurement at Murphy Foods, subsistence continues → 17 returns: 8h 24m, 5+ band, €20 → 18 month-end report.

## 20. UX
Management: professional, industrial, clear, dense without clutter; desktop first, works on tablet. Engineer: extremely simple,
mobile-first (390×844, 430×932), large targets, minimal typing, believable camera flow, no horizontal overflow.
Keep the existing Pulse visual system. Subtle animation only. Actions must update demo state (start job, scan, confirm, complete,
send to QuickBooks, resolve alert, change subsistence rule).

## Reconciliation notes (how the demo resolves conflicting numbers in the brief)
- Demo day is Monday 28 September 2026; the story clock starts at 07:02 and moves forward as actions happen.
- Glenmore email arrived 06:51, AI drafted #2491 at 06:53. FreshPak phoned 06:56 (#2492), David Ryan travelling.
- Sean's canonical day: leaves zone 07:18, Glenmore 09:04 (about 1h50 from base), part scan 10:18, complete 11:24, Murphy Foods
  measurement 13:16–14:01 (non-billable), back in zone 15:42 → 8h 24m away → 5+ hour band → €20.
- GreenFarm's awaiting-part job is #2488 (bearing unavailable in Van 03), matching the Needs Attention example.
- MX-44721 stock: Main Stores 1, Van 04 2, Van 06 1 (total 4 = reorder level). Sean's scan takes Van 04 to 1 and the total to 3,
  which triggers REORDER REQUIRED: available 3, minimum 4, suggested 10, LabelPro UK.
