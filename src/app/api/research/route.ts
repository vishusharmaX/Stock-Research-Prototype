import { NextRequest, NextResponse } from "next/server";
import { SubmitResearchQuerySchema } from "@/lib/types/research";
import { getOrchestrator } from "@/lib/services/research/orchestrator";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SubmitResearchQuerySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { question, preferredProvider } = parsed.data;
    const runId = `run_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    const orchestrator = getOrchestrator();
    const run = await orchestrator.startResearch({
      runId,
      question,
      preferredProvider,
    });

    return NextResponse.json({ runId: run.id, status: run.status }, { status: 201 });
  } catch (error: any) {
    console.error("API /api/research error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to initialize research run" },
      { status: 500 }
    );
  }
}
