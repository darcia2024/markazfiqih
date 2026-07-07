import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, instructorsTable, classesTable } from "@workspace/db";
import {
  ListInstructorsResponse,
  CreateInstructorBody,
  CreateInstructorResponse,
  UpdateInstructorBody,
  UpdateInstructorResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { requireAdmin } from "../middlewares/requireAdmin";

const router: IRouter = Router();

router.get("/instructors", async (_req, res): Promise<void> => {
  const instructors = await db.select().from(instructorsTable);

  const publishedClasses = await db
    .select({ instructorId: classesTable.instructorId })
    .from(classesTable)
    .where(eq(classesTable.status, "published"));

  const countByInstructor = new Map<string, number>();
  for (const c of publishedClasses) {
    countByInstructor.set(c.instructorId, (countByInstructor.get(c.instructorId) ?? 0) + 1);
  }

  const result = instructors.map((instructor) => ({
    id: instructor.id,
    name: instructor.name,
    bio: instructor.bio,
    photoUrl: instructor.photoUrl,
    classCount: countByInstructor.get(instructor.id) ?? 0,
  }));

  res.json(ListInstructorsResponse.parse(result));
});

router.post("/instructors", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const body = CreateInstructorBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [inserted] = await db.insert(instructorsTable).values(body.data).returning();

  const result = {
    id: inserted.id,
    name: inserted.name,
    bio: inserted.bio,
    photoUrl: inserted.photoUrl,
    classCount: 0,
  };

  res.status(201).json(CreateInstructorResponse.parse(result));
});

router.put("/instructors/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const { id } = req.params as { id: string };
  const body = UpdateInstructorBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [updated] = await db
    .update(instructorsTable)
    .set(body.data)
    .where(eq(instructorsTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Instructor not found" });
    return;
  }

  const publishedClasses = await db
    .select({ instructorId: classesTable.instructorId })
    .from(classesTable)
    .where(eq(classesTable.status, "published"));

  const classCount = publishedClasses.filter((c) => c.instructorId === updated.id).length;

  const result = {
    id: updated.id,
    name: updated.name,
    bio: updated.bio,
    photoUrl: updated.photoUrl,
    classCount,
  };

  res.json(UpdateInstructorResponse.parse(result));
});

router.delete("/instructors/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const { id } = req.params as { id: string };

  const [deleted] = await db.delete(instructorsTable).where(eq(instructorsTable.id, id)).returning();

  if (!deleted) {
    res.status(404).json({ error: "Instructor not found" });
    return;
  }

  res.status(204).end();
});

export default router;
