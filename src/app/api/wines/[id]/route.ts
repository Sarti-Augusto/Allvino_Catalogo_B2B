import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const parseNumber = (val: any): number => {
  if (val === null || val === undefined || val === "") return NaN;
  if (typeof val === "number") return val;
  const sanitized = String(val).replace(",", ".").trim();
  return parseFloat(sanitized);
};

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: "Não autorizado." },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const {
      name,
      vinicola,
      uva,
      teorAlcoolico,
      safra,
      paisOrigem,
      regiao,
      notasDegustacao,
      precoOriginal,
      precoPromocional,
      status,
      imagemUrl,
      categoria,
      estoque,
    } = body;

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Vinho não encontrado." },
        { status: 404 }
      );
    }

    const parsedTeor = teorAlcoolico !== undefined ? parseNumber(teorAlcoolico) : existingProduct.teorAlcoolico;
    const parsedPrecoOrig = precoOriginal !== undefined ? parseNumber(precoOriginal) : existingProduct.precoOriginal;
    const parsedPrecoPromo = precoPromocional !== undefined
      ? (precoPromocional !== null && precoPromocional !== "" ? parseNumber(precoPromocional) : null)
      : existingProduct.precoPromocional;
    const parsedEstoque = estoque !== undefined ? parseInt(String(estoque).trim(), 10) : existingProduct.estoque;

    if (
      (teorAlcoolico !== undefined && isNaN(parsedTeor)) ||
      (precoOriginal !== undefined && isNaN(parsedPrecoOrig)) ||
      (parsedPrecoPromo !== null && isNaN(parsedPrecoPromo))
    ) {
      return NextResponse.json(
        { error: "Valores numéricos inválidos para preço ou teor alcoólico." },
        { status: 400 }
      );
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: name !== undefined ? String(name).trim() : existingProduct.name,
        vinicola: vinicola !== undefined ? String(vinicola).trim() : existingProduct.vinicola,
        uva: uva !== undefined ? String(uva).trim() : existingProduct.uva,
        teorAlcoolico: parsedTeor,
        safra: safra !== undefined ? String(safra).trim() : existingProduct.safra,
        paisOrigem: paisOrigem !== undefined ? String(paisOrigem).trim() : existingProduct.paisOrigem,
        regiao: regiao !== undefined ? String(regiao).trim() : existingProduct.regiao,
        notasDegustacao: notasDegustacao !== undefined ? String(notasDegustacao).trim() : existingProduct.notasDegustacao,
        precoOriginal: parsedPrecoOrig,
        precoPromocional: parsedPrecoPromo,
        status: status !== undefined ? Boolean(status) : existingProduct.status,
        imagemUrl: imagemUrl !== undefined ? imagemUrl : existingProduct.imagemUrl,
        categoria: categoria !== undefined ? String(categoria).trim() : existingProduct.categoria,
        estoque: isNaN(parsedEstoque) ? existingProduct.estoque : parsedEstoque,
      },
    });

    return NextResponse.json(updatedProduct);
  } catch (error: any) {
    console.error("Erro ao atualizar produto:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao atualizar o vinho." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: "Não autorizado." },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Vinho não encontrado." },
        { status: 404 }
      );
    }

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Vinho excluído com sucesso." });
  } catch (error: any) {
    console.error("Erro ao excluir produto:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao excluir o vinho." },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Vinho não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Erro ao buscar o vinho." },
      { status: 500 }
    );
  }
}
