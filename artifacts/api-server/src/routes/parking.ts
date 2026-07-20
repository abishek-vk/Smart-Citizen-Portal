import { Router } from "express";
import { db, parkingLotsTable, parkingReservationsTable, paymentsTable } from "@workspace/db";
import { eq, and, count, desc } from "drizzle-orm";
import { requireAuth, ensureUser } from "../lib/auth";
import {
  ListParkingLotsQueryParams, CreateParkingReservationBody,
  GetParkingReservationParams, ListParkingReservationsQueryParams,
} from "@workspace/api-zod";
import { randomUUID } from "crypto";
import type { IRouter } from "express";

const router: IRouter = Router();

router.get("/parking/lots", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const lots = await db.select().from(parkingLotsTable).where(eq(parkingLotsTable.isActive, true));
  res.json(lots.map(l => ({ ...l, amenities: l.amenities ?? [] })));
});

router.get("/parking/reservations", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const params = ListParkingReservationsQueryParams.safeParse(req.query);
  const page = params.success ? (params.data.page ?? 1) : 1;
  const limit = params.success ? (params.data.limit ?? 10) : 10;
  const offset = (page - 1) * limit;
  const conditions: any[] = [eq(parkingReservationsTable.userId, user.id)];
  if (params.success && params.data.status) conditions.push(eq(parkingReservationsTable.status, params.data.status as any));
  const where = and(...conditions);
  const [{ total }] = await db.select({ total: count() }).from(parkingReservationsTable).where(where);
  const reservations = await db.select().from(parkingReservationsTable).where(where).orderBy(desc(parkingReservationsTable.createdAt)).limit(limit).offset(offset);
  const data = await Promise.all(reservations.map(async r => {
    const [lot] = await db.select().from(parkingLotsTable).where(eq(parkingLotsTable.id, r.parkingLotId));
    return { ...r, parkingLot: { ...lot, amenities: lot?.amenities ?? [] } };
  }));
  res.json({ data, pagination: { total: Number(total), page, limit, totalPages: Math.ceil(Number(total) / limit) } });
});

router.post("/parking/reservations", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const parsed = CreateParkingReservationBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const user = (req as any).user;
  const [lot] = await db.select().from(parkingLotsTable).where(eq(parkingLotsTable.id, parsed.data.parkingLotId));
  if (!lot) { res.status(404).json({ error: "Parking lot not found" }); return; }
  if (lot.availableSpots <= 0) { res.status(400).json({ error: "No spots available" }); return; }
  const start = new Date(parsed.data.startTime);
  const end = new Date(parsed.data.endTime);
  const hours = (end.getTime() - start.getTime()) / 3600000;
  const totalAmount = Math.round(hours * lot.pricePerHour * 100) / 100;
  const [reservation] = await db.insert(parkingReservationsTable).values({
    id: randomUUID(), userId: user.id, ...parsed.data, startTime: start, endTime: end,
    status: "active", totalAmount,
  }).returning();
  await db.update(parkingLotsTable).set({ availableSpots: lot.availableSpots - 1 }).where(eq(parkingLotsTable.id, lot.id));
  const receiptNumber = `PRK-${Date.now()}`;
  await db.insert(paymentsTable).values({
    id: randomUUID(), userId: user.id, type: "parking", referenceId: reservation.id,
    amount: totalAmount, paymentMethod: "credit_card", receiptNumber, status: "success", paidAt: new Date(),
  });
  res.status(201).json({ ...reservation, parkingLot: { ...lot, amenities: lot.amenities ?? [] } });
});

router.get("/parking/reservations/:id", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const params = GetParkingReservationParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid ID" }); return; }
  const [reservation] = await db.select().from(parkingReservationsTable).where(eq(parkingReservationsTable.id, params.data.id));
  if (!reservation) { res.status(404).json({ error: "Not found" }); return; }
  const [lot] = await db.select().from(parkingLotsTable).where(eq(parkingLotsTable.id, reservation.parkingLotId));
  res.json({ ...reservation, parkingLot: { ...lot, amenities: lot?.amenities ?? [] } });
});

router.delete("/parking/reservations/:id", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const user = (req as any).user;
  const [reservation] = await db.select().from(parkingReservationsTable).where(eq(parkingReservationsTable.id, rawId));
  if (!reservation) { res.status(404).json({ error: "Not found" }); return; }
  if (reservation.userId !== user.id) { res.status(403).json({ error: "Forbidden" }); return; }
  const [updated] = await db.update(parkingReservationsTable).set({ status: "cancelled" }).where(eq(parkingReservationsTable.id, rawId)).returning();
  const [lot] = await db.select().from(parkingLotsTable).where(eq(parkingLotsTable.id, reservation.parkingLotId));
  if (lot) await db.update(parkingLotsTable).set({ availableSpots: lot.availableSpots + 1 }).where(eq(parkingLotsTable.id, lot.id));
  res.json({ ...updated, parkingLot: { ...lot, amenities: lot?.amenities ?? [] } });
});

export default router;
