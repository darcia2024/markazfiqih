import { Router, type IRouter } from "express";
import healthRouter from "./health";
import classesRouter from "./classes";
import instructorsRouter from "./instructors";

const router: IRouter = Router();

router.use(healthRouter);
router.use(classesRouter);
router.use(instructorsRouter);

export default router;
