import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const { id } = await params;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const updateData: {
      nome?: string;
      cssStyles?: string;
      isActive?: boolean;
    } = {};

    if (body.nome !== undefined) {
      if (typeof body.nome !== "string" || !body.nome.trim()) {
        return NextResponse.json({ error: "Nome de template inválido." }, { status: 400 });
      }
      updateData.nome = body.nome.trim();
    }

    if (body.cssStyles !== undefined) {
      let styles: unknown;
      try {
        styles = typeof body.cssStyles === "string" ? JSON.parse(body.cssStyles) : body.cssStyles;
      } catch {
        return NextResponse.json({ error: "Configuração de estilos inválida." }, { status: 400 });
      }

      if (!styles || typeof styles !== "object" || Array.isArray(styles)) {
        return NextResponse.json({ error: "Configuração de estilos inválida." }, { status: 400 });
      }

      updateData.cssStyles = JSON.stringify(styles);
    }

    if (body.isActive !== undefined) {
      if (typeof body.isActive !== "boolean") {
        return NextResponse.json({ error: "O status do template deve ser booleano." }, { status: 400 });
      }
      updateData.isActive = body.isActive;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Nenhuma alteração informada." }, { status: 400 });
    }

    const updatedTemplate = await prisma.$transaction(async (tx) => {
      const currentTemplate = await tx.template.findUnique({
        where: { id },
        select: { isActive: true },
      });

      if (!currentTemplate) return null;

      if (updateData.isActive === false && currentTemplate.isActive) {
        const activeCount = await tx.template.count({ where: { isActive: true } });
        if (activeCount <= 1) {
          throw new Error("ACTIVE_TEMPLATE_REQUIRED");
        }
      }

      const template = await tx.template.update({
        where: { id },
        data: updateData,
      });

      if (updateData.isActive === true) {
        await tx.template.updateMany({
          where: { id: { not: id } },
          data: { isActive: false },
        });
      }

      return template;
    });

    if (!updatedTemplate) {
      return NextResponse.json({ error: "Template não encontrado." }, { status: 404 });
    }

    return NextResponse.json(updatedTemplate);
  } catch (error) {
    if (error instanceof Error && error.message === "ACTIVE_TEMPLATE_REQUIRED") {
      return NextResponse.json({ error: "Mantenha pelo menos um template ativo." }, { status: 409 });
    }

    console.error("Erro ao atualizar template:", error);
    return NextResponse.json({ error: "Erro ao atualizar a configuração do template." }, { status: 500 });
  }
}
