import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { tradesTable } from "@workspace/db";
import { and, gte, lte, sql, eq, desc } from "drizzle-orm";

const router: IRouter = Router();

function parseN(v: any): number {
  return parseFloat(v) || 0;
}

router.get("/dashboard", async (req, res) => {
  try {
    const conditions = [];
    if (req.query.startDate) conditions.push(gte(tradesTable.entryTime, new Date(req.query.startDate as string)));
    if (req.query.endDate) conditions.push(lte(tradesTable.entryTime, new Date(req.query.endDate as string)));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const trades = await db.select().from(tradesTable).where(where).orderBy(tradesTable.entryTime);

    const closed = trades.filter(t => t.status === "CLOSED");
    if (closed.length === 0) {
      return res.json({
        netPnl: 0, grossPnl: 0, totalTrades: 0, winningTrades: 0, losingTrades: 0,
        winRate: 0, profitFactor: 0, avgWin: 0, avgLoss: 0, expectancy: 0,
        maxDrawdown: 0, maxDrawdownPct: 0, avgHoldingMinutes: 0,
        currentStreak: 0, currentStreakType: "NONE", longestWinStreak: 0, longestLossStreak: 0,
        totalCommissions: 0, sharpeRatio: 0
      });
    }

    const netPnlValues = closed.map(t => parseN(t.netPnl));
    const grossPnlValues = closed.map(t => parseN(t.grossPnl));

    const netPnl = netPnlValues.reduce((a, b) => a + b, 0);
    const grossPnl = grossPnlValues.reduce((a, b) => a + b, 0);
    const totalCommissions = closed.reduce((a, t) => a + parseN(t.commissions) + parseN(t.fees), 0);

    const winners = closed.filter(t => parseN(t.netPnl) > 0);
    const losers = closed.filter(t => parseN(t.netPnl) <= 0);

    const winRate = closed.length > 0 ? (winners.length / closed.length) * 100 : 0;

    const grossProfit = winners.reduce((a, t) => a + parseN(t.netPnl), 0);
    const grossLoss = Math.abs(losers.reduce((a, t) => a + parseN(t.netPnl), 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;

    const avgWin = winners.length > 0 ? grossProfit / winners.length : 0;
    const avgLoss = losers.length > 0 ? grossLoss / losers.length : 0;

    const winPct = winRate / 100;
    const lossPct = 1 - winPct;
    const expectancy = (winPct * avgWin) - (lossPct * avgLoss);

    // Max drawdown
    let peak = 0;
    let maxDrawdown = 0;
    let maxDrawdownPct = 0;
    let cumPnl = 0;
    for (const v of netPnlValues) {
      cumPnl += v;
      if (cumPnl > peak) peak = cumPnl;
      const dd = peak - cumPnl;
      if (dd > maxDrawdown) {
        maxDrawdown = dd;
        maxDrawdownPct = peak > 0 ? (dd / peak) * 100 : 0;
      }
    }

    // Avg holding
    const avgHoldingMinutes = closed.reduce((a, t) => a + t.durationSeconds, 0) / closed.length / 60;

    // Streaks
    let currentStreak = 0;
    let currentStreakType: "WIN" | "LOSS" | "NONE" = "NONE";
    let longestWinStreak = 0;
    let longestLossStreak = 0;
    let tempWin = 0;
    let tempLoss = 0;

    for (let i = 0; i < closed.length; i++) {
      const pnl = parseN(closed[i].netPnl);
      if (pnl > 0) {
        tempWin++;
        tempLoss = 0;
        longestWinStreak = Math.max(longestWinStreak, tempWin);
      } else {
        tempLoss++;
        tempWin = 0;
        longestLossStreak = Math.max(longestLossStreak, tempLoss);
      }
    }

    // Current streak from end
    const lastTrade = closed[closed.length - 1];
    if (lastTrade) {
      const isWin = parseN(lastTrade.netPnl) > 0;
      currentStreakType = isWin ? "WIN" : "LOSS";
      let i = closed.length - 1;
      while (i >= 0 && (parseN(closed[i].netPnl) > 0) === isWin) {
        currentStreak++;
        i--;
      }
    }

    // Sharpe ratio (simplified daily returns)
    const mean = netPnlValues.reduce((a, b) => a + b, 0) / netPnlValues.length;
    const variance = netPnlValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / netPnlValues.length;
    const std = Math.sqrt(variance);
    const sharpeRatio = std > 0 ? (mean / std) * Math.sqrt(252) : 0;

    res.json({
      netPnl, grossPnl, totalTrades: closed.length,
      winningTrades: winners.length, losingTrades: losers.length,
      winRate, profitFactor, avgWin, avgLoss, expectancy,
      maxDrawdown, maxDrawdownPct, avgHoldingMinutes,
      currentStreak, currentStreakType, longestWinStreak, longestLossStreak,
      totalCommissions, sharpeRatio
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch dashboard analytics" });
  }
});

router.get("/equity-curve", async (req, res) => {
  try {
    const conditions = [eq(tradesTable.status, "CLOSED")];
    if (req.query.startDate) conditions.push(gte(tradesTable.entryTime, new Date(req.query.startDate as string)));
    if (req.query.endDate) conditions.push(lte(tradesTable.entryTime, new Date(req.query.endDate as string)));

    const trades = await db.select().from(tradesTable).where(and(...conditions)).orderBy(tradesTable.exitTime);

    // Group by date
    const byDate = new Map<string, { pnl: number; count: number }>();
    for (const t of trades) {
      const date = (t.exitTime instanceof Date ? t.exitTime : new Date(t.exitTime)).toISOString().slice(0, 10);
      const existing = byDate.get(date) || { pnl: 0, count: 0 };
      byDate.set(date, { pnl: existing.pnl + parseFloat(t.netPnl), count: existing.count + 1 });
    }

    const sortedDates = Array.from(byDate.keys()).sort();
    let cumPnl = 0;
    let peak = 0;
    const points = sortedDates.map(date => {
      const { pnl, count } = byDate.get(date)!;
      cumPnl += pnl;
      if (cumPnl > peak) peak = cumPnl;
      const drawdown = Math.max(0, peak - cumPnl);
      const drawdownPct = peak > 0 ? (drawdown / peak) * 100 : 0;
      return { date, cumulativePnl: cumPnl, drawdown, drawdownPct, dailyPnl: pnl, tradeCount: count };
    });

    res.json({ points, startingBalance: 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch equity curve" });
  }
});

router.get("/heatmap", async (req, res) => {
  try {
    const trades = await db.select().from(tradesTable).where(eq(tradesTable.status, "CLOSED"));

    // hour 0-23, dayOfWeek 0-6 (0=Sunday)
    const grid = new Map<string, { pnl: number; count: number; wins: number }>();

    for (const t of trades) {
      const dt = t.entryTime instanceof Date ? t.entryTime : new Date(t.entryTime);
      const hour = dt.getUTCHours();
      const dow = dt.getUTCDay();
      const key = `${hour}-${dow}`;
      const existing = grid.get(key) || { pnl: 0, count: 0, wins: 0 };
      const pnl = parseFloat(t.netPnl);
      grid.set(key, { pnl: existing.pnl + pnl, count: existing.count + 1, wins: existing.wins + (pnl > 0 ? 1 : 0) });
    }

    const cells = Array.from(grid.entries()).map(([key, v]) => {
      const [hour, dow] = key.split("-").map(Number);
      return {
        hour,
        dayOfWeek: dow,
        pnl: v.pnl,
        tradeCount: v.count,
        winRate: v.count > 0 ? (v.wins / v.count) * 100 : 0,
      };
    });

    res.json({ cells });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch heatmap" });
  }
});

router.get("/symbols", async (req, res) => {
  try {
    const trades = await db.select().from(tradesTable).where(eq(tradesTable.status, "CLOSED"));

    const bySymbol = new Map<string, { pnl: number; count: number; wins: number }>();
    for (const t of trades) {
      const existing = bySymbol.get(t.symbol) || { pnl: 0, count: 0, wins: 0 };
      const pnl = parseFloat(t.netPnl);
      bySymbol.set(t.symbol, { pnl: existing.pnl + pnl, count: existing.count + 1, wins: existing.wins + (pnl > 0 ? 1 : 0) });
    }

    const symbols = Array.from(bySymbol.entries()).map(([symbol, v]) => ({
      symbol,
      netPnl: v.pnl,
      tradeCount: v.count,
      winRate: v.count > 0 ? (v.wins / v.count) * 100 : 0,
      avgPnl: v.count > 0 ? v.pnl / v.count : 0,
    })).sort((a, b) => b.netPnl - a.netPnl);

    const topWinners = symbols.slice(0, 5);
    const topLosers = [...symbols].sort((a, b) => a.netPnl - b.netPnl).slice(0, 5);

    res.json({ symbols, topWinners, topLosers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch symbol performance" });
  }
});

router.get("/calendar", async (req, res) => {
  try {
    const now = new Date();
    const year = parseInt(req.query.year as string) || now.getFullYear();
    const month = parseInt(req.query.month as string) || (now.getMonth() + 1);

    const startDate = new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00Z`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const trades = await db.select().from(tradesTable).where(
      and(
        eq(tradesTable.status, "CLOSED"),
        gte(tradesTable.exitTime, startDate),
        lte(tradesTable.exitTime, endDate)
      )
    );

    const byDate = new Map<string, { pnl: number; count: number }>();
    for (const t of trades) {
      const dt = t.exitTime instanceof Date ? t.exitTime : new Date(t.exitTime);
      const date = dt.toISOString().slice(0, 10);
      const existing = byDate.get(date) || { pnl: 0, count: 0 };
      byDate.set(date, { pnl: existing.pnl + parseFloat(t.netPnl), count: existing.count + 1 });
    }

    const days = Array.from(byDate.entries()).map(([date, v]) => ({
      date,
      netPnl: v.pnl,
      tradeCount: v.count,
      isWinDay: v.pnl > 0,
    }));

    const monthlyNetPnl = days.reduce((a, d) => a + d.netPnl, 0);
    const winDays = days.filter(d => d.isWinDay).length;
    const lossDays = days.filter(d => !d.isWinDay).length;

    res.json({ days, monthlyNetPnl, tradingDays: days.length, winDays, lossDays });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch calendar data" });
  }
});

router.get("/behavioral", async (req, res) => {
  try {
    const trades = await db.select().from(tradesTable).where(eq(tradesTable.status, "CLOSED"));

    // Mistake distribution
    const mistakeMap = new Map<string, { count: number; totalLoss: number }>();
    for (const t of trades) {
      if (t.mistakeTag) {
        const pnl = parseFloat(t.netPnl);
        const existing = mistakeMap.get(t.mistakeTag) || { count: 0, totalLoss: 0 };
        mistakeMap.set(t.mistakeTag, {
          count: existing.count + 1,
          totalLoss: existing.totalLoss + (pnl < 0 ? Math.abs(pnl) : 0),
        });
      }
    }
    const totalMistakeTrades = Array.from(mistakeMap.values()).reduce((a, v) => a + v.count, 0);
    const mistakeDistribution = Array.from(mistakeMap.entries()).map(([tag, v]) => ({
      tag,
      count: v.count,
      totalLoss: v.totalLoss,
      percentage: totalMistakeTrades > 0 ? (v.count / totalMistakeTrades) * 100 : 0,
    })).sort((a, b) => b.count - a.count);

    // Emotion performance
    const emotionMap = new Map<string, { pnl: number; count: number; wins: number }>();
    for (const t of trades) {
      if (t.emotionTag) {
        const pnl = parseFloat(t.netPnl);
        const existing = emotionMap.get(t.emotionTag) || { pnl: 0, count: 0, wins: 0 };
        emotionMap.set(t.emotionTag, {
          pnl: existing.pnl + pnl,
          count: existing.count + 1,
          wins: existing.wins + (pnl > 0 ? 1 : 0),
        });
      }
    }
    const emotionPerformance = Array.from(emotionMap.entries()).map(([emotion, v]) => ({
      emotion,
      netPnl: v.pnl,
      tradeCount: v.count,
      winRate: v.count > 0 ? (v.wins / v.count) * 100 : 0,
    }));

    // Setup performance
    const setupMap = new Map<string, { pnl: number; count: number; wins: number; rSum: number; rCount: number }>();
    for (const t of trades) {
      if (t.setupTag) {
        const pnl = parseFloat(t.netPnl);
        const existing = setupMap.get(t.setupTag) || { pnl: 0, count: 0, wins: 0, rSum: 0, rCount: 0 };
        const rMult = t.rMultiple ? parseFloat(t.rMultiple) : null;
        setupMap.set(t.setupTag, {
          pnl: existing.pnl + pnl,
          count: existing.count + 1,
          wins: existing.wins + (pnl > 0 ? 1 : 0),
          rSum: existing.rSum + (rMult ?? 0),
          rCount: existing.rCount + (rMult !== null ? 1 : 0),
        });
      }
    }
    const setupPerformance = Array.from(setupMap.entries()).map(([setup, v]) => ({
      setup,
      netPnl: v.pnl,
      tradeCount: v.count,
      winRate: v.count > 0 ? (v.wins / v.count) * 100 : 0,
      avgRMultiple: v.rCount > 0 ? v.rSum / v.rCount : 0,
    })).sort((a, b) => b.netPnl - a.netPnl);

    // Asset class performance
    const assetMap = new Map<string, { pnl: number; count: number; wins: number }>();
    for (const t of trades) {
      const existing = assetMap.get(t.assetClass) || { pnl: 0, count: 0, wins: 0 };
      const pnl = parseFloat(t.netPnl);
      assetMap.set(t.assetClass, {
        pnl: existing.pnl + pnl,
        count: existing.count + 1,
        wins: existing.wins + (pnl > 0 ? 1 : 0),
      });
    }
    const assetClassPerformance = Array.from(assetMap.entries()).map(([assetClass, v]) => ({
      assetClass,
      netPnl: v.pnl,
      tradeCount: v.count,
      winRate: v.count > 0 ? (v.wins / v.count) * 100 : 0,
    }));

    res.json({ mistakeDistribution, emotionPerformance, setupPerformance, assetClassPerformance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch behavioral analytics" });
  }
});

export default router;
