import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// PUT update a specific template configuration
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { nome, cssStyles, isActive } = body;

    // Build update payload
    const updateData: any = {};
    if (nome !== undefined) updateData.nome = nome;
    if (cssStyles !== undefined) updateData.cssStyles = typeof cssStyles === "string" ? cssStyles : JSON.stringify(cssStyles);
    if (isActive !== undefined) updateData.isActive = isActive;

    // Transaction to update template, and if set active, disable all others
    const updatedTemplate = await prisma.$transaction(async (tx) => {
      const template = await tx.template.update({
        where: { id },
        data: updateData,
      });

      if (isActive) {
        // Disable all other templates
        await tx.template.updateMany({
          where: { id: { not: id } },
          data: { isActive: false },
        });
      }

      return template;
    });

    return NextResponse.json(updatedTemplate);
  } catch (error: any) {
    console.error("Erro ao atualizar template:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar a configuração do template." },
      { status: 500 }
    );
  }
}
