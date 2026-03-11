import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { StateGraph, Annotation } from "@langchain/langgraph";

import { MONTHLY_SUMMARY_PROMPT } from "../../prompts";
import { getSummaryModel } from "../llm";

// State
const MonthlySummaryState = Annotation.Root({
  entries: Annotation<
    {
      content: string;
      createdAt: string;
      mood: string | null;
      moodScore: number | null;
      tags: string[];
    }[]
  >,
  summary: Annotation<string>,
});

// Streaming version
export async function* streamMonthlySummary(
  entries: {
    content: string;
    createdAt: string;
    mood: string | null;
    moodScore: number | null;
    tags: string[];
  }[],
) {
  const model = getSummaryModel();

  const entriesText = entries
    .map((e) => {
      const date = new Date(e.createdAt).toLocaleDateString("pt-BR");
      const tags = e.tags?.length > 0 ? ` [${e.tags.join(", ")}]` : "";
      return `[${date}] (humor: ${e.mood ?? "?"}, score: ${e.moodScore ?? "?"})${tags}\n${e.content}`;
    })
    .join("\n\n---\n\n");

  const stream = await model.stream([
    new SystemMessage(MONTHLY_SUMMARY_PROMPT),
    new HumanMessage(
      `Aqui estao as ${entries.length} entradas do diario deste mes:\n\n${entriesText}`,
    ),
  ]);

  for await (const chunk of stream) {
    const content = typeof chunk.content === "string" ? chunk.content : "";
    if (content) yield content;
  }
}
