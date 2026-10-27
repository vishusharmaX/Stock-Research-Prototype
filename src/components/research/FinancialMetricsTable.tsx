"use client";

import React from "react";
import { FinancialMetricItem } from "@/lib/types/research";
import { Table, ArrowUpRight, ArrowDownRight, ExternalLink } from "lucide-react";

interface FinancialMetricsTableProps {
  metrics: FinancialMetricItem[];
  onCitationClick?: (index: number) => void;
}

export function FinancialMetricsTable({
  metrics,
  onCitationClick,
}: FinancialMetricsTableProps) {
  if (!metrics || metrics.length === 0) {
    return (
      <div className="p-4 rounded-lg border border-border bg-slate-50 text-xs text-slate-500 italic">
        Audited financial metrics were not accessible for the specified period.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full text-left text-xs font-sans">
        <thead className="bg-slate-100/70 border-b border-border font-mono text-[11px] text-slate-700 uppercase tracking-wider">
          <tr>
            <th className="py-2.5 px-4 font-semibold">Financial Metric</th>
            <th className="py-2.5 px-4 font-semibold">Reported Value</th>
            <th className="py-2.5 px-4 font-semibold">Period</th>
            <th className="py-2.5 px-4 font-semibold">YoY Variance</th>
            <th className="py-2.5 px-4 font-semibold text-right">Verification</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border font-mono">
          {metrics.map((item, idx) => {
            const isPositive = item.changeYoY?.startsWith("+");
            const isNegative = item.changeYoY?.startsWith("-");

            return (
              <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-2.5 px-4 font-sans font-medium text-slate-900">
                  {item.metric}
                </td>
                <td className="py-2.5 px-4 font-semibold text-slate-950">
                  {item.isUnavailable ? (
                    <span className="text-slate-400 italic font-sans">Unavailable</span>
                  ) : (
                    item.value
                  )}
                </td>
                <td className="py-2.5 px-4 text-slate-600">
                  {item.period} ({item.currency})
                </td>
                <td className="py-2.5 px-4">
                  {item.changeYoY ? (
                    <span
                      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                        isPositive
                          ? "text-emerald-700 bg-emerald-50"
                          : isNegative
                          ? "text-red-700 bg-red-50"
                          : "text-slate-700 bg-slate-100"
                      }`}
                    >
                      {isPositive ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : isNegative ? (
                        <ArrowDownRight className="h-3 w-3" />
                      ) : null}
                      {item.changeYoY}
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="py-2.5 px-4 text-right">
                  {item.citationIndex ? (
                    <button
                      type="button"
                      onClick={() => onCitationClick && onCitationClick(item.citationIndex!)}
                      className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded transition-colors"
                      title={`Jump to Source [${item.citationIndex}]`}
                    >
                      <span>[{item.citationIndex}]</span>
                      <ExternalLink className="h-2.5 w-2.5 text-slate-500" />
                    </button>
                  ) : (
                    <span className="text-slate-400 text-[10px]">Uncited</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
