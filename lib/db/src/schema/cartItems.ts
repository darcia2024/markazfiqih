import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { classesTable } from "./classes";
import { bundlesTable } from "./bundles";

export const cartItemsTable = pgTable("cart_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  classId: uuid("class_id").references(() => classesTable.id, { onDelete: "cascade" }),
  bundleId: uuid("bundle_id").references(() => bundlesTable.id, { onDelete: "cascade" }),
  addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCartItemSchema = createInsertSchema(cartItemsTable).omit({
  id: true,
  addedAt: true,
});
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type CartItemRow = typeof cartItemsTable.$inferSelect;
