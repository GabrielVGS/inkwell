import { streamReflection } from "@/lib/ai/graphs/reflection-graph";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { searchSimilarEntries, getMoodTrend } from "@/lib/db/queries";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { currentEntry, messages } = await req.json();

  if (!currentEntry) {
    return Response.json({ error: "currentEntry is required" }, { status: 400 });
  }

  const conversationHistory = (messages ?? []) as { role: string; content: string }[];

  // RAG: find semantically similar past entries
  let similarEntries: { content: string; createdAt: string; mood: string | null }[] = [];
  try {
    const results = await searchSimilarEntries(session.user.id, currentEntry, 5);
    // Exclude the current entry itself
    similarEntries = results
      .filter((e) => e.content !== currentEntry)
      .slice(0, 4)
      .map((e) => ({
        content: e.content,
        createdAt: e.createdAt,
        mood: e.mood,
      }));
  } catch {
    // Continue without RAG if embeddings fail
  }

  // Adaptive prompts: get mood trend for tone adjustment
  let moodContext: { avgScore: number; trend: "improving" | "declining" | "stable" } | undefined;
  try {
    const trend = await getMoodTrend(session.user.id, 14);
    if (trend.recentMoods.length >= 3) {
      moodContext = { avgScore: trend.avgScore, trend: trend.trend };
    }
  } catch {
    // Continue without mood context
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamReflection(
          currentEntry,
          similarEntries,
          conversationHistory,
          moodContext
        )) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        console.error("Reflection stream error:", error);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: "Erro na reflexao" })}\n\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
