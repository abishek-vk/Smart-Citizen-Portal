import { pgTable, text, timestamp, real, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const chatRoleEnum = pgEnum("chat_role", ["user", "assistant"]);

export const chatHistoryTable = pgTable("chat_history", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.id),
  role: chatRoleEnum("role").notNull(),
  content: text("content").notNull(),
  sessionId: text("session_id").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const aiAnalysisTable = pgTable("ai_analysis", {
  id: text("id").primaryKey(),
  complaintId: text("complaint_id").notNull(),
  category: text("category").notNull(),
  confidence: real("confidence").notNull(),
  priority: text("priority").notNull(),
  reasoning: text("reasoning").notNull(),
  estimatedResolutionTime: text("estimated_resolution_time").notNull(),
  suggestedDepartment: text("suggested_department").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertChatHistorySchema = createInsertSchema(chatHistoryTable).omit({ createdAt: true });
export const insertAiAnalysisSchema = createInsertSchema(aiAnalysisTable).omit({ createdAt: true });
export type InsertChatHistory = z.infer<typeof insertChatHistorySchema>;
export type ChatHistory = typeof chatHistoryTable.$inferSelect;
export type InsertAiAnalysis = z.infer<typeof insertAiAnalysisSchema>;
export type AiAnalysis = typeof aiAnalysisTable.$inferSelect;
