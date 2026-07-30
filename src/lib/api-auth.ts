import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";

export function isAdminSession(session: Session | null): boolean {
  return (session?.user as { role?: string } | undefined)?.role === "ADMIN";
}

export async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return {
      session: null,
      response: NextResponse.json({ error: "Não autorizado." }, { status: 401 }),
    };
  }

  if (!isAdminSession(session)) {
    return {
      session: null,
      response: NextResponse.json({ error: "Acesso restrito ao administrador." }, { status: 403 }),
    };
  }

  return { session, response: null };
}
