import { searchSimilarEntries } from "@/lib/db/queries";

export async function POST(req: Request) {
  const { query, limit } = await req.json();

  if (!query || typeof query !== "string") {
    return Response.json({ error: "Query is required" }, { status: 400 });
  }

  const entries = await searchSimilarEntries(query, limit ?? 5);
  return Response.json(entries);
}
