import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { userSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { AuthenticatedRequest } from "../middleware/auth";

const router: IRouter = Router();

// GET /api/settings - Get current user settings
router.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    let [settings] = await db.select().from(userSettingsTable).where(eq(userSettingsTable.userId, userId));
    
    if (!settings) {
      // Create default settings if they somehow don't exist (fail-safe)
      [settings] = await db.insert(userSettingsTable).values({ userId }).returning();
    }
    
    return res.json(settings);
  } catch (err) {
    console.error("Failed to fetch settings:", err);
    return res.status(500).json({ error: "Failed to fetch settings" });
  }
});

// PATCH /api/settings - Update current user settings
router.patch("/", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const body = req.body;
    const updates: Record<string, any> = {};

    // Profile fields
    if (body.displayName !== undefined) updates.displayName = body.displayName;
    if (body.email !== undefined) updates.email = body.email;
    if (body.avatarUrl !== undefined) updates.avatarUrl = body.avatarUrl;
    if (body.timezone !== undefined) updates.timezone = body.timezone;

    // Trading preferences
    if (body.defaultAssetClass !== undefined) updates.defaultAssetClass = body.defaultAssetClass;
    if (body.defaultCurrency !== undefined) updates.defaultCurrency = body.defaultCurrency;
    if (body.startingBalance !== undefined) updates.startingBalance = body.startingBalance.toString();
    if (body.riskPerTrade !== undefined) updates.riskPerTrade = body.riskPerTrade.toString();
    if (body.maxDailyLoss !== undefined) updates.maxDailyLoss = body.maxDailyLoss?.toString() || null;
    if (body.maxDailyTrades !== undefined) updates.maxDailyTrades = body.maxDailyTrades;

    // Display preferences
    if (body.theme !== undefined) updates.theme = body.theme;
    if (body.compactMode !== undefined) updates.compactMode = body.compactMode;
    if (body.showPnlInPercent !== undefined) updates.showPnlInPercent = body.showPnlInPercent;

    // Notifications
    if (body.emailNotifications !== undefined) updates.emailNotifications = body.emailNotifications;
    if (body.dailySummary !== undefined) updates.dailySummary = body.dailySummary;
    if (body.weeklyReport !== undefined) updates.weeklyReport = body.weeklyReport;
    if (body.tradeAlerts !== undefined) updates.tradeAlerts = body.tradeAlerts;

    updates.updatedAt = new Date();

    const [settings] = await db
      .update(userSettingsTable)
      .set(updates)
      .where(eq(userSettingsTable.userId, userId))
      .returning();

    if (!settings) {
        // Create if missing
        const [news] = await db.insert(userSettingsTable).values({ ...updates, userId }).returning();
        return res.json(news);
    }

    return res.json(settings);
  } catch (err) {
    console.error("Failed to update settings:", err);
    return res.status(500).json({ error: "Failed to update settings" });
  }
});

// POST /api/settings/reset - Reset settings to defaults for current user
router.post("/reset", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    await db.delete(userSettingsTable).where(eq(userSettingsTable.userId, userId));
    const [settings] = await db.insert(userSettingsTable).values({ userId }).returning();
    return res.json(settings);
  } catch (err) {
    console.error("Failed to reset settings:", err);
    return res.status(500).json({ error: "Failed to reset settings" });
  }
});

export default router;
