import { Router, type IRouter } from "express";
import { db, aiStrategiesTable, aiAnalysisTable, tradesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { AIService } from "../services/ai-service";
import { AuthenticatedRequest } from "../middleware/auth";

const router: IRouter = Router();

/**
 * STRATEGY INTELLIGENCE: Upload and Parse Strategy
 */
router.post("/strategy", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { name, content, type } = req.body;
    if (!content) return res.status(400).json({ error: "Strategy content is required" });

    // AI parses the raw content into structured rules
    const structuredRules = await AIService.parseStrategy(content);

    const [strategy] = await db.insert(aiStrategiesTable).values({
      userId,
      name: name || "New Strategy",
      content,
      structuredRules,
      type: type || "MANUAL",
    }).returning();

    res.status(201).json(strategy);
  } catch (err) {
    console.error("Parse strategy error:", err);
    res.status(500).json({ error: "Failed to parse strategy" });
  }
});

router.get("/strategy", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const strategies = await db.select().from(aiStrategiesTable)
      .where(eq(aiStrategiesTable.userId, userId))
      .orderBy(desc(aiStrategiesTable.createdAt));

    res.json({ strategies });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch strategies" });
  }
});

/**
 * TRADE ANALYSIS: Trigger AI auditing for a trade
 */
router.post("/analyze-trade", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;
    const { tradeId } = req.body;
    if (!userId || !tradeId) return res.status(400).json({ error: "Trade ID is required" });

    // Fetch trade data
    const [trade] = await db.select().from(tradesTable).where(
      and(eq(tradesTable.id, tradeId), eq(tradesTable.userId, userId))
    );
    if (!trade) return res.status(404).json({ error: "Trade not found" });

    // Fetch active strategies
    const strategies = await db.select().from(aiStrategiesTable).where(
      and(eq(aiStrategiesTable.userId, userId), eq(aiStrategiesTable.isActive, true))
    );

    // Call AI Service
    const analysisResult = await AIService.analyzeTrade({
      tradeData: trade,
      strategyRules: strategies.map(s => s.structuredRules),
      emotionalContext: (trade as any).emotions,
      notes: trade.notes || "",
    });

    // Save Analysis
    const [analysis] = await db.insert(aiAnalysisTable).values({
      tradeId,
      userId,
      qualityScore: analysisResult.qualityScore,
      executionScore: analysisResult.executionScore,
      disciplineScore: analysisResult.disciplineScore,
      riskScore: analysisResult.riskScore,
      strategyAlignmentScore: analysisResult.alignmentScore,
      biggestMistake: analysisResult.biggestMistake,
      bestDecision: analysisResult.bestDecision,
      recommendations: analysisResult.recommendations,
      ruleViolations: analysisResult.violations,
      rawResponse: analysisResult,
    }).returning();

    res.json(analysis);
  } catch (err) {
    console.error("Analyze trade error:", err);
    res.status(500).json({ error: "Failed to analyze trade" });
  }
});

router.get("/analysis/:tradeId", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const [analysis] = await db.select().from(aiAnalysisTable).where(
      and(eq(aiAnalysisTable.tradeId, parseInt(req.params.tradeId)), eq(aiAnalysisTable.userId, userId))
    );

    res.json(analysis || null);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch analysis" });
  }
});

/**
 * EXISTING SUMMARIZE NOTE (Refactored)
 */
router.post("/summarize-note", async (req, res) => {
  try {
    const { notes, tradeContext } = req.body;
    if (!notes) return res.status(400).json({ error: "Notes required" });

    const prompt = `Summarize these trading notes: "${notes}". Context: ${tradeContext || "none"}. Return JSON {summary, keyLesson}.`;
    const response = await AIService.chat([
      { role: "system", content: "You are a concise trading coach. Output JSON." },
      { role: "user", content: prompt }
    ], { json: true, model: "gpt-4o-mini" });

    res.json(JSON.parse(response || "{}"));
  } catch (err) {
    res.status(500).json({ error: "AI error" });
  }
});

/**
 * CHAT (Structured & Strategy Aware)
 */
router.post("/chat", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { message, history, image } = req.body;

    // 1. Fetch user's active strategies to provide context
    const strategies = await db.select().from(aiStrategiesTable).where(
      and(eq(aiStrategiesTable.userId, userId), eq(aiStrategiesTable.isActive, true))
    );

    const strategyContext = strategies.length > 0 
      ? `Apply these strategies to your analysis: ${JSON.stringify(strategies.map(s => ({ name: s.name, rules: s.structuredRules })))}`
      : "No specific strategy rules provided. Use universal Price Action principles.";

    const systemPrompt = `You are TradeInsight AI, an elite trading coach and technical analyst. 
    STRATEGY CONTEXT: ${strategyContext}
    
    RESPONSE STYLE REQUIREMENTS:
    - Use clean, professional, and well-structured formatting similar to ChatGPT.
    - DO NOT use double asterisks (**) for bolding. Use plain text or CAPITALIZED headers for emphasis.
    - Use clear sections with spacing.
    - Use simple bullet points (-) for lists.
    - If a chart is provided, perform a deep audit based on the market structure and the user's strategy rules.
    - Focus on confluences, levels, and execution quality.`;
    
    let aiResponse;
    if (image) {
      aiResponse = await AIService.analyzeChart(image, `${message}\n\nRELEVANT STRATEGY RULES TO APPLY:\n${strategyContext}`);
    } else {
      aiResponse = await AIService.chat([
        { role: "system", content: systemPrompt },
        ...(history || []).map((h: any) => ({ role: h.role, content: h.content })),
        { role: "user", content: message }
      ]);
    }

    res.json({ content: aiResponse });
  } catch (err) {
    console.error("Chat error detail:", err);
    res.status(500).json({ error: "Chat error", details: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
