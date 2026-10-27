import { getRepository, IResearchRepository } from "../../db/repository";
import { IResearchProvider } from "./provider-interface";
import { ParallelDeepResearchProvider } from "./parallel-provider";
import { LLMDeepResearchProvider } from "./llm-provider";
import { MockDeterministicProvider } from "./mock-deterministic-provider";
import { ResearchEvent, ResearchRun } from "../../types/research";

export class ResearchOrchestrator {
  private repository: IResearchRepository;
  private activeCancellations: Set<string> = new Set();

  constructor(repository?: IResearchRepository) {
    this.repository = repository || getRepository();
  }

  getProvider(preferred: string = "auto"): { provider: IResearchProvider; providerName: string } {
    const parallel = new ParallelDeepResearchProvider();
    const openai = new LLMDeepResearchProvider();
    const mock = new MockDeterministicProvider();

    if (preferred === "parallel") {
      if (parallel.isConfigured()) return { provider: parallel, providerName: "parallel" };
      throw new Error("Parallel provider was selected, but PARALLEL_API_KEY is not configured.");
    }

    if (preferred === "openai") {
      if (openai.isConfigured()) return { provider: openai, providerName: "openai" };
      throw new Error("OpenAI provider was selected, but OPENAI_API_KEY is not configured.");
    }

    if (preferred === "mock") {
      return { provider: mock, providerName: "mock-deterministic" };
    }

    // Auto selection: prefer Parallel if key set, else OpenAI, else Mock
    if (parallel.isConfigured()) {
      return { provider: parallel, providerName: "parallel" };
    }
    if (openai.isConfigured()) {
      return { provider: openai, providerName: "openai" };
    }
    return { provider: mock, providerName: "mock-deterministic" };
  }

  cancelRun(runId: string): boolean {
    this.activeCancellations.add(runId);
    return true;
  }

  async startResearch(params: {
    runId: string;
    question: string;
    preferredProvider?: string;
  }): Promise<ResearchRun> {
    const { runId, question, preferredProvider = "auto" } = params;
    const { provider, providerName } = this.getProvider(preferredProvider);

    // Create initial run record
    const run = await this.repository.createRun({
      id: runId,
      question,
      provider: providerName,
    });

    // Record initial event
    await this.repository.addEvent({
      id: `ev_${runId}_1`,
      runId,
      stepNumber: 1,
      phase: "planning",
      type: "run_created",
      message: `Research run initiated. Selected provider: '${providerName}'.`,
      payload: { provider: providerName, preferred: preferredProvider },
      timestamp: new Date().toISOString(),
    });

    // Execute asynchronously (don't block the HTTP request)
    this.executeInBackground(runId, question, provider).catch((err) => {
      console.error(`Unhandled error in research execution for run ${runId}:`, err);
    });

    return run;
  }

  private async executeInBackground(
    runId: string,
    question: string,
    provider: IResearchProvider
  ) {
    try {
      await this.repository.updateRunStatus(runId, "running");

      const callbacks = {
        onEvent: async (ev: Omit<ResearchEvent, "id" | "runId" | "timestamp">) => {
          const fullEvent: ResearchEvent = {
            id: `ev_${runId}_${ev.stepNumber}_${Date.now()}`,
            runId,
            timestamp: new Date().toISOString(),
            ...ev,
          };
          await this.repository.addEvent(fullEvent);
        },
        isCancelled: () => this.activeCancellations.has(runId),
      };

      const result = await provider.execute(runId, question, callbacks);

      if (this.activeCancellations.has(runId)) {
        await this.repository.updateRunStatus(
          runId,
          "cancelled",
          "Research cancelled by user request."
        );
        this.activeCancellations.delete(runId);
        return;
      }

      // Persist sources, report, and metrics
      await this.repository.saveSources(result.sources);
      await this.repository.saveReport(runId, result.report);
      await this.repository.saveMetrics(result.metrics);

      // Final completion event
      await this.repository.addEvent({
        id: `ev_${runId}_completed_${Date.now()}`,
        runId,
        stepNumber: result.metrics.stepCount + 1,
        phase: "completed",
        type: "run_completed",
        message: `Research workflow completed successfully for ${result.companyName} (${result.normalizedTicker || "N/A"}). Final report and ${result.sources.length} sources persisted.`,
        payload: {
          durationMs: result.metrics.durationMs,
          sourcesRetained: result.sources.length,
          totalTokens: result.metrics.totalTokens,
        },
        timestamp: new Date().toISOString(),
      });

      await this.repository.updateRunStatus(
        runId,
        "completed",
        null,
        new Date().toISOString(),
        result.normalizedTicker,
        result.companyName
      );
    } catch (error: any) {
      const isCancelled = this.activeCancellations.has(runId);
      const status = isCancelled ? "cancelled" : "failed";
      const errorMsg = error?.message || "An unexpected error occurred during research execution.";

      await this.repository.addEvent({
        id: `ev_${runId}_err_${Date.now()}`,
        runId,
        stepNumber: 999,
        phase: "error",
        type: isCancelled ? "cancelled" : "provider_error",
        message: isCancelled ? "Research run was cancelled by user." : errorMsg,
        payload: { error: errorMsg },
        timestamp: new Date().toISOString(),
      });

      await this.repository.updateRunStatus(
        runId,
        status,
        errorMsg,
        new Date().toISOString()
      );

      this.activeCancellations.delete(runId);
    }
  }
}

let orchestratorInstance: ResearchOrchestrator | null = null;
export function getOrchestrator(): ResearchOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new ResearchOrchestrator();
  }
  return orchestratorInstance;
}
