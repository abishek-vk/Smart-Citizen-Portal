import { pgTable, text, timestamp, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const borrowingStatusEnum = pgEnum("borrowing_status", ["active", "returned", "overdue"]);

export const librariesTable = pgTable("libraries", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  phone: text("phone").notNull(),
  openingTime: text("opening_time").notNull(),
  closingTime: text("closing_time").notNull(),
  totalBooks: integer("total_books").notNull().default(0),
  availableBooks: integer("available_books").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const booksTable = pgTable("books", {
  id: text("id").primaryKey(),
  libraryId: text("library_id").notNull().references(() => librariesTable.id),
  title: text("title").notNull(),
  author: text("author").notNull(),
  isbn: text("isbn"),
  genre: text("genre").notNull(),
  publishedYear: integer("published_year"),
  totalCopies: integer("total_copies").notNull().default(1),
  availableCopies: integer("available_copies").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const borrowingsTable = pgTable("borrowings", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.id),
  bookId: text("book_id").notNull().references(() => booksTable.id),
  borrowedAt: timestamp("borrowed_at", { withTimezone: true }).notNull().defaultNow(),
  dueDate: text("due_date").notNull(),
  returnedAt: timestamp("returned_at", { withTimezone: true }),
  status: borrowingStatusEnum("status").notNull().default("active"),
  fineDue: integer("fine_due").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertLibrarySchema = createInsertSchema(librariesTable).omit({ createdAt: true, updatedAt: true });
export const insertBookSchema = createInsertSchema(booksTable).omit({ createdAt: true, updatedAt: true });
export const insertBorrowingSchema = createInsertSchema(borrowingsTable).omit({ createdAt: true, updatedAt: true });
export type InsertLibrary = z.infer<typeof insertLibrarySchema>;
export type Library = typeof librariesTable.$inferSelect;
export type InsertBook = z.infer<typeof insertBookSchema>;
export type Book = typeof booksTable.$inferSelect;
export type InsertBorrowing = z.infer<typeof insertBorrowingSchema>;
export type Borrowing = typeof borrowingsTable.$inferSelect;
