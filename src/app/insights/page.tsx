"use client";

import { useState, useEffect } from "react";
import { MoodChart } from "@/components/insights/mood-chart";
import { TagCloud } from "@/components/insights/tag-cloud";
import { StatsCards } from "@/components/insights/stats-cards";
import { Button } from "@/components/ui/button";
import type { JournalEntry } from "@/types";

export default function InsightsPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [summaryContent, setSummaryContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch("/api/entries")
      .then((res) => res.json())
      .then(setEntries);
  }, []);

  const generateSummary = async () => {
    if (entries.length === 0) return;
    setIsLoading(true);
    setSummaryContent("");

    try {
      const response = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: entries.slice(0, 7) }),
      });

      const reader = response.body?.getReader();
      if (!reader) return;

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
              setSummaryContent((prev) => prev + parsed.content);
            }
          } catch {
            // skip
          }
        }
      }
    } catch {
      setSummaryContent("Erro ao gerar resumo. Verifique se o Ollama esta rodando.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Page header */}
        <div className="animate-fade-up">
          <h1 className="font-display text-2xl italic tracking-tight">Insights</h1>
          <div className="rule mt-3" />
        </div>

        {/* Stats */}
        <StatsCards entries={entries} />

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MoodChart entries={entries} />
          <TagCloud entries={entries} />
        </div>

        {/* Weekly summary */}
        <div className="animate-fade-up">
          <div className="rounded-lg border border-border/60 bg-card/30 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
              <div>
                <p className="font-display text-base italic">Resumo da semana</p>
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                  Analise reflexiva gerada por IA
                </p>
              </div>
              <Button
                onClick={generateSummary}
                disabled={isLoading || entries.length === 0}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                {isLoading ? "Gerando..." : "Gerar resumo"}
              </Button>
            </div>
            <div className="px-5 py-4">
              {summaryContent ? (
                <div className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">
                  {summaryContent}
                </div>
              ) : (
                <p className="text-sm italic text-muted-foreground/50 py-4 text-center">
                  {entries.length === 0
                    ? "Escreva algumas entradas para gerar um resumo semanal."
                    : "Clique em \"Gerar resumo\" para uma analise reflexiva das suas entradas recentes."}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
