/**
 * CPGRAMS-style escalation ladder.
 *
 * Real Indian Railways grievance handling doesn't stop at "the executive
 * didn't answer" — an unresolved complaint climbs a ladder: agent ->
 * supervisor -> Divisional Officer -> (outside this app) CPGRAMS itself.
 * This module implements the automatic part of that ladder for complaints
 * left open/in_progress too long, plus a manual escalate-now path for
 * demos and genuinely urgent cases that shouldn't wait for a timer.
 */

const Complaint = require("../models/Complaint");
const Passenger = require("../models/Passenger");
const { sendWhatsAppMessage } = require("./whatsapp");
const { sendEmail } = require("./email");

// Hours a complaint can sit open before climbing to the next rung.
// Configurable via .env for demoing without waiting real hours.
const LEVEL1_HOURS = parseFloat(process.env.ESCALATION_LEVEL1_HOURS || "24"); // -> supervisor
const LEVEL2_HOURS = parseFloat(process.env.ESCALATION_LEVEL2_HOURS || "48"); // -> divisional officer

const LEVEL_LABELS = ["Agent / Executive", "Supervisor", "Divisional Officer"];

function hoursSince(date) {
  return (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60);
}

/** Escalates one complaint document by exactly one rung and notifies the passenger. */
async function escalateComplaint(complaint, reason = "auto_timeout") {
  const nextLevel = Math.min(2, complaint.escalationLevel + 1);
  complaint.escalationLevel = nextLevel;
  complaint.escalatedAt = new Date();
  complaint.escalationHistory.push({ level: nextLevel, reason });
  await complaint.save();

  const passenger = await Passenger.findOne({ pnr: complaint.pnr });
  if (passenger?.mobile) {
    sendWhatsAppMessage(
      passenger.mobile,
      `Hi ${passenger.name}, your complaint "${complaint.intent}" (PNR ${complaint.pnr}) has been escalated to ${LEVEL_LABELS[nextLevel]} for faster resolution. — Indian Railways`
    ).catch(() => {}); // fire-and-forget
  }
  if (passenger?.email) {
    sendEmail(
      passenger.email,
      `Your complaint has been escalated — PNR ${complaint.pnr}`,
      `Hi ${passenger.name},\n\nYour complaint "${complaint.intent}" (PNR ${complaint.pnr}) has been escalated to ${LEVEL_LABELS[nextLevel]} for faster resolution.\n\n— Indian Railways`
    ).catch(() => {}); // fire-and-forget, same as WhatsApp above
  }

  return complaint;
}

/**
 * Scans all open/in_progress complaints and escalates any that have been
 * sitting past the threshold for their current level. Meant to be run on
 * an interval (see server/src/index.js) — safe to call repeatedly, it only
 * ever bumps a complaint at most once per sweep.
 */
async function runEscalationSweep() {
  const candidates = await Complaint.find({ status: { $in: ["open", "in_progress"] }, escalationLevel: { $lt: 2 } });
  let escalatedCount = 0;

  for (const complaint of candidates) {
    const threshold = complaint.escalationLevel === 0 ? LEVEL1_HOURS : LEVEL2_HOURS;
    const clockStart = complaint.escalatedAt || complaint.createdAt;
    if (hoursSince(clockStart) >= threshold) {
      await escalateComplaint(complaint, "auto_timeout");
      escalatedCount++;
    }
  }

  if (escalatedCount > 0) {
    console.log(`[escalation] auto-escalated ${escalatedCount} complaint(s) this sweep`);
  }
  return escalatedCount;
}

module.exports = { runEscalationSweep, escalateComplaint, LEVEL_LABELS, LEVEL1_HOURS, LEVEL2_HOURS };
