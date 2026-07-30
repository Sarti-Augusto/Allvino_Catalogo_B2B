import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { isAdminSession, requireAdmin } from "@/lib/api-auth";
import { publicProductSelect } from "@/lib/product-select";
import {
  isSafeImageSource,
  optionalText,
  parseBoolean,
  parseNonNegativeInteger,
  parseNonNegativeNumber,
  requiredText,
} from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const { id } = await params;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const existingProduct = await prisma.product.findUnique({ where: { id } });

    if (!existingProduct) {
      return NextResponse.json({ error: "Vinho não encontrado." }, { status: 404 });
    }

    const textFields = ["name", "vinicola", "uva", "safra", "paisOrigem", "regiao", "categoria"] as const;
    for (const field of textFields) {
      if (body[field] !== undefined && !requiredText(body[field])) {
        return NextResponse.json({ error: `Campo inválido: ${field}.` }, { status: 400 });
      }
    }

    if (body.notasDegustacao !== undefined && optionalText(body.notasDegustacao) === null) {
      return NextResponse.json({ error: "Campo inválido: notasDegustacao." }, { status: 400 });
    }

    const teorAlcoolico =
      body.teorAlcoolico === undefined
        ? existingProduct.teorAlcoolico
        : parseNonNegativeNumber(body.teorAlcoolico);
    const precoOriginal =
      body.precoOriginal === undefined ? existingProduct.precoOriginal : parseNonNegativeNumber(body.precoOriginal);
    const precoPromocional =
      body.precoPromocional === undefined
        ? existingProduct.precoPromocional
        : body.precoPromocional === null || body.precoPromocional === ""
          ? null
          : parseNonNegativeNumber(body.precoPromocional);
    const estoque =
      body.estoque === undefined ? existingProduct.estoque : parseNonNegativeInteger(body.estoque);
    const status = body.status === undefined ? existingProduct.status : parseBoolean(body.status);
    const imagemUrl = body.imagemUrl === undefined ? existingProduct.imagemUrl : body.imagemUrl;

    if (
      teorAlcoolico === null ||
      teorAlcoolico > 100 ||
      precoOriginal === null ||
      precoPromocional === undefined ||
      estoque === null ||
      status === null ||
      typeof imagemUrl !== "string" ||
      !isSafeImageSource(imagemUrl)
    ) {
      return NextResponse.json({ error: "Valores inválidos para atualização do vinho." }, { status: 400 });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: body.name === undefined ? existingProduct.name : requiredText(body.name)!,
        vinicola: body.vinicola === undefined ? existingProduct.vinicola : requiredText(body.vinicola)!,
        uva: body.uva === undefined ? existingProduct.uva : requiredText(body.uva)!,
        teorAlcoolico,
        safra: body.safra === undefined ? existingProduct.safra : requiredText(body.safra)!,
        paisOrigem: body.paisOrigem === undefined ? existingProduct.paisOrigem : requiredText(body.paisOrigem)!,
        regiao: body.regiao === undefined ? existingProduct.regiao : requiredText(body.regiao)!,
        notasDegustacao:
          body.notasDegustacao === undefined ? existingProduct.notasDegustacao : optionalText(body.notasDegustacao)!,
        precoOriginal,
        precoPromocional,
        status,
        imagemUrl,
        categoria: body.categoria === undefined ? existingProduct.categoria : requiredText(body.categoria)!,
        estoque,
      },
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    return NextResponse.json({ error: "Erro ao atualizar o vinho." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const { id } = await params;

  try {
    const existingProduct = await prisma.product.findUnique({ where: { id } });

    if (!existingProduct) {
      return NextResponse.json({ error: "Vinho não encontrado." }, { status: 404 });
    }

    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ message: "Vinho excluído com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir produto:", error);
    return NextResponse.json({ error: "Erro ao excluir o vinho." }, { status: 500 });
  }
}

export async function GET(request: Request, { params }: RouteContext) {
  const { id } = await params;

  try {
    const session = await getServerSession(authOptions);
    const product = isAdminSession(session)
      ? await prisma.product.findUnique({ where: { id } })
      : await prisma.product.findFirst({ where: { id, status: true }, select: publicProductSelect });

    if (!product) {
      return NextResponse.json({ error: "Vinho não encontrado." }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Erro ao buscar produto:", error);
    return NextResponse.json({ error: "Erro ao buscar o vinho." }, { status: 500 });
  }
}
