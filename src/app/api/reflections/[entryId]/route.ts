import { getReflections, addReflection } from "@/lib/db/queries";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ entryId: string }> }
) {
  const { entryId } = await params;
  const reflections = await getReflections(entryId);
  return Response.json(reflections);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ entryId: string }> }
) {
  const { entryId } = await params;
  const { role, content } = await req.json();

  if (!role || !content) {
    return Response.json({ error: "role and content are required" }, { status: 400 });
  }

  const reflection = await addReflection(entryId, role, content);
  return Response.json(reflection, { status: 201 });
}
