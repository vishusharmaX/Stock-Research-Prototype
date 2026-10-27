"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ResearchReport,
  ResearchSource,
  ResearchMetrics,
  ResearchRun,
} from "@/lib/types/research";
import { FinancialMetricsTable } from "./FinancialMetricsTable";
import { BullBearComparison } from "./BullBearComparison";
import { SourcesDrawer } from "./SourcesDrawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Share2,
  FileCode,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { ShareDialog } from "../transcripts/ShareDialog";

interface ReportViewProps {
  run: ResearchRun;
  report: ResearchReport;
  sources: ResearchSource[];
  metrics?: ResearchMetrics;
}

export function ReportView({ run, report, sources, metrics }: ReportViewProps) {
  const [highlightedCitation, setHighlightedCitation] = useState<number | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const handleCitationClick = (index: number) => {
    setHighlightedCitation(index);
    const element = document.getElementById(`source-${index}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      const section = document.getElementById("research-sources-section");
      section?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <article className="w-full space-y-8 bg-background">
      {/* =========================================================================
          A. REPORT HEADER
      ========================================================================= */}
      <header className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-900 text-white tracking-wider">
                {report.header.ticker || "EQUITY"}
              </span>
              <span className="font-mono text-xs text-muted-foreground uppercase">
                {report.header.exchange || "US MARKETS"}
              </span>
              <span className="text-muted-foreground text-xs">•</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                <Calendar className="h-3 w-3 text-slate-400" />
                As of: {report.header.asOfDate}
              </span>
              <span className="text-muted-foreground text-xs">•</span>
              <span className="text-xs text-muted-foreground font-mono">
                {report.header.currency}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-serif">
              {report.header.companyName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              <span className="font-semibold text-slate-800">Inquiry:</span> "{report.header.question}"
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link href={`/transcripts/${run.id}`}>
              <Button variant="outline" size="sm" className="text-xs gap-1.5">
                <FileCode className="h-3.5 w-3.5 text-slate-600" />
                <span>Transcript & Telemetry</span>
              </Button>
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsShareOpen(true)}
              className="text-xs gap-1.5"
            >
              <Share2 className="h-3.5 w-3.5 text-slate-600" />
              <span>Share</span>
            </Button>

            <a
              href={`/api/transcripts/${run.id}/export?format=markdown`}
              download
              className="inline-flex"
            >
              <Button variant="subtle" size="sm" className="text-xs gap-1.5">
                <Download className="h-3.5 w-3.5" />
                <span>Export Markdown</span>
              </Button>
            </a>

            <a
              href={`/api/transcripts/${run.id}/export?format=json`}
              download
              className="inline-flex"
            >
              <Button variant="outline" size="sm" className="text-xs gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                <span>Export JSON</span>
              </Button>
            </a>
          </div>
        </div>

        {/* Metadata Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>
              Generated: <span className="text-slate-800">{new Date(report.header.generatedAt).toLocaleString()}</span>
            </span>
            <span>
              Sources Verified:{" "}
              <span className="text-slate-900 font-semibold">{report.header.sourceCount} primary citations</span>
            </span>
          </div>

          {metrics && (
            <div className="flex items-center gap-3">
              <span>
                Engine: <span className="text-slate-800">{metrics.provider} ({metrics.model})</span>
              </span>
              <span>
                Duration: <span className="text-slate-800">{(metrics.durationMs / 1000).toFixed(1)}s</span>
              </span>
            </div>
          )}
        </div>
      </header>

      {/* =========================================================================
          B. EXECUTIVE SUMMARY (~100-150 words)
      ========================================================================= */}
      <section className="rounded-xl border border-slate-300 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
          <div className="h-2 w-2 rounded-full bg-slate-900" />
          <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-900">
            Section 1 • Executive Summary & Central Thesis
          </h2>
        </div>
        <div className="text-sm sm:text-base leading-relaxed text-slate-900 font-serif font-normal">
          {report.executiveSummary}
        </div>
      </section>

      {/* =========================================================================
          C. KEY FINDINGS
      ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <div className="h-2 w-2 rounded-full bg-slate-900" />
          <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-900">
            Section 2 • Key Investment Findings & Supporting Evidence
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {report.keyFindings.map((finding) => (
            <div
              key={finding.id}
              className="rounded-lg border border-border bg-card p-5 space-y-3 shadow-2xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h3 className="font-semibold text-sm text-foreground leading-snug">
                    {finding.title}
                  </h3>
                  <div className="flex items-center gap-1 font-mono text-[10px] text-slate-600 shrink-0">
                    {finding.citationIndices.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => handleCitationClick(c)}
                        className="bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded font-bold text-slate-800"
                        title={`Jump to Source [${c}]`}
                      >
                        [{c}]
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {finding.explanation}
                </p>
              </div>

              <div className="pt-2.5 border-t border-slate-100 bg-slate-50/70 p-2.5 rounded text-xs text-slate-800">
                <span className="font-mono text-[10px] font-bold text-slate-700 uppercase block mb-0.5">
                  Audited Numerical Evidence:
                </span>
                <p className="font-mono text-[11px] leading-relaxed text-slate-900">
                  {finding.financialEvidence}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          D. FINANCIAL PERFORMANCE SNAPSHOT
      ========================================================================= */}
      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-slate-900" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-900">
              Section 3 • Audited Financial Metrics Snapshot
            </h2>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            Currency: {report.header.currency} • SEC Disclosures
          </span>
        </div>

        <FinancialMetricsTable
          metrics={report.financialSnapshot}
          onCitationClick={handleCitationClick}
        />
      </section>

      {/* =========================================================================
          E. BULL VS. BEAR CASE
      ========================================================================= */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <div className="h-2 w-2 rounded-full bg-slate-900" />
          <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-900">
            Section 4 • Thesis Tension: Balanced Bull vs. Bear Case
          </h2>
        </div>

        <BullBearComparison
          bullCase={report.bullCase}
          bearCase={report.bearCase}
          onCitationClick={handleCitationClick}
        />
      </section>

      {/* =========================================================================
          F. VALUATION MULTIPLES & SENSITIVITY
      ========================================================================= */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <div className="h-2 w-2 rounded-full bg-slate-900" />
          <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-900">
            Section 5 • Valuation Multiple Benchmarks & Assumptions
          </h2>
        </div>

        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-100/70 border-b border-border font-mono text-[11px] text-slate-700 uppercase">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Multiple Metric</th>
                <th className="py-2.5 px-4 font-semibold">Current Value</th>
                <th className="py-2.5 px-4 font-semibold">Peer Average</th>
                <th className="py-2.5 px-4 font-semibold">5-Yr Historical</th>
                <th className="py-2.5 px-4 font-semibold">Analytical Interpretation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-mono">
              {report.valuation.multiples.map((v, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-4 font-semibold font-sans text-slate-900">
                    {v.name}
                  </td>
                  <td className="py-2.5 px-4 font-bold text-slate-950">
                    {v.currentValue}
                  </td>
                  <td className="py-2.5 px-4 text-slate-600">
                    {v.peerAverage || "N/A"}
                  </td>
                  <td className="py-2.5 px-4 text-slate-600">
                    {v.historicalAverage || "N/A"}
                  </td>
                  <td className="py-2.5 px-4 font-sans text-slate-700">
                    {v.interpretation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="p-4 bg-slate-50/60 border-t border-border space-y-2">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-700 block">
              Core Valuation Assumptions & Sensitivities
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 font-mono">
              {report.valuation.keyAssumptions.map((assump, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="text-slate-400">›</span>
                  <span>{assump}</span>
                </div>
              ))}
            </div>
            {report.valuation.sensitivitySummary && (
              <p className="text-xs text-slate-600 italic pt-1 border-t border-slate-200">
                Sensitivity Note: {report.valuation.sensitivitySummary}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          G. CATALYSTS & RISKS SCHEDULE
      ========================================================================= */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <div className="h-2 w-2 rounded-full bg-slate-900" />
          <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-900">
            Section 6 • Material Catalysts & Risk Monitoring Schedule
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {report.catalystsAndRisks.map((item, idx) => {
            const isCatalyst = item.type === "catalyst";
            return (
              <div
                key={idx}
                className={`p-4 rounded-lg border text-xs space-y-2 ${
                  isCatalyst
                    ? "bg-emerald-50/30 border-emerald-200"
                    : "bg-red-50/30 border-red-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      isCatalyst
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {item.type} • {item.impact} impact
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">
                    Horizon: {item.timeframe}
                  </span>
                </div>
                <h4 className="font-semibold text-slate-900 text-sm">{item.title}</h4>
                <p className="text-slate-700 leading-relaxed">{item.explanation}</p>
                <div className="pt-2 border-t border-slate-200/80 font-mono text-[11px] text-slate-700">
                  <span className="font-semibold text-slate-900">Watch Indicator: </span>
                  {item.monitoringIndicators}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          H. CONCLUSION & MONITORING CHECKLIST
      ========================================================================= */}
      <section className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <div className="h-2 w-2 rounded-full bg-slate-900" />
          <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-900">
            Section 7 • Synthesis Conclusion & Falsification Checklist
          </h2>
        </div>

        <div className="space-y-3">
          <div>
            <span className="text-xs font-mono font-semibold text-slate-700 uppercase block mb-1">
              Thesis Recap:
            </span>
            <p className="text-sm text-slate-900 font-serif leading-relaxed">
              {report.conclusion.thesisRecap}
            </p>
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded text-xs text-amber-950 space-y-1">
            <span className="font-mono font-semibold uppercase tracking-wider text-amber-900 block flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-700" />
              Principal Reason Thesis Could Be Invalidated:
            </span>
            <p className="leading-relaxed">{report.conclusion.principalVulnerability}</p>
          </div>

          <div>
            <span className="text-xs font-mono font-semibold text-slate-700 uppercase block mb-1.5">
              Quarterly Monitoring Checklist:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-800">
              {report.conclusion.monitoringChecklist.map((item, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded bg-slate-50 border border-slate-200">
                  <div className="h-3.5 w-3.5 rounded border border-slate-400 bg-white" />
                  <span className="text-[11px]">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono text-muted-foreground">
            <div>
              <span>Confidence Assessment: </span>
              <span className="font-bold text-slate-900 uppercase">
                {report.conclusion.confidenceAssessment.level}
              </span>
              <span className="ml-1 text-slate-600">
                ({report.conclusion.confidenceAssessment.basis})
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          I. SOURCES & CITATIONS
      ========================================================================= */}
      <section className="space-y-3">
        <SourcesDrawer sources={sources} highlightedIndex={highlightedCitation} />
      </section>

      {/* =========================================================================
          REGULATORY DISCLAIMER
      ========================================================================= */}
      <footer className="p-4 rounded-lg border border-slate-200 bg-slate-100/60 text-center text-[11px] text-slate-600 space-y-1 font-mono">
        <p className="font-semibold uppercase tracking-wider text-slate-700">
          Regulatory Notice & Analytical Disclaimer
        </p>
        <p className="max-w-4xl mx-auto leading-relaxed">
          {report.disclaimer}
        </p>
      </footer>

      {/* Share Modal Dialog */}
      <ShareDialog
        runId={run.id}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />
    </article>
  );
}
