import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { db, auditLogsTable } from "@workspace/db";
import { logger } from "../lib/logger";

const writeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function auditLogMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!writeMethods.has(req.method) || !req.path.startsWith("/api/")) {
    next();
    return;
  }

  res.once("finish", () => {
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    if (res.statusCode >= 400 || !userId) return;

    const segments = req.path.slice("/api/".length).split("/").filter(Boolean);
    const entity = segments[0] ?? "unknown";
    const entityId = segments.length > 1 && !["search", "stats", "clear", "mark-all-read"].includes(segments[1])
      ? segments[1]
      : null;

    void db.insert(auditLogsTable).values({
      id: randomUUID(),
      userId,
      action: `${req.method} /${segments.join("/")}`,
      entity,
      entityId,
      ipAddress: req.ip ?? null,
      userAgent: req.get("user-agent") ?? null,
      metadata: JSON.stringify({ statusCode: res.statusCode }),
    }).catch((error: unknown) => {
      logger.error({ err: error, method: req.method, path: req.path }, "Failed to write audit log");
    });
  });

  next();
}
