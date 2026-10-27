import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/lib/db/repository";
import { hashShareToken } from "@/lib/services/security/tokens";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await params;
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    const repository = getRepository();

    // If token is provided, verify it
    if (token) {
      const tokenHash = hashShareToken(token);
      const isValid = await repository.verifyShareToken(runId, tokenHash);
      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid or expired share token" },
          { status: 403 }
        );
      }
    }

    const run = await repository.getRun(runId);
    if (!run) {
      return NextResponse.json({ error: "Transcript not found" }, { status: 404 });
    }

    const events = await repository.getEvents(runId);
    const sources = await repository.getSources(runId);

    return NextResponse.json({
      run,
      report: run.report,
      metrics: run.metrics,
      events,
      sources,
    });
  } catch (error: any) {
    console.error("API /api/transcripts/[runId] error:", error);
    return NextResponse.json({ error: error?.message || "Failed to load transcript" }, { status: 500 });
  }
}
