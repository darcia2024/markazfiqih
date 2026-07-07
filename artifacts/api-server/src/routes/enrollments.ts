import { Router, type IRouter } from "express";
import { and, eq, inArray } from "drizzle-orm";
import {
  db,
  enrollmentsTable,
  classesTable,
  instructorsTable,
  modulesTable,
  darsTable,
  progressTable,
} from "@workspace/db";
import {
  ListEnrollmentsQueryParams,
  ListEnrollmentsResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/enrollments", requireAuth, async (req, res): Promise<void> => {
  const params = ListEnrollmentsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  // Override userId dari token — abaikan nilai yang dikirim client
  const userId = req.auth!.userId;

  const enrollmentRows = await db
    .select({
      enrollmentId: enrollmentsTable.id,
      enrolledAt: enrollmentsTable.enrolledAt,
      classId: classesTable.id,
      classTitle: classesTable.title,
      classDescription: classesTable.description,
      classCoverImage: classesTable.coverImage,
      classBasePrice: classesTable.basePrice,
      classDiscountPrice: classesTable.discountPrice,
      classStatus: classesTable.status,
      classLevel: classesTable.level,
      classCategory: classesTable.category,
      instructorId: instructorsTable.id,
      instructorName: instructorsTable.name,
      instructorPhotoUrl: instructorsTable.photoUrl,
    })
    .from(enrollmentsTable)
    .innerJoin(classesTable, eq(enrollmentsTable.classId, classesTable.id))
    .innerJoin(instructorsTable, eq(classesTable.instructorId, instructorsTable.id))
    .where(eq(enrollmentsTable.userId, userId));

  if (enrollmentRows.length === 0) {
    res.json(ListEnrollmentsResponse.parse([]));
    return;
  }

  const classIds = enrollmentRows.map((r) => r.classId);

  const allModules = await db
    .select({
      id: modulesTable.id,
      classId: modulesTable.classId,
      durationMinutes: modulesTable.durationMinutes,
    })
    .from(modulesTable)
    .where(inArray(modulesTable.classId, classIds));

  const moduleIds = allModules.map((m) => m.id);

  const allDars =
    moduleIds.length > 0
      ? await db
          .select({ id: darsTable.id, moduleId: darsTable.moduleId })
          .from(darsTable)
          .where(inArray(darsTable.moduleId, moduleIds))
      : [];

  const darsIds = allDars.map((d) => d.id);

  const completedDars =
    darsIds.length > 0
      ? await db
          .select({ darsId: progressTable.darsId })
          .from(progressTable)
          .where(inArray(progressTable.darsId, darsIds))
          .then((rows) => rows.filter((r) => r.darsId !== null))
      : [];

  const completedDarsIds = new Set(completedDars.map((r) => r.darsId));

  const modulesByClass = new Map<string, { count: number; totalMinutes: number; hasDuration: boolean }>();
  for (const m of allModules) {
    const stat = modulesByClass.get(m.classId) ?? { count: 0, totalMinutes: 0, hasDuration: false };
    stat.count += 1;
    if (m.durationMinutes != null) {
      stat.totalMinutes += m.durationMinutes;
      stat.hasDuration = true;
    }
    modulesByClass.set(m.classId, stat);
  }

  const moduleIdToClassId = new Map(allModules.map((m) => [m.id, m.classId]));

  const darsByClass = new Map<string, { total: number; completed: number }>();
  for (const d of allDars) {
    const classId = moduleIdToClassId.get(d.moduleId);
    if (!classId) continue;
    const stat = darsByClass.get(classId) ?? { total: 0, completed: 0 };
    stat.total += 1;
    if (completedDarsIds.has(d.id)) stat.completed += 1;
    darsByClass.set(classId, stat);
  }

  const result = enrollmentRows.map((row) => {
    const modStat = modulesByClass.get(row.classId) ?? { count: 0, totalMinutes: 0, hasDuration: false };
    const darsStat = darsByClass.get(row.classId) ?? { total: 0, completed: 0 };
    return {
      id: row.enrollmentId,
      enrolledAt: row.enrolledAt.toISOString(),
      class: {
        id: row.classId,
        title: row.classTitle,
        description: row.classDescription,
        coverImage: row.classCoverImage,
        basePrice: row.classBasePrice,
        discountPrice: row.classDiscountPrice,
        status: row.classStatus,
        level: row.classLevel,
        category: row.classCategory,
        instructor: {
          id: row.instructorId,
          name: row.instructorName,
          photoUrl: row.instructorPhotoUrl,
        },
        moduleCount: modStat.count,
        totalDurationMinutes: modStat.hasDuration ? modStat.totalMinutes : null,
        totalDarsCount: darsStat.total,
        completedDarsCount: darsStat.completed,
      },
    };
  });

  res.json(ListEnrollmentsResponse.parse(result));
});

router.put("/enrollments/:id/complete", requireAuth, async (req, res): Promise<void> => {
  const { id } = req.params as { id: string };
  // Ambil userId dari token — tidak dari query/body
  const userId = req.auth!.userId;

  const [updated] = await db
    .update(enrollmentsTable)
    .set({ isCompleted: true })
    .where(and(eq(enrollmentsTable.id, id), eq(enrollmentsTable.userId, userId)))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Enrollment not found" });
    return;
  }

  res.json({ id: updated.id, isCompleted: updated.isCompleted });
});

export default router;
