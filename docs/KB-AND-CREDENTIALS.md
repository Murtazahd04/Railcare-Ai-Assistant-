# SRLMS — Login Credentials & AI Knowledge Base Reference

Generated from `server/src/seed/seed.js`. Re-run `npm run seed` (inside `server/`)
any time you want this exact data reloaded into MongoDB — it wipes and
recreates all demo collections, including everything below.

---

## 1. Login credentials (all created by the seed script)

### Staff / dashboard logins — password for all: `password123`

| Username     | Role        | Notes                                   |
|--------------|-------------|------------------------------------------|
| `admin`      | admin       | Full access, incl. AI Training Dashboard |
| `supervisor` | supervisor  | Supervisor monitoring view               |
| `priya`      | executive   | Can take/transfer calls                  |
| `karan`      | executive   | Can take/transfer calls                  |
| `farah`      | executive   | Can take/transfer calls                  |
| `vikas`      | executive   | Can take/transfer calls                  |
| `sneha`      | executive   | Can take/transfer calls                  |

### Passenger Portal logins — password for all: `password123`

| Username      | Name           | Mobile          |
|---------------|----------------|-----------------|
| `passenger1`  | Rahul Mehta    | +91 90000 00001 |
| `passenger2`  | Sneha Kapoor   | +91 90000 00002 |
| `passenger3`  | Aman Tripathi  | +91 90000 00003 |
| `passenger4`  | Kritika Bhatt  | +91 90000 00004 |
| `passenger5`  | Om Prakash     | +91 90000 00005 |

Each passenger login has 3 bookings seeded (past / ongoing / upcoming), so
the "My Bookings" and complaint/fine history views all have real data to show.

### Fixed demo PNR (no login needed, works with executive PNR lookups)

- **Name:** Amey Banaye · **Mobile:** +91 98765 43210 · **PNR:** `4521098234`
- Used by the sample voice query "check PNR 4521098234" so the demo is
  reproducible end-to-end.

> Real MongoDB Atlas / JWT secrets are in `README.private.md` (gitignored) —
> not repeated here since this file is meant to be shareable with a guide or
> teammate without exposing infrastructure credentials.

---

## 2. AI Knowledge Base — categories and intents

7 categories, 23 intents. Each intent has 10–12 training questions (English /
Hindi / Hinglish mixed) plus synonyms and keywords — the full list lives in
`server/src/seed/seed.js` and is editable live from the **Admin Training
Dashboard** (add more questions/synonyms/keywords per intent without
re-seeding). Below is the operator-facing summary: what the passenger might
ask, and what the AI replies before optionally handing off to a human.

