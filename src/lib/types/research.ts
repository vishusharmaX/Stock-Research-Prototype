import { z } from "zod";

export const ResearchStatusSchema = z.enum([
  "queued",
  "running",
  "completed",
  "failed",
  "cancelled",
]);
export type ResearchStatus = z.infer<typeof ResearchStatusSchema>;

export const ConfidenceLevelSchema = z.enum(["high", "medium", "low"]);
export type ConfidenceLevel = z.infer<typeof ConfidenceLevelSchema>;

export const ResearchEventSchema = z.object({
  id: z.string(),
  runId: z.string(),
  timestamp: z.string(),
  stepNumber: z.number(),
  phase: z.string(),
  type: z.string(),
  message: z.string(),
  payload: z.record(z.unknown()).default({}),
});
export type ResearchEvent = z.infer<typeof ResearchEventSchema>;

export const ResearchSourceSchema = z.object({
  id: z.string(),
  runId: z.string(),
  citationIndex: z.number(),
  url: z.string().url(),
  title: z.string(),
  domain: z.string(),
  publishDate: z.string().nullable().default(null),
  accessDate: z.string(),
  excerpt: z.string(),
  isRetained: z.boolean().default(true),
  rejectionReason: z.string().nullable().default(null),
  confidence: ConfidenceLevelSchema.default("high"),
});
export type ResearchSource = z.infer<typeof ResearchSourceSchema>;

export const ResearchMetricsSchema = z.object({
  runId: z.string(),
  provider: z.string(),
  model: z.string(),
  inputTokens: z.number().nullable().default(null),
  outputTokens: z.number().nullable().default(null),
  totalTokens: z.number().nullable().default(null),
  durationMs: z.number(),
  stepCount: z.number(),
  sourcesDiscovered: z.number(),
  sourcesRetained: z.number(),
  deduplicatedCount: z.number(),
  estimatedCostUsd: z.number().nullable().default(null),
  costModel: z.enum([
    "measured_token_billing",
    "flat_task_billing",
    "estimated",
    "not_reported",
  ]),
  pricingNotes: z.string().default(""),
});
export type ResearchMetrics = z.infer<typeof ResearchMetricsSchema>;

export const FinancialMetricItemSchema = z.object({
  metric: z.string(),
  value: z.string(),
  period: z.string(),
  currency: z.string().default("USD"),
  changeYoY: z.string().optional(),
  citationIndex: z.number().optional(),
  isUnavailable: z.boolean().default(false),
});
export type FinancialMetricItem = z.infer<typeof FinancialMetricItemSchema>;

export const KeyFindingSchema = z.object({
  id: z.string(),
  title: z.string(),
  explanation: z.string(),
  financialEvidence: z.string(),
  citationIndices: z.array(z.number()),
  confidence: ConfidenceLevelSchema,
});
export type KeyFinding = z.infer<typeof KeyFindingSchema>;

export const ValuationMultipleSchema = z.object({
  name: z.string(),
  currentValue: z.string(),
  peerAverage: z.string().optional(),
  historicalAverage: z.string().optional(),
  interpretation: z.string(),
  citationIndex: z.number().optional(),
});
export type ValuationMultiple = z.infer<typeof ValuationMultipleSchema>;

export const CatalystOrRiskSchema = z.object({
  type: z.enum(["catalyst", "risk"]),
  title: z.string(),
  impact: ConfidenceLevelSchema,
  timeframe: z.string(),
  explanation: z.string(),
  monitoringIndicators: z.string(),
  citationIndices: z.array(z.number()),
});
export type CatalystOrRisk = z.infer<typeof CatalystOrRiskSchema>;

export const ResearchReportSchema = z.object({
  header: z.object({
    companyName: z.string(),
    ticker: z.string().nullable().default(null),
    exchange: z.string().nullable().default(null),
    question: z.string(),
    asOfDate: z.string(),
    generatedAt: z.string(),
    sourceCount: z.number(),
    currency: z.string().default("USD"),
  }),
  executiveSummary: z.string(),
  keyFindings: z.array(KeyFindingSchema),
  financialSnapshot: z.array(FinancialMetricItemSchema),
  bullCase: z.object({
    growthDrivers: z.array(z.string()),
    competitiveAdvantages: z.array(z.string()),
    potentialCatalysts: z.array(z.string()),
    supportingEvidence: z.string(),
    citationIndices: z.array(z.number()),
  }),
  bearCase: z.object({
    executionRisks: z.array(z.string()),
    valuationRisks: z.array(z.string()),
    competitiveThreats: z.array(z.string()),
    invalidatingEvidence: z.string(),
    citationIndices: z.array(z.number()),
  }),
  valuation: z.object({
    multiples: z.array(ValuationMultipleSchema),
    keyAssumptions: z.array(z.string()),
    sensitivitySummary: z.string().optional(),
  }),
  catalystsAndRisks: z.array(CatalystOrRiskSchema),
  conclusion: z.object({
    thesisRecap: z.string(),
    principalVulnerability: z.string(),
    monitoringChecklist: z.array(z.string()),
    confidenceAssessment: z.object({
      level: ConfidenceLevelSchema,
      basis: z.string(),
    }),
    researchLimitations: z.array(z.string()),
  }),
  disclaimer: z.string(),
});
export type ResearchReport = z.infer<typeof ResearchReportSchema>;

export const ResearchRunSchema = z.object({
  id: z.string(),
  question: z.string(),
  normalizedTicker: z.string().nullable().default(null),
  companyName: z.string().nullable().default(null),
  status: ResearchStatusSchema,
  provider: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  completedAt: z.string().nullable().default(null),
  errorMessage: z.string().nullable().default(null),
  shareToken: z.string().nullable().default(null),
  shareTokenExpiresAt: z.string().nullable().default(null),
  report: ResearchReportSchema.optional(),
  metrics: ResearchMetricsSchema.optional(),
  events: z.array(ResearchEventSchema).optional(),
  sources: z.array(ResearchSourceSchema).optional(),
});
export type ResearchRun = z.infer<typeof ResearchRunSchema>;

export const SubmitResearchQuerySchema = z.object({
  question: z
    .string()
    .min(5, "Research question must be at least 5 characters long")
    .max(1000, "Research question must not exceed 1000 characters"),
  preferredProvider: z.enum(["auto", "parallel", "openai", "mock"]).default("auto"),
});
export type SubmitResearchQuery = z.infer<typeof SubmitResearchQuerySchema>;
