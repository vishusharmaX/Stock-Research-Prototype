"use client";

import React, { useState } from "react";
import { ArrowRight, Sparkles, Terminal, CornerDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface PromptFormProps {
  onSubmit: (question: string, provider: "auto" | "parallel" | "openai" | "mock") => void;
  isLoading: boolean;
}

const EXAMPLE_PROMPTS = [
  {
    title: "NVIDIA Growth & Valuation",
    query: "Analyze NVIDIA's growth prospects, valuation, and major investment risks.",
    ticker: "NVDA",
  },
  {
    title: "Microsoft Institutional Report",
    query: "Prepare an equity research report on Microsoft.",
    ticker: "MSFT",
  },
  {
    title: "Apple vs. Alphabet",
    query: "Compare Apple and Alphabet as long-term investment opportunities.",
    ticker: "AAPL / GOOGL",
  },
  {
    title: "Tesla Margin & Delivery Risks",
    query: "Analyze Tesla's revenue growth, margins, competitive position, cash flow, and valuation risks.",
    ticker: "TSLA",
  },
];

export function PromptForm({ onSubmit, isLoading }: PromptFormProps) {
  const [question, setQuestion] = useState("");
  const [provider, setProvider] = useState<"auto" | "parallel" | "openai" | "mock">("auto");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!question.trim()) {
      setError("Please enter a research question.");
      return;
    }
    if (question.trim().length < 5) {
      setError("Research query must be at least 5 characters.");
      return;
    }
    setError(null);
    onSubmit(question.trim(), provider);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full bg-card rounded-xl border border-border p-6 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-slate-700" />
          <h2 className="text-sm font-semibold text-foreground tracking-tight">
            Institutional Research Query
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="provider-select" className="text-xs text-muted-foreground font-mono">
            Provider:
          </label>
          <select
            id="provider-select"
            value={provider}
            onChange={(e) => setProvider(e.target.value as any)}
            className="text-xs rounded border border-border bg-background px-2 py-1 font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
            disabled={isLoading}
          >
            <option value="auto">Auto-Select (Best Available)</option>
            <option value="parallel">Parallel AI Task API</option>
            <option value="openai">OpenAI GPT-4o</option>
            <option value="mock">Deterministic Benchmark Fixture</option>
          </select>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Textarea
            value={question}
            onChange={(e) => {
              setQuestion(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="E.g., Analyze NVIDIA's growth prospects, gross margin sustainability, and valuation risks..."
            className="min-h-[105px] resize-none pr-4 text-sm font-sans leading-relaxed focus-visible:ring-1 focus-visible:ring-slate-900"
            disabled={isLoading}
            maxLength={1000}
          />
          <div className="absolute right-3 bottom-3 flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
            <span>{question.length}/1000</span>
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-600 font-medium">{error}</p>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-mono">
            <span className="hidden sm:inline-block">Press</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-[10px] text-slate-700">
              Ctrl + Enter
            </kbd>
            <span className="hidden sm:inline-block">to execute</span>
          </div>

          <Button
            type="submit"
            disabled={isLoading || !question.trim()}
            className="w-full sm:w-auto font-medium gap-2 px-5 bg-slate-900 hover:bg-slate-800 text-white"
          >
            {isLoading ? (
              <>
                <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                <span>Executing Research...</span>
              </>
            ) : (
              <>
                <span>Generate Thesis</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Suggested Prompt Chips */}
      <div className="mt-6 pt-5 border-t border-border">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2.5">
          <Sparkles className="h-3.5 w-3.5 text-slate-500" />
          <span className="font-medium text-slate-700">Suggested Research Vectors:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {EXAMPLE_PROMPTS.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setQuestion(item.query);
                if (error) setError(null);
              }}
              disabled={isLoading}
              className="text-left p-2.5 rounded-md border border-border bg-slate-50/70 hover:bg-slate-100 hover:border-slate-300 transition-all text-xs group disabled:opacity-50"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-900 group-hover:text-slate-950">
                  {item.title}
                </span>
                <span className="font-mono text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                  {item.ticker}
                </span>
              </div>
              <p className="text-slate-600 line-clamp-1 text-[11px]">
                {item.query}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
