import { pgTable, text, timestamp, real, date, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const taxStatusEnum = pgEnum("tax_status", ["pending", "paid", "overdue"]);
export const propertyTypeEnum = pgEnum("property_type", ["residential", "commercial", "industrial"]);

export const propertyTaxesTable = pgTable("property_taxes", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.id),
  propertyId: text("property_id").notNull(),
  propertyAddress: text("property_address").notNull(),
  propertyType: propertyTypeEnum("property_type").notNull().default("residential"),
  assessedValue: real("assessed_value").notNull(),
  taxRate: real("tax_rate").notNull(),
  taxAmount: real("tax_amount").notNull(),
  penaltyAmount: real("penalty_amount").notNull().default(0),
  totalDue: real("total_due").notNull(),
  dueDate: date("due_date", { mode: "string" }).notNull(),
  status: taxStatusEnum("status").notNull().default("pending"),
  financialYear: text("financial_year").notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const waterTaxesTable = pgTable("water_taxes", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.id),
  connectionId: text("connection_id").notNull(),
  connectionAddress: text("connection_address").notNull(),
  meterReading: real("meter_reading").notNull(),
  previousReading: real("previous_reading").notNull(),
  unitsConsumed: real("units_consumed").notNull(),
  ratePerUnit: real("rate_per_unit").notNull(),
  taxAmount: real("tax_amount").notNull(),
  penaltyAmount: real("penalty_amount").notNull().default(0),
  totalDue: real("total_due").notNull(),
  billingPeriod: text("billing_period").notNull(),
  dueDate: date("due_date", { mode: "string" }).notNull(),
  status: taxStatusEnum("status").notNull().default("pending"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const insertPropertyTaxSchema = createInsertSchema(propertyTaxesTable).omit({ createdAt: true, updatedAt: true });
export const insertWaterTaxSchema = createInsertSchema(waterTaxesTable).omit({ createdAt: true, updatedAt: true });
export type InsertPropertyTax = z.infer<typeof insertPropertyTaxSchema>;
export type PropertyTax = typeof propertyTaxesTable.$inferSelect;
export type InsertWaterTax = z.infer<typeof insertWaterTaxSchema>;
export type WaterTax = typeof waterTaxesTable.$inferSelect;
