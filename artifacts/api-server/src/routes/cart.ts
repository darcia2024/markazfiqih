import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, cartItemsTable, classesTable, instructorsTable, modulesTable } from "@workspace/db";
import { AddCartItemBody, ListCartItemsQueryParams, RemoveCartItemParams } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth.js";

const router: IRouter = Router();

async function toClassSummary(classId: string) {
  const rows = await db
    .select({
      id: classesTable.id,
      title: classesTable.title,
      description: classesTable.description,
      coverImage: classesTable.coverImage,
      basePrice: classesTable.basePrice,
      discountPrice: classesTable.discountPrice,
      status: classesTable.status,
      level: classesTable.level,
      category: classesTable.category,
      instructorId: instructorsTable.id,
      instructorName: instructorsTable.name,
      instructorPhotoUrl: instructorsTable.photoUrl,
    })
    .from(classesTable)
    .innerJoin(instructorsTable, eq(classesTable.instructorId, instructorsTable.id))
    .where(eq(classesTable.id, classId))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const modules = await db
    .select({ durationMinutes: modulesTable.durationMinutes })
    .from(modulesTable)
    .where(eq(modulesTable.classId, classId));

  const hasDuration = modules.some((m) => m.durationMinutes != null);
  const totalDurationMinutes = hasDuration
    ? modules.reduce((sum, m) => sum + (m.durationMinutes ?? 0), 0)
    : null;

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    coverImage: row.coverImage,
    basePrice: row.basePrice,
    discountPrice: row.discountPrice,
    status: row.status,
    level: row.level,
    category: row.category,
    instructor: {
      id: row.instructorId,
      name: row.instructorName,
      photoUrl: row.instructorPhotoUrl,
    },
    moduleCount: modules.length,
    totalDurationMinutes,
  };
}

router.get("/cart", requireAuth, async (req, res): Promise<void> => {
  const params = ListCartItemsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  // Override userId dari token — abaikan nilai yang dikirim client
  const userId = req.auth!.userId;

  const items = await db
    .select()
    .from(cartItemsTable)
    .where(eq(cartItemsTable.userId, userId));

  const result = [];
  for (const item of items) {
    const cls = await toClassSummary(item.classId);
    if (!cls) continue;
    result.push({
      id: item.id,
      classId: item.classId,
      addedAt: item.addedAt.toISOString(),
      class: cls,
    });
  }

  res.json(result);
});

router.post("/cart", requireAuth, async (req, res): Promise<void> => {
  const body = AddCartItemBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const { classId } = body.data;
  // Override userId dari token — abaikan nilai yang dikirim client
  const userId = req.auth!.userId;

  const cls = await toClassSummary(classId);
  if (!cls || cls.status !== "published") {
    res.status(400).json({ error: "Class not found or not published" });
    return;
  }

  const existing = await db
    .select()
    .from(cartItemsTable)
    .where(and(eq(cartItemsTable.userId, userId), eq(cartItemsTable.classId, classId)))
    .limit(1);

  let item = existing[0];
  if (!item) {
    const inserted = await db
      .insert(cartItemsTable)
      .values({ userId, classId })
      .returning();
    item = inserted[0];
  }

  res.status(201).json({
    id: item.id,
    classId: item.classId,
    addedAt: item.addedAt.toISOString(),
    class: cls,
  });
});

router.delete("/cart/:id", requireAuth, async (req, res): Promise<void> => {
  const params = RemoveCartItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { id } = params.data;

  // Cek kepemilikan sebelum delete — jangan bocorkan info item milik orang lain
  const existing = await db
    .select()
    .from(cartItemsTable)
    .where(eq(cartItemsTable.id, id))
    .limit(1);

  if (!existing[0] || existing[0].userId !== req.auth!.userId) {
    res.status(404).send();
    return;
  }

  await db.delete(cartItemsTable).where(eq(cartItemsTable.id, id));
  res.status(204).send();
});

export default router;
