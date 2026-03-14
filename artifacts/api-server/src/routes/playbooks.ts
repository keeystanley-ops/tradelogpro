import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { playbooksTable, tradesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function parseN(v: any): number {
  return parseFloat(v) || 0;
}

async function enrichPlaybook(playbook: any) {
  const trades = await db.select().from(tradesTable).where(eq(tradesTable.setupTag, playbook.name));
  const closed = trades.filter(t => t.status === "CLOSED");
  const winners = closed.filter(t => parseN(t.netPnl) > 0);
  const netPnl = closed.reduce((a, t) => a + parseN(t.netPnl), 0);
  const winRate = closed.length > 0 ? (winners.length / closed.length) * 100 : 0;
  const rMultiples = closed.filter(t => t.rMultiple).map(t => parseN(t.rMultiple));
  const avgRMultiple = rMultiples.length > 0 ? rMultiples.reduce((a, b) => a + b, 0) / rMultiples.length : 0;

  return {
    id: playbook.id,
    name: playbook.name,
    description: playbook.description,
    assetClass: playbook.assetClass,
    timeWindow: playbook.timeWindow,
    rules: playbook.rules,
    tradeCount: closed.length,
    winRate,
    netPnl,
    avgRMultiple,
    createdAt: playbook.createdAt instanceof Date ? playbook.createdAt.toISOString() : playbook.createdAt,
  };
}

router.get("/", async (_req, res) => {
  try {
    const playbooks = await db.select().from(playbooksTable).orderBy(playbooksTable.createdAt);
    const enriched = await Promise.all(playbooks.map(enrichPlaybook));
    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch playbooks" });
  }
});

router.post("/", async (req, res) => {
  try {
    const body = req.body;
    const [playbook] = await db.insert(playbooksTable).values({
      name: body.name,
      description: body.description || null,
      assetClass: body.assetClass || null,
      timeWindow: body.timeWindow || null,
      rules: body.rules || null,
    }).returning();
    res.status(201).json(await enrichPlaybook(playbook));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create playbook" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const body = req.body;
    const updates: any = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.assetClass !== undefined) updates.assetClass = body.assetClass;
    if (body.timeWindow !== undefined) updates.timeWindow = body.timeWindow;
    if (body.rules !== undefined) updates.rules = body.rules;
    updates.updatedAt = new Date();

    const [playbook] = await db.update(playbooksTable).set(updates).where(eq(playbooksTable.id, parseInt(req.params.id))).returning();
    if (!playbook) return res.status(404).json({ error: "Playbook not found" });
    res.json(await enrichPlaybook(playbook));
  } catch (err) {
    res.status(500).json({ error: "Failed to update playbook" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.delete(playbooksTable).where(eq(playbooksTable.id, parseInt(req.params.id)));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete playbook" });
  }
});

export default router;
