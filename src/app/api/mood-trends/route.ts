import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { getMoodTrend } from "@/lib/db/queries";

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const days = Math.min(90, Math.max(1, parseInt(searchParams.get("days") ?? "14", 10) || 14));

  const trend = await getMoodTrend(session.user.id, days);
  return Response.json(trend);
}
