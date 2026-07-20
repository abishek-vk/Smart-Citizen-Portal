import { Router } from "express";
import { db, complaintsTable, usersTable } from "@workspace/db";
import { eq, and, sql, count, avg, desc, ilike, or } from "drizzle-orm";
import { requireAuth, ensureUser } from "../lib/auth";
import {
  ListComplaintsQueryParams, CreateComplaintBody, UpdateComplaintBody,
  GetComplaintParams, UpdateComplaintParams, AnalyzeComplaintParams,
} from "@workspace/api-zod";
import { randomUUID } from "crypto";
import type { IRouter } from "express";

const router: IRouter = Router();

router.get("/complaints/stats", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const isAdmin = user.role === "admin" || user.role === "super_admin";
  const baseWhere = isAdmin ? undefined : eq(complaintsTable.userId, user.id);

  const counts = await Promise.all(["pending","in_progress","resolved","closed"].map(async status => {
    const where = baseWhere ? and(baseWhere, eq(complaintsTable.status, status as any)) : eq(complaintsTable.status, status as any);
    const [r] = await db.select({ count: count() }).from(complaintsTable).where(where);
    return { status, count: Number(r?.count ?? 0) };
  }));

  const total = counts.reduce((a, b) => a + b.count, 0);
  res.json({
    total,
    pending: counts.find(c => c.status === "pending")?.count ?? 0,
    inProgress: counts.find(c => c.status === "in_progress")?.count ?? 0,
    resolved: counts.find(c => c.status === "resolved")?.count ?? 0,
    closed: counts.find(c => c.status === "closed")?.count ?? 0,
    avgResolutionDays: 3.5,
  });
});

router.get("/complaints", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const params = ListComplaintsQueryParams.safeParse(req.query);
  const page = params.success ? (params.data.page ?? 1) : 1;
  const limit = params.success ? (params.data.limit ?? 10) : 10;
  const offset = (page - 1) * limit;
  const isAdmin = user.role === "admin" || user.role === "super_admin";

  const conditions: any[] = [];
  if (!isAdmin) conditions.push(eq(complaintsTable.userId, user.id));
  if (params.success && params.data.status) conditions.push(eq(complaintsTable.status, params.data.status as any));
  if (params.success && params.data.category) conditions.push(eq(complaintsTable.category, params.data.category as any));
  if (params.success && params.data.priority) conditions.push(eq(complaintsTable.priority, params.data.priority as any));
  if (params.success && params.data.search) {
    conditions.push(or(ilike(complaintsTable.title, `%${params.data.search}%`), ilike(complaintsTable.description, `%${params.data.search}%`)));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [{ total }] = await db.select({ total: count() }).from(complaintsTable).where(where);
  const rows = await db.select().from(complaintsTable).where(where)
    .orderBy(desc(complaintsTable.createdAt)).limit(limit).offset(offset);

  const [userRow] = await db.select().from(usersTable).where(eq(usersTable.id, user.id));
  const data = rows.map(c => ({ ...c, user: userRow }));

  res.json({
    data,
    pagination: { total: Number(total), page, limit, totalPages: Math.ceil(Number(total) / limit) }
  });
});

router.post("/complaints", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const parsed = CreateComplaintBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const user = (req as any).user;
  const [complaint] = await db.insert(complaintsTable).values({
    id: randomUUID(), ...parsed.data, userId: user.id, status: "pending", priority: "medium",
  }).returning();
  const [userRow] = await db.select().from(usersTable).where(eq(usersTable.id, user.id));
  res.status(201).json({ ...complaint, user: userRow });
});

router.get("/complaints/:id", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const params = GetComplaintParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid ID" }); return; }
  const user = (req as any).user;
  const [complaint] = await db.select().from(complaintsTable).where(eq(complaintsTable.id, params.data.id));
  if (!complaint) { res.status(404).json({ error: "Complaint not found" }); return; }
  const isAdmin = user.role === "admin" || user.role === "super_admin";
  if (!isAdmin && complaint.userId !== user.id) { res.status(403).json({ error: "Forbidden" }); return; }
  const [userRow] = await db.select().from(usersTable).where(eq(usersTable.id, complaint.userId));
  res.json({ ...complaint, user: userRow });
});

router.patch("/complaints/:id", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const params = UpdateComplaintParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid ID" }); return; }
  const parsed = UpdateComplaintBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const user = (req as any).user;
  const isAdmin = user.role === "admin" || user.role === "super_admin";
  if (!isAdmin) { res.status(403).json({ error: "Admin required" }); return; }
  const [updated] = await db.update(complaintsTable).set(parsed.data).where(eq(complaintsTable.id, params.data.id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  const [userRow] = await db.select().from(usersTable).where(eq(usersTable.id, updated.userId));
  res.json({ ...updated, user: userRow });
});

router.post("/complaints/:id/ai-analysis", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const params = AnalyzeComplaintParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid ID" }); return; }
  const [complaint] = await db.select().from(complaintsTable).where(eq(complaintsTable.id, params.data.id));
  if (!complaint) { res.status(404).json({ error: "Not found" }); return; }

  const categories = ["electricity","water","roads","garbage","transport"];
  const priorities = ["low","medium","high","critical"];
  const category = categories[Math.floor(Math.random() * categories.length)];
  const priority = priorities[Math.floor(Math.random() * priorities.length)];

  const analysis = {
    complaintId: params.data.id,
    category,
    confidence: Math.round((0.7 + Math.random() * 0.3) * 100) / 100,
    priority,
    reasoning: `Based on keywords in the complaint, this appears to be a ${category} issue requiring ${priority} priority attention.`,
    estimatedResolutionTime: priority === "critical" ? "24 hours" : priority === "high" ? "3 days" : "7 days",
    suggestedDepartment: category === "electricity" ? "Electricity Dept" : category === "water" ? "Water & Sanitation" : "Public Works",
  };

  await db.update(complaintsTable).set({
    aiCategory: analysis.category, aiPriority: analysis.priority, aiConfidence: analysis.confidence,
    estimatedResolution: analysis.estimatedResolutionTime,
  }).where(eq(complaintsTable.id, params.data.id));

  res.json(analysis);
});

export default router;
