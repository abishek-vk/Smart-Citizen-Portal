import { getAuth, clerkClient } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const auth = getAuth(req);
  const clerkId = auth?.userId;
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  (req as any).clerkId = clerkId;
  next();
};

async function getClerkUserInfo(clerkId: string, auth: any) {
  let email = (auth as any)?.sessionClaims?.email;
  let firstName = (auth as any)?.sessionClaims?.firstName;
  let lastName = (auth as any)?.sessionClaims?.lastName;
  let avatarUrl = (auth as any)?.sessionClaims?.imageUrl || (auth as any)?.sessionClaims?.avatarUrl;

  try {
    const clerkUser = await clerkClient.users.getUser(clerkId);
    if (clerkUser) {
      if (clerkUser.emailAddresses && clerkUser.emailAddresses.length > 0) {
        const primary = clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId);
        email = primary?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress || email;
      }
      if (clerkUser.firstName) firstName = clerkUser.firstName;
      if (clerkUser.lastName) lastName = clerkUser.lastName;
      if (clerkUser.imageUrl) avatarUrl = clerkUser.imageUrl;
    }
  } catch (error) {
    console.error(`[ensureUser] Failed to fetch Clerk user details for ${clerkId}:`, error);
  }

  return {
    email: email || `${clerkId}@unknown.com`,
    firstName: firstName || "User",
    lastName: lastName || "",
    avatarUrl: avatarUrl || null,
  };
}

// Ensure user exists in DB (JIT provisioning)
export const ensureUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const auth = getAuth(req);
  const clerkId = auth?.userId;
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    let [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));
    if (!user) {
      const info = await getClerkUserInfo(clerkId, auth);
      [user] = await db.insert(usersTable).values({
        id: randomUUID(),
        clerkId,
        email: info.email,
        firstName: info.firstName,
        lastName: info.lastName,
        avatarUrl: info.avatarUrl,
        role: "citizen",
      }).returning();
    } else if (user.email.endsWith("@unknown.com") || user.email === clerkId) {
      // Self-repair existing users created with placeholder emails
      const info = await getClerkUserInfo(clerkId, auth);
      if (!info.email.endsWith("@unknown.com")) {
        const [updated] = await db.update(usersTable)
          .set({
            email: info.email,
            firstName: info.firstName !== "User" ? info.firstName : user.firstName,
            lastName: info.lastName || user.lastName,
            avatarUrl: info.avatarUrl || user.avatarUrl,
          })
          .where(eq(usersTable.id, user.id))
          .returning();
        if (updated) {
          user = updated;
        }
      }
    }

    if (!user) {
      res.status(503).json({ error: "Unable to provision user profile" });
      return;
    }

    (req as any).user = user;
    (req as any).clerkId = clerkId;
    next();
  } catch (error) {
    console.error(`[ensureUser] Failed to load user ${clerkId}:`, error);
    res.status(503).json({ error: "Unable to load user profile" });
  }
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const user = (req as any).user;
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    res.status(403).json({ error: "Forbidden: Admin access required" });
    return;
  }
  next();
};

