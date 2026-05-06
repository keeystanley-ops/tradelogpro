import { Router, type IRouter } from "express";
import healthRouter from "./health";
import tradesRouter from "./trades";
import analyticsRouter from "./analytics";
import insightsRouter from "./insights";
import weeklyReviewRouter from "./weeklyReview";
import goalsRouter from "./goals";
import playbooksRouter from "./playbooks";
import aiRouter from "./ai";
import notebookRouter from "./notebook";
import challengesRouter from "./challenges";
import settingsRouter from "./settings";
import authRouter from "./auth";
import { authenticate } from "../middleware/auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);

// Protected routes
router.use("/trades", authenticate, tradesRouter);
router.use("/analytics", authenticate, analyticsRouter);
router.use("/analytics", authenticate, insightsRouter);
router.use("/analytics", authenticate, weeklyReviewRouter);
router.use("/goals", authenticate, goalsRouter);
router.use("/playbooks", authenticate, playbooksRouter);
router.use("/ai", authenticate, aiRouter);
router.use("/notebook", authenticate, notebookRouter);
router.use("/challenges", authenticate, challengesRouter);
router.use("/settings", authenticate, settingsRouter);

export default router;
