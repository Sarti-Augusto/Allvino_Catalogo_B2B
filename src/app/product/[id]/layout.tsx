import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const product = await prisma.product.findFirst({
      where: { id, status: true },
      select: {
        name: true,
        vinicola: true,
        uva: true,
        safra: true,
        paisOrigem: true,
        regiao: true,
        notasDegustacao: true,
        imagemUrl: true,
      },
    });

    if (!product) {
      return {
        title: "Vinho | Catálogo B2B Allvino",
      };
    }

    const title = `${product.name} (${product.safra}) | Catálogo B2B Allvino`;
    const description =
      product.notasDegustacao ||
      `${product.vinicola} · ${product.uva} · ${product.paisOrigem} (${product.regiao}) — Safra ${product.safra}.`;

    const hasHttpsImage = product.imagemUrl.startsWith("https://");

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
        ...(hasHttpsImage ? { images: [{ url: product.imagemUrl, alt: product.name }] } : {}),
      },
      twitter: {
        card: hasHttpsImage ? "summary_large_image" : "summary",
        title,
        description,
      },
    };
  } catch {
    return {
      title: "Ficha Técnica | Catálogo B2B Allvino",
    };
  }
}

export default function ProductLayout({ children }: LayoutProps) {
  return <>{children}</>;
}
