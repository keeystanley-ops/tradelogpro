import { Router, type IRouter } from "express";
import { db, integrationsTable, tradesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import type { AuthenticatedRequest } from "../middleware/auth";
import { SyncService } from "../services/sync-service";

const router: IRouter = Router();

// GET /api/integrations
router.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
       res.status(401).json({ error: "Unauthorized" });
       return;
    }

    const integrations = await db.select().from(integrationsTable)
      .where(eq(integrationsTable.userId, userId))
      .orderBy(desc(integrationsTable.createdAt));

    res.json({ integrations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch integrations" });
  }
});

// POST /api/integrations
router.post("/", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { provider, accountName, serverAddress, login, password } = req.body;

    // Here you would typically validate the connection with the MT4/MT5 bridge (e.g. MetaApi)
    // For now, we simulate a successful connection validation
    console.log(`[MT-Sync] Validating account ${login} on ${serverAddress}...`);

    const [integration] = await db.insert(integrationsTable).values({
      userId,
      provider,
      accountName,
      serverAddress,
      login,
      password,
      isActive: true,
      lastSyncAt: new Date(),
    }).returning();

    res.status(201).json(integration);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create integration" });
  }
});

/**
 * SYNC TRADES: This is the core logic that would pull real trades from the broker
 */
router.post("/:id/sync", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
       res.status(401).json({ error: "Unauthorized" });
       return;
    }

    const id = parseInt(req.params.id as string);
    const [integration] = await db.select().from(integrationsTable).where(
      and(eq(integrationsTable.id, id), eq(integrationsTable.userId, userId))
    );

    if (!integration) return res.status(404).json({ error: "Integration not found" });

    const result = await SyncService.syncAccount(id);

    res.json({ success: true, ...result, message: `Sync complete. ${result.imported} new trades found.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Sync failed" });
  }
});

// DELETE /api/integrations/:id
router.delete("/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const id = parseInt(req.params.id as string);
    await db.delete(integrationsTable).where(
      and(eq(integrationsTable.id, id), eq(integrationsTable.userId, userId))
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete integration" });
  }
});

export default router;
