import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

const ADMIN_USER_IDS = new Set(
  (process.env.ADMIN_USER_IDS ?? "").split(",").map((id) => id.trim()).filter(Boolean),
);

router.get("/auth/me", requireAuth, (req, res): void => {
  res.json({
    userId: req.auth!.userId,
    isAdmin: ADMIN_USER_IDS.has(req.auth!.userId),
  });
});

export default router;
