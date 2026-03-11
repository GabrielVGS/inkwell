import { searchSimilarEntries } from "@/lib/db/queries";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { query, limit } = await req.json();

  if (!query || typeof query !== "string") {
    return Response.json({ error: "Query is required" }, { status: 400 });
  }

  const entries = await searchSimilarEntries(session.user.id, query, limit ?? 5);
  return Response.json(entries);
}
