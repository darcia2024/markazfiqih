import { pgTable, text, timestamp, uuid, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { classesTable } from "./classes";

export const cartItemsTable = pgTable(
  "cart_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    classId: uuid("class_id")
      .notNull()
      .references(() => classesTable.id, { onDelete: "cascade" }),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique("cart_items_user_class_unique").on(table.userId, table.classId)],
);

export const insertCartItemSchema = createInsertSchema(cartItemsTable).omit({
  id: true,
  addedAt: true,
});
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type CartItemRow = typeof cartItemsTable.$inferSelect;
