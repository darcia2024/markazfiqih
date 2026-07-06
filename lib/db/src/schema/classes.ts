import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { instructorsTable } from "./instructors";

export const CLASS_STATUS_VALUES = ["draft", "published"] as const;
export const CLASS_LEVEL_VALUES = ["pemula", "menengah", "lanjutan"] as const;

export const classesTable = pgTable("classes", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  coverImage: text("cover_image").notNull().default(""),
  basePrice: integer("base_price").notNull().default(0),
  discountPrice: integer("discount_price"),
  status: text("status", { enum: CLASS_STATUS_VALUES }).notNull().default("draft"),
  level: text("level", { enum: CLASS_LEVEL_VALUES }),
  category: text("category"),
  youtubePlaylistId: text("youtube_playlist_id"),
  instructorId: uuid("instructor_id")
    .notNull()
    .references(() => instructorsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertClassSchema = createInsertSchema(classesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertClass = z.infer<typeof insertClassSchema>;
export type Class = typeof classesTable.$inferSelect;
