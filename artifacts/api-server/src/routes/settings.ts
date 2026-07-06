import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, siteSettingsTable } from "@workspace/db";
import { GetSettingsResponse, UpdateSettingsBody, UpdateSettingsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/settings", async (_req, res): Promise<void> => {
  const rows = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.id, 1)).limit(1);

  let row = rows[0];
  if (!row) {
    // Auto-create default settings row on first access
    const inserted = await db.insert(siteSettingsTable).values({ id: 1 }).returning();
    row = inserted[0];
  }

  res.json(GetSettingsResponse.parse({ ...row, updatedAt: row.updatedAt.toISOString() }));
});

router.put("/settings", async (req, res): Promise<void> => {
  const body = UpdateSettingsBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [row] = await db
    .update(siteSettingsTable)
    .set(body.data)
    .where(eq(siteSettingsTable.id, 1))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Settings not found" });
    return;
  }

  res.json(UpdateSettingsResponse.parse({ ...row, updatedAt: row.updatedAt.toISOString() }));
});

export default router;
