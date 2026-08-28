import { Router, type IRouter } from "express";
import healthRouter from "./health";
import mripRouter from "./mrip";

const router: IRouter = Router();

router.use(healthRouter);
router.use(mripRouter);

export default router;
