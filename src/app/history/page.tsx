"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ResearchRun, ResearchStatus } from "@/lib/types/research";
import {
  Search,
  History,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  ArrowRight,
  FileCode,
  Calendar,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function HistoryPage() {
  const [runs, setRuns] = useState<ResearchRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const loadHistory = async () => {
    setLoading(true);
    try {
      let url = `/api/history?limit=100`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (selectedStatus !== "all") url += `&status=${selectedStatus}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data?.items) {
        setRuns(data.items);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadHistory();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <History className="h-4 w-4 text-slate-800" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-serif">
              Research Runs & Audit Archive
            </h1>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Searchable log of all persisted institutional research workflows, completed reports, and token metrics.
          </p>
        </div>

        <Link href="/">
          <Button size="sm" className="text-xs bg-slate-900 hover:bg-slate-800 text-white font-medium">
            New Research Run
          </Button>
        </Link>
      </div>

      {/* Search and Status Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ticker, company, or query..."
            className="w-full rounded-md border border-border bg-card pl-9 pr-4 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
          <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
        </form>

        <div className="flex items-center gap-1.5 text-xs font-mono w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {["all", "completed", "running", "failed", "cancelled"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setSelectedStatus(st)}
              className={`px-2.5 py-1 rounded capitalize transition-colors ${
                selectedStatus === st
                  ? "bg-slate-900 text-white font-semibold shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Runs Table / List */}
      {loading ? (
        <div className="py-20 text-center space-y-2">
          <div className="h-5 w-5 rounded-full border-2 border-slate-900 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs font-mono text-muted-foreground">Loading archive...</p>
        </div>
      ) : runs.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center space-y-3">
          <p className="text-sm font-semibold text-slate-900">No research runs match your criteria.</p>
          <p className="text-xs text-muted-foreground">Submit a query from the workspace to begin deep research.</p>
          <Link href="/">
            <Button size="sm" variant="outline" className="text-xs mt-2">
              Go to Workspace
            </Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
          {runs.map((r) => {
            const isCompleted = r.status === "completed";
            const isRunning = r.status === "running";
            const isFailed = r.status === "failed";

            return (
              <div
                key={r.id}
                className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {r.normalizedTicker || r.companyName || "EQUITY"}
                    </span>

                    {isRunning && (
                      <Badge variant="warning" className="font-mono text-[10px] gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-pulse" />
                        Running
                      </Badge>
                    )}
                    {isCompleted && (
                      <Badge variant="positive" className="font-mono text-[10px] gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Completed
                      </Badge>
                    )}
                    {isFailed && (
                      <Badge variant="negative" className="font-mono text-[10px] gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Failed
                      </Badge>
                    )}

                    <span className="text-[10px] font-mono text-slate-400">
                      ID: {r.id}
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-medium text-slate-900 leading-snug line-clamp-2">
                    {r.question}
                  </h3>

                  <div className="flex items-center gap-4 text-[11px] font-mono text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      {new Date(r.createdAt).toLocaleString()}
                    </span>
                    <span>Provider: <strong className="text-slate-700">{r.provider}</strong></span>
                    {r.metrics?.totalTokens && (
                      <span>Tokens: <strong className="text-slate-700">{r.metrics.totalTokens.toLocaleString()}</strong></span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <Link href={`/transcripts/${r.id}`}>
                    <Button variant="ghost" size="sm" className="text-xs gap-1 font-mono text-slate-600">
                      <FileCode className="h-3.5 w-3.5" />
                      <span>Transcript</span>
                    </Button>
                  </Link>

                  {isCompleted && (
                    <Link href={`/research/${r.id}`}>
                      <Button size="sm" variant="outline" className="text-xs gap-1.5 font-medium">
                        <span>View Report</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
