import { describe, it, expect } from "vitest";

import { calculateTrend } from "../db/queries";

describe("calculateTrend", () => {
  it("returns stable for empty array", () => {
    const result = calculateTrend([]);
    expect(result.trend).toBe("stable");
    expect(result.avgScore).toBe(0);
  });

  it("returns stable for single score", () => {
    const result = calculateTrend([0.5]);
    expect(result.trend).toBe("stable");
    expect(result.avgScore).toBe(0.5);
  });

  it("returns improving when second half is significantly higher", () => {
    const result = calculateTrend([-0.5, -0.3, 0.2, 0.5]);
    expect(result.trend).toBe("improving");
  });

  it("returns declining when second half is significantly lower", () => {
    const result = calculateTrend([0.5, 0.3, -0.2, -0.5]);
    expect(result.trend).toBe("declining");
  });

  it("returns stable within threshold", () => {
    const result = calculateTrend([0.1, 0.15, 0.12, 0.18]);
    expect(result.trend).toBe("stable");
  });

  it("correctly calculates average score", () => {
    const result = calculateTrend([0.2, 0.4, 0.6, 0.8]);
    expect(result.avgScore).toBe(0.5);
  });

  it("returns stable for all-same scores", () => {
    const result = calculateTrend([0.3, 0.3, 0.3, 0.3]);
    expect(result.trend).toBe("stable");
    expect(result.avgScore).toBe(0.3);
  });
});
