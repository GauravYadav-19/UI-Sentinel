"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { TerminalPanel, LogEntry } from "@/components/TerminalPanel";
import { MissionForm } from "@/components/MissionForm";
import { Target } from "lucide-react";

interface AgentDecision {
  thought_process: string;
  action: string;
  target_id?: number | null;
  input_text?: string;
}

interface StepTrace {
  step: number;
  model_used?: string;
  decision?: AgentDecision;
  execution_error?: string;
  ai_error?: string;
}

export default function Home() {
  const [status, setStatus] = useState<"idle" | "running">("idle");
  const [step, setStep] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: "init", type: "system", time: new Date().toLocaleTimeString('en-US', { hour12: false }), message: "UI Sentinel v3.0 | Subsystem loaded. Ready." }
  ]);
  
  // We keep a raw trace array to generate the txt report
  const [rawTraces, setRawTraces] = useState<StepTrace[]>([]);
  const [missionParams, setMissionParams] = useState({ url: "", goal: "" });

  const addLog = (message: string, type: LogEntry["type"] = "info") => {
    setLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        type,
        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        message,
      },
    ]);
  };

  const handleStart = async (url: string, goal: string) => {
    setMissionParams({ url, goal });
    setStatus("running");
    setStep(0);
    setLogs([]);
    setRawTraces([]);

    addLog("⟐ INITIATING DEPLOYMENT SEQUENCE...", "success");
    addLog(`⟐ Target: ${url}`, "system");
    addLog(`⟐ Goal: ${goal}`, "system");
    addLog("", "system");

    try {
      const response = await fetch("/api/run-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, goal }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || ""; // Keep incomplete chunk

        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;

          let trace: StepTrace;
          try {
            trace = JSON.parse(part.slice(6));
          } catch (parseErr: unknown) {
            const errName = parseErr instanceof Error ? parseErr.message : String(parseErr);
            addLog(`⚠ Malformed SSE event: ${errName}`, "warning");
            continue;
          }

          setRawTraces((prev) => [...prev, trace]);
          setStep(Number(trace.step) || 0);

          if (trace.ai_error) {
            addLog(`⛔ [Step ${trace.step}] ${trace.ai_error}`, "error");
          } else if (trace.decision && typeof trace.decision === 'object') {
            const dec = trace.decision;
            // Thought process
            addLog(`🧠 [Step ${trace.step}] ${dec.thought_process}`, "thought");

            // Action taken
            const actionLabel = String(dec.action).toUpperCase();
            const targetLabel = dec.target_id !== null && dec.target_id !== undefined ? `#${dec.target_id}` : "";
            const inputLabel = dec.input_text ? ` "${dec.input_text}"` : "";

            if (trace.execution_error) {
              addLog(`⚠️ [Step ${trace.step}] ${actionLabel} ${targetLabel}${inputLabel} → FAILED: ${trace.execution_error}`, "warning");
            } else if (dec.action === "done") {
              addLog(`✅ [Step ${trace.step}] GOAL ACHIEVED`, "success");
            } else {
              addLog(`▶ [Step ${trace.step}] ${actionLabel} ${targetLabel}${inputLabel} → SUCCESS`, "success");
            }
            addLog("", "system");
          }
        }
      }

      // Stream complete
      setStatus(() => {
        // If we were aborted, we catch it in the last trace or just check if it's already idle
        return "idle";
      });

      setRawTraces((currentTraces) => {
        const lastTrace = currentTraces[currentTraces.length - 1];
        if (lastTrace?.decision?.action === "done") {
          addLog("═══════════════════════════════════════", "success");
          addLog("✅ MISSION ACCOMPLISHED", "success");
          addLog(`   Steps taken: ${currentTraces.length}`, "success");
          addLog("═══════════════════════════════════════", "success");
        } else if (lastTrace?.ai_error?.includes("Aborted")) {
          addLog("🛑 MISSION ABORTED BY USER", "warning");
        } else {
          addLog(`⟐ Agent finished after ${currentTraces.length} step(s).`, "system");
        }
        return currentTraces;
      });
    } catch (error: unknown) {
      const errName = error instanceof Error ? error.message : String(error);
      addLog(`⛔ NETWORK ERROR: ${errName}`, "error");
      setStatus("idle");
    }
  };

  const handleStop = async () => {
    addLog("⟐ Sending abort signal...", "warning");
    try {
      await fetch("/api/stop-agent", { method: "POST" });
    } catch (e: unknown) {
      const errName = e instanceof Error ? e.message : String(e);
      addLog(`⛔ Failed to send abort: ${errName}`, "error");
    }
  };

  const handleDownloadReport = () => {
    if (rawTraces.length === 0) return;

    let report = "=".repeat(55) + "\n";
    report += "       UI SENTINEL — AUTONOMOUS QA REPORT\n";
    report += "=".repeat(55) + "\n";
    report += `Target URL:  ${missionParams.url}\n`;
    report += `Objective:   ${missionParams.goal}\n`;
    report += `Total Steps: ${rawTraces.length}\n`;
    report += `Timestamp:   ${new Date().toLocaleString()}\n\n`;
    report += "--- EXECUTION TRACE ---\n\n";

    rawTraces.forEach((t) => {
      report += `STEP ${t.step} [Model: ${t.model_used || "Unknown"}]\n`;
      if (t.ai_error) {
        report += `  ERROR: ${t.ai_error}\n\n`;
      } else if (t.decision) {
        report += `  Thought: ${t.decision.thought_process}\n`;
        report += `  Action:  ${t.decision.action.toUpperCase()} → target: ${t.decision.target_id || "N/A"}\n`;
        if (t.decision.input_text) {
          report += `  Input:   "${t.decision.input_text}"\n`;
        }
        report += `  Result:  ${t.execution_error ? "FAILED (" + t.execution_error + ")" : "SUCCESS"}\n\n`;
      }
    });

    const blob = new Blob([report], { type: "text/plain" });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `UI_Sentinel_Report_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
    addLog("📥 Report downloaded.", "success");
  };

  return (
    <>
      <Header status={status} step={step} maxSteps={15} />

      <main className="flex flex-1 overflow-hidden p-6 z-10 gap-6">
        
        {/* Left Control Column */}
        <section className="flex w-96 flex-col space-y-6 shrink-0">
          <div className="glass-panel flex-1 rounded-2xl p-6 relative overflow-hidden">
            <MissionForm 
              status={status} 
              onStart={handleStart} 
              onStop={handleStop}
              onDownloadReport={handleDownloadReport}
              hasLogs={rawTraces.length > 0}
            />
          </div>
        </section>

        {/* Center Viewport Placeholder */}
        <section className="glass-panel flex-1 flex items-center justify-center rounded-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-slate-900 flex items-center justify-center opacity-50 transition-opacity">
            <div className="text-center flex flex-col items-center">
              <Target className={`h-16 w-16 mb-4 ${status === 'running' ? 'text-cyan-500 animate-pulse' : 'text-slate-600'}`} />
              <h2 className="text-xl font-bold tracking-widest text-slate-400">MISSION CONTROL</h2>
              <p className="text-sm text-slate-500 mt-2 font-mono">
                {status === 'running' ? 'AGENT ACTIVE • EXECUTING DIRECTIVES' : 'AWAITING MISSION PARAMETERS'}
              </p>
            </div>
          </div>
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA0KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20" />
        </section>

        {/* Right Terminal Column */}
        <TerminalPanel logs={logs} status={status} />
        
      </main>
    </>
  );
}
