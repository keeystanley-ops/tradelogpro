import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { notebooksTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const notes = await db.select().from(notebooksTable).orderBy(desc(notebooksTable.updatedAt));
    res.json({ notes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { title, content, folder, tags, pinned } = req.body;
    const [note] = await db.insert(notebooksTable).values({
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

router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, content, folder, tags, pinned } = req.body;
    const [note] = await db.update(notebooksTable)
      .set({ title, content, folder, tags, pinned, updatedAt: new Date() })
      .where(eq(notebooksTable.id, id))
      .returning();
    if (!note) return res.status(404).json({ error: "Note not found" });
    res.json(note);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update note" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(notebooksTable).where(eq(notebooksTable.id, id));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete note" });
  }
});

export default router;
