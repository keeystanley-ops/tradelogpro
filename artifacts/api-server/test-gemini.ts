import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("API Key found:", apiKey ? "Yes" : "No");
  if (!apiKey) return;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hello! Repeat 'Gemini is linked' back to me.");
    const response = await result.response;
    console.log("Response:", response.text());
  } catch (err) {
    console.error("Gemini Test Error:", err);
  }
}

test();
