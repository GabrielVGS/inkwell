"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
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
      <div className="rounded-lg border border-border/60 bg-card/30 overflow-hidden animate-fade-up">
        <div className="px-5 py-4 border-b border-border/40">
          <p className="font-display text-base italic">Humor ao longo do tempo</p>
        </div>
        <div className="px-5 py-12 text-center">
          <p className="text-sm italic text-muted-foreground/50">
            Escreva pelo menos 2 entradas para ver o grafico
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/60 bg-card/30 overflow-hidden animate-fade-up">
      <div className="px-5 py-4 border-b border-border/40">
        <p className="font-display text-base italic">Humor ao longo do tempo</p>
      </div>
      <div className="px-3 py-4">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data}>
            <XAxis
              dataKey="date"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dy={8}
              stroke="currentColor"
              opacity={0.3}
            />
            <YAxis
              domain={[-1, 1]}
              fontSize={10}
              tickLine={false}
              axisLine={false}
              ticks={[-1, -0.5, 0, 0.5, 1]}
              dx={-4}
              stroke="currentColor"
              opacity={0.3}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="rounded-md bg-popover border border-border/60 px-3 py-2 shadow-lg text-xs">
                    <p className="font-medium mb-1">{d.date}</p>
                    <p className="text-muted-foreground">
                      Humor: {d.mood} ({Number(d.humor).toFixed(2)})
                    </p>
                    <p className="text-muted-foreground">
                      Energia: {(Number(d.energia) * 100).toFixed(0)}%
                    </p>
                  </div>
                );
              }}
            />
            <ReferenceLine y={0} stroke="currentColor" strokeOpacity={0.1} />
            <Line
              type="monotone"
              dataKey="humor"
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={{ r: 3, fill: "var(--chart-1)", strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "var(--chart-1)", strokeWidth: 0 }}
            />
            <Line
              type="monotone"
              dataKey="energia"
              stroke="var(--chart-3)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={{ r: 2, fill: "var(--chart-3)", strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex gap-5 justify-center mt-1 text-[11px] text-muted-foreground/50">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-[2px] rounded-full bg-[var(--chart-1)]" />
            Humor
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-[2px] rounded-full bg-[var(--chart-3)] opacity-60" />
            Energia
          </div>
        </div>
      </div>
    </div>
  );
}
