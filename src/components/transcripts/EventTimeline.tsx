"use client";

import React, { useState } from "react";
import { ResearchEvent } from "@/lib/types/research";
import { ChevronDown, ChevronRight, Terminal } from "lucide-react";

interface EventTimelineProps {
  events: ResearchEvent[];
}

export function EventTimeline({ events }: EventTimelineProps) {
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedEvents((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (!events || events.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-muted-foreground italic rounded-lg border border-border bg-card">
        No transcript events recorded for this research run.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-slate-800" />
          <h3 className="text-sm font-semibold text-slate-900">
            Chronological Research Event Transcript ({events.length} Steps)
          </h3>
        </div>
        <span className="text-xs font-mono text-muted-foreground">
          Sorted chronologically
        </span>
      </div>

      <div className="space-y-2">
        {events.map((ev, i) => {
          const isExpanded = Boolean(expandedEvents[ev.id || i.toString()]);
          const hasPayload = ev.payload && Object.keys(ev.payload).length > 0;

          return (
            <div
              key={ev.id || i}
              className="rounded-lg border border-border bg-card p-3.5 transition-all text-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                    Step {ev.stepNumber}
                  </span>

                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-800">
                        {ev.phase}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500 font-medium">
                        `{ev.type}`
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : ""}
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 font-sans leading-relaxed">
                      {ev.message}
                    </p>
                  </div>
                </div>

                {hasPayload && (
                  <button
                    type="button"
                    onClick={() => toggleExpand(ev.id || i.toString())}
                    className="flex items-center gap-1 font-mono text-[10px] text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-2 py-1 rounded border border-slate-200 shrink-0 transition-colors"
                  >
                    <span>{isExpanded ? "Collapse" : "Payload"}</span>
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </button>
                )}
              </div>

              {isExpanded && hasPayload && (
                <div className="mt-3 pt-2.5 border-t border-slate-100">
                  <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    Sanitized Payload Metadata
                  </span>
                  <pre className="p-2.5 rounded bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto max-h-48">
                    {JSON.stringify(ev.payload, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
