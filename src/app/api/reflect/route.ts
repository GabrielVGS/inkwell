import { streamReflection } from "@/lib/ai/graphs/reflection-graph";

export async function POST(req: Request) {
  const { currentEntry, previousEntries, messages } = await req.json();

  if (!currentEntry) {
    return Response.json({ error: "currentEntry is required" }, { status: 400 });
  }

  const conversationHistory = (messages ?? []) as { role: string; content: string }[];

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamReflection(
          currentEntry,
          previousEntries ?? [],
          conversationHistory
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
