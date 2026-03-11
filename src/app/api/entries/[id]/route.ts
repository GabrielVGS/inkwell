import { getEntry, updateEntryAnalysis, deleteEntry } from "@/lib/db/queries";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const entry = await getEntry(id);
  if (!entry) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json(entry);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { analysis } = await req.json();
  await updateEntryAnalysis(id, analysis);
  return Response.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await deleteEntry(id);
  return Response.json({ ok: true });
}
