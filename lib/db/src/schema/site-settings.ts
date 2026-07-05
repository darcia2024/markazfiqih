import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const siteSettingsTable = pgTable("site_settings", {
  id: integer("id").primaryKey(),
  siteName: text("site_name").notNull().default(""),
  tagline: text("tagline").notNull().default(""),
  logoUrl: text("logo_url").notNull().default(""),
  contactEmail: text("contact_email").notNull().default(""),
  contactPhone: text("contact_phone").notNull().default(""),
  address: text("address").notNull().default(""),
  founderName: text("founder_name").notNull().default(""),
  founderBio: text("founder_bio").notNull().default(""),
  founderPhotoUrl: text("founder_photo_url").notNull().default(""),
  socialInstagram: text("social_instagram").notNull().default(""),
  socialYoutube: text("social_youtube").notNull().default(""),
  socialFacebook: text("social_facebook").notNull().default(""),
  socialTiktok: text("social_tiktok").notNull().default(""),
  studentCountLabel: text("student_count_label").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertSiteSettingsSchema = createInsertSchema(siteSettingsTable).omit({
  updatedAt: true,
});
export type InsertSiteSettings = z.infer<typeof insertSiteSettingsSchema>;
export type SiteSettings = typeof siteSettingsTable.$inferSelect;
