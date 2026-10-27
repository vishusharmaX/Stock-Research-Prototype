import { describe, it, expect } from "vitest";
import {
  SubmitResearchQuerySchema,
  ResearchReportSchema,
  ResearchReport,
} from "@/lib/types/research";
import {
  canonicalizeUrl,
  deduplicateSources,
  pruneContextForSynthesis,
  calculateCost,
} from "@/lib/services/optimization/token-budget";
import {
  formatTranscriptJson,
  formatTranscriptMarkdown,
} from "@/lib/services/export/formatter";
import { generateShareToken, hashShareToken } from "@/lib/services/security/tokens";

describe("Unit Tests: Research Input Validation", () => {
  it("accepts valid research questions within character boundaries", () => {
    const valid = SubmitResearchQuerySchema.safeParse({
      question: "Analyze NVIDIA's growth prospects, gross margin sustainability, and valuation risks.",
    });
    expect(valid.success).toBe(true);
  });

  it("rejects questions shorter than 5 characters", () => {
    const invalid = SubmitResearchQuerySchema.safeParse({ question: "NVDA" });
    expect(invalid.success).toBe(false);
  });

  it("rejects questions exceeding 1000 characters", () => {
    const invalid = SubmitResearchQuerySchema.safeParse({
      question: "a".repeat(1001),
    });
    expect(invalid.success).toBe(false);
  });
});

describe("Unit Tests: URL Canonicalization and Deduplication", () => {
  it("strips UTM tracking parameters and fragments", () => {
    const res = canonicalizeUrl(
      "https://investor.nvidia.com/financial-results?utm_source=twitter&utm_medium=social#overview/"
    );
    expect(res.canonicalUrl).toBe("https://investor.nvidia.com/financial-results");
    expect(res.domain).toBe("investor.nvidia.com");
  });

  it("deduplicates identical canonical URLs and content snippets", () => {
    const raw = [
      {
        url: "https://investor.nvidia.com/results?utm_source=1",
        title: "NVIDIA Financial Results",
        excerpt: "Revenue of $39.3 billion for the quarter.",
      },
      {
        url: "https://investor.nvidia.com/results?utm_source=2", // Canonical duplicate
        title: "NVIDIA Results",
        excerpt: "Revenue of $39.3 billion for the quarter.",
      },
      {
        url: "https://www.sec.gov/Archives/edgar/data/1045810/nvda.htm",
        title: "SEC Form 10-K",
        excerpt: "Audited balance sheet and free cash flow of $60.9B.",
      },
    ];

    const result = deduplicateSources(raw, "test_run_1");
    expect(result.totalDiscovered).toBe(3);
    expect(result.totalRetained).toBe(2);
    expect(result.deduplicatedCount).toBe(1);
    expect(result.rejectedSources[0].rejectionReason).toBe("duplicate_canonical_url");
  });

  it("prunes context to respect token budgets and reports savings", () => {
    const sources = [
      {
        id: "s1",
        runId: "run1",
        citationIndex: 1,
        url: "https://sec.gov/10k",
        title: "SEC 10-K",
        domain: "sec.gov",
        publishDate: "2025-01-01",
        accessDate: "2025-02-01",
        excerpt: "Detailed paragraph ".repeat(50),
        isRetained: true,
        rejectionReason: null,
        confidence: "high" as const,
      },
    ];

    const pruned = pruneContextForSynthesis(sources, 50);
    expect(pruned.prunedEstimatedTokens).toBeLessThanOrEqual(75);
    expect(pruned.prunedEstimatedTokens).toBeLessThan(pruned.originalEstimatedTokens);
    expect(pruned.compactContext).toContain("[1]");
  });
});

describe("Unit Tests: Cost Estimation and Pricing Models", () => {
  it("calculates flat task billing for Parallel processors correctly", () => {
    const ultra = calculateCost({
      provider: "parallel",
      model: "ultra",
      inputTokens: null,
      outputTokens: null,
    });
    expect(ultra.costModel).toBe("flat_task_billing");
    expect(ultra.estimatedCostUsd).toBe(0.3);

    const pro = calculateCost({
      provider: "parallel",
      model: "pro",
      inputTokens: null,
      outputTokens: null,
    });
    expect(pro.estimatedCostUsd).toBe(0.1);
  });

  it("calculates token-based billing for measured LLM runs", () => {
    const cost = calculateCost({
      provider: "openai",
      model: "gpt-4o",
      inputTokens: 100_000, // 0.1M * $2.50 = $0.25
      outputTokens: 20_000, // 0.02M * $10.00 = $0.20
    });
    expect(cost.costModel).toBe("measured_token_billing");
    expect(cost.estimatedCostUsd).toBe(0.45);
  });
});

