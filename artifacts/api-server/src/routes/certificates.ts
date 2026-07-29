import { Router } from "express";
import { db, certificatesTable } from "@workspace/db";
import { eq, and, count, desc } from "drizzle-orm";
import { requireAuth, ensureUser, requireAdmin } from "../lib/auth";
import {
  ListCertificatesQueryParams, ApplyCertificateBody,
  GetCertificateParams, UpdateCertificateParams, UpdateCertificateBody,
} from "@workspace/api-zod";
import { randomUUID } from "crypto";
import type { IRouter } from "express";

const router: IRouter = Router();

router.get("/certificates", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const params = ListCertificatesQueryParams.safeParse(req.query);
  const page = params.success ? (params.data.page ?? 1) : 1;
  const limit = params.success ? (params.data.limit ?? 10) : 10;
  const offset = (page - 1) * limit;
  const isAdmin = user.role === "admin" || user.role === "super_admin";
  const conditions: any[] = [];
  if (!isAdmin) conditions.push(eq(certificatesTable.userId, user.id));
  if (params.success && params.data.type) conditions.push(eq(certificatesTable.type, params.data.type as any));
  if (params.success && params.data.status) conditions.push(eq(certificatesTable.status, params.data.status as any));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [{ total }] = await db.select({ total: count() }).from(certificatesTable).where(where);
  const data = await db.select().from(certificatesTable).where(where).orderBy(desc(certificatesTable.createdAt)).limit(limit).offset(offset);
  res.json({ data, pagination: { total: Number(total), page, limit, totalPages: Math.ceil(Number(total) / limit) } });
});

router.post("/certificates", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const parsed = ApplyCertificateBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const user = (req as any).user;
  const [cert] = await db.insert(certificatesTable).values({
    id: randomUUID(),
    userId: user.id,
    ...parsed.data,
    subjectDateOfBirth: parsed.data.subjectDateOfBirth ? (parsed.data.subjectDateOfBirth as any).toISOString().split("T")[0] : undefined,
    subjectDateOfDeath: parsed.data.subjectDateOfDeath ? (parsed.data.subjectDateOfDeath as any).toISOString().split("T")[0] : undefined,
    status: "pending",
  }).returning();
  res.status(201).json(cert);
});

router.get("/certificates/:id", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const params = GetCertificateParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid ID" }); return; }
  const user = (req as any).user;
  const [cert] = await db.select().from(certificatesTable).where(eq(certificatesTable.id, params.data.id));
  if (!cert) { res.status(404).json({ error: "Not found" }); return; }
  const isAdmin = user.role === "admin" || user.role === "super_admin";
  if (!isAdmin && cert.userId !== user.id) { res.status(403).json({ error: "Forbidden" }); return; }
  res.json(cert);
});

router.patch("/certificates/:id", requireAuth, ensureUser, requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateCertificateParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid ID" }); return; }
  const parsed = UpdateCertificateBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const updateData: any = { ...parsed.data };
  if (parsed.data.status === "approved") updateData.approvedAt = new Date();
  const [updated] = await db.update(certificatesTable).set(updateData).where(eq(certificatesTable.id, params.data.id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

export default router;
