"use client";

import React, { useState, useEffect } from "react";
import { PromptForm } from "@/components/research/PromptForm";
import { ProgressTimeline } from "@/components/research/ProgressTimeline";
import { ReportView } from "@/components/research/ReportView";
import { ResearchRun, ResearchEvent } from "@/lib/types/research";
import Link from "next/link";
import { ArrowRight, Clock, FileText, CheckCircle2, History } from "lucide-react";

export default function WorkspacePage() {
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [activeRun, setActiveRun] = useState<ResearchRun | null>(null);
  const [events, setEvents] = useState<ResearchEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentRuns, setRecentRuns] = useState<ResearchRun[]>([]);

  // Load recent runs for initial empty state
  useEffect(() => {
    fetch("/api/history?limit=4")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.items) setRecentRuns(data.items);
      })
      .catch(() => {});
  }, []);

  // Poll active run
  useEffect(() => {
    if (!activeRunId) return;

    let isMounted = true;
    const poll = async () => {
      try {
        const res = await fetch(`/api/research/${activeRunId}`);
        if (!res.ok) return;
        const data: ResearchRun = await res.json();
        if (!isMounted) return;

        setActiveRun(data);
        if (data.events) setEvents(data.events);

        if (data.status === "completed" || data.status === "failed" || data.status === "cancelled") {
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    poll();
    const interval = setInterval(() => {
      if (activeRun?.status === "completed" || activeRun?.status === "failed" || activeRun?.status === "cancelled") {
        clearInterval(interval);
      } else {
        poll();
      }
    }, 1200);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeRunId, activeRun?.status]);

  const handleSubmit = async (question: string, provider: "auto" | "parallel" | "openai" | "mock") => {
    setIsLoading(true);
    setActiveRun(null);
    setEvents([]);

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, preferredProvider: provider }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to initialize research run");
      }

      const { runId } = await res.json();
      setActiveRunId(runId);
    } catch (err: any) {
      alert(err?.message || "Failed to submit research query");
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!activeRunId) return;
    try {
      await fetch(`/api/research/${activeRunId}/cancel`, { method: "POST" });
    } catch (err) {
      console.error("Cancel failed:", err);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Workspace Header */}
      <div className="text-center sm:text-left space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-serif">
          Institutional Equity Intelligence Workspace
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Formulate open-ended investment questions to generate an autonomous, evidence-backed deep research thesis.
        </p>
      </div>

      {/* Query Submission Box */}
      <PromptForm onSubmit={handleSubmit} isLoading={isLoading} />

      {/* Live Pipeline Timeline */}
      {activeRunId && activeRun && (
        <ProgressTimeline
          runId={activeRun.id}
          status={activeRun.status}
          events={events}
          onCancel={handleCancel}
        />
      )}

      {/* Completed Report Display */}
      {activeRun?.status === "completed" && activeRun.report && (
        <ReportView
          run={activeRun}
          report={activeRun.report}
          sources={activeRun.sources || []}
          metrics={activeRun.metrics}
        />
      )}

      {/* Recent Persisted Research Runs (Empty state helper) */}
      {!activeRun && recentRuns.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-slate-700" />
              <h3 className="text-sm font-semibold text-slate-900">
                Recent Completed Research Reports
              </h3>
            </div>
            <Link
              href="/history"
              className="text-xs font-mono text-slate-600 hover:text-slate-950 flex items-center gap-1"
            >
              <span>View Full Archive</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recentRuns.map((r) => (
              <Link
                key={r.id}
                href={`/research/${r.id}`}
                className="p-4 rounded-lg border border-border bg-card hover:border-slate-400 hover:shadow-xs transition-all space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-slate-950">
                      {r.normalizedTicker || r.companyName || "EQUITY"}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {r.provider}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-xs text-slate-800 line-clamp-2 leading-relaxed">
                  {r.question}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] font-mono text-slate-500">
                  <span className="flex items-center gap-1 text-emerald-700">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Report Ready</span>
                  </span>
                  <span className="group-hover:translate-x-0.5 transition-transform flex items-center gap-1 text-slate-700 font-semibold">
                    <span>Inspect</span>
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
