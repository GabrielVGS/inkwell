"use client";

import { useState, useEffect } from "react";
import { MoodChart } from "@/components/insights/mood-chart";
import { TagCloud } from "@/components/insights/tag-cloud";
import { StatsCards } from "@/components/insights/stats-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold">Insights</h1>

        <StatsCards entries={entries} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MoodChart entries={entries} />
          <TagCloud entries={entries} />
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Resumo da semana</CardTitle>
            <Button
              onClick={generateSummary}
              disabled={isLoading || entries.length === 0}
              variant="outline"
              size="sm"
            >
              {isLoading ? "Gerando..." : "Gerar resumo"}
            </Button>
          </CardHeader>
          <CardContent>
            {summaryContent ? (
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                {summaryContent}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {entries.length === 0
                  ? "Escreva algumas entradas para gerar um resumo semanal."
                  : "Clique em \"Gerar resumo\" para uma analise reflexiva das suas entradas recentes."}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
