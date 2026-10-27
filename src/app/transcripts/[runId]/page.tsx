"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ResearchRun, ResearchEvent, ResearchMetrics, ResearchSource } from "@/lib/types/research";
import { MetricsCard } from "@/components/transcripts/MetricsCard";
import { EventTimeline } from "@/components/transcripts/EventTimeline";
import { ShareDialog } from "@/components/transcripts/ShareDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Download,
  Share2,
  FileText,
  FileCode,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

export default function TranscriptViewerPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = use(params);
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [run, setRun] = useState<ResearchRun | null>(null);
  const [events, setEvents] = useState<ResearchEvent[]>([]);
  const [sources, setSources] = useState<ResearchSource[]>([]);
  const [metrics, setMetrics] = useState<ResearchMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);

  useEffect(() => {
    const fetchTranscript = async () => {
      setLoading(true);
      try {
        let url = `/api/transcripts/${runId}`;
        if (token) url += `?token=${encodeURIComponent(token)}`;

        const res = await fetch(url);
        if (!res.ok) {
          if (res.status === 403) throw new Error("Invalid or expired share token.");
          if (res.status === 404) throw new Error("Transcript not found.");
          throw new Error("Failed to load transcript.");
        }

        const data = await res.json();
        setRun(data.run);
        setEvents(data.events || []);
        setSources(data.sources || []);
        setMetrics(data.metrics || null);
      } catch (err: any) {
        setError(err?.message || "Failed to load transcript.");
      } finally {
        setLoading(false);
      }
    };

    fetchTranscript();
  }, [runId, token]);

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="h-6 w-6 rounded-full border-2 border-slate-900 border-t-transparent animate-spin mx-auto" />
        <p className="text-xs font-mono text-muted-foreground">Loading research transcript & telemetry...</p>
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="p-3 rounded-full bg-red-100 text-red-700 w-12 h-12 flex items-center justify-center mx-auto">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Transcript Access Denied</h2>
        <p className="text-xs text-muted-foreground">{error || "Unable to access research transcript."}</p>
        <Link href="/">
          <Button variant="outline" size="sm" className="text-xs mt-2">
            Back to Workspace
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-950 font-mono transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Workspace</span>
        </Link>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {run.status === "completed" && (
            <Link href={`/research/${run.id}`}>
              <Button size="sm" variant="default" className="text-xs gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium">
                <span>View Full Report</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsShareOpen(true)}
            className="text-xs gap-1.5"
          >
            <Share2 className="h-3.5 w-3.5 text-slate-600" />
            <span>Share Link</span>
          </Button>

          <a
            href={`/api/transcripts/${run.id}/export?format=json`}
            download
            className="inline-flex"
          >
            <Button variant="subtle" size="sm" className="text-xs gap-1.5">
              <Download className="h-3.5 w-3.5" />
              <span>Download JSON</span>
            </Button>
          </a>

          <a
            href={`/api/transcripts/${run.id}/export?format=markdown`}
            download
            className="inline-flex"
          >
            <Button variant="outline" size="sm" className="text-xs gap-1.5">
              <FileText className="h-3.5 w-3.5 text-slate-600" />
              <span>Download MD</span>
            </Button>
          </a>
        </div>
      </div>

      {/* Transcript Header Card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {run.normalizedTicker || run.companyName || "EQUITY"}
              </span>
              <span className="font-mono text-[11px] text-slate-500">
                Run ID: {run.id}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-950 font-serif">
              Research Agent Execution Transcript
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="neutral" className="font-mono text-xs">
              Status: {run.status.toUpperCase()}
            </Badge>
            <Badge variant="neutral" className="font-mono text-xs">
              Engine: {run.provider}
            </Badge>
          </div>
        </div>

        <p className="text-xs text-slate-700 leading-relaxed font-sans">
          <strong className="text-slate-900">Research Question:</strong> "{run.question}"
        </p>

        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-muted-foreground pt-1">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            Started: {new Date(run.createdAt).toLocaleString()}
          </span>
          {run.completedAt && (
            <span>
              Completed: {new Date(run.completedAt).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Telemetry and Metrics Card */}
      {metrics && <MetricsCard metrics={metrics} />}

      {/* Chronological Event Timeline */}
      <EventTimeline events={events} />

      {/* Share Dialog */}
      <ShareDialog
        runId={run.id}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />
    </div>
  );
}
