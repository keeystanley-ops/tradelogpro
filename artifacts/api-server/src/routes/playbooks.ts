import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { playbooksTable, tradesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function parseN(v: any): number {
  return parseFloat(v) || 0;
}

/**
 * GROUP TRADES BY PLAYBOOK (Fixes N+1 query problem)
 */
function groupTradesByPlaybook(trades: any[]) {
  return trades.reduce((acc, t) => {
    if (!t.playbookId) return acc;
    if (!acc[t.playbookId]) acc[t.playbookId] = [];
    acc[t.playbookId].push(t);
    return acc;
  }, {} as Record<number, any[]>);
}

/**
 * CORE ANALYTICS ENGINE
 */
function enrichPlaybook(playbook: any, trades: any[]) {
  const closed = trades.filter(t => t.status === "CLOSED");

  const winners = closed.filter(t => parseN(t.netPnl) > 0);
  const losers = closed.filter(t => parseN(t.netPnl) <= 0);

  const netPnl = closed.reduce((a, t) => a + parseN(t.netPnl), 0);

  const winRate = closed.length > 0
    ? (winners.length / closed.length) * 100
    : 0;

  // R multiple
  const rMultiples = closed
    .filter(t => t.rMultiple !== null && t.rMultiple !== undefined)
    .map(t => parseN(t.rMultiple));

  const avgRMultiple = rMultiples.length > 0
    ? rMultiples.reduce((a, b) => a + b, 0) / rMultiples.length
    : 0;

  // Expectancy
  const avgWin = winners.length > 0
    ? winners.reduce((a, t) => a + parseN(t.netPnl), 0) / winners.length
    : 0;

  const avgLoss = losers.length > 0
    ? losers.reduce((a, t) => a + parseN(t.netPnl), 0) / losers.length
    : 0;

  const expectancy =
    (winRate / 100 * avgWin) +
    ((1 - winRate / 100) * avgLoss);

  // Profit Factor
  const grossProfit = winners.reduce((a, t) => a + parseN(t.netPnl), 0);
  const grossLoss = Math.abs(losers.reduce((a, t) => a + parseN(t.netPnl), 0));

  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0;

  // Rule adherence
  const followed = closed.filter(t => t.followedRules === true);

  const ruleAdherence = closed.length > 0
    ? (followed.length / closed.length) * 100
    : 0;

  // Mistake analytics
  const mistakeCount: Record<string, number> = {};

  closed.forEach(t => {
    (t.mistakes || []).forEach((m: string) => {
      mistakeCount[m] = (mistakeCount[m] || 0) + 1;
    });
  });

  const topMistakes = Object.entries(mistakeCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Emotion analytics
  const emotionCount: Record<string, number> = {};

  closed.forEach(t => {
    (t.emotions || []).forEach((e: string) => {
      emotionCount[e] = (emotionCount[e] || 0) + 1;
    });
  });

  const topEmotions = Object.entries(emotionCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Time-based analysis (hourly performance)
  const byHour: Record<number, number[]> = {};

  closed.forEach(t => {
    const hour = new Date(t.createdAt).getHours();
    if (!byHour[hour]) byHour[hour] = [];
    byHour[hour].push(parseN(t.netPnl));
  });

  const hourlyPerformance = Object.entries(byHour).map(([hour, pnls]) => ({
    hour: Number(hour),
    avgPnl: pnls.reduce((a, b) => a + b, 0) / pnls.length,
  }));

  // Playbook score
  const score =
    (winRate * 0.4) +
    (avgRMultiple * 20) +
    (ruleAdherence * 0.4);

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
    expectancy,
    profitFactor,
    ruleAdherence,
    score,

    topMistakes,
    topEmotions,
    hourlyPerformance,

    createdAt: playbook.createdAt instanceof Date
      ? playbook.createdAt.toISOString()
      : playbook.createdAt,
  };
}

/**
 * GET ALL PLAYBOOKS (Optimized)
 */
router.get("/", async (_req, res) => {
  try {
    const playbooks = await db
      .select()
      .from(playbooksTable)
      .orderBy(playbooksTable.createdAt);

    const trades = await db.select().from(tradesTable);

    const tradesByPlaybook = groupTradesByPlaybook(trades);

    const enriched = playbooks.map(pb =>
      enrichPlaybook(pb, tradesByPlaybook[pb.id] || [])
    );

    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch playbooks" });
  }
});

/**
 * CREATE PLAYBOOK
 */
router.post("/", async (req, res) => {
  try {
    const body = req.body;

    const [playbook] = await db.insert(playbooksTable).values({
      name: body.name,
      description: body.description || null,
      assetClass: body.assetClass || null,
      timeWindow: body.timeWindow || null,

      // structured rules JSON
      rules: body.rules || {
        entryCriteria: [],
        confirmations: [],
        invalidationRules: [],
        risk: {},
        management: {},
      },
    }).returning();

    res.status(201).json(playbook);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create playbook" });
  }
});

/**
 * UPDATE PLAYBOOK
 */
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

    const [playbook] = await db
      .update(playbooksTable)
      .set(updates)
      .where(eq(playbooksTable.id, parseInt(req.params.id)))
      .returning();

    if (!playbook) {
      return res.status(404).json({ error: "Playbook not found" });
    }

    res.json(playbook);
  } catch (err) {
    res.status(500).json({ error: "Failed to update playbook" });
  }
});

/**
 * DELETE PLAYBOOK
 */
router.delete("/:id", async (req, res) => {
  try {
    await db
      .delete(playbooksTable)
      .where(eq(playbooksTable.id, parseInt(req.params.id)));

    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete playbook" });
  }
});

export default router;