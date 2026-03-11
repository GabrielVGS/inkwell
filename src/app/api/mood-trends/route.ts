import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getMoodTrend } from "@/lib/db/queries";

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") ?? "14", 10);

  const trend = await getMoodTrend(session.user.id, days);
  return Response.json(trend);
}
