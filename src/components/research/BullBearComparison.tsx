"use client";

import React from "react";
import { TrendingUp, TrendingDown, ShieldAlert, Zap, ExternalLink } from "lucide-react";

interface BullBearComparisonProps {
  bullCase: {
    growthDrivers: string[];
    competitiveAdvantages: string[];
    potentialCatalysts: string[];
    supportingEvidence: string;
    citationIndices: number[];
  };
  bearCase: {
    executionRisks: string[];
    valuationRisks: string[];
    competitiveThreats: string[];
    invalidatingEvidence: string;
    citationIndices: number[];
  };
  onCitationClick?: (index: number) => void;
}

export function BullBearComparison({
  bullCase,
  bearCase,
  onCitationClick,
}: BullBearComparisonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Bull Case Column */}
      <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/20 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-emerald-200 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-emerald-100 text-emerald-800">
              <TrendingUp className="h-4 w-4" />
            </div>
            <h4 className="font-semibold text-sm text-emerald-950 uppercase tracking-tight">
              Bull Case Thesis (Upside Vectors)
            </h4>
          </div>
          <div className="flex items-center gap-1 font-mono text-[11px] text-emerald-800">
            {bullCase.citationIndices.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onCitationClick && onCitationClick(c)}
                className="bg-emerald-100 hover:bg-emerald-200 px-1.5 py-0.5 rounded font-semibold text-emerald-900 transition-colors"
              >
                [{c}]
              </button>
            ))}
          </div>
        </div>

        {/* Growth Drivers */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-emerald-900 block">
            Primary Growth Drivers
          </span>
          <ul className="space-y-1.5 text-xs text-slate-800">
            {bullCase.growthDrivers.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Moats */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-emerald-900 block">
            Competitive Advantages & Moats
          </span>
          <ul className="space-y-1.5 text-xs text-slate-800">
            {bullCase.competitiveAdvantages.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <Zap className="h-3 w-3 text-emerald-600 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Supporting Evidence */}
        <div className="pt-2 border-t border-emerald-200/60 text-xs text-emerald-950 bg-emerald-100/40 p-2.5 rounded">
          <span className="font-semibold block mb-0.5 font-mono text-[10px] uppercase text-emerald-900">
            Factual Basis & Evidence:
          </span>
          <p className="italic leading-relaxed">{bullCase.supportingEvidence}</p>
        </div>
      </div>

      {/* Bear Case Column */}
      <div className="rounded-lg border border-red-200/80 bg-red-50/20 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-red-200 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-red-100 text-red-800">
              <TrendingDown className="h-4 w-4" />
            </div>
            <h4 className="font-semibold text-sm text-red-950 uppercase tracking-tight">
              Bear Case Thesis (Downside Risks)
            </h4>
          </div>
          <div className="flex items-center gap-1 font-mono text-[11px] text-red-800">
            {bearCase.citationIndices.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onCitationClick && onCitationClick(c)}
                className="bg-red-100 hover:bg-red-200 px-1.5 py-0.5 rounded font-semibold text-red-900 transition-colors"
              >
                [{c}]
              </button>
            ))}
          </div>
        </div>

        {/* Execution & Valuation Risks */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-red-900 block">
            Execution & Customer Concentration Risks
          </span>
          <ul className="space-y-1.5 text-xs text-slate-800">
            {bearCase.executionRisks.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-red-600 font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Valuation & Competitive Threats */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-red-900 block">
            Competitive Threats & Multiple Vulnerability
          </span>
          <ul className="space-y-1.5 text-xs text-slate-800">
            {bearCase.competitiveThreats.concat(bearCase.valuationRisks).slice(0, 3).map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <ShieldAlert className="h-3 w-3 text-red-600 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Invalidating Evidence */}
        <div className="pt-2 border-t border-red-200/60 text-xs text-red-950 bg-red-100/40 p-2.5 rounded">
          <span className="font-semibold block mb-0.5 font-mono text-[10px] uppercase text-red-900">
            Thesis Invalidation Metric:
          </span>
          <p className="italic leading-relaxed">{bearCase.invalidatingEvidence}</p>
        </div>
      </div>
    </div>
  );
}
