import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { tradesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function parseN(v: any): number {
  return parseFloat(v) || 0;
}

interface Insight {
  id: string;
  message: string;
  detail: string | null;
  severity: "warning" | "tip" | "info" | "danger";
  tradesAffected: number;
  category: "timing" | "psychology" | "risk" | "consistency" | "performance";
  metric: string | null;
}

router.get("/insights", async (_req, res) => {
  try {
    const allTrades = await db.select().from(tradesTable).where(eq(tradesTable.status, "CLOSED"));
    if (allTrades.length < 5) {
      return res.json({ insights: [], generatedAt: new Date().toISOString() });
    }

    const insights: Insight[] = [];

    // --- TIMING INSIGHTS ---
    // Group by hour
    const byHour = new Map<number, { pnl: number; count: number; wins: number }>();
    for (const t of allTrades) {
      const dt = t.entryTime instanceof Date ? t.entryTime : new Date(t.entryTime);
      const hour = dt.getUTCHours();
      const existing = byHour.get(hour) || { pnl: 0, count: 0, wins: 0 };
      const pnl = parseN(t.netPnl);
      byHour.set(hour, { pnl: existing.pnl + pnl, count: existing.count + 1, wins: existing.wins + (pnl > 0 ? 1 : 0) });
    }

    let worstHour = -1;
    let worstHourWinRate = 100;
    let worstHourCount = 0;
    for (const [hour, v] of byHour.entries()) {
      if (v.count >= 5) {
        const wr = (v.wins / v.count) * 100;
        if (wr < worstHourWinRate) {
          worstHourWinRate = wr;
          worstHour = hour;
          worstHourCount = v.count;
        }
      }
    }

    if (worstHour >= 0 && worstHourWinRate < 40) {
      const hourLabel = worstHour > 12 ? `${worstHour - 12}PM` : `${worstHour}AM`;
      insights.push({
        id: "worst-hour",
        message: `You lose ${(100 - worstHourWinRate).toFixed(0)}% of trades taken around ${hourLabel}`,
        detail: `${worstHourCount} trades at this hour with only ${worstHourWinRate.toFixed(0)}% win rate. Consider avoiding this time window.`,
        severity: "warning",
        tradesAffected: worstHourCount,
        category: "timing",
        metric: `${worstHourWinRate.toFixed(1)}% win rate at ${hourLabel}`,
      });
    }

    // --- DAY OF WEEK ---
    const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const byDay = new Map<number, { pnl: number; count: number; wins: number }>();
    for (const t of allTrades) {
      const dt = t.entryTime instanceof Date ? t.entryTime : new Date(t.entryTime);
      const dow = dt.getUTCDay();
      const existing = byDay.get(dow) || { pnl: 0, count: 0, wins: 0 };
      const pnl = parseN(t.netPnl);
      byDay.set(dow, { pnl: existing.pnl + pnl, count: existing.count + 1, wins: existing.wins + (pnl > 0 ? 1 : 0) });
    }

    let worstDay = -1;
    let worstDayPnl = 0;
    let worstDayCount = 0;
    for (const [day, v] of byDay.entries()) {
      if (v.count >= 5 && v.pnl < worstDayPnl) {
        worstDayPnl = v.pnl;
        worstDay = day;
        worstDayCount = v.count;
      }
    }

    if (worstDay >= 0) {
      insights.push({
        id: "worst-day",
        message: `${DAYS[worstDay]} is your worst trading day (${parseN(worstDayPnl) < 0 ? "-$" + Math.abs(worstDayPnl).toFixed(0) : "$" + worstDayPnl.toFixed(0)} total)`,
        detail: `You may want to reduce size or trade fewer setups on ${DAYS[worstDay]}s.`,
        severity: "warning",
        tradesAffected: worstDayCount,
        category: "timing",
        metric: `$${worstDayPnl.toFixed(2)} on ${DAYS[worstDay]}`,
      });
    }

    // --- PSYCHOLOGY INSIGHTS ---
    // Compare confident vs fearful/greedy
    const confidentTrades = allTrades.filter(t => t.emotionTag === "Confident");
    const fearfulTrades = allTrades.filter(t => t.emotionTag === "Fearful" || t.emotionTag === "Greedy" || t.emotionTag === "Frustrated");

    if (confidentTrades.length >= 5 && fearfulTrades.length >= 5) {
      const confidentWR = confidentTrades.filter(t => parseN(t.netPnl) > 0).length / confidentTrades.length * 100;
      const emotionalWR = fearfulTrades.filter(t => parseN(t.netPnl) > 0).length / fearfulTrades.length * 100;
      if (confidentWR - emotionalWR > 10) {
        insights.push({
          id: "emotion-confident",
          message: `Your win rate is ${(confidentWR - emotionalWR).toFixed(0)}% higher when feeling Confident`,
          detail: `Confident: ${confidentWR.toFixed(1)}% win rate. Fearful/Greedy/Frustrated: ${emotionalWR.toFixed(1)}%. Only trade when your mindset is right.`,
          severity: "tip",
          tradesAffected: confidentTrades.length,
          category: "psychology",
          metric: `${confidentWR.toFixed(1)}% vs ${emotionalWR.toFixed(1)}%`,
        });
      }
    }

    // --- RISK MANAGEMENT ---
    // Check for large losers relative to winners
    const winners = allTrades.filter(t => parseN(t.netPnl) > 0);
    const losers = allTrades.filter(t => parseN(t.netPnl) < 0);

    if (winners.length >= 5 && losers.length >= 5) {
      const avgWin = winners.reduce((a, t) => a + parseN(t.netPnl), 0) / winners.length;
      const avgLoss = Math.abs(losers.reduce((a, t) => a + parseN(t.netPnl), 0)) / losers.length;

      if (avgLoss > avgWin * 1.5) {
        insights.push({
          id: "loss-size",
          message: `You're letting losers run ${(avgLoss / avgWin).toFixed(1)}x larger than your winners`,
          detail: `Avg win: $${avgWin.toFixed(2)} | Avg loss: $${avgLoss.toFixed(2)}. Consider tightening stops or taking profits quicker.`,
          severity: "danger",
          tradesAffected: losers.length,
          category: "risk",
          metric: `Avg Win: $${avgWin.toFixed(0)} / Avg Loss: $${avgLoss.toFixed(0)}`,
        });
      }
    }

    // R-Multiple check
    const tradesWithR = allTrades.filter(t => t.rMultiple !== null && t.rMultiple !== undefined);
    if (tradesWithR.length >= 10) {
      const winnerR = tradesWithR.filter(t => parseN(t.netPnl) > 0).map(t => parseN(t.rMultiple));
      const loserR = tradesWithR.filter(t => parseN(t.netPnl) < 0).map(t => parseN(t.rMultiple));
      const avgWinR = winnerR.length > 0 ? winnerR.reduce((a, b) => a + b, 0) / winnerR.length : 0;
      const avgLossR = loserR.length > 0 ? Math.abs(loserR.reduce((a, b) => a + b, 0) / loserR.length) : 0;

      if (avgWinR < 1.5 && winnerR.length >= 5) {
        insights.push({
          id: "exit-early",
          message: `You're exiting winners too early (avg ${avgWinR.toFixed(2)}R)`,
          detail: `Your winners average only ${avgWinR.toFixed(2)}R. Consider holding winners longer toward 2R or more.`,
          severity: "tip",
          tradesAffected: winnerR.length,
          category: "risk",
          metric: `Avg Winner: ${avgWinR.toFixed(2)}R`,
        });
      }
    }

    // --- CONSISTENCY ---
    // Overtrading: days with 5+ trades
    const byDateMap = new Map<string, { count: number; pnl: number }>();
    for (const t of allTrades) {
      const dt = t.entryTime instanceof Date ? t.entryTime : new Date(t.entryTime);
      const date = dt.toISOString().slice(0, 10);
      const existing = byDateMap.get(date) || { count: 0, pnl: 0 };
      byDateMap.set(date, { count: existing.count + 1, pnl: existing.pnl + parseN(t.netPnl) });
    }

    const overtradingDays = Array.from(byDateMap.values()).filter(d => d.count >= 6);
    if (overtradingDays.length >= 3) {
      const overtradingPnl = overtradingDays.reduce((a, d) => a + d.pnl, 0);
      insights.push({
        id: "overtrading",
        message: `You may be overtrading — ${overtradingDays.length} days with 6+ trades`,
        detail: `These high-volume days total ${overtradingPnl >= 0 ? "+" : ""}$${overtradingPnl.toFixed(2)} P&L. More trades ≠ more profit. Try a max 5 trades/day rule.`,
        severity: "warning",
        tradesAffected: overtradingDays.reduce((a, d) => a + d.count, 0),
        category: "consistency",
        metric: `${overtradingDays.length} days with 6+ trades`,
      });
    }

    // --- PERFORMANCE ---
    // Best vs worst setup
    const bySetup = new Map<string, { pnl: number; count: number; wins: number }>();
    for (const t of allTrades) {
      if (t.setupTag) {
        const existing = bySetup.get(t.setupTag) || { pnl: 0, count: 0, wins: 0 };
        const pnl = parseN(t.netPnl);
        bySetup.set(t.setupTag, { pnl: existing.pnl + pnl, count: existing.count + 1, wins: existing.wins + (pnl > 0 ? 1 : 0) });
      }
    }

    const setups = Array.from(bySetup.entries()).filter(([, v]) => v.count >= 5);
    if (setups.length >= 2) {
      const best = setups.reduce((a, b) => a[1].pnl > b[1].pnl ? a : b);
      const worst = setups.reduce((a, b) => a[1].pnl < b[1].pnl ? a : b);
      const bestWR = (best[1].wins / best[1].count) * 100;
      const worstWR = (worst[1].wins / worst[1].count) * 100;

      insights.push({
        id: "best-setup",
        message: `"${best[0]}" is your most profitable setup ($${best[1].pnl.toFixed(0)}, ${bestWR.toFixed(0)}% win rate)`,
        detail: `Focus more on this setup. Conversely, "${worst[0]}" is dragging performance ($${worst[1].pnl.toFixed(0)}, ${worstWR.toFixed(0)}% win rate).`,
        severity: "tip",
        tradesAffected: best[1].count,
        category: "performance",
        metric: `${bestWR.toFixed(1)}% win rate on ${best[0]}`,
      });
    }

    // Mistake frequency
    const tradesWithMistakes = allTrades.filter(t => t.mistakeTag);
    if (tradesWithMistakes.length > 0) {
      const mistakePct = (tradesWithMistakes.length / allTrades.length) * 100;
      if (mistakePct > 25) {
        const mistakeLoss = tradesWithMistakes.filter(t => parseN(t.netPnl) < 0).reduce((a, t) => a + parseN(t.netPnl), 0);
        insights.push({
          id: "mistake-rate",
          message: `${mistakePct.toFixed(0)}% of your trades have a tagged mistake`,
          detail: `Trades with mistakes lost $${Math.abs(mistakeLoss).toFixed(2)} total. Identifying and fixing your #1 mistake could significantly improve performance.`,
          severity: "warning",
          tradesAffected: tradesWithMistakes.length,
          category: "psychology",
          metric: `${mistakePct.toFixed(1)}% mistake rate`,
        });
      }
    }

    // Holding time
    const longTrades = allTrades.filter(t => t.durationSeconds > 4 * 3600);
    const shortTrades = allTrades.filter(t => t.durationSeconds <= 30 * 60);
    if (longTrades.length >= 5 && shortTrades.length >= 5) {
      const longWR = longTrades.filter(t => parseN(t.netPnl) > 0).length / longTrades.length * 100;
      const shortWR = shortTrades.filter(t => parseN(t.netPnl) > 0).length / shortTrades.length * 100;
      if (Math.abs(shortWR - longWR) > 15) {
        const betterStyle = shortWR > longWR ? "short-term trades (<30 min)" : "longer-duration trades (>4h)";
        const betterWR = Math.max(shortWR, longWR);
        insights.push({
          id: "holding-time",
          message: `You perform better on ${betterStyle} (${betterWR.toFixed(0)}% win rate)`,
          detail: `Short trades: ${shortWR.toFixed(0)}% WR. Long trades: ${longWR.toFixed(0)}% WR. Adjust your typical holding time accordingly.`,
          severity: "tip",
          tradesAffected: shortWR > longWR ? shortTrades.length : longTrades.length,
          category: "performance",
          metric: `Short WR: ${shortWR.toFixed(1)}% / Long WR: ${longWR.toFixed(1)}%`,
        });
      }
    }

    // Loss streak risk
    const sorted = allTrades.sort((a, b) => new Date(a.entryTime).getTime() - new Date(b.entryTime).getTime());
    let currentLossStreak = 0;
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (parseN(sorted[i].netPnl) <= 0) currentLossStreak++;
      else break;
    }
    if (currentLossStreak >= 3) {
      insights.push({
        id: "loss-streak",
        message: `⚠️ You're on a ${currentLossStreak}-trade loss streak`,
        detail: "Consider reducing position size, reviewing your setups, or taking a break to reset mentally.",
        severity: "danger",
        tradesAffected: currentLossStreak,
        category: "psychology",
        metric: `${currentLossStreak} consecutive losses`,
      });
    }

    res.json({ insights, generatedAt: new Date().toISOString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate insights" });
  }
});

export default router;
