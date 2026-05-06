import { ReactNode } from "react";
import { Settings, X, MoreVertical, GripHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface WidgetFrameProps {
  id: string;
  title: string;
  children: ReactNode;
  isEditing: boolean;
  onRemove: (id: string) => void;
  onSettings?: (id: string) => void;
  hasSettings?: boolean;
}

export default function WidgetFrame({
  id,
  title,
  children,
  isEditing,
  onRemove,
  onSettings,
  hasSettings = true,
}: WidgetFrameProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "relative w-full h-full flex flex-col rounded-[2.5rem] overflow-hidden transition-all duration-300 group bg-card",
        isEditing
          ? "border-dashed border-2 border-primary/40 shadow-lg scale-[0.98]"
          : "border-2 border-slate-100 dark:border-white/5 shadow-none hover:border-primary/20"
      )}
    >
      {/* Top accent line (dark mode only) */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent dark:via-primary/30 pointer-events-none" />

      {isEditing && (
        <div className="absolute inset-0 bg-background/60 dark:bg-background/70 backdrop-blur-[2px] z-50 flex flex-col pointer-events-none">
          {/* Drag Handle Area */}
          <div className={cn(
            "drag-handle w-full h-12 flex items-center justify-between px-4 cursor-move border-b pointer-events-auto transition-colors",
            "bg-primary/8 dark:bg-primary/10 border-primary/15 dark:border-primary/20",
            "hover:bg-primary/12 dark:hover:bg-primary/15"
          )}>
            <div className="flex items-center gap-2">
              <GripHorizontal className="w-4 h-4 text-primary/60" />
              <span className="text-xs font-bold text-primary uppercase tracking-widest">{title}</span>
            </div>
            
            <div className="flex items-center gap-1">
              {hasSettings && (
                <button
                  onClick={(e) => { e.stopPropagation(); onSettings?.(id); }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-primary/60 hover:text-primary hover:bg-primary/10 transition-all"
                >
                  <Settings className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(id); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Content wrapper */}
      <div className={cn("flex-1 p-0 overflow-hidden", isEditing ? "opacity-30 p-2" : "p-0")}>
        {children}
      </div>
    </motion.div>
  );
}
