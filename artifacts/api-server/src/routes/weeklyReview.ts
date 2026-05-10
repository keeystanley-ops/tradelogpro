import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { tradesTable } from "@workspace/db";
import { and, gte, lte, eq } from "drizzle-orm";
import { AuthenticatedRequest } from "../middleware/auth";

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

router.get("/weekly-review", async (req: AuthenticatedRequest, res) => {
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

    const userId = req.userId;
    const trades = await db.select().from(tradesTable).where(
      and(
        eq(tradesTable.userId, userId),
        eq(tradesTable.status, "CLOSED"),
        eq(tradesTable.isBacktest, false),
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
    const losers = trades.filter(t => parseN(t.netPnl) <= 0);
    const winRate = (winners.length / trades.length) * 100;

    const totalWins = winners.reduce((a, t) => a + parseN(t.netPnl), 0);
    const totalLosses = Math.abs(losers.reduce((a, t) => a + parseN(t.netPnl), 0));
    
    const avgWin = winners.length > 0 ? totalWins / winners.length : 0;
    const avgLoss = losers.length > 0 ? totalLosses / losers.length : 0;
    const expectancy = (winRate / 100 * avgWin) - ((100 - winRate) / 100 * avgLoss);

    const rMultiples = trades.filter(t => t.rMultiple).map(t => parseN(t.rMultiple));
    const avgRR = rMultiples.length > 0 ? rMultiples.reduce((a: number, b: number) => a + b, 0) / rMultiples.length : 0;

    const bestTrade = trades.reduce((a: any, b: any) => parseN(a.netPnl) > parseN(b.netPnl) ? a : b);
    const worstTrade = trades.reduce((a: any, b: any) => parseN(a.netPnl) < parseN(b.netPnl) ? a : b);

    // Group by Day for Trend
    const dailyMap = new Map<string, number>();
    for (const t of trades) {
      const day = new Date(t.exitTime!).toLocaleDateString('en-US', { weekday: 'short' });
      dailyMap.set(day, (dailyMap.get(day) || 0) + parseN(t.netPnl));
    }
    const daysOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dailyPnlTrend = daysOrder.map(day => ({ date: day, pnl: dailyMap.get(day) || 0 }));

    // Session Performance (Simplified by entry hour)
    const sessions = { 'London': { pnl: 0, count: 0 }, 'New York': { pnl: 0, count: 0 }, 'Asia': { pnl: 0, count: 0 } };
    for (const t of trades) {
      const hour = new Date(t.entryTime!).getUTCHours();
      let session: keyof typeof sessions = 'Asia';
      if (hour >= 8 && hour < 14) session = 'London';
      else if (hour >= 13 && hour < 20) session = 'New York';
      
      sessions[session].pnl += parseN(t.netPnl);
      sessions[session].count++;
    }
    const sessionPerformance = Object.entries(sessions).map(([name, data]) => ({ 
      name, pnl: data.pnl, tradeCount: data.count 
    }));

    // Strategy Performance
    const strategyMap = new Map<number | string, { pnl: number, wins: number, count: number, rSum: number }>();
    for (const t of trades) {
      const key = t.playbookId || 'Untagged';
      const stats = strategyMap.get(key) || { pnl: 0, wins: 0, count: 0, rSum: 0 };
      stats.pnl += parseN(t.netPnl);
      if (parseN(t.netPnl) > 0) stats.wins++;
      stats.count++;
      stats.rSum += t.rMultiple ? parseN(t.rMultiple) : 0;
      strategyMap.set(key, stats);
    }
    const strategies = Array.from(strategyMap.entries()).map(([name, s]) => ({
      name: name === 'Untagged' ? 'General' : `System ${name}`,
      winRate: Math.round((s.wins / s.count) * 100),
      pnl: s.pnl,
      avgRR: s.count > 0 ? (s.rSum / s.count).toFixed(1) : 0
    }));

    // Risk Distribution
    const riskBuckets = { 'Low': 0, 'Med': 0, 'High': 0 };
    for (const t of trades) {
      const r = t.rMultiple ? parseN(t.rMultiple) : 0;
      if (r < 0.5) riskBuckets['Low']++;
      else if (r < 1.5) riskBuckets['Med']++;
      else riskBuckets['High']++;
    }
    const riskDistribution = Object.entries(riskBuckets).map(([risk, count]) => ({ risk, count }));

    // AI Insights (Dynamic based on real data)
    const weekInsights: string[] = [];
    if (winRate > 60) weekInsights.push(`Outstanding execution this week with a ${winRate.toFixed(1)}% win rate.`);
    if (netPnl < 0) weekInsights.push(`Drawdown detected. Focus on risk management and wait for A+ setups next week.`);
    const bestSession = sessionPerformance.reduce((a, b) => a.pnl > b.pnl ? a : b);
    if (bestSession.pnl > 0) weekInsights.push(`The ${bestSession.name} session was your primary profit driver.`);
    
    // Discipline / Mistakes
    const mistakesCount = new Map<string, number>();
    for (const t of trades) {
      const mistakes = (t as any).mistakes || [];
      mistakes.forEach((m: string) => mistakesCount.set(m, (mistakesCount.get(m) || 0) + 1));
    }
    const discipline = Array.from(mistakesCount.entries()).map(([label, count]) => ({
      label, count, impact: -100 * count, type: 'negative'
    }));

    res.json({
      netPnl,
      winRate,
      totalTrades: trades.length,
      avgRR: parseFloat(avgRR.toFixed(2)),
      expectancy,
      largestWin: Math.max(...trades.map((t: any) => parseN(t.netPnl))),
      largestLoss: Math.min(...trades.map((t: any) => parseN(t.netPnl))),
      maxDrawdown: 0, // Simplified for week
      dailyPnl: dailyPnlTrend,
      sessionPerformance,
      winLossData: [
        { name: 'Wins', value: winners.length, color: 'hsl(var(--profit))' },
        { name: 'Losses', value: losers.length, color: 'hsl(var(--loss))' },
      ],
      strategies,
      discipline,
      risk: {
         riskDistribution
      },
      aiInsights: weekInsights,
      highlights: {
        best: [mapTrade(bestTrade)],
        worst: mapTrade(worstTrade)
      },
      goals: [] // Could pull from db if implemented
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate weekly review" });
  }
});

export default router;
