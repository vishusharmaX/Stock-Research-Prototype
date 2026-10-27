import { describe, it, expect } from "vitest";
import { ResearchOrchestrator } from "@/lib/services/research/orchestrator";
import { getRepository } from "@/lib/db/repository";
import { generateShareToken } from "@/lib/services/security/tokens";

describe("Integration Tests: Research Orchestrator & Persistence", () => {
  const repository = getRepository();
  const orchestrator = new ResearchOrchestrator(repository);

  it("orchestrates an end-to-end research run and persists report and events", async () => {
    const runId = `test_run_${Date.now()}`;
    const question = "Analyze NVIDIA's growth prospects and valuation risks.";

    const initialRun = await orchestrator.startResearch({
      runId,
      question,
      preferredProvider: "mock",
    });

    expect(initialRun.id).toBe(runId);
    expect(["queued", "running"]).toContain(initialRun.status);

    // Wait for the background mock run to complete (simulates ~2 seconds)
    let finalRun = null;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 200));
      finalRun = await repository.getRun(runId);
      if (finalRun && (finalRun.status === "completed" || finalRun.status === "failed")) {
        break;
      }
    }

    expect(finalRun).not.toBeNull();
    expect(finalRun?.status).toBe("completed");
    expect(finalRun?.report).toBeDefined();
    expect(finalRun?.report?.header.companyName).toBe("NVIDIA Corporation");
    expect(finalRun?.report?.keyFindings.length).toBeGreaterThan(0);
    expect(finalRun?.sources?.length).toBeGreaterThan(0);
    expect(finalRun?.metrics?.durationMs).toBeGreaterThan(0);

    // Verify chronological events
    const events = await repository.getEvents(runId);
    expect(events.length).toBeGreaterThanOrEqual(5);
    expect(events[0].type).toBe("run_created");
    expect(events[events.length - 1].type).toBe("run_completed");
  });

  it("handles cancellation gracefully without corrupting state", async () => {
    const runId = `test_cancel_${Date.now()}`;
    const question = "Analyze Microsoft cloud growth trajectory.";

    await orchestrator.startResearch({
      runId,
      question,
      preferredProvider: "mock",
    });

    // Cancel immediately
    orchestrator.cancelRun(runId);

    // Wait a brief moment
    await new Promise((r) => setTimeout(r, 600));

    const run = await repository.getRun(runId);
    expect(run?.status).toBe("cancelled");
  });

  it("persists and securely verifies share tokens with expiration", async () => {
    const runId = `test_share_${Date.now()}`;
    await repository.createRun({
      id: runId,
      question: "Sample question for share testing",
      provider: "mock-deterministic",
    });

    const { rawToken, tokenHash, expiresAt } = generateShareToken(runId, 24);
    await repository.setShareToken(runId, tokenHash, expiresAt);

    // Verify with correct token
    const isValid = await repository.verifyShareToken(runId, tokenHash);
    expect(isValid).toBe(true);

    // Verify with invalid token
    const isInvalid = await repository.verifyShareToken(runId, "wrong_hash_value");
    expect(isInvalid).toBe(false);
  });
});
