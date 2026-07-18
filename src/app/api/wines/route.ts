import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar os vinhos." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: "Não autorizado." },
      { status: 401 }
    );
  }

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
      estoque,
    } = body;

    if (!name || !vinicola || !uva || !teorAlcoolico || !safra || !paisOrigem || !regiao || !precoOriginal) {
      return NextResponse.json(
        { error: "Preencha todos os campos obrigatórios." },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name,
        vinicola,
        uva,
        teorAlcoolico: parseFloat(teorAlcoolico),
        safra,
        paisOrigem,
        regiao,
        notasDegustacao: notasDegustacao || "",
        precoOriginal: parseFloat(precoOriginal),
        precoPromocional: precoPromocional ? parseFloat(precoPromocional) : null,
        status: status !== undefined ? Boolean(status) : true,
        imagemUrl: imagemUrl || "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=300&auto=format&fit=crop",
        estoque: parseInt(estoque) || 0,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao criar o vinho." },
      { status: 500 }
    );
  }
}
