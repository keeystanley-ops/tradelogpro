import { db, integrationsTable, tradesTable } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";

export class SyncService {
  /**
   * Determine the market session based on the entry time
   */
  static getMarketSession(date: Date): "ASIA" | "LONDON" | "NEW_YORK" {
    const hours = date.getUTCHours();
    if (hours >= 0 && hours < 8) return "ASIA";
    if (hours >= 8 && hours < 13) return "LONDON";
    return "NEW_YORK";
  }

  /**
   * Calculate Risk:Reward ratio based on stop loss and take profit
   */
  static calculateRR(entry: number, sl: number, tp: number, direction: string): number {
    try {
      const risk = Math.abs(entry - sl);
      const reward = Math.abs(tp - entry);
      if (risk === 0) return 0;
      return parseFloat((reward / risk).toFixed(2));
    } catch { return 0; }
  }

  /**
   * Core Sync Logic: Connects to MetaTrader and translates to Journal
   */
  static async syncAccount(integrationId: number): Promise<{ imported: number, updated: number }> {
    const [integration] = await db.select().from(integrationsTable).where(eq(integrationsTable.id, integrationId));
    if (!integration) throw new Error("Integration not found");

    console.log(`[Sync-Service] Scanning MT4/MT5 for account ${integration.login}...`);

    // SIMULATED REAL-TIME FETCH
    // In a production environment, this would call MetaApi.cloud or a WebSocket bridge
    const now = new Date();
    const mtData = [
      {
        ticketId: `MT-${Math.floor(Math.random() * 1000000)}`,
        symbol: "XAUUSD",
        direction: "LONG",
        entryPrice: 2024.50,
        exitPrice: 2042.80,
        sl: 2015.00,
        tp: 2050.00,
        qty: 0.1,
        commission: -2.50,
        swap: -0.40,
        pnl: 183.00,
        openTime: new Date(now.getTime() - 45 * 60000), // 45 mins ago
        closeTime: now,
        magic: 12345,
        timeframe: "H1"
      }
    ];

    let imported = 0;
    let updated = 0;

    for (const mt of mtData) {
      // 1. Check for duplicates using Ticket ID
      const [existing] = await db.select().from(tradesTable).where(
        and(
          eq(tradesTable.ticketId, mt.ticketId),
          eq(tradesTable.userId, integration.userId)
        )
      );

      const duration = mt.closeTime ? Math.round((mt.closeTime.getTime() - mt.openTime.getTime()) / 60000) : 0;
      const rr = this.calculateRR(mt.entryPrice, mt.sl, mt.tp, mt.direction);
      const session = this.getMarketSession(mt.openTime);

      if (!existing) {
        await db.insert(tradesTable).values({
          userId: integration.userId,
          ticketId: mt.ticketId,
          magicNumber: mt.magic,
          brokerName: integration.serverAddress?.split('-')[0] || "Unknown Broker",
          accountLogin: integration.login,
          symbol: mt.symbol,
          direction: mt.direction as any,
          status: "CLOSED",
          timeframe: mt.timeframe,
          quantity: mt.qty.toString(),
          entryPrice: mt.entryPrice.toString(),
          exitPrice: mt.exitPrice.toString(),
          stopLoss: mt.sl.toString(),
          takeProfit: mt.tp.toString(),
          commission: mt.commission.toString(),
          swap: mt.swap.toString(),
          netPnl: (mt.pnl + mt.commission + mt.swap).toString(),
          grossPnl: mt.pnl.toString(),
          entryDate: mt.openTime,
          exitDate: mt.closeTime,
          durationMinutes: duration,
          rrRatio: rr.toString(),
          marketSession: session,
          notes: `Auto-synced from MT${integration.provider.includes('5') ? '5' : '4'}`,
        });
        imported++;
      } else if (existing.status === "OPEN" && mt.closeTime) {
        // Handle trade closure updates
        await db.update(tradesTable).set({
          status: "CLOSED",
          exitPrice: mt.exitPrice.toString(),
          exitDate: mt.closeTime,
          netPnl: (mt.pnl + mt.commission + mt.swap).toString(),
          grossPnl: mt.pnl.toString(),
          durationMinutes: duration,
        }).where(eq(tradesTable.id, existing.id));
        updated++;
      }
    }

    // Update integration health
    await db.update(integrationsTable).set({ 
      lastSyncAt: new Date(),
      updatedAt: new Date()
    }).where(eq(integrationsTable.id, integrationId));

    return { imported, updated };
  }

  /**
   * Run a global sync for all active integrations
   */
  static async runGlobalSync() {
    const active = await db.select().from(integrationsTable).where(eq(integrationsTable.isActive, true));
    console.log(`[Sync-Service] Starting global sync for ${active.length} accounts...`);
    
    for (const acc of active) {
      try {
        await this.syncAccount(acc.id);
      } catch (e) {
        console.error(`[Sync-Service] Failed to sync account ${acc.id}:`, e);
      }
    }
  }
}
