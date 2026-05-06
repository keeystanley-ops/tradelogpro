import { initializeDb, db, tradesTable, assetClassEnum, directionEnum, tradeStatusEnum, importSourceEnum } from "@workspace/db";
import { subDays, subHours, formatISO } from "date-fns";

const symbols = ["AAPL", "TSLA", "NVDA", "BTC-USD", "ETH-USD", "MSFT", "GOOGL", "META"];
const tags = ["Morning Runner", "Reversal", "VWAP Bounce", "News Play", "Breakout"];
const emotions = ["Confident", "Anxious", "Neutral", "Excited", "Patient"];

async function main() {
  console.log("🌱 Starting seed...");
  await initializeDb();

  const mockTrades = [];

  for (let i = 0; i < 50; i++) {
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const direction = Math.random() > 0.5 ? "LONG" : "SHORT";
    const status = "CLOSED";
    const assetClass = symbol.includes("-") ? "CRYPTO" : "STOCK";
    
    // Random dates within last 90 days
    const entryDate = subDays(new Date(), Math.floor(Math.random() * 90));
    const entryTime = subHours(entryDate, Math.floor(Math.random() * 8));
    const exitTime = subHours(entryTime, -Math.floor(Math.random() * 4 + 1)); // 1-5 hours duration
    
    const quantity = (Math.random() * 100 + 1).toFixed(2);
    const entryPrice = (Math.random() * 500 + 10).toFixed(2);
    
    // 60% win rate
    const isWin = Math.random() < 0.6;
    const priceChange = (Math.random() * 0.05 + 0.01) * (isWin ? 1 : -1);
    const exitPrice = (parseFloat(entryPrice) * (1 + (direction === "LONG" ? priceChange : -priceChange))).toFixed(2);
    
    const grossPnl = ((parseFloat(exitPrice) - parseFloat(entryPrice)) * parseFloat(quantity) * (direction === "LONG" ? 1 : -1)).toFixed(2);
    const fees = (Math.random() * 5 + 1).toFixed(2);
    const netPnl = (parseFloat(grossPnl) - parseFloat(fees)).toFixed(2);
    
    mockTrades.push({
      symbol,
      assetClass,
      direction,
      status,
      quantity,
      entryPrice,
      exitPrice,
      entryTime,
      exitTime,
      grossPnl,
      netPnl,
      commissions: "0.00",
      fees,
      importSource: "MANUAL",
      setupTag: tags[Math.floor(Math.random() * tags.length)],
      emotionTag: emotions[Math.floor(Math.random() * emotions.length)],
      notes: "Auto-generated seed trade.",
      rating: Math.floor(Math.random() * 5) + 1,
    });
  }

  // Clear existing trades
  console.log("🧹 Cleaning old trades...");
  await db.delete(tradesTable);

  console.log("📝 Inserting mock trades...");
  await db.insert(tradesTable).values(mockTrades);

  console.log("✅ Seed complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
