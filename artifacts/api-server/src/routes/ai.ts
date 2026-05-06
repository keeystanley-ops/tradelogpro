import { Router, type IRouter } from "express";
import OpenAI from "openai";

const router: IRouter = Router();

function getGitHubModelsClient() {
  const apiKey = process.env.GITHUB_MODELS_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({
    baseURL: "https://models.inference.ai.azure.com",
    apiKey: apiKey,
  });
}

function getOpenAIClient() {
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    apiKey: apiKey,
  });
}

router.post("/summarize-note", async (req, res) => {
  try {
    const { notes, tradeContext } = req.body;
    if (!notes || notes.trim().length === 0) {
      return res.status(400).json({ error: "Notes are required" });
    }

    const contextStr = tradeContext ? `\nTrade context: ${tradeContext}` : "";
    const prompt = `You are a professional trading coach. Summarize the following journal notes in 1-2 concise sentences focusing on the key lesson and actionable takeaways.${contextStr}
    
    Journal Note: "${notes}"
    
    Respond in JSON format: { "summary": "...", "keyLesson": "..." }`;

    const client = getGitHubModelsClient() || getOpenAIClient();
    if (!client) {
      return res.status(503).json({ error: "AI services unavailable (No API keys provided)" });
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0].message.content;
    if (content) {
      const parsed = JSON.parse(content);
      return res.json({
        summary: parsed.summary,
        keyLesson: parsed.keyLesson,
      });
    }

    res.status(500).json({ error: "Failed to generate AI response" });
  } catch (err) {
    console.error("AI summarize error:", err);
    res.status(500).json({ error: "Failed to generate AI summary" });
  }
});

router.post("/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    console.log("[AI] Chat request received. Using GitHub Models.");
    
    if (!message) return res.status(400).json({ error: "Message is required" });

    const systemPrompt = "You are TradeInsight AI, a professional trading mental coach and analyst. You help traders stay disciplined, analyze their performance data, and manage risk. Be concise, supportive, and data-driven.";
    
    const client = getGitHubModelsClient() || getOpenAIClient();
    if (!client) {
      return res.status(503).json({ error: "AI services unavailable" });
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        ...(history || []).map((h: any) => ({ role: h.role, content: h.content })),
        { role: "user", content: message }
      ],
    });

    return res.json({ content: completion.choices[0].message.content });
  } catch (err) {
    console.error("AI chat error:", err);
    res.status(500).json({ error: "Failed to generate AI response" });
  }
});

export default router;
