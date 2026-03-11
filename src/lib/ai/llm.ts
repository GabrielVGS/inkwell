import { ChatOllama } from "@langchain/ollama";

// Model for everyday analysis and reflection (fast)
export function getReflectionModel() {
  return new ChatOllama({
    model: process.env.OLLAMA_MODEL ?? "llama3.1",
    baseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
    temperature: 0.7,
  });
}

// Model for structured output (mood analysis)
export function getAnalysisModel() {
  return new ChatOllama({
    model: process.env.OLLAMA_MODEL ?? "llama3.1",
    baseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
    temperature: 0.3,
    format: "json",
  });
}

// Model for summaries (can use a larger model if available)
export function getSummaryModel() {
  return new ChatOllama({
    model: process.env.OLLAMA_SUMMARY_MODEL ?? process.env.OLLAMA_MODEL ?? "llama3.1",
    baseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
    temperature: 0.5,
  });
}
