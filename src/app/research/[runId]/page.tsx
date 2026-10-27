"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { ResearchRun } from "@/lib/types/research";
import { ReportView } from "@/components/research/ReportView";
import { ProgressTimeline } from "@/components/research/ProgressTimeline";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";

export default function ResearchReportPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = use(params);
  const [run, setRun] = useState<ResearchRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRun = async () => {
    try {
      const res = await fetch(`/api/research/${runId}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("Research report not found.");
        throw new Error("Failed to load research report.");
      }
      const data: ResearchRun = await res.json();
      setRun(data);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Failed to load report.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRun();

    // If running, poll until complete
    const interval = setInterval(() => {
      if (run?.status === "running" || run?.status === "queued") {
        fetchRun();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [runId, run?.status]);

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="h-6 w-6 rounded-full border-2 border-slate-900 border-t-transparent animate-spin mx-auto" />
        <p className="text-xs font-mono text-muted-foreground">Loading institutional research report...</p>
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="p-3 rounded-full bg-red-100 text-red-700 w-12 h-12 flex items-center justify-center mx-auto">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Report Unavailable</h2>
        <p className="text-xs text-muted-foreground">{error || "The requested research run does not exist."}</p>
        <div className="flex justify-center gap-3 pt-2">
          <Link href="/">
            <Button variant="outline" size="sm" className="text-xs">
              Back to Workspace
            </Button>
          </Link>
          <Button variant="default" size="sm" onClick={fetchRun} className="text-xs gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-950 font-mono transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Research Workspace</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchRun}
            className="text-xs font-mono gap-1 text-slate-600"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Sync</span>
          </Button>
        </div>
      </div>

      {/* If still in progress */}
      {(run.status === "running" || run.status === "queued") && (
        <ProgressTimeline
          runId={run.id}
          status={run.status}
          events={run.events || []}
        />
      )}

      {/* If failed */}
      {run.status === "failed" && (
        <div className="p-6 rounded-xl border border-red-200 bg-red-50/50 space-y-3 text-center sm:text-left">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5" />
            <h3 className="font-semibold text-sm">Research Run Encountered a Provider Error</h3>
          </div>
          <p className="text-xs text-red-700 leading-relaxed font-mono">
            {run.errorMessage || "The external research provider encountered an unexpected failure."}
          </p>
          <div className="pt-2">
            <Link href="/">
              <Button size="sm" variant="outline" className="text-xs">
                Launch New Investigation
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* If completed */}
      {run.status === "completed" && run.report && (
        <ReportView
          run={run}
          report={run.report}
          sources={run.sources || []}
          metrics={run.metrics}
        />
      )}
    </div>
  );
}
