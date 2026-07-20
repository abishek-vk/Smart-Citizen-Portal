import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, ensureUser } from "../lib/auth";
import { UpdateProfileBody, GetProfileResponse, UpdateProfileResponse } from "@workspace/api-zod";
import type { IRouter } from "express";

const router: IRouter = Router();

router.get("/auth/profile", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const user = (req as any).user;
  res.json(GetProfileResponse.parse(user));
});

router.patch("/auth/profile", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const user = (req as any).user;
  const [updated] = await db.update(usersTable)
    .set(parsed.data)
    .where(eq(usersTable.id, user.id))
    .returning();
  res.json(UpdateProfileResponse.parse(updated));
});

export default router;
