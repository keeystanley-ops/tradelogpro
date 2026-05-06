import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative flex items-center gap-0.5 p-1 rounded-full transition-all duration-300",
        "theme-toggle-pill",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      )}
      aria-label="Toggle theme"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {/* Sliding pill indicator */}
      <motion.div
        className={cn(
          "absolute inset-y-1 rounded-full z-0",
          isDark
            ? "bg-gradient-to-br from-violet-600 to-purple-700"
            : "bg-gradient-to-br from-amber-400 to-orange-400"
        )}
        initial={false}
        animate={{
          x: isDark ? 30 : 2,
          width: 28,
        }}
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
        style={{
          boxShadow: isDark
            ? "0 0 12px rgba(139, 92, 246, 0.7), 0 0 24px rgba(139, 92, 246, 0.3)"
            : "0 0 10px rgba(251, 191, 36, 0.6), 0 0 20px rgba(251, 191, 36, 0.2)",
        }}
      />

      {/* Sun icon */}
      <div
        className={cn(
          "relative z-10 w-8 h-8 flex items-center justify-center rounded-full",
          "transition-colors duration-300",
          !isDark ? "text-white" : "text-muted-foreground/60"
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key="sun"
            initial={{ rotate: -30, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            exit={{ rotate: 30, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <Sun className="h-3.5 w-3.5" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Moon icon */}
      <div
        className={cn(
          "relative z-10 w-8 h-8 flex items-center justify-center rounded-full",
          "transition-colors duration-300",
          isDark ? "text-white" : "text-muted-foreground/60"
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key="moon"
            initial={{ rotate: 30, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            exit={{ rotate: -30, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <Moon className="h-3.5 w-3.5" />
          </motion.div>
        </AnimatePresence>
      </div>

      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
