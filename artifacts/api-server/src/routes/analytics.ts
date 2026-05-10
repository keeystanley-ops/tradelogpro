import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { tradesTable } from "@workspace/db";
import { and, gte, lte, sql, eq, desc } from "drizzle-orm";
import { AuthenticatedRequest } from "../middleware/auth";

const router: IRouter = Router();

function parseN(v: any): number {
  return parseFloat(v) || 0;
}

router.get("/dashboard", async (req: AuthenticatedRequest, res) => {
  try {
    console.log(`[Dashboard] Fetching analytics for user ${req.userId}...`);
    const conditions = [];
    if (req.userId) conditions.push(eq(tradesTable.userId, req.userId));
    conditions.push(eq(tradesTable.isBacktest, false));

    if (req.query.startDate) conditions.push(gte(tradesTable.entryTime, new Date(req.query.startDate as string)));
    if (req.query.endDate) conditions.push(lte(tradesTable.entryTime, new Date(req.query.endDate as string)));
    
    const where = and(...conditions);

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
    console.error("[Analytics] Error in /dashboard:", err);
    res.status(500).json({ error: "Failed to fetch dashboard analytics" });
  }
});

router.get("/equity-curve", async (req: AuthenticatedRequest, res) => {
  try {
    const conditions = [eq(tradesTable.status, "CLOSED"), eq(tradesTable.isBacktest, false)];
    if (req.userId) conditions.push(eq(tradesTable.userId, req.userId));
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
    console.error("[Analytics] Error in /equity-curve:", err);
    res.status(500).json({ error: "Failed to fetch equity curve" });
  }
});

