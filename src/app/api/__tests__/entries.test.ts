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

const mockSaveEntry = vi.fn();
const mockGetEntries = vi.fn();
vi.mock("@/lib/db/queries", () => ({
  saveEntry: (...args: unknown[]) => mockSaveEntry(...args),
  getEntries: (...args: unknown[]) => mockGetEntries(...args),
}));

import { GET, POST } from "../entries/route";

describe("GET /api/entries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without session", async () => {
    mockGetSession.mockResolvedValue(null);
    const req = new Request("http://localhost/api/entries");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns entries for authenticated user", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "user-1" } });
    mockGetEntries.mockResolvedValue({ entries: [], nextCursor: null });
    const req = new Request("http://localhost/api/entries");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.entries).toEqual([]);
  });
});

describe("POST /api/entries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without session", async () => {
    mockGetSession.mockResolvedValue(null);
    const req = new Request("http://localhost/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "test" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 with empty content", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "user-1" } });
    const req = new Request("http://localhost/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 with content exceeding max length", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "user-1" } });
    const req = new Request("http://localhost/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "a".repeat(10001) }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 201 with valid input", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "user-1" } });
    const fakeEntry = { id: "e-1", content: "Hoje foi bom", createdAt: new Date().toISOString() };
    mockSaveEntry.mockResolvedValue(fakeEntry);
    const req = new Request("http://localhost/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "Hoje foi bom" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe("e-1");
  });
});
