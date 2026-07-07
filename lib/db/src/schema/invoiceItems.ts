import { integer, pgTable, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { classesTable } from "./classes";
import { invoicesTable } from "./invoices";
import { bundlesTable } from "./bundles";

export const invoiceItemsTable = pgTable("invoice_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoicesTable.id, { onDelete: "cascade" }),
  classId: uuid("class_id").references(() => classesTable.id, { onDelete: "cascade" }),
  bundleId: uuid("bundle_id").references(() => bundlesTable.id, { onDelete: "set null" }),
  price: integer("price").notNull(),
});

export const insertInvoiceItemSchema = createInsertSchema(invoiceItemsTable).omit({
  id: true,
});
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;
export type InvoiceItem = typeof invoiceItemsTable.$inferSelect;
