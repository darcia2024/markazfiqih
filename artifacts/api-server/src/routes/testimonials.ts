import { Router, type IRouter } from "express";
import { asc, eq } from "drizzle-orm";
import { db, testimonialsTable } from "@workspace/db";
import { ListTestimonialsResponse, CreateTestimonialBody, CreateTestimonialResponse, UpdateTestimonialBody, UpdateTestimonialResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/testimonials", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(testimonialsTable)
    .where(eq(testimonialsTable.isPublished, true))
    .orderBy(asc(testimonialsTable.orderIndex));

  res.json(ListTestimonialsResponse.parse(rows));
});

router.post("/testimonials", async (req, res): Promise<void> => {
  const body = CreateTestimonialBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [row] = await db.insert(testimonialsTable).values(body.data).returning();

  res.status(201).json(CreateTestimonialResponse.parse(row));
});

router.put("/testimonials/:id", async (req, res): Promise<void> => {
  const { id } = req.params;
  const body = UpdateTestimonialBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [row] = await db
    .update(testimonialsTable)
    .set(body.data)
    .where(eq(testimonialsTable.id, id))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Testimonial not found" });
    return;
  }

  res.json(UpdateTestimonialResponse.parse(row));
});

router.delete("/testimonials/:id", async (req, res): Promise<void> => {
  const { id } = req.params;

  const [row] = await db.delete(testimonialsTable).where(eq(testimonialsTable.id, id)).returning();

  if (!row) {
    res.status(404).json({ error: "Testimonial not found" });
    return;
  }

  res.status(204).end();
});

export default router;
