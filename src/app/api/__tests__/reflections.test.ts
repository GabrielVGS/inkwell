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

const mockGetEntry = vi.fn();
const mockGetReflections = vi.fn();
const mockAddReflection = vi.fn();
vi.mock("@/lib/db/queries", () => ({
  getEntry: (...args: unknown[]) => mockGetEntry(...args),
  getReflections: (...args: unknown[]) => mockGetReflections(...args),
  addReflection: (...args: unknown[]) => mockAddReflection(...args),
}));

import { GET } from "../reflections/[entryId]/route";

describe("GET /api/reflections/[entryId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without session", async () => {
    mockGetSession.mockResolvedValue(null);
    const req = new Request("http://localhost/api/reflections/entry-1");
    const res = await GET(req, { params: Promise.resolve({ entryId: "entry-1" }) });
    expect(res.status).toBe(401);
  });

  it("returns 404 when entry does not belong to user", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "user-1" } });
    mockGetEntry.mockResolvedValue(undefined);
    const req = new Request("http://localhost/api/reflections/entry-1");
    const res = await GET(req, { params: Promise.resolve({ entryId: "entry-1" }) });
    expect(res.status).toBe(404);
  });

  it("returns 200 for owned entry", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "user-1" } });
    mockGetEntry.mockResolvedValue({ id: "entry-1", content: "test" });
    mockGetReflections.mockResolvedValue([]);
    const req = new Request("http://localhost/api/reflections/entry-1");
    const res = await GET(req, { params: Promise.resolve({ entryId: "entry-1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([]);
  });
});
