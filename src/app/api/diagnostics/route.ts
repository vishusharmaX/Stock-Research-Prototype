import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/lib/db/repository";
import { ParallelDeepResearchProvider } from "@/lib/services/research/parallel-provider";
import { LLMDeepResearchProvider } from "@/lib/services/research/llm-provider";
import { runTokenBenchmark } from "@/lib/services/optimization/token-budget";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const benchmarkQuery = searchParams.get("benchmarkQuery") || undefined;

    const parallel = new ParallelDeepResearchProvider();
    const openai = new LLMDeepResearchProvider();
    const dbUrl = process.env.DATABASE_URL;

    const repository = getRepository();
    const history = await repository.listRuns({ limit: 100 });

    let totalTokensMeasured = 0;
    let totalCostEstimated = 0;
    let totalCompletedRuns = 0;

    for (const r of history.items) {
      if (r.status === "completed") {
        totalCompletedRuns++;
        if (r.metrics?.totalTokens) totalTokensMeasured += r.metrics.totalTokens;
        if (r.metrics?.estimatedCostUsd) totalCostEstimated += r.metrics.estimatedCostUsd;
      }
    }

    const benchmark = runTokenBenchmark(benchmarkQuery);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      providers: {
        parallel: {
          name: "Parallel AI Task API (Deep Research)",
          status: parallel.isConfigured() ? "configured" : "missing_key",
          processor: "ultra / pro",
          billingModel: "Flat task pricing ($0.10-$0.30 per completed run)",
          requiresEnv: "PARALLEL_API_KEY",
        },
        openai: {
          name: "OpenAI GPT-4o Multi-Stage Deep Research",
          status: openai.isConfigured() ? "configured" : "missing_key",
          model: "gpt-4o",
          billingModel: "Measured token billing ($2.50 / $10.00 per 1M tokens)",
          requiresEnv: "OPENAI_API_KEY",
        },
        mockDeterministic: {
          name: "Deterministic Institutional Fixture Provider",
          status: "active",
          model: "institutional-benchmark-v1",
          billingModel: "Deterministic fixture metrics",
          notes: "Available for automated testing, offline evaluation, and zero-credential demos.",
        },
      },
      database: {
        type: dbUrl && dbUrl.trim().length > 0 ? "PostgreSQL (Supabase / Remote)" : "Local Persistent File Storage (.data/)",
        status: "operational",
        totalRunsLogged: history.total,
        completedRuns: totalCompletedRuns,
      },
      telemetry: {
        totalTokensLogged: totalTokensMeasured,
        totalCostLoggedUsd: Number(totalCostEstimated.toFixed(4)),
        averageTokensPerRun: totalCompletedRuns > 0 ? Math.round(totalTokensMeasured / totalCompletedRuns) : 0,
      },
      tokenEfficiencyBenchmark: benchmark,
    });
  } catch (error: any) {
    console.error("API /api/diagnostics error:", error);
    return NextResponse.json({ error: error?.message || "Diagnostics failed" }, { status: 500 });
  }
}
