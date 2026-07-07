import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, userProfilesTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/user-profile", requireAuth, async (req, res) => {
  // userId diambil dari token — abaikan query param userId dari client
  const userId = req.auth!.userId;

  const rows = await db
    .select()
    .from(userProfilesTable)
    .where(eq(userProfilesTable.userId, userId))
    .limit(1);

  const row = rows[0];
  return res.json({ userId, nickname: row?.nickname ?? null });
});

router.put("/user-profile", requireAuth, async (req, res) => {
  // userId diambil dari token — abaikan body userId dari client
  const userId = req.auth!.userId;
  const { nickname } = req.body as { nickname?: string };

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
