import type { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Middleware ini tidak throw saat env kosong — aman dipakai di endpoint publik
const supabaseAdmin =
  supabaseUrl && serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;

/**
 * Seperti requireAuth, tapi TIDAK memblokir request tanpa token.
 * Dipakai di endpoint publik yang perlu tahu apakah pemanggil adalah admin
 * (misal: GET /classes?includeAll=true).
 *
 * Jika token valid → req.auth terisi.
 * Jika tidak ada token atau token invalid → req.auth tidak diisi, request lanjut.
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ") && supabaseAdmin) {
    const token = authHeader.slice("Bearer ".length);
    const { data } = await supabaseAdmin.auth.getUser(token);
    if (data.user) {
      req.auth = { userId: data.user.id };
    }
  }
  next(); // selalu lanjut, bahkan tanpa token valid
}
