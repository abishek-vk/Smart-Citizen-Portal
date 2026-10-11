/**
 * Dummy payment gateway (test mode only — no money moves).
 *
 * Flow, modelled on Razorpay/Stripe test mode:
 *   1. POST /payments/gateway/orders   → server prices the bill and returns a signed, short-lived order token
 *   2. POST /payments/gateway/confirm  → simulated authorisation; marks the bill paid or records a failed attempt
 *
 * Orders are stateless HMAC-signed tokens, so this works on serverless deployments without an orders table.
 * Card numbers are validated and discarded; only the last 4 digits ever reach the response.
 */
import { Router } from "express";
import type { IRouter, Response } from "express";
import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "crypto";
import { and, eq } from "drizzle-orm";
import { db, propertyTaxesTable, waterTaxesTable, paymentsTable } from "@workspace/db";
import { CreateGatewayOrderBody, ConfirmGatewayPaymentBody } from "@workspace/api-zod";
import { requireAuth, ensureUser } from "../lib/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const MERCHANT = "Coimbatore Municipal Corporation";
const ORDER_TTL_MS = 15 * 60 * 1000;
const TEST_OTP = "123456";
const BANKS: Record<string, string> = {
  sbi: "State Bank of India",
  hdfc: "HDFC Bank",
  icici: "ICICI Bank",
  axis: "Axis Bank",
  kotak: "Kotak Mahindra Bank",
  iob: "Indian Overseas Bank",
};

const SECRET =
  process.env.PAYMENT_GATEWAY_SECRET ||
  process.env.CLERK_SECRET_KEY ||
  (() => {
    logger.warn("PAYMENT_GATEWAY_SECRET is not set; using a per-process secret (orders won't survive restarts)");
    return randomBytes(32).toString("hex");
  })();

type Purpose = "property_tax" | "water_tax";
type OrderClaims = { oid: string; uid: string; purpose: Purpose; ref: string; amount: number; exp: number };
type GatewayErrorCode =
  | "card_declined" | "insufficient_funds" | "invalid_card" | "expired_card" | "invalid_otp"
  | "invalid_upi" | "upi_declined" | "bank_declined" | "invalid_bank"
  | "order_expired" | "invalid_order" | "already_paid" | "not_found";

const sign = (payload: string) => createHmac("sha256", SECRET).update(payload).digest("base64url");

function encodeOrder(claims: OrderClaims): string {
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decodeOrder(token: string): OrderClaims | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as OrderClaims;
  } catch {
    return null;
  }
}

async function loadBill(purpose: Purpose, id: string, userId: string) {
  const table = purpose === "property_tax" ? propertyTaxesTable : waterTaxesTable;
  const [bill] = await db.select().from(table).where(and(eq(table.id, id), eq(table.userId, userId)));
  if (!bill) return null;
  const label = purpose === "property_tax"
    ? `Property tax · ${(bill as typeof propertyTaxesTable.$inferSelect).propertyId}`
    : `Water charges · ${(bill as typeof waterTaxesTable.$inferSelect).connectionId}`;
  return { status: bill.status, amount: bill.totalDue, label, table };
}

function fail(res: Response, status: number, code: GatewayErrorCode, error: string, retryable: boolean, paymentId?: string) {
  res.status(status).json({ error, code, retryable, ...(paymentId ? { paymentId } : {}) });
}

const luhnValid = (digits: string) => {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  return sum % 10 === 0;
};

