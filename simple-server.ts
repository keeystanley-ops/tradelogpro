
import express from "express";
const app = express();
app.get("/api/healthz", (req, res) => res.json({ status: "ok" }));
const port = 3001;
app.listen(port, "0.0.0.0", () => {
  console.log(`Simple Server listening on port ${port}`);
});
