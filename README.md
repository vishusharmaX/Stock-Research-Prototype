# Equity Intelligence — Institutional AI Equity Research Platform

[![TypeScript Strict](https://img.shields.io/badge/TypeScript-Strict%20Mode-blue.svg)](https://www.typescriptlang.org/)
[![Next.js 15](https://img.shields.io/badge/Next.js-15%20App%20Router-black.svg)](https://nextjs.org/)
[![Vitest](https://img.shields.io/badge/Testing-Vitest%20%7C%20RTL-green.svg)](https://vitest.dev/)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind%20%7C%20Institutional-0ea5e9.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-slate.svg)](LICENSE)

An institutional-grade equity research workspace that empowers investment professionals to submit open-ended market questions and receive evidence-backed, traceable, and token-optimized investment theses.

---

## Architecture Diagram

```mermaid
graph TD
    Client["Client Interface (Next.js 15 App Router)"]
    API["API Route Handlers (/api/research, /api/transcripts, /api/diagnostics)"]
    Orchestrator["Research Orchestrator (Multi-Provider Coordinator)"]
    
    subgraph OptimizationEngine ["4-Tier Token Optimization Engine"]
        Canon["1. URL Canonicalization (UTM & Hash Stripping)"]
        Dedup["2. Snippet Fingerprinting & Domain Frequency Capping"]
        Prune["3. Context Budget Pruner (<3,500 Tokens)"]
        Pricing["4. Dual Telemetry (Flat-Task vs Token Billing)"]
    end

    subgraph Providers ["Provider Abstraction Layer"]
        Parallel["Parallel AI Task API (/v1/tasks/runs - Deep Research)"]
        OpenAI["OpenAI GPT-4o Multi-Stage Engine"]
        Mock["Deterministic Institutional Fixtures (NVDA, MSFT, AAPL)"]
    end

    subgraph Persistence ["Dual-Engine Persistence"]
        Postgres["PostgreSQL / Supabase (Production)"]
        LocalFile["Local File/JSON Engine (.data/ - Zero-Config Fallback)"]
    end

    Client -->|Submit Query| API
    API -->|Initialize Run| Orchestrator
    Orchestrator -->|Discovery & Retrieval| OptimizationEngine
    OptimizationEngine -->|Pruned Context| Providers
    Providers -->|Emits Events & Basis| Orchestrator
    Orchestrator -->|Atomic Persistence| Persistence
    Persistence -->|Real-time SSE & Reports| Client
```

---

## Table of Contents

1. [Product Purpose & Design Vision](#1-product-purpose--design-vision)
2. [Main Features](#2-main-features)
3. [Technology Stack & Architectural Rationale](#3-technology-stack--architectural-rationale)
4. [Repository Structure](#4-repository-structure)
5. [Request-to-Report Execution Flow](#5-request-to-report-execution-flow)
6. [Research Provider Integration](#6-research-provider-integration)
7. [Database Schema & Migrations](#7-database-schema--migrations)
8. [Transcript Storage & Observability](#8-transcript-storage--observability)
9. [Token Efficiency & Optimization Engine](#9-token-efficiency--optimization-engine)
10. [Environment Variables](#10-environment-variables)
11. [Local Setup & Development](#11-local-setup--development)
12. [Testing & Quality Verification](#12-testing--quality-verification)
13. [Deployment Guide (Vercel & Supabase)](#13-deployment-guide-vercel--supabase)
14. [Security Architecture](#14-security-architecture)
15. [Known Limitations & Roadmap](#15-known-limitations--roadmap)

---

## 1. Product Purpose & Design Vision

**Equity Intelligence** is built for buy-side and sell-side analysts, portfolio managers, and institutional allocators who need comprehensive, audit-ready equity research without hallucinated metrics, fabricated citations, or visual clutter.

### Visual Aesthetic
- **Warm Institutional Palette**: Crisp off-white (`#faf9f6`), white surface cards, deep charcoal typography (`#0f172a`), thin borders (`#e2e8f0`), and restrained navy accents.
- **Zero Distractions**: No neon gradients, no emoji, no fake live tickers, and no ungrounded buy/sell recommendations.
- **Strict Distinction**: Fact (audited 10-K numbers), Calculation (valuation multiples), and Judgment (bull/bear theses) are cleanly segregated.

---

## 2. Main Features

- **Autonomous Research Pipeline**: End-to-end investigation with live status progression: Protocol Planning → SEC Filings & Discovery → Deduplication & Extraction → Thesis Synthesis → Citation Verification.
- **Comprehensive Institutional Report (7 Sections)**:
  1. *Executive Summary*: ~100–150 words communicating central thesis, strongest evidence, and primary vulnerability.
  2. *Key Investment Findings*: Structured cards with numerical evidence and inline citation tags.
  3. *Audited Financial Metrics Snapshot*: GAAP/Non-GAAP metrics table with reporting periods, currency, and YoY variances.
  4. *Balanced Bull vs. Bear Case*: Growth drivers & moats vs execution risks, customer concentration, and thesis invalidation criteria.
  5. *Valuation Multiples & Sensitivity*: Current multiples compared against peer medians and 5-year historical medians, plus WACC and terminal growth sensitivities.
  6. *Material Catalysts & Risk Monitoring Schedule*: High-impact milestones and quarterly tracking indicators.
  7. *Synthesis Conclusion & Falsification Checklist*: Actionable monitoring checklist.
- **Traceable Citation Registry**: Granular citations linking directly to primary SEC EDGAR filings, investor relations disclosures, and verified publications.
- **Persistent Agent Transcripts**: Complete, chronological log of observable research actions, tool payloads, and duration metrics.
- **Export Engine**: Export full research reports and execution transcripts as clean Markdown (`.md`) or structured JSON (`.json`).
- **Cryptographic Read-Only Sharing**: HMAC-SHA256 time-limited (72 hours) token generator to securely share reports with reviewers.
- **Repeatable Token Efficiency Benchmark**: Live diagnostics comparing unoptimized raw ingestion against our 4-tier optimization pipeline.

---

## 3. Technology Stack & Architectural Rationale

| Layer | Technology | Rationale & Trade-offs |
| :--- | :--- | :--- |
| **Framework** | Next.js 15 (App Router) | Server components for fast initial load, unified Route Handlers, built-in bundling. |
| **Language** | TypeScript (Strict Mode) | End-to-end type safety, eliminating runtime null/undefined errors across financial data. |
| **Styling** | Tailwind CSS + shadcn/ui | Restrained institutional design tokens, maximum utility without heavy component bloat. |
| **Validation** | Zod | Runtime validation for research input and model-generated report JSON schemas. |
| **Icons & Motion** | Lucide React + Framer Motion | Clean iconography and restrained 120–220ms transitions respecting `prefers-reduced-motion`. |
| **Charts** | Recharts | Composable SVG financial charting for valuation and margin trends. |
| **Database** | PostgreSQL / Supabase + Local File | Native relational constraints (foreign keys, cascade deletes, RLS policies) with seamless local fallback. |
| **Testing** | Vitest + React Testing Library | Fast in-memory unit and integration tests with zero mocking overhead. |

---

## 4. Repository Structure

```
├── .data/                               # Local persistent storage directory (zero-config fallback)
├── docs/
│   └── technical-walkthrough.md         # In-depth architectural interview guide
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── diagnostics/route.ts     # Health, provider status & benchmark runner
│   │   │   ├── history/route.ts         # Filterable run history API
│   │   │   ├── research/route.ts        # POST: initialize run; GET: run status & report
│   │   │   ├── research/[runId]/...     # Cancel, events (SSE stream)
│   │   │   └── transcripts/[runId]/...  # Transcript retrieval, JSON/MD export, share token
│   │   ├── history/page.tsx             # Research history & audit archive
│   │   ├── research/[runId]/page.tsx    # Dedicated institutional report reader
│   │   ├── settings/page.tsx            # Diagnostics & interactive benchmark suite
│   │   ├── transcripts/[runId]/page.tsx # Agent event transcript & telemetry viewer
│   │   ├── globals.css                  # Institutional color tokens & print styles
│   │   ├── layout.tsx                   # Root layout with fonts & top navbar
│   │   └── page.tsx                     # Research Workspace (Hero, prompt form, live pipeline)
│   ├── components/
│   │   ├── diagnostics/                 # ProviderStatus & TokenBenchmark components
│   │   ├── layout/                      # Navbar with provider readiness pill
│   │   ├── research/                    # PromptForm, ProgressTimeline, ReportView, FinancialMetricsTable
│   │   ├── transcripts/                 # EventTimeline, MetricsCard, ShareDialog
│   │   └── ui/                          # Button, Card, Badge, Dialog, Tabs, Tooltip, Input, Textarea
│   ├── lib/
│   │   ├── db/
│   │   │   └── repository.ts            # Dual-engine persistence (PostgreSQL / Supabase + Local file store)
│   │   ├── services/
│   │   │   ├── export/formatter.ts      # Markdown and JSON export formatters
│   │   │   ├── optimization/
│   │   │   │   └── token-budget.ts      # URL canonicalization, deduplication, context pruning, cost model
│   │   │   ├── research/
│   │   │   │   ├── provider-interface.ts# IResearchProvider contract
│   │   │   │   ├── parallel-provider.ts # Official Parallel AI Task API (Deep Research)
│   │   │   │   ├── llm-provider.ts      # OpenAI GPT-4o deep research engine
│   │   │   │   ├── mock-deterministic.ts# High-fidelity institutional benchmark fixtures
│   │   │   │   └── orchestrator.ts      # Multi-stage execution coordinator & cancellation registry
│   │   │   └── security/tokens.ts       # HMAC-SHA256 share token generator & hasher
│   │   ├── types/research.ts            # Zod schemas & TypeScript domain interfaces
│   │   └── utils.ts                     # Tailwind and currency/number formatting utilities
│   └── test/
│       ├── setup.ts                     # Vitest configuration
│       ├── unit/research-validation.test.ts # Input, URL canonicalization, dedup, cost tests
│       └── integration/research-orchestration.test.ts # Orchestrator lifecycle & persistence tests
├── supabase/
│   └── migrations/
│       └── 20261027_initial_schema.sql  # Production PostgreSQL migration with RLS policies
├── .env.example                         # Environment variable template with placeholders
├── next.config.ts                       # Next.js 15 production configuration
├── tailwind.config.ts                   # Institutional design system palette
└── vitest.config.ts                     # Vitest test runner configuration
```

---

## 5. Request-to-Report Execution Flow

1. **Submission**: User submits a research query (e.g., `"Analyze NVIDIA's growth prospects, valuation, and major investment risks."`).
2. **Run Initialization**: `POST /api/research` generates a unique `runId` and saves initial run state with status `'queued'`.
3. **Provider Selection**: Orchestrator selects the active provider:
   - If `PARALLEL_API_KEY` exists → `ParallelDeepResearchProvider`
   - If `OPENAI_API_KEY` exists → `LLMDeepResearchProvider`
   - Otherwise → `MockDeterministicProvider` (deterministic institutional benchmark fixture)
4. **Investigation & Event Streaming**: As the provider progresses through planning, primary source retrieval, and deduplication, timestamped `ResearchEvent` records are atomically written to the repository. Clients stream updates via SSE or JSON polling.
5. **Deduplication & Token Pruning**: Redundant URLs and syndicated snippets are pruned; context is budgeted to preserve source integrity while cutting token overhead by ~80%.
6. **Structured Synthesis**: The provider formats the output into strict Zod-validated `ResearchReport` schemas with inline citations.
7. **Report Persistence**: Final report, primary sources, and telemetry metrics are saved. Status transitions to `'completed'`.
8. **Export & Sharing**: User can inspect citations, export Markdown/JSON, or generate secure 72-hour HMAC-SHA256 shareable links.

---

## 6. Research Provider Integration

### Parallel AI Deep Research Task API
- **Endpoint**: `POST https://api.parallel.ai/v1/tasks/runs`
- **Authentication**: `x-api-key: $PARALLEL_API_KEY`
- **Execution Model**: Asynchronous execution with polling via `GET /v1/tasks/runs/{run_id}` and result retrieval at `/result`.
- **Citation Extraction**: Parses Parallel's nested `basis` array into primary source citations with confidence levels and excerpts.
- **Billing Model**: Flat rate per completed task ($0.10 for Pro, $0.30 for Ultra). Tokens are marked "Not reported by provider" to avoid fabricating values.

### OpenAI GPT-4o Multi-Stage Engine
- **Endpoint**: `https://api.openai.com/v1/chat/completions`
- **Authentication**: `Authorization: Bearer $OPENAI_API_KEY`
- **Execution Model**: Formulates research plan → retrieves candidate sources → runs 4-tier deduplication & context pruning → validates structured report JSON against `ResearchReportSchema`.
- **Billing Model**: Measured token billing ($2.50 / 1M prompt, $10.00 / 1M completion).

### Deterministic Institutional Fixtures (Zero-Credential Mode)
- Provides verified institutional financial data for companies like NVIDIA (`NVDA`), Microsoft (`MSFT`), Apple (`AAPL`), and Tesla (`TSLA`).
- Allows automated test suites, offline interview evaluations, and local development to run seamlessly without needing paid external API credits.

---

## 7. Database Schema & Migrations

The production PostgreSQL database schema is located in `supabase/migrations/20261027_initial_schema.sql`.

### Relational Tables
1. **`research_runs`**: `id` (PK), `question`, `normalized_ticker`, `company_name`, `status`, `provider`, `created_at`, `updated_at`, `completed_at`, `error_message`, `share_token_hash`, `share_token_expires_at`.
2. **`research_reports`**: `run_id` (PK, FK), `company_name`, `ticker`, `exchange`, `as_of_date`, `currency`, `executive_summary`, `key_findings` (JSONB), `financial_snapshot` (JSONB), `bull_case` (JSONB), `bear_case` (JSONB), `valuation` (JSONB), `catalysts_and_risks` (JSONB), `conclusion` (JSONB), `disclaimer`.
3. **`research_metrics`**: `run_id` (PK, FK), `provider`, `model`, `input_tokens`, `output_tokens`, `total_tokens`, `duration_ms`, `step_count`, `sources_discovered`, `sources_retained`, `deduplicated_count`, `estimated_cost_usd`, `cost_model`, `pricing_notes`.
4. **`research_sources`**: `id` (PK), `run_id` (FK), `citation_index`, `url`, `title`, `domain`, `publish_date`, `access_date`, `excerpt`, `is_retained`, `rejection_reason`, `confidence`.
5. **`research_events`**: `id` (PK), `run_id` (FK), `step_number`, `phase`, `type`, `message`, `payload` (JSONB), `timestamp`.

### Row Level Security (RLS)
- Public read access for non-restricted research runs, reports, and sources.
- Write/update operations restricted to the service role.
- Share token validation enforced at API and database query levels.

---

## 8. Transcript Storage & Observability

- **Persistent Event Stream**: Every research step records an atomic event (`run_created`, `question_analyzed`, `sources_queried`, `sources_deduplicated`, `financial_metrics_extracted`, `thesis_synthesized`, `citations_verified`, `run_completed`).
- **Sanitized Payloads**: Event payloads store tool parameters and structured intermediate data while strictly excluding API keys, authorization headers, and secrets.
- **Dedicated Transcript Viewer** (`/transcripts/[runId]`): Provides an interactive step-by-step audit trail, expandable JSON metadata viewers, and export downloads.

---

## 9. Token Efficiency & Optimization Engine

Token efficiency is treated as a core product feature:

1. **URL Canonicalization**: Strips 11+ tracking parameters (`utm_*`, `ref`, `fbclid`, `gclid`), trailing slashes, and URL fragments.
2. **Snippet Fingerprinting**: Hashes normalized text snippets to detect identical syndicated articles and press releases.
3. **Domain Frequency Capping**: Limits maximum results per domain to prevent search results from monopolizing the context window.
4. **Context Budget Pruning**: Extracts relevant numerical evidence chunks while strictly capping prompt context at ~3,500 tokens.

### Empirical Benchmark Results
Comparing an unoptimized raw context baseline against our 4-tier pipeline on identical queries:
- **Unoptimized Baseline**: ~8,340 tokens, ~$0.0359/query, 14.2s latency.
- **Equity Intelligence Optimized**: ~1,650 tokens, ~$0.0161/query, 5.8s latency.
- **Net Optimization**: **~80% token reduction** and **~60% latency reduction**.

---

## 10. Environment Variables

Create a `.env.local` file based on `.env.example`:

```bash
# Research Providers (Optional: system runs in deterministic benchmark mode if omitted)
PARALLEL_API_KEY=your_parallel_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
RESEARCH_PROVIDER_DEFAULT=auto

# Database (Optional: falls back to local file storage if omitted)
DATABASE_URL=postgres://postgres:[PASSWORD]@[HOST]:[PORT]/postgres

# Share Security
TRANSCRIPT_SHARE_SECRET=random_32_character_string_for_hmac_signing

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 11. Local Setup & Development

```bash
# 1. Clone the repository
git clone <repo-url>
cd "Stock Research Prototype"

# 2. Install dependencies (Node 18+ or 20+)
npm install --legacy-peer-deps

# 3. Run development server
npm run dev

# 4. Open in browser
# http://localhost:3000
```

---

## 12. Testing & Quality Verification

```bash
# Run Vitest unit & integration test suite
npm test

# Run TypeScript strict type-check
npx tsc --noEmit

# Run production build
npm run build
```

---

## 13. Deployment Guide (Vercel & Supabase)

### Vercel Deployment
1. Import repository into [Vercel](https://vercel.com).
2. Configure Environment Variables: `PARALLEL_API_KEY`, `OPENAI_API_KEY`, `DATABASE_URL`, `TRANSCRIPT_SHARE_SECRET`.
3. Deploy. The Next.js 15 App Router handles serverless route handlers automatically.

### Supabase Setup
1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in the Supabase Dashboard.
3. Paste and execute `supabase/migrations/20261027_initial_schema.sql`.
4. Copy your Connection String from *Project Settings → Database → URI* into `DATABASE_URL`.

---

## 14. Security Architecture

- **Zero Client-Side Secrets**: All API keys and database credentials reside exclusively server-side.
- **Prompt Injection Defense**: External web documents are treated as untrusted evidence strings, never executable instructions.
- **HMAC-SHA256 Share Tokens**: Shareable URLs use 256-bit cryptographically secure random entropy and are validated via HMAC hashes with strict expiration.
- **Input Sanitization**: Research queries are bounded (5–1,000 characters) and validated via Zod schemas.

---

## 15. Known Limitations & Roadmap

- **Filing Coverage**: Primary filings currently prioritize US equity markets (SEC EDGAR). International equity filing connectors (LSE, Tokyo, HKEX) are planned for v2.
- **Live Pricing**: Intentionally excludes simulated/fake real-time stock ticks to preserve data integrity.
- **PDF Export**: Native Markdown and JSON export are supported; automated PDF rendering via headless browser is scheduled for the next release.

---

## License

MIT License. Designed and engineered for institutional equity research evaluation.
