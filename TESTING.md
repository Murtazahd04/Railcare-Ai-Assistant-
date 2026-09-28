# SRLMS — Test Cases & Account Credentials Guide

This guide provides a comprehensive test suite for validating all roles, portals, real-time WebRTC voice calling, AI categorization, and IoT tracking in **SRLMS (Smart Railway Linen Management System)**.

---

## 1. Master Credentials & Portals Directory

> **Universal Password**: Every seeded account uses the password **`password123`**.

| Role | Username / Identifier | Password | Access URL | Key Responsibilities |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `password123` | [#/staff-login](http://localhost:5173/#/staff-login) | AI Intent Studio, RFID Tracker, Full Control |
| **Supervisor** | `supervisor` | `password123` | [#/staff-login](http://localhost:5173/#/staff-login) | Live Queue, Roster, Force-Transfer, Escalations |
| **Executive / Agent 1** | `priya` | `password123` | [#/staff-login](http://localhost:5173/#/staff-login) | WebRTC Call Handling, PNR Lookup, Fines & Tickets |
| **Executive / Agent 2** | `karan` | `password123` | [#/staff-login](http://localhost:5173/#/staff-login) | WebRTC Voice Calling, Ticket Management |
| **Executive / Agent 3** | `farah` | `password123` | [#/staff-login](http://localhost:5173/#/staff-login) | Tier-1 Grievance Redressal |
| **Executive / Agent 4** | `vikas` | `password123` | [#/staff-login](http://localhost:5173/#/staff-login) | Support Agent Roster |
| **Executive / Agent 5** | `sneha` | `password123` | [#/staff-login](http://localhost:5173/#/staff-login) | Support Agent Roster |
| **Passenger 1** | `passenger1` *(Rahul Mehta)* | `password123` | [#/passenger](http://localhost:5173/#/passenger) | PNR Bookings, Linen Requests, In-App AI Chat |
| **Passenger 2** | `passenger2` *(Sneha Kapoor)* | `password123` | [#/passenger](http://localhost:5173/#/passenger) | PNR Bookings, Grievance Redressal |
| **Passenger 3** | `passenger3` *(Aman Tripathi)* | `password123` | [#/passenger](http://localhost:5173/#/passenger) | Self-Service Linen Operations |
| **Passenger 4** | `passenger4` *(Kritika Bhatt)* | `password123` | [#/passenger](http://localhost:5173/#/passenger) | Self-Service Linen Operations |
| **Passenger 5** | `passenger5` *(Om Prakash)* | `password123` | [#/passenger](http://localhost:5173/#/passenger) | Self-Service Linen Operations |
| **Public Simulator** | *Guest (No Login Required)* | *None* | [#/customer](http://localhost:5173/#/customer) | Voice & Speech Simulator, PNR Query, SOS Escalation |

---

## 2. Test Scenarios

### Test Case 1: WebRTC Live Voice Call & Priority Queue Routing
**Goal**: Verify real-time peer-to-peer WebRTC voice calling between a passenger and an active executive.

1. **Executive Setup**:
   * Open Chrome / Edge and visit `http://localhost:5173/#/staff-login`.
   * Log in with:
     * **Username**: `priya`
     * **Password**: `password123`
   * You will be routed to the **Executive Dashboard**.
   * Toggle the top agent status toggle from **Offline** to **Online / Available**.
2. **Passenger Voice / SOS Trigger**:
   * Open an **Incognito Window** (to allow simultaneous microphone access) and navigate to `http://localhost:5173/#/customer`.
   * Passenger Name: `Amey Banaye`
   * PNR: `4521098234`
   * Click **"Connect to Live Agent / SOS"** (or type *"Medical emergency, I need urgent help"* in the chat).
3. **Execution & Expected Result**:
   * The Executive window rings with an incoming WebRTC call badge showing sentiment urgency score and passenger PNR `4521098234`.
   * Click **"Accept Call"**.
   * Allow browser microphone permissions on both windows.
   * Speak into the microphone and confirm two-way audio signaling works.
   * Executive can view PNR journey details, log call notes, and click **"End Call"**.
   * On call completion, the customer screen presents a 5-star CSAT rating prompt.

---

### Test Case 2: Supervisor Real-Time Queue & Force Transfer
**Goal**: Verify supervisor surveillance, active agent status, and live call oversight.

1. **Setup**:
   * Open a browser tab to `http://localhost:5173/#/staff-login`.
   * Log in with:
     * **Username**: `supervisor`
     * **Password**: `password123`
   * You will be redirected to the **Supervisor Console** (`#/supervisor`).
2. **Test Steps**:
   * **Live Agent Roster**: Verify that agents currently logged in (e.g. `priya`, `karan`) show up with real-time status (**Online**, **Busy**, or **In Call**).
   * **Live Queue**: Initiate a call from `#/customer` while no agents are available or during an ongoing call; verify the queue wait-time timer increases in real time.
   * **Active Call Interception**: When an executive is on an active call, observe the live call card in the supervisor view. Test supervisor monitoring or transfer.
   * **Escalation Ladder**: Scroll down to view the **CPGRAMS Multi-Tier Escalations** table. Verify that backdated unresolved complaints appear under Level 1 and Level 2.

---

### Test Case 3: Passenger Self-Service Portal & Grievances
**Goal**: Validate passenger journey history, theme switching, and AI grievance submission.

1. **Setup**:
   * Navigate to `http://localhost:5173/#/passenger`.
   * Sign in using:
     * **Username**: `passenger1`
     * **Password**: `password123`
2. **Test Steps**:
   * **Theme Switcher**: Click the theme toggle icon in the top header and switch between:
     * *IRCTC Daylight* (Classic blue & saffron)
     * *Midnight Express* (Dark mode)
     * *Vande Bharat Royal* (Deep navy & gold)
   * **Journey Verification**: Confirm 3 distinct bookings are rendered:
     * **Past Booking**: Completed journey.
     * **Ongoing Booking**: Active train journey with coach/berth details.
     * **Upcoming Booking**: Future departure.
   * **Linen Request / Grievance**:
     * Click **"New Request"**.
     * Select Issue: `"Dirty Bedsheet"` or `"Missing Blanket"`.
     * Submit the ticket and verify it appears with a generated ticket reference ID and current status.

---

### Test Case 4: Admin AI Knowledge Base & Intent Studio
**Goal**: Train, tune, and test the Sentence-Transformer semantic intent classifier.

1. **Setup**:
   * Navigate to `http://localhost:5173/#/staff-login`.
   * Sign in with:
     * **Username**: `admin`
     * **Password**: `password123`
   * You will be redirected to the **Admin Studio** (`#/admin`).
2. **Test Steps**:
   * **Browse Categories**: View categories such as *Linen & Bedroll*, *Cleanliness & Hygiene*, *Pantry & Catering*, and *Security*.
   * **Test Utterance Classifier**:
     * Open the **Interactive Intent Tester**.
     * Test English: *"I haven't received my blanket yet"*
     * Test Hindi / Hinglish: *"Mujhe takiya aur chadar chahiye"* or *"train me safai nahi hai"*
     * Verify the engine returns the predicted intent, confidence score, and pre-configured response.

---

### Test Case 5: IoT RFID 7-Stage Linen Lifecycle Tracking
**Goal**: Audit the physical linen supply chain lifecycle from warehouse to sanitization.

1. **Setup**:
   * While logged in as `admin` or `supervisor`, navigate to `http://localhost:5173/#/rfid`.
2. **Test Steps**:
   * Search for sample RFID tags: `RFID-1001`, `RFID-1015`, or `RFID-1050`.
   * Inspect the 7-stage lifecycle path:
     1. `Warehouse Issued`
     2. `Train Loaded`
     3. `Berth Distributed`
     4. `Collected`
     5. `Laundry Received`
     6. `Washed & Sanitized`
     7. `Ready for Restock`
   * Click to advance the stage for a tag and refresh to confirm persistence in the database.

---

### Test Case 6: Analytics & Operational Intelligence
**Goal**: Inspect real-time operational metrics and CSAT trends.

1. **Setup**:
   * Navigate to `http://localhost:5173/#/analytics` (accessible by any logged-in staff role).
2. **Test Steps**:
   * Check **CSAT Scores**: Review the distribution of 1 to 5 star ratings generated from seeded call history.
   * Check **Call Volume & Category Trends**: Inspect the breakdown of incoming grievances (Linen, PNR, Cleanliness, Fines).
   * Check **Average Handling Time (AHT)** and resolution efficiency.

---

### Test Case 7: Razorpay Dynamic QR Fine Generation & Payment Flow
**Goal**: Test generating a penalty fine, creating a dynamic Razorpay payment link with scannable QR code, and verifying real-time payment reconciliation.

1. **Setup**:
   * Log into `http://localhost:5173/#/staff-login` as Executive (`priya` / `password123`).
   * Connect an active call from `#/customer` or `#/passenger` with PNR (e.g. `4521098234` or any seeded PNR).
2. **Step 1: Generate Fine**:
   * Under the **Active Call** panel, click **"Generate Fine"**.
   * Prompt 1 (*Reason*): Enter `Linen Damaged` or `Smoking in Coach`.
   * Prompt 2 (*Amount*): Enter `500`.
   * Prompt 3 (*Email*): Enter your test email or any test email (e.g. `test@example.com`).
   * A toast appears: `Fine record created — ₹500 (#...)`.
3. **Step 2: Generate Razorpay QR Code**:
   * Click **"Generate QR"**.
   * The **Razorpay Fine Payment QR (Test Mode)** modal pops up on screen displaying:
     * Passenger PNR & Amount (₹500).
     * Scannable QR code.
     * Clickable Razorpay test payment link (e.g. `https://rzp.io/i/...`).
4. **Step 3: Execute Payment**:
   * Click the payment link (or scan the QR code with your mobile camera).
   * Razorpay Test Mode checkout opens in your browser.
   * Pay using test details:
     * **Card**: Number `4111 1111 1111 1111`, Expiry `12/30`, CVV `123`, OTP `1234`.
     * **UPI**: Choose UPI, enter `test@upi`, click "Success".
     * **Netbanking**: Select any bank and click "Success".
   * Razorpay shows "Payment Successful".
5. **Step 4: Verify Payment Reconciliation**:
   * Return to the Executive Dashboard.
   * Click **"Check Payment Status"**.
   * The system queries Razorpay's API and displays: `Payment confirmed — fine marked as paid`.
   * In MongoDB, the fine status updates to `paid` with `paidAt` timestamp and `razorpayPaymentId`.

## 3. Environment & Service Ports Reference

| Service | Port | Health Check / URL | Status Check Command |
| :--- | :--- | :--- | :--- |
| **Vite Frontend Client** | `5173` | `http://localhost:5173` | `npm run dev` in `client/` |
| **Express Backend API** | `4000` | `http://localhost:4000/health` | `npm start` in `server/` |
| **FastAPI AI Service** | `8001` | `http://localhost:8001/health` | `uvicorn main:app --port 8001` in `ai-service/` |
| **MongoDB Service** | `27017` | `mongodb://127.0.0.1:27017/srlms` | `Get-Service MongoDB` (Windows) |

---

## 4. Resetting Demo Data

To reset the database to a clean demo state with freshly populated records at any time:

```bash
cd server
npm run seed
```
*(Or directly with Node: `node src/seed/seed.js`)*
