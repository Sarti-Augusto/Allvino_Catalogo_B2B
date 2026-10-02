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

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  try {
    const body = (await request.json()) as { sourceTemplateId?: unknown; nome?: unknown };
    if (typeof body.sourceTemplateId !== "string" || !body.sourceTemplateId) {
      return NextResponse.json({ error: "Template de origem inválido." }, { status: 400 });
    }

    const sourceTemplate = await prisma.template.findUnique({
      where: { id: body.sourceTemplateId },
    });
    if (!sourceTemplate) {
      return NextResponse.json({ error: "Template de origem não encontrado." }, { status: 404 });
    }

    const requestedName = typeof body.nome === "string" ? body.nome.trim() : "";
    const duplicatedTemplate = await prisma.template.create({
      data: {
        nome: requestedName || `${sourceTemplate.nome} - Cópia`,
        htmlContent: sourceTemplate.htmlContent,
        cssStyles: sourceTemplate.cssStyles,
        isActive: false,
      },
    });

    return NextResponse.json(duplicatedTemplate, { status: 201 });
  } catch (error) {
    console.error("Erro ao duplicar template:", error);
    return NextResponse.json({ error: "Erro ao duplicar o template." }, { status: 500 });
  }
}
