import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dataModeRouter from "./data-mode";
import mripRouter from "./mrip";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dataModeRouter);
router.use(mripRouter);

export default router;
