"use client";

import { useState } from "react";

import type { MoodAnalysis } from "@/types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface EntryEditorProps {
  onSave: (content: string, analysis: MoodAnalysis) => void;
  isLoading?: boolean;
}

export function EntryEditor({ onSave, isLoading }: EntryEditorProps) {
  const [content, setContent] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<MoodAnalysis | null>(null);

  const handleSave = async () => {
    if (!content.trim()) return;

    setAnalyzing(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error(`Failed to analyze entry: ${res.status}`);
      const moodAnalysis: MoodAnalysis = await res.json();
      setAnalysis(moodAnalysis);
      onSave(content, moodAnalysis);
      setContent("");
      setAnalysis(null);
    } catch {
      onSave(content, { mood: "indefinido", moodScore: 0, energyLevel: 0.5, tags: [] });
      setContent("");
    } finally {
      setAnalyzing(false);
    }
  };

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const wordCount = content.trim() ? content.split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="animate-fade-up">
      {/* Date header */}
      <div className="mb-4">
        <p className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground/70 mb-1">
          Hoje
        </p>
        <p className="font-display text-lg capitalize text-foreground/80">{today}</p>
      </div>

      {/* Writing area */}
      <div className="relative rounded-lg border border-border/60 bg-card/50 overflow-hidden transition-shadow focus-within:shadow-[0_0_0_1px_var(--border)]">
        <Textarea
          placeholder="Escreva livremente sobre seu dia..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="writing-area min-h-[220px] resize-y text-[15px] border-0 bg-transparent px-5 py-4 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:italic placeholder:text-muted-foreground/30"
          disabled={analyzing || isLoading}
        />

        {/* Bottom bar */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border/40">
          <div className="flex items-center gap-3">
            <span className="text-[11px] tabular-nums text-muted-foreground/50">
              {wordCount > 0 ? `${wordCount} palavras` : ""}
            </span>
            {analysis && (
              <div className="flex gap-1.5">
                <Badge variant="secondary" className="text-[11px] font-normal">
                  {analysis.mood}
                </Badge>
                {analysis.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-[11px] font-normal">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <Button
            onClick={handleSave}
            disabled={!content.trim() || analyzing || isLoading}
            size="sm"
            className="text-xs px-4"
          >
            {analyzing ? "Analisando..." : "Salvar e refletir"}
          </Button>
        </div>
      </div>
    </div>
  );
}
