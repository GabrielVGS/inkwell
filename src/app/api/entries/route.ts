import { getEntries, saveEntry } from "@/lib/db/queries";

export async function GET() {
  const entries = await getEntries();
  return Response.json(entries);
}

export async function POST(req: Request) {
  const { content, analysis } = await req.json();

  if (!content || typeof content !== "string") {
    return Response.json({ error: "Content is required" }, { status: 400 });
  }

  const entry = await saveEntry(content, analysis);
  return Response.json(entry, { status: 201 });
}
