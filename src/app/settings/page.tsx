"use client";

import React, { useEffect, useState } from "react";
import { Settings, Shield, Terminal, Key, Database, RefreshCw, Cpu } from "lucide-react";
import { ProviderStatus } from "@/components/diagnostics/ProviderStatus";
import { TokenBenchmark } from "@/components/diagnostics/TokenBenchmark";
import { Button } from "@/components/ui/button";

export default function SettingsDiagnosticsPage() {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDiagnostics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/diagnostics");
      const data = await res.json();
      setDiagnostics(data);
    } catch (err) {
      console.error("Failed to load diagnostics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Settings className="h-4 w-4 text-slate-800" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-serif">
              System Diagnostics & Telemetry
            </h1>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Real-time provider connectivity, database storage mode, token telemetry, and repeatable optimization benchmarks.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchDiagnostics}
          disabled={loading}
          className="gap-1.5 text-xs font-mono"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Status</span>
        </Button>
      </div>

      {loading && !diagnostics ? (
        <div className="py-20 text-center space-y-2">
          <div className="h-5 w-5 rounded-full border-2 border-slate-900 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs font-mono text-muted-foreground">Checking provider readiness...</p>
        </div>
      ) : (
        <>
          {/* Provider Readiness Cards */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Key className="h-3.5 w-3.5 text-slate-700" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
                Research Provider Integrations
              </h2>
            </div>
            <ProviderStatus data={diagnostics} />
          </section>

          {/* Aggregate Telemetry Banner */}
          {diagnostics?.telemetry && (
            <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-3 border-b border-border pb-2">
                <Cpu className="h-4 w-4 text-slate-800" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
                  Global Token & Cost Telemetry
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                <div className="p-3 rounded bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase block mb-1">
                    Cumulative Tokens Measured
                  </span>
                  <div className="text-base font-bold text-slate-900">
                    {diagnostics.telemetry.totalTokensLogged.toLocaleString()}
                  </div>
                </div>

                <div className="p-3 rounded bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase block mb-1">
                    Cumulative Estimated API Cost
                  </span>
                  <div className="text-base font-bold text-emerald-800">
                    ${diagnostics.telemetry.totalCostLoggedUsd.toFixed(4)}
                  </div>
                </div>

                <div className="p-3 rounded bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase block mb-1">
                    Average Tokens per Run
                  </span>
                  <div className="text-base font-bold text-slate-900">
                    {diagnostics.telemetry.averageTokensPerRun.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Repeatable Token Efficiency Benchmark */}
          {diagnostics?.tokenEfficiencyBenchmark && (
            <section className="space-y-3">
              <TokenBenchmark initialBenchmark={diagnostics.tokenEfficiencyBenchmark} />
            </section>
          )}

          {/* Setup Instructions */}
          <section className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <Terminal className="h-4 w-4 text-slate-800" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
                Environment Setup Instructions
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              To connect live paid deep research providers, configure the following keys in your <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">.env.local</code> file:
            </p>
            <pre className="p-3 rounded bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto leading-relaxed">
{`# Parallel AI Task API (https://platform.parallel.ai)
PARALLEL_API_KEY=your_key_here

# OpenAI GPT-4o (https://platform.openai.com)
OPENAI_API_KEY=your_key_here

# Supabase PostgreSQL (https://supabase.com)
DATABASE_URL=postgres://postgres:[PASSWORD]@[HOST]:[PORT]/postgres`}
            </pre>
          </section>
        </>
      )}
    </div>
  );
}
