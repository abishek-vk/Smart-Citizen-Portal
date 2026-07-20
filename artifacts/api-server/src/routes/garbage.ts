import { Router } from "express";
import { db, garbageRequestsTable } from "@workspace/db";
import { eq, and, count, desc } from "drizzle-orm";
import { requireAuth, ensureUser } from "../lib/auth";
import {
  ListGarbageRequestsQueryParams, CreateGarbageRequestBody,
  GetGarbageRequestParams, UpdateGarbageRequestParams, UpdateGarbageRequestBody,
} from "@workspace/api-zod";
import { randomUUID } from "crypto";
import type { IRouter } from "express";

const router: IRouter = Router();

router.get("/garbage", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const params = ListGarbageRequestsQueryParams.safeParse(req.query);
  const page = params.success ? (params.data.page ?? 1) : 1;
  const limit = params.success ? (params.data.limit ?? 10) : 10;
  const offset = (page - 1) * limit;
  const isAdmin = user.role === "admin" || user.role === "super_admin";
  const conditions: any[] = [];
  if (!isAdmin) conditions.push(eq(garbageRequestsTable.userId, user.id));
  if (params.success && params.data.status) conditions.push(eq(garbageRequestsTable.status, params.data.status as any));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [{ total }] = await db.select({ total: count() }).from(garbageRequestsTable).where(where);
  const data = await db.select().from(garbageRequestsTable).where(where).orderBy(desc(garbageRequestsTable.createdAt)).limit(limit).offset(offset);
  res.json({ data, pagination: { total: Number(total), page, limit, totalPages: Math.ceil(Number(total) / limit) } });
});

router.post("/garbage", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const parsed = CreateGarbageRequestBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const user = (req as any).user;
  const [req_] = await db.insert(garbageRequestsTable).values({
    id: randomUUID(), userId: user.id, ...parsed.data, status: "scheduled",
  }).returning();
  res.status(201).json(req_);
});

router.get("/garbage/:id", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const params = GetGarbageRequestParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid ID" }); return; }
  const [item] = await db.select().from(garbageRequestsTable).where(eq(garbageRequestsTable.id, params.data.id));
  if (!item) { res.status(404).json({ error: "Not found" }); return; }
  res.json(item);
});

router.patch("/garbage/:id", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const params = UpdateGarbageRequestParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid ID" }); return; }
  const parsed = UpdateGarbageRequestBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [updated] = await db.update(garbageRequestsTable).set(parsed.data).where(eq(garbageRequestsTable.id, params.data.id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

export default router;
