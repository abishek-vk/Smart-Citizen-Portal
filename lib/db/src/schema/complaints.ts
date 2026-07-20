import { pgTable, text, timestamp, real, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const complaintCategoryEnum = pgEnum("complaint_category", [
  "electricity", "water", "roads", "garbage", "transport",
  "street_lights", "drainage", "public_safety", "environment", "other"
]);
export const complaintPriorityEnum = pgEnum("complaint_priority", ["low", "medium", "high", "critical"]);
export const complaintStatusEnum = pgEnum("complaint_status", ["pending", "in_progress", "resolved", "closed"]);

export const complaintsTable = pgTable("complaints", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: complaintCategoryEnum("category").notNull(),
  priority: complaintPriorityEnum("priority").notNull().default("medium"),
  status: complaintStatusEnum("status").notNull().default("pending"),
  location: text("location").notNull(),
  address: text("address"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  userId: text("user_id").notNull().references(() => usersTable.id),
  departmentId: text("department_id"),
  assignedTo: text("assigned_to"),
  aiCategory: text("ai_category"),
  aiPriority: text("ai_priority"),
  aiConfidence: real("ai_confidence"),
  estimatedResolution: text("estimated_resolution"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const insertComplaintSchema = createInsertSchema(complaintsTable).omit({ createdAt: true, updatedAt: true });
export type InsertComplaint = z.infer<typeof insertComplaintSchema>;
export type Complaint = typeof complaintsTable.$inferSelect;
