import fs from "fs";
import path from "path";
import postgres from "postgres";
import {
  ResearchRun,
  ResearchStatus,
  ResearchReport,
  ResearchMetrics,
  ResearchSource,
  ResearchEvent,
} from "../types/research";

export interface IResearchRepository {
  createRun(params: {
    id: string;
    question: string;
    provider: string;
    normalizedTicker?: string | null;
    companyName?: string | null;
  }): Promise<ResearchRun>;

  getRun(id: string): Promise<ResearchRun | null>;

  updateRunStatus(
    id: string,
    status: ResearchStatus,
    errorMessage?: string | null,
    completedAt?: string | null,
    normalizedTicker?: string | null,
    companyName?: string | null
  ): Promise<void>;

  listRuns(options?: {
    search?: string;
    status?: ResearchStatus;
    limit?: number;
    offset?: number;
  }): Promise<{ items: ResearchRun[]; total: number }>;

  saveReport(runId: string, report: ResearchReport): Promise<void>;
  saveMetrics(metrics: ResearchMetrics): Promise<void>;
  saveSources(sources: ResearchSource[]): Promise<void>;
  addEvent(event: ResearchEvent): Promise<void>;

  getEvents(runId: string): Promise<ResearchEvent[]>;
  getSources(runId: string): Promise<ResearchSource[]>;

  setShareToken(runId: string, tokenHash: string, expiresAt: string): Promise<void>;
  verifyShareToken(runId: string, tokenHash: string): Promise<boolean>;
}

// -----------------------------------------------------------------------------
// In-Memory & File-Backed Storage (Zero-config local fallback)
// -----------------------------------------------------------------------------
interface LocalStoreData {
  runs: Record<string, ResearchRun>;
  reports: Record<string, ResearchReport>;
  metrics: Record<string, ResearchMetrics>;
  sources: Record<string, ResearchSource[]>;
  events: Record<string, ResearchEvent[]>;
  shareTokens: Record<string, { tokenHash: string; expiresAt: string }>;
}

class LocalFileRepository implements IResearchRepository {
  private filePath: string;
  private data: LocalStoreData;

