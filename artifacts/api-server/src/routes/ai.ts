import { Router, type IRouter } from "express";
import OpenAI from "openai";

const router: IRouter = Router();

function getClient() {
  return new OpenAI({
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY || "placeholder",
  });
}

router.post("/summarize-note", async (req, res) => {
  try {
    const { notes, tradeContext } = req.body;
    if (!notes || notes.trim().length === 0) {
      return res.status(400).json({ error: "Notes are required" });
    }

    const contextStr = tradeContext ? `\nTrade context: ${tradeContext}` : "";
    const prompt = `You are a trading coach reviewing a trader's journal notes. Summarize the following trade note in 1-2 concise sentences focusing on the key lesson learned and what the trader should do differently next time.${contextStr}

Journal note: "${notes}"

Respond with JSON: { "summary": "<1-2 sentence summary>", "keyLesson": "<1 actionable takeaway>" }`;

    const client = getClient();
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 200,
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      return res.status(500).json({ error: "AI returned empty response" });
    }

    const parsed = JSON.parse(content);
    res.json({
      summary: parsed.summary || "No summary available.",
      keyLesson: parsed.keyLesson || "Review your notes for key lessons.",
    });
  } catch (err) {
    console.error("AI summarize error:", err);
    res.status(500).json({ error: "Failed to generate AI summary" });
  }
});

export default router;
