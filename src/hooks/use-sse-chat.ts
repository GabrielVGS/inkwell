"use client";

import { useState, useCallback, useRef } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface UseSSEChatOptions {
  api: string;
  body?: Record<string, unknown>;
}

export function useSSEChat({ api, body }: UseSSEChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const append = useCallback(
    async (message: Pick<Message, "role" | "content">) => {
      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: message.role,
        content: message.content,
      };

      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setIsLoading(true);

      // Create assistant placeholder
      const assistantId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "" },
      ]);

      try {
        abortRef.current = new AbortController();

        const response = await fetch(api, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...body,
            messages: updatedMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
          signal: abortRef.current.signal,
        });

        if (!response.ok) throw new Error("Stream request failed");

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No reader");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") break;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: m.content + parsed.content }
                      : m
                  )
                );
              }
            } catch {
              // skip malformed chunks
            }
          }
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: "Erro ao conectar com o modelo. Verifique se o Ollama esta rodando." }
                : m
            )
          );
        }
      } finally {
        setIsLoading(false);
      }
    },
    [api, body, messages]
  );

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!input.trim() || isLoading) return;
      const content = input;
      setInput("");
      append({ role: "user", content });
    },
    [input, isLoading, append]
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
  }, []);

  return {
    messages,
    input,
    setInput,
    handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value),
    handleSubmit,
    isLoading,
    append,
    stop,
  };
}
