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

async function autoSeedTaxesForUser(userId: string) {
  const [pCount] = await db.select({ count: count() }).from(propertyTaxesTable).where(eq(propertyTaxesTable.userId, userId));
  const [wCount] = await db.select({ count: count() }).from(waterTaxesTable).where(eq(waterTaxesTable.userId, userId));

  if (Number(pCount.count) === 0 && Number(wCount.count) === 0) {
    const future30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const past15 = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const past60 = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Sample Property Taxes
    const prop1Id = randomUUID();
    const prop2Id = randomUUID();
    const prop3Id = randomUUID();

    await db.insert(propertyTaxesTable).values([
      {
        id: prop1Id,
        userId,
        propertyId: "PROP-CBE-2025-098",
        propertyAddress: "45 Avinashi Road, Ward 12, RS Puram, Coimbatore, TN 641002",
        propertyType: "residential",
        assessedValue: 245000,
        taxRate: 0.012,
        taxAmount: 294.00,
        penaltyAmount: 0,
        totalDue: 294.00,
        dueDate: future30,
        status: "pending",
        financialYear: "2025-2026",
      },
      {
        id: prop2Id,
        userId,
        propertyId: "PROP-CBE-2024-114",
        propertyAddress: "88 Trichy Road, Singanallur, Coimbatore, TN 641005",
        propertyType: "commercial",
        assessedValue: 480000,
        taxRate: 0.015,
        taxAmount: 720.00,
        penaltyAmount: 45.00,
        totalDue: 765.00,
        dueDate: past15,
        status: "overdue",
        financialYear: "2024-2025",
      },
      {
        id: prop3Id,
        userId,
        propertyId: "PROP-CBE-2023-042",
        propertyAddress: "45 Avinashi Road, Ward 12, RS Puram, Coimbatore, TN 641002",
        propertyType: "residential",
        assessedValue: 220000,
        taxRate: 0.012,
        taxAmount: 264.00,
        penaltyAmount: 0,
        totalDue: 264.00,
        dueDate: past60,
        status: "paid",
        financialYear: "2023-2024",
        paidAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
      }
    ]);

    await db.insert(paymentsTable).values({
      id: randomUUID(),
      userId,
      type: "property_tax",
      referenceId: prop3Id,
      amount: 264.00,
      paymentMethod: "credit_card",
      receiptNumber: "PTX-RECEIPT-2024-8831",
      status: "success",
      paidAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
    });

    // Sample Water Taxes
    const wtr1Id = randomUUID();
    const wtr2Id = randomUUID();
    const wtr3Id = randomUUID();

    await db.insert(waterTaxesTable).values([
      {
        id: wtr1Id,
        userId,
        connectionId: "WTR-CBE-88219",
        connectionAddress: "45 Avinashi Road, Ward 12, RS Puram, Coimbatore, TN 641002",
        meterReading: 1420,
        previousReading: 1310,
        unitsConsumed: 110,
        ratePerUnit: 15.00,
        taxAmount: 1650.00,
        penaltyAmount: 0,
        totalDue: 1650.00,
        billingPeriod: "Q1 2025 (Jan - Mar)",
        dueDate: future30,
        status: "pending",
      },
      {
        id: wtr2Id,
        userId,
        connectionId: "WTR-CBE-88219",
        connectionAddress: "45 Avinashi Road, Ward 12, RS Puram, Coimbatore, TN 641002",
        meterReading: 1310,
        previousReading: 1180,
        unitsConsumed: 130,
        ratePerUnit: 15.00,
        taxAmount: 1950.00,
        penaltyAmount: 150.00,
        totalDue: 2100.00,
        billingPeriod: "Q4 2024 (Oct - Dec)",
        dueDate: past15,
        status: "overdue",
      },
      {
        id: wtr3Id,
        userId,
        connectionId: "WTR-CBE-88219",
        connectionAddress: "45 Avinashi Road, Ward 12, RS Puram, Coimbatore, TN 641002",
        meterReading: 1180,
        previousReading: 1060,
        unitsConsumed: 120,
        ratePerUnit: 15.00,
        taxAmount: 1800.00,
        penaltyAmount: 0,
        totalDue: 1800.00,
        billingPeriod: "Q3 2024 (Jul - Sep)",
        dueDate: past60,
        status: "paid",
        paidAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000),
      }
    ]);

    await db.insert(paymentsTable).values({
      id: randomUUID(),
      userId,
      type: "water_tax",
      referenceId: wtr3Id,
      amount: 1800.00,
      paymentMethod: "upi",
      receiptNumber: "WTX-RECEIPT-2024-9912",
      status: "success",
      paidAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000),
    });
  }
}

