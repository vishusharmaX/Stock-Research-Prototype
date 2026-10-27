"use client";

import React from "react";
import { CheckCircle2, AlertCircle, Database, Cpu, Key, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProviderStatusProps {
  data: any;
}

export function ProviderStatus({ data }: ProviderStatusProps) {
  if (!data) return null;

  const providers = data.providers || {};
  const db = data.database || {};

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Parallel AI Task API */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-slate-900 text-white">
                <Cpu className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-foreground">
                  Parallel AI Task API
                </h4>
                <span className="text-[10px] font-mono text-muted-foreground uppercase">
                  Deep Research Engine
                </span>
              </div>
            </div>

            {providers.parallel?.status === "configured" ? (
              <Badge variant="positive" className="font-mono text-xs gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Configured
              </Badge>
            ) : (
              <Badge variant="warning" className="font-mono text-xs gap-1">
                <AlertCircle className="h-3 w-3" />
                Missing Key
              </Badge>
            )}
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Multi-step autonomous web exploration and synthesis. Charges flat task rates ($0.10–$0.30 per completed run).
          </p>

          <div className="pt-2 border-t border-border font-mono text-[11px] text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Required Env:</span>
              <code className="text-slate-800">PARALLEL_API_KEY</code>
            </div>
            <div className="flex justify-between">
              <span>Billing Model:</span>
              <span className="text-slate-700">Flat Task Pricing</span>
            </div>
          </div>
        </div>

        {/* OpenAI GPT-4o */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-slate-900 text-white">
                <Cpu className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-foreground">
                  OpenAI GPT-4o
                </h4>
                <span className="text-[10px] font-mono text-muted-foreground uppercase">
                  Structured Synthesis
                </span>
              </div>
            </div>

            {providers.openai?.status === "configured" ? (
              <Badge variant="positive" className="font-mono text-xs gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Configured
              </Badge>
            ) : (
              <Badge variant="warning" className="font-mono text-xs gap-1">
                <AlertCircle className="h-3 w-3" />
                Missing Key
              </Badge>
            )}
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Structured analytical synthesis, SEC EDGAR extraction, and strict Zod runtime schema verification.
          </p>

          <div className="pt-2 border-t border-border font-mono text-[11px] text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Required Env:</span>
              <code className="text-slate-800">OPENAI_API_KEY</code>
            </div>
            <div className="flex justify-between">
              <span>Billing Model:</span>
              <span className="text-slate-700">Token-Based ($2.50/$10)</span>
            </div>
          </div>
        </div>

        {/* Persistence & Database */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-slate-900 text-white">
                <Database className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-foreground">
                  Storage & Database
                </h4>
                <span className="text-[10px] font-mono text-muted-foreground uppercase">
                  Relational Persistence
                </span>
              </div>
            </div>

            <Badge variant="positive" className="font-mono text-xs gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Operational
            </Badge>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Current backend: <strong className="text-slate-900">{db.type}</strong>. Persists runs, reports, sources, and event logs.
          </p>

          <div className="pt-2 border-t border-border font-mono text-[11px] text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Total Runs Stored:</span>
              <span className="text-slate-800 font-bold">{db.totalRunsLogged || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Completed Runs:</span>
              <span className="text-slate-800">{db.completedRuns || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
