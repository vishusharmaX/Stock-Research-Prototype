"use client";

import React from "react";
import { ResearchMetrics } from "@/lib/types/research";
import { Cpu, DollarSign, Clock, Layers, Filter, CheckCircle2 } from "lucide-react";

interface MetricsCardProps {
  metrics: ResearchMetrics;
}

export function MetricsCard({ metrics }: MetricsCardProps) {
  const isMeasuredTokens = metrics.costModel === "measured_token_billing";
  const isFlatBilling = metrics.costModel === "flat_task_billing";

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-slate-800" />
          <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
            Token Telemetry & Research Latency
          </h3>
        </div>
        <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          Engine: {metrics.provider} / {metrics.model}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Input Tokens */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
          <span className="text-[10px] font-mono uppercase text-slate-500 block mb-0.5">
            Input Tokens
          </span>
          <div className="text-sm font-bold font-mono text-slate-900">
            {metrics.inputTokens !== null ? metrics.inputTokens.toLocaleString() : "Not reported"}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {isMeasuredTokens ? "Measured Prompt" : "Task API abstraction"}
          </span>
        </div>

        {/* Output Tokens */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
          <span className="text-[10px] font-mono uppercase text-slate-500 block mb-0.5">
            Output Tokens
          </span>
          <div className="text-sm font-bold font-mono text-slate-900">
            {metrics.outputTokens !== null ? metrics.outputTokens.toLocaleString() : "Not reported"}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {isMeasuredTokens ? "Measured Completion" : "Synthesis output"}
          </span>
        </div>

        {/* Research Latency */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
          <span className="text-[10px] font-mono uppercase text-slate-500 block mb-0.5">
            Research Duration
          </span>
          <div className="text-sm font-bold font-mono text-slate-900 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            <span>{(metrics.durationMs / 1000).toFixed(2)}s</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {metrics.stepCount} discrete steps
          </span>
        </div>

        {/* Estimated API Cost */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
          <span className="text-[10px] font-mono uppercase text-slate-500 block mb-0.5">
            Estimated Cost
          </span>
          <div className="text-sm font-bold font-mono text-slate-900 flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
            <span>
              {metrics.estimatedCostUsd !== null
                ? `$${metrics.estimatedCostUsd.toFixed(4)}`
                : "N/A"}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {isFlatBilling ? "Flat task fee" : isMeasuredTokens ? "Token-based" : "Unbilled"}
          </span>
        </div>
      </div>

      {/* Deduplication & Source Pipeline Stats */}
      <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-700">
            <Layers className="h-3.5 w-3.5 text-slate-500" />
            <span>Sources Discovered: <strong className="text-slate-900">{metrics.sourcesDiscovered}</strong></span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5 text-slate-700">
            <Filter className="h-3.5 w-3.5 text-amber-600" />
            <span>Deduplicated: <strong className="text-amber-800">{metrics.deduplicatedCount}</strong></span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5 text-slate-700">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Retained: <strong className="text-emerald-800">{metrics.sourcesRetained}</strong></span>
          </div>
        </div>

        <span className="text-[11px] text-slate-500 italic max-w-sm">
          {metrics.pricingNotes}
        </span>
      </div>
    </div>
  );
}
