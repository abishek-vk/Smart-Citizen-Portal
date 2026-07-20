import { pgTable, text, timestamp, real, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const paymentTypeEnum = pgEnum("payment_type", ["property_tax", "water_tax", "parking", "other"]);
export const paymentStatusEnum = pgEnum("payment_status_enum", ["success", "failed", "pending", "refunded"]);
export const paymentMethodEnum = pgEnum("payment_method", ["credit_card", "debit_card", "net_banking", "upi", "wallet"]);

export const paymentsTable = pgTable("payments", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.id),
  type: paymentTypeEnum("type").notNull(),
  referenceId: text("reference_id").notNull(),
  amount: real("amount").notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  receiptNumber: text("receipt_number").notNull().unique(),
  status: paymentStatusEnum("status").notNull().default("success"),
  paidAt: timestamp("paid_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({ createdAt: true, updatedAt: true });
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof paymentsTable.$inferSelect;
