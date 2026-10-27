-- ==============================================================================
-- Equity Intelligence: Production PostgreSQL Schema (Supabase)
-- ==============================================================================

-- 1. Research Runs Table
CREATE TABLE IF NOT EXISTS research_runs (
    id VARCHAR(64) PRIMARY KEY,
    question TEXT NOT NULL,
    normalized_ticker VARCHAR(32),
    company_name VARCHAR(255),
    status VARCHAR(32) NOT NULL CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
    provider VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    share_token_hash VARCHAR(128),
    share_token_expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_research_runs_status ON research_runs(status);
CREATE INDEX IF NOT EXISTS idx_research_runs_created_at ON research_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_runs_ticker ON research_runs(normalized_ticker);
CREATE INDEX IF NOT EXISTS idx_research_runs_share_token ON research_runs(share_token_hash);

-- 2. Research Reports Table
CREATE TABLE IF NOT EXISTS research_reports (
    run_id VARCHAR(64) PRIMARY KEY REFERENCES research_runs(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    ticker VARCHAR(32),
    exchange VARCHAR(64),
    as_of_date VARCHAR(64) NOT NULL,
    currency VARCHAR(16) NOT NULL DEFAULT 'USD',
    executive_summary TEXT NOT NULL,
    key_findings JSONB NOT NULL DEFAULT '[]'::jsonb,
    financial_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
    bull_case JSONB NOT NULL DEFAULT '{}'::jsonb,
    bear_case JSONB NOT NULL DEFAULT '{}'::jsonb,
    valuation JSONB NOT NULL DEFAULT '{}'::jsonb,
    catalysts_and_risks JSONB NOT NULL DEFAULT '[]'::jsonb,
    conclusion JSONB NOT NULL DEFAULT '{}'::jsonb,
    disclaimer TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Research Metrics Table
CREATE TABLE IF NOT EXISTS research_metrics (
    run_id VARCHAR(64) PRIMARY KEY REFERENCES research_runs(id) ON DELETE CASCADE,
    provider VARCHAR(64) NOT NULL,
    model VARCHAR(128) NOT NULL,
    input_tokens INTEGER,
    output_tokens INTEGER,
    total_tokens INTEGER,
    duration_ms INTEGER NOT NULL,
    step_count INTEGER NOT NULL,
    sources_discovered INTEGER NOT NULL,
    sources_retained INTEGER NOT NULL,
    deduplicated_count INTEGER NOT NULL,
    estimated_cost_usd NUMERIC(10, 6),
    cost_model VARCHAR(64) NOT NULL,
    pricing_notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Research Sources Table
CREATE TABLE IF NOT EXISTS research_sources (
    id VARCHAR(64) PRIMARY KEY,
    run_id VARCHAR(64) NOT NULL REFERENCES research_runs(id) ON DELETE CASCADE,
    citation_index INTEGER NOT NULL,
    url TEXT NOT NULL,
    title TEXT NOT NULL,
    domain VARCHAR(255) NOT NULL,
    publish_date VARCHAR(64),
    access_date VARCHAR(64) NOT NULL,
    excerpt TEXT NOT NULL,
    is_retained BOOLEAN NOT NULL DEFAULT TRUE,
    rejection_reason VARCHAR(255),
    confidence VARCHAR(32) NOT NULL DEFAULT 'high',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_research_sources_run_id ON research_sources(run_id);
CREATE INDEX IF NOT EXISTS idx_research_sources_citation_index ON research_sources(run_id, citation_index);

-- 5. Research Events Table
CREATE TABLE IF NOT EXISTS research_events (
    id VARCHAR(64) PRIMARY KEY,
    run_id VARCHAR(64) NOT NULL REFERENCES research_runs(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    phase VARCHAR(64) NOT NULL,
    type VARCHAR(64) NOT NULL,
    message TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_research_events_run_id_step ON research_events(run_id, step_number);

-- 6. Row Level Security Policies (Production Ready)
ALTER TABLE research_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_events ENABLE ROW LEVEL SECURITY;

-- Allow read access for runs (or with share token), service role for full access
CREATE POLICY "Public read for non-restricted research runs"
    ON research_runs FOR SELECT USING (true);

CREATE POLICY "Public read for reports"
    ON research_reports FOR SELECT USING (true);

CREATE POLICY "Public read for metrics"
    ON research_metrics FOR SELECT USING (true);

CREATE POLICY "Public read for sources"
    ON research_sources FOR SELECT USING (true);

CREATE POLICY "Public read for events"
    ON research_events FOR SELECT USING (true);

-- Allow service role full write access
CREATE POLICY "Service role insert on research_runs"
    ON research_runs FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role update on research_runs"
    ON research_runs FOR UPDATE USING (true);

CREATE POLICY "Service role insert on research_reports"
    ON research_reports FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role insert on research_metrics"
    ON research_metrics FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role insert on research_sources"
    ON research_sources FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role insert on research_events"
    ON research_events FOR INSERT WITH CHECK (true);
