# Myers Pulse demo script (production scope)

> Myers runs its service operation through Pulse. Pulse coordinates the work from the customer's request through dispatch,
> the engineer's phone, parts, machine records and completion. QuickBooks takes over when the work is ready to invoice.

All figures are demo data. The demo day is **Monday 28 September 2026** and the story clock starts at **07:02**.
The clock (top bar) moves forward as the story happens, so every timestamp agrees across screens.

## Start and stop

1. Double-click **Start Demo.command** (or run `python3 serve.py`). Open **http://pulse.localhost:8080**.
2. The engineer app on its own, for a real phone on the same machine: **http://pulse.localhost:8080/#/m**.
3. **Reset demo to 07:02** is in the person menu (top right). State survives a refresh; closing the tab resets it.
4. The earlier broad demo is still at **/v4**.

The **Demo story** pill (bottom left) shows the next step; click it to expand all 18 steps. Hide it from the person menu.

## The walkthrough (about 15 minutes)

1. **Command Centre.** Morning briefing, then the six numbers: 12 jobs today, 7 of 8 engineers, 3 urgent, €14,680 ready for
   invoice, 4 awaiting parts, the Needs Attention count. Live operations table, engineer map with the 10 km zone.
2. **Service Desk → RQ-3107.** Paul Byrne's email from Glenmore. AI has read customer, Naas site, LabelPro LP200, serial
   LP200-48023, high urgency, "likely sensor/alignment issue", the February sensor job, and MX-44721 as the likely part.
3. **Create job** confirms the AI draft as Job #2491. Nothing happened without a person.
4. **AI suggestion: Sean Murphy.** Read the reasons aloud: LabelPro certified, Van 04 carries MX-44721, free until 13:15,
   about 1h 54m away. Show **Choose another** (Aoife is booked at 08:00). Click **Assign**.
5. **Engineer app** (FIELD). Sean's phone: new job, Navigate, Call customer, Open job, machine history, possible parts.
6. **Start travel.** A moment later the geofence fires: Sean has left the Myers zone at 07:18, subsistence timer running.
7. **Arrived** (09:04), **Start job**.
8. **Add part → Scan label.** Photograph the part bag.
9. Pulse reads **MX-44721 · Optical Sensor, Label Applicator · B-14-03 · 98.7%**.
10. **Confirm part.** Read the list: added to the job, Van 04 2 → 1, part history, machine history, label photo stored,
    and the low-stock flag. Jump to **Parts → MX-44721**: reorder required, available 3, minimum 4, suggested 10 from LabelPro UK.
    **Create reorder request** (a request and a drafted email; ordering stays in QuickBooks).
11. Back on the phone: **Take photo**, then **Complete job** with the customer's signature.
12. **Jobs → #2491.** Completion checks: machine, labour, travel, parts, report, photos, customer confirmation.
13. Status **Ready for Invoice** with the estimated value.
14. **Send to QuickBooks** → QB-10428. A few seconds later QuickBooks reports **Invoiced**.
15. **Sync from QuickBooks** → **Paid**. Pulse reads statuses back; the invoice lives in QuickBooks.
16. Phone: Sean drives to **Murphy Foods** for a non-billable measurement. The subsistence timer keeps running.
17. **Head back to base** → **Arrived at base**: 8h 24m away, 5+ hour band, €20.00, calculated automatically.
    Open **Subsistence → Sean → today** for the timeline and the map.
18. **Subsistence → Monthly report.** September 2026, filters, Export CSV, Mark reviewed. **Exceptions**: GPS gap, no return
    detected, manual adjustment. **Rules**: change the radius or a band and watch the figures move.

Then, if there is time: **Dispatch** (drag a card, Schedule view), **Machines → LP200-48023** (QR, history, parts),
**Warranties → W-1062**, **Customers → Glenmore**, **Knowledge** (the golden thread), **Agents**, **Activity**, **Systems**
(QuickBooks connection and data migration), **Team & Permissions** (View as Stores or Engineer).

## Questions Pulse AI answers (Ask Pulse, top right)

| Ask | Answer shows |
|---|---|
| Where is Sean? | Status, place, ETA, time outside the zone, today's jobs |
| What jobs are still open today? | Open jobs, urgent count, unassigned count |
| Which engineers have qualified for subsistence this week? | Qualifying days and allowance per engineer |
| Which parts are below minimum stock? | Lines below van minimum or reorder level; proposes a reorder (needs your yes) |
| Show me every issue we've had with Glenmore's LP200 | Full machine history, the repeated sensor fault |
| What jobs are completed but haven't reached QuickBooks? | Review and ready jobs; proposes sending the ready ones (needs your yes) |
| Which warranty credits are still outstanding? | Open claims by stage, the overdue one |
| Who is closest to the FreshPak breakdown and qualified? | Ranking by distance and MetalCheck certification |

Write actions from AI wait for **NEEDS YOUR YES** with a hash of the exact arguments; confirming records it in Activity.

## Watch-outs

- Actions move the story clock forward. Other engineers' days play out as the clock moves (David reaches FreshPak at 08:21,
  finishes 10:40 and the warranty claim drafts itself for review).
- If you assign someone other than Sean to #2491, the story still works, but the 07:18 to 15:42 subsistence day is Sean's.
- Stay in dark mode for the demo; light mode works.
