import { describe, it, expect } from "vitest";
import { createSSEResponse } from "../sse";

async function readSSE(response: Response): Promise<string[]> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (line.startsWith("data: ")) chunks.push(line.slice(6));
    }
  }
  return chunks;
}

describe("createSSEResponse", () => {
  it("produces valid SSE data format", async () => {
    async function* gen() { yield "hello"; yield " world"; }
    const response = createSSEResponse(gen(), "test error");
    const chunks = await readSSE(response);
    expect(chunks).toContain(JSON.stringify({ content: "hello" }));
    expect(chunks).toContain(JSON.stringify({ content: " world" }));
  });

  it("sends [DONE] at end", async () => {
    async function* gen() { yield "data"; }
    const response = createSSEResponse(gen(), "test error");
    const chunks = await readSSE(response);
    expect(chunks[chunks.length - 1]).toBe("[DONE]");
  });

  it("handles generator errors gracefully", async () => {
    async function* gen() { yield "start"; throw new Error("boom"); }
    const response = createSSEResponse(gen(), "Stream failed");
    const chunks = await readSSE(response);
    expect(chunks[0]).toBe(JSON.stringify({ content: "start" }));
    const errorChunk = chunks.find((c) => c.includes("error"));
    expect(errorChunk).toBeDefined();
    expect(JSON.parse(errorChunk!).error).toBe("Stream failed");
  });
});
