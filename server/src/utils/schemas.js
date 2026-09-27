const { z } = require("zod");

const loginSchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(1).max(200),
});

const customerSessionSchema = z.object({
  name: z.string().max(100).optional(),
});

const passengerSignupSchema = z.object({
  name: z.string().min(1).max(150),
  mobile: z.string().min(6).max(20),
  email: z.string().email().max(200).optional().or(z.literal("")),
  username: z.string().min(3).max(50),
  password: z.string().min(4).max(200),
});

const complaintCreateSchema = z.object({
  passengerName: z.string().min(1).max(150),
  pnr: z.string().min(1).max(20),
  trainNumber: z.string().max(20).optional(),
  coach: z.string().max(10).optional(),
  berth: z.coerce.number().int().min(1).max(200).optional(),
  intent: z.string().min(1).max(100),
  description: z.string().max(2000).optional(),
  status: z.enum(["open", "in_progress", "resolved", "rejected"]).optional(),
  source: z.enum(["ai_call", "executive_call", "manual"]).optional(),
  force: z.boolean().optional(), // bypass duplicate-complaint detection when the executive confirms it's genuinely new
});

const fineCreateSchema = z.object({
  passengerName: z.string().min(1).max(150),
  pnr: z.string().min(1).max(20),
  reason: z.string().min(1).max(300),
  amount: z.coerce.number().positive().max(1000000),
  overrideEmail: z.string().email().max(200).optional(),
});

const fineEmailSchema = z.object({
  overrideEmail: z.string().email().max(200),
});

const kbIntentCreateSchema = z.object({
  name: z.string().min(1).max(150),
  categoryId: z.string().min(1),
  questions: z.array(z.string().max(500)).max(200).optional(),
  synonyms: z.array(z.string().max(100)).max(200).optional(),
  keywords: z.array(z.string().max(100)).max(200).optional(),
  expectedAction: z.string().max(200).optional(),
  expectedAnswer: z.string().max(1000).optional(),
  confidenceThreshold: z.coerce.number().min(0).max(1).optional(),
});

const rfidScanSchema = z.object({
  stage: z.enum(["laundry", "store", "transport", "train", "coach", "berth", "return"]),
  note: z.string().max(500).optional(),
  trainNumber: z.string().max(20).optional(),
  coach: z.string().max(10).optional(),
  berth: z.coerce.number().int().min(1).max(200).optional(),
});

module.exports = {
  loginSchema,
  customerSessionSchema,
  passengerSignupSchema,
  complaintCreateSchema,
  fineCreateSchema,
  fineEmailSchema,
  kbIntentCreateSchema,
  rfidScanSchema,
};
