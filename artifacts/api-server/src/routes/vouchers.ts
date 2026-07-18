import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";
import { supabaseAdmin } from "../lib/supabase-admin.js";

const router: IRouter = Router();

/**
 * DELETE /api/vouchers/:id
 * Admin-only: delete a gift code voucher by ID.
 * Uses supabaseAdmin (service role) to bypass RLS.
 */
router.delete("/vouchers/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ error: "Voucher ID wajib diisi." });
    return;
  }

  const { error, count } = await supabaseAdmin
    .from("class_vouchers")
    .delete({ count: "exact" })
    .eq("id", id);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  if (count === 0) {
    res.status(404).json({ error: "Voucher tidak ditemukan." });
    return;
  }

  res.status(204).send();
});

export default router;
