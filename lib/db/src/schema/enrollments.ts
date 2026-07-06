import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { classesTable } from "./classes";

export const enrollmentsTable = pgTable("enrollments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  classId: uuid("class_id")
    .notNull()
    .references(() => classesTable.id, { onDelete: "cascade" }),
  enrolledAt: timestamp("enrolled_at", { withTimezone: true }).notNull().defaultNow(),
  isCompleted: boolean("is_completed").notNull().default(false),
});

export const insertEnrollmentSchema = createInsertSchema(enrollmentsTable).omit({
  id: true,
  enrolledAt: true,
});
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type Enrollment = typeof enrollmentsTable.$inferSelect;
