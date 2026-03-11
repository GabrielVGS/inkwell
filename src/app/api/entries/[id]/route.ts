import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { getEntry, updateEntryAnalysis, deleteEntry } from "@/lib/db/queries";
import { entryUpdateSchema } from "@/lib/validations";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const entry = await getEntry(id, session.user.id);
  if (!entry) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json(entry);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const parsed = entryUpdateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { analysis } = parsed.data;
  const count = await updateEntryAnalysis(id, session.user.id, analysis);
  if (count === 0) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const count = await deleteEntry(id, session.user.id);
  if (count === 0) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
}
