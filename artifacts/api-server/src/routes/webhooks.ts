import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, invoicesTable } from "@workspace/db";
import { markInvoiceAsPaid } from "../lib/invoice-helpers";
// TODO: uncomment dan isi saat dokumentasi webhook Mayar sudah didapat
// import { createHmac } from "node:crypto";

const router: IRouter = Router();

// ─────────────────────────────────────────────────────────────────────────────
// WEBHOOK dari Mayar — TIDAK pakai requireAuth (request datang dari server Mayar)
// Keamanan murni dari verifikasi signature di bawah.
// ─────────────────────────────────────────────────────────────────────────────
router.post("/webhooks/mayar", async (req, res): Promise<void> => {
  // ── LANGKAH 1: Verifikasi Signature ────────────────────────────────────────
  // TODO: isi setelah mendapat dokumentasi API Mayar.
  //
  // Contoh pola umum (HMAC SHA-256):
  //   const webhookSecret = process.env.MAYAR_WEBHOOK_SECRET ?? "";
  //   const signature = req.headers["x-mayar-signature"] as string; // sesuaikan nama header
  //   const rawBody = JSON.stringify(req.body);
  //   const expected = createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  //   if (signature !== expected) {
  //     res.status(401).json({ error: "Invalid signature" });
  //     return;
  //   }
  //
  // PENTING: endpoint ini HARUS tolak request tanpa signature valid.
  // Hapus comment di bawah ini setelah blok TODO di atas diisi.

  const WEBHOOK_SECRET_CONFIGURED = !!process.env.MAYAR_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET_CONFIGURED) {
    // Selama Mayar belum dikonfigurasi, tolak semua request ke endpoint ini
    // untuk menghindari enrollment gratis tanpa verifikasi.
    res.status(503).json({ error: "Payment gateway not configured" });
    return;
  }

  // ── LANGKAH 2: Parse Payload ────────────────────────────────────────────────
  // TODO: sesuaikan field ini dengan payload Mayar yang sesungguhnya.
  //
  // Contoh field yang mungkin ada di payload Mayar:
  //   req.body.status          → "PAID" | "FAILED" | "PENDING" dll
  //   req.body.id              → ID invoice di sisi Mayar (= mayarInvoiceId kita)
  //   req.body.referenceId     → atau mungkin field lain yang menyimpan mayarInvoiceId
  //
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload = req.body as Record<string, any>;
  const mayarStatus: string = payload.status ?? "";
  const mayarInvoiceId: string = payload.id ?? "";

  if (!mayarInvoiceId) {
    res.status(400).json({ error: "Missing invoice ID in payload" });
    return;
  }

  // ── LANGKAH 3: Cari Invoice Lokal & Proses ─────────────────────────────────
  // TODO: sesuaikan nilai STATUS_PAID dengan yang dikembalikan Mayar (e.g. "PAID", "paid", "success")
  const STATUS_PAID = "PAID"; // ← ganti sesuai dokumentasi Mayar

  if (mayarStatus === STATUS_PAID) {
    const invoiceRows = await db
      .select()
      .from(invoicesTable)
      .where(eq(invoicesTable.mayarInvoiceId, mayarInvoiceId))
      .limit(1);

    const invoice = invoiceRows[0];
    if (!invoice) {
      // Invoice tidak ditemukan — mungkin webhook duplikat atau test
      res.status(200).json({ ok: true }); // tetap 200 supaya Mayar tidak retry terus
      return;
    }

    await markInvoiceAsPaid(invoice.id);
  }

  res.status(200).json({ ok: true });
});

export default router;
