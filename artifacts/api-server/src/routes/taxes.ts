import { Router } from "express";
import { db, propertyTaxesTable, waterTaxesTable, paymentsTable } from "@workspace/db";
import { eq, and, sum, count } from "drizzle-orm";
import { requireAuth, ensureUser } from "../lib/auth";
import {
  ListPropertyTaxesQueryParams, GetPropertyTaxParams, PayPropertyTaxParams, PayPropertyTaxBody,
  ListWaterTaxesQueryParams, GetWaterTaxParams, PayWaterTaxParams, PayWaterTaxBody,
} from "@workspace/api-zod";
import { randomUUID } from "crypto";
import type { IRouter } from "express";

const router: IRouter = Router();

router.get("/taxes/summary", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const [ptax] = await db.select({ total: sum(propertyTaxesTable.totalDue) }).from(propertyTaxesTable).where(and(eq(propertyTaxesTable.userId, user.id), eq(propertyTaxesTable.status, "pending")));
  const [wtax] = await db.select({ total: sum(waterTaxesTable.totalDue) }).from(waterTaxesTable).where(and(eq(waterTaxesTable.userId, user.id), eq(waterTaxesTable.status, "pending")));
  const [overdueP] = await db.select({ count: count() }).from(propertyTaxesTable).where(and(eq(propertyTaxesTable.userId, user.id), eq(propertyTaxesTable.status, "overdue")));
  const [overdueW] = await db.select({ count: count() }).from(waterTaxesTable).where(and(eq(waterTaxesTable.userId, user.id), eq(waterTaxesTable.status, "overdue")));
  const propertyTaxDue = Number(ptax?.total ?? 0);
  const waterTaxDue = Number(wtax?.total ?? 0);
  res.json({
    propertyTaxDue, waterTaxDue, totalDue: propertyTaxDue + waterTaxDue,
    overdueCount: Number(overdueP.count) + Number(overdueW.count),
    nextDueDate: null,
  });
});

router.get("/taxes/property", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const params = ListPropertyTaxesQueryParams.safeParse(req.query);
  const page = params.success ? (params.data.page ?? 1) : 1;
  const limit = params.success ? (params.data.limit ?? 10) : 10;
  const offset = (page - 1) * limit;
  const conditions: any[] = [eq(propertyTaxesTable.userId, user.id)];
  if (params.success && params.data.status) conditions.push(eq(propertyTaxesTable.status, params.data.status as any));
  const where = and(...conditions);
  const [{ total }] = await db.select({ total: count() }).from(propertyTaxesTable).where(where);
  const data = await db.select().from(propertyTaxesTable).where(where).limit(limit).offset(offset);
  res.json({ data, pagination: { total: Number(total), page, limit, totalPages: Math.ceil(Number(total) / limit) } });
});

router.get("/taxes/property/:id", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const params = GetPropertyTaxParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid ID" }); return; }
  const user = (req as any).user;
  const [bill] = await db.select().from(propertyTaxesTable).where(and(eq(propertyTaxesTable.id, params.data.id), eq(propertyTaxesTable.userId, user.id)));
  if (!bill) { res.status(404).json({ error: "Not found" }); return; }
  res.json(bill);
});

router.post("/taxes/property/:id/pay", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const params = PayPropertyTaxParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid ID" }); return; }
  const body = PayPropertyTaxBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }
  const user = (req as any).user;
  const [bill] = await db.select().from(propertyTaxesTable).where(and(eq(propertyTaxesTable.id, params.data.id), eq(propertyTaxesTable.userId, user.id)));
  if (!bill) { res.status(404).json({ error: "Not found" }); return; }
  if (bill.status === "paid") { res.status(400).json({ error: "Already paid" }); return; }
  await db.update(propertyTaxesTable).set({ status: "paid", paidAt: new Date() }).where(eq(propertyTaxesTable.id, bill.id));
  const receiptNumber = `PTX-${Date.now()}`;
  await db.insert(paymentsTable).values({
    id: randomUUID(), userId: user.id, type: "property_tax", referenceId: bill.id,
    amount: bill.totalDue, paymentMethod: body.data.paymentMethod as any,
    receiptNumber, status: "success", paidAt: new Date(),
  });
  res.json({ paymentId: randomUUID(), receiptNumber, amount: bill.totalDue, paymentMethod: body.data.paymentMethod, status: "success", paidAt: new Date().toISOString() });
});

router.get("/taxes/water", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const params = ListWaterTaxesQueryParams.safeParse(req.query);
  const page = params.success ? (params.data.page ?? 1) : 1;
  const limit = params.success ? (params.data.limit ?? 10) : 10;
  const offset = (page - 1) * limit;
  const conditions: any[] = [eq(waterTaxesTable.userId, user.id)];
  if (params.success && params.data.status) conditions.push(eq(waterTaxesTable.status, params.data.status as any));
  const where = and(...conditions);
  const [{ total }] = await db.select({ total: count() }).from(waterTaxesTable).where(where);
  const data = await db.select().from(waterTaxesTable).where(where).limit(limit).offset(offset);
  res.json({ data, pagination: { total: Number(total), page, limit, totalPages: Math.ceil(Number(total) / limit) } });
});

router.get("/taxes/water/:id", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const params = GetWaterTaxParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid ID" }); return; }
  const user = (req as any).user;
  const [bill] = await db.select().from(waterTaxesTable).where(and(eq(waterTaxesTable.id, params.data.id), eq(waterTaxesTable.userId, user.id)));
  if (!bill) { res.status(404).json({ error: "Not found" }); return; }
  res.json(bill);
});

router.post("/taxes/water/:id/pay", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const params = PayWaterTaxParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid ID" }); return; }
  const body = PayWaterTaxBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }
  const user = (req as any).user;
  const [bill] = await db.select().from(waterTaxesTable).where(and(eq(waterTaxesTable.id, params.data.id), eq(waterTaxesTable.userId, user.id)));
  if (!bill) { res.status(404).json({ error: "Not found" }); return; }
  if (bill.status === "paid") { res.status(400).json({ error: "Already paid" }); return; }
  await db.update(waterTaxesTable).set({ status: "paid", paidAt: new Date() }).where(eq(waterTaxesTable.id, bill.id));
  const receiptNumber = `WTX-${Date.now()}`;
  await db.insert(paymentsTable).values({
    id: randomUUID(), userId: user.id, type: "water_tax", referenceId: bill.id,
    amount: bill.totalDue, paymentMethod: body.data.paymentMethod as any,
    receiptNumber, status: "success", paidAt: new Date(),
  });
  res.json({ paymentId: randomUUID(), receiptNumber, amount: bill.totalDue, paymentMethod: body.data.paymentMethod, status: "success", paidAt: new Date().toISOString() });
});

export default router;