  constructor() {
    const dataDir = path.join(process.cwd(), ".data");
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch {
        // Ignored if in read-only environment
      }
    }
    this.filePath = path.join(dataDir, "equity_store.json");
    this.data = this.loadData();
  }

  private loadData(): LocalStoreData {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, "utf-8");
        return JSON.parse(raw);
      }
    } catch {
      // fallback
    }
    return {
      runs: {},
      reports: {},
      metrics: {},
      sources: {},
      events: {},
      shareTokens: {},
    };
  }

  private persist() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), "utf-8");
    } catch {
      // Memory fallback if filesystem restricted
    }
  }

  async createRun(params: {
    id: string;
    question: string;
    provider: string;
    normalizedTicker?: string | null;
    companyName?: string | null;
  }): Promise<ResearchRun> {
    const now = new Date().toISOString();
    const run: ResearchRun = {
      id: params.id,
      question: params.question,
      normalizedTicker: params.normalizedTicker ?? null,
      companyName: params.companyName ?? null,
      status: "queued",
      provider: params.provider,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      errorMessage: null,
      shareToken: null,
      shareTokenExpiresAt: null,
    };

    this.data.runs[run.id] = run;
    this.data.events[run.id] = [];
    this.data.sources[run.id] = [];
    this.persist();
    return run;
  }

  async getRun(id: string): Promise<ResearchRun | null> {
    const run = this.data.runs[id];
    if (!run) return null;

    return {
      ...run,
      report: this.data.reports[id],
      metrics: this.data.metrics[id],
      events: this.data.events[id] || [],
      sources: this.data.sources[id] || [],
    };
  }

  async updateRunStatus(
    id: string,
    status: ResearchStatus,
    errorMessage?: string | null,
    completedAt?: string | null,
    normalizedTicker?: string | null,
    companyName?: string | null
  ): Promise<void> {
    const run = this.data.runs[id];
    if (!run) return;

    run.status = status;
    run.updatedAt = new Date().toISOString();
    if (errorMessage !== undefined) run.errorMessage = errorMessage;
    if (completedAt !== undefined) run.completedAt = completedAt;
    if (normalizedTicker) run.normalizedTicker = normalizedTicker;
    if (companyName) run.companyName = companyName;

    this.persist();
  }

  async listRuns(options?: {
    search?: string;
    status?: ResearchStatus;
    limit?: number;
    offset?: number;
  }): Promise<{ items: ResearchRun[]; total: number }> {
    let list = Object.values(this.data.runs).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (options?.status) {
      list = list.filter((r) => r.status === options.status);
    }

    if (options?.search) {
      const q = options.search.toLowerCase();
      list = list.filter(
        (r) =>
          r.question.toLowerCase().includes(q) ||
          (r.companyName && r.companyName.toLowerCase().includes(q)) ||
          (r.normalizedTicker && r.normalizedTicker.toLowerCase().includes(q))
      );
    }

    const total = list.length;
    const offset = options?.offset || 0;
    const limit = options?.limit || 50;
    const items = list.slice(offset, offset + limit).map((r) => ({
      ...r,
      report: this.data.reports[r.id],
      metrics: this.data.metrics[r.id],
      sources: this.data.sources[r.id] || [],
    }));

    return { items, total };
  }

  async saveReport(runId: string, report: ResearchReport): Promise<void> {
    this.data.reports[runId] = report;
    const run = this.data.runs[runId];
    if (run) {
      run.companyName = report.header.companyName;
      run.normalizedTicker = report.header.ticker;
    }
    this.persist();
  }

  async saveMetrics(metrics: ResearchMetrics): Promise<void> {
    this.data.metrics[metrics.runId] = metrics;
    this.persist();
  }

  async saveSources(sources: ResearchSource[]): Promise<void> {
    if (sources.length === 0) return;
    const runId = sources[0].runId;
    this.data.sources[runId] = sources;
    this.persist();
  }

  async addEvent(event: ResearchEvent): Promise<void> {
    if (!this.data.events[event.runId]) {
      this.data.events[event.runId] = [];
    }
    this.data.events[event.runId].push(event);
    this.persist();
  }

  async getEvents(runId: string): Promise<ResearchEvent[]> {
    return this.data.events[runId] || [];
  }

  async getSources(runId: string): Promise<ResearchSource[]> {
    return this.data.sources[runId] || [];
  }

  async setShareToken(runId: string, tokenHash: string, expiresAt: string): Promise<void> {
    this.data.shareTokens[runId] = { tokenHash, expiresAt };
    if (this.data.runs[runId]) {
      this.data.runs[runId].shareToken = tokenHash;
      this.data.runs[runId].shareTokenExpiresAt = expiresAt;
    }
    this.persist();
  }

  async verifyShareToken(runId: string, tokenHash: string): Promise<boolean> {
    const entry = this.data.shareTokens[runId];
    if (!entry) return false;
    if (entry.tokenHash !== tokenHash) return false;
    const isExpired = new Date(entry.expiresAt).getTime() < Date.now();
    return !isExpired;
  }
}

// -----------------------------------------------------------------------------
// PostgreSQL Repository (Used when DATABASE_URL is provided)
// -----------------------------------------------------------------------------
class PostgresRepository implements IResearchRepository {
  private sql: ReturnType<typeof postgres>;

  constructor(connectionString: string) {
    this.sql = postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }

  async createRun(params: {
    id: string;
    question: string;
    provider: string;
    normalizedTicker?: string | null;
    companyName?: string | null;
  }): Promise<ResearchRun> {
    const rows = await this.sql<
      {
        id: string;
        question: string;
        normalized_ticker: string | null;
        company_name: string | null;
        status: ResearchStatus;
        provider: string;
        created_at: Date;
        updated_at: Date;
        completed_at: Date | null;
        error_message: string | null;
        share_token_hash: string | null;
        share_token_expires_at: Date | null;
      }[]
    >`
      INSERT INTO research_runs (
        id, question, provider, normalized_ticker, company_name, status
      ) VALUES (
        ${params.id}, ${params.question}, ${params.provider},
        ${params.normalizedTicker ?? null}, ${params.companyName ?? null}, 'queued'
      )
      RETURNING *
    `;

    const r = rows[0];
    return {
      id: r.id,
      question: r.question,
      normalizedTicker: r.normalized_ticker,
      companyName: r.company_name,
      status: r.status,
      provider: r.provider,
      createdAt: r.created_at.toISOString(),
      updatedAt: r.updated_at.toISOString(),
      completedAt: r.completed_at ? r.completed_at.toISOString() : null,
      errorMessage: r.error_message,
      shareToken: r.share_token_hash,
      shareTokenExpiresAt: r.share_token_expires_at ? r.share_token_expires_at.toISOString() : null,
    };
  }

