import { pgTable, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const serviceTypeEnum = pgEnum("service_type", [
  "complaint", "tax", "certificate", "garbage", "parking",
  "transport", "parks", "libraries", "general"
]);
export const sentimentEnum = pgEnum("sentiment", ["positive", "neutral", "negative"]);

export const feedbackTable = pgTable("feedback", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.id),
  serviceType: serviceTypeEnum("service_type").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  sentiment: sentimentEnum("sentiment"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const insertFeedbackSchema = createInsertSchema(feedbackTable).omit({ createdAt: true, updatedAt: true });
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Feedback = typeof feedbackTable.$inferSelect;
