/**
 * POST /api/create-invoice
 *
 * Endpoint stateless: membuat invoice Mayar dan mengembalikan link pembayaran.
 * Tidak menyentuh database — murni proxy ke Mayar API.
 *
 * Body  : { name, email, mobile, description, amount }
 * Return: { paymentUrl: string }
 */
import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.post("/create-invoice", async (req, res): Promise<void> => {
  const mayarApiKey = process.env.MAYAR_API_KEY;
  const mayarBaseUrl = process.env.MAYAR_BASE_URL;

  if (!mayarApiKey || !mayarBaseUrl) {
    res.status(503).json({
      error: "Layanan pembayaran belum dikonfigurasi. Hubungi admin.",
    });
    return;
  }

  // ── Validasi input ─────────────────────────────────────────────────────────
  const { name, email, mobile, description, amount } = req.body as {
    name?: unknown;
    email?: unknown;
    mobile?: unknown;
    description?: unknown;
    amount?: unknown;
  };

  if (
    typeof name !== "string" || !name.trim() ||
    typeof email !== "string" || !email.trim() ||
    typeof mobile !== "string" || !mobile.trim() ||
    typeof description !== "string" || !description.trim() ||
    typeof amount !== "number" || amount <= 0
  ) {
    res.status(400).json({
      error: "Field wajib: name, email, mobile, description (string), amount (angka positif).",
    });
    return;
  }

  // ── Panggil Mayar API ──────────────────────────────────────────────────────
  let mayarRes: Response;
  try {
    mayarRes = await fetch(`${mayarBaseUrl}/invoice/create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mayarApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        description: description.trim(),
        items: [
          {
            quantity: 1,
            rate: amount,
            description: description.trim(),
          },
        ],
      }),
    });
  } catch (err) {
    console.error("[create-invoice] Network error calling Mayar:", err);
    res.status(502).json({ error: "Tidak bisa menghubungi layanan pembayaran. Coba lagi." });
    return;
  }

  let mayarData: Record<string, unknown>;
  try {
    mayarData = (await mayarRes.json()) as Record<string, unknown>;
  } catch {
    res.status(502).json({ error: "Response tidak valid dari layanan pembayaran." });
    return;
  }

  if (!mayarRes.ok) {
    const msg =
      typeof mayarData.message === "string"
        ? mayarData.message
        : "Gagal membuat invoice. Coba lagi.";
    console.error("[create-invoice] Mayar error:", mayarData);
    res.status(mayarRes.status).json({ error: msg });
    return;
  }

  // ── Ekstrak paymentUrl dari response Mayar ─────────────────────────────────
  // Mayar mengembalikan link pembayaran di field `data.link` atau `data.payment_link`
  const data = mayarData.data as Record<string, unknown> | undefined;
  const paymentUrl =
    (data?.link as string | undefined) ??
    (data?.payment_link as string | undefined) ??
    (mayarData.link as string | undefined) ??
    (mayarData.payment_link as string | undefined);

  if (!paymentUrl) {
    console.error("[create-invoice] paymentUrl tidak ditemukan di response Mayar:", mayarData);
    res.status(502).json({ error: "Link pembayaran tidak tersedia dari Mayar." });
    return;
  }

  res.json({ paymentUrl });
});

export default router;
