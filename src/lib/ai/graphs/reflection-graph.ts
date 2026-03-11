import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";

import { buildAdaptiveSystemPrompt, buildReflectionPrompt } from "../../prompts";
import { getReflectionModel } from "../llm";

type MoodContext = { avgScore: number; trend: "improving" | "declining" | "stable" };
type PreviousEntry = { content: string; createdAt: string; mood: string | null };

function buildReflectionMessages(
  currentEntry: string,
  previousEntries: PreviousEntry[],
  conversationHistory: { role: string; content: string }[],
  moodContext?: MoodContext,
) {
  const systemPrompt = buildAdaptiveSystemPrompt(moodContext);
  const systemMessage = new SystemMessage(systemPrompt);

  const messages = conversationHistory.map((msg) =>
    msg.role === "user" ? new HumanMessage(msg.content) : new AIMessage(msg.content),
  );

  if (messages.length === 0) {
    messages.push(new HumanMessage(currentEntry));
  }

  // Enrich first message with RAG context
  if (messages.length === 1 && previousEntries?.length > 0) {
    const contextPrompt = buildReflectionPrompt(currentEntry, previousEntries);
    messages[0] = new HumanMessage(contextPrompt);
  }

  return { systemMessage, messages };
}

export async function* streamReflection(
  currentEntry: string,
  previousEntries: PreviousEntry[],
  conversationHistory: { role: string; content: string }[],
  moodContext?: MoodContext,
) {
  const model = getReflectionModel();
  const { systemMessage, messages } = buildReflectionMessages(
    currentEntry,
    previousEntries,
    conversationHistory,
    moodContext,
  );

  const stream = await model.stream([systemMessage, ...messages]);

  for await (const chunk of stream) {
    const content = typeof chunk.content === "string" ? chunk.content : "";
    if (content) {
      yield content;
    }
  }
}
