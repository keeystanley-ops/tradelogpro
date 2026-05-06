import { motion } from "framer-motion";

export const MarketReveal = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* 3D Perspective Grid */}
      <div className="absolute inset-0 perspective-grid opacity-10 dark:opacity-20" />
      
      {/* Sunrise Glow at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[60vh] sunrise-glow animate-sunrise-pulse opacity-30 dark:opacity-100" />
      
      {/* Ambient orbs — visible in both themes, more vivid in dark */}
      <div className="absolute top-[20%] left-[10%] w-[300px] h-[300px] rounded-full bg-primary/[0.03] dark:bg-primary/[0.06] blur-[120px]" />
      <div className="absolute top-[60%] right-[15%] w-[200px] h-[200px] rounded-full bg-purple-500/[0.02] dark:bg-purple-500/[0.05] blur-[100px]" />

      {/* Floating Particles/Stars */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-primary/30 dark:bg-primary/40 rounded-full"
          initial={{ 
            x: Math.random() * 2000 - 1000, 
            y: Math.random() * 2000 - 1000,
            opacity: 0 
          }}
          animate={{ 
            y: [null, -100, -200],
            opacity: [0, 0.4, 0],
          }}
          transition={{
            duration: Math.random() * 10 + 20,
            repeat: Infinity,
            ease: "linear",
            delay: Math.random() * 10
          }}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
        />
      ))}
    </div>
  );
};
