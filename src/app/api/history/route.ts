import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/lib/db/repository";
import { ResearchStatus } from "@/lib/types/research";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const status = (searchParams.get("status") as ResearchStatus) || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 50;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : 0;

    const repository = getRepository();
    const result = await repository.listRuns({ search, status, limit, offset });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API /api/history error:", error);
    return NextResponse.json({ error: error?.message || "Failed to load history" }, { status: 500 });
  }
}
