import { Router } from "express";
import { db, transportRoutesTable, transportStopsTable, transportAlertsTable, parksTable, librariesTable, booksTable, borrowingsTable, paymentsTable, notificationsTable, feedbackTable, auditLogsTable, usersTable, departmentsTable } from "@workspace/db";
import { eq, and, count, desc, ilike, or, sum } from "drizzle-orm";
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
  if (params.success && params.data.available) conditions.push(eq(booksTable.availableCopies, 1));
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
  const [borrowing] = await db.select().from(borrowingsTable).where(eq(borrowingsTable.id, rawId));
  if (!borrowing) { res.status(404).json({ error: "Not found" }); return; }
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
  const [payment] = await db.select().from(paymentsTable).where(eq(paymentsTable.id, rawId));
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
  const [updated] = await db.update(notificationsTable).set({ isRead: true }).where(eq(notificationsTable.id, rawId)).returning();
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
  const page = params.success ? (params.data.page ?? 1) : 1;
  const limit = params.success ? (params.data.limit ?? 20) : 20;
  const offset = (page - 1) * limit;
  const conditions: any[] = [eq(usersTable.role, "citizen")];
  if (params.success && params.data.search) conditions.push(or(ilike(usersTable.email, `%${params.data.search}%`), ilike(usersTable.firstName, `%${params.data.search}%`)));
  const where = and(...conditions);
  const [{ total }] = await db.select({ total: count() }).from(usersTable).where(where);
  const data = await db.select().from(usersTable).where(where).limit(limit).offset(offset);
  res.json({ data, pagination: { total: Number(total), page, limit, totalPages: Math.ceil(Number(total) / limit) } });
});
router.get("/admin/audit-logs", requireAuth, ensureUser, requireAdmin, async (req, res): Promise<void> => {
  const params = ListAuditLogsQueryParams.safeParse(req.query);
  const page = params.success ? (params.data.page ?? 1) : 1;
  const limit = params.success ? (params.data.limit ?? 20) : 20;
  const offset = (page - 1) * limit;
  const [{ total }] = await db.select({ total: count() }).from(auditLogsTable);
  const data = await db.select().from(auditLogsTable).orderBy(desc(auditLogsTable.createdAt)).limit(limit).offset(offset);
  res.json({ data, pagination: { total: Number(total), page, limit, totalPages: Math.ceil(Number(total) / limit) } });
});
router.get("/admin/reports/revenue", requireAuth, ensureUser, requireAdmin, async (req, res): Promise<void> => {
  const [{ total }] = await db.select({ total: sum(paymentsTable.amount) }).from(paymentsTable).where(eq(paymentsTable.status, "success"));
  const [ptax] = await db.select({ total: sum(paymentsTable.amount) }).from(paymentsTable).where(and(eq(paymentsTable.type, "property_tax"), eq(paymentsTable.status, "success")));
  const [wtax] = await db.select({ total: sum(paymentsTable.amount) }).from(paymentsTable).where(and(eq(paymentsTable.type, "water_tax"), eq(paymentsTable.status, "success")));
  const [parking] = await db.select({ total: sum(paymentsTable.amount) }).from(paymentsTable).where(and(eq(paymentsTable.type, "parking"), eq(paymentsTable.status, "success")));
  const revenueByPeriod = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i));
    return { date: d.toISOString().split("T")[0], value: Math.floor(Math.random() * 50000) + 10000 };
  });
  res.json({
    totalRevenue: Number(total ?? 0), propertyTaxRevenue: Number(ptax?.total ?? 0),
    waterTaxRevenue: Number(wtax?.total ?? 0), parkingRevenue: Number(parking?.total ?? 0),
    revenueByPeriod, collectionRate: 78.5,
  });
});
router.get("/admin/reports/services", requireAuth, ensureUser, requireAdmin, async (req, res): Promise<void> => {
  const [total] = await db.select({ count: count() }).from(require("@workspace/db").complaintsTable);
  const [resolved] = await db.select({ count: count() }).from(require("@workspace/db").complaintsTable).where(eq(require("@workspace/db").complaintsTable.status, "resolved"));
  const [pending] = await db.select({ count: count() }).from(require("@workspace/db").complaintsTable).where(eq(require("@workspace/db").complaintsTable.status, "pending"));
  const [inProgress] = await db.select({ count: count() }).from(require("@workspace/db").complaintsTable).where(eq(require("@workspace/db").complaintsTable.status, "in_progress"));
  const [closed] = await db.select({ count: count() }).from(require("@workspace/db").complaintsTable).where(eq(require("@workspace/db").complaintsTable.status, "closed"));
  res.json({
    complaints: { total: Number(total.count), resolved: Number(resolved.count), pending: Number(pending.count), inProgress: Number(inProgress.count), closed: Number(closed.count), avgResolutionDays: 3.5 },
    certificates: { total: 45, approved: 30, pending: 10, rejected: 5 },
    garbage: { total: 120, completed: 95, scheduled: 25 },
    parking: { totalReservations: 200, activeNow: 45, revenue: 15000 },
  });
});

export default router;
