import { pgTable, text, timestamp, date, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const wasteTypeEnum = pgEnum("waste_type", ["household", "recyclable", "hazardous", "electronic", "bulk"]);
export const garbageStatusEnum = pgEnum("garbage_status", ["scheduled", "in_progress", "completed", "cancelled"]);

export const garbageRequestsTable = pgTable("garbage_requests", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.id),
  address: text("address").notNull(),
  wasteType: wasteTypeEnum("waste_type").notNull(),
  scheduledDate: date("scheduled_date", { mode: "string" }).notNull(),
  timeSlot: text("time_slot").notNull(),
  status: garbageStatusEnum("status").notNull().default("scheduled"),
  notes: text("notes"),
  driverName: text("driver_name"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const insertGarbageRequestSchema = createInsertSchema(garbageRequestsTable).omit({ createdAt: true, updatedAt: true });
export type InsertGarbageRequest = z.infer<typeof insertGarbageRequestSchema>;
export type GarbageRequest = typeof garbageRequestsTable.$inferSelect;