describe("Unit Tests: Report Schema Validation & Serialization", () => {
  const sampleReport: ResearchReport = {
    header: {
      companyName: "NVIDIA Corporation",
      ticker: "NVDA",
      exchange: "NASDAQ",
      question: "Evaluate valuation and growth",
      asOfDate: "2025-02-26",
      generatedAt: "2025-02-26T12:00:00Z",
      sourceCount: 3,
      currency: "USD",
    },
    executiveSummary:
      "NVIDIA demonstrates extraordinary operational leverage with FY2025 revenue reaching $130.5B.",
    keyFindings: [
      {
        id: "kf1",
        title: "Growth Acceleration",
        explanation: "114% top line expansion.",
        financialEvidence: "Revenue $130.5B",
        citationIndices: [1],
        confidence: "high",
      },
    ],
    financialSnapshot: [
      {
        metric: "Revenue",
        value: "$130.5B",
        period: "FY2025",
        currency: "USD",
        citationIndex: 1,
        isUnavailable: false,
      },
    ],
    bullCase: {
      growthDrivers: ["Hyperscale capex"],
      competitiveAdvantages: ["CUDA moat"],
      potentialCatalysts: ["Blackwell shipment ramp"],
      supportingEvidence: "Confirmed in SEC 10-K disclosures.",
      citationIndices: [1],
    },
    bearCase: {
      executionRisks: ["Packaging ceiling"],
      valuationRisks: ["Multiple compression"],
      competitiveThreats: ["ASICs"],
      invalidatingEvidence: "Sequential revenue contraction.",
      citationIndices: [1],
    },
    valuation: {
      multiples: [
        {
          name: "Forward P/E",
          currentValue: "28.5x",
          interpretation: "Trading at justified premium.",
        },
      ],
      keyAssumptions: ["WACC: 9.25%"],
    },
    catalystsAndRisks: [
      {
        type: "catalyst",
        title: "Volume delivery",
        impact: "high",
        timeframe: "Q1-Q2 2025",
        explanation: "Volume deliveries begin.",
        monitoringIndicators: "Gross margin > 74.5%",
        citationIndices: [1],
      },
    ],
    conclusion: {
      thesisRecap: "Strong buy support.",
      principalVulnerability: "Capex pause.",
      monitoringChecklist: ["Form 10-Q filing"],
      confidenceAssessment: { level: "high", basis: "Audited data" },
      researchLimitations: ["Historical limits"],
    },
    disclaimer: "Not financial advice.",
  };

  it("validates valid research report against strict Zod schema", () => {
    const parsed = ResearchReportSchema.safeParse(sampleReport);
    expect(parsed.success).toBe(true);
  });

  it("formats transcript into JSON and clean Markdown with inline citations", () => {
    const run = {
      id: "run_test_123",
      question: "Evaluate valuation",
      normalizedTicker: "NVDA",
      companyName: "NVIDIA Corporation",
      status: "completed" as const,
      provider: "mock-deterministic",
      createdAt: "2025-02-26T10:00:00Z",
      updatedAt: "2025-02-26T10:05:00Z",
      completedAt: "2025-02-26T10:05:00Z",
      errorMessage: null,
      shareToken: null,
      shareTokenExpiresAt: null,
    };

    const json = formatTranscriptJson({
      run,
      report: sampleReport,
      events: [],
      sources: [],
    });
    expect(json).toContain("run_test_123");
    expect(json).toContain("NVIDIA Corporation");

    const md = formatTranscriptMarkdown({
      run,
      report: sampleReport,
      events: [],
      sources: [],
    });
    expect(md).toContain("# Equity Intelligence — Institutional Research Report");
    expect(md).toContain("## 1. Executive Summary");
    expect(md).toContain("## 3. Financial Performance Snapshot");
    expect(md).toContain("Forward P/E");
  });
});

describe("Unit Tests: Cryptographic Share Token Security", () => {
  it("generates 256-bit entropy token and valid HMAC-SHA256 hash", () => {
    const { rawToken, tokenHash, expiresAt } = generateShareToken("run_abc_123", 72);
    expect(rawToken).toContain("run_abc_123_");
    expect(tokenHash).toHaveLength(64); // SHA-256 hex string
    expect(new Date(expiresAt).getTime()).toBeGreaterThan(Date.now());

    // Verify hash consistency
    const computedHash = hashShareToken(rawToken);
    expect(computedHash).toBe(tokenHash);
  });
});