router.post("/taxes/seed-sample", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const user = (req as any).user;
  await db.delete(propertyTaxesTable).where(eq(propertyTaxesTable.userId, user.id));
  await db.delete(waterTaxesTable).where(eq(waterTaxesTable.userId, user.id));
  await autoSeedTaxesForUser(user.id);
  res.json({ message: "Sample tax bills seeded successfully" });
});

router.get("/taxes/summary", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const user = (req as any).user;
  await autoSeedTaxesForUser(user.id);
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
  await autoSeedTaxesForUser(user.id);
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

router.post("/taxes/property", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const { propertyId, propertyAddress, propertyType, areaSqFt } = req.body;
  const area = Number(areaSqFt || 1200);
  const assessedValue = area * (propertyType === "commercial" ? 350 : 200);
  const taxRate = propertyType === "commercial" ? 0.015 : 0.012;
  const taxAmount = Math.round(assessedValue * taxRate * 100) / 100;
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const [newProp] = await db.insert(propertyTaxesTable).values({
    id: randomUUID(),
    userId: user.id,
    propertyId: propertyId || `PROP-CBE-${Date.now().toString().slice(-4)}`,
    propertyAddress: propertyAddress || "12 Civic Plaza, Coimbatore, TN",
    propertyType: propertyType || "residential",
    assessedValue,
    taxRate,
    taxAmount,
    penaltyAmount: 0,
    totalDue: taxAmount,
    dueDate,
    status: "pending",
    financialYear: "2025-2026",
  }).returning();

  res.status(201).json(newProp);
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
  const params = GetPropertyTaxParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid ID" }); return; }
  const user = (req as any).user;
  const [bill] = await db.select().from(propertyTaxesTable).where(and(eq(propertyTaxesTable.id, params.data.id), eq(propertyTaxesTable.userId, user.id)));
  if (!bill) { res.status(404).json({ error: "Not found" }); return; }
  if (bill.status === "paid") { res.status(400).json({ error: "Already paid" }); return; }
  
  const paymentMethod = req.body?.paymentMethod || "credit_card";
  await db.update(propertyTaxesTable).set({ status: "paid", paidAt: new Date() }).where(eq(propertyTaxesTable.id, bill.id));
  const receiptNumber = `PTX-RECEIPT-${Date.now()}`;
  await db.insert(paymentsTable).values({
    id: randomUUID(), userId: user.id, type: "property_tax", referenceId: bill.id,
    amount: bill.totalDue, paymentMethod: paymentMethod as any,
    receiptNumber, status: "success", paidAt: new Date(),
  });
  res.json({ paymentId: randomUUID(), receiptNumber, amount: bill.totalDue, paymentMethod, status: "success", paidAt: new Date().toISOString() });
});

router.get("/taxes/water", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const user = (req as any).user;
  await autoSeedTaxesForUser(user.id);
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

router.post("/taxes/water", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const { connectionId, connectionAddress, unitsConsumed } = req.body;
  const units = Number(unitsConsumed || 100);
  const ratePerUnit = 15.00;
  const taxAmount = Math.round(units * ratePerUnit * 100) / 100;
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [newWater] = await db.insert(waterTaxesTable).values({
    id: randomUUID(),
    userId: user.id,
    connectionId: connectionId || `WTR-CBE-${Date.now().toString().slice(-5)}`,
    connectionAddress: connectionAddress || "12 Civic Plaza, Coimbatore, TN",
    meterReading: 1500 + units,
    previousReading: 1500,
    unitsConsumed: units,
    ratePerUnit,
    taxAmount,
    penaltyAmount: 0,
    totalDue: taxAmount,
    billingPeriod: "Q1 2025 (Jan - Mar)",
    dueDate,
    status: "pending",
  }).returning();

  res.status(201).json(newWater);
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
  const params = GetWaterTaxParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid ID" }); return; }
  const user = (req as any).user;
  const [bill] = await db.select().from(waterTaxesTable).where(and(eq(waterTaxesTable.id, params.data.id), eq(waterTaxesTable.userId, user.id)));
  if (!bill) { res.status(404).json({ error: "Not found" }); return; }
  if (bill.status === "paid") { res.status(400).json({ error: "Already paid" }); return; }

  const paymentMethod = req.body?.paymentMethod || "credit_card";
  await db.update(waterTaxesTable).set({ status: "paid", paidAt: new Date() }).where(eq(waterTaxesTable.id, bill.id));
  const receiptNumber = `WTX-RECEIPT-${Date.now()}`;
  await db.insert(paymentsTable).values({
    id: randomUUID(), userId: user.id, type: "water_tax", referenceId: bill.id,
    amount: bill.totalDue, paymentMethod: paymentMethod as any,
    receiptNumber, status: "success", paidAt: new Date(),
  });
  res.json({ paymentId: randomUUID(), receiptNumber, amount: bill.totalDue, paymentMethod, status: "success", paidAt: new Date().toISOString() });
});

export default router;

