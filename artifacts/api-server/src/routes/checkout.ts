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
import { requireAuth } from "../middlewares/requireAuth.js";
import { markInvoiceAsPaid } from "../lib/invoice-helpers.js";

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
    paymentUrl: null as string | null, // diisi oleh Mayar nanti
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

// ── GET /checkout/:id — cek status invoice (untuk polling setelah redirect dari Mayar)
router.get("/checkout/:id", requireAuth, async (req, res): Promise<void> => {
  const { id } = req.params as { id: string };

  const response = await buildInvoiceResponse(id);
  if (!response) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }

  // Pastikan invoice milik user yang sedang login
  if (response.userId !== req.auth!.userId) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }

  res.json(response);
});

// ── POST /checkout — buat invoice dari isi keranjang
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

  const [invoice] = await db
    .insert(invoicesTable)
    .values({ userId, totalAmount, status: "pending" })
    .returning();

  await db.insert(invoiceItemsTable).values(
    cartItems.map((item) => ({
      invoiceId: invoice.id,
      classId: item.classId,
      price: priceByClass.get(item.classId) ?? 0,
    })),
  );

  // ── TODO: Integrasi Mayar (Kasus 5, Langkah 0) ──────────────────────────────
  // Setelah mendapat API key + dokumentasi Mayar, tambahkan di sini:
  //
  //   const mayarRes = await fetch(`${process.env.MAYAR_BASE_URL}/...`, {
  //     method: "POST",
  //     headers: { Authorization: `Bearer ${process.env.MAYAR_API_KEY}`, "Content-Type": "application/json" },
  //     body: JSON.stringify({ amount: totalAmount, ... }),
  //   });
  //   const mayarData = await mayarRes.json();
  //   const paymentUrl = mayarData.???;
  //   const mayarInvoiceId = mayarData.???;
  //
  //   await db.update(invoicesTable).set({ mayarInvoiceId }).where(eq(invoicesTable.id, invoice.id));
  //
  // Lalu ganti `paymentUrl: null` di response menjadi `paymentUrl`.
  // ────────────────────────────────────────────────────────────────────────────

  const response = await buildInvoiceResponse(invoice.id);
  res.json(response);
});

// ── POST /checkout/:id/simulate-success — DEVELOPMENT ONLY
router.post("/checkout/:id/simulate-success", requireAuth, async (req, res): Promise<void> => {
  // Blokir di production — endpoint ini hanya untuk pengujian lokal
  if (process.env.NODE_ENV === "production") {
    res.status(404).json({ error: "Not found" });
    return;
  }

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

  await markInvoiceAsPaid(id);

  const response = await buildInvoiceResponse(id);
  res.json(response);
});

// ── POST /checkout/:id/simulate-fail — DEVELOPMENT ONLY
router.post("/checkout/:id/simulate-fail", requireAuth, async (req, res): Promise<void> => {
  // Blokir di production — endpoint ini hanya untuk pengujian lokal
  if (process.env.NODE_ENV === "production") {
    res.status(404).json({ error: "Not found" });
    return;
  }

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
