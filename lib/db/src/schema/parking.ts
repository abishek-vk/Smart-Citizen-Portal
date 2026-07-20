import { pgTable, text, timestamp, real, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const vehicleTypeEnum = pgEnum("vehicle_type", ["car", "motorcycle", "truck", "bicycle"]);
export const reservationStatusEnum = pgEnum("reservation_status", ["active", "completed", "cancelled"]);

export const parkingLotsTable = pgTable("parking_lots", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  totalSpots: integer("total_spots").notNull(),
  availableSpots: integer("available_spots").notNull(),
  pricePerHour: real("price_per_hour").notNull(),
  openingTime: text("opening_time").notNull(),
  closingTime: text("closing_time").notNull(),
  amenities: text("amenities").array().notNull().default([]),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const parkingReservationsTable = pgTable("parking_reservations", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.id),
  parkingLotId: text("parking_lot_id").notNull().references(() => parkingLotsTable.id),
  vehicleNumber: text("vehicle_number").notNull(),
  vehicleType: vehicleTypeEnum("vehicle_type").notNull(),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }).notNull(),
  status: reservationStatusEnum("status").notNull().default("active"),
  totalAmount: real("total_amount").notNull(),
  spotNumber: text("spot_number"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const insertParkingLotSchema = createInsertSchema(parkingLotsTable).omit({ createdAt: true, updatedAt: true });
export const insertParkingReservationSchema = createInsertSchema(parkingReservationsTable).omit({ createdAt: true, updatedAt: true });
export type InsertParkingLot = z.infer<typeof insertParkingLotSchema>;
export type ParkingLot = typeof parkingLotsTable.$inferSelect;
export type InsertParkingReservation = z.infer<typeof insertParkingReservationSchema>;
export type ParkingReservation = typeof parkingReservationsTable.$inferSelect;
