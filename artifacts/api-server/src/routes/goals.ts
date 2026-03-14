import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { goalsTable, tradesTable } from "@workspace/db";
import { eq, and, gte, lte } from "drizzle-orm";

const router: IRouter = Router();

function parseN(v: any): number {
  return parseFloat(v) || 0;
}

async function computeCurrentValue(goal: any, trades: any[]): Promise<number> {
  const start = goal.startDate instanceof Date ? goal.startDate : new Date(goal.startDate);
  const end = goal.endDate instanceof Date ? goal.endDate : new Date(goal.endDate);

  const periodTrades = trades.filter(t => {
    const et = t.exitTime instanceof Date ? t.exitTime : new Date(t.exitTime);
    return et >= start && et <= end && t.status === "CLOSED";
  });

  switch (goal.type) {
    case "PNL": {
      return periodTrades.reduce((a, t) => a + parseN(t.netPnl), 0);
    }
    case "WIN_RATE": {
      if (periodTrades.length === 0) return 0;
      const wins = periodTrades.filter(t => parseN(t.netPnl) > 0).length;
      return (wins / periodTrades.length) * 100;
    }
    case "PROFIT_FACTOR": {
      const grossProfit = periodTrades.filter(t => parseN(t.netPnl) > 0).reduce((a, t) => a + parseN(t.netPnl), 0);
      const grossLoss = Math.abs(periodTrades.filter(t => parseN(t.netPnl) <= 0).reduce((a, t) => a + parseN(t.netPnl), 0));
      return grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;
    }
    case "TRADE_COUNT": {
      return periodTrades.length;
    }
    case "MAX_LOSS": {
      const losses = periodTrades.filter(t => parseN(t.netPnl) < 0);
      return losses.length > 0 ? Math.abs(Math.min(...losses.map(t => parseN(t.netPnl)))) : 0;
    }
    default:
      return 0;
  }
}

function mapGoal(g: any, currentValue: number): any {
  const targetValue = parseN(g.targetValue);
  const progressPct = targetValue > 0 ? Math.min((currentValue / targetValue) * 100, 100) : 0;
  const isCompleted = progressPct >= 100;
  return {
    id: g.id,
    type: g.type,
    name: g.name,
    targetValue,
    currentValue,
    period: g.period,
    startDate: g.startDate instanceof Date ? g.startDate.toISOString() : g.startDate,
    endDate: g.endDate instanceof Date ? g.endDate.toISOString() : g.endDate,
    isCompleted,
    progressPct,
    createdAt: g.createdAt instanceof Date ? g.createdAt.toISOString() : g.createdAt,
  };
}

router.get("/", async (req, res) => {
  try {
    const goals = await db.select().from(goalsTable).orderBy(goalsTable.createdAt);
    const trades = await db.select().from(tradesTable);

    const result = await Promise.all(
      goals.map(async (g) => {
        const current = await computeCurrentValue(g, trades);
        return mapGoal(g, current);
      })
    );

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch goals" });
  }
});

router.post("/", async (req, res) => {
  try {
    const body = req.body;
    const [goal] = await db.insert(goalsTable).values({
      type: body.type,
      name: body.name,
      targetValue: parseFloat(body.targetValue).toFixed(4),
      period: body.period,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      isCompleted: false,
    }).returning();

    const trades = await db.select().from(tradesTable);
    const currentValue = await computeCurrentValue(goal, trades);
    res.status(201).json(mapGoal(goal, currentValue));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create goal" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const body = req.body;
    const updates: any = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.targetValue !== undefined) updates.targetValue = parseFloat(body.targetValue).toFixed(4);

    const [goal] = await db.update(goalsTable).set(updates).where(eq(goalsTable.id, parseInt(req.params.id))).returning();
    if (!goal) return res.status(404).json({ error: "Goal not found" });

    const trades = await db.select().from(tradesTable);
    const currentValue = await computeCurrentValue(goal, trades);
    res.json(mapGoal(goal, currentValue));
  } catch (err) {
    res.status(500).json({ error: "Failed to update goal" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.delete(goalsTable).where(eq(goalsTable.id, parseInt(req.params.id)));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete goal" });
  }
});

export default router;
