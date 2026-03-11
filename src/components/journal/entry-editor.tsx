"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MoodAnalysis } from "@/types";

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
      const moodAnalysis: MoodAnalysis = await res.json();
      setAnalysis(moodAnalysis);
      onSave(content, moodAnalysis);
      setContent("");
      setAnalysis(null);
    } catch {
      // Save without analysis on error
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-medium">
          {today}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Escreva livremente sobre seu dia, pensamentos ou sentimentos.
        </p>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="Hoje eu..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[200px] resize-y text-base leading-relaxed"
          disabled={analyzing || isLoading}
        />
        {analysis && (
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="secondary">{analysis.mood}</Badge>
            {analysis.tags.map((tag) => (
              <Badge key={tag} variant="outline">{tag}</Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <span className="text-xs text-muted-foreground">
          {content.length > 0 ? `${content.split(/\s+/).filter(Boolean).length} palavras` : ""}
        </span>
        <Button
          onClick={handleSave}
          disabled={!content.trim() || analyzing || isLoading}
        >
          {analyzing ? "Analisando..." : "Salvar e Refletir"}
        </Button>
      </CardFooter>
    </Card>
  );
}
