"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { JournalEntry } from "@/types";

interface MoodChartProps {
  entries: JournalEntry[];
}

export function MoodChart({ entries }: MoodChartProps) {
  const data = useMemo(() => {
    return entries
      .filter((e) => e.moodScore !== null)
      .reverse()
      .map((e) => ({
        date: new Date(e.createdAt).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        }),
        humor: e.moodScore,
        energia: e.energyLevel,
        mood: e.mood,
      }));
  }, [entries]);

  if (data.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Humor ao longo do tempo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-8 text-center">
            Escreva pelo menos 2 entradas para ver o grafico
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Humor ao longo do tempo</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="date" fontSize={12} />
            <YAxis domain={[-1, 1]} fontSize={12} ticks={[-1, -0.5, 0, 0.5, 1]} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-popover border rounded-lg p-3 shadow-md text-sm">
                    <p className="font-medium">{d.date}</p>
                    <p>Humor: {d.mood} ({Number(d.humor).toFixed(2)})</p>
                    <p>Energia: {(Number(d.energia) * 100).toFixed(0)}%</p>
                  </div>
                );
              }}
            />
            <ReferenceLine y={0} stroke="#888" strokeDasharray="3 3" />
            <Line
              type="monotone"
              dataKey="humor"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="energia"
              stroke="hsl(var(--chart-3))"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex gap-4 justify-center mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-[hsl(var(--chart-1))]" />
            Humor
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-[hsl(var(--chart-3))] border-dashed" />
            Energia
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
