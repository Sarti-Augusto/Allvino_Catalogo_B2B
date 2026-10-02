import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

type RouteContext = { params: Promise<{ id: string }> };

const numericRanges: Record<string, [number, number]> = {
  coverLogoHeight: [20, 800],
  coverLogoAngle: [-180, 180],
  coverLogoXOffset: [-450, 450],
  coverLogoYOffset: [-450, 450],
  coverTitleFontSize: [6, 120],
  coverTitleAngle: [-180, 180],
  coverTitleXOffset: [-450, 450],
  coverTitleYOffset: [-450, 450],
  coverSubtitleFontSize: [6, 80],
  coverSubtitleAngle: [-180, 180],
  coverSubtitleXOffset: [-450, 450],
  coverSubtitleYOffset: [-450, 450],
  coverFooterFontSize: [6, 60],
  coverFooterXOffset: [-450, 450],
  coverFooterYOffset: [-450, 450],
  coverVerticalOffset: [-450, 450],
  productImgHeight: [80, 800],
  productImgXOffset: [-450, 450],
  productImgYOffset: [-450, 450],
  productImgAngle: [-180, 180],
  productNameFontSize: [6, 120],
  productNameXOffset: [-450, 450],
  productNameYOffset: [-450, 450],
  productSpecsFontSize: [6, 60],
  productOriginYOffset: [-450, 450],
  productPagePadding: [0, 120],
  productTextMaxWidth: [120, 760],
  productPriceAngle: [-180, 180],
  productPriceXOffset: [-350, 350],
  productPriceYOffset: [-450, 450],
  productPriceLabelFontSize: [6, 80],
  productPriceInfoFontSize: [6, 80],
  productPriceValueFontSize: [6, 120],
  productDescAngle: [-180, 180],
  productDescFontSize: [6, 80],
  productDescXOffset: [-450, 450],
  productDescYOffset: [-150, 150],
};

const booleanStyleKeys = [
  "showCoverLogo",
  "showCoverDivider",
  "showCoverTitle",
  "showCoverSubtitle",
  "showCoverFooter",
  "showProductName",
  "showProductOrigin",
  "showProductDivider",
  "showProductBottle",
  "showProductSpecs",
  "showProductDescription",
  "showProductPrice",
  "showProductFooter",
];

function validateTemplateStyles(styles: Record<string, unknown>): string | null {
  for (const [key, [min, max]] of Object.entries(numericRanges)) {
    const value = styles[key];
    if (value !== undefined && (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max)) {
      return `Valor inválido para ${key}. Use um número entre ${min} e ${max}.`;
    }
  }

  for (const key of booleanStyleKeys) {
    if (styles[key] !== undefined && typeof styles[key] !== "boolean") {
      return `Valor inválido para ${key}.`;
    }
  }

  const allowedEnums: Record<string, string[]> = {
    coverLogoVariant: ["auto", "black", "white"],
    productLayoutPreset: ["classic", "side-right", "side-left", "price-top"],
    productDescAlign: ["left", "center", "right", "justify"],
    productPriceSide: ["left", "center", "right"],
    fontFamily: ["Playfair Display", "Inter", "Cinzel"],
  };
  for (const [key, allowedValues] of Object.entries(allowedEnums)) {
    if (styles[key] !== undefined && (typeof styles[key] !== "string" || !allowedValues.includes(styles[key]))) {
      return `Opção inválida para ${key}.`;
    }
  }

  for (const key of ["backgroundImageUrl", "coverImageUrl"]) {
    const value = styles[key];
    if (
      value !== undefined &&
      (typeof value !== "string" ||
        (value !== "" && !value.startsWith("https://") && !/^data:image\/(?:png|jpe?g|webp);base64,/i.test(value)))
    ) {
      return `Imagem inválida para ${key}. Use HTTPS, PNG, JPEG ou WebP.`;
    }
  }

  return null;
}

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

      const validationError = validateTemplateStyles(styles as Record<string, unknown>);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
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