function cardBrand(digits: string) {
  if (/^4/.test(digits)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "Mastercard";
  if (/^(60|65|81|82|508)/.test(digits)) return "RuPay";
  if (/^3[47]/.test(digits)) return "Amex";
  return "Card";
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

router.post("/payments/gateway/orders", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const parsed = CreateGatewayOrderBody.safeParse(req.body ?? {});
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const user = (req as any).user;
  const { purpose, referenceId } = parsed.data;

  const bill = await loadBill(purpose, referenceId, user.id);
  if (!bill) { fail(res, 404, "not_found", "Bill not found", false); return; }
  if (bill.status === "paid") { fail(res, 409, "already_paid", "This bill has already been paid", false); return; }

  const claims: OrderClaims = {
    oid: `order_${randomBytes(9).toString("base64url")}`,
    uid: user.id,
    purpose,
    ref: referenceId,
    amount: bill.amount,
    exp: Date.now() + ORDER_TTL_MS,
  };

  res.status(201).json({
    orderId: claims.oid,
    token: encodeOrder(claims),
    amount: bill.amount,
    currency: "INR",
    description: bill.label,
    merchant: MERCHANT,
    expiresAt: new Date(claims.exp).toISOString(),
    testMode: true,
  });
});

router.post("/payments/gateway/confirm", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const parsed = ConfirmGatewayPaymentBody.safeParse(req.body ?? {});
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const user = (req as any).user;
  const input = parsed.data;

  const order = decodeOrder(input.token);
  if (!order || order.uid !== user.id) { fail(res, 400, "invalid_order", "This payment session is invalid. Please start again.", false); return; }
  if (Date.now() > order.exp) { fail(res, 410, "order_expired", "This payment session has expired. Please start again.", false); return; }

  const bill = await loadBill(order.purpose, order.ref, user.id);
  if (!bill) { fail(res, 404, "not_found", "Bill not found", false); return; }
  if (bill.status === "paid") { fail(res, 409, "already_paid", "This bill has already been paid", false); return; }

  // ── Validate the instrument (input errors are not recorded as payment attempts) ──
  let paymentMethod: "credit_card" | "upi" | "net_banking";
  let methodDetail: string;
  let decline: { code: GatewayErrorCode; message: string } | null = null;

  if (input.method === "card") {
    const card = input.card;
    const digits = (card?.number ?? "").replace(/\D/g, "");
    if (!card || digits.length < 13 || digits.length > 19 || !luhnValid(digits)) {
      fail(res, 422, "invalid_card", "Card number is invalid", true); return;
    }
    const m = /^(\d{2})\s*\/\s*(\d{2})$/.exec(card.expiry.trim());
    const month = m ? Number(m[1]) : 0;
    if (!m || month < 1 || month > 12) { fail(res, 422, "invalid_card", "Expiry must be in MM/YY format", true); return; }
    const expiryEnd = new Date(2000 + Number(m[2]), month, 1); // first day of the month after expiry
    if (expiryEnd.getTime() <= Date.now()) { fail(res, 422, "expired_card", "This card has expired", true); return; }
    if (!/^\d{3,4}$/.test(card.cvv)) { fail(res, 422, "invalid_card", "CVV is invalid", true); return; }
    if (!card.name.trim()) { fail(res, 422, "invalid_card", "Name on card is required", true); return; }
    if (input.otp !== TEST_OTP) { fail(res, 422, "invalid_otp", "Incorrect OTP. Use 123456 in test mode.", true); return; }

    paymentMethod = "credit_card";
    methodDetail = `${cardBrand(digits)} •••• ${digits.slice(-4)}`;
    if (digits === "4000000000000002") decline = { code: "card_declined", message: "Your card was declined by the issuing bank" };
    if (digits === "4000000000009995") decline = { code: "insufficient_funds", message: "Insufficient funds on this card" };
  } else if (input.method === "upi") {
    const vpa = (input.upiId ?? "").trim().toLowerCase();
    if (!/^[a-z0-9._-]{2,256}@[a-z][a-z0-9]{1,64}$/.test(vpa)) { fail(res, 422, "invalid_upi", "Enter a valid UPI ID, like name@bank", true); return; }
    paymentMethod = "upi";
    methodDetail = `UPI · ${vpa}`;
    if (vpa.startsWith("failure@")) decline = { code: "upi_declined", message: "The payment request was declined in the UPI app" };
  } else {
    const bankName = BANKS[input.bank ?? ""];
    if (!bankName) { fail(res, 422, "invalid_bank", "Select a bank to continue", true); return; }
    paymentMethod = "net_banking";
    methodDetail = `Net banking · ${bankName}`;
    if (input.bankOutcome !== "success") decline = { code: "bank_declined", message: `${bankName} could not authorise this payment` };
  }

  // Simulated network/bank latency
  await delay(900 + Math.floor(Math.random() * 700));

  const paymentId = `pay_${randomBytes(9).toString("base64url")}`;
  const now = new Date();
  const prefix = order.purpose === "property_tax" ? "PTX" : "WTX";

  if (decline) {
    await db.insert(paymentsTable).values({
      id: paymentId, userId: user.id, type: order.purpose, referenceId: order.ref,
      amount: order.amount, paymentMethod, receiptNumber: `${prefix}-FAILED-${Date.now()}-${randomBytes(2).toString("hex")}`,
      status: "failed", paidAt: now,
    });
    fail(res, 402, decline.code, decline.message, true, paymentId);
    return;
  }

  // Guard against double payment if two confirms race: only flip a bill that is still unpaid.
  const updated = await db.update(bill.table)
    .set({ status: "paid", paidAt: now })
    .where(and(eq(bill.table.id, order.ref), eq(bill.table.userId, user.id), eq(bill.table.status, bill.status)))
    .returning({ id: bill.table.id });
  if (updated.length === 0) { fail(res, 409, "already_paid", "This bill has already been paid", false); return; }

  const receiptNumber = `${prefix}-RECEIPT-${Date.now()}`;
  await db.insert(paymentsTable).values({
    id: paymentId, userId: user.id, type: order.purpose, referenceId: order.ref,
    amount: order.amount, paymentMethod, receiptNumber, status: "success", paidAt: now,
  });

  res.json({
    paymentId,
    orderId: order.oid,
    receiptNumber,
    amount: order.amount,
    paymentMethod,
    methodDetail,
    status: "success",
    paidAt: now.toISOString(),
  });
});

export default router;
