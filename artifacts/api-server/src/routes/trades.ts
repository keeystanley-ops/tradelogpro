import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { tradesTable } from "@workspace/db";
import { eq, and, gte, lte, desc, sql, count } from "drizzle-orm";

const router: IRouter = Router();

function calcPnl(
  direction: string,
  quantity: number,
  entryPrice: number,
  exitPrice: number
): number {
  if (direction === "LONG") {
    return (exitPrice - entryPrice) * quantity;
  } else {
    return (entryPrice - exitPrice) * quantity;
  }
}

function calcRMultiple(
  direction: string,
  entryPrice: number,
  exitPrice: number,
  stopLoss: number | null
): number | null {
  if (!stopLoss) return null;
  const risk = Math.abs(entryPrice - stopLoss);
  if (risk === 0) return null;
  if (direction === "LONG") {
    return (exitPrice - entryPrice) / risk;
  } else {
    return (entryPrice - exitPrice) / risk;
  }
}

function mapTrade(t: any) {
  return {
    id: t.id,
    symbol: t.symbol,
    assetClass: t.assetClass,
    direction: t.direction,
    quantity: parseFloat(t.quantity),
    entryPrice: parseFloat(t.entryPrice),
    exitPrice: parseFloat(t.exitPrice),
    entryTime: t.entryTime instanceof Date ? t.entryTime.toISOString() : t.entryTime,
    exitTime: t.exitTime instanceof Date ? t.exitTime.toISOString() : t.exitTime,
    durationSeconds: t.durationSeconds,
    grossPnl: parseFloat(t.grossPnl),
    netPnl: parseFloat(t.netPnl),
    commissions: parseFloat(t.commissions),
    fees: parseFloat(t.fees),
    slippage: parseFloat(t.slippage),
    status: t.status,
    importSource: t.importSource,
    setupTag: t.setupTag,
    mistakeTag: t.mistakeTag,
    emotionTag: t.emotionTag,
    notes: t.notes,
    rating: t.rating,
    rMultiple: t.rMultiple ? parseFloat(t.rMultiple) : null,
    createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
  };
}

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = (page - 1) * limit;

    const conditions = [];

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
    if (req.query.setupTag) {
      conditions.push(eq(tradesTable.setupTag, req.query.setupTag as string));
    }
    if (req.query.symbol) {
      conditions.push(eq(tradesTable.symbol, (req.query.symbol as string).toUpperCase()));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

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

router.post("/", async (req, res) => {
  try {
    const body = req.body;
    const entry = parseFloat(body.entryPrice);
    const exit = parseFloat(body.exitPrice);
    const qty = parseFloat(body.quantity);
    const commissions = parseFloat(body.commissions) || 0;
    const fees = parseFloat(body.fees) || 0;
    const slippage = parseFloat(body.slippage) || 0;

    const grossPnl = calcPnl(body.direction, qty, entry, exit);
    const netPnl = grossPnl - commissions - fees - slippage;

    const entryTime = new Date(body.entryTime);
    const exitTime = new Date(body.exitTime);
    const durationSeconds = Math.floor((exitTime.getTime() - entryTime.getTime()) / 1000);

    const stopLoss = body.stopLoss ? parseFloat(body.stopLoss) : null;
    const rMultiple = calcRMultiple(body.direction, entry, exit, stopLoss);

    const [trade] = await db.insert(tradesTable).values({
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
      status: "CLOSED",
      importSource: "MANUAL",
      setupTag: body.setupTag || null,
      mistakeTag: body.mistakeTag || null,
      emotionTag: body.emotionTag || null,
      notes: body.notes || null,
      rating: body.rating || null,
      rMultiple: rMultiple ? rMultiple.toFixed(4) : null,
    }).returning();

    res.status(201).json(mapTrade(trade));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create trade" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [trade] = await db.select().from(tradesTable).where(eq(tradesTable.id, parseInt(req.params.id)));
    if (!trade) return res.status(404).json({ error: "Trade not found" });
    res.json(mapTrade(trade));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch trade" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const body = req.body;
    const updates: any = {};

    if (body.setupTag !== undefined) updates.setupTag = body.setupTag;
    if (body.mistakeTag !== undefined) updates.mistakeTag = body.mistakeTag;
    if (body.emotionTag !== undefined) updates.emotionTag = body.emotionTag;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.rating !== undefined) updates.rating = body.rating;

    const [trade] = await db.update(tradesTable).set(updates).where(eq(tradesTable.id, parseInt(req.params.id))).returning();
    if (!trade) return res.status(404).json({ error: "Trade not found" });
    res.json(mapTrade(trade));
  } catch (err) {
    res.status(500).json({ error: "Failed to update trade" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.delete(tradesTable).where(eq(tradesTable.id, parseInt(req.params.id)));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete trade" });
  }
});

export default router;
