import { Router, type IRouter } from "express";
import healthRouter from "./health";
import tradesRouter from "./trades";
import analyticsRouter from "./analytics";
import insightsRouter from "./insights";
import weeklyReviewRouter from "./weeklyReview";
import goalsRouter from "./goals";
import playbooksRouter from "./playbooks";
import aiRouter from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/trades", tradesRouter);
router.use("/analytics", analyticsRouter);
router.use("/analytics", insightsRouter);
router.use("/analytics", weeklyReviewRouter);
router.use("/goals", goalsRouter);
router.use("/playbooks", playbooksRouter);
router.use("/ai", aiRouter);

export default router;
