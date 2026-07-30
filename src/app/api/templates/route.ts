import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  try {
    const templates = await prisma.template.findMany({
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(templates);
  } catch (error) {
    console.error("Erro ao carregar templates:", error);
    return NextResponse.json({ error: "Erro ao carregar os templates do banco de dados." }, { status: 500 });
  }
}
