import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetSession = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
    },
  },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

const mockGetEntriesForMonth = vi.fn();
vi.mock("@/lib/db/queries", () => ({
  getEntriesForMonth: (...args: unknown[]) => mockGetEntriesForMonth(...args),
}));

vi.mock("@/lib/ai/graphs/monthly-summary-graph", () => ({
  streamMonthlySummary: vi.fn(),
}));

vi.mock("@/lib/utils/sse", () => ({
  createSSEResponse: vi.fn().mockReturnValue(new Response("ok", { status: 200 })),
}));

import { POST } from "../monthly-summary/route";

describe("POST /api/monthly-summary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without session", async () => {
    mockGetSession.mockResolvedValue(null);
    const req = new Request("http://localhost/api/monthly-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year: 2026, month: 3 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 with invalid month (13)", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "user-1" } });
    const req = new Request("http://localhost/api/monthly-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year: 2026, month: 13 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 with missing fields", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "user-1" } });
    const req = new Request("http://localhost/api/monthly-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year: 2026 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when no entries for the month", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "user-1" } });
    mockGetEntriesForMonth.mockResolvedValue([]);
    const req = new Request("http://localhost/api/monthly-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year: 2026, month: 3 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
