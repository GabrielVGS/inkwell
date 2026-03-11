"use client";

import { useMemo, useState } from "react";
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

interface DailyPoint {
  date: string;
  sortKey: string;
  humor: number;
  energia: number | null;
  count: number;
  moods: string[];
}

interface DetailPoint {
  label: string;
  humor: number;
  energia: number | null;
  mood: string | null;
  time: string;
}

export function MoodChart({ entries }: MoodChartProps) {
  const [view, setView] = useState<"daily" | "detailed">("daily");

  const dailyData = useMemo(() => {
    const filtered = entries.filter((e) => e.moodScore !== null);
    const byDay = new Map<string, { scores: number[]; energies: (number | null)[]; moods: string[] }>();

    for (const e of filtered) {
      const d = new Date(e.createdAt);
      const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const dateLabel = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

      if (!byDay.has(sortKey)) {
        byDay.set(sortKey, { scores: [], energies: [], moods: [] });
      }
      const bucket = byDay.get(sortKey)!;
      bucket.scores.push(e.moodScore!);
      bucket.energies.push(e.energyLevel);
      if (e.mood) bucket.moods.push(e.mood);
    }

    return [...byDay.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([sortKey, bucket]): DailyPoint => {
        const d = new Date(sortKey + "T12:00:00");
        return {
          date: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
          sortKey,
          humor: bucket.scores.reduce((a, b) => a + b, 0) / bucket.scores.length,
          energia: bucket.energies.some((e) => e != null)
            ? bucket.energies.filter((e): e is number => e != null).reduce((a, b) => a + b, 0) /
              bucket.energies.filter((e) => e != null).length
            : null,
          count: bucket.scores.length,
          moods: [...new Set(bucket.moods)],
        };
      });
  }, [entries]);

  const detailedData = useMemo(() => {
    return entries
      .filter((e) => e.moodScore !== null)
      .reverse()
      .map((e, i): DetailPoint => {
        const d = new Date(e.createdAt);
        const dateStr = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
        const timeStr = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
        return {
          label: `${dateStr} ${timeStr}`,
          humor: e.moodScore!,
          energia: e.energyLevel,
          mood: e.mood,
          time: timeStr,
        };
      });
  }, [entries]);

  const hasData = dailyData.length >= 2 || detailedData.length >= 2;

  if (!hasData) {
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
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
        <p className="font-display text-base italic">Humor ao longo do tempo</p>
        <div className="flex gap-1 rounded-md border border-border/40 p-0.5">
          <button
            onClick={() => setView("daily")}
            aria-label="Visualizar por dia"
            className={`text-[11px] px-2.5 py-1 rounded transition-colors ${
              view === "daily"
                ? "bg-foreground/10 text-foreground"
                : "text-muted-foreground/50 hover:text-muted-foreground"
            }`}
          >
            Por dia
          </button>
          <button
            onClick={() => setView("detailed")}
            aria-label="Visualizar por entrada"
            className={`text-[11px] px-2.5 py-1 rounded transition-colors ${
              view === "detailed"
                ? "bg-foreground/10 text-foreground"
                : "text-muted-foreground/50 hover:text-muted-foreground"
            }`}
          >
            Por entrada
          </button>
        </div>
      </div>
      <div className="px-3 py-4">
        {view === "daily" ? (
          <DailyChart data={dailyData} />
        ) : (
          <DetailedChart data={detailedData} />
        )}
        <div className="flex gap-5 justify-center mt-1 text-[11px] text-muted-foreground/50">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-[2px] rounded-full bg-[var(--chart-1)]" />
            Humor (-1 a 1)
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-[2px] rounded-full bg-[var(--chart-3)] opacity-60" />
            Energia (0 a 100%)
          </div>
        </div>
      </div>
    </div>
  );
}

