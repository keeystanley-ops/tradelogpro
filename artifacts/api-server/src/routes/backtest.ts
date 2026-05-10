import { Router, type IRouter } from "express";
import { db, backtestSessionsTable, tradesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import type { AuthenticatedRequest } from "../middleware/auth";
import axios from "axios";

const router: IRouter = Router();

/**
 * SESSION MANAGEMENT
 */

// GET /sessions
router.get("/sessions", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const sessions = await db
      .select()
      .from(backtestSessionsTable)
      .where(eq(backtestSessionsTable.userId, userId))
      .orderBy(desc(backtestSessionsTable.updatedAt));

    res.json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch backtest sessions" });
  }
});

// POST /sessions
router.post("/sessions", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const [session] = await db
      .insert(backtestSessionsTable)
      .values({
        userId,
        ...req.body,
        startDate: new Date(req.body.startDate),
        replayPoint: req.body.replayPoint ? new Date(req.body.replayPoint) : new Date(req.body.startDate),
      })
      .returning();

    res.status(201).json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create backtest session" });
  }
});

// GET /sessions/:id
router.get("/sessions/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const [session] = await db
      .select()
      .from(backtestSessionsTable)
      .where(
        and(
          eq(backtestSessionsTable.id, parseInt(req.params.id)),
          eq(backtestSessionsTable.userId, userId)
        )
      );

    if (!session) return res.status(404).json({ error: "Session not found" });

    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch session" });
  }
});

// PATCH /sessions/:id
router.patch("/sessions/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const updates = { ...req.body, updatedAt: new Date() };
    if (updates.startDate) updates.startDate = new Date(updates.startDate);
    if (updates.replayPoint) updates.replayPoint = new Date(updates.replayPoint);

    const [session] = await db
      .update(backtestSessionsTable)
      .set(updates)
      .where(
        and(
          eq(backtestSessionsTable.id, parseInt(req.params.id)),
          eq(backtestSessionsTable.userId, userId)
        )
      )
      .returning();

    if (!session) return res.status(404).json({ error: "Session not found" });

    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update session" });
  }
});

// DELETE /sessions/:id
router.delete("/sessions/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    await db
      .delete(backtestSessionsTable)
      .where(
        and(
          eq(backtestSessionsTable.id, parseInt(req.params.id)),
          eq(backtestSessionsTable.userId, userId)
        )
      );

    // Optionally delete associated backtest trades
    await db
      .delete(tradesTable)
      .where(
        and(
          eq(tradesTable.backtestSessionId, parseInt(req.params.id)),
          eq(tradesTable.userId, userId)
        )
      );

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete session" });
  }
});

// POST /sessions/:id/duplicate
router.post("/sessions/:id/duplicate", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const [existing] = await db
      .select()
      .from(backtestSessionsTable)
      .where(
        and(
          eq(backtestSessionsTable.id, parseInt(req.params.id)),
          eq(backtestSessionsTable.userId, userId)
        )
      );

    if (!existing) return res.status(404).json({ error: "Session not found" });

    const [newSession] = await db
      .insert(backtestSessionsTable)
      .values({
        ...existing,
        id: undefined,
        name: `${existing.name} (Copy)`,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    res.status(201).json(newSession);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to duplicate session" });
  }
});

/**
 * MARKET DATA
 */

// GET /market-data
router.get("/market-data", async (req, res) => {
  try {
    const { symbol, timeframe, start, end } = req.query;
    if (!symbol || !timeframe) {
      return res.status(400).json({ error: "Symbol and timeframe are required" });
    }

    // Determine provider based on symbol or market type
    // For MVP, we'll use Binance for Crypto and a mock for others if needed, 
    // but try to provide real data where possible.
    
    const startTime = start ? new Date(start as string).getTime() : Date.now() - 30 * 24 * 60 * 60 * 1000;
    const endTime = end ? new Date(end as string).getTime() : Date.now();

    // Map timeframes to Binance format
    const binanceTimeframes: Record<string, string> = {
      "1m": "1m", "5m": "1m", "15m": "5m", "1h": "1h", "4h": "4h", "1d": "1d", "1w": "1w"
    };
    
    // Normalize and TRIM symbol
    const rawSymbol = (symbol as string).trim().toUpperCase();
    const normalizedSymbol = rawSymbol.replace("/", "");

    try {
      console.log(`[MarketData] Fetching ${normalizedSymbol} (${timeframe}) from Binance...`);
      const response = await axios.get(`https://api.binance.com/api/v3/klines`, {
        params: {
          symbol: normalizedSymbol,
          interval: binanceTimeframes[timeframe as string] || "1h",
          startTime,
          endTime,
          limit: 1000
        }
      });

      const ohlcv = response.data.map((d: any) => ({
        time: d[0] / 1000,
        open: parseFloat(d[1]),
        high: parseFloat(d[2]),
        low: parseFloat(d[3]),
        close: parseFloat(d[4]),
        volume: parseFloat(d[5]),
      }));

      res.json(ohlcv);
    } catch (binanceErr: any) {
      console.warn(`[MarketData] Binance failed for ${normalizedSymbol}:`, binanceErr.response?.data || binanceErr.message);
      
      // Fallback for non-crypto: if symbol contains 'USD' or matches major FX/Indices, we'd need another provider.
      // For now, we'll suggest using standard crypto symbols or return a helpful error.
      res.status(404).json({ 
        error: `Could not find real-time data for "${rawSymbol}".`,
        suggestion: "Try a crypto symbol like BTCUSDT or ETHUSDT for now. We are expanding to Stocks and FX soon."
      });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch market data" });
  }
});

export default router;
