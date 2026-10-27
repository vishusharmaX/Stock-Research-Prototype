import { ResearchReport, ResearchMetrics, ResearchSource, ResearchEvent } from "../../types/research";

export interface ResearchExecutionCallbacks {
  onEvent: (event: Omit<ResearchEvent, "id" | "runId" | "timestamp">) => Promise<void>;
  isCancelled: () => boolean;
}

export interface ResearchProviderResult {
  report: ResearchReport;
  sources: ResearchSource[];
  metrics: ResearchMetrics;
  companyName: string;
  normalizedTicker: string | null;
}

export interface IResearchProvider {
  name: string;
  isConfigured(): boolean;
  execute(
    runId: string,
    question: string,
    callbacks: ResearchExecutionCallbacks
  ): Promise<ResearchProviderResult>;
}
