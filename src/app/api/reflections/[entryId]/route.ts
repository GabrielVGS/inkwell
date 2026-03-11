import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { getReflections, addReflection, getEntry } from "@/lib/db/queries";
import { reflectionCreateSchema } from "@/lib/validations";

export async function GET(_req: Request, { params }: { params: Promise<{ entryId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { entryId } = await params;
  const entry = await getEntry(entryId, session.user.id);
  if (!entry) return Response.json({ error: "Not found" }, { status: 404 });
  const reflections = await getReflections(entryId);
  return Response.json(reflections);
}

export async function POST(req: Request, { params }: { params: Promise<{ entryId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { entryId } = await params;
  const entry = await getEntry(entryId, session.user.id);
  if (!entry) return Response.json({ error: "Not found" }, { status: 404 });

  const parsed = reflectionCreateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { role, content } = parsed.data;
  const reflection = await addReflection(entryId, role, content);
  return Response.json(reflection, { status: 201 });
}
