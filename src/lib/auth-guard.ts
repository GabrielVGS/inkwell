import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getSessionOrThrow() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return session;
}

export async function getSessionUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session?.user ?? null;
}
