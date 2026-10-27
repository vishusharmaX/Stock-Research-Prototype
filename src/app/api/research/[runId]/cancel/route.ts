import { NextRequest, NextResponse } from "next/server";
import { getOrchestrator } from "@/lib/services/research/orchestrator";
import { getRepository } from "@/lib/db/repository";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await params;
    const orchestrator = getOrchestrator();
    orchestrator.cancelRun(runId);

    const repository = getRepository();
    await repository.updateRunStatus(runId, "cancelled", "Cancelled by user request.");

    return NextResponse.json({ success: true, message: "Cancellation signal submitted." });
  } catch (error: any) {
    console.error("API cancel error:", error);
    return NextResponse.json({ error: error?.message || "Failed to cancel run" }, { status: 500 });
  }
}
