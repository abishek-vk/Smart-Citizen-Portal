import { Router } from "express";
import { db, transportRoutesTable, transportStopsTable, transportAlertsTable, parksTable, librariesTable, booksTable, borrowingsTable, paymentsTable, notificationsTable, feedbackTable, auditLogsTable, usersTable, departmentsTable, complaintsTable, certificatesTable, garbageRequestsTable, parkingReservationsTable } from "@workspace/db";
import { eq, and, count, desc, ilike, or, sum, gt, gte, inArray, isNull, ne, sql, lte } from "drizzle-orm";
import { requireAuth, ensureUser, requireAdmin } from "../lib/auth";
import {
  ListBooksQueryParams, BorrowBookBody,
  ListPaymentsQueryParams, ListNotificationsQueryParams,
  SubmitFeedbackBody, ListFeedbackQueryParams,
  ListCitizensQueryParams, ListAuditLogsQueryParams, GetRevenueReportQueryParams,
} from "@workspace/api-zod";
import { randomUUID } from "crypto";
import type { IRouter } from "express";

const router: IRouter = Router();

// ─── TRANSPORT ───
router.get("/transport/routes", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const rows = await db.select().from(transportRoutesTable).where(eq(transportRoutesTable.isActive, true));
  res.json(rows);
});
router.get("/transport/routes/:id", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [route] = await db.select().from(transportRoutesTable).where(eq(transportRoutesTable.id, rawId));
  if (!route) { res.status(404).json({ error: "Not found" }); return; }
  const stops = await db.select().from(transportStopsTable).where(eq(transportStopsTable.routeId, rawId)).orderBy(transportStopsTable.sequence);
  res.json({ route, stops });
});
router.get("/transport/alerts", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const alerts = await db.select().from(transportAlertsTable).orderBy(desc(transportAlertsTable.createdAt)).limit(20);
  res.json(alerts);
});

// ─── PARKS ───
router.get("/parks", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const rows = await db.select().from(parksTable).where(eq(parksTable.isActive, true));
  res.json(rows.map(p => ({ ...p, amenities: p.amenities ?? [] })));
});
router.get("/parks/:id", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [park] = await db.select().from(parksTable).where(eq(parksTable.id, rawId));
  if (!park) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...park, amenities: park.amenities ?? [] });
});

