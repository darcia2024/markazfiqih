import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const BUNDLE_STATUS_VALUES = ["draft", "published"] as const;

export const bundlesTable = pgTable("bundles", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  normalPrice: integer("normal_price").notNull(),
  bundlePrice: integer("bundle_price").notNull(),
  status: text("status", { enum: BUNDLE_STATUS_VALUES }).notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertBundleSchema = createInsertSchema(bundlesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertBundle = z.infer<typeof insertBundleSchema>;
export type Bundle = typeof bundlesTable.$inferSelect;
