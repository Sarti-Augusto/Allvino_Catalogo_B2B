import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(products);
  } catch (error: any) {
    console.error("Erro ao buscar vinhos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar os vinhos." },
      { status: 500 }
    );
  }
}

const parseNumber = (val: any): number => {
  if (val === null || val === undefined || val === "") return NaN;
  if (typeof val === "number") return val;
  const sanitized = String(val).replace(",", ".").trim();
  return parseFloat(sanitized);
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: "Não autorizado. Faça login novamente." },
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
      categoria,
      estoque,
    } = body;

    if (
      !name ||
      !vinicola ||
      !uva ||
      teorAlcoolico === undefined ||
      teorAlcoolico === "" ||
      !safra ||
      !paisOrigem ||
      !regiao ||
      precoOriginal === undefined ||
      precoOriginal === ""
    ) {
      return NextResponse.json(
        { error: "Preencha todos os campos obrigatórios." },
        { status: 400 }
      );
    }

    const parsedTeor = parseNumber(teorAlcoolico);
    const parsedPrecoOrig = parseNumber(precoOriginal);
    const parsedPrecoPromo =
      precoPromocional !== null &&
      precoPromocional !== undefined &&
      precoPromocional !== ""
        ? parseNumber(precoPromocional)
        : null;
    const parsedEstoque =
      estoque !== undefined && estoque !== ""
        ? parseInt(String(estoque).trim(), 10)
        : 0;

    if (
      isNaN(parsedTeor) ||
      isNaN(parsedPrecoOrig) ||
      (parsedPrecoPromo !== null && isNaN(parsedPrecoPromo))
    ) {
      return NextResponse.json(
        { error: "Valores numéricos inválidos para preço ou teor alcoólico." },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name: String(name).trim(),
        vinicola: String(vinicola).trim(),
        uva: String(uva).trim(),
        teorAlcoolico: parsedTeor,
        safra: String(safra).trim(),
        paisOrigem: String(paisOrigem).trim(),
        regiao: String(regiao).trim(),
        notasDegustacao: notasDegustacao ? String(notasDegustacao).trim() : "",
        precoOriginal: parsedPrecoOrig,
        precoPromocional: parsedPrecoPromo,
        status: status !== undefined ? Boolean(status) : true,
        imagemUrl:
          imagemUrl ||
          "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=300&auto=format&fit=crop",
        categoria: categoria ? String(categoria).trim() : "Tinto",
        estoque: isNaN(parsedEstoque) ? 0 : parsedEstoque,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar produto:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao criar o vinho no banco de dados." },
      { status: 500 }
    );
  }
}
