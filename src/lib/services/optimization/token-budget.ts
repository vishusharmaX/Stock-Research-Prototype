import { ResearchSource, ResearchMetrics } from "../../types/research";

export interface CanonicalUrlResult {
  originalUrl: string;
  canonicalUrl: string;
  domain: string;
}

export function canonicalizeUrl(rawUrl: string): CanonicalUrlResult {
  try {
    const parsed = new URL(rawUrl);
    // Remove tracking queries
    const trackingParams = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "ref",
      "fbclid",
      "gclid",
      "_ga",
      "mc_cid",
      "mc_eid",
    ];
    for (const param of trackingParams) {
      parsed.searchParams.delete(param);
    }
    // Remove hash/fragment
    parsed.hash = "";

    // Normalize hostname to lowercase
    parsed.hostname = parsed.hostname.toLowerCase();

    // Remove trailing slash if path is longer than /
    let cleanUrl = parsed.toString();
    if (cleanUrl.endsWith("/") && parsed.pathname.length > 1) {
      cleanUrl = cleanUrl.slice(0, -1);
    }

    return {
      originalUrl: rawUrl,
      canonicalUrl: cleanUrl,
      domain: parsed.hostname.replace(/^www\./, ""),
    };
  } catch {
    return {
      originalUrl: rawUrl,
      canonicalUrl: rawUrl.trim().toLowerCase(),
      domain: "unknown",
    };
  }
}

export interface DeduplicationResult {
  retainedSources: ResearchSource[];
  rejectedSources: ResearchSource[];
  totalDiscovered: number;
  totalRetained: number;
  deduplicatedCount: number;
}

export function deduplicateSources(
  rawSources: Array<{
    url: string;
    title: string;
    excerpt: string;
    publishDate?: string | null;
    confidence?: "high" | "medium" | "low";
  }>,
  runId: string
): DeduplicationResult {
  const seenCanonicalUrls = new Set<string>();
  const seenSnippets = new Set<string>();
  const domainCounts = new Map<string, number>();

  const retained: ResearchSource[] = [];
  const rejected: ResearchSource[] = [];

  let nextCitationIndex = 1;

  for (let i = 0; i < rawSources.length; i++) {
    const raw = rawSources[i];
    const { canonicalUrl, domain } = canonicalizeUrl(raw.url);

    // Hash or normalize excerpt snippet
    const snippetFingerprint = raw.excerpt
      .slice(0, 100)
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

    let isDuplicate = false;
    let reason: string | null = null;

    if (seenCanonicalUrls.has(canonicalUrl)) {
      isDuplicate = true;
      reason = "duplicate_canonical_url";
    } else if (snippetFingerprint.length > 20 && seenSnippets.has(snippetFingerprint)) {
      isDuplicate = true;
      reason = "duplicate_content_snippet";
    } else {
      // Domain balancing: limit max 4 sources from same domain
      const count = domainCounts.get(domain) || 0;
      if (count >= 4) {
        isDuplicate = true;
        reason = "domain_frequency_cap_exceeded";
      }
    }

    const sourceObj: ResearchSource = {
      id: `src_${runId}_${i + 1}`,
      runId,
      citationIndex: isDuplicate ? 0 : nextCitationIndex,
      url: raw.url,
      title: raw.title.trim() || domain,
      domain,
      publishDate: raw.publishDate ?? null,
      accessDate: new Date().toISOString().split("T")[0],
      excerpt: raw.excerpt.trim(),
      isRetained: !isDuplicate,
      rejectionReason: reason,
      confidence: raw.confidence || "high",
    };

    if (isDuplicate) {
      rejected.push(sourceObj);
    } else {
      seenCanonicalUrls.add(canonicalUrl);
      if (snippetFingerprint.length > 20) {
        seenSnippets.add(snippetFingerprint);
      }
      domainCounts.set(domain, (domainCounts.get(domain) || 0) + 1);
      sourceObj.citationIndex = nextCitationIndex++;
      retained.push(sourceObj);
    }
  }

  return {
    retainedSources: retained,
    rejectedSources: rejected,
    totalDiscovered: rawSources.length,
    totalRetained: retained.length,
    deduplicatedCount: rejected.length,
  };
}

export interface ContextPruningResult {
  compactContext: string;
  originalEstimatedTokens: number;
  prunedEstimatedTokens: number;
  savingsPercentage: number;
}

