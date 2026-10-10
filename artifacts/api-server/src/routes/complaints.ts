import { Router } from "express";
import { db, complaintsTable, usersTable } from "@workspace/db";
import { eq, and, sql, count, avg, desc, ilike, or, inArray, isNotNull } from "drizzle-orm";
import { requireAuth, ensureUser, requireAdmin } from "../lib/auth";
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
  const resolvedWhere = and(
    eq(complaintsTable.status, "resolved"),
    isNotNull(complaintsTable.resolvedAt),
    ...(baseWhere ? [baseWhere] : []),
  );
  const resolvedRows = await db.select({
    createdAt: complaintsTable.createdAt,
    resolvedAt: complaintsTable.resolvedAt,
  }).from(complaintsTable).where(resolvedWhere);
  const avgResolutionDays = resolvedRows.length
    ? resolvedRows.reduce((sum, c) => sum + (c.resolvedAt!.getTime() - c.createdAt.getTime()) / 86_400_000, 0) / resolvedRows.length
    : 0;
  res.json({
    total,
    pending: counts.find(c => c.status === "pending")?.count ?? 0,
    inProgress: counts.find(c => c.status === "in_progress")?.count ?? 0,
    resolved: counts.find(c => c.status === "resolved")?.count ?? 0,
    closed: counts.find(c => c.status === "closed")?.count ?? 0,
    avgResolutionDays: Math.round(avgResolutionDays * 10) / 10,
  });
});

router.get("/complaints", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const params = ListComplaintsQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const { page = 1, limit = 10 } = params.data;
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    res.status(400).json({ error: "Page must be positive and limit must be between 1 and 100" });
    return;
  }
  const offset = (page - 1) * limit;
  const isAdmin = user.role === "admin" || user.role === "super_admin";

  const conditions: any[] = [];
  if (!isAdmin) conditions.push(eq(complaintsTable.userId, user.id));
  if (params.data.status) conditions.push(eq(complaintsTable.status, params.data.status as any));
  if (params.data.category) conditions.push(eq(complaintsTable.category, params.data.category as any));
  if (params.data.priority) conditions.push(eq(complaintsTable.priority, params.data.priority as any));
  if (params.data.search) {
    const search = `%${params.data.search}%`;
    conditions.push(or(
      ilike(complaintsTable.title, search),
      ilike(complaintsTable.description, search),
      ilike(complaintsTable.location, search),
      ilike(complaintsTable.address, search),
    ));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [{ total }] = await db.select({ total: count() }).from(complaintsTable).where(where);
  const rows = await db.select().from(complaintsTable).where(where)
    .orderBy(desc(complaintsTable.createdAt)).limit(limit).offset(offset);

  const ownerIds = [...new Set(rows.map(c => c.userId))];
  const owners = ownerIds.length > 0
    ? await db.select().from(usersTable).where(inArray(usersTable.id, ownerIds))
    : [];
  const ownersById = new Map(owners.map(u => [u.id, u]));
  const data = rows.map(c => ({ ...c, user: ownersById.get(c.userId) }));

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
  const updateData = {
    ...parsed.data,
    ...(parsed.data.status === "resolved" ? { resolvedAt: new Date() } :
      parsed.data.status ? { resolvedAt: null } : {}),
  };
  const [updated] = await db.update(complaintsTable).set(updateData).where(eq(complaintsTable.id, params.data.id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  const [userRow] = await db.select().from(usersTable).where(eq(usersTable.id, updated.userId));
  res.json({ ...updated, user: userRow });
});

router.post("/complaints/:id/ai-analysis", requireAuth, ensureUser, requireAdmin, async (req, res): Promise<void> => {
  const params = AnalyzeComplaintParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid ID" }); return; }
  const [complaint] = await db.select().from(complaintsTable).where(eq(complaintsTable.id, params.data.id));
  if (!complaint) { res.status(404).json({ error: "Not found" }); return; }

  const text = `${complaint.title} ${complaint.description} ${complaint.location}`.toLowerCase();
  const categoryRules = [
    { category: "electricity", department: "Electricity Department", keywords: ["electric", "power", "outage", "voltage", "wire"] },
    { category: "water", department: "Water & Sanitation", keywords: ["water", "pipe", "leak", "sewage", "drinking"] },
    { category: "roads", department: "Public Works", keywords: ["road", "pothole", "pavement", "sidewalk", "bridge"] },
    { category: "garbage", department: "Sanitation", keywords: ["garbage", "waste", "trash", "dump", "rubbish"] },
    { category: "transport", department: "Transport Department", keywords: ["bus", "transport", "traffic", "transit", "signal"] },
    { category: "street_lights", department: "Electricity Department", keywords: ["streetlight", "street light", "lamp", "dark street"] },
    { category: "drainage", department: "Water & Sanitation", keywords: ["drain", "flood", "stormwater", "blocked sewer"] },
    { category: "public_safety", department: "Public Safety", keywords: ["safety", "crime", "hazard", "unsafe", "emergency"] },
    { category: "environment", department: "Environment Department", keywords: ["pollution", "smoke", "noise", "tree", "environment"] },
  ];
  const scoredCategories = categoryRules.map(rule => ({
    ...rule,
    matches: rule.keywords.filter(keyword => text.includes(keyword)).length,
  }));
  const bestMatch = scoredCategories.reduce((best, candidate) =>
    candidate.matches > best.matches ? candidate : best);
  const matched = bestMatch.matches > 0;
  const category = matched ? bestMatch.category : complaint.category;
  const suggestedDepartment = matched
    ? bestMatch.department
    : "Review the existing complaint category";
  const priority = /\b(emergency|life.?threatening|dangerous|urgent|injury|fire)\b/.test(text)
    ? "critical"
    : /\b(severe|major|blocked|overflow|outage|unsafe)\b/.test(text)
      ? "high"
      : complaint.priority;
  const confidence = matched ? Math.min(0.95, 0.55 + bestMatch.matches * 0.1) : 0.5;

  const analysis = {
    complaintId: params.data.id,
    category,
    confidence,
    priority,
    reasoning: matched
      ? `Matched ${bestMatch.matches} category keyword(s) in the complaint text.`
      : `No category keywords matched; retained the citizen-selected ${category} category.`,
    estimatedResolutionTime: priority === "critical" ? "24 hours" : priority === "high" ? "3 days" : "7 days",
    suggestedDepartment,
  };

  await db.update(complaintsTable).set({
    aiCategory: analysis.category, aiPriority: analysis.priority, aiConfidence: analysis.confidence,
    estimatedResolution: analysis.estimatedResolutionTime,
  }).where(eq(complaintsTable.id, params.data.id));

  res.json(analysis);
});

export default router;
