import { searchSimilarEntries } from "@/lib/db/queries";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { query, limit } = body;

  if (!query || typeof query !== "string") {
    return Response.json({ error: "Query is required" }, { status: 400 });
  }

  const clampedLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 5));
  const entries = await searchSimilarEntries(session.user.id, query, clampedLimit);
  return Response.json(entries);
}
