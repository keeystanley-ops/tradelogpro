import React from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MetricCardProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  description?: string;
  secondary?: React.ReactNode;
  className?: string;
  valueColor?: string;
}

export default function MetricCard({ label, value, icon, description, secondary, className, valueColor }: MetricCardProps) {
  return (
    <div className={cn(
      "w-full h-full p-7 flex flex-col justify-between transition-all duration-300",
      className
    )}>
      {/* Subtle top accent */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/15 to-transparent dark:via-primary/25 pointer-events-none" />

      <div className="flex justify-between items-start">
        <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          {icon && (
            <div className="w-6 h-6 rounded-md bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900">
              {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: "w-3.5 h-3.5" }) : icon}
            </div>
          )}
          {label}
        </span>
        
        <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
        </div>
      </div>

      <div className="flex flex-col gap-1 mt-4">
        <div className={cn("text-4xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2", valueColor)}>
          {value}
          <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
          </div>
        </div>
        {description && <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{description}</div>}
      </div>

      {secondary && (
        <div className="mt-6 flex-1 flex flex-col justify-end">
          {secondary}
        </div>
      )}
    </div>
  );
}
