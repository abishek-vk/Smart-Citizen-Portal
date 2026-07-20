import { pgTable, text, timestamp, date, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const certificateTypeEnum = pgEnum("certificate_type", ["birth", "death"]);
export const certificateStatusEnum = pgEnum("certificate_status", ["pending", "under_review", "approved", "rejected"]);

export const certificatesTable = pgTable("certificates", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.id),
  type: certificateTypeEnum("type").notNull(),
  status: certificateStatusEnum("status").notNull().default("pending"),
  applicantName: text("applicant_name").notNull(),
  applicantRelation: text("applicant_relation").notNull(),
  subjectName: text("subject_name").notNull(),
  subjectDateOfBirth: date("subject_date_of_birth", { mode: "string" }),
  subjectDateOfDeath: date("subject_date_of_death", { mode: "string" }),
  placeOfEvent: text("place_of_event").notNull(),
  remarks: text("remarks"),
  adminRemarks: text("admin_remarks"),
  certificateNumber: text("certificate_number"),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const insertCertificateSchema = createInsertSchema(certificatesTable).omit({ createdAt: true, updatedAt: true });
export type InsertCertificate = z.infer<typeof insertCertificateSchema>;
export type Certificate = typeof certificatesTable.$inferSelect;
