import { motion } from "framer-motion";
import { Activity, ShieldCheck } from "lucide-react";
import { clsx } from "clsx";

interface HeaderProps {
  status: "idle" | "running";
  step: number;
  maxSteps: number;
}

export function Header({ status, step, maxSteps }: HeaderProps) {
  const isRunning = status === "running";

  return (
    <header className="glass-panel z-20 flex items-center justify-between border-b border-slate-800/80 px-6 py-4">
      <div className="flex items-center space-x-6">
        {/* Status Indicator */}
        <div className="relative flex items-center justify-center">
          <div
            className={clsx(
              "absolute h-full w-full rounded-full transition-all duration-300",
              isRunning ? "animate-ping bg-cyan-400 opacity-20" : "bg-transparent"
            )}
          />
          <div
            className={clsx(
              "h-3 w-3 rounded-full transition-colors duration-500",
              isRunning ? "bg-cyan-500 shadow-[0_0_12px_rgba(14,165,233,0.8)]" : "bg-slate-600"
            )}
          />
        </div>

        {/* Logo */}
        <div className="flex items-center space-x-2">
          <ShieldCheck className="h-6 w-6 text-cyan-500" />
          <h1 className="glow-text text-xl font-extrabold tracking-widest text-slate-100">
            UI_SENTINEL
          </h1>
        </div>
        
        {/* Version Badge */}
        <span className="rounded border border-cyan-900/50 bg-cyan-950/30 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-400">
          v3.0-PRO
        </span>
      </div>

      <div className="flex items-center space-x-4">
        {/* Step Counter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isRunning ? 1 : 0 }}
          className="flex items-center space-x-2 font-mono text-sm text-slate-400"
        >
          <Activity className="h-4 w-4 text-cyan-500" />
          <span>
            Step <span className="text-cyan-400">{step}</span> / {maxSteps}
          </span>
        </motion.div>
      </div>
    </header>
  );
}