function DailyChart({ data }: { data: DailyPoint[] }) {
  return (
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
          yAxisId="humor"
          domain={[-1, 1]}
          fontSize={10}
          tickLine={false}
          axisLine={false}
          ticks={[-1, -0.5, 0, 0.5, 1]}
          dx={-4}
          stroke="currentColor"
          opacity={0.3}
          orientation="left"
        />
        <YAxis
          yAxisId="energia"
          domain={[0, 1]}
          fontSize={10}
          tickLine={false}
          axisLine={false}
          ticks={[0, 0.25, 0.5, 0.75, 1]}
          dx={4}
          stroke="currentColor"
          opacity={0.3}
          orientation="right"
          tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0]?.payload as DailyPoint | undefined;
            if (!d) return null;
            return (
              <div className="rounded-md bg-popover border border-border/60 px-3 py-2 shadow-lg text-xs">
                <p className="font-medium mb-1">{label}</p>
                <p className="text-muted-foreground">
                  Humor medio: {d.humor.toFixed(2)}
                </p>
                {d.energia != null && (
                  <p className="text-muted-foreground">
                    Energia media: {(d.energia * 100).toFixed(0)}%
                  </p>
                )}
                {d.moods.length > 0 && (
                  <p className="text-muted-foreground">
                    Humores: {d.moods.join(", ")}
                  </p>
                )}
                {d.count > 1 && (
                  <p className="text-muted-foreground/60 mt-1">
                    {d.count} entradas
                  </p>
                )}
              </div>
            );
          }}
        />
        <ReferenceLine yAxisId="humor" y={0} stroke="currentColor" strokeOpacity={0.1} />
        <Line
          yAxisId="humor"
          type="monotone"
          dataKey="humor"
          stroke="var(--chart-1)"
          strokeWidth={2}
          dot={{ r: 3, fill: "var(--chart-1)", strokeWidth: 0 }}
          activeDot={{ r: 5, fill: "var(--chart-1)", strokeWidth: 0 }}
          connectNulls
        />
        <Line
          yAxisId="energia"
          type="monotone"
          dataKey="energia"
          stroke="var(--chart-3)"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          dot={{ r: 2, fill: "var(--chart-3)", strokeWidth: 0 }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function DetailedChart({ data }: { data: DetailPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <XAxis
          dataKey="label"
          fontSize={9}
          tickLine={false}
          axisLine={false}
          dy={8}
          stroke="currentColor"
          opacity={0.3}
          interval="preserveStartEnd"
          angle={-30}
          textAnchor="end"
          height={45}
        />
        <YAxis
          yAxisId="humor"
          domain={[-1, 1]}
          fontSize={10}
          tickLine={false}
          axisLine={false}
          ticks={[-1, -0.5, 0, 0.5, 1]}
          dx={-4}
          stroke="currentColor"
          opacity={0.3}
          orientation="left"
        />
        <YAxis
          yAxisId="energia"
          domain={[0, 1]}
          fontSize={10}
          tickLine={false}
          axisLine={false}
          ticks={[0, 0.25, 0.5, 0.75, 1]}
          dx={4}
          stroke="currentColor"
          opacity={0.3}
          orientation="right"
          tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0]?.payload as DetailPoint | undefined;
            if (!d) return null;
            return (
              <div className="rounded-md bg-popover border border-border/60 px-3 py-2 shadow-lg text-xs">
                <p className="font-medium mb-1">{label}</p>
                <p className="text-muted-foreground">
                  Humor: {d.mood ?? "?"} ({d.humor.toFixed(2)})
                </p>
                {d.energia != null && (
                  <p className="text-muted-foreground">
                    Energia: {(d.energia * 100).toFixed(0)}%
                  </p>
                )}
              </div>
            );
          }}
        />
        <ReferenceLine yAxisId="humor" y={0} stroke="currentColor" strokeOpacity={0.1} />
        <Line
          yAxisId="humor"
          type="monotone"
          dataKey="humor"
          stroke="var(--chart-1)"
          strokeWidth={2}
          dot={{ r: 3, fill: "var(--chart-1)", strokeWidth: 0 }}
          activeDot={{ r: 5, fill: "var(--chart-1)", strokeWidth: 0 }}
          connectNulls
        />
        <Line
          yAxisId="energia"
          type="monotone"
          dataKey="energia"
          stroke="var(--chart-3)"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          dot={{ r: 2, fill: "var(--chart-3)", strokeWidth: 0 }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
