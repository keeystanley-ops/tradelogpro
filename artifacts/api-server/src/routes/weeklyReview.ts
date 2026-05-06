import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { tradesTable } from "@workspace/db";
import { and, gte, lte, eq } from "drizzle-orm";

const router: IRouter = Router();

function parseN(v: any): number {
  return parseFloat(v) || 0;
}

function mapTrade(t: any) {
  return {
    id: t.id, symbol: t.symbol, assetClass: t.assetClass, direction: t.direction,
    quantity: parseN(t.quantity), entryPrice: parseN(t.entryPrice), exitPrice: parseN(t.exitPrice),
    entryTime: t.entryTime instanceof Date ? t.entryTime.toISOString() : t.entryTime,
    exitTime: t.exitTime instanceof Date ? t.exitTime.toISOString() : t.exitTime,
    durationSeconds: t.durationSeconds, grossPnl: parseN(t.grossPnl), netPnl: parseN(t.netPnl),
    commissions: parseN(t.commissions), fees: parseN(t.fees), slippage: parseN(t.slippage),
    status: t.status, importSource: t.importSource,
    playbookId: t.playbookId,
    followedRules: t.followedRules, mistakes: t.mistakes || [], emotions: t.emotions || [], grade: t.grade,
    notes: t.notes, rating: t.rating,
    rMultiple: t.rMultiple ? parseN(t.rMultiple) : null,
    createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
  };
}

router.get("/weekly-review", async (req, res) => {
  try {
    const now = new Date();
    let weekStart: Date;
    if (req.query.weekStart) {
      weekStart = new Date(req.query.weekStart as string);
    } else {
      weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday
      weekStart.setHours(0, 0, 0, 0);
    }
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const trades = await db.select().from(tradesTable).where(
      and(
        eq(tradesTable.status, "CLOSED"),
        gte(tradesTable.exitTime, weekStart),
        lte(tradesTable.exitTime, weekEnd),
      )
    ).orderBy(tradesTable.exitTime);

    if (trades.length === 0) {
      return res.json({
        weekStart: weekStart.toISOString().slice(0, 10),
        weekEnd: weekEnd.toISOString().slice(0, 10),
        netPnl: 0, winRate: 0, totalTrades: 0,
        bestTrade: null, worstTrade: null, topSetup: null, topMistake: null,
        consistencyScore: 0, insights: ["No trades this week."], equityCurve: [],
      });
    }

    const netPnl = trades.reduce((a, t) => a + parseN(t.netPnl), 0);
    const winners = trades.filter(t => parseN(t.netPnl) > 0);
    const winRate = (winners.length / trades.length) * 100;

    const bestTrade = trades.reduce((a, b) => parseN(a.netPnl) > parseN(b.netPnl) ? a : b);
    const worstTrade = trades.reduce((a, b) => parseN(a.netPnl) < parseN(b.netPnl) ? a : b);

    // Top playbook
    const playbookCounts = new Map<number, number>();
    for (const t of trades) {
      if (t.playbookId) playbookCounts.set(t.playbookId, (playbookCounts.get(t.playbookId) || 0) + 1);
    }
    const topSetup = playbookCounts.size > 0 ? [...playbookCounts.entries()].sort((a, b) => b[1] - a[1])[0][0] : null;

    // Top mistake (from mistakes array)
    const mistakeCounts = new Map<string, number>();
    for (const t of trades) {
      const mistakes = (t as any).mistakes || [];
      for (const m of mistakes) {
        mistakeCounts.set(m, (mistakeCounts.get(m) || 0) + 1);
      }
    }
    const topMistake = mistakeCounts.size > 0 ? [...mistakeCounts.entries()].sort((a, b) => b[1] - a[1])[0][0] : null;

    // Consistency score: % of trading days profitable
    const byDate = new Map<string, number>();
    for (const t of trades) {
      const dt = t.exitTime instanceof Date ? t.exitTime : new Date(t.exitTime);
      const date = dt.toISOString().slice(0, 10);
      byDate.set(date, (byDate.get(date) || 0) + parseN(t.netPnl));
    }
    const profitDays = Array.from(byDate.values()).filter(p => p > 0).length;
    const consistencyScore = byDate.size > 0 ? (profitDays / byDate.size) * 100 : 0;

    // Equity curve for the week
    const sortedDates = Array.from(byDate.keys()).sort();
    let cumPnl = 0;
    const equityCurve = sortedDates.map(date => {
      const pnl = byDate.get(date)!;
      cumPnl += pnl;
      return {
        date, cumulativePnl: cumPnl, drawdown: 0, drawdownPct: 0,
        dailyPnl: pnl, tradeCount: Array.from(byDate.keys()).filter(d => d === date).length,
      };
    });

    // AI-style rule-based insights
    const weekInsights: string[] = [];
    if (winRate >= 60) weekInsights.push(`Strong week: ${winRate.toFixed(0)}% win rate — above your target threshold.`);
    else if (winRate < 40) weekInsights.push(`Tough week: ${winRate.toFixed(0)}% win rate. Review your entry criteria.`);
    if (topMistake) weekInsights.push(`Your most common mistake was "${topMistake}" — focus on eliminating this next week.`);
    if (topSetup) weekInsights.push(`"${topSetup}" was your most active setup — make sure it remains your best-performing one.`);
    if (trades.length > 20) weekInsights.push("You took a high volume of trades this week. Consider reducing to only A+ setups.");
    if (consistencyScore >= 80) weekInsights.push("Excellent consistency — you were profitable on most trading days.");

    res.json({
      weekStart: weekStart.toISOString().slice(0, 10),
      weekEnd: weekEnd.toISOString().slice(0, 10),
      netPnl, winRate, totalTrades: trades.length,
      bestTrade: mapTrade(bestTrade), worstTrade: mapTrade(worstTrade),
      topSetup, topMistake, consistencyScore, insights: weekInsights,
      equityCurve,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate weekly review" });
  }
});

export default router;
