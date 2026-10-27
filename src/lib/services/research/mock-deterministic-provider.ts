import {
  IResearchProvider,
  ResearchExecutionCallbacks,
  ResearchProviderResult,
} from "./provider-interface";
import {
  ResearchReport,
  ResearchSource,
  ResearchMetrics,
} from "../../types/research";
import { deduplicateSources, calculateCost } from "../optimization/token-budget";

export class MockDeterministicProvider implements IResearchProvider {
  public name = "mock-deterministic";

  isConfigured(): boolean {
    return true; // Always available for deterministic testing and zero-credential offline demos
  }

  async execute(
    runId: string,
    question: string,
    callbacks: ResearchExecutionCallbacks
  ): Promise<ResearchProviderResult> {
    const startTime = Date.now();
    let stepNumber = 1;

    // Detect target company from query
    const qLower = question.toLowerCase();
    let companyName = "NVIDIA Corporation";
    let ticker = "NVDA";
    let exchange = "NASDAQ";

    if (qLower.includes("microsoft") || qLower.includes("msft")) {
      companyName = "Microsoft Corporation";
      ticker = "MSFT";
      exchange = "NASDAQ";
    } else if (qLower.includes("apple") || qLower.includes("aapl")) {
      companyName = "Apple Inc.";
      ticker = "AAPL";
      exchange = "NASDAQ";
    } else if (qLower.includes("alphabet") || qLower.includes("google") || qLower.includes("goog")) {
      companyName = "Alphabet Inc.";
      ticker = "GOOGL";
      exchange = "NASDAQ";
    } else if (qLower.includes("tesla") || qLower.includes("tsla")) {
      companyName = "Tesla, Inc.";
      ticker = "TSLA";
      exchange = "NASDAQ";
    }

    // Step 1: Planning
    await callbacks.onEvent({
      stepNumber: stepNumber++,
      phase: "planning",
      type: "question_analyzed",
      message: `Deconstructing research inquiry: identified target entity '${companyName}' (${ticker}). Formulating multi-stage investigation protocol.`,
      payload: { companyName, ticker, normalizedQuestion: question },
    });

    if (callbacks.isCancelled()) throw new Error("Run cancelled");
    await new Promise((r) => setTimeout(r, 400));

    // Step 2: Source Discovery
    await callbacks.onEvent({
      stepNumber: stepNumber++,
      phase: "discovery",
      type: "sources_queried",
      message: `Initiating parallel retrieval across SEC EDGAR, investor relations filings, and verified financial disclosures for ${ticker}.`,
      payload: {
        targetDomains: ["sec.gov", "investor." + ticker.toLowerCase() + ".com", "bloomberg.com", "reuters.com"],
      },
    });

    if (callbacks.isCancelled()) throw new Error("Run cancelled");
    await new Promise((r) => setTimeout(r, 500));

    // Step 3: Raw Sources with intentional duplicates for deduplication demonstration
    const rawSources = [
      {
        url: `https://investor.${ticker.toLowerCase()}.com/financial-results/annual-report?utm_source=institutional_feed&ref=sec_filing`,
        title: `${companyName} Full Year Audited Financial Results and Operations Review`,
        excerpt: `${companyName} announced audited full-year financial figures showing operating margin expansion, record enterprise revenue, and disciplined capital allocation.`,
        publishDate: "2025-02-15",
        confidence: "high" as const,
      },
      {
        url: `https://investor.${ticker.toLowerCase()}.com/financial-results/annual-report`, // Canonical duplicate
        title: `${companyName} Financial Results Summary`,
        excerpt: `${companyName} announced audited full-year financial figures showing operating margin expansion.`,
        publishDate: "2025-02-15",
        confidence: "high" as const,
      },
      {
        url: `https://www.sec.gov/ix?doc=/Archives/edgar/data/0001045810/annual-report-10k.htm`,
        title: `U.S. SEC Form 10-K Annual Report — ${companyName}`,
        excerpt: `Audited balance sheet disclosures: Cash, cash equivalents and marketable securities total $43.2B. Annual free cash flow conversion reached 46.7% of total revenues with zero material long-term debt maturities in FY26.`,
        publishDate: "2025-02-20",
        confidence: "high" as const,
      },
      {
        url: `https://finance.yahoo.com/quote/${ticker}/key-statistics?p=${ticker}&gclid=promo123`,
        title: `${companyName} (${ticker}) Valuation Multiples and Capital Structure`,
        excerpt: `Key valuation measures: Trailing P/E 42.8x, Forward P/E 28.5x, Enterprise Value / EBITDA 34.2x, Price to Free Cash Flow 46.1x. Market capitalization $3.15T.`,
        publishDate: "2025-02-26",
        confidence: "high" as const,
      },
      {
        url: `https://finance.yahoo.com/quote/${ticker}/key-statistics`, // Canonical duplicate
        title: `${companyName} Key Statistics & Valuation Summary`,
        excerpt: `Key valuation measures: Trailing P/E 42.8x, Forward P/E 28.5x, Enterprise Value / EBITDA 34.2x.`,
        publishDate: "2025-02-26",
        confidence: "high" as const,
      },
      {
        url: `https://www.bloomberg.com/news/articles/2025-02-24/${ticker.toLowerCase()}-enterprise-capex-demand-absorption`,
        title: `Hyperscale Capex Allocations and Enterprise Demand Drivers for ${companyName}`,
        excerpt: `Consensus checks confirm top 4 hyperscale cloud providers have expanded collective 2025 capex budgets by 28% YoY, ensuring uninterrupted commercial backlog absorption for next-generation compute architectures.`,
        publishDate: "2025-02-24",
        confidence: "high" as const,
      },
      {
        url: `https://www.reuters.com/markets/companies/${ticker.toLowerCase()}-regulatory-export-scrutiny-2025`,
        title: `Geopolitical Scrutiny and Export Restrictions Impact on ${companyName}`,
        excerpt: `Regulatory disclosures highlight export licensing restrictions and supply-chain packaging bottlenecks as principal near-term variance risks to gross margin assumptions.`,
        publishDate: "2025-02-18",
        confidence: "medium" as const,
      },
    ];

    const dedup = deduplicateSources(rawSources, runId);

    await callbacks.onEvent({
      stepNumber: stepNumber++,
      phase: "extraction",
      type: "sources_deduplicated",
      message: `Extracted ${dedup.totalDiscovered} candidate sources. Pruned ${dedup.deduplicatedCount} redundant/duplicate URLs; preserved ${dedup.totalRetained} high-signal primary sources.`,
      payload: {
        discovered: dedup.totalDiscovered,
        retained: dedup.totalRetained,
        deduplicated: dedup.deduplicatedCount,
      },
    });

    if (callbacks.isCancelled()) throw new Error("Run cancelled");
    await new Promise((r) => setTimeout(r, 450));

    // Step 4: Financial extraction
    await callbacks.onEvent({
      stepNumber: stepNumber++,
      phase: "extraction",
      type: "financial_metrics_extracted",
      message: `Extracted audited GAAP financials: Revenue, gross margin, operating margin, free cash flow, and valuation multiples.`,
      payload: { ticker, currency: "USD", reportingPeriod: "FY2025" },
    });

    if (callbacks.isCancelled()) throw new Error("Run cancelled");
    await new Promise((r) => setTimeout(r, 400));

    // Step 5: Synthesis
    await callbacks.onEvent({
      stepNumber: stepNumber++,
      phase: "synthesis",
      type: "thesis_synthesized",
      message: `Synthesizing balanced Bull vs. Bear analytical matrix, catalyst schedule, and 12-month monitoring parameters.`,
      payload: { confidenceLevel: "high" },
    });

    if (callbacks.isCancelled()) throw new Error("Run cancelled");
    await new Promise((r) => setTimeout(r, 450));

    // Step 6: Citation Verification
    await callbacks.onEvent({
      stepNumber: stepNumber++,
      phase: "verification",
      type: "citations_verified",
      message: `Verified all inline numerical claims against primary SEC EDGAR Form 10-K and audited financial filings.`,
      payload: { totalCitationsVerified: dedup.totalRetained },
    });

    const durationMs = Date.now() - startTime;

    // Build realistic structured report
    const report: ResearchReport = {
      header: {
        companyName,
        ticker,
        exchange,
        question,
        asOfDate: "2025-02-26",
        generatedAt: new Date().toISOString(),
        sourceCount: dedup.totalRetained,
        currency: "USD",
      },
      executiveSummary: `${companyName} (${ticker}) demonstrates extraordinary operational leverage and pricing power, anchored by an expanding enterprise customer base and structural free cash flow generation. FY2025 performance underscores sustained top-line acceleration, with gross margins stabilizing at institutional highs of 75.0%. While hyperscale capex commitments provide strong near-term earnings visibility, the central investment risks remain supply-chain advanced packaging bottlenecks and geopolitical export licensing constraints. At 28.5x forward P/E, the valuation trades at a justified premium to mega-cap technology peers, supported by superior cash conversion.`,
      keyFindings: [
        {
          id: "kf_1",
          title: "Structural Top-Line Acceleration and Enterprise Moat",
          explanation: `${companyName} delivered $130.5 billion in full-year revenue, driven by unprecedented datacenter and commercial absorption. The software ecosystem creates high customer switching barriers.`,
          financialEvidence: `Revenue expanded 114% YoY to $130.5B; enterprise compute segment contributed over 85% of incremental revenue.`,
          citationIndices: [1, 2],
          confidence: "high",
        },
        {
          id: "kf_2",
          title: "Exceptional Operating Leverage and Free Cash Flow Conversion",
          explanation: `Operating income surged to $81.5B, translating into an operating margin of 62.4%. Free cash flow conversion exceeded 46% of total revenue with zero short-term debt refinancing pressure.`,
          financialEvidence: `Free cash flow reached $60.9B for the fiscal year; liquid cash and marketable reserves closed at $43.2B.`,
          citationIndices: [2],
          confidence: "high",
        },
        {
          id: "kf_3",
          title: "Valuation Premium Supported by High Incremental ROIC",
          explanation: `Trading at 28.5x forward P/E and 34.2x EV/EBITDA, current multiples reflect premium positioning relative to historical averages (5-year median 36.4x), leaving moderate valuation margin of safety.`,
          financialEvidence: `Forward P/E of 28.5x compares favorably against consensus forecast 3-year EPS CAGR of 38%.`,
          citationIndices: [3],
          confidence: "high",
        },
      ],
      financialSnapshot: [
        {
          metric: "Total Revenue",
          value: "$130.5B",
          period: "FY2025",
          currency: "USD",
          changeYoY: "+114%",
          citationIndex: 1,
          isUnavailable: false,
        },
        {
          metric: "Gross Margin",
          value: "75.0%",
          period: "FY2025",
          currency: "USD",
          changeYoY: "+230 bps",
          citationIndex: 2,
          isUnavailable: false,
        },
        {
          metric: "Operating Margin",
          value: "62.4%",
          period: "FY2025",
          currency: "USD",
          changeYoY: "+770 bps",
          citationIndex: 2,
          isUnavailable: false,
        },
        {
          metric: "Net Income",
          value: "$72.9B",
          period: "FY2025",
          currency: "USD",
          changeYoY: "+145%",
          citationIndex: 2,
          isUnavailable: false,
        },
        {
          metric: "Free Cash Flow",
          value: "$60.9B",
          period: "FY2025",
          currency: "USD",
          changeYoY: "+125%",
          citationIndex: 2,
          isUnavailable: false,
        },
        {
          metric: "Cash & Marketable Securities",
          value: "$43.2B",
          period: "Q4 FY2025",
          currency: "USD",
          changeYoY: "+66%",
          citationIndex: 2,
          isUnavailable: false,
        },
        {
          metric: "Trailing P/E",
          value: "42.8x",
          period: "As of Feb 2025",
          currency: "USD",
          citationIndex: 3,
          isUnavailable: false,
        },
        {
          metric: "Forward P/E",
          value: "28.5x",
          period: "Next 12M",
          currency: "USD",
          citationIndex: 3,
          isUnavailable: false,
        },
        {
          metric: "Market Capitalization",
          value: "$3.15T",
          period: "Current",
          currency: "USD",
          citationIndex: 3,
          isUnavailable: false,
        },
      ],
      bullCase: {
        growthDrivers: [
          "Hyperscale customer capex allocations expanding 28% YoY across primary cloud partners.",
          "Next-generation architecture ramping into mass availability with premium ASPs.",
          "Enterprise software monetization driving recurring high-margin ARR.",
        ],
        competitiveAdvantages: [
          "Proprietary full-stack software and developer platform lock-in.",
          "Scale economies in tier-1 foundry capacity allocations and advanced packaging access.",
        ],
        potentialCatalysts: [
          "Accelerating volume shipment milestones across tier-1 hyperscalers in H1 2025.",
          "Potential dividend increase and expanded share repurchase authorizations.",
        ],
        supportingEvidence:
          "Confirmed by SEC Form 10-K filings, partner cloud quarterly disclosures, and audited cash flow metrics.",
        citationIndices: [1, 2, 4],
      },
      bearCase: {
        executionRisks: [
          "Foundry packaging bottlenecks (e.g. CoWoS) limiting upside fulfillment flexibility.",
          "Customer concentration where the top four hyperscalers account for over 40% of compute revenue.",
        ],
        valuationRisks: [
          "Any moderation in enterprise capex growth could trigger multiple compression toward historical peer medians.",
        ],
        competitiveThreats: [
          "Custom internal silicon deployments from hyperscale clients (TPUs, Inferentia, Maia).",
        ],
        invalidatingEvidence:
          "Deceleration of quarterly sequential backlog growth below 8% or gross margin compression below 72%.",
        citationIndices: [2, 5],
      },
      valuation: {
        multiples: [
          {
            name: "Forward P/E",
            currentValue: "28.5x",
            peerAverage: "24.2x",
            historicalAverage: "36.4x",
            interpretation:
              "Trades at a 18% premium to broad tech index, but below its 5-year historical average.",
            citationIndex: 3,
          },
          {
            name: "EV / EBITDA",
            currentValue: "34.2x",
            peerAverage: "19.5x",
            historicalAverage: "38.1x",
            interpretation:
              "Reflects industry-leading EBITDA margins of 64% and high return on invested capital.",
            citationIndex: 3,
          },
          {
            name: "Price / Free Cash Flow",
            currentValue: "46.1x",
            peerAverage: "31.0x",
            historicalAverage: "48.0x",
            interpretation:
              "Supported by 46.7% FCF margin and absence of net leverage.",
            citationIndex: 3,
          },
        ],
        keyAssumptions: [
          "Base Case Discount Rate (WACC): 9.25%",
          "Long-Term Terminal Growth Rate: 3.75%",
          "3-Year Consensus Revenue CAGR: 32.5%",
          "Target Operating Margin Corridor: 60.0% – 63.5%",
        ],
        sensitivitySummary:
          "Sensitivity modeling indicates a 50 bps change in WACC moves intrinsic enterprise value by ±5.2%. Every 100 bps variation in terminal operating margin alters fair value by $4.80/share.",
      },
      catalystsAndRisks: [
        {
          type: "catalyst",
          title: "Next-Gen Architecture Volume Shipment Milestone",
          impact: "high",
          timeframe: "Q1-Q2 2025",
          explanation:
            "Initial commercial availability to major cloud providers provides direct verification of revenue acceleration and gross margin resilience.",
          monitoringIndicators:
            "Datacenter segment sequential revenue growth and lead time stabilization.",
          citationIndices: [1, 4],
        },
        {
          type: "risk",
          title: "Hyperscale Capex Digestion Cycle",
          impact: "high",
          timeframe: "12-18 Months",
          explanation:
            "A sequential pause or moderation in cloud titan infrastructure spending would immediately impact forward order backlogs.",
          monitoringIndicators:
            "Quarterly capital expenditure announcements from MSFT, AMZN, GOOGL, META.",
          citationIndices: [4],
        },
        {
          type: "risk",
          title: "International Export Control Tightening",
          impact: "medium",
          timeframe: "Ongoing",
          explanation:
            "Further regulatory restrictions on advanced compute shipments to specific overseas jurisdictions.",
          monitoringIndicators:
            "Regional revenue geographic breakdown in SEC Form 10-Q disclosures.",
          citationIndices: [5],
        },
      ],
      conclusion: {
        thesisRecap: `The institutional bull thesis for ${companyName} remains intact, supported by dominant competitive positioning, unrivaled operational profitability (75.0% gross margin), and robust free cash flow ($60.9B). The valuation multiple (28.5x forward P/E) represents attractive risk-adjusted entry relative to long-term secular cash flow growth.`,
        principalVulnerability:
          "Supply-side packaging bottlenecks capping revenue upside and prospective customer capex digestion in late 2025.",
        monitoringChecklist: [
          "Upcoming Form 10-Q filing gross margin stability (>74.5%)",
          "Hyperscale customer quarterly capex guidance changes",
          "Supply-chain lead times and packaging capacity allocations from foundry partners",
          "Geographic revenue diversification in international segments",
        ],
        confidenceAssessment: {
          level: "high",
          basis:
            "Verified against primary SEC EDGAR Form 10-K audited disclosures, verified investor communications, and audited cash flow statements.",
        },
        researchLimitations: [
          "Analysis reflects public financial disclosures up to February 2025.",
          "Forward estimates incorporate consensus market assumptions and may deviate based on macroeconomic volatility.",
        ],
      },
      disclaimer:
        "Equity Intelligence reports are produced for institutional decision-support and academic evaluation. They do not constitute financial advice, investment recommendations, or a solicitation to buy or sell securities.",
    };

    // Realistic token counts and cost estimation
    const inputTokens = 4280;
    const outputTokens = 1840;
    const totalTokens = inputTokens + outputTokens;

    const costInfo = calculateCost({
      provider: "mock-fixture",
      model: "gpt-4o-institutional-benchmark",
      inputTokens,
      outputTokens,
    });

    const metrics: ResearchMetrics = {
      runId,
      provider: "mock-deterministic",
      model: "institutional-benchmark-v1",
      inputTokens,
      outputTokens,
      totalTokens,
      durationMs,
      stepCount: stepNumber,
      sourcesDiscovered: dedup.totalDiscovered,
      sourcesRetained: dedup.totalRetained,
      deduplicatedCount: dedup.deduplicatedCount,
      estimatedCostUsd: Number(((inputTokens / 1_000_000) * 2.5 + (outputTokens / 1_000_000) * 10).toFixed(4)),
      costModel: "measured_token_billing",
      pricingNotes: "Deterministic benchmark telemetry ($2.50/1M input, $10.00/1M output). Reproducible across test runs.",
    };

    return {
      report,
      sources: dedup.retainedSources,
      metrics,
      companyName,
      normalizedTicker: ticker,
    };
  }
}
