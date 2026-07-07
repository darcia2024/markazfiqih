import { Router, type IRouter } from "express";
import { eq, inArray } from "drizzle-orm";
import {
  db,
  cartItemsTable,
  classesTable,
  instructorsTable,
  invoicesTable,
  invoiceItemsTable,
  enrollmentsTable,
} from "@workspace/db";
import {
  CreateCheckoutBody,
  SimulateCheckoutSuccessParams,
  SimulateCheckoutFailParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

async function buildInvoiceResponse(invoiceId: string) {
  const invoiceRows = await db.select().from(invoicesTable).where(eq(invoicesTable.id, invoiceId)).limit(1);
  const invoice = invoiceRows[0];
  if (!invoice) return null;

  const items = await db
    .select()
    .from(invoiceItemsTable)
    .where(eq(invoiceItemsTable.invoiceId, invoiceId));

  const classIds = items.map((i) => i.classId);
  const classes = classIds.length
    ? await db
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
        .where(inArray(classesTable.id, classIds))
    : [];

  const classById = new Map(classes.map((c) => [c.id, c]));

  return {
    id: invoice.id,
    userId: invoice.userId,
    totalAmount: invoice.totalAmount,
    status: invoice.status,
    createdAt: invoice.createdAt.toISOString(),
    paidAt: invoice.paidAt ? invoice.paidAt.toISOString() : null,
    items: items.map((item) => {
      const cls = classById.get(item.classId);
      return {
        id: item.id,
        classId: item.classId,
        price: item.price,
        class: cls
          ? {
              id: cls.id,
              title: cls.title,
              description: cls.description,
              coverImage: cls.coverImage,
              basePrice: cls.basePrice,
              discountPrice: cls.discountPrice,
              status: cls.status,
              level: cls.level,
              category: cls.category,
              instructor: {
                id: cls.instructorId,
                name: cls.instructorName,
                photoUrl: cls.instructorPhotoUrl,
              },
              moduleCount: 0,
              totalDurationMinutes: null,
            }
          : null,
      };
    }),
  };
}

router.post("/checkout", requireAuth, async (req, res): Promise<void> => {
  const body = CreateCheckoutBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  // Override userId dari token — abaikan nilai yang dikirim client
  const userId = req.auth!.userId;

  const cartItems = await db.select().from(cartItemsTable).where(eq(cartItemsTable.userId, userId));
  if (cartItems.length === 0) {
    res.status(400).json({ error: "Cart is empty" });
    return;
  }

  const classIds = cartItems.map((c) => c.classId);
  const classes = await db
    .select({ id: classesTable.id, basePrice: classesTable.basePrice, discountPrice: classesTable.discountPrice })
    .from(classesTable)
    .where(inArray(classesTable.id, classIds));
  const priceByClass = new Map(classes.map((c) => [c.id, c.discountPrice ?? c.basePrice]));

  const totalAmount = cartItems.reduce((sum, item) => sum + (priceByClass.get(item.classId) ?? 0), 0);

  const insertedInvoices = await db
    .insert(invoicesTable)
    .values({ userId, totalAmount, status: "pending" })
    .returning();
  const invoice = insertedInvoices[0];

  await db.insert(invoiceItemsTable).values(
    cartItems.map((item) => ({
      invoiceId: invoice.id,
      classId: item.classId,
      price: priceByClass.get(item.classId) ?? 0,
    })),
  );

  const response = await buildInvoiceResponse(invoice.id);
  res.json(response);
});

router.post("/checkout/:id/simulate-success", requireAuth, async (req, res): Promise<void> => {
  const params = SimulateCheckoutSuccessParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { id } = params.data;

  const invoiceRows = await db.select().from(invoicesTable).where(eq(invoicesTable.id, id)).limit(1);
  const invoice = invoiceRows[0];
  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }

  // Pastikan invoice milik user yang sedang login
  if (invoice.userId !== req.auth!.userId) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }

  if (invoice.status !== "paid") {
    await db
      .update(invoicesTable)
      .set({ status: "paid", paidAt: new Date() })
      .where(eq(invoicesTable.id, id));

    const items = await db.select().from(invoiceItemsTable).where(eq(invoiceItemsTable.invoiceId, id));

    const existingEnrollments = await db
      .select()
      .from(enrollmentsTable)
      .where(eq(enrollmentsTable.userId, invoice.userId));
    const enrolledClassIds = new Set(existingEnrollments.map((e) => e.classId));

    const toEnroll = items.filter((item) => !enrolledClassIds.has(item.classId));
    if (toEnroll.length > 0) {
      await db.insert(enrollmentsTable).values(
        toEnroll.map((item) => ({
          userId: invoice.userId,
          classId: item.classId,
        })),
      );
    }

    await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, invoice.userId));
  }

  const response = await buildInvoiceResponse(id);
  res.json(response);
});

router.post("/checkout/:id/simulate-fail", requireAuth, async (req, res): Promise<void> => {
  const params = SimulateCheckoutFailParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { id } = params.data;

  const invoiceRows = await db.select().from(invoicesTable).where(eq(invoicesTable.id, id)).limit(1);
  const invoice = invoiceRows[0];
  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }

  // Pastikan invoice milik user yang sedang login
  if (invoice.userId !== req.auth!.userId) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }

  await db.update(invoicesTable).set({ status: "failed" }).where(eq(invoicesTable.id, id));

  const response = await buildInvoiceResponse(id);
  res.json(response);
});

export default router;
