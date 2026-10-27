import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/lib/db/repository";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await params;
    const repository = getRepository();

    // Check if client requested text/event-stream
    const acceptHeader = req.headers.get("accept") || "";
    if (acceptHeader.includes("text/event-stream")) {
      const responseStream = new TransformStream();
      const writer = responseStream.writable.getWriter();
      const encoder = new TextEncoder();

      // Stream events until run completes or times out
      (async () => {
        let lastStep = 0;
        let attempts = 0;
        const maxAttempts = 60; // 3 minutes max

        while (attempts < maxAttempts) {
          const run = await repository.getRun(runId);
          if (!run) break;

          const events = (run.events || []).filter((e) => e.stepNumber > lastStep);
          for (const ev of events) {
            await writer.write(encoder.encode(`event: research_event\ndata: ${JSON.stringify(ev)}\n\n`));
            lastStep = Math.max(lastStep, ev.stepNumber);
          }

          if (run.status === "completed" || run.status === "failed" || run.status === "cancelled") {
            await writer.write(
              encoder.encode(`event: run_state\ndata: ${JSON.stringify({ status: run.status, runId })}\n\n`)
            );
            break;
          }

          await new Promise((r) => setTimeout(r, 1000));
          attempts++;
        }

        await writer.close();
      })().catch((err) => {
        console.error("SSE stream error:", err);
      });

      return new NextResponse(responseStream.readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Standard JSON poll
    const events = await repository.getEvents(runId);
    return NextResponse.json(events);
  } catch (error: any) {
    console.error("API /api/research/[runId]/events error:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch events" }, { status: 500 });
  }
}