// ─── LIBRARIES & BOOKS ───
router.get("/libraries", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const rows = await db.select().from(librariesTable).where(eq(librariesTable.isActive, true));
  res.json(rows);
});
router.get("/libraries/books", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const params = ListBooksQueryParams.safeParse(req.query);
  const page = params.success ? (params.data.page ?? 1) : 1;
  const limit = params.success ? (params.data.limit ?? 20) : 20;
  const offset = (page - 1) * limit;
  const conditions: any[] = [];
  if (params.success && params.data.libraryId) conditions.push(eq(booksTable.libraryId, params.data.libraryId));
  if (params.success && params.data.search) conditions.push(or(ilike(booksTable.title, `%${params.data.search}%`), ilike(booksTable.author, `%${params.data.search}%`)));
  if (params.success && params.data.available) conditions.push(gt(booksTable.availableCopies, 0));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [{ total }] = await db.select({ total: count() }).from(booksTable).where(where);
  const data = await db.select().from(booksTable).where(where).limit(limit).offset(offset);
  res.json({ data: data.map(b => ({ ...b, isAvailable: b.availableCopies > 0 })), pagination: { total: Number(total), page, limit, totalPages: Math.ceil(Number(total) / limit) } });
});
router.get("/libraries/borrowings", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const rows = await db.select().from(borrowingsTable).where(eq(borrowingsTable.userId, user.id)).orderBy(desc(borrowingsTable.borrowedAt));
  const data = await Promise.all(rows.map(async b => {
    const [book] = await db.select().from(booksTable).where(eq(booksTable.id, b.bookId));
    return { ...b, book: { ...book, isAvailable: (book?.availableCopies ?? 0) > 0 }, fineDue: b.fineDue ?? 0 };
  }));
  res.json(data);
});
router.post("/libraries/borrowings", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const parsed = BorrowBookBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const user = (req as any).user;
  const [book] = await db.select().from(booksTable).where(eq(booksTable.id, parsed.data.bookId));
  if (!book) { res.status(404).json({ error: "Book not found" }); return; }
  if (book.availableCopies <= 0) { res.status(400).json({ error: "No copies available" }); return; }
  const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + 14);
  const [borrowing] = await db.insert(borrowingsTable).values({
    id: randomUUID(), userId: user.id, bookId: book.id,
    dueDate: dueDate.toISOString().split("T")[0], status: "active", fineDue: 0,
  }).returning();
  await db.update(booksTable).set({ availableCopies: book.availableCopies - 1 }).where(eq(booksTable.id, book.id));
  res.status(201).json({ ...borrowing, book: { ...book, isAvailable: (book.availableCopies - 1) > 0 }, fineDue: 0 });
});
router.post("/libraries/borrowings/:id/return", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const user = (req as any).user;
  const [borrowing] = await db.select().from(borrowingsTable).where(and(eq(borrowingsTable.id, rawId), eq(borrowingsTable.userId, user.id)));
  if (!borrowing) { res.status(404).json({ error: "Not found" }); return; }
  if (borrowing.status === "returned") { res.status(400).json({ error: "Book already returned" }); return; }
  const [updated] = await db.update(borrowingsTable).set({ status: "returned", returnedAt: new Date() }).where(eq(borrowingsTable.id, rawId)).returning();
  const [book] = await db.select().from(booksTable).where(eq(booksTable.id, borrowing.bookId));
  if (book) await db.update(booksTable).set({ availableCopies: book.availableCopies + 1 }).where(eq(booksTable.id, book.id));
  const [bookRow] = await db.select().from(booksTable).where(eq(booksTable.id, borrowing.bookId));
  res.json({ ...updated, book: { ...bookRow, isAvailable: true }, fineDue: 0 });
});

// ─── PAYMENTS ───
router.get("/payments", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const params = ListPaymentsQueryParams.safeParse(req.query);
  const page = params.success ? (params.data.page ?? 1) : 1;
  const limit = params.success ? (params.data.limit ?? 10) : 10;
  const offset = (page - 1) * limit;
  const conditions: any[] = [eq(paymentsTable.userId, user.id)];
  if (params.success && params.data.type) conditions.push(eq(paymentsTable.type, params.data.type as any));
  const where = and(...conditions);
  const [{ total }] = await db.select({ total: count() }).from(paymentsTable).where(where);
  const data = await db.select().from(paymentsTable).where(where).orderBy(desc(paymentsTable.paidAt)).limit(limit).offset(offset);
  res.json({ data, pagination: { total: Number(total), page, limit, totalPages: Math.ceil(Number(total) / limit) } });
});
router.get("/payments/:id", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const user = (req as any).user;
  const [payment] = await db.select().from(paymentsTable).where(and(eq(paymentsTable.id, rawId), eq(paymentsTable.userId, user.id)));
  if (!payment) { res.status(404).json({ error: "Not found" }); return; }
  res.json(payment);
});