| # | Intent | Category | Sample question | AI's reply (template) |
|---|--------|----------|------------------|------------------------|
| 1 | Missing Blanket | Linen Issues | "Where is my blanket?" | Notifies coach attendant to bring a blanket to the berth. |
| 2 | Dirty Bedsheet | Linen Issues | "My bedsheet is dirty" | Sends a clean bedsheet to the berth. |
| 3 | Fine Appeal | Fines & Payments | "Why was I fined?" | Pulls up fine on the PNR, transfers to executive for the appeal. |
| 4 | Train Delay Info | Journey Info | "Is my train late?" | Checks live position, reports delay status. |
| 5 | RFID Tracking Query | Linen Issues | "Where is my linen kit" | Reports the RFID tag's current pipeline stage. |
| 6 | Choose Linen Type | Customer's Choice | "Can I choose which blanket I get" | Explains cotton/woollen options, notes preference. |
| 7 | Change Delivery Time | Customer's Choice | "Can I get my linen later" | Reschedules the linen delivery. |
| 8 | Change or Cancel Linen Request | Customer's Choice | "I want to cancel my blanket request" | Cancels the earlier request. |
| 9 | Choose Berth Preference | Customer's Choice | "Can I switch to a lower berth" | Logs preference, transfers to executive (availability-dependent). |
| 10 | PNR Status | Journey Info | "What is the current ticket status for my PNR" | Reports confirmed seat, coach, berth. |
| 11 | Train Running Status | Journey Info | "Is Rajdhani Express running on time" | Reports live running status. |
| 12 | Seat & Fare Availability | Journey Info | "Check 3rd AC seat availability for Friday" | Transfers to executive to confirm live numbers/booking. |
| 13 | E-Catering / Food Order | E-Catering & Station Assistance | "Can I order a veg thali to my seat" | Transfers to executive to confirm menu/payment. |
| 14 | Destination Alert | E-Catering & Station Assistance | "Wake me up 20 min before Agra" | Sets a destination wake-up alert. |
| 15 | Refund Rules | Policy & General FAQ | "How many days will the refund take?" | Explains refund timelines (3–7 working days). |
| 16 | Tatkal Booking Guidelines | Policy & General FAQ | "When does Tatkal booking open?" | States Tatkal timing (10 AM AC / 11 AM non-AC). |
| 17 | Senior Citizen Quota | Policy & General FAQ | "What is the senior citizen quota age?" | States quota ages (60+ men / 58+ women) and lower-berth rule. |
| 18 | AC Coach Not Cooling | Coach & Safety | "AC is not working in my coach" | Raises an AC malfunction alert for the coach. |
| 19 | Water Not Available | Coach & Safety | "There is no water in my coach" | Alerts attendant to refill water at next stop. |
| 20 | Toilet Cleanliness | Coach & Safety | "The toilet is very dirty" | Sends an urgent cleaning request to housekeeping. |
| 21 | Medical Emergency | Coach & Safety | "There is a medical emergency on board" | Immediately escalates to a live executive (low confidence threshold — 0.4 — so it never lingers on a guess). |
| 22 | Security / Safety Concern | Coach & Safety | "I feel unsafe in my coach" / theft / harassment | Immediately escalates to a live executive + RPF. |
| 23 | Lost Luggage / Belongings | Coach & Safety | "I lost my bag on the train" | Logs a lost-property report referencing the PNR. |

**Design note on emergencies:** Medical Emergency and Security/Safety Concern
use a much lower confidence threshold (0.4) than the rest (0.55–0.75) on
purpose — for anything that even loosely resembles a safety issue, the system
should err on the side of reaching a human fast rather than the AI trying to
be clever.

---

## 3. How the "talk to AI → talk to executive" flow behaves now

Both `CustomerSimulator.jsx` (public helpline) and `PassengerPortal.jsx`
(logged-in "Talk to AI") follow the same three-step logic:

1. **Confident match (≥ threshold):** AI asks "Are you asking about X?" —
   confirm-first, so it never answers the wrong question with false
   confidence.
2. **Plausible but not confident (≥ 0.2 similarity):** AI now says *"I'm not
   fully sure, but did you mean one of these?"* and shows up to 3 close
   candidates to pick from, before ever mentioning ending the chat or an
   executive. Picking "None of these" tries again with those candidates
   excluded.
3. **Nothing plausible left:** only now does it offer "End chat" / "Talk to
   an executive."

This replaces the previous behavior, where any low-confidence match skipped
straight to "end chat or talk to executive" without trying to clarify first.

A real bug was also fixed along the way: `server/src/routes/public.js` was
missing the `Call` model import, so `POST /public/ai-session/close` (used
whenever a passenger rates and closes an AI-only chat) would have crashed
the request with `Call is not defined`.

---

## 4. Support-desk features added on top

### WhatsApp confirmation on filing (not just on resolve)
Every place a complaint or ticket gets created — executive-filed
(`complaints.js`), passenger self-service (`passengers.js`), and anonymous
PNR+mobile (`public.js`) — now sends an immediate WhatsApp receipt with a
reference number, in addition to the existing "resolved" notification.
No config changes needed beyond what was already in `server/.env`
(`TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_WHATSAPP_FROM`) — if
those are blank it just logs and no-ops, same as before.

