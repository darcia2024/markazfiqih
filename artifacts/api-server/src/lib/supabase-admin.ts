import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi");
}

/**
 * Supabase admin client dengan service-role key.
 * Dipakai di requireAuth (verifikasi token) dan checkout (ambil info user).
 */
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
