import { Router, type IRouter } from "express";
import { and, asc, count, desc, eq, ilike, notInArray, or } from "drizzle-orm";
import { db, classesTable, instructorsTable, modulesTable, cartItemsTable, enrollmentsTable } from "@workspace/db";
import {
  ListClassesQueryParams,
  ListClassesResponse,
  GetClassByIdResponse,
  ListRecommendedClassesQueryParams,
  CreateClassBody,
  CreateClassResponse,
  UpdateClassBody,
  UpdateClassResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { requireAdmin } from "../middlewares/requireAdmin";
import { optionalAuth } from "../middlewares/optionalAuth";

const router: IRouter = Router();

router.get("/classes/recommended", requireAuth, async (req, res): Promise<void> => {
  const params = ListRecommendedClassesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { limit } = params.data;
  const userId = req.auth!.userId;

  const cartRows = await db
    .select({ classId: cartItemsTable.classId })
    .from(cartItemsTable)
    .where(eq(cartItemsTable.userId, userId));
  const enrollmentRows = await db
    .select({ classId: enrollmentsTable.classId })
    .from(enrollmentsTable)
    .where(eq(enrollmentsTable.userId, userId));

  const excludeIds = [...new Set([...cartRows.map((r) => r.classId), ...enrollmentRows.map((r) => r.classId)])];

  const conditions = [eq(classesTable.status, "published")];
  if (excludeIds.length > 0) {
    conditions.push(notInArray(classesTable.id, excludeIds));
  }

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
      youtubePlaylistId: classesTable.youtubePlaylistId,
      instructorId: instructorsTable.id,
      instructorName: instructorsTable.name,
      instructorPhotoUrl: instructorsTable.photoUrl,
    })
    .from(classesTable)
    .innerJoin(instructorsTable, eq(classesTable.instructorId, instructorsTable.id))
    .where(and(...conditions))
    .orderBy(desc(classesTable.createdAt))
    .limit(limit ?? 3);

  const result = rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    coverImage: row.coverImage,
    basePrice: row.basePrice,
    discountPrice: row.discountPrice,
    status: row.status,
    level: row.level,
    category: row.category,
    youtubePlaylistId: row.youtubePlaylistId,
    instructor: {
      id: row.instructorId,
      name: row.instructorName,
      photoUrl: row.instructorPhotoUrl,
    },
    moduleCount: 0,
    totalDurationMinutes: null,
  }));

  res.json(ListClassesResponse.parse(result));
});

const ADMIN_USER_IDS_SET = new Set(
  (process.env.ADMIN_USER_IDS ?? "").split(",").map((id) => id.trim()).filter(Boolean),
);

router.get("/classes", optionalAuth, async (req, res): Promise<void> => {
  const params = ListClassesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { search, level, category, instructorId, sort } = params.data;

  // includeAll hanya diizinkan kalau requester terbukti admin via token
  const isAdmin = !!req.auth && ADMIN_USER_IDS_SET.has(req.auth.userId);
  const includeAll = params.data.includeAll && isAdmin;

  const conditions = includeAll ? [] : [eq(classesTable.status, "published")];
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
      youtubePlaylistId: classesTable.youtubePlaylistId,
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
      youtubePlaylistId: row.youtubePlaylistId,
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
      youtubePlaylistId: classesTable.youtubePlaylistId,
      gdriveMateriUrl: classesTable.gdriveMateriUrl,
      waGroupUrl: classesTable.waGroupUrl,
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

  const [countRow] = await db
    .select({ value: count() })
    .from(classesTable)
    .where(and(
      eq(classesTable.instructorId, row.instructorId),
      eq(classesTable.status, "published"),
    ));
  const instructorClassCount = countRow?.value ?? 0;

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
    youtubePlaylistId: row.youtubePlaylistId,
    gdriveMateriUrl: row.gdriveMateriUrl,
    waGroupUrl: row.waGroupUrl,
    instructor: {
      id: row.instructorId,
      name: row.instructorName,
      bio: row.instructorBio,
      photoUrl: row.instructorPhotoUrl,
      classCount: instructorClassCount,
    },
    modules: classModules,
    moduleCount,
    totalDurationMinutes,
  };

  res.json(GetClassByIdResponse.parse(result));
});

router.post("/classes", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const body = CreateClassBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [inserted] = await db.insert(classesTable).values(body.data).returning();

  const instructorRows = await db
    .select()
    .from(instructorsTable)
    .where(eq(instructorsTable.id, inserted.instructorId))
    .limit(1);
  const instructor = instructorRows[0];

  const result = {
    id: inserted.id,
    title: inserted.title,
    description: inserted.description,
    coverImage: inserted.coverImage,
    basePrice: inserted.basePrice,
    discountPrice: inserted.discountPrice,
    status: inserted.status,
    level: inserted.level,
    category: inserted.category,
    youtubePlaylistId: inserted.youtubePlaylistId,
    gdriveMateriUrl: inserted.gdriveMateriUrl,
    waGroupUrl: inserted.waGroupUrl,
    instructor: {
      id: instructor.id,
      name: instructor.name,
      photoUrl: instructor.photoUrl,
    },
    moduleCount: 0,
    totalDurationMinutes: null,
  };

  res.status(201).json(CreateClassResponse.parse(result));
});

router.put("/classes/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const { id } = req.params;
  const body = UpdateClassBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [updated] = await db.update(classesTable).set(body.data).where(eq(classesTable.id, id)).returning();

  if (!updated) {
    res.status(404).json({ error: "Class not found" });
    return;
  }

  const instructorRows = await db
    .select()
    .from(instructorsTable)
    .where(eq(instructorsTable.id, updated.instructorId))
    .limit(1);
  const instructor = instructorRows[0];

  const classModules = await db
    .select({
      durationMinutes: modulesTable.durationMinutes,
    })
    .from(modulesTable)
    .where(eq(modulesTable.classId, updated.id));

  const moduleCount = classModules.length;
  const hasDuration = classModules.some((m) => m.durationMinutes != null);
  const totalDurationMinutes = hasDuration
    ? classModules.reduce((sum, m) => sum + (m.durationMinutes ?? 0), 0)
    : null;

  const result = {
    id: updated.id,
    title: updated.title,
    description: updated.description,
    coverImage: updated.coverImage,
    basePrice: updated.basePrice,
    discountPrice: updated.discountPrice,
    status: updated.status,
    level: updated.level,
    category: updated.category,
    youtubePlaylistId: updated.youtubePlaylistId,
    gdriveMateriUrl: updated.gdriveMateriUrl,
    waGroupUrl: updated.waGroupUrl,
    instructor: {
      id: instructor.id,
      name: instructor.name,
      photoUrl: instructor.photoUrl,
    },
    moduleCount,
    totalDurationMinutes,
  };

  res.json(UpdateClassResponse.parse(result));
});

router.delete("/classes/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const { id } = req.params;

  const [deleted] = await db.delete(classesTable).where(eq(classesTable.id, id)).returning();

  if (!deleted) {
    res.status(404).json({ error: "Class not found" });
    return;
  }

  res.status(204).end();
});

export default router;
