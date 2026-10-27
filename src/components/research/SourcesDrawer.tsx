"use client";

import React, { useState } from "react";
import { ResearchSource } from "@/lib/types/research";
import { ExternalLink, ChevronDown, ChevronUp, CheckCircle, Ban, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SourcesDrawerProps {
  sources: ResearchSource[];
  highlightedIndex?: number | null;
}

export function SourcesDrawer({ sources, highlightedIndex }: SourcesDrawerProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [filter, setFilter] = useState<"all" | "retained" | "deduplicated">("retained");

  if (!sources || sources.length === 0) return null;

  const retainedSources = sources.filter((s) => s.isRetained);
  const deduplicatedSources = sources.filter((s) => !s.isRetained);
  const displayedSources =
    filter === "retained"
      ? retainedSources
      : filter === "deduplicated"
      ? deduplicatedSources
      : sources;

  return (
    <div id="research-sources-section" className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between p-4 bg-slate-50/80 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 text-sm font-semibold text-slate-900 hover:text-slate-950"
          >
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            <span>Primary Sources & Citation Registry</span>
          </button>
          <Badge variant="neutral" className="font-mono text-xs">
            {retainedSources.length} verified ({deduplicatedSources.length} deduplicated)
          </Badge>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-1 text-xs font-mono">
          <button
            type="button"
            onClick={() => setFilter("retained")}
            className={`px-2 py-1 rounded transition-colors ${
              filter === "retained"
                ? "bg-slate-900 text-white font-semibold"
                : "text-slate-600 hover:bg-slate-200"
            }`}
          >
            Retained ({retainedSources.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("deduplicated")}
            className={`px-2 py-1 rounded transition-colors ${
              filter === "deduplicated"
                ? "bg-slate-900 text-white font-semibold"
                : "text-slate-600 hover:bg-slate-200"
            }`}
          >
            Deduplicated ({deduplicatedSources.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-2 py-1 rounded transition-colors ${
              filter === "all"
                ? "bg-slate-900 text-white font-semibold"
                : "text-slate-600 hover:bg-slate-200"
            }`}
          >
            All ({sources.length})
          </button>
        </div>
      </div>

      {/* Content */}
      {isOpen && (
        <div className="divide-y divide-border p-4 space-y-3 max-h-[500px] overflow-y-auto">
          {displayedSources.map((s, idx) => {
            const isHighlighted = highlightedIndex === s.citationIndex;

            return (
              <div
                key={s.id || idx}
                id={`source-${s.citationIndex}`}
                className={`pt-3 pb-3 transition-colors rounded-md p-3 ${
                  isHighlighted
                    ? "bg-amber-50/80 border border-amber-300 ring-2 ring-amber-200"
                    : "hover:bg-slate-50/70"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    {s.isRetained ? (
                      <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                        [{s.citationIndex}]
                      </span>
                    ) : (
                      <span className="font-mono text-xs font-medium bg-slate-200 text-slate-600 px-2 py-0.5 rounded flex items-center gap-1">
                        <Ban className="h-3 w-3 text-slate-500" />
                        Deduplicated
                      </span>
                    )}
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-slate-900 hover:text-blue-700 hover:underline flex items-center gap-1"
                    >
                      <span>{s.title}</span>
                      <ExternalLink className="h-3 w-3 text-slate-400 shrink-0" />
                    </a>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500 shrink-0">
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      {s.domain}
                    </span>
                    {s.publishDate && <span>Pub: {s.publishDate}</span>}
                  </div>
                </div>

                {/* Excerpt quote */}
                <blockquote className="text-xs text-slate-700 italic border-l-2 border-slate-300 pl-2.5 my-1.5 leading-relaxed bg-slate-50 py-1 rounded-r">
                  "{s.excerpt}"
                </blockquote>

                {!s.isRetained && s.rejectionReason && (
                  <p className="text-[11px] text-amber-700 font-mono mt-1">
                    Pruning Reason: {s.rejectionReason}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
