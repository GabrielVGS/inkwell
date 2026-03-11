import { StateGraph, Annotation } from "@langchain/langgraph";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { getSummaryModel } from "../llm";
import { WEEKLY_SUMMARY_PROMPT } from "../../prompts";

// State
const SummaryState = Annotation.Root({
  entries: Annotation<{ content: string; createdAt: string; mood: string | null; moodScore: number | null }[]>,
  summary: Annotation<string>,
});

// Node: generate summary
async function generateSummary(state: typeof SummaryState.State) {
  const model = getSummaryModel();

  const entriesText = state.entries
    .map((e) => {
      const date = new Date(e.createdAt).toLocaleDateString("pt-BR");
      return `[${date}] (humor: ${e.mood ?? "?"}, score: ${e.moodScore ?? "?"})\n${e.content}`;
    })
    .join("\n\n---\n\n");

  const response = await model.invoke([
    new SystemMessage(WEEKLY_SUMMARY_PROMPT),
    new HumanMessage(
      `Aqui estao as ${state.entries.length} entradas do diario desta semana:\n\n${entriesText}`
    ),
  ]);

  const summary = typeof response.content === "string" ? response.content : "";
  return { summary };
}

// Build graph
const workflow = new StateGraph(SummaryState)
  .addNode("summarize", generateSummary)
  .addEdge("__start__", "summarize")
  .addEdge("summarize", "__end__");

export const summaryGraph = workflow.compile();

// Helper
export async function generateWeeklySummary(
  entries: { content: string; createdAt: string; mood: string | null; moodScore: number | null }[]
): Promise<string> {
  const result = await summaryGraph.invoke({ entries, summary: "" });
  return result.summary;
}

// Streaming version
export async function* streamWeeklySummary(
  entries: { content: string; createdAt: string; mood: string | null; moodScore: number | null }[]
) {
  const model = getSummaryModel();

  const entriesText = entries
    .map((e) => {
      const date = new Date(e.createdAt).toLocaleDateString("pt-BR");
      return `[${date}] (humor: ${e.mood ?? "?"}, score: ${e.moodScore ?? "?"})\n${e.content}`;
    })
    .join("\n\n---\n\n");

  const stream = await model.stream([
    new SystemMessage(WEEKLY_SUMMARY_PROMPT),
    new HumanMessage(
      `Aqui estao as ${entries.length} entradas do diario desta semana:\n\n${entriesText}`
    ),
  ]);

  for await (const chunk of stream) {
    const content = typeof chunk.content === "string" ? chunk.content : "";
    if (content) yield content;
  }
}
