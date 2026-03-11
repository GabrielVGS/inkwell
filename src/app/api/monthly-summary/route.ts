import { headers } from "next/headers";

import { streamMonthlySummary } from "@/lib/ai/graphs/monthly-summary-graph";
import { auth } from "@/lib/auth";
import { getEntriesForMonth } from "@/lib/db/queries";
import { createSSEResponse } from "@/lib/utils/sse";
import { monthlySummarySchema } from "@/lib/validations";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = monthlySummarySchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { year, month } = parsed.data;

  const entries = await getEntriesForMonth(session.user.id, year, month);

  if (entries.length === 0) {
    return Response.json({ error: "No entries for this month" }, { status: 400 });
  }

  return createSSEResponse(
    streamMonthlySummary(
      entries.map((e) => ({
        content: e.content,
        createdAt: e.createdAt,
        mood: e.mood,
        moodScore: e.moodScore,
        tags: e.tags,
      })),
    ),
    "Monthly summary generation error",
  );
}
