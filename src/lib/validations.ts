import { z } from "zod";

export const moodAnalysisSchema = z.object({
  mood: z.string(),
  moodScore: z.number().min(-1).max(1),
  energyLevel: z.number().min(0).max(1),
  tags: z.array(z.string()),
});

export const entryCreateSchema = z.object({
  content: z.string().min(1).max(10000),
  analysis: moodAnalysisSchema.optional(),
});

export const entryUpdateSchema = z.object({
  analysis: moodAnalysisSchema,
});

export const analyzeSchema = z.object({
  content: z.string().min(1).max(10000),
});

export const reflectSchema = z.object({
  currentEntry: z.string().min(1),
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })).optional(),
});

export const monthlySummarySchema = z.object({
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
});

export const reflectionCreateSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
});
