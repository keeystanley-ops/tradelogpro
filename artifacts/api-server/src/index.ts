import { initializeDb } from "@workspace/db";
import app from "./app";

const rawPort = process.env["PORT"] ?? "3001";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Initialize DB then start server
console.log("Starting server initialization...");
initializeDb().then(() => {
  console.log("Database connection established.");
  const server = app.listen(port, "0.0.0.0", () => {
    console.log(`Server listening on port ${port}`);
  });
  
  server.on("error", (err) => {
    console.error("Server error:", err);
    process.exit(1);
  });

  // Keep process alive explicitly if needed
  setInterval(() => {
    if (server.listening) {
       // Just a heartbeat
    }
  }, 60000);
}).catch((err) => {
  console.error("Failed to initialize database:", err);
  process.exit(1);
});

