import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/lib/db/repository";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await params;
    const repository = getRepository();
    const run = await repository.getRun(runId);

    if (!run) {
      return NextResponse.json({ error: "Research run not found" }, { status: 404 });
    }

    return NextResponse.json(run);
  } catch (error: any) {
    console.error("API /api/research/[runId] error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
