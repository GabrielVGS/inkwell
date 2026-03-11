import { headers } from "next/headers";

import { analyzeEntry } from "@/lib/ai/graphs/analysis-graph";
import { auth } from "@/lib/auth";
import { analyzeSchema } from "@/lib/validations";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = analyzeSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { content } = parsed.data;

  try {
    const analysis = await analyzeEntry(content);
    return Response.json(analysis);
  } catch (error) {
    console.error("Analysis error:", error);
    return Response.json(
      { mood: "indefinido", moodScore: 0, energyLevel: 0.5, tags: [] },
      { status: 200 },
    );
  }
}
