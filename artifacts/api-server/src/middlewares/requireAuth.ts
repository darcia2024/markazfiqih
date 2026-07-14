import type { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../lib/supabase-admin.js";

declare global {
  namespace Express {
    interface Request {
      auth?: { userId: string };
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }

  const token = authHeader.slice("Bearer ".length);
  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  req.auth = { userId: data.user.id };
  next();
}
