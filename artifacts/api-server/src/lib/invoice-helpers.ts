import { eq } from "drizzle-orm";
import { db, invoicesTable, invoiceItemsTable, enrollmentsTable, cartItemsTable } from "@workspace/db";

/**
 * Tandai invoice sebagai lunas, buat enrollment untuk setiap kelas,
 * dan kosongkan cart user.
 *
 * Dipanggil dari dua tempat:
 *   1. /checkout/:id/simulate-success  (mode development)
 *   2. /webhooks/mayar                 (webhook dari Mayar setelah bayar beneran)
 *
 * Idempotent — aman dipanggil berkali-kali pada invoice yang sama.
 */
export async function markInvoiceAsPaid(invoiceId: string): Promise<void> {
  const invoiceRows = await db
    .select()
    .from(invoicesTable)
    .where(eq(invoicesTable.id, invoiceId))
    .limit(1);
  const invoice = invoiceRows[0];

  if (!invoice || invoice.status === "paid") return; // sudah lunas atau tidak ditemukan

  await db
    .update(invoicesTable)
    .set({ status: "paid", paidAt: new Date() })
    .where(eq(invoicesTable.id, invoiceId));

  const items = await db
    .select()
    .from(invoiceItemsTable)
    .where(eq(invoiceItemsTable.invoiceId, invoiceId));

  const existingEnrollments = await db
    .select()
    .from(enrollmentsTable)
    .where(eq(enrollmentsTable.userId, invoice.userId));

  const enrolledClassIds = new Set(existingEnrollments.map((e) => e.classId));
  const toEnroll = items.filter((item) => item.classId !== null && !enrolledClassIds.has(item.classId));

  if (toEnroll.length > 0) {
    await db.insert(enrollmentsTable).values(
      toEnroll.map((item) => ({
        userId: invoice.userId,
        classId: item.classId as string,
      })),
    );
  }

  await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, invoice.userId));
}