// ─── NOTIFICATIONS ───
router.get("/notifications/unread-count", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const [{ count: c }] = await db.select({ count: count() }).from(notificationsTable).where(and(eq(notificationsTable.userId, user.id), eq(notificationsTable.isRead, false)));
  res.json({ count: Number(c) });
});
router.get("/notifications", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const params = ListNotificationsQueryParams.safeParse(req.query);
  const page = params.success ? (params.data.page ?? 1) : 1;
  const limit = params.success ? (params.data.limit ?? 20) : 20;
  const offset = (page - 1) * limit;
  const conditions: any[] = [eq(notificationsTable.userId, user.id)];
  if (params.success && params.data.unread) conditions.push(eq(notificationsTable.isRead, false));
  const where = and(...conditions);
  const [{ total }] = await db.select({ total: count() }).from(notificationsTable).where(where);
  const data = await db.select().from(notificationsTable).where(where).orderBy(desc(notificationsTable.createdAt)).limit(limit).offset(offset);
  res.json({ data, pagination: { total: Number(total), page, limit, totalPages: Math.ceil(Number(total) / limit) } });
});
router.post("/notifications/mark-all-read", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const user = (req as any).user;
  await db.update(notificationsTable).set({ isRead: true }).where(eq(notificationsTable.userId, user.id));
  res.json({ message: "All notifications marked as read" });
});
router.patch("/notifications/:id/read", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const user = (req as any).user;
  const [updated] = await db.update(notificationsTable).set({ isRead: true }).where(and(eq(notificationsTable.id, rawId), eq(notificationsTable.userId, user.id))).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

// ─── FEEDBACK ───
router.get("/feedback/stats", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const [{ total }] = await db.select({ total: count() }).from(feedbackTable);
  const [{ avg }] = await db.select({ avg: sum(feedbackTable.rating) }).from(feedbackTable);
  const distribution = await Promise.all([1,2,3,4,5].map(async r => {
    const [{ c }] = await db.select({ c: count() }).from(feedbackTable).where(eq(feedbackTable.rating, r));
    return { rating: r, count: Number(c) };
  }));
  const totalN = Number(total); const avgN = totalN > 0 ? Number(avg) / totalN : 0;
  const positive = distribution.filter(d => d.rating >= 4).reduce((a, b) => a + b.count, 0);
  const neutral = distribution.filter(d => d.rating === 3).reduce((a, b) => a + b.count, 0);
  const negative = distribution.filter(d => d.rating <= 2).reduce((a, b) => a + b.count, 0);
  res.json({ averageRating: Math.round(avgN * 10) / 10, totalFeedback: totalN, positive, neutral, negative, ratingDistribution: distribution });
});
router.get("/feedback", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const params = ListFeedbackQueryParams.safeParse(req.query);
  const page = params.success ? (params.data.page ?? 1) : 1;
  const limit = params.success ? (params.data.limit ?? 10) : 10;
  const offset = (page - 1) * limit;
  const [{ total }] = await db.select({ total: count() }).from(feedbackTable);
  const data = await db.select().from(feedbackTable).orderBy(desc(feedbackTable.createdAt)).limit(limit).offset(offset);
  res.json({ data, pagination: { total: Number(total), page, limit, totalPages: Math.ceil(Number(total) / limit) } });
});
router.post("/feedback", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const parsed = SubmitFeedbackBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const user = (req as any).user;
  const sentiment = parsed.data.rating >= 4 ? "positive" : parsed.data.rating === 3 ? "neutral" : "negative";
  const [fb] = await db.insert(feedbackTable).values({ id: randomUUID(), userId: user.id, ...parsed.data, sentiment: sentiment as any }).returning();
  res.status(201).json(fb);
});

// ─── DEPARTMENTS ───
router.get("/departments", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const rows = await db.select().from(departmentsTable).where(eq(departmentsTable.isActive, true));
  res.json(rows);
});

