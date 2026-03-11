"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Markdown from "react-markdown";

export function MonthlySummary() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const monthNames = [
    "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];

  const goToPrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const generateMonthlySummary = async () => {
    setIsLoading(true);
    setContent("");
    setError("");

    try {
      const response = await fetch("/api/monthly-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, month }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Erro ao gerar resumo mensal");
        return;
      }

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
              setContent((prev) => prev + parsed.content);
            }
            if (parsed.error) {
              setError(parsed.error);
            }
          } catch {
            // skip
          }
        }
      }
    } catch {
      setError("Erro ao gerar resumo. Verifique se o Ollama esta rodando.");
    } finally {
      setIsLoading(false);
    }
  };

  const isCurrentOrFuture =
    year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth() + 1);

  return (
    <div className="rounded-lg border border-border/60 bg-card/30 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
        <div>
          <p className="font-display text-base italic">Resumo mensal</p>
          <p className="text-[11px] text-muted-foreground/60 mt-0.5">
            Analise de longo prazo gerada por IA
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevMonth}
            className="text-muted-foreground/60 hover:text-foreground text-sm px-1.5 py-0.5 transition-colors"
          >
            &larr;
          </button>
          <span className="text-xs text-muted-foreground min-w-[120px] text-center">
            {monthNames[month - 1]} {year}
          </span>
          <button
            onClick={goToNextMonth}
            disabled={isCurrentOrFuture}
            className="text-muted-foreground/60 hover:text-foreground text-sm px-1.5 py-0.5 transition-colors disabled:opacity-30"
          >
            &rarr;
          </button>
          <Button
            onClick={generateMonthlySummary}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="text-xs ml-2"
          >
            {isLoading ? "Gerando..." : "Gerar"}
          </Button>
        </div>
      </div>
      <div className="px-5 py-4">
        {error ? (
          <p className="text-sm italic text-muted-foreground/50 py-4 text-center">{error}</p>
        ) : content ? (
          <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-headings:font-display prose-headings:tracking-tight">
            <Markdown>{content}</Markdown>
          </div>
        ) : (
          <p className="text-sm italic text-muted-foreground/50 py-4 text-center">
            Selecione um mes e clique em &quot;Gerar&quot; para uma analise mensal das suas entradas.
          </p>
        )}
      </div>
    </div>
  );
}
