import { pgTable, unique, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { bundlesTable } from "./bundles";
import { classesTable } from "./classes";

export const bundleClassesTable = pgTable(
  "bundle_classes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bundleId: uuid("bundle_id")
      .notNull()
      .references(() => bundlesTable.id, { onDelete: "cascade" }),
    classId: uuid("class_id")
      .notNull()
      .references(() => classesTable.id, { onDelete: "cascade" }),
  },
  (table) => [unique("bundle_classes_bundle_class_unique").on(table.bundleId, table.classId)],
);

export const insertBundleClassSchema = createInsertSchema(bundleClassesTable).omit({
  id: true,
});
export type InsertBundleClass = z.infer<typeof insertBundleClassSchema>;
export type BundleClass = typeof bundleClassesTable.$inferSelect;
