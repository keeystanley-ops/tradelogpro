import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { challengesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import type { AuthenticatedRequest } from "../middleware/auth";

const router: IRouter = Router();

router.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const challenges = await db.select().from(challengesTable)
      .where(eq(challengesTable.userId, userId))
      .orderBy(desc(challengesTable.createdAt));
    res.json({ challenges });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch challenges" });
  }
});

router.post("/", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { name, description, type, targetMetrics, startDate, endDate } = req.body;
    const [challenge] = await db.insert(challengesTable).values({
      userId,
      name,
      description: description || "",
      type: type || "CONSISTENCY",
      targetMetrics: targetMetrics || {},
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      status: "ACTIVE",
      progress: 0,
    }).returning();
    res.status(201).json(challenge);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create challenge" });
  }
});

router.put("/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const id = parseInt(req.params.id);
    const { name, description, status, progress, targetMetrics } = req.body;
    const [challenge] = await db.update(challengesTable)
      .set({ name, description, status, progress, targetMetrics })
      .where(and(eq(challengesTable.id, id), eq(challengesTable.userId, userId)))
      .returning();
    if (!challenge) return res.status(404).json({ error: "Challenge not found" });
    res.json(challenge);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update challenge" });
  }
});

router.delete("/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const id = parseInt(req.params.id);
    await db.delete(challengesTable).where(and(eq(challengesTable.id, id), eq(challengesTable.userId, userId)));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete challenge" });
  }
});

export default router;
