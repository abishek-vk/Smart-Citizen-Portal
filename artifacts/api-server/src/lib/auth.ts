import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const isDev = process.env.NODE_ENV !== 'production';

export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const auth = getAuth(req);
  const clerkId = auth?.userId;
  
  // In development, skip auth
  if (isDev) {
    (req as any).clerkId = clerkId || `dev-user-${Date.now()}`;
    return next();
  }
  
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  (req as any).clerkId = clerkId;
  next();
};

// Ensure user exists in DB (JIT provisioning)
export const ensureUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const auth = getAuth(req);
  const clerkId = auth?.userId;
  
  // In development, create a mock user
  if (isDev) {
    (req as any).user = {
      id: 'dev-user-id',
      clerkId: clerkId || 'dev-user',
      email: 'dev@smartcity.local',
      firstName: 'Dev',
      lastName: 'User',
      role: 'citizen',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    (req as any).clerkId = clerkId || 'dev-user';
    return next();
  }
  
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  let [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));
  if (!user) {
    const email = (auth as any)?.sessionClaims?.email || `${clerkId}@unknown.com`;
    const firstName = (auth as any)?.sessionClaims?.firstName || "User";
    const lastName = (auth as any)?.sessionClaims?.lastName || "";
    [user] = await db.insert(usersTable).values({
      id: randomUUID(),
      clerkId,
      email,
      firstName,
      lastName,
      role: "citizen",
    }).returning();
  }

  (req as any).user = user;
  (req as any).clerkId = clerkId;
  next();
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const user = (req as any).user;
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    res.status(403).json({ error: "Forbidden: Admin access required" });
    return;
  }
  next();
};
