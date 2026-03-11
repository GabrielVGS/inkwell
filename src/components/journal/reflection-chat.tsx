"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSSEChat } from "@/hooks/use-sse-chat";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { JournalEntry } from "@/types";

interface ReflectionChatProps {
  entry: JournalEntry;
  previousEntries?: JournalEntry[];
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function ReflectionChat({ entry, previousEntries }: ReflectionChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [initialMessages, setInitialMessages] = useState<ChatMessage[] | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/reflections/${entry.id}`);
        const reflections = await res.json();
        if (cancelled) return;

        if (reflections.length > 0) {
          const msgs: ChatMessage[] = reflections.map((r: { id: string; role: "user" | "assistant"; content: string }) => ({
            id: r.id,
            role: r.role,
            content: r.content,
          }));
          setInitialMessages(msgs);
        } else {
          setInitialMessages([]);
        }
      } catch {
        setInitialMessages([]);
      }
      setLoaded(true);
    }
    load();
    return () => { cancelled = true; };
  }, [entry.id]);

  const handleFinish = useCallback(
    async (userMsg: ChatMessage, assistantMsg: ChatMessage) => {
      await fetch(`/api/reflections/${entry.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: userMsg.role, content: userMsg.content }),
      });
      await fetch(`/api/reflections/${entry.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: assistantMsg.role, content: assistantMsg.content }),
      });
    },
    [entry.id]
  );

  if (!loaded || initialMessages === null) {
    return (
      <div className="flex flex-col h-[500px] rounded-lg border border-border/60 items-center justify-center">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 animate-pulse"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <ReflectionChatInner
      entry={entry}
      previousEntries={previousEntries}
      initialMessages={initialMessages}
      onFinish={handleFinish}
      scrollRef={scrollRef}
    />
  );
}

interface ReflectionChatInnerProps {
  entry: JournalEntry;
  previousEntries?: JournalEntry[];
  initialMessages: ChatMessage[];
  onFinish: (userMsg: ChatMessage, assistantMsg: ChatMessage) => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

function ReflectionChatInner({
  entry,
  previousEntries,
  initialMessages,
  onFinish,
  scrollRef,
}: ReflectionChatInnerProps) {
  const hasExisting = initialMessages.length > 0;
  const startedRef = useRef(false);

  const { messages, input, handleInputChange, handleSubmit, isLoading, append } = useSSEChat({
    api: "/api/reflect",
    body: {
      currentEntry: entry.content,
      previousEntries: previousEntries?.map((e) => ({
        content: e.content,
        createdAt: e.createdAt,
        mood: e.mood,
      })),
    },
    initialMessages,
    onFinish,
  });

  useEffect(() => {
    if (!hasExisting && !startedRef.current) {
      startedRef.current = true;
      append({ role: "user", content: entry.content });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, scrollRef]);

  const displayMessages = hasExisting
    ? messages
    : messages.filter((_, i) => i > 0);

  return (
    <div className="flex flex-col h-[500px] rounded-lg border border-border/60 bg-card/30 overflow-hidden animate-fade-up">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-border/40">
        <p className="font-display text-base italic tracking-tight">Reflexao</p>
        <p className="text-[11px] text-muted-foreground/60 mt-0.5">
          Converse sobre o que voce escreveu
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5" ref={scrollRef}>
        <div className="py-4 space-y-4">
          {displayMessages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "chat-msg flex",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <div className="shrink-0 w-6 h-6 rounded-full bg-foreground/8 flex items-center justify-center mr-2.5 mt-0.5">
                  <span className="text-[9px] font-medium text-foreground/50 uppercase tracking-wider">
                    ia
                  </span>
                </div>
              )}
              <div
                className={cn(
                  "rounded-lg px-3.5 py-2.5 max-w-[80%] text-[13px] leading-relaxed",
                  message.role === "user"
                    ? "bg-foreground text-background"
                    : "bg-muted/60 text-foreground/85"
                )}
              >
                {message.content || (
                  <span className="flex gap-1 items-center text-muted-foreground/50">
                    <span className="w-1 h-1 rounded-full bg-current animate-pulse" />
                    <span className="w-1 h-1 rounded-full bg-current animate-pulse" style={{ animationDelay: "150ms" }} />
                    <span className="w-1 h-1 rounded-full bg-current animate-pulse" style={{ animationDelay: "300ms" }} />
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border/40">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            value={input}
            onChange={handleInputChange}
            placeholder="Responda ou pergunte algo..."
            className="min-h-[40px] max-h-[100px] resize-none text-[13px] border-border/40 bg-transparent px-3 py-2"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            size="sm"
            className="shrink-0 text-xs self-end"
          >
            Enviar
          </Button>
        </form>
      </div>
    </div>
  );
}
