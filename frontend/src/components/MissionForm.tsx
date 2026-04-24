"use client";

import { useState } from "react";
import { Rocket, SquareIcon, DownloadCloud } from "lucide-react";

interface MissionFormProps {
  status: "idle" | "running";
  onStart: (url: string, goal: string) => void;
  onStop: () => void;
  onDownloadReport: () => void;
  hasLogs: boolean;
}

export function MissionForm({ status, onStart, onStop, onDownloadReport, hasLogs }: MissionFormProps) {
  const [url, setUrl] = useState("");
  const [goal, setGoal] = useState("");

  const isRunning = status === "running";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !goal) return;
    onStart(url, goal);
  };

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col space-y-6">
      <div className="space-y-2">
        <label htmlFor="url" className="text-xs font-bold uppercase tracking-wider text-cyan-500">
          Target Node (URL)
        </label>
        <div className="relative">
          <input
            id="url"
            type="url"
            required
            disabled={isRunning}
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full rounded-lg border border-slate-700/50 bg-black/40 p-4 font-mono text-sm text-white shadow-inner transition-all placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-50"
          />
          {/* Subtle bottom border glow */}
          <div className="absolute bottom-0 left-0 h-[1px] w-full bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-0 transition-opacity focus-within:opacity-100" />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="goal" className="text-xs font-bold uppercase tracking-wider text-cyan-500">
          Execution Goal
        </label>
        <div className="relative">
          <textarea
            id="goal"
            required
            disabled={isRunning}
            rows={4}
            placeholder="E.g., Click the login button, fill in user@test.com into the email field..."
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="w-full resize-none rounded-lg border border-slate-700/50 bg-black/40 p-4 font-mono text-sm leading-relaxed text-white shadow-inner transition-all placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-50"
          />
          <div className="absolute bottom-0 left-0 h-[1px] w-full bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-0 transition-opacity focus-within:opacity-100" />
        </div>
      </div>

      <div className="mt-auto space-y-3 pt-4">
        {!isRunning ? (
          <button
            type="submit"
            className="group relative flex w-full items-center justify-center space-x-2 overflow-hidden rounded-lg bg-slate-100 p-4 font-bold text-slate-900 transition-transform active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-emerald-400 opacity-0 transition-opacity group-hover:opacity-100" />
            <Rocket className="relative z-10 h-5 w-5 group-hover:text-white transition-colors" />
            <span className="relative z-10 tracking-widest group-hover:text-white transition-colors">INITIATE SEQUENCE</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onStop}
            className="flex w-full items-center justify-center space-x-2 rounded-lg border border-red-900/50 bg-red-950/40 p-4 font-bold text-red-400 transition-all hover:bg-red-900/60 active:scale-[0.98]"
          >
            <SquareIcon className="h-4 w-4 fill-current" />
            <span className="tracking-widest">ABORT MISSION</span>
          </button>
        )}

        {(!isRunning && hasLogs) && (
          <button
            type="button"
            onClick={onDownloadReport}
            className="flex w-full items-center justify-center space-x-2 rounded-lg border border-slate-700/50 bg-slate-800/40 p-4 font-bold text-slate-300 transition-all hover:bg-slate-700/60 active:scale-[0.98]"
          >
            <DownloadCloud className="h-5 w-5" />
            <span className="tracking-widest">DOWNLOAD QA REPORT</span>
          </button>
        )}
      </div>
    </form>
  );
}
