import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, userSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";

const router: IRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || "trading-journal-secret";

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }


    console.log("Signup request payload:", { email, displayName });
    const normalizedEmail = email.toLowerCase().trim();
    
    // Restrict to Gmail
    if (!normalizedEmail.endsWith("@gmail.com")) {
      return res.status(400).json({ error: "Access Restricted: Only @gmail.com accounts are allowed for security verification." });
    }

    // Check if user exists
    console.log("Checking DB responsiveness...");
    try {
       const res = await (db as any).client.query("SELECT 1 as alive");
       console.log("DB response received:", res);
    } catch (err) {
       console.error("DB check failed:", err);
    }

    console.log("Checking if user exists in DB...");
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, normalizedEmail));
    console.log("User existence check complete. Existing:", !!existing);

    if (existing) {
      console.log("Email already in use:", normalizedEmail);
      return res.status(400).json({ error: "Email already in use" });
    }

    // Create user
    const [user] = await db.insert(usersTable).values({
      email: normalizedEmail,
      password, // In a real app, use bcrypt to hash passwords
      displayName,
    }).returning();

    if (!user) {
      throw new Error("User creation failed: Insert did not return a user record.");
    }


    // Create default settings for this user
    await db.insert(userSettingsTable).values({
      userId: user.id,
      displayName: user.displayName || "Trader",
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
    console.log("Signup successful for:", normalizedEmail);
    res.json({ user, token });
  } catch (err) {
    console.error("CRITICAL Signup error:", err);
    res.status(500).json({ 
      error: "Initialization Failure", 
      details: err instanceof Error ? err.message : String(err)
    });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = email.toLowerCase().trim();

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, normalizedEmail));
    
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ user, token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
