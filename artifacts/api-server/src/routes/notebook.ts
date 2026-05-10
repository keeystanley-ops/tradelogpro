import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { notebooksTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import type { AuthenticatedRequest } from "../middleware/auth";

const router: IRouter = Router();

router.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const notes = await db.select().from(notebooksTable)
      .where(eq(notebooksTable.userId, userId))
      .orderBy(desc(notebooksTable.updatedAt));
    res.json({ notes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});

router.post("/", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { title, content, folder, tags, pinned } = req.body;
    const [note] = await db.insert(notebooksTable).values({
      userId,
      title: title || "Untitled",
      content: content || "",
      folder: folder || null,
      tags: tags || [],
      pinned: pinned || false,
    }).returning();
    res.status(201).json(note);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create note" });
  }
});

router.put("/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const id = parseInt(req.params.id as string);
    const { title, content, folder, tags, pinned } = req.body;
    const [note] = await db.update(notebooksTable)
      .set({ title, content, folder, tags, pinned, updatedAt: new Date() })
      .where(and(eq(notebooksTable.id, id), eq(notebooksTable.userId, userId)))
      .returning();
    if (!note) {
      res.status(404).json({ note: "Note not found" });
      return;
    }
    res.json(note);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update note" });
  }
});

router.delete("/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const id = parseInt(req.params.id as string);
    await db.delete(notebooksTable).where(and(eq(notebooksTable.id, id), eq(notebooksTable.userId, userId)));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete note" });
  }
});

export default router;
