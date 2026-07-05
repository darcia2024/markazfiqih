import { Router, type IRouter } from "express";
import { and, asc, desc, eq, ilike, or } from "drizzle-orm";
import { db, classesTable, instructorsTable, modulesTable } from "@workspace/db";
import { ListClassesQueryParams, ListClassesResponse, GetClassByIdResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/classes", async (req, res): Promise<void> => {
  const params = ListClassesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { search, level, category, instructorId, sort } = params.data;

  const conditions = [eq(classesTable.status, "published")];
  if (search) {
    conditions.push(
      or(
        ilike(classesTable.title, `%${search}%`),
        ilike(classesTable.description, `%${search}%`),
        ilike(instructorsTable.name, `%${search}%`),
      )!,
    );
  }
  if (level) {
    conditions.push(eq(classesTable.level, level));
  }
  if (category) {
    conditions.push(eq(classesTable.category, category));
  }
  if (instructorId) {
    conditions.push(eq(classesTable.instructorId, instructorId));
  }

  const orderBy =
    sort === "price_asc"
      ? asc(classesTable.basePrice)
      : sort === "price_desc"
        ? desc(classesTable.basePrice)
        : desc(classesTable.createdAt);

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
    .where(and(...conditions))
    .orderBy(orderBy);

  const modules = await db
    .select({
      classId: modulesTable.classId,
      durationMinutes: modulesTable.durationMinutes,
    })
    .from(modulesTable);

  const moduleStatsByClass = new Map<string, { count: number; totalMinutes: number; hasDuration: boolean }>();
  for (const m of modules) {
    const stat = moduleStatsByClass.get(m.classId) ?? { count: 0, totalMinutes: 0, hasDuration: false };
    stat.count += 1;
    if (m.durationMinutes != null) {
      stat.totalMinutes += m.durationMinutes;
      stat.hasDuration = true;
    }
    moduleStatsByClass.set(m.classId, stat);
  }

  const result = rows.map((row) => {
    const stat = moduleStatsByClass.get(row.id) ?? { count: 0, totalMinutes: 0, hasDuration: false };
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
      moduleCount: stat.count,
      totalDurationMinutes: stat.hasDuration ? stat.totalMinutes : null,
    };
  });

  res.json(ListClassesResponse.parse(result));
});

router.get("/classes/:id", async (req, res): Promise<void> => {
  const { id } = req.params;

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
      instructorBio: instructorsTable.bio,
      instructorPhotoUrl: instructorsTable.photoUrl,
    })
    .from(classesTable)
    .innerJoin(instructorsTable, eq(classesTable.instructorId, instructorsTable.id))
    .where(and(eq(classesTable.id, id), eq(classesTable.status, "published")))
    .limit(1);

  const row = rows[0];
  if (!row) {
    res.status(404).json({ error: "Class not found" });
    return;
  }

  const classModules = await db
    .select({
      id: modulesTable.id,
      title: modulesTable.title,
      orderIndex: modulesTable.orderIndex,
      durationMinutes: modulesTable.durationMinutes,
    })
    .from(modulesTable)
    .where(eq(modulesTable.classId, row.id))
    .orderBy(asc(modulesTable.orderIndex));

  const moduleCount = classModules.length;
  const hasDuration = classModules.some((m) => m.durationMinutes != null);
  const totalDurationMinutes = hasDuration
    ? classModules.reduce((sum, m) => sum + (m.durationMinutes ?? 0), 0)
    : null;

  const result = {
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
      bio: row.instructorBio,
      photoUrl: row.instructorPhotoUrl,
      classCount: 0,
    },
    modules: classModules,
    moduleCount,
    totalDurationMinutes,
  };

  res.json(GetClassByIdResponse.parse(result));
});

export default router;
