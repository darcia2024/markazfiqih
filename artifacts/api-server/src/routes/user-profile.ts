import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, userProfilesTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/user-profile", async (req, res) => {
  const userId = req.query.userId as string | undefined;

  if (!userId) {
    return res.status(400).json({ error: "userId query param is required" });
  }

  const rows = await db
    .select()
    .from(userProfilesTable)
    .where(eq(userProfilesTable.userId, userId))
    .limit(1);

  const row = rows[0];
  return res.json({ userId, nickname: row?.nickname ?? null });
});

router.put("/user-profile", async (req, res) => {
  const { userId, nickname } = req.body as { userId?: string; nickname?: string };

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  await db
    .insert(userProfilesTable)
    .values({ userId, nickname: nickname ?? null })
    .onConflictDoUpdate({
      target: userProfilesTable.userId,
      set: { nickname: nickname ?? null, updatedAt: new Date() },
    });

  return res.json({ userId, nickname: nickname ?? null });
});

export default router;
