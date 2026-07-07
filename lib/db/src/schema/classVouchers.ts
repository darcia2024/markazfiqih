import { pgTable, text, uuid, boolean, integer, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { classesTable } from "./classes";

export const classVouchersTable = pgTable(
  "class_vouchers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    classId: uuid("class_id")
      .notNull()
      .references(() => classesTable.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    discountPrice: integer("discount_price").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    maxUses: integer("max_uses"),
    usedCount: integer("used_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique("class_vouchers_class_code_unique").on(table.classId, table.code)],
);

export const insertClassVoucherSchema = createInsertSchema(classVouchersTable).omit({
  id: true,
  usedCount: true,
  createdAt: true,
});
export type InsertClassVoucher = z.infer<typeof insertClassVoucherSchema>;
export type ClassVoucher = typeof classVouchersTable.$inferSelect;
