import { streamWeeklySummary } from "@/lib/ai/graphs/summary-graph";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { entries } = await req.json();

  if (!entries || !Array.isArray(entries) || entries.length === 0) {
    return Response.json({ error: "No entries provided" }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamWeeklySummary(entries)) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        console.error("Summary stream error:", error);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: "Erro ao gerar resumo" })}\n\n`)
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
