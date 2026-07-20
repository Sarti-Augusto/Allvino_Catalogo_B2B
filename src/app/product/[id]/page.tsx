"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getCountryFlagUrl } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  vinicola: string;
  uva: string;
  teorAlcoolico: number;
  safra: string;
  paisOrigem: string;
  regiao: string;
  notasDegustacao: string;
  precoOriginal: number;
  precoPromocional: number | null;
  status: boolean;
  imagemUrl: string;
  categoria: string;
  estoque: number;
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/wines/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProduct(data);
      } else {
        // If not found or error, return to homepage
        router.push("/");
      }
    } catch (err) {
      console.error("Erro ao buscar vinho:", err);
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-allvino-background text-allvino-text flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-allvino-primary border-t-allvino-secondary rounded-full animate-spin"></div>
        <p className="text-sm font-light tracking-wide text-allvino-on-surface-variant">Carregando ficha técnica...</p>
      </div>
    );
  }

  if (!product) return null;

  const shareText = `Olhe este vinho incrível do catálogo Allvino: *${product.name}* da vinícola *${product.vinicola}*. Veja a ficha técnica completa aqui: `;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + window.location.href)}`;

  return (
    <div className="min-h-screen bg-allvino-background text-allvino-text font-sans pb-16">
      
      {/* Header Bar */}
      <nav className="border-b border-allvino-outline-variant/30 bg-allvino-surface-container-low/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img
              src="/logo.png"
              alt="Allvino Logo"
              className="h-14 w-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </Link>
          <Link
            href="/"
            className="text-xs text-allvino-on-surface-variant hover:text-allvino-primary transition font-semibold"
          >
            ← Voltar ao Catálogo
          </Link>
        </div>
      </nav>

      {/* Main product wrapper */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="glass-panel rounded-2xl overflow-hidden border border-allvino-outline-variant/35 shadow-xl grid grid-cols-1 md:grid-cols-2">
          
          {/* Left Column: Image and sharing */}
          <div className="p-8 md:p-12 bg-white flex flex-col items-center justify-between border-b md:border-b-0 md:border-r border-allvino-outline-variant/20">
            
            {/* Country flag tag */}
            <div className="w-full flex justify-start items-center space-x-2">
              <img
                src={getCountryFlagUrl(product.paisOrigem)}
                alt={product.paisOrigem}
                className="w-6 h-4 object-cover rounded shadow-sm"
              />
              <span className="text-xs font-bold uppercase tracking-wider text-allvino-secondary">
                {product.paisOrigem}
              </span>
            </div>

            {/* Bottle Image */}
            <div className="my-8 max-h-[400px] flex items-center justify-center p-4">
              <img
                src={product.imagemUrl}
                alt={product.name}
                className="max-h-[350px] object-contain transition duration-500 hover:scale-105"
              />
            </div>

            {/* Product Share buttons */}
            <div className="w-full space-y-3">
              <p className="text-[10px] text-center uppercase tracking-widest text-allvino-on-surface-variant font-bold">
                Compartilhar Vinho
              </p>
              <div className="flex gap-2">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 rounded bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold text-center transition flex items-center justify-center gap-1.5 shadow"
                >
                  <span>WhatsApp</span>
                </a>
                <button
                  onClick={handleCopyLink}
                  className="flex-1 py-2.5 rounded bg-allvino-surface-container-high hover:bg-allvino-primary hover:text-white border border-allvino-outline-variant text-allvino-text text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <span>{copied ? "Link Copiado!" : "Copiar Link"}</span>
                </button>
              </div>
            </div>

          </div>

          {/* Right Column: Detailed technical card */}
          <div className="p-8 md:p-12 flex flex-col justify-between space-y-8">
            
            {/* Title block */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-allvino-primary text-white tracking-wider">
                  {product.categoria}
                </span>
                <span className="text-xs text-allvino-on-surface-variant font-light">
                  {product.vinicola}
                </span>
              </div>
              
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-allvino-primary leading-tight">
                {product.name}
              </h2>
            </div>

            {/* Technical grid specs */}
            <div className="border-t border-b border-allvino-outline-variant/30 py-6 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-allvino-secondary">
                Ficha Técnica
              </h4>
              <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-xs">
                <div>
                  <span className="text-allvino-on-surface-variant font-light block mb-0.5">Safra</span>
                  <span className="font-bold text-allvino-text">{product.safra}</span>
                </div>
                <div>
                  <span className="text-allvino-on-surface-variant font-light block mb-0.5">Teor Alcoólico</span>
                  <span className="font-bold text-allvino-text">{product.teorAlcoolico}% ABV</span>
                </div>
                <div>
                  <span className="text-allvino-on-surface-variant font-light block mb-0.5">Região</span>
                  <span className="font-bold text-allvino-text">{product.regiao}</span>
                </div>
                <div>
                  <span className="text-allvino-on-surface-variant font-light block mb-0.5">Uva / Blend</span>
                  <span className="font-bold text-allvino-text">{product.uva}</span>
                </div>
              </div>
            </div>

            {/* Tasting description */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-widest text-allvino-secondary">
                Notas de Degustação
              </h4>
              <p className="text-sm text-allvino-text/90 font-light leading-relaxed">
                {product.notasDegustacao || "Nenhuma nota de degustação cadastrada para este rótulo."}
              </p>
            </div>

            {/* Price Footer */}
            <div className="pt-6 border-t border-allvino-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-allvino-on-surface-variant block mb-0.5">
                  Preço Unitário B2B
                </span>
                <span className="text-[9px] text-allvino-secondary block font-semibold mb-1">
                  (Caixa c/ 6 garrafas)
                </span>
                {product.precoPromocional ? (
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-black text-allvino-primary">
                      R$ {product.precoPromocional.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-sm text-allvino-on-surface-variant line-through">
                      R$ {product.precoOriginal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ) : (
                  <span className="text-3xl font-bold text-allvino-text">
                    R$ {product.precoOriginal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                )}
              </div>
              
              <Link
                href="/"
                className="px-6 py-3 rounded bg-allvino-primary text-white hover:bg-allvino-primary-container text-xs font-semibold text-center transition shadow"
              >
                Voltar ao Catálogo
              </Link>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
