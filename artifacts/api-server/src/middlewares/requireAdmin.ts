import type { Request, Response, NextFunction } from "express";

const ADMIN_USER_IDS = new Set(
  (process.env.ADMIN_USER_IDS ?? "").split(",").map((id) => id.trim()).filter(Boolean),
);

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.auth || !ADMIN_USER_IDS.has(req.auth.userId)) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}
