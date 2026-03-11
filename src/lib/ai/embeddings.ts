import { OllamaEmbeddings } from "@langchain/ollama";

let embeddingsInstance: OllamaEmbeddings | null = null;

export function getEmbeddings() {
  if (!embeddingsInstance) {
    embeddingsInstance = new OllamaEmbeddings({
      model: process.env.OLLAMA_EMBEDDING_MODEL ?? "nomic-embed-text",
      baseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
    });
  }
  return embeddingsInstance;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const embeddings = getEmbeddings();
  return embeddings.embedQuery(text);
}
