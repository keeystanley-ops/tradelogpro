import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { challengesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const challenges = await db.select().from(challengesTable).orderBy(desc(challengesTable.createdAt));
    res.json({ challenges });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch challenges" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, description, type, targetMetrics, startDate, endDate } = req.body;
    const [challenge] = await db.insert(challengesTable).values({
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

router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description, status, progress, targetMetrics } = req.body;
    const [challenge] = await db.update(challengesTable)
      .set({ name, description, status, progress, targetMetrics })
      .where(eq(challengesTable.id, id))
      .returning();
    if (!challenge) return res.status(404).json({ error: "Challenge not found" });
    res.json(challenge);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update challenge" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(challengesTable).where(eq(challengesTable.id, id));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete challenge" });
  }
});

export default router;
