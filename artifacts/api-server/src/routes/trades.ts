import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { tradesTable } from "@workspace/db";
import { eq, and, gte, lte, desc, count } from "drizzle-orm";
import type { AuthenticatedRequest } from "../middleware/auth";

const router: IRouter = Router();

/**
 * HELPERS
 */
function parseN(v: any): number {
  return parseFloat(v) || 0;
}

function calcPnl(direction: string, qty: number, entry: number, exit: number) {
  return direction === "LONG"
    ? (exit - entry) * qty
    : (entry - exit) * qty;
}

function calcRMultiple(direction: string, entry: number, exit: number, stopLoss: number | null) {
  if (!stopLoss) return null;
  const risk = Math.abs(entry - stopLoss);
  if (risk === 0) return null;

  return direction === "LONG"
    ? (exit - entry) / risk
    : (entry - exit) / risk;
}

/**
 * RESPONSE MAPPER
 */
function mapTrade(t: any) {
  return {
    id: t.id,
    playbookId: t.playbookId,

    symbol: t.symbol,
    assetClass: t.assetClass,
    direction: t.direction,

    quantity: parseN(t.quantity),
    entryPrice: parseN(t.entryPrice),
    exitPrice: parseN(t.exitPrice),

    entryTime: t.entryTime?.toISOString?.() || t.entryTime,
    exitTime: t.exitTime?.toISOString?.() || t.exitTime,

    durationSeconds: t.durationSeconds,

    grossPnl: parseN(t.grossPnl),
    netPnl: parseN(t.netPnl),

    commissions: parseN(t.commissions),
    fees: parseN(t.fees),
    slippage: parseN(t.slippage),

    stopLoss: t.stopLoss ? parseN(t.stopLoss) : null,
    rMultiple: t.rMultiple ? parseN(t.rMultiple) : null,

    status: t.status,
    importSource: t.importSource,

    // 🔥 NEW BEHAVIOR FIELDS
    followedRules: t.followedRules,
    mistakes: t.mistakes || [],
    emotions: t.emotions || [],
    grade: t.grade,

    notes: t.notes,
    rating: t.rating,

    createdAt: t.createdAt?.toISOString?.() || t.createdAt,
  };
}

/**
 * GET TRADES
 */
router.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = (page - 1) * limit;

    const conditions = [eq(tradesTable.userId, userId)];

    if (req.query.startDate) {
      conditions.push(gte(tradesTable.entryTime, new Date(req.query.startDate as string)));
    }
    if (req.query.endDate) {
      conditions.push(lte(tradesTable.entryTime, new Date(req.query.endDate as string)));
    }
    if (req.query.assetClass) {
      conditions.push(eq(tradesTable.assetClass, req.query.assetClass as any));
    }
    if (req.query.direction) {
      conditions.push(eq(tradesTable.direction, req.query.direction as any));
    }
    if (req.query.status) {
      conditions.push(eq(tradesTable.status, req.query.status as any));
    }
    if (req.query.playbookId) {
      conditions.push(eq(tradesTable.playbookId, parseInt(req.query.playbookId as string)));
    }
    if (req.query.symbol) {
      conditions.push(eq(tradesTable.symbol, (req.query.symbol as string).toUpperCase()));
    }

    const where = and(...conditions);

    const [trades, totalResult] = await Promise.all([
      db.select().from(tradesTable).where(where).orderBy(desc(tradesTable.entryTime)).limit(limit).offset(offset),
      db.select({ count: count() }).from(tradesTable).where(where),
    ]);

    res.json({
      trades: trades.map(mapTrade),
      total: totalResult[0].count,
      page,
      limit,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch trades" });
  }
});

/**
 * CREATE TRADE
 */
router.post("/", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const body = req.body;

    const entry = parseN(body.entryPrice);
    const exit = parseN(body.exitPrice);
    const qty = parseN(body.quantity);

    const commissions = parseN(body.commissions);
    const fees = parseN(body.fees);
    const slippage = parseN(body.slippage);

    const grossPnl = calcPnl(body.direction, qty, entry, exit);
    const netPnl = grossPnl - commissions - fees - slippage;

    const entryTime = new Date(body.entryTime);
    const exitTime = new Date(body.exitTime);

    const durationSeconds = Math.floor((exitTime.getTime() - entryTime.getTime()) / 1000);

    const stopLoss = body.stopLoss ? parseN(body.stopLoss) : null;
    const rMultiple = calcRMultiple(body.direction, entry, exit, stopLoss);

    const [trade] = await db.insert(tradesTable).values({
      userId,

      // 🔥 RELATION FIX
      playbookId: body.playbookId || null,

      symbol: body.symbol.toUpperCase(),
      assetClass: body.assetClass,
      direction: body.direction,

      quantity: qty.toString(),
      entryPrice: entry.toString(),
      exitPrice: exit.toString(),

      entryTime,
      exitTime,
      durationSeconds,

      grossPnl: grossPnl.toFixed(4),
      netPnl: netPnl.toFixed(4),

      commissions: commissions.toFixed(4),
      fees: fees.toFixed(4),
      slippage: slippage.toFixed(4),

      stopLoss: stopLoss ? stopLoss.toString() : null,
      rMultiple: rMultiple ? rMultiple.toFixed(4) : null,

      status: "CLOSED",
      importSource: "MANUAL",

      // 🔥 NEW FIELDS
      followedRules: body.followedRules ?? false,
      mistakes: body.mistakes || [],
      emotions: body.emotions || [],
      grade: body.grade || null,

      notes: body.notes || null,
      rating: body.rating || null,
    }).returning();

    res.status(201).json(mapTrade(trade));

  } catch (err) {
    console.error("TRADE CREATION ERROR:", err);
    res.status(500).json({ error: "Failed to create trade" });
  }
});

/**
 * UPDATE TRADE
 */
router.patch("/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const body = req.body;
    const updates: any = {};

    if (body.playbookId !== undefined) updates.playbookId = body.playbookId;

    if (body.followedRules !== undefined) updates.followedRules = body.followedRules;
    if (body.mistakes !== undefined) updates.mistakes = body.mistakes;
    if (body.emotions !== undefined) updates.emotions = body.emotions;
    if (body.grade !== undefined) updates.grade = body.grade;

    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.rating !== undefined) updates.rating = body.rating;

    const [trade] = await db.update(tradesTable).set(updates).where(
      and(eq(tradesTable.id, parseInt(req.params.id)), eq(tradesTable.userId, userId))
    ).returning();

    if (!trade) return res.status(404).json({ error: "Trade not found" });

    res.json(mapTrade(trade));

  } catch (err) {
    res.status(500).json({ error: "Failed to update trade" });
  }
});

/**
 * DELETE TRADE
 */
router.delete("/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    await db.delete(tradesTable).where(
      and(eq(tradesTable.id, parseInt(req.params.id)), eq(tradesTable.userId, userId))
    );

    res.status(204).send();

  } catch (err) {
    res.status(500).json({ error: "Failed to delete trade" });
  }
});

export default router;