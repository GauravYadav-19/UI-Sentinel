"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal } from "lucide-react";
import { clsx } from "clsx";

export interface LogEntry {
  id: string;
  type: "info" | "system" | "thought" | "success" | "warning" | "error";
  time: string;
  message: string;
}

interface TerminalPanelProps {
  logs: LogEntry[];
  status: "idle" | "running";
}

export function TerminalPanel({ logs, status }: TerminalPanelProps) {
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <section className="glass-panel relative flex h-full w-full max-w-sm flex-col overflow-hidden rounded-xl xl:max-w-md">
      {/* Top Animated Progress Bar */}
      <div className="absolute left-0 top-0 h-1 w-full bg-slate-800">
        <motion.div
          animate={{ x: status === "running" ? ["-100%", "100%"] : "0%" }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className={clsx(
            "h-full w-1/2 bg-gradient-to-r from-transparent via-cyan-400 to-transparent",
            status === "running" ? "opacity-100" : "opacity-0"
          )}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 bg-black/60 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          <Terminal className="h-4 w-4 text-slate-400" />
          <span className="font-mono text-xs text-slate-400">EXECUTION LOGS</span>
        </div>
        <span
          className={clsx(
            "font-mono text-[10px] font-bold tracking-wider",
            status === "running" ? "text-cyan-400" : "text-slate-600"
          )}
        >
          {status.toUpperCase()}
        </span>
      </div>

      {/* Log Feed */}
      <div className="terminal-scroll flex-1 overflow-y-auto whitespace-pre-wrap p-4 font-mono text-[13px] leading-relaxed">
        <AnimatePresence initial={false}>
          {logs.map((log) => {
            const colors = {
              info: "text-cyan-300",
              system: "text-slate-500",
              thought: "text-fuchsia-400 font-medium",
              success: "text-emerald-400",
              warning: "text-amber-400",
              error: "text-red-400 font-bold",
            };

            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={clsx("mb-2 flex items-start space-x-3", colors[log.type])}
              >
                <span className="shrink-0 text-slate-600">[{log.time}]</span>
                <span className="break-words">{log.message}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={endRef} />
      </div>
    </section>
  );
}
