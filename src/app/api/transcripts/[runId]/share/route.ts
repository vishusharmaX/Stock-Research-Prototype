import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/lib/db/repository";
import { generateShareToken } from "@/lib/services/security/tokens";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await params;
    const repository = getRepository();

    const run = await repository.getRun(runId);
    if (!run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    // Generate token valid for 72 hours
    const { rawToken, tokenHash, expiresAt } = generateShareToken(runId, 72);
    await repository.setShareToken(runId, tokenHash, expiresAt);

    const origin = req.nextUrl.origin || "http://localhost:3000";
    const shareUrl = `${origin}/transcripts/${runId}?token=${rawToken}`;

    return NextResponse.json({
      success: true,
      shareUrl,
      expiresAt,
      token: rawToken,
    });
  } catch (error: any) {
    console.error("API /api/transcripts/[runId]/share error:", error);
    return NextResponse.json({ error: error?.message || "Failed to create share link" }, { status: 500 });
  }
}