  async getRun(id: string): Promise<ResearchRun | null> {
    const runRows = await this.sql<
      {
        id: string;
        question: string;
        normalized_ticker: string | null;
        company_name: string | null;
        status: ResearchStatus;
        provider: string;
        created_at: Date;
        updated_at: Date;
        completed_at: Date | null;
        error_message: string | null;
        share_token_hash: string | null;
        share_token_expires_at: Date | null;
      }[]
    >`SELECT * FROM research_runs WHERE id = ${id}`;

    if (runRows.length === 0) return null;
    const r = runRows[0];

    const reportRows = await this.sql<{
      company_name: string;
      ticker: string | null;
      exchange: string | null;
      as_of_date: string;
      currency: string;
      executive_summary: string;
      key_findings: any;
      financial_snapshot: any;
      bull_case: any;
      bear_case: any;
      valuation: any;
      catalysts_and_risks: any;
      conclusion: any;
      disclaimer: string;
      created_at: Date;
    }[]>`SELECT * FROM research_reports WHERE run_id = ${id}`;

    const metricsRows = await this.sql<{
      run_id: string;
      provider: string;
      model: string;
      input_tokens: number | null;
      output_tokens: number | null;
      total_tokens: number | null;
      duration_ms: number;
      step_count: number;
      sources_discovered: number;
      sources_retained: number;
      deduplicated_count: number;
      estimated_cost_usd: string | null;
      cost_model: any;
      pricing_notes: string;
    }[]>`SELECT * FROM research_metrics WHERE run_id = ${id}`;

    const sources = await this.getSources(id);
    const events = await this.getEvents(id);

    let report: ResearchReport | undefined = undefined;
    if (reportRows.length > 0) {
      const rep = reportRows[0];
      report = {
        header: {
          companyName: rep.company_name,
          ticker: rep.ticker,
          exchange: rep.exchange,
          question: r.question,
          asOfDate: rep.as_of_date,
          generatedAt: rep.created_at.toISOString(),
          sourceCount: sources.length,
          currency: rep.currency,
        },
        executiveSummary: rep.executive_summary,
        keyFindings: rep.key_findings,
        financialSnapshot: rep.financial_snapshot,
        bullCase: rep.bull_case,
        bearCase: rep.bear_case,
        valuation: rep.valuation,
        catalystsAndRisks: rep.catalysts_and_risks,
        conclusion: rep.conclusion,
        disclaimer: rep.disclaimer,
      };
    }

    let metrics: ResearchMetrics | undefined = undefined;
    if (metricsRows.length > 0) {
      const m = metricsRows[0];
      metrics = {
        runId: m.run_id,
        provider: m.provider,
        model: m.model,
        inputTokens: m.input_tokens,
        outputTokens: m.output_tokens,
        totalTokens: m.total_tokens,
        durationMs: m.duration_ms,
        stepCount: m.step_count,
        sourcesDiscovered: m.sources_discovered,
        sourcesRetained: m.sources_retained,
        deduplicatedCount: m.deduplicated_count,
        estimatedCostUsd: m.estimated_cost_usd ? parseFloat(m.estimated_cost_usd) : null,
        costModel: m.cost_model,
        pricingNotes: m.pricing_notes || "",
      };
    }

    return {
      id: r.id,
      question: r.question,
      normalizedTicker: r.normalized_ticker,
      companyName: r.company_name,
      status: r.status,
      provider: r.provider,
      createdAt: r.created_at.toISOString(),
      updatedAt: r.updated_at.toISOString(),
      completedAt: r.completed_at ? r.completed_at.toISOString() : null,
      errorMessage: r.error_message,
      shareToken: r.share_token_hash,
      shareTokenExpiresAt: r.share_token_expires_at ? r.share_token_expires_at.toISOString() : null,
      report,
      metrics,
      events,
      sources,
    };
  }

  async updateRunStatus(
    id: string,
    status: ResearchStatus,
    errorMessage?: string | null,
    completedAt?: string | null,
    normalizedTicker?: string | null,
    companyName?: string | null
  ): Promise<void> {
    await this.sql`
      UPDATE research_runs
      SET 
        status = ${status},
        updated_at = NOW(),
        error_message = COALESCE(${errorMessage ?? null}, error_message),
        completed_at = COALESCE(${completedAt ? new Date(completedAt) : null}, completed_at),
        normalized_ticker = COALESCE(${normalizedTicker ?? null}, normalized_ticker),
        company_name = COALESCE(${companyName ?? null}, company_name)
      WHERE id = ${id}
    `;
  }

