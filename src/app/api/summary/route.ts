import { headers } from "next/headers";

import { streamWeeklySummary } from "@/lib/ai/graphs/summary-graph";
import { auth } from "@/lib/auth";
import { createSSEResponse } from "@/lib/utils/sse";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { entries } = await req.json();

  if (!entries || !Array.isArray(entries) || entries.length === 0) {
    return Response.json({ error: "No entries provided" }, { status: 400 });
  }

  return createSSEResponse(streamWeeklySummary(entries), "Summary generation error");
}
