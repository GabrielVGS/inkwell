"use client";

import { useEffect, useRef } from "react";
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

export function ReflectionChat({ entry, previousEntries }: ReflectionChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

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
  });

  // Auto-start reflection on mount
  useEffect(() => {
    if (messages.length === 0) {
      append({ role: "user", content: entry.content });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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
            {messages
              .filter((_, i) => i > 0) // Skip the initial user message (entry content)
              .map((message) => (
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
