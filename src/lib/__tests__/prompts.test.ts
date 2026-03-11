import { describe, it, expect } from "vitest";
import { buildAdaptiveSystemPrompt, buildReflectionPrompt, REFLECTION_SYSTEM_PROMPT } from "../prompts";

describe("buildAdaptiveSystemPrompt", () => {
  it("returns base prompt when no mood context", () => {
    const result = buildAdaptiveSystemPrompt();
    expect(result).toBe(REFLECTION_SYSTEM_PROMPT);
  });

  it("appends declining tone for low avgScore", () => {
    const result = buildAdaptiveSystemPrompt({ avgScore: -0.5, trend: "declining" });
    expect(result).toContain(REFLECTION_SYSTEM_PROMPT);
    expect(result).toContain("CONTEXTO EMOCIONAL");
    expect(result).toContain("acolhimento");
  });

  it("appends positive tone for high avgScore and improving trend", () => {
    const result = buildAdaptiveSystemPrompt({ avgScore: 0.6, trend: "improving" });
    expect(result).toContain("momento positivo");
  });

  it("appends stable tone for stable trend", () => {
    const result = buildAdaptiveSystemPrompt({ avgScore: 0.1, trend: "stable" });
    expect(result).toContain("estável");
  });
});

describe("buildReflectionPrompt", () => {
  it("formats entry without previous entries", () => {
    const result = buildReflectionPrompt("Hoje foi um bom dia", []);
    expect(result).toContain("Hoje foi um bom dia");
  });

  it("includes previous entries context", () => {
    const result = buildReflectionPrompt("Hoje foi um bom dia", [
      { content: "Ontem chorei", createdAt: "2026-03-10T10:00:00Z", mood: "triste" },
    ]);
    expect(result).toContain("Ontem chorei");
    expect(result).toContain("triste");
  });
});
