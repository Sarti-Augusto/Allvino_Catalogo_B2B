import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export function isAdminUser(user: User | null | undefined): boolean {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return Boolean(
    adminEmail &&
      user?.email &&
      user.email.trim().toLowerCase() === adminEmail,
  );
}

export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  return { user: error ? null : data.user };
}

export async function requireAdmin() {
  const { user } = await getAuthenticatedUser();

  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: "Não autorizado." }, { status: 401 }),
    };
  }

  if (!isAdminUser(user)) {
    return {
      user: null,
      response: NextResponse.json({ error: "Acesso restrito ao administrador." }, { status: 403 }),
    };
  }

  return { user, response: null };
}
