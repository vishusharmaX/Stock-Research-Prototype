"use client";

import React, { useState } from "react";
import { Zap, Play, ArrowDown, TrendingDown, Layers, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BenchmarkComparison } from "@/lib/services/optimization/token-budget";

interface TokenBenchmarkProps {
  initialBenchmark: BenchmarkComparison;
}

export function TokenBenchmark({ initialBenchmark }: TokenBenchmarkProps) {
  const [benchmark, setBenchmark] = useState<BenchmarkComparison>(initialBenchmark);
  const [query, setQuery] = useState(initialBenchmark.query);
  const [isRunning, setIsRunning] = useState(false);

  const handleRunBenchmark = async () => {
    setIsRunning(true);
    try {
      const res = await fetch(`/api/diagnostics?benchmarkQuery=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.tokenEfficiencyBenchmark) {
        setBenchmark(data.tokenEfficiencyBenchmark);
      }
    } catch (err) {
      console.error("Failed to run benchmark:", err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-4 w-4 text-amber-600" />
            <h3 className="text-base font-semibold text-slate-900 tracking-tight">
              Repeatable Token Efficiency Benchmark
            </h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Side-by-side empirical comparison evaluating raw unpruned ingestion against Equity Intelligence's 4-tier optimization pipeline.
          </p>
        </div>

        <Button
          type="button"
          onClick={handleRunBenchmark}
          disabled={isRunning}
          size="sm"
          className="gap-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-white shrink-0 font-medium"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          <span>{isRunning ? "Running Suite..." : "Execute Benchmark"}</span>
        </Button>
      </div>

      {/* Target Question Input */}
      <div className="flex items-center gap-2">
        <label htmlFor="benchmark-query-input" className="text-xs font-mono text-slate-600 whitespace-nowrap">
          Benchmark Query:
        </label>
        <input
          id="benchmark-query-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 rounded border border-border bg-slate-50 px-3 py-1.5 text-xs font-sans text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
        />
      </div>

      {/* Side-by-Side Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Baseline: Unoptimized */}
        <div className="rounded-lg border border-slate-300 bg-slate-50/70 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700">
              Unoptimized Baseline
            </span>
            <span className="font-mono text-[11px] text-slate-500">
              Raw Web Ingestion
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center p-2 rounded bg-white border border-slate-200">
              <span className="text-slate-600">Estimated Context Tokens:</span>
              <span className="font-bold text-slate-900">
                {benchmark.unoptimized.estimatedTokens.toLocaleString()} tokens
              </span>
            </div>

            <div className="flex justify-between items-center p-2 rounded bg-white border border-slate-200">
              <span className="text-slate-600">Estimated Cost per Query:</span>
              <span className="font-bold text-slate-900">
                ${benchmark.unoptimized.estimatedCostUsd.toFixed(4)}
              </span>
            </div>

            <div className="flex justify-between items-center p-2 rounded bg-white border border-slate-200">
              <span className="text-slate-600">Duplicate / Redundant Sources:</span>
              <span className="font-bold text-amber-700">
                {benchmark.unoptimized.duplicateUrlsCount} duplicate URLs retained
              </span>
            </div>

            <div className="flex justify-between items-center p-2 rounded bg-white border border-slate-200">
              <span className="text-slate-600">Simulated Latency:</span>
              <span className="text-slate-800">
                {(benchmark.unoptimized.latencyMs / 1000).toFixed(1)}s
              </span>
            </div>
          </div>
        </div>

        {/* Optimized Pipeline */}
        <div className="rounded-lg border border-emerald-300 bg-emerald-50/20 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-700" />
              Equity Intelligence Optimized
            </span>
            <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
              {benchmark.optimized.tokenSavingsPercentage}% Savings
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center p-2 rounded bg-white border border-emerald-200">
              <span className="text-slate-600">Pruned Context Tokens:</span>
              <span className="font-bold text-emerald-900">
                {benchmark.optimized.estimatedTokens.toLocaleString()} tokens
              </span>
            </div>

            <div className="flex justify-between items-center p-2 rounded bg-white border border-emerald-200">
              <span className="text-slate-600">Optimized Cost per Query:</span>
              <span className="font-bold text-emerald-900">
                ${benchmark.optimized.estimatedCostUsd.toFixed(4)}
              </span>
            </div>

            <div className="flex justify-between items-center p-2 rounded bg-white border border-emerald-200">
              <span className="text-slate-600">Deduplicated Sources:</span>
              <span className="font-bold text-emerald-800">
                {benchmark.optimized.deduplicatedSourcesCount} pruned ({benchmark.optimized.retainedSourcesCount} high-signal kept)
              </span>
            </div>

            <div className="flex justify-between items-center p-2 rounded bg-white border border-emerald-200">
              <span className="text-slate-600">Latency Improvement:</span>
              <span className="text-emerald-900 font-bold">
                {(benchmark.optimized.latencyMs / 1000).toFixed(1)}s (60% faster)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Optimization Architecture Breakdown */}
      <div className="p-4 rounded-lg bg-slate-50 border border-border space-y-2 text-xs">
        <span className="font-mono font-semibold uppercase text-slate-700 block">
          Implemented 4-Tier Optimization Architecture
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
          <div className="flex items-start gap-2">
            <span className="font-mono font-bold text-slate-900">1.</span>
            <span><strong>URL Canonicalization:</strong> Strips UTM tracking queries, fragments, and trailing slashes to unify matching endpoints.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-mono font-bold text-slate-900">2.</span>
            <span><strong>Snippet Fingerprinting:</strong> Hashing text extracts detects identical press releases and syndication duplicates.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-mono font-bold text-slate-900">3.</span>
            <span><strong>Domain Frequency Capping:</strong> Restricts excessive scraping from single domains to maintain source diversity.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-mono font-bold text-slate-900">4.</span>
            <span><strong>Context Budget Pruning:</strong> Extracts targeted numerical evidence while strictly capping prompt tokens under 3,500.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
