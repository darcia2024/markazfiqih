import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, instructorsTable, classesTable } from "@workspace/db";
import { ListInstructorsResponse } from "@workspace/api-zod";

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

export default router;
