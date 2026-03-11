import { streamMonthlySummary } from "@/lib/ai/graphs/monthly-summary-graph";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getEntriesForMonth } from "@/lib/db/queries";
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
    return Response.json({ error: "Sem entradas neste mes" }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamMonthlySummary(
          entries.map((e) => ({
            content: e.content,
            createdAt: e.createdAt,
            mood: e.mood,
            moodScore: e.moodScore,
            tags: e.tags,
          }))
        )) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        console.error("Monthly summary stream error:", error);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: "Erro ao gerar resumo mensal" })}\n\n`)
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
