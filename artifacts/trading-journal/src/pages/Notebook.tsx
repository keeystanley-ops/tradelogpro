import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Plus, Search, Trash2, Pin, PinOff, FileText, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const API = "/api";

interface Note {
  id: number;
  title: string;
  content: string;
  folder: string | null;
  tags: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

function useNotes() {
  return useQuery<{ notes: Note[] }>({
    queryKey: ["notes"],
    queryFn: () => fetch(`${API}/notebook`).then(r => r.json()),
  });
}

export default function Notebook() {
  const { data, isLoading } = useNotes();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [search, setSearch] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const createMutation = useMutation({
    mutationFn: (body: Partial<Note>) => fetch(`${API}/notebook`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["notes"] }); toast({ title: "Note created" }); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }: Partial<Note> & { id: number }) => fetch(`${API}/notebook/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json()),
    onSuccess: (updated) => { queryClient.invalidateQueries({ queryKey: ["notes"] }); setSelectedNote(updated); toast({ title: "Note saved" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetch(`${API}/notebook/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["notes"] }); setSelectedNote(null); toast({ title: "Note deleted" }); },
  });

  const notes = data?.notes || [];
  const filtered = notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.content.toLowerCase().includes(search.toLowerCase())
  );
  const pinned = filtered.filter(n => n.pinned);
  const unpinned = filtered.filter(n => !n.pinned);

  const handleSelect = (note: Note) => {
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setIsEditing(false);
  };

  const handleNew = () => {
    createMutation.mutate({ title: "Untitled Note", content: "", pinned: false });
  };

  const handleSave = () => {
    if (!selectedNote) return;
    updateMutation.mutate({ id: selectedNote.id, title: editTitle, content: editContent });
    setIsEditing(false);
  };

  const handlePin = (note: Note) => {
    updateMutation.mutate({ id: note.id, title: note.title, content: note.content, pinned: !note.pinned });
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Notebook</h1>
        <p className="text-muted-foreground mt-1 text-lg">Capture trading notes, ideas, and observations.</p>
      </div>

      <div className="flex gap-6 h-[600px]">
        {/* Sidebar */}
        <div className="w-72 flex flex-col glass-panel rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search notes..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <Button onClick={handleNew} size="sm" className="w-full gap-2" disabled={createMutation.isPending}>
              <Plus className="w-4 h-4" />
              New Note
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {isLoading && <div className="p-4 text-center text-muted-foreground text-sm">Loading...</div>}
            {!isLoading && filtered.length === 0 && (
              <div className="p-4 text-center text-muted-foreground text-sm">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                No notes yet
              </div>
            )}

            {pinned.length > 0 && (
              <>
                <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase">Pinned</p>
                {pinned.map(note => (
                  <NoteItem key={note.id} note={note} isSelected={selectedNote?.id === note.id} onSelect={handleSelect} />
                ))}
              </>
            )}

            {unpinned.length > 0 && (
              <>
                {pinned.length > 0 && <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase">Notes</p>}
                {unpinned.map(note => (
                  <NoteItem key={note.id} note={note} isSelected={selectedNote?.id === note.id} onSelect={handleSelect} />
                ))}
              </>
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 glass-panel rounded-2xl overflow-hidden flex flex-col">
          {!selectedNote ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
              <FileText className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">Select a note to view</p>
              <p className="text-sm mt-1">Or create a new one to get started</p>
              <Button onClick={handleNew} className="mt-4 gap-2" disabled={createMutation.isPending}>
                <Plus className="w-4 h-4" />
                New Note
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                {isEditing ? (
                  <Input
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    className="text-xl font-semibold border-0 shadow-none p-0 h-auto focus-visible:ring-0 bg-transparent text-foreground"
                    autoFocus
                  />
                ) : (
                  <h2 className="text-xl font-semibold cursor-pointer" onClick={() => setIsEditing(true)}>
                    {selectedNote.title}
                  </h2>
                )}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePin(selectedNote)}
                    className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    {selectedNote.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(selectedNote.id)}
                    className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {isEditing ? (
                    <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>Save</Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>Edit</Button>
                  )}
                </div>
              </div>

              <div className="flex-1 p-6">
                {isEditing ? (
                  <Textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    className="w-full h-full resize-none border-0 shadow-none focus-visible:ring-0 bg-transparent text-foreground text-base leading-relaxed"
                    placeholder="Start writing..."
                  />
                ) : (
                  <div
                    className="h-full text-base leading-relaxed text-foreground whitespace-pre-wrap cursor-pointer"
                    onClick={() => setIsEditing(true)}
                  >
                    {selectedNote.content || <span className="text-muted-foreground">Click to add content...</span>}
                  </div>
                )}
              </div>

              <div className="px-6 py-3 border-t border-border text-xs text-muted-foreground">
                Last updated: {new Date(selectedNote.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function NoteItem({ note, isSelected, onSelect }: { note: Note; isSelected: boolean; onSelect: (n: Note) => void }) {
  return (
    <button
      onClick={() => onSelect(note)}
      className={`w-full text-left px-3 py-2.5 rounded-lg transition-all ${
        isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted/50 text-foreground"
      }`}
    >
      <div className="flex items-center gap-2 mb-0.5">
        {note.pinned && <Pin className="w-3 h-3 shrink-0 text-primary" />}
        <p className="text-sm font-medium truncate">{note.title}</p>
      </div>
      <p className="text-xs text-muted-foreground truncate">{note.content || "No content"}</p>
    </button>
  );
}