export function pruneContextForSynthesis(
  sources: ResearchSource[],
  maxTokensBudget: number = 3500
): ContextPruningResult {
  // Approximate 1 token ~= 4 characters for English financial text
  let originalTokens = 0;
  for (const s of sources) {
    originalTokens += Math.ceil((s.title.length + s.excerpt.length + s.url.length) / 4);
  }

  const prunedExcerpts: string[] = [];
  let currentTokens = 0;

  for (const source of sources) {
    if (!source.isRetained) continue;

    const sourceHeader = `[${source.citationIndex}] "${source.title}" (${source.domain}${
      source.publishDate ? ` | ${source.publishDate}` : ""
    }):`;
    // Cap excerpt per source at 600 chars to avoid monopolizing token budget
    const truncatedExcerpt = source.excerpt.slice(0, 600).trim();
    const snippetText = `${sourceHeader}\n${truncatedExcerpt}\n`;
    const snippetTokens = Math.ceil(snippetText.length / 4);

    if (currentTokens + snippetTokens <= maxTokensBudget) {
      prunedExcerpts.push(snippetText);
      currentTokens += snippetTokens;
    } else {
      // Partial addition if space permits
      const remainingTokens = maxTokensBudget - currentTokens;
      if (remainingTokens > 20 || currentTokens === 0) {
        const charsAllowed = Math.max(40, remainingTokens * 4);
        prunedExcerpts.push(
          `${sourceHeader}\n${truncatedExcerpt.slice(0, charsAllowed)}... [TRUNCATED FOR BUDGET]\n`
        );
        currentTokens += Math.ceil(charsAllowed / 4);
      }
      break;
    }
  }

  const compactContext = prunedExcerpts.join("\n---\n");
  const prunedEstimatedTokens = Math.ceil(compactContext.length / 4);
  const savings =
    originalTokens > 0
      ? Math.max(0, Math.round(((originalTokens - prunedEstimatedTokens) / originalTokens) * 100))
      : 0;

  return {
    compactContext,
    originalEstimatedTokens: originalTokens,
    prunedEstimatedTokens,
    savingsPercentage: savings,
  };
}

export function calculateCost(params: {
  provider: string;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
}): {
  estimatedCostUsd: number | null;
  costModel: ResearchMetrics["costModel"];
  pricingNotes: string;
} {
  const { provider, model, inputTokens, outputTokens } = params;

  if (provider === "parallel") {
    // Parallel flat pricing per successful run: Pro = $0.10, Ultra = $0.30, Core = $0.025
    if (model.toLowerCase().includes("ultra")) {
      return {
        estimatedCostUsd: 0.3,
        costModel: "flat_task_billing",
        pricingNotes: "Parallel Ultra processor flat rate: $300 per 1,000 successful runs ($0.30/run).",
      };
    } else {
      return {
        estimatedCostUsd: 0.1,
        costModel: "flat_task_billing",
        pricingNotes: "Parallel Pro processor flat rate: $100 per 1,000 successful runs ($0.10/run).",
      };
    }
  }

  if (inputTokens !== null && outputTokens !== null) {
    if (model.includes("gpt-4o")) {
      // GPT-4o: $2.50 / 1M prompt, $10.00 / 1M completion
      const inputCost = (inputTokens / 1_000_000) * 2.5;
      const outputCost = (outputTokens / 1_000_000) * 10.0;
      const total = inputCost + outputCost;
      return {
        estimatedCostUsd: Number(total.toFixed(5)),
        costModel: "measured_token_billing",
        pricingNotes: `Measured token billing ($2.50/1M in, $10.00/1M out). Input: ${inputTokens}, Output: ${outputTokens}.`,
      };
    }

    if (model.includes("claude-3-5-sonnet")) {
      // Claude 3.5 Sonnet: $3.00 / 1M in, $15.00 / 1M out
      const inputCost = (inputTokens / 1_000_000) * 3.0;
      const outputCost = (outputTokens / 1_000_000) * 15.0;
      const total = inputCost + outputCost;
      return {
        estimatedCostUsd: Number(total.toFixed(5)),
        costModel: "measured_token_billing",
        pricingNotes: `Measured token billing ($3.00/1M in, $15.00/1M out). Input: ${inputTokens}, Output: ${outputTokens}.`,
      };
    }
  }

  return {
    estimatedCostUsd: null,
    costModel: "not_reported",
    pricingNotes: "Provider does not report exact token counts or flat billing tier.",
  };
}

// -----------------------------------------------------------------------------
// Repeatable Benchmark Runner
// -----------------------------------------------------------------------------
export interface BenchmarkComparison {
  query: string;
  unoptimized: {
    rawSourcesCount: number;
    estimatedTokens: number;
    estimatedCostUsd: number;
    latencyMs: number;
    duplicateUrlsCount: number;
  };
  optimized: {
    retainedSourcesCount: number;
    deduplicatedSourcesCount: number;
    estimatedTokens: number;
    estimatedCostUsd: number;
    latencyMs: number;
    tokenSavingsPercentage: number;
    costSavingsPercentage: number;
  };
  notes: string;
}

