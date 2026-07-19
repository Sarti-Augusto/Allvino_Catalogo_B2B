import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

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

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existingProduct.name,
        vinicola: vinicola !== undefined ? vinicola : existingProduct.vinicola,
        uva: uva !== undefined ? uva : existingProduct.uva,
        teorAlcoolico: teorAlcoolico !== undefined ? parseFloat(teorAlcoolico) : existingProduct.teorAlcoolico,
        safra: safra !== undefined ? safra : existingProduct.safra,
        paisOrigem: paisOrigem !== undefined ? paisOrigem : existingProduct.paisOrigem,
        regiao: regiao !== undefined ? regiao : existingProduct.regiao,
        notasDegustacao: notasDegustacao !== undefined ? notasDegustacao : existingProduct.notasDegustacao,
        precoOriginal: precoOriginal !== undefined ? parseFloat(precoOriginal) : existingProduct.precoOriginal,
        precoPromocional: precoPromocional !== undefined ? (precoPromocional ? parseFloat(precoPromocional) : null) : existingProduct.precoPromocional,
        status: status !== undefined ? Boolean(status) : existingProduct.status,
        imagemUrl: imagemUrl !== undefined ? imagemUrl : existingProduct.imagemUrl,
        categoria: categoria !== undefined ? categoria : (existingProduct as any).categoria,
        estoque: estoque !== undefined ? parseInt(estoque) : existingProduct.estoque,
      },
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao atualizar o vinho." },
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
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao excluir o vinho." },
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
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar o vinho." },
      { status: 500 }
    );
  }
}

