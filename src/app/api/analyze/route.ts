import { analyzeEntry } from "@/lib/ai/graphs/analysis-graph";

export async function POST(req: Request) {
  const { content } = await req.json();

  if (!content || typeof content !== "string") {
    return Response.json({ error: "Content is required" }, { status: 400 });
  }

  try {
    const analysis = await analyzeEntry(content);
    return Response.json(analysis);
  } catch (error) {
    console.error("Analysis error:", error);
    return Response.json(
      { mood: "indefinido", moodScore: 0, energyLevel: 0.5, tags: [] },
      { status: 200 }
    );
  }
}
