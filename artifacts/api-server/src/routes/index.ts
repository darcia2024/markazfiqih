import { Router, type IRouter } from "express";
import healthRouter from "./health";
import classesRouter from "./classes";
import instructorsRouter from "./instructors";
import cartRouter from "./cart";
import checkoutRouter from "./checkout";
import testimonialsRouter from "./testimonials";
import settingsRouter from "./settings";
import enrollmentsRouter from "./enrollments";
import darsRouter from "./dars";
import userProfileRouter from "./user-profile";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(classesRouter);
router.use(instructorsRouter);
router.use(cartRouter);
router.use(checkoutRouter);
router.use(testimonialsRouter);
router.use(settingsRouter);
router.use(enrollmentsRouter);
router.use(darsRouter);
router.use(userProfileRouter);

export default router;
