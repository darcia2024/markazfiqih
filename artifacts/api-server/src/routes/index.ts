import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import classesRouter from "./classes.js";
import instructorsRouter from "./instructors.js";
import cartRouter from "./cart.js";
import checkoutRouter from "./checkout.js";
import testimonialsRouter from "./testimonials.js";
import settingsRouter from "./settings.js";
import enrollmentsRouter from "./enrollments.js";
import darsRouter from "./dars.js";
import userProfileRouter from "./user-profile.js";
import authRouter from "./auth.js";
import createInvoiceRouter from "./create-invoice.js";
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
router.use(createInvoiceRouter);

export default router;
