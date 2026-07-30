import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { isAdminSession, requireAdmin } from "@/lib/api-auth";
import { publicProductSelect } from "@/lib/product-select";
import {
  DEFAULT_PRODUCT_IMAGE,
  isSafeImageSource,
  optionalText,
  parseBoolean,
  parseNonNegativeInteger,
  parseNonNegativeNumber,
  requiredText,
} from "@/lib/validation";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (isAdminSession(session)) {
      const products = await prisma.product.findMany({
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(products);
    }

    const products = await prisma.product.findMany({
      where: { status: true },
      select: publicProductSelect,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Erro ao buscar vinhos:", error);
    return NextResponse.json({ error: "Erro ao buscar os vinhos." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const name = requiredText(body.name);
    const vinicola = requiredText(body.vinicola);
    const uva = requiredText(body.uva);
    const safra = requiredText(body.safra);
    const paisOrigem = requiredText(body.paisOrigem);
    const regiao = requiredText(body.regiao);
    const teorAlcoolico = parseNonNegativeNumber(body.teorAlcoolico);
    const precoOriginal = parseNonNegativeNumber(body.precoOriginal);
    const precoPromocional =
      body.precoPromocional === null || body.precoPromocional === "" || body.precoPromocional === undefined
        ? null
        : parseNonNegativeNumber(body.precoPromocional);
    const estoque = body.estoque === undefined || body.estoque === "" ? 0 : parseNonNegativeInteger(body.estoque);
    const status = body.status === undefined ? true : parseBoolean(body.status);
    const imagemUrl = body.imagemUrl ? String(body.imagemUrl).trim() : DEFAULT_PRODUCT_IMAGE;
    const categoria = body.categoria ? requiredText(body.categoria) : "Tinto";
    const notasDegustacao = body.notasDegustacao === undefined ? "" : optionalText(body.notasDegustacao);

    if (
      !name ||
      !vinicola ||
      !uva ||
      !safra ||
      !paisOrigem ||
      !regiao ||
      teorAlcoolico === null ||
      teorAlcoolico > 100 ||
      precoOriginal === null ||
      precoPromocional === undefined ||
      estoque === null ||
      status === null ||
      !categoria ||
      notasDegustacao === null ||
      !isSafeImageSource(imagemUrl)
    ) {
      return NextResponse.json({ error: "Dados inválidos para cadastro do vinho." }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
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
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    return NextResponse.json({ error: "Erro ao criar o vinho no banco de dados." }, { status: 500 });
  }
}
