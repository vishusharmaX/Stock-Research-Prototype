"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  FileSearch,
  Layers,
  Sparkles,
  ShieldCheck,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResearchEvent, ResearchStatus } from "@/lib/types/research";

interface ProgressTimelineProps {
  runId: string;
  status: ResearchStatus;
  events: ResearchEvent[];
  onCancel?: () => void;
  onRefresh?: () => void;
}

const PHASES = [
  { key: "planning", label: "Protocol Planning", icon: FileSearch },
  { key: "discovery", label: "Filings & Discovery", icon: Layers },
  { key: "extraction", label: "Deduplication & Extraction", icon: Sparkles },
  { key: "synthesis", label: "Thesis Synthesis", icon: Layers },
  { key: "verification", label: "Citation Verification", icon: ShieldCheck },
];

export function ProgressTimeline({
  runId,
  status,
  events,
  onCancel,
}: ProgressTimelineProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (status !== "running" && status !== "queued") return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  const currentPhaseIndex = Math.min(
    PHASES.length - 1,
    Math.max(
      0,
      events.length > 0
        ? PHASES.findIndex((p) => p.key === events[events.length - 1]?.phase)
        : 0
    )
  );

  return (
    <div className="w-full bg-card rounded-xl border border-border p-6 shadow-xs space-y-6">
      {/* Header with status and elapsed time */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              Research Pipeline
            </span>
            <span className="text-xs font-mono text-slate-400">•</span>
            <span className="text-xs font-mono text-slate-700 font-semibold">{runId}</span>
          </div>
          <h3 className="text-base font-semibold text-foreground">
            {status === "running"
              ? "Autonomous Investigation Active"
              : status === "completed"
              ? "Research Complete & Persisted"
              : status === "cancelled"
              ? "Research Cancelled"
              : status === "failed"
              ? "Execution Encountered Failure"
              : "Queued for Execution"}
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded">
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            <span>{elapsedSeconds}s elapsed</span>
          </div>

          {status === "running" && (
            <Badge variant="warning" className="font-mono text-xs gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-ping" />
              Running
            </Badge>
          )}

          {status === "completed" && (
            <Badge variant="positive" className="font-mono text-xs gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Completed
            </Badge>
          )}

          {status === "failed" && (
            <Badge variant="negative" className="font-mono text-xs gap-1">
              <AlertCircle className="h-3.5 w-3.5 text-red-600" />
              Failed
            </Badge>
          )}

          {status === "cancelled" && (
            <Badge variant="neutral" className="font-mono text-xs gap-1">
              <XCircle className="h-3.5 w-3.5 text-slate-500" />
              Cancelled
            </Badge>
          )}

          {status === "running" && onCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="text-xs gap-1 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
            >
              <Ban className="h-3.5 w-3.5" />
              <span>Cancel</span>
            </Button>
          )}
        </div>
      </div>

      {/* Visual Phase Progression Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {PHASES.map((phase, idx) => {
          const Icon = phase.icon;
          const isDone = status === "completed" || idx < currentPhaseIndex;
          const isCurrent = status === "running" && idx === currentPhaseIndex;

          return (
            <div
              key={phase.key}
              className={`p-3 rounded-lg border text-left transition-all ${
                isDone
                  ? "bg-slate-50 border-slate-300 text-slate-900"
                  : isCurrent
                  ? "bg-white border-slate-900 text-slate-950 shadow-xs ring-1 ring-slate-900/10"
                  : "bg-slate-50/50 border-slate-200 text-slate-400"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Icon
                  className={`h-4 w-4 ${
                    isDone
                      ? "text-emerald-700"
                      : isCurrent
                      ? "text-slate-900 animate-pulse"
                      : "text-slate-400"
                  }`}
                />
                <span className="font-mono text-[10px] text-slate-500">0{idx + 1}</span>
              </div>
              <div className="text-xs font-semibold leading-tight">{phase.label}</div>
            </div>
          );
        })}
      </div>

      {/* Real-Time Chronological Event Feed */}
      <div>
        <h4 className="text-xs font-mono uppercase text-muted-foreground mb-2 tracking-wider">
          Observed Research Actions ({events.length})
        </h4>
        <div className="rounded-lg border border-border bg-slate-50/70 p-3 max-h-56 overflow-y-auto space-y-2 font-mono text-xs">
          {events.length === 0 ? (
            <p className="text-slate-400 italic">Awaiting pipeline initialization...</p>
          ) : (
            events.map((ev, i) => (
              <div key={i} className="flex items-start gap-2.5 text-slate-800 leading-relaxed">
                <span className="text-[10px] text-slate-400 whitespace-nowrap pt-0.5">
                  {ev.timestamp ? ev.timestamp.split("T")[1]?.slice(0, 8) : "--:--:--"}
                </span>
                <span className="text-[10px] uppercase px-1 rounded bg-slate-200 text-slate-700 font-semibold">
                  {ev.phase}
                </span>
                <span className="text-slate-900 text-[11px] flex-1">{ev.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