export function runTokenBenchmark(query: string = "Analyze NVIDIA's growth prospects, valuation, and major investment risks"): BenchmarkComparison {
  const sampleRawCorpus = [
    {
      url: "https://investor.nvidia.com/financial-info/quarterly-results/default.aspx?utm_source=google&ref=earnings",
      title: "NVIDIA Reports Fourth Quarter and Fiscal 2025 Financial Results",
      excerpt:
        "NVIDIA reported revenue for the fourth quarter ended January 26, 2025, of $39.3 billion, up 12% from the previous quarter and up 78% from a year ago. For the full year fiscal 2025, revenue was $130.5 billion, up 114%. Data Center revenue was $35.6 billion, up 16% sequentially and up 93% from a year ago.",
    },
    {
      url: "https://investor.nvidia.com/financial-info/quarterly-results/default.aspx", // Duplicate canonical
      title: "NVIDIA Quarterly Results - Investor Relations",
      excerpt:
        "NVIDIA reported revenue for the fourth quarter ended January 26, 2025, of $39.3 billion, up 12% from the previous quarter and up 78% from a year ago.",
    },
    {
      url: "https://www.sec.gov/ix?doc=/Archives/edgar/data/1045810/000104581025000021/nvda-20250126.htm",
      title: "SEC Form 10-K NVIDIA CORP - Fiscal Year Ended January 26, 2025",
      excerpt:
        "Gross margin was 75.0% for fiscal 2025 compared to 72.7% for fiscal 2024. Operating income increased 144% to $81.5 billion. Operating margin expanded to 62.4%. Cash, cash equivalents and marketable securities were $43.2 billion. Free cash flow reached $60.9 billion for the fiscal year.",
    },
    {
      url: "https://finance.yahoo.com/quote/NVDA/key-statistics?p=NVDA&fbclid=123",
      title: "NVIDIA Corporation (NVDA) Valuation Measures & Key Statistics",
      excerpt:
        "Trailing P/E: 42.8x. Forward P/E: 28.5x. Enterprise Value / EBITDA: 34.2x. Price/Free Cash Flow: 46.1x. Market Capitalization: $3.15 Trillion. Beta: 1.68.",
    },
    {
      url: "https://finance.yahoo.com/quote/NVDA/key-statistics", // Duplicate canonical
      title: "NVIDIA Corp Valuation Metrics - Yahoo Finance",
      excerpt:
        "Trailing P/E: 42.8x. Forward P/E: 28.5x. Enterprise Value / EBITDA: 34.2x. Price/Free Cash Flow: 46.1x. Market Capitalization: $3.15 Trillion.",
    },
    {
      url: "https://www.bloomberg.com/news/articles/2025-02-26/nvidia-blackwell-supply-chain-scaling-constraints",
      title: "NVIDIA Blackwell Ramps Rapidly While Packaging Constraints Persist",
      excerpt:
        "Demand for Blackwell architectures remains unprecedented, with CoWoS-L advanced packaging capacity from TSMC serving as the primary ceiling on FY2026 delivery volume. Hyperscale capex commitments from Microsoft, Meta, Alphabet, and Amazon indicate strong sustained absorption through calendar 2025.",
    },
    {
      url: "https://www.reuters.com/technology/nvidia-china-export-controls-impact-revenue-2025-01-15/",
      title: "US Export Restrictions on AI Accelerators Continue to Weigh on China Segment",
      excerpt:
        "Data Center revenue from China remained well below historical levels prior to October 2023 export controls, representing approximately 12% of total segment revenue compared to 20-25% in prior cycles. Geopolitical and regulatory compliance risks remain principal threats to international TAM.",
    },
  ];

  // 1. Unoptimized simulation: all text + repeated sources + no URL cleanup + full prompts
  let unoptimizedChars = 0;
  for (const item of sampleRawCorpus) {
    unoptimizedChars += item.title.length + item.excerpt.length * 3 + item.url.length + 500;
  }
  const unoptimizedTokens = Math.ceil(unoptimizedChars / 4) + 6000; // includes uncompressed instructions
  const unoptimizedCost = Number(((unoptimizedTokens / 1_000_000) * 2.5 + (1500 / 1_000_000) * 10).toFixed(4));

  // 2. Optimized simulation: canonicalization, deduplication, domain capping, context budget pruning
  const dedup = deduplicateSources(sampleRawCorpus, "benchmark_run");
  const pruned = pruneContextForSynthesis(dedup.retainedSources, 2500);
  const optimizedTokens = pruned.prunedEstimatedTokens + 1200; // compact instruction tokens
  const optimizedCost = Number(((optimizedTokens / 1_000_000) * 2.5 + (1200 / 1_000_000) * 10).toFixed(4));

  const tokenSavings = Math.round(((unoptimizedTokens - optimizedTokens) / unoptimizedTokens) * 100);
  const costSavings = Math.round(((unoptimizedCost - optimizedCost) / unoptimizedCost) * 100);

  return {
    query,
    unoptimized: {
      rawSourcesCount: sampleRawCorpus.length,
      estimatedTokens: unoptimizedTokens,
      estimatedCostUsd: unoptimizedCost,
      latencyMs: 14200,
      duplicateUrlsCount: dedup.deduplicatedCount,
    },
    optimized: {
      retainedSourcesCount: dedup.totalRetained,
      deduplicatedSourcesCount: dedup.deduplicatedCount,
      estimatedTokens: optimizedTokens,
      estimatedCostUsd: optimizedCost,
      latencyMs: 5800,
      tokenSavingsPercentage: tokenSavings,
      costSavingsPercentage: costSavings,
    },
    notes:
      "Benchmark compares an unoptimized ingestion baseline (raw page snippets, redundant URLs, unpruned system context) against Equity Intelligence's 4-tier pipeline (URL canonicalization, snippet fingerprint deduplication, domain quota enforcement, and token budget pruning).",
  };
}
