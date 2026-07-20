import { pgTable, text, timestamp, real, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const transportTypeEnum = pgEnum("transport_type", ["bus", "metro", "tram"]);
export const alertSeverityEnum = pgEnum("alert_severity", ["info", "warning", "critical"]);

export const transportRoutesTable = pgTable("transport_routes", {
  id: text("id").primaryKey(),
  routeNumber: text("route_number").notNull(),
  name: text("name").notNull(),
  type: transportTypeEnum("type").notNull(),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  frequency: integer("frequency").notNull(), // minutes between buses
  operatingHours: text("operating_hours").notNull(),
  fare: real("fare").notNull(),
  totalStops: integer("total_stops").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const transportStopsTable = pgTable("transport_stops", {
  id: text("id").primaryKey(),
  routeId: text("route_id").notNull().references(() => transportRoutesTable.id),
  name: text("name").notNull(),
  sequence: integer("sequence").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  arrivalTime: text("arrival_time").notNull(),
});

export const transportAlertsTable = pgTable("transport_alerts", {
  id: text("id").primaryKey(),
  routeId: text("route_id").references(() => transportRoutesTable.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  severity: alertSeverityEnum("severity").notNull().default("info"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTransportRouteSchema = createInsertSchema(transportRoutesTable).omit({ createdAt: true, updatedAt: true });
export type InsertTransportRoute = z.infer<typeof insertTransportRouteSchema>;
export type TransportRoute = typeof transportRoutesTable.$inferSelect;
export type TransportStop = typeof transportStopsTable.$inferSelect;
export type TransportAlert = typeof transportAlertsTable.$inferSelect;
