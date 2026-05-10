import OpenAI from "openai";

const GITHUB_MODELS_BASE_URL = "https://models.inference.ai.azure.com";

export interface AIAnalysisRequest {
  tradeData: any;
  strategyRules?: any;
  emotionalContext?: string[];
  notes?: string;
  chartImage?: string; // Base64
}

export class AIService {
  private static client: OpenAI | null = null;

  private static getClient(): OpenAI {
    if (this.client) return this.client;

    const apiKey = process.env.GITHUB_MODELS_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("AI API Key not configured");

    const isGithub = !!process.env.GITHUB_MODELS_API_KEY;
    
    this.client = new OpenAI({
      baseURL: isGithub ? GITHUB_MODELS_BASE_URL : process.env.OPENAI_API_BASE,
      apiKey: apiKey,
    });

    return this.client;
  }

  /**
   * Universal Chat Completion
   */
  static async chat(messages: any[], options: { model?: string; json?: boolean } = {}) {
    const client = this.getClient();
    const response = await client.chat.completions.create({
      model: options.model || "gpt-4o-mini", // Use mini as default for better reliability
      messages,
      response_format: options.json ? { type: "json_object" } : undefined,
    });

    return response.choices[0].message.content;
  }

  /**
   * Strategy Intelligence: Parse raw text into structured JSON rules
   */
  static async parseStrategy(rawContent: string) {
    const prompt = `
      You are a specialized Strategy Analyst. Convert the following trading strategy documentation into a highly structured JSON format.
      Identify:
      1. Entry Confluences (required conditions)
      2. Exit Rules (take profit, stop loss logic)
      3. Invalidation Rules
      4. Risk Rules (Max risk per trade, etc)
      5. Session/Timing Restrictions
      6. Psychological Guidelines
      
      Strategy Documentation:
      """
      ${rawContent}
      """
      
      Respond only with a JSON object.
    `;

    const response = await this.chat([
      { role: "system", content: "You are a Strategy Analysis Engine. Output JSON only." },
      { role: "user", content: prompt }
    ], { json: true });

    return JSON.parse(response || "{}");
  }

  /**
   * Trade Analysis: Auditing execution
   */
  static async analyzeTrade(data: AIAnalysisRequest) {
    const prompt = `
      Analyze this trade based on the provided data:
      Trade: ${JSON.stringify(data.tradeData)}
      Strategy Constraints: ${JSON.stringify(data.strategyRules || "None provided")}
      Psychology: ${data.emotionalContext?.join(", ") || "No emotional logs"}
      Notes: ${data.notes || "No notes"}
      
      Compare the execution against the strategy rules.
      Identify:
      - Rule violations (FOMO, Revenge, Session violation, etc)
      - Quality score (0-100)
      - Key mistakes
      - Improvement recommendations
      
      Output JSON format:
      {
        "qualityScore": number,
        "violations": string[],
        "biggestMistake": string,
        "bestDecision": string,
        "recommendations": string,
        "executionScore": number,
        "disciplineScore": number,
        "riskScore": number,
        "alignmentScore": number
      }
    `;

    const response = await this.chat([
      { role: "system", content: "You are a Professional Trading Performance Auditor. Analyze execution quality and rule adherence." },
      { role: "user", content: prompt }
    ], { json: true });

    return JSON.parse(response || "{}");
  }

  /**
   * Background Trigger: Call this from trade routes
   */
  static async triggerAnalysisForTrade(tradeId: number, userId: number) {
    console.log(`[AI] Triggering background analysis for trade ${tradeId} (User ${userId})`);
    
    // We import db dynamically to avoid circular dependencies if any
    const { db, tradesTable, aiStrategiesTable, aiAnalysisTable } = await import("@workspace/db");
    const { eq, and } = await import("drizzle-orm");

    try {
      // 1. Fetch trade
      const [trade] = await db.select().from(tradesTable).where(
        and(eq(tradesTable.id, tradeId), eq(tradesTable.userId, userId))
      );
      if (!trade || trade.status !== "CLOSED") return;

      // 2. Fetch active strategies
      const strategies = await db.select().from(aiStrategiesTable).where(
        and(eq(aiStrategiesTable.userId, userId), eq(aiStrategiesTable.isActive, true))
      );

      // 3. Run AI Analysis
      const result = await this.analyzeTrade({
        tradeData: trade,
        strategyRules: strategies.map(s => s.structuredRules),
        emotionalContext: (trade as any).emotions,
        notes: trade.notes || "",
      });

      // 4. Upsert analysis
      // First check if exists
      const [existing] = await db.select().from(aiAnalysisTable).where(
        eq(aiAnalysisTable.tradeId, tradeId)
      );

      if (existing) {
        await db.update(aiAnalysisTable).set({
          qualityScore: result.qualityScore,
          executionScore: result.executionScore,
          disciplineScore: result.disciplineScore,
          riskScore: result.riskScore,
          strategyAlignmentScore: result.alignmentScore,
          biggestMistake: result.biggestMistake,
          bestDecision: result.bestDecision,
          recommendations: result.recommendations,
          ruleViolations: result.violations,
          rawResponse: result,
        }).where(eq(aiAnalysisTable.id, existing.id));
      } else {
        await db.insert(aiAnalysisTable).values({
          tradeId,
          userId,
          qualityScore: result.qualityScore,
          executionScore: result.executionScore,
          disciplineScore: result.disciplineScore,
          riskScore: result.riskScore,
          strategyAlignmentScore: result.alignmentScore,
          biggestMistake: result.biggestMistake,
          bestDecision: result.bestDecision,
          recommendations: result.recommendations,
          ruleViolations: result.violations,
          rawResponse: result,
        });
      }
      console.log(`[AI] Background analysis completed for trade ${tradeId}`);
    } catch (err) {
      console.error("[AI] Background analysis failed:", err);
    }
  }

  /**
   * Multimodal: Analyze Chart Screenshot
   */
  static async analyzeChart(base64Image: string, context?: string) {
    const client = this.getClient();
    
    // Safety check: remove data:image/... prefix if it exists before sending to OpenAI
    const cleanBase64 = base64Image.includes("base64,") 
      ? base64Image.split("base64,")[1] 
      : base64Image;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini", // Mini now supports vision and is faster
      messages: [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: `You are a Professional Technical Analyst. Analyze this trading chart. 
              Identify:
              1. Primary Market Structure (Bullish/Bearish/Range)
              2. Key levels of Support and Resistance
              3. Significant Price Action patterns
              4. Immediate risk/reward considerations
              
              RESPONSE FORMATTING RULES:
              - Use plain text only. 
              - DO NOT use asterisks (*) or double asterisks (**) for bolding or lists.
              - Use simple headers (e.g., MARKET STRUCTURE:) and clear line breaks.
              - Use simple dashes (-) for lists.
              
              Context/Question: ${context || "General analysis requested."}` 
            },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${cleanBase64}` } }
          ],
        },
      ],
    });

    return response.choices[0].message.content;
  }
}
