import { Router, type IRouter } from "express";
import { and, asc, eq, inArray } from "drizzle-orm";
import {
  db,
  modulesTable,
  darsTable,
  progressTable,
} from "@workspace/db";
import {
  GetClassDarsParams,
  GetClassDarsResponse,
  GetProgressQueryParams,
  GetProgressResponse,
  UpsertProgressBody,
  UpsertProgressResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

// Publik — hanya struktur modul & dars, bukan data personal
router.get("/classes/:classId/dars", async (req, res): Promise<void> => {
  const params = GetClassDarsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { classId } = params.data;

  const modules = await db
    .select({
      id: modulesTable.id,
      title: modulesTable.title,
      orderIndex: modulesTable.orderIndex,
      durationMinutes: modulesTable.durationMinutes,
    })
    .from(modulesTable)
    .where(eq(modulesTable.classId, classId))
    .orderBy(asc(modulesTable.orderIndex));

  if (modules.length === 0) {
    res.json(GetClassDarsResponse.parse([]));
    return;
  }

  const moduleIds = modules.map((m) => m.id);

  const allDars = await db
    .select({
      id: darsTable.id,
      moduleId: darsTable.moduleId,
      title: darsTable.title,
      orderIndex: darsTable.orderIndex,
      durationMinutes: darsTable.durationMinutes,
    })
    .from(darsTable)
    .where(inArray(darsTable.moduleId, moduleIds))
    .orderBy(asc(darsTable.orderIndex));

  const darsByModule = new Map<string, typeof allDars>();
  for (const d of allDars) {
    const list = darsByModule.get(d.moduleId) ?? [];
    list.push(d);
    darsByModule.set(d.moduleId, list);
  }

  const result = modules.map((m) => ({
    id: m.id,
    title: m.title,
    orderIndex: m.orderIndex,
    durationMinutes: m.durationMinutes,
    dars: (darsByModule.get(m.id) ?? []).map((d) => ({
      id: d.id,
      title: d.title,
      orderIndex: d.orderIndex,
      durationMinutes: d.durationMinutes,
    })),
  }));

  res.json(GetClassDarsResponse.parse(result));
});

router.get("/progress", requireAuth, async (req, res): Promise<void> => {
  const params = GetProgressQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { classId } = params.data;
  // Override userId dari token — abaikan nilai yang dikirim client
  const userId = req.auth!.userId;

  const modules = await db
    .select({ id: modulesTable.id })
    .from(modulesTable)
    .where(eq(modulesTable.classId, classId));

  if (modules.length === 0) {
    res.json(GetProgressResponse.parse([]));
    return;
  }

  const moduleIds = modules.map((m) => m.id);

  const classDars = await db
    .select({ id: darsTable.id })
    .from(darsTable)
    .where(inArray(darsTable.moduleId, moduleIds));

  if (classDars.length === 0) {
    res.json(GetProgressResponse.parse([]));
    return;
  }

  const classDarsIds = classDars.map((d) => d.id);

  const progressRows = await db
    .select({
      id: progressTable.id,
      darsId: progressTable.darsId,
      completedAt: progressTable.completedAt,
    })
    .from(progressTable)
    .where(
      and(
        eq(progressTable.userId, userId),
        inArray(progressTable.darsId, classDarsIds),
      ),
    );

  const result = progressRows.map((p) => ({
    id: p.id,
    darsId: p.darsId,
    isCompleted: true,
    completedAt: p.completedAt.toISOString(),
  }));

  res.json(GetProgressResponse.parse(result));
});

router.post("/progress", requireAuth, async (req, res): Promise<void> => {
  const body = UpsertProgressBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const { darsId, isCompleted } = body.data;
  // Override userId dari token — abaikan nilai yang dikirim client
  const userId = req.auth!.userId;

  const existing = await db
    .select({ id: progressTable.id })
    .from(progressTable)
    .where(and(eq(progressTable.userId, userId), eq(progressTable.darsId, darsId)))
    .limit(1);

  if (isCompleted) {
    if (existing.length === 0) {
      const [inserted] = await db
        .insert(progressTable)
        .values({ userId, darsId })
        .returning({ id: progressTable.id });
      res.status(201).json(UpsertProgressResponse.parse({ id: inserted.id, darsId, isCompleted: true }));
    } else {
      res.json(UpsertProgressResponse.parse({ id: existing[0].id, darsId, isCompleted: true }));
    }
  } else {
    if (existing.length > 0) {
      await db
        .delete(progressTable)
        .where(and(eq(progressTable.userId, userId), eq(progressTable.darsId, darsId)));
    }
    res.json(UpsertProgressResponse.parse({ id: null, darsId, isCompleted: false }));
  }
});

export default router;
