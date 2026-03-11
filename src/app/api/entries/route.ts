import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { getEntries, saveEntry } from "@/lib/db/queries";
import { entryCreateSchema } from "@/lib/validations";

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "true";
  const cursor = searchParams.get("cursor") ?? undefined;

  const result = await getEntries(session.user.id, { all, cursor });
  return Response.json(result);
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = entryCreateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { content, analysis } = parsed.data;
  const entry = await saveEntry(session.user.id, content, analysis);
  return Response.json(entry, { status: 201 });
}
