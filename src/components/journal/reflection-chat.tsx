"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSSEChat } from "@/hooks/use-sse-chat";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
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

  // Load existing reflections from DB
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

  // Save messages to DB after each exchange
  const handleFinish = useCallback(
    async (userMsg: ChatMessage, assistantMsg: ChatMessage) => {
      // Save sequentially to guarantee correct created_at order
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
      <Card className="w-full flex flex-col h-[500px] items-center justify-center">
        <p className="text-sm text-muted-foreground animate-pulse">Carregando conversa...</p>
      </Card>
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

  // Auto-start reflection only if no existing conversation
  // Ref guard prevents double-fire in React strict mode
  useEffect(() => {
    if (!hasExisting && !startedRef.current) {
      startedRef.current = true;
      append({ role: "user", content: entry.content });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, scrollRef]);

  // Skip the initial user message (entry content) only for new conversations
  const displayMessages = hasExisting
    ? messages
    : messages.filter((_, i) => i > 0);

  return (
    <Card className="w-full flex flex-col h-[500px]">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium">Reflexao</CardTitle>
        <p className="text-sm text-muted-foreground">
          Converse sobre o que voce escreveu
        </p>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-6" ref={scrollRef}>
          <div className="space-y-4 pb-4">
            {displayMessages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8 shrink-0 bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                    IA
                  </Avatar>
                )}
                <div
                  className={`rounded-lg px-4 py-2 max-w-[80%] text-sm leading-relaxed ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {message.content || (
                    <span className="animate-pulse">Pensando...</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="pt-3">
        <form onSubmit={handleSubmit} className="flex w-full gap-2">
          <Textarea
            value={input}
            onChange={handleInputChange}
            placeholder="Responda ou pergunte algo..."
            className="min-h-[44px] max-h-[120px] resize-none text-sm"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button type="submit" disabled={isLoading || !input.trim()} size="sm">
            Enviar
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
