import {
  pgTable,
  uuid,
  text,
  real,
  timestamp,
  jsonb,
  index,
  vector,
} from "drizzle-orm/pg-core";

export const entries = pgTable(
  "entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    content: text("content").notNull(),
    mood: text("mood"),
    moodScore: real("mood_score"),
    energyLevel: real("energy_level"),
    tags: jsonb("tags").$type<string[]>().default([]),
    embedding: vector("embedding", { dimensions: 768 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("entries_created_at_idx").on(table.createdAt),
  ]
);

export const reflections = pgTable(
  "reflections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    entryId: uuid("entry_id")
      .notNull()
      .references(() => entries.id, { onDelete: "cascade" }),
    role: text("role").$type<"user" | "assistant">().notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("reflections_entry_id_idx").on(table.entryId),
  ]
);

export const weeklySummaries = pgTable(
  "weekly_summaries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
    periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
    content: text("content").notNull(),
    themes: jsonb("themes").$type<string[]>().default([]),
    moodTrend: jsonb("mood_trend").$type<{
      avgScore: number;
      trend: "improving" | "declining" | "stable";
    }>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  }
);
