import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/lib/db/repository";
import { formatTranscriptJson, formatTranscriptMarkdown } from "@/lib/services/export/formatter";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await params;
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "markdown";

    const repository = getRepository();
    const run = await repository.getRun(runId);
    if (!run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    const events = await repository.getEvents(runId);
    const sources = await repository.getSources(runId);

    const safeFilenameTicker = run.normalizedTicker || run.companyName || "research";
    const cleanPrefix = safeFilenameTicker.replace(/[^a-zA-Z0-9_-]/g, "_");

    if (format === "json") {
      const jsonContent = formatTranscriptJson({
        run,
        report: run.report,
        metrics: run.metrics,
        events,
        sources,
      });

      return new NextResponse(jsonContent, {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${cleanPrefix}_${runId}_transcript.json"`,
        },
      });
    }

    // Default to Markdown
    const markdownContent = formatTranscriptMarkdown({
      run,
      report: run.report,
      metrics: run.metrics,
      events,
      sources,
    });

    return new NextResponse(markdownContent, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${cleanPrefix}_${runId}_report.md"`,
      },
    });
  } catch (error: any) {
    console.error("API export error:", error);
    return NextResponse.json({ error: error?.message || "Failed to export transcript" }, { status: 500 });
  }
}
