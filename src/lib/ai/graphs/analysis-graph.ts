import { StateGraph, Annotation } from "@langchain/langgraph";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { z } from "zod";
import { getAnalysisModel } from "../llm";
import { MOOD_ANALYSIS_PROMPT } from "../../prompts";

export const MoodAnalysisSchema = z.object({
  mood: z.string(),
  moodScore: z.number(),
  energyLevel: z.number(),
  tags: z.array(z.string()),
});

export type MoodAnalysis = z.infer<typeof MoodAnalysisSchema>;

// State
const AnalysisState = Annotation.Root({
  content: Annotation<string>,
  analysis: Annotation<MoodAnalysis | null>,
});

// Node: analyze mood
async function analyzeMood(state: typeof AnalysisState.State) {
  const model = getAnalysisModel();

  const prompt = `${state.content}

Responda APENAS com JSON valido no formato:
{
  "mood": "sentimento em uma palavra",
  "moodScore": 0.0,
  "energyLevel": 0.5,
  "tags": ["tema1", "tema2"]
}

Onde moodScore vai de -1.0 (muito negativo) a 1.0 (muito positivo) e energyLevel de 0.0 a 1.0.`;

  const response = await model.invoke([
    new SystemMessage(MOOD_ANALYSIS_PROMPT),
    new HumanMessage(prompt),
  ]);

  const text = typeof response.content === "string" ? response.content : "";

  try {
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");

    const parsed = JSON.parse(jsonMatch[0]);
    const analysis = MoodAnalysisSchema.parse({
      mood: String(parsed.mood ?? "indefinido"),
      moodScore: Math.max(-1, Math.min(1, Number(parsed.moodScore ?? 0))),
      energyLevel: Math.max(0, Math.min(1, Number(parsed.energyLevel ?? 0.5))),
      tags: Array.isArray(parsed.tags) ? parsed.tags.map(String).slice(0, 5) : [],
    });

    return { analysis };
  } catch (error) {
    console.error("Mood analysis JSON parsing failed:", error);
    return {
      analysis: {
        mood: "indefinido",
        moodScore: 0,
        energyLevel: 0.5,
        tags: [],
      },
    };
  }
}

// Build graph
const workflow = new StateGraph(AnalysisState)
  .addNode("analyze", analyzeMood)
  .addEdge("__start__", "analyze")
  .addEdge("analyze", "__end__");

export const analysisGraph = workflow.compile();

// Helper
export async function analyzeEntry(content: string): Promise<MoodAnalysis> {
  const result = await analysisGraph.invoke({ content, analysis: null });
  return result.analysis!;
}
