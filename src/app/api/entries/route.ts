import { getEntries, saveEntry } from "@/lib/db/queries";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const entries = await getEntries(session.user.id);
  return Response.json(entries);
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { content, analysis } = await req.json();

  if (!content || typeof content !== "string") {
    return Response.json({ error: "Content is required" }, { status: 400 });
  }

  const entry = await saveEntry(session.user.id, content, analysis);
  return Response.json(entry, { status: 201 });
}
