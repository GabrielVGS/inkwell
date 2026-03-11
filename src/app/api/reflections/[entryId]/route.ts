import { getReflections, addReflection, getEntry } from "@/lib/db/queries";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ entryId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { entryId } = await params;
  const entry = await getEntry(entryId, session.user.id);
  if (!entry) return Response.json({ error: "Not found" }, { status: 404 });
  const reflections = await getReflections(entryId);
  return Response.json(reflections);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ entryId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { entryId } = await params;
  const entry = await getEntry(entryId, session.user.id);
  if (!entry) return Response.json({ error: "Not found" }, { status: 404 });

  const { role, content } = await req.json();

  if (!role || !content) {
    return Response.json({ error: "role and content are required" }, { status: 400 });
  }

  const reflection = await addReflection(entryId, role, content);
  return Response.json(reflection, { status: 201 });
}