### CPGRAMS-style escalation ladder
Complaints now carry `escalationLevel` (0 = Agent, 1 = Supervisor,
2 = Divisional Officer), `escalatedAt`, and `escalationHistory`.
`server/src/utils/escalation.js` sweeps every 10 minutes (see
`server/src/index.js`) and auto-bumps any open/in_progress complaint that's
been sitting too long at its level — default thresholds are 24h to reach
Supervisor and 48h to reach Divisional Officer, configurable via
`ESCALATION_LEVEL1_HOURS` / `ESCALATION_LEVEL2_HOURS` in `server/.env`.
There's also a manual **"Escalate now"** button (`POST
/complaints/:id/escalate`) for genuinely urgent cases that shouldn't wait —
shown on the Analytics Dashboard's new Escalation Ladder panel. The seed
script backdates 4 demo complaints so this panel isn't empty right after
`npm run seed`.

### Feedback loop → executive analytics
Real WebRTC calls (not just AI-only chats) can now be rated 1–5 stars right
after hang-up, in both the public helpline (`CustomerSimulator.jsx`) and the
Passenger Portal (`PassengerPortal.jsx`) — `POST
/public/calls/:callId/rating`. The Analytics Dashboard has three new panels
fed by this data:
- **Executive Performance** — calls handled, avg handle time, avg rating per executive
- **Passenger Satisfaction** — 1–5 star rating distribution
- **Escalation Ladder** — open complaints by level, with the manual escalate button

The seed script also gives ~75% of executive-handled demo calls a 3–5 star
rating so these panels have real-looking data immediately.

### Unanswered Queries log
Every query the AI transfers because nothing cleared even the loose
"clarify" threshold gets logged to a new `UnansweredQuery` collection
(deduped — a repeated near-identical question bumps an "asked N×" counter
instead of piling up rows). The Admin Training Dashboard has a new
**"Unanswered"** tab (with a live badge count) where you can review each
one, mark it "reviewed — no action needed," or one-click **add it as a
training question** directly onto an existing intent. This is the actual
mechanism for closing KB gaps with real data instead of guessing what
people are asking.

### Sentiment/urgency-based priority routing
`server/src/utils/sentiment.js` is a small, fully explainable heuristic
scorer (keyword + tone signals — no black-box ML) that looks at what the
caller said before being transferred. If it detects an emergency
(medical/security keywords) or clear frustration (repeated exclamation
marks, ALL CAPS, phrases like "still not," "third time," "unacceptable"),
that caller jumps ahead of routine callers in the WebRTC wait queue —
same-tier callers stay first-come-first-served among themselves. The
executive sees a badge on the incoming-call card ("Possible emergency" /
"Sounds frustrated") with the specific reason, so it's never a mystery.

### Repeat-caller flag
No new data needed — reuses the passenger's existing complaint history.
If a caller has 3+ complaints on file, the executive's customer profile
card now shows "⚠ Repeat contact — N complaints on file, give this one
extra care" during the call.

### Duplicate complaint detection
Before creating a complaint (from any of the three filing routes —
executive, passenger self-service, or anonymous PNR lookup), the backend
checks for an already-open complaint with the same PNR + intent filed in
the last 24h (`Complaint.findRecentDuplicate`, configurable window). If
found, it returns `409 { duplicate: true, message, existing }` instead of
silently creating a second one. The executive dashboard and Passenger
Portal both catch this and show a confirm dialog — "already filed 2h
ago — file anyway?" — before resubmitting with `force: true` if the person
insists it's a genuine recurrence.

### Multi-language KB coverage
`KbIntent` now has a `languages` field (defaults to `["en", "hi"]`). The
6 highest-priority intents — PNR Status, Train Running Status, Medical
Emergency, Security/Safety Concern, AC Coach Not Cooling, and Refund Rules
— now include real training questions in Marathi, Gujarati, and Tamil
(native script), tagged `languages: ["en","hi","hi-latn","mr","gu","ta"]`.
The Admin Training Dashboard shows an "N languages" badge next to any
intent with more than English+Hindi coverage, so you can see coverage
gaps at a glance and prioritize which intents to expand next.

### Mobile responsiveness
Passed over both passenger-facing screens (`CustomerSimulator.jsx` — the
public helpline, and `PassengerPortal.jsx` — the logged-in portal):
padding scales down on narrow phones instead of staying fixed at 24px,
and rows that used to cram a long line of text plus a status badge into
one line (bookings, complaints, past-query history) now stack vertically
below the `sm` breakpoint instead of squeezing or overflowing. The two
staff dashboards (`ExecutiveDashboard.jsx`, `AnalyticsDashboard.jsx`) got
the same header/content padding treatment for consistency, though their
multi-column layouts were already built to collapse to a single column on
narrow screens.

### On adding live Google/web search as an AI fallback
Feasible, but deliberately **not implemented** in this round — for a
railway support bot, a wrong "confident-sounding" answer pulled from a
random webpage is worse than saying "let me connect you to someone." If
you want this later, the safer design is: only trigger it after the KB's
own clarify step also comes up empty; restrict results to official domains
(`indianrailways.gov.in`, `indianrail.gov.in`, `irctc.co.in`) via Google
Custom Search API's `siteSearch` parameter; and present whatever's found as
"here's something I found online, not verified — want me to confirm with
an executive?" rather than as a direct answer. This needs a Google Custom
Search API key (there's a limited free tier) that isn't currently in
`server/.env` — happy to wire the code path in behind a feature flag
whenever you're ready to add one.

### Cross-dashboard auto-refresh (live sync)
Executive Console, Analytics Dashboard, and the AI Training Dashboard now
all poll the backend every **15 seconds** and silently merge in fresh data —
so a complaint filed from the Passenger Portal, a rating just submitted, an
escalation from another supervisor, or a KB edit from a teammate shows up
across all three within 15 seconds, with no manual page reload needed:
- **Executive Console** — re-pulls KPIs and call history on the timer (in
  addition to its existing "refresh right after a call ends" behavior).
- **Analytics Dashboard** — re-pulls KPIs, timeseries, top intents, ratings,
  executive performance, and the escalation ladder together; header shows a
  "synced HH:MM:SS" timestamp plus a manual refresh button.
- **AI Training Dashboard** — re-pulls categories, intents, and the
  Unanswered Queries badge count in the background. This is safe against
  losing in-progress edits: the intent editor only reads its starting values
  from props once on mount, so a background refresh never overwrites text
  you're actively typing — it only affects the list and other people's
  changes.

All three show a small green "live" pulse indicator in the header so it's
clear at a glance that the screen is staying in sync, not frozen.

### Proper queue routing — decline, timeout, and disconnect all now fall back correctly
Previously, if the executive a call was ringing to declined it (or their
tab crashed, or they just never picked up), the customer's call simply
ended — no attempt to find another free executive, no clear message beyond
a generic "declined" error. Fixed:

- **Explicit decline** — the moment an executive hits Decline, the backend
  immediately looks for another available executive (excluding the one who
  just declined) and rings them instead. The customer just sees "Ringing
  Agent Karan…" appear right after "Ringing Agent Priya…" — no dead end.
- **Ring timeout (25s)** — if nobody taps Accept/Decline within 25 seconds
  (covers an executive who's away from their desk or the tab lost focus),
  the server automatically treats it like a decline and moves on to the
  next free executive. This also applies to a transfer that nobody picks up.
- **Executive disconnects mid-ring** — if an executive's browser
  closes/crashes while a call is still ringing (not yet accepted), the
  customer gets rerouted the same way instead of the call just dying.
- **Nobody free at all** — if every executive is genuinely busy after all
  of the above, the customer goes back into the wait queue with the same
  "You're #1 in line · ~X min wait" experience as calling in fresh, instead
  of being dropped with no explanation.

This is all handled server-side in `server/src/socket/signaling.js`
(`handleUnansweredOrDeclined`, `startRingTimer`) — no new setup needed, it's
just how routing behaves now.