router.get("/heatmap", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;
    const trades = await db.select().from(tradesTable).where(
      and(
        eq(tradesTable.userId, userId),
        eq(tradesTable.status, "CLOSED"),
        eq(tradesTable.isBacktest, false)
      )
    );

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

router.get("/symbols", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;
    const trades = await db.select().from(tradesTable).where(
      and(
        eq(tradesTable.userId, userId),
        eq(tradesTable.status, "CLOSED"),
        eq(tradesTable.isBacktest, false)
      )
    );

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

    const userId = req.userId;
    const trades = await db.select().from(tradesTable).where(
      and(
        eq(tradesTable.userId, userId),
        eq(tradesTable.status, "CLOSED"),
        eq(tradesTable.isBacktest, false),
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

router.get("/behavioral", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;
    const trades = await db.select().from(tradesTable).where(
      and(
        eq(tradesTable.userId, userId),
        eq(tradesTable.status, "CLOSED"),
        eq(tradesTable.isBacktest, false)
      )
    );

    // Mistake distribution (from mistakes array)
    const mistakeMap = new Map<string, { count: number; totalLoss: number }>();
    for (const t of trades) {
      const mistakes = (t as any).mistakes || [];
      for (const tag of mistakes) {
        const pnl = parseFloat(t.netPnl);
        const existing = mistakeMap.get(tag) || { count: 0, totalLoss: 0 };
        mistakeMap.set(tag, {
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

    // Emotion performance (from emotions array)
    const emotionMap = new Map<string, { pnl: number; count: number; wins: number }>();
    for (const t of trades) {
      const emotions = (t as any).emotions || [];
      for (const emotion of emotions) {
        const pnl = parseFloat(t.netPnl);
        const existing = emotionMap.get(emotion) || { pnl: 0, count: 0, wins: 0 };
        emotionMap.set(emotion, {
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

    // Setup performance (by playbookId)
    const setupMap = new Map<number, { pnl: number; count: number; wins: number; rSum: number; rCount: number }>();
    for (const t of trades) {
      if (t.playbookId) {
        const pnl = parseFloat(t.netPnl);
        const existing = setupMap.get(t.playbookId) || { pnl: 0, count: 0, wins: 0, rSum: 0, rCount: 0 };
        const rMult = t.rMultiple ? parseFloat(t.rMultiple) : null;
        setupMap.set(t.playbookId, {
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

// ─── Zella Score ──────────────────────────────────────────────────────────────
router.get("/zella-score", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;
    const conditions = [eq(tradesTable.userId, userId), eq(tradesTable.status, "CLOSED"), eq(tradesTable.isBacktest, false)];
    if (req.query.startDate) conditions.push(gte(tradesTable.entryTime, new Date(req.query.startDate as string)));
    if (req.query.endDate) conditions.push(lte(tradesTable.entryTime, new Date(req.query.endDate as string)));
    const where = and(...conditions);

    const trades = await db.select().from(tradesTable).where(where).orderBy(tradesTable.entryTime);
    const closed = trades.filter(t => t.status === "CLOSED");

    if (closed.length === 0) {
      return res.json({
        overall: 0,
        categories: { profitability: 0, consistency: 0, riskManagement: 0, discipline: 0 },
        radarAxes: { winRate: 0, avgWinLoss: 0, profitFactor: 0 },
        grade: "N/A", label: "No Data", color: "#94a3b8",
        history: []
      });
    }

    const n = closed.map(t => parseFloat(t.netPnl ?? "0"));
    const winners = closed.filter(t => parseFloat(t.netPnl ?? "0") > 0);
    const losers = closed.filter(t => parseFloat(t.netPnl ?? "0") <= 0);

    const winRate = closed.length > 0 ? (winners.length / closed.length) * 100 : 0;
    const grossProfit = winners.reduce((a, t) => a + parseFloat(t.netPnl ?? "0"), 0);
    const grossLoss = Math.abs(losers.reduce((a, t) => a + parseFloat(t.netPnl ?? "0"), 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? 10 : 0);
    const avgWin = winners.length > 0 ? grossProfit / winners.length : 0;
    const avgLoss = losers.length > 0 ? grossLoss / losers.length : 0;
    const avgWinLoss = avgLoss > 0 ? avgWin / avgLoss : (avgWin > 0 ? 5 : 0);

    // Profitability (35 pts)
    const pfScore = Math.min(15, (Math.min(profitFactor, 5) / 5) * 15);
    const winRateScore = Math.min(10, (winRate / 100) * 10);
    const avgWinLossScore = Math.min(10, (Math.min(avgWinLoss, 3) / 3) * 10);
    const profitabilityScore = Math.min(35, pfScore + winRateScore + avgWinLossScore);

    // Consistency (25 pts)
    // Group by day
    const byDay = new Map<string, { wins: number; total: number }>();
    for (const t of closed) {
      const date = (t.exitTime instanceof Date ? t.exitTime : new Date(t.exitTime)).toISOString().slice(0, 10);
      const existing = byDay.get(date) || { wins: 0, total: 0 };
      byDay.set(date, {
        wins: existing.wins + (parseFloat(t.netPnl ?? "0") > 0 ? 1 : 0),
        total: existing.total + 1
      });
    }
    const days = Array.from(byDay.values());
    const winDays = days.filter(d => d.wins / d.total > 0.5).length;
    const dayWinRate = days.length > 0 ? (winDays / days.length) * 100 : 0;
    const dayWinRateScore = Math.min(10, (dayWinRate / 100) * 10);

    // Streak score
    let maxWinStreak = 0, maxLossStreak = 0, tempW = 0, tempL = 0;
    for (const t of closed) {
      if (parseFloat(t.netPnl ?? "0") > 0) { tempW++; tempL = 0; maxWinStreak = Math.max(maxWinStreak, tempW); }
      else { tempL++; tempW = 0; maxLossStreak = Math.max(maxLossStreak, tempL); }
    }
    const streakScore = Math.min(8, Math.max(0, 8 - (maxLossStreak * 1.5) + Math.min(4, maxWinStreak * 0.5)));

    // Variance score (lower std dev relative to mean = better)
    const mean = n.reduce((a, b) => a + b, 0) / n.length;
    const std = Math.sqrt(n.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n.length);
    const cv = mean !== 0 ? std / Math.abs(mean) : 10;
    const varianceScore = Math.min(7, Math.max(0, 7 - cv * 2));

    const consistencyScore = Math.min(25, dayWinRateScore + streakScore + varianceScore);

    // Risk Management (25 pts)
    const rMultiples = closed.filter(t => t.rMultiple).map(t => parseFloat(t.rMultiple!));
    const avgR = rMultiples.length > 0 ? rMultiples.reduce((a, b) => a + b, 0) / rMultiples.length : 0;
    const avgRScore = Math.min(10, Math.max(0, (Math.min(Math.max(avgR, -2), 3) + 2) / 5 * 10));

    // Max drawdown
    let peak = 0, maxDD = 0, cumPnl = 0;
    for (const v of n) {
      cumPnl += v;
      if (cumPnl > peak) peak = cumPnl;
      maxDD = Math.max(maxDD, peak > 0 ? (peak - cumPnl) / peak : 0);
    }
    const ddScore = Math.min(8, Math.max(0, 8 - maxDD * 10));

    // Position sizing consistency (look at quantity variance)
    const quantities = closed.map(t => parseFloat(t.quantity as unknown as string));
    const qMean = quantities.reduce((a, b) => a + b, 0) / quantities.length;
    const qStd = Math.sqrt(quantities.reduce((a, b) => a + Math.pow(b - qMean, 2), 0) / quantities.length);
    const qCv = qMean !== 0 ? qStd / qMean : 1;
    const positionScore = Math.min(7, Math.max(0, 7 - qCv * 3));

    const riskScore = Math.min(25, avgRScore + ddScore + positionScore);

    // Discipline (15 pts)
    // Rule following: % trades with notes (journal completeness)
    const tradesWithNotes = closed.filter(t => t.notes && t.notes.length > 10).length;
    const notesPct = tradesWithNotes / closed.length;
    const journalScore = Math.min(5, notesPct * 5);

    // Plan adherence: % trades with playbookId
    const tradesWithSetup = closed.filter(t => t.playbookId).length;
    const setupPct = tradesWithSetup / closed.length;
    const planScore = Math.min(6, setupPct * 6);

    // Rule following: trades with rating (self-assessment)
    const tradesRated = closed.filter(t => t.rating).length;
    const ratedPct = tradesRated / closed.length;
    const ruleScore = Math.min(4, ratedPct * 4);

    const disciplineScore = Math.min(15, journalScore + planScore + ruleScore);

    const overall = Math.round(profitabilityScore + consistencyScore + riskScore + disciplineScore);

    const getGrade = (score: number) => {
      if (score >= 90) return { grade: "A+", label: "Elite", color: "#10b981" };
      if (score >= 80) return { grade: "A", label: "Excellent", color: "#10b981" };
      if (score >= 70) return { grade: "B", label: "Good", color: "#6366f1" };
      if (score >= 60) return { grade: "C", label: "Average", color: "#f59e0b" };
      if (score >= 50) return { grade: "D", label: "Below Average", color: "#f97316" };
      return { grade: "F", label: "Poor", color: "#ef4444" };
    };

    const { grade, label, color } = getGrade(overall);

    // Radar axes (0-100 scale for display)
    const radarAxes = {
      winRate: Math.min(100, winRate),
      avgWinLoss: Math.min(100, (avgWinLoss / 3) * 100),
      profitFactor: Math.min(100, (Math.min(profitFactor, 5) / 5) * 100),
    };

    res.json({
      overall,
      categories: {
        profitability: Math.round(profitabilityScore),
        consistency: Math.round(consistencyScore),
        riskManagement: Math.round(riskScore),
        discipline: Math.round(disciplineScore),
      },
      radarAxes,
      grade, label, color,
      history: [],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to calculate Zella Score" });
  }
});

// ─── Reports ──────────────────────────────────────────────────────────────────
router.get("/reports/by-symbol", async (req, res) => {
  try {
    const trades = await db.select().from(tradesTable).where(eq(tradesTable.status, "CLOSED"));
    const map = new Map<string, { pnl: number; count: number; wins: number; grossWin: number; grossLoss: number }>();
    for (const t of trades) {
      const existing = map.get(t.symbol) || { pnl: 0, count: 0, wins: 0, grossWin: 0, grossLoss: 0 };
      const pnl = parseFloat(t.netPnl ?? "0");
      map.set(t.symbol, {
        pnl: existing.pnl + pnl,
        count: existing.count + 1,
        wins: existing.wins + (pnl > 0 ? 1 : 0),
        grossWin: existing.grossWin + (pnl > 0 ? pnl : 0),
        grossLoss: existing.grossLoss + (pnl < 0 ? Math.abs(pnl) : 0),
      });
    }
    const result = Array.from(map.entries()).map(([symbol, v]) => ({
      symbol,
      netPnl: v.pnl,
      tradeCount: v.count,
      winRate: v.count > 0 ? (v.wins / v.count) * 100 : 0,
      profitFactor: v.grossLoss > 0 ? v.grossWin / v.grossLoss : (v.grossWin > 0 ? 999 : 0),
      avgPnl: v.count > 0 ? v.pnl / v.count : 0,
    })).sort((a, b) => b.netPnl - a.netPnl);
    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch symbol report" });
  }
});

router.get("/reports/by-setup", async (req, res) => {
  try {
    const trades = await db.select().from(tradesTable).where(eq(tradesTable.status, "CLOSED"));
    const map = new Map<string, { pnl: number; count: number; wins: number }>();
    for (const t of trades) {
      const key = t.playbookId ? `Playbook #${t.playbookId}` : "No Playbook";
      const existing = map.get(key) || { pnl: 0, count: 0, wins: 0 };
      const pnl = parseFloat(t.netPnl ?? "0");
      map.set(key, { pnl: existing.pnl + pnl, count: existing.count + 1, wins: existing.wins + (pnl > 0 ? 1 : 0) });
    }
    const result = Array.from(map.entries()).map(([setup, v]) => ({
      setup,
      netPnl: v.pnl,
      tradeCount: v.count,
      winRate: v.count > 0 ? (v.wins / v.count) * 100 : 0,
      avgPnl: v.count > 0 ? v.pnl / v.count : 0,
    })).sort((a, b) => b.netPnl - a.netPnl);
    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch setup report" });
  }
});

router.get("/reports/by-time", async (req, res) => {
  try {
    const trades = await db.select().from(tradesTable).where(eq(tradesTable.status, "CLOSED"));
    const byDow = new Map<number, { pnl: number; count: number; wins: number }>();
    const byHour = new Map<number, { pnl: number; count: number; wins: number }>();
    for (const t of trades) {
      const dt = t.entryTime instanceof Date ? t.entryTime : new Date(t.entryTime);
      const dow = dt.getUTCDay();
      const hour = dt.getUTCHours();
      const pnl = parseFloat(t.netPnl ?? "0");
      const existing1 = byDow.get(dow) || { pnl: 0, count: 0, wins: 0 };
      byDow.set(dow, { pnl: existing1.pnl + pnl, count: existing1.count + 1, wins: existing1.wins + (pnl > 0 ? 1 : 0) });
      const existing2 = byHour.get(hour) || { pnl: 0, count: 0, wins: 0 };
      byHour.set(hour, { pnl: existing2.pnl + pnl, count: existing2.count + 1, wins: existing2.wins + (pnl > 0 ? 1 : 0) });
    }
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const byDayOfWeek = Array.from({ length: 7 }, (_, i) => {
      const v = byDow.get(i) || { pnl: 0, count: 0, wins: 0 };
      return { day: days[i], netPnl: v.pnl, tradeCount: v.count, winRate: v.count > 0 ? (v.wins / v.count) * 100 : 0 };
    });
    const byHourOfDay = Array.from({ length: 24 }, (_, i) => {
      const v = byHour.get(i) || { pnl: 0, count: 0, wins: 0 };
      return { hour: i, netPnl: v.pnl, tradeCount: v.count, winRate: v.count > 0 ? (v.wins / v.count) * 100 : 0 };
    });
    res.json({ byDayOfWeek, byHourOfDay });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch time report" });
  }
});

router.get("/reports/streaks", async (req, res) => {
  try {
    const userId = (req as any).userId;
    const trades = await db.select().from(tradesTable).where(
      and(
        eq(tradesTable.userId, userId),
        eq(tradesTable.status, "CLOSED"),
        eq(tradesTable.isBacktest, false)
      )
    ).orderBy(tradesTable.exitTime);
    const streaks: { type: "WIN" | "LOSS"; length: number; startIdx: number; endIdx: number }[] = [];
    let i = 0;
    while (i < trades.length) {
      const isWin = parseFloat(trades[i].netPnl ?? "0") > 0;
      let j = i;
      while (j < trades.length && (parseFloat(trades[j].netPnl ?? "0") > 0) === isWin) j++;
      streaks.push({ type: isWin ? "WIN" : "LOSS", length: j - i, startIdx: i, endIdx: j - 1 });
      i = j;
    }
    const current = streaks[streaks.length - 1] || { type: "NONE", length: 0 };
    const longestWin = Math.max(0, ...streaks.filter(s => s.type === "WIN").map(s => s.length));
    const longestLoss = Math.max(0, ...streaks.filter(s => s.type === "LOSS").map(s => s.length));
    res.json({ currentStreak: current.length, currentStreakType: current.type, longestWinStreak: longestWin, longestLossStreak: longestLoss, streaks });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch streaks report" });
  }
});

export default router;
