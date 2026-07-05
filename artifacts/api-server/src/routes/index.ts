import { Router, type IRouter } from "express";
import healthRouter from "./health";
import classesRouter from "./classes";
import instructorsRouter from "./instructors";
import cartRouter from "./cart";
import checkoutRouter from "./checkout";

const router: IRouter = Router();

router.use(healthRouter);
router.use(classesRouter);
router.use(instructorsRouter);
router.use(cartRouter);
router.use(checkoutRouter);

export default router;