  async listRuns(options?: {
    search?: string;
    status?: ResearchStatus;
    limit?: number;
    offset?: number;
  }): Promise<{ items: ResearchRun[]; total: number }> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    let query = this.sql`SELECT * FROM research_runs WHERE 1=1`;
    let countQuery = this.sql`SELECT count(*)::int as count FROM research_runs WHERE 1=1`;

    if (options?.status) {
      query = this.sql`${query} AND status = ${options.status}`;
      countQuery = this.sql`${countQuery} AND status = ${options.status}`;
    }

    if (options?.search) {
      const term = `%${options.search}%`;
      query = this.sql`${query} AND (question ILIKE ${term} OR company_name ILIKE ${term} OR normalized_ticker ILIKE ${term})`;
      countQuery = this.sql`${countQuery} AND (question ILIKE ${term} OR company_name ILIKE ${term} OR normalized_ticker ILIKE ${term})`;
    }

    const [totalRows, rows] = await Promise.all([
      countQuery,
      this.sql`${query} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
    ]);

    const items: ResearchRun[] = rows.map((r: any) => ({
      id: r.id,
      question: r.question,
      normalizedTicker: r.normalized_ticker,
      companyName: r.company_name,
      status: r.status,
      provider: r.provider,
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
      completedAt: r.completed_at ? new Date(r.completed_at).toISOString() : null,
      errorMessage: r.error_message,
      shareToken: r.share_token_hash,
      shareTokenExpiresAt: r.share_token_expires_at
        ? new Date(r.share_token_expires_at).toISOString()
        : null,
    }));

    return { items, total: totalRows[0]?.count || 0 };
  }

  async saveReport(runId: string, report: ResearchReport): Promise<void> {
    await this.sql`
      INSERT INTO research_reports (
        run_id, company_name, ticker, exchange, as_of_date, currency,
        executive_summary, key_findings, financial_snapshot,
        bull_case, bear_case, valuation, catalysts_and_risks,
        conclusion, disclaimer
      ) VALUES (
        ${runId}, ${report.header.companyName}, ${report.header.ticker ?? null},
        ${report.header.exchange ?? null}, ${report.header.asOfDate}, ${report.header.currency},
        ${report.executiveSummary}, ${this.sql.json(report.keyFindings)},
        ${this.sql.json(report.financialSnapshot)}, ${this.sql.json(report.bullCase)},
        ${this.sql.json(report.bearCase)}, ${this.sql.json(report.valuation)},
        ${this.sql.json(report.catalystsAndRisks)}, ${this.sql.json(report.conclusion)},
        ${report.disclaimer}
      )
      ON CONFLICT (run_id) DO UPDATE SET
        company_name = EXCLUDED.company_name,
        ticker = EXCLUDED.ticker,
        as_of_date = EXCLUDED.as_of_date,
        executive_summary = EXCLUDED.executive_summary,
        key_findings = EXCLUDED.key_findings,
        financial_snapshot = EXCLUDED.financial_snapshot,
        bull_case = EXCLUDED.bull_case,
        bear_case = EXCLUDED.bear_case,
        valuation = EXCLUDED.valuation,
        catalysts_and_risks = EXCLUDED.catalysts_and_risks,
        conclusion = EXCLUDED.conclusion,
        disclaimer = EXCLUDED.disclaimer
    `;

    await this.sql`
      UPDATE research_runs
      SET company_name = ${report.header.companyName},
          normalized_ticker = ${report.header.ticker ?? null}
      WHERE id = ${runId}
    `;
  }

  async saveMetrics(metrics: ResearchMetrics): Promise<void> {
    await this.sql`
      INSERT INTO research_metrics (
        run_id, provider, model, input_tokens, output_tokens, total_tokens,
        duration_ms, step_count, sources_discovered, sources_retained,
        deduplicated_count, estimated_cost_usd, cost_model, pricing_notes
      ) VALUES (
        ${metrics.runId}, ${metrics.provider}, ${metrics.model},
        ${metrics.inputTokens}, ${metrics.outputTokens}, ${metrics.totalTokens},
        ${metrics.durationMs}, ${metrics.stepCount}, ${metrics.sourcesDiscovered},
        ${metrics.sourcesRetained}, ${metrics.deduplicatedCount},
        ${metrics.estimatedCostUsd}, ${metrics.costModel}, ${metrics.pricingNotes}
      )
      ON CONFLICT (run_id) DO UPDATE SET
        input_tokens = EXCLUDED.input_tokens,
        output_tokens = EXCLUDED.output_tokens,
        total_tokens = EXCLUDED.total_tokens,
        duration_ms = EXCLUDED.duration_ms,
        step_count = EXCLUDED.step_count,
        sources_discovered = EXCLUDED.sources_discovered,
        sources_retained = EXCLUDED.sources_retained,
        deduplicated_count = EXCLUDED.deduplicated_count,
        estimated_cost_usd = EXCLUDED.estimated_cost_usd,
        pricing_notes = EXCLUDED.pricing_notes
    `;
  }

  async saveSources(sources: ResearchSource[]): Promise<void> {
    if (sources.length === 0) return;
    for (const s of sources) {
      await this.sql`
        INSERT INTO research_sources (
          id, run_id, citation_index, url, title, domain, publish_date,
          access_date, excerpt, is_retained, rejection_reason, confidence
        ) VALUES (
          ${s.id}, ${s.runId}, ${s.citationIndex}, ${s.url}, ${s.title},
          ${s.domain}, ${s.publishDate}, ${s.accessDate}, ${s.excerpt},
          ${s.isRetained}, ${s.rejectionReason}, ${s.confidence}
        )
        ON CONFLICT (id) DO NOTHING
      `;
    }
  }

  async addEvent(event: ResearchEvent): Promise<void> {
    await this.sql`
      INSERT INTO research_events (
        id, run_id, step_number, phase, type, message, payload, timestamp
      ) VALUES (
        ${event.id}, ${event.runId}, ${event.stepNumber}, ${event.phase},
        ${event.type}, ${event.message}, ${this.sql.json(event.payload as any)},
        ${new Date(event.timestamp)}
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }

  async getEvents(runId: string): Promise<ResearchEvent[]> {
    const rows = await this.sql<
      {
        id: string;
        run_id: string;
        step_number: number;
        phase: string;
        type: string;
        message: string;
        payload: any;
        timestamp: Date;
      }[]
    >`SELECT * FROM research_events WHERE run_id = ${runId} ORDER BY step_number ASC, timestamp ASC`;

    return rows.map((e) => ({
      id: e.id,
      runId: e.run_id,
      stepNumber: e.step_number,
      phase: e.phase,
      type: e.type,
      message: e.message,
      payload: e.payload || {},
      timestamp: new Date(e.timestamp).toISOString(),
    }));
  }

  async getSources(runId: string): Promise<ResearchSource[]> {
    const rows = await this.sql<
      {
        id: string;
        run_id: string;
        citation_index: number;
        url: string;
        title: string;
        domain: string;
        publish_date: string | null;
        access_date: string;
        excerpt: string;
        is_retained: boolean;
        rejection_reason: string | null;
        confidence: any;
      }[]
    >`SELECT * FROM research_sources WHERE run_id = ${runId} ORDER BY citation_index ASC`;

    return rows.map((s) => ({
      id: s.id,
      runId: s.run_id,
      citationIndex: s.citation_index,
      url: s.url,
      title: s.title,
      domain: s.domain,
      publishDate: s.publish_date,
      accessDate: s.access_date,
      excerpt: s.excerpt,
      isRetained: s.is_retained,
      rejectionReason: s.rejection_reason,
      confidence: s.confidence,
    }));
  }

  async setShareToken(runId: string, tokenHash: string, expiresAt: string): Promise<void> {
    await this.sql`
      UPDATE research_runs
      SET share_token_hash = ${tokenHash},
          share_token_expires_at = ${new Date(expiresAt)}
      WHERE id = ${runId}
    `;
  }

  async verifyShareToken(runId: string, tokenHash: string): Promise<boolean> {
    const rows = await this.sql<{ share_token_expires_at: Date | null }[]>`
      SELECT share_token_expires_at
      FROM research_runs
      WHERE id = ${runId} AND share_token_hash = ${tokenHash}
    `;
    if (rows.length === 0) return false;
    const exp = rows[0].share_token_expires_at;
    if (!exp) return false;
    return exp.getTime() > Date.now();
  }
}

// -----------------------------------------------------------------------------
// Factory: Singleton repository instance
// -----------------------------------------------------------------------------
let repositoryInstance: IResearchRepository | null = null;

export function getRepository(): IResearchRepository {
  if (repositoryInstance) return repositoryInstance;

  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && dbUrl.trim().length > 0) {
    try {
      repositoryInstance = new PostgresRepository(dbUrl);
      return repositoryInstance;
    } catch (err) {
      console.warn("Failed to connect to DATABASE_URL, falling back to local file store:", err);
    }
  }

  repositoryInstance = new LocalFileRepository();
  return repositoryInstance;
}