// ─── ADMIN ───
router.get("/admin/citizens", requireAuth, ensureUser, requireAdmin, async (req, res): Promise<void> => {
  const params = ListCitizensQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const { page = 1, limit = 20 } = params.data;
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    res.status(400).json({ error: "Page must be positive and limit must be between 1 and 100" });
    return;
  }
  const offset = (page - 1) * limit;
  const conditions = [eq(usersTable.role, "citizen"), isNull(usersTable.deletedAt)];
  if (params.data.search) {
    const search = `%${params.data.search}%`;
    conditions.push(or(
      ilike(usersTable.email, search),
      ilike(usersTable.firstName, search),
      ilike(usersTable.lastName, search),
    )!);
  }
  const where = and(...conditions);
  const [{ total }] = await db.select({ total: count() }).from(usersTable).where(where);
  const data = await db.select().from(usersTable).where(where)
    .orderBy(desc(usersTable.createdAt)).limit(limit).offset(offset);
  res.json({ data, pagination: { total: Number(total), page, limit, totalPages: Math.ceil(Number(total) / limit) } });
});
router.get("/admin/audit-logs", requireAuth, ensureUser, requireAdmin, async (req, res): Promise<void> => {
  const params = ListAuditLogsQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const { page = 1, limit = 20, action, userId } = params.data;
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    res.status(400).json({ error: "Page must be positive and limit must be between 1 and 100" });
    return;
  }
  const offset = (page - 1) * limit;
  const conditions: any[] = [];
  if (action) conditions.push(ilike(auditLogsTable.action, `%${action}%`));
  if (userId) conditions.push(ilike(auditLogsTable.userId, `%${userId}%`));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [{ total }] = await db.select({ total: count() }).from(auditLogsTable).where(where);
  const data = await db.select().from(auditLogsTable).where(where)
    .orderBy(desc(auditLogsTable.createdAt)).limit(limit).offset(offset);
  res.json({ data, pagination: { total: Number(total), page, limit, totalPages: Math.ceil(Number(total) / limit) } });
});
router.get("/admin/reports/revenue", requireAuth, ensureUser, requireAdmin, async (req, res): Promise<void> => {
  const params = GetRevenueReportQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const period = params.data.period ?? "30d";
  const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365;
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  if (period === "1y") {
    start.setUTCDate(1);
    start.setUTCMonth(start.getUTCMonth() - 11);
  } else {
    start.setUTCDate(start.getUTCDate() - (days - 1));
  }
  const successful = and(eq(paymentsTable.status, "success"), gte(paymentsTable.paidAt, start));
  const [{ total }] = await db.select({ total: sum(paymentsTable.amount) })
    .from(paymentsTable).where(successful);
  const [ptax] = await db.select({ total: sum(paymentsTable.amount) }).from(paymentsTable)
    .where(and(successful, eq(paymentsTable.type, "property_tax")));
  const [wtax] = await db.select({ total: sum(paymentsTable.amount) }).from(paymentsTable)
    .where(and(successful, eq(paymentsTable.type, "water_tax")));
  const [parking] = await db.select({ total: sum(paymentsTable.amount) }).from(paymentsTable)
    .where(and(successful, eq(paymentsTable.type, "parking")));
  const [collectedTax] = await db.select({ total: sum(paymentsTable.amount) }).from(paymentsTable)
    .where(and(successful, inArray(paymentsTable.type, ["property_tax", "water_tax"])));
  const [eligibleTax] = await db.select({ total: sum(paymentsTable.amount) }).from(paymentsTable)
    .where(and(gte(paymentsTable.paidAt, start), inArray(paymentsTable.type, ["property_tax", "water_tax"]), ne(paymentsTable.status, "refunded")));
  const periodBucket = period === "1y"
    ? sql<string>`to_char(${paymentsTable.paidAt}, 'YYYY-MM')`
    : sql<string>`to_char(${paymentsTable.paidAt}, 'YYYY-MM-DD')`;
  const revenueByPeriod = await db.select({
    date: periodBucket,
    value: sum(paymentsTable.amount),
  }).from(paymentsTable).where(successful).groupBy(periodBucket).orderBy(periodBucket);
  const revenueByBucket = new Map(revenueByPeriod.map(row => [row.date, Number(row.value ?? 0)]));
  const bucketCount = period === "1y" ? 12 : days;
  const completeRevenueByPeriod = Array.from({ length: bucketCount }, (_, index) => {
    const date = new Date(start);
    if (period === "1y") {
      date.setUTCMonth(date.getUTCMonth() + index);
      const month = date.toISOString().slice(0, 7);
      return { date: `${month}-01`, value: revenueByBucket.get(month) ?? 0 };
    }
    date.setUTCDate(date.getUTCDate() + index);
    const day = date.toISOString().slice(0, 10);
    return { date: day, value: revenueByBucket.get(day) ?? 0 };
  });
  const eligibleTaxAmount = Number(eligibleTax?.total ?? 0);
  res.json({
    totalRevenue: Number(total ?? 0), propertyTaxRevenue: Number(ptax?.total ?? 0),
    waterTaxRevenue: Number(wtax?.total ?? 0), parkingRevenue: Number(parking?.total ?? 0),
    revenueByPeriod: completeRevenueByPeriod,
    collectionRate: eligibleTaxAmount
      ? Math.round(Number(collectedTax?.total ?? 0) / eligibleTaxAmount * 1000) / 10
      : 0,
  });
});
router.get("/admin/reports/services", requireAuth, ensureUser, requireAdmin, async (req, res): Promise<void> => {
  const [total] = await db.select({ count: count() }).from(complaintsTable);
  const [resolved] = await db.select({ count: count() }).from(complaintsTable).where(eq(complaintsTable.status, "resolved"));
  const [pending] = await db.select({ count: count() }).from(complaintsTable).where(eq(complaintsTable.status, "pending"));
  const [inProgress] = await db.select({ count: count() }).from(complaintsTable).where(eq(complaintsTable.status, "in_progress"));
  const [closed] = await db.select({ count: count() }).from(complaintsTable).where(eq(complaintsTable.status, "closed"));
  const resolvedRows = await db.select({
    createdAt: complaintsTable.createdAt,
    resolvedAt: complaintsTable.resolvedAt,
  }).from(complaintsTable)
    .where(and(eq(complaintsTable.status, "resolved"), sql`${complaintsTable.resolvedAt} IS NOT NULL`));
  const averageResolution = resolvedRows.length
    ? resolvedRows.reduce((totalDays, complaint) =>
      totalDays + ((complaint.resolvedAt!.getTime() - complaint.createdAt.getTime()) / 86_400_000), 0) / resolvedRows.length
    : 0;
  const certificateCounts = await Promise.all(["approved", "pending", "rejected"].map(async status => {
    const [result] = await db.select({ count: count() }).from(certificatesTable)
      .where(eq(certificatesTable.status, status as "approved" | "pending" | "rejected"));
    return [status, Number(result?.count ?? 0)] as const;
  }));
  const certificateStatusCounts = Object.fromEntries(certificateCounts);
  const [certificateTotal] = await db.select({ count: count() }).from(certificatesTable);
  const [garbageTotal] = await db.select({ count: count() }).from(garbageRequestsTable);
  const [garbageCompleted] = await db.select({ count: count() }).from(garbageRequestsTable)
    .where(eq(garbageRequestsTable.status, "completed"));
  const [garbageScheduled] = await db.select({ count: count() }).from(garbageRequestsTable)
    .where(eq(garbageRequestsTable.status, "scheduled"));
  const [reservationTotal] = await db.select({ count: count() }).from(parkingReservationsTable);
  const [activeReservations] = await db.select({ count: count() }).from(parkingReservationsTable)
    .where(and(eq(parkingReservationsTable.status, "active"), lte(parkingReservationsTable.startTime, new Date()), gte(parkingReservationsTable.endTime, new Date())));
  const [parkingRevenue] = await db.select({ total: sum(paymentsTable.amount) }).from(paymentsTable)
    .where(and(eq(paymentsTable.status, "success"), eq(paymentsTable.type, "parking")));
  res.json({
    complaints: {
      total: Number(total?.count ?? 0), resolved: Number(resolved?.count ?? 0),
      pending: Number(pending?.count ?? 0), inProgress: Number(inProgress?.count ?? 0),
      closed: Number(closed?.count ?? 0),
      avgResolutionDays: Math.round(averageResolution * 10) / 10,
    },
    certificates: {
      total: Number(certificateTotal?.count ?? 0),
      approved: certificateStatusCounts.approved ?? 0,
      pending: certificateStatusCounts.pending ?? 0,
      rejected: certificateStatusCounts.rejected ?? 0,
    },
    garbage: {
      total: Number(garbageTotal?.count ?? 0),
      completed: Number(garbageCompleted?.count ?? 0),
      scheduled: Number(garbageScheduled?.count ?? 0),
    },
    parking: {
      totalReservations: Number(reservationTotal?.count ?? 0),
      activeNow: Number(activeReservations?.count ?? 0),
      revenue: Number(parkingRevenue?.total ?? 0),
    },
  });
});

export default router;
