import { StateGraph, Annotation, MessagesAnnotation } from "@langchain/langgraph";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { getReflectionModel } from "../llm";
import { buildAdaptiveSystemPrompt, buildReflectionPrompt } from "../../prompts";

// State definition using LangGraph Annotation
const ReflectionState = Annotation.Root({
  ...MessagesAnnotation.spec,
  currentEntry: Annotation<string>,
  previousEntries: Annotation<{ content: string; createdAt: string; mood: string | null }[]>,
  moodContext: Annotation<{ avgScore: number; trend: "improving" | "declining" | "stable" } | undefined>,
});

// Node: generate reflection response
async function reflect(state: typeof ReflectionState.State) {
  const model = getReflectionModel();

  const systemPrompt = buildAdaptiveSystemPrompt(state.moodContext);
  const systemMessage = new SystemMessage(systemPrompt);

  // Build context from previous entries if this is the first message
  const messages = [...state.messages];
  if (messages.length === 1 && state.previousEntries?.length > 0) {
    const contextPrompt = buildReflectionPrompt(state.currentEntry, state.previousEntries);
    // Replace the first user message with the enriched one
    messages[0] = new HumanMessage(contextPrompt);
  }

  const response = await model.invoke([systemMessage, ...messages]);

  return { messages: [response] };
}

// Build the graph
const workflow = new StateGraph(ReflectionState)
  .addNode("reflect", reflect)
  .addEdge("__start__", "reflect")
  .addEdge("reflect", "__end__");

export const reflectionGraph = workflow.compile();

// Helper to invoke the graph
export async function getReflection(
  currentEntry: string,
  previousEntries: { content: string; createdAt: string; mood: string | null }[],
  conversationHistory: { role: string; content: string }[],
  moodContext?: { avgScore: number; trend: "improving" | "declining" | "stable" }
) {
  const messages = conversationHistory.map((msg) =>
    msg.role === "user" ? new HumanMessage(msg.content) : new AIMessage(msg.content)
  );

  // If no history, start with the entry content
  if (messages.length === 0) {
    messages.push(new HumanMessage(currentEntry));
  }

  const result = await reflectionGraph.invoke({
    messages,
    currentEntry,
    previousEntries,
    moodContext,
  });

  const lastMessage = result.messages[result.messages.length - 1];
  return typeof lastMessage.content === "string"
    ? lastMessage.content
    : JSON.stringify(lastMessage.content);
}

// Streaming version
export async function* streamReflection(
  currentEntry: string,
  previousEntries: { content: string; createdAt: string; mood: string | null }[],
  conversationHistory: { role: string; content: string }[],
  moodContext?: { avgScore: number; trend: "improving" | "declining" | "stable" }
) {
  const model = getReflectionModel();
  const systemPrompt = buildAdaptiveSystemPrompt(moodContext);
  const systemMessage = new SystemMessage(systemPrompt);

  const messages = conversationHistory.map((msg) =>
    msg.role === "user" ? new HumanMessage(msg.content) : new AIMessage(msg.content)
  );

  if (messages.length === 0) {
    messages.push(new HumanMessage(currentEntry));
  }

  // Enrich first message with RAG context
  if (messages.length === 1 && previousEntries?.length > 0) {
    const contextPrompt = buildReflectionPrompt(currentEntry, previousEntries);
    messages[0] = new HumanMessage(contextPrompt);
  }

  const stream = await model.stream([systemMessage, ...messages]);

  for await (const chunk of stream) {
    const content = typeof chunk.content === "string" ? chunk.content : "";
    if (content) {
      yield content;
    }
  }
}
