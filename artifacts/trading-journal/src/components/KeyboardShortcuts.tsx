import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function KeyboardShortcuts() {
  const [, setLocation] = useLocation();
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if typing in an input or textarea
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case "n":
          e.preventDefault();
          window.dispatchEvent(new CustomEvent("open-add-trade"));
          break;
        case "/":
          e.preventDefault();
          window.dispatchEvent(new CustomEvent("focus-search"));
          break;
        case "d":
          setLocation("/");
          break;
        case "j":
          setLocation("/journal");
          break;
        case "a":
          setLocation("/analytics");
          break;
        case "g":
          setLocation("/goals");
          break;
        case "p":
          setLocation("/playbooks");
          break;
        case "?":
          setShowHelp((prev) => !prev);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setLocation]);

  const shortcuts = [
    { key: "n", description: "Log a new trade" },
    { key: "/", description: "Focus search in Journal" },
    { key: "d", description: "Go to Dashboard" },
    { key: "j", description: "Go to Journal" },
    { key: "a", description: "Go to Analytics" },
    { key: "g", description: "Go to Goals" },
    { key: "p", description: "Go to Playbooks" },
    { key: "?", description: "Toggle this help menu" },
  ];

  return (
    <Dialog open={showHelp} onOpenChange={setShowHelp}>
      <DialogContent className="sm:max-w-[425px] bg-card border-border shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-display">Keyboard Shortcuts</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Navigate TradeLog quickly using these shortcuts.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 mt-4">
          {shortcuts.map((shortcut) => (
            <div key={shortcut.key} className="flex justify-between items-center p-2 rounded-md hover:bg-white/5">
              <span className="text-sm text-muted-foreground">{shortcut.description}</span>
              <kbd className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs font-mono font-bold uppercase min-w-[28px] text-center border border-border">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
