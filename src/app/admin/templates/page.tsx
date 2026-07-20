"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

interface TemplateStyles {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  headerTitle: string;
  footerText: string;
  backgroundImageUrl?: string;
  coverImageUrl?: string;
  
  // Cover fine-tuning:
  coverSubtitle?: string;
  coverLogoHeight?: number;
  coverLogoAngle?: number;
  coverLogoXOffset?: number;
  coverLogoYOffset?: number;
  coverLogoVariant?: "auto" | "black" | "white";

  coverTitleColor?: string;
  coverTitleFontSize?: number;
  coverTitleAngle?: number;
  coverTitleXOffset?: number;
  coverTitleYOffset?: number;

  coverSubtitleColor?: string;
  coverSubtitleFontSize?: number;
  coverSubtitleAngle?: number;
  coverSubtitleXOffset?: number;
  coverSubtitleYOffset?: number;

  coverFooterColor?: string;
  coverFooterFontSize?: number;
  coverFooterYOffset?: number;
  coverVerticalOffset?: number;

  // Layout Presets & Angles:
  productLayoutPreset?: "classic" | "side-right" | "side-left" | "price-top";
  productDescAngle?: number;
  productDescAlign?: "left" | "center" | "right" | "justify";
  productPriceAngle?: number;

  // Product page fine-tuning:
  productImgHeight?: number;
  productImgXOffset?: number;
  productImgYOffset?: number;
  productImgAngle?: number;

  productNameFontSize?: number;
  productNameXOffset?: number;
  productNameYOffset?: number;

  productSpecsFontSize?: number;
  productOriginYOffset?: number;

  productPagePadding?: number;
  productTextMaxWidth?: number;

  // Dedicated product page colors & price position
  productNameColor?: string;
  productSpecsColor?: string;
  productDescColor?: string;
  productPriceColor?: string;
  productPriceLabelColor?: string;
  productPriceInfoColor?: string;
  productPriceSide?: "right" | "left" | "center";
  productPriceXOffset?: number;
  productPriceYOffset?: number;

  // Dedicated font sizes for price elements & description
  productPriceLabelFontSize?: number;
  productPriceInfoFontSize?: number;
  productPriceValueFontSize?: number;
  productDescFontSize?: number;
  productDescXOffset?: number;
  productDescYOffset?: number;
}

interface Template {
  id: string;
  nome: string;
  htmlContent: string;
  cssStyles: string;
  isActive: boolean;
}

interface Product {
  id: string;
  name: string;
  vinicola: string;
  uva: string;
  safra: string;
  paisOrigem: string;
  regiao: string;
  teorAlcoolico: number;
  precoOriginal: number;
  precoPromocional?: number | null;
  imagemUrl: string;
  notasDegustacao?: string | null;
}

const DEFAULT_PREVIEW_WINE: Product = {
  id: "demo-1",
  name: "Château Haut-Brion 2018",
  vinicola: "Château Haut-Brion",
  uva: "Cabernet Sauvignon, Merlot",
  safra: "2018",
  paisOrigem: "França",
  regiao: "Pessac-Léognan, Bordeaux",
  teorAlcoolico: 14.5,
  precoOriginal: 5200.0,
  precoPromocional: 4800.0,
  imagemUrl:
    "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=300&auto=format&fit=crop",
  notasDegustacao: "Notas complexas de frutas negras, fumo de corda, cacau e couro. Corpo encorpado, taninos aveludados e final persistente.",
};

const clamp = (val: any, min: number = -350, max: number = 350): number => {
  const num = typeof val === "number" ? val : parseFloat(val);
  if (isNaN(num)) return 0;
  return Math.max(min, Math.min(max, num));
};

export default function TemplatesPage() {
  const { data: session } = useSession();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  
  // Registered Wines from database for real preview
  const [dbWines, setDbWines] = useState<Product[]>([]);
  const [selectedWineId, setSelectedWineId] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Active control accordion tab ("bottle" | "price" | "text" | "cover" | "general")
  const [activeTab, setActiveTab] = useState<"bottle" | "price" | "text" | "cover" | "general">("bottle");

  // General Style state
  const [nome, setNome] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [primaryColor, setPrimaryColor] = useState("#80282d");
  const [secondaryColor, setSecondaryColor] = useState("#c5a880");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [textColor, setTextColor] = useState("#1f2937");
  const [fontFamily, setFontFamily] = useState("Playfair Display");
  const [headerTitle, setHeaderTitle] = useState("CATÁLOGO DE VINHOS");
  const [footerText, setFooterText] = useState("");
  const [backgroundImageUrl, setBackgroundImageUrl] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");

  // Layout Presets & Angles
  const [productLayoutPreset, setProductLayoutPreset] = useState<"classic" | "side-right" | "side-left" | "price-top">("classic");
  const [productDescAngle, setProductDescAngle] = useState(0);
  const [productDescAlign, setProductDescAlign] = useState<"left" | "center" | "right" | "justify">("center");
  const [productPriceAngle, setProductPriceAngle] = useState(0);

  // Cover Fine-Tuning State
  const [coverSubtitle, setCoverSubtitle] = useState("CATÁLOGO EXCLUSIVO B2B");
  const [coverLogoHeight, setCoverLogoHeight] = useState(110);
  const [coverLogoAngle, setCoverLogoAngle] = useState(0);
  const [coverLogoXOffset, setCoverLogoXOffset] = useState(0);
  const [coverLogoYOffset, setCoverLogoYOffset] = useState(0);
  const [coverLogoVariant, setCoverLogoVariant] = useState<"auto" | "black" | "white">("auto");

  const [coverTitleColor, setCoverTitleColor] = useState("");
  const [coverTitleFontSize, setCoverTitleFontSize] = useState(30);
  const [coverTitleAngle, setCoverTitleAngle] = useState(0);
  const [coverTitleXOffset, setCoverTitleXOffset] = useState(0);
  const [coverTitleYOffset, setCoverTitleYOffset] = useState(0);

  const [coverSubtitleColor, setCoverSubtitleColor] = useState("");
  const [coverSubtitleFontSize, setCoverSubtitleFontSize] = useState(11);
  const [coverSubtitleAngle, setCoverSubtitleAngle] = useState(0);
  const [coverSubtitleXOffset, setCoverSubtitleXOffset] = useState(0);
  const [coverSubtitleYOffset, setCoverSubtitleYOffset] = useState(0);

  const [coverFooterColor, setCoverFooterColor] = useState("");
  const [coverFooterFontSize, setCoverFooterFontSize] = useState(9);
  const [coverFooterYOffset, setCoverFooterYOffset] = useState(0);
  const [coverVerticalOffset, setCoverVerticalOffset] = useState(0);

  // Product Page Bottle Fine-Tuning State
  const [productImgHeight, setProductImgHeight] = useState(520);
  const [productImgXOffset, setProductImgXOffset] = useState(0);
  const [productImgYOffset, setProductImgYOffset] = useState(0);
  const [productImgAngle, setProductImgAngle] = useState(0);

  // Product Page Header Tuning (Name & Origin)
  const [productNameFontSize, setProductNameFontSize] = useState(28);
  const [productNameXOffset, setProductNameXOffset] = useState(0);
  const [productNameYOffset, setProductNameYOffset] = useState(0);

  const [productSpecsFontSize, setProductSpecsFontSize] = useState(11);
  const [productOriginYOffset, setProductOriginYOffset] = useState(0);

  const [productPagePadding, setProductPagePadding] = useState(28);
  const [productTextMaxWidth, setProductTextMaxWidth] = useState(560);

  // Product Colors & Price Block Tuning (Unrestricted X/Y)
  const [productNameColor, setProductNameColor] = useState("");
  const [productSpecsColor, setProductSpecsColor] = useState("");
  const [productDescColor, setProductDescColor] = useState("");
  const [productPriceColor, setProductPriceColor] = useState("");
  const [productPriceLabelColor, setProductPriceLabelColor] = useState("");
  const [productPriceInfoColor, setProductPriceInfoColor] = useState("");
  const [productPriceSide, setProductPriceSide] = useState<"right" | "left" | "center">("right");
  const [productPriceXOffset, setProductPriceXOffset] = useState(0);
  const [productPriceYOffset, setProductPriceYOffset] = useState(0);

  // Dedicated Price & Desc Font Sizes
  const [productPriceLabelFontSize, setProductPriceLabelFontSize] = useState(9.5);
  const [productPriceInfoFontSize, setProductPriceInfoFontSize] = useState(10);
  const [productPriceValueFontSize, setProductPriceValueFontSize] = useState(24);

  const [productDescFontSize, setProductDescFontSize] = useState(14.5);
  const [productDescXOffset, setProductDescXOffset] = useState(0);
  const [productDescYOffset, setProductDescYOffset] = useState(0);

  // Preview tab
  const [previewTab, setPreviewTab] = useState<"cover" | "product">("product");

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  useEffect(() => {
    fetchTemplates();
    fetchWines();
  }, []);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchWines = async () => {
    try {
      const res = await fetch("/api/wines");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setDbWines(data);
          setSelectedWineId(data[0].id);
        }
      }
    } catch {
      console.warn("Não foi possível carregar vinhos do banco para o preview.");
    }
  };

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
        const active = data.find((t: Template) => t.isActive) || data[0];
        if (active) handleSelectTemplate(active);
      } else {
        showToast("Erro ao buscar templates.", "error");
      }
    } catch {
      showToast("Erro de conexão.", "error");
    } finally {
      setLoading(false);
    }
  };

  const resetAllPositions = () => {
    setCoverLogoXOffset(0);
    setCoverLogoYOffset(0);
    setCoverTitleXOffset(0);
    setCoverTitleYOffset(0);
    setCoverSubtitleXOffset(0);
    setCoverSubtitleYOffset(0);
    setCoverFooterYOffset(0);
    setCoverVerticalOffset(0);

    setProductImgXOffset(0);
    setProductImgYOffset(0);
    setProductNameXOffset(0);
    setProductNameYOffset(0);
    setProductOriginYOffset(0);
    setProductPriceXOffset(0);
    setProductPriceYOffset(0);
    setProductDescXOffset(0);
    setProductDescYOffset(0);

    setProductDescAngle(0);
    setProductPriceAngle(0);
    setProductImgAngle(0);
    setProductImgHeight(520);
    setProductLayoutPreset("classic");
    setProductDescAlign("center");

    showToast("Posições resetadas para o padrão!");
  };

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setNome(template.nome);
    setIsActive(template.isActive);
    try {
      const s: TemplateStyles = JSON.parse(template.cssStyles);
      setPrimaryColor(s.primaryColor || "#80282d");
      setSecondaryColor(s.secondaryColor || "#c5a880");
      setBackgroundColor(s.backgroundColor || "#ffffff");
      setTextColor(s.textColor || "#1f2937");
      setFontFamily(s.fontFamily || "Playfair Display");
      setHeaderTitle(s.headerTitle || "CATÁLOGO DE VINHOS");
      setFooterText(s.footerText || "");
      setBackgroundImageUrl(s.backgroundImageUrl || "");
      setCoverImageUrl(s.coverImageUrl || "");

      // Presets & Angles
      setProductLayoutPreset(s.productLayoutPreset || "classic");
      setProductDescAngle(typeof s.productDescAngle === "number" ? s.productDescAngle : 0);
      setProductDescAlign(s.productDescAlign || "center");
      setProductPriceAngle(typeof s.productPriceAngle === "number" ? s.productPriceAngle : 0);

      // Cover
      setCoverSubtitle(s.coverSubtitle || "CATÁLOGO EXCLUSIVO B2B");
      setCoverLogoHeight(typeof s.coverLogoHeight === "number" ? s.coverLogoHeight : 110);
      setCoverLogoAngle(typeof s.coverLogoAngle === "number" ? s.coverLogoAngle : 0);
      setCoverLogoXOffset(clamp(s.coverLogoXOffset));
      setCoverLogoYOffset(clamp(s.coverLogoYOffset));
      setCoverLogoVariant(s.coverLogoVariant || "auto");

      setCoverTitleColor(s.coverTitleColor || "");
      setCoverTitleFontSize(typeof s.coverTitleFontSize === "number" ? s.coverTitleFontSize : 30);
      setCoverTitleAngle(typeof s.coverTitleAngle === "number" ? s.coverTitleAngle : 0);
      setCoverTitleXOffset(clamp(s.coverTitleXOffset));
      setCoverTitleYOffset(clamp(s.coverTitleYOffset));

      setCoverSubtitleColor(s.coverSubtitleColor || "");
      setCoverSubtitleFontSize(typeof s.coverSubtitleFontSize === "number" ? s.coverSubtitleFontSize : 11);
      setCoverSubtitleAngle(typeof s.coverSubtitleAngle === "number" ? s.coverSubtitleAngle : 0);
      setCoverSubtitleXOffset(clamp(s.coverSubtitleXOffset));
      setCoverSubtitleYOffset(clamp(s.coverSubtitleYOffset));

      setCoverFooterColor(s.coverFooterColor || "");
      setCoverFooterFontSize(typeof s.coverFooterFontSize === "number" ? s.coverFooterFontSize : 9);
      setCoverFooterYOffset(clamp(s.coverFooterYOffset));
      setCoverVerticalOffset(clamp(s.coverVerticalOffset));

      // Bottle
      setProductImgHeight(typeof s.productImgHeight === "number" ? s.productImgHeight : 520);
      setProductImgXOffset(clamp(s.productImgXOffset));
      setProductImgYOffset(clamp(s.productImgYOffset));
      setProductImgAngle(typeof s.productImgAngle === "number" ? s.productImgAngle : 0);

      // Product Header
      setProductNameFontSize(typeof s.productNameFontSize === "number" ? s.productNameFontSize : 28);
      setProductNameXOffset(clamp(s.productNameXOffset));
      setProductNameYOffset(clamp(s.productNameYOffset));

      setProductSpecsFontSize(typeof s.productSpecsFontSize === "number" ? s.productSpecsFontSize : 11);
      setProductOriginYOffset(clamp(s.productOriginYOffset));

      setProductPagePadding(typeof s.productPagePadding === "number" ? s.productPagePadding : 28);
      setProductTextMaxWidth(typeof s.productTextMaxWidth === "number" ? s.productTextMaxWidth : 560);

      // Price Block
      setProductNameColor(s.productNameColor || "");
      setProductSpecsColor(s.productSpecsColor || "");
      setProductDescColor(s.productDescColor || "");
      setProductPriceColor(s.productPriceColor || "");
      setProductPriceLabelColor(s.productPriceLabelColor || "");
      setProductPriceInfoColor(s.productPriceInfoColor || "");
      setProductPriceSide(s.productPriceSide || "right");
      setProductPriceXOffset(clamp(s.productPriceXOffset, -350, 350));
      setProductPriceYOffset(clamp(s.productPriceYOffset, -450, 450));

      setProductPriceLabelFontSize(typeof s.productPriceLabelFontSize === "number" ? s.productPriceLabelFontSize : 9.5);
      setProductPriceInfoFontSize(typeof s.productPriceInfoFontSize === "number" ? s.productPriceInfoFontSize : 10);
      setProductPriceValueFontSize(typeof s.productPriceValueFontSize === "number" ? s.productPriceValueFontSize : 24);

      // Description Block
      setProductDescFontSize(typeof s.productDescFontSize === "number" ? s.productDescFontSize : 14.5);
      setProductDescXOffset(clamp(s.productDescXOffset));
      setProductDescYOffset(clamp(s.productDescYOffset, -150, 150));
    } catch {
      console.error("Erro ao interpretar estilos do template.");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;
    setSaving(true);

    const payload = {
      nome,
      isActive,
      cssStyles: JSON.stringify({
        primaryColor,
        secondaryColor,
        backgroundColor,
        textColor,
        fontFamily,
        headerTitle,
        footerText,
        backgroundImageUrl,
        coverImageUrl,

        productLayoutPreset,
        productDescAngle,
        productDescAlign,
        productPriceAngle,

        coverSubtitle,
        coverLogoHeight,
        coverLogoAngle,
        coverLogoXOffset: clamp(coverLogoXOffset),
        coverLogoYOffset: clamp(coverLogoYOffset),
        coverLogoVariant,

        coverTitleColor,
        coverTitleFontSize,
        coverTitleAngle,
        coverTitleXOffset: clamp(coverTitleXOffset),
        coverTitleYOffset: clamp(coverTitleYOffset),

        coverSubtitleColor,
        coverSubtitleFontSize,
        coverSubtitleAngle,
        coverSubtitleXOffset: clamp(coverSubtitleXOffset),
        coverSubtitleYOffset: clamp(coverSubtitleYOffset),

        coverFooterColor,
        coverFooterFontSize,
        coverFooterYOffset: clamp(coverFooterYOffset),
        coverVerticalOffset: clamp(coverVerticalOffset),

        productImgHeight,
        productImgXOffset: clamp(productImgXOffset),
        productImgYOffset: clamp(productImgYOffset),
        productImgAngle,

        productNameFontSize,
        productNameXOffset: clamp(productNameXOffset),
        productNameYOffset: clamp(productNameYOffset),

        productSpecsFontSize,
        productOriginYOffset: clamp(productOriginYOffset),

        productPagePadding,
        productTextMaxWidth,

        productNameColor,
        productSpecsColor,
        productDescColor,
        productPriceColor,
        productPriceLabelColor,
        productPriceInfoColor,
        productPriceSide,
        productPriceXOffset: clamp(productPriceXOffset, -350, 350),
        productPriceYOffset: clamp(productPriceYOffset, -450, 450),

        productPriceLabelFontSize,
        productPriceInfoFontSize,
        productPriceValueFontSize,

        productDescFontSize,
        productDescXOffset: clamp(productDescXOffset),
        productDescYOffset: clamp(productDescYOffset, -150, 150),
      }),
    };

    try {
      const res = await fetch(`/api/templates/${selectedTemplate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showToast("Template salvo com sucesso!");
        fetchTemplates();
      } else {
        showToast("Falha ao salvar.", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = (
    file: File | undefined,
    setter: (val: string) => void
  ) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") setter(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const hasCoverBg = !!coverImageUrl;

  const previewFont =
    fontFamily === "Inter"
      ? "Inter, sans-serif"
      : fontFamily === "Cinzel"
      ? "Georgia, serif"
      : "Georgia, serif";

  const resolvedCoverTitleColor = coverTitleColor || (hasCoverBg ? "#ffffff" : primaryColor);
  const resolvedCoverSubColor = coverSubtitleColor || (hasCoverBg ? "rgba(255,255,255,0.78)" : secondaryColor);

  const resolvedProductNameColor = productNameColor || primaryColor;
  const resolvedProductSpecsColor = productSpecsColor || secondaryColor;
  const resolvedProductDescColor = productDescColor || textColor;
  const resolvedProductPriceColor = productPriceColor || primaryColor;
  const resolvedProductPriceLabelColor = productPriceLabelColor || "#777777";
  const resolvedProductPriceInfoColor = productPriceInfoColor || secondaryColor;

  const previewLogoSrc =
    coverLogoVariant === "white"
      ? "/logo-white.png"
      : coverLogoVariant === "black"
      ? "/logo-black.png"
      : hasCoverBg
      ? "/logo-white.png"
      : "/logo-black.png";

  const previewWine = dbWines.find((w) => w.id === selectedWineId) || DEFAULT_PREVIEW_WINE;
  const previewWineDesc = previewWine.notasDegustacao || "Vinho de excelente estrutura, aromas harmoniosos e notas marcantes.";

  return (
    <div className="min-h-screen bg-allvino-background text-allvino-text font-sans pb-12">
      {/* Navigation Header */}
      <nav className="border-b border-allvino-outline-variant/30 bg-allvino-surface-container-low/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <img
                src="/logo.png"
                alt="Allvino Logo"
                className="h-14 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <span className="text-sm font-bold bg-allvino-primary/10 text-allvino-primary px-2.5 py-1 rounded tracking-widest uppercase">
                Admin
              </span>
              <div className="hidden md:flex space-x-4 pl-6">
                <Link
                  href="/admin/dashboard"
                  className="px-3 py-2 rounded-md text-sm font-medium text-allvino-on-surface-variant hover:text-allvino-primary transition"
                >
                  Vinhos
                </Link>
                <Link
                  href="/admin/templates"
                  className="px-3 py-2 rounded-md text-sm font-medium bg-allvino-primary text-white border border-allvino-primary-container"
                >
                  Editor de Templates
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/"
                target="_blank"
                className="text-xs text-allvino-on-surface-variant hover:text-allvino-primary transition mr-2"
              >
                Ver Vitrine Pública
              </a>
              <button
                onClick={() => signOut({ callbackUrl: "/admin/login" })}
                className="px-4 py-1.5 rounded bg-allvino-surface-container-high hover:bg-allvino-primary hover:text-white border border-allvino-outline-variant hover:border-allvino-primary transition text-xs font-semibold"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Toast */}
        {toastMessage && (
          <div
            className={`fixed bottom-5 right-5 z-50 px-6 py-3.5 rounded-lg shadow-2xl border flex items-center space-x-2 text-sm font-medium transition-all ${
              toastType === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <span>{toastMessage}</span>
          </div>
        )}

        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-serif text-allvino-primary">
              Editor Dinâmico de Templates PDF
            </h1>
            <p className="text-allvino-on-surface-variant text-sm mt-1">
              Posicionamento 100% autônomo e livre para o Preço (qualquer coordenada X/Y e ângulo na folha A4).
            </p>
          </div>
          <button
            type="button"
            onClick={resetAllPositions}
            className="px-4 py-2 bg-allvino-surface-container-high hover:bg-allvino-secondary hover:text-white border border-allvino-outline-variant text-allvino-primary rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1.5 self-start md:self-auto"
          >
            <span>🔄</span>
            <span>Resetar Posições (Centralizar)</span>
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center text-allvino-on-surface-variant space-y-3">
            <div className="w-10 h-10 border-4 border-allvino-primary border-t-allvino-secondary rounded-full animate-spin mx-auto"></div>
            <p className="text-xs tracking-wider">
              Carregando estúdio de design...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* ─── DESIGN CONTROLS ─── */}
            <div className="lg:col-span-5 space-y-6">
              {/* Template selection */}
              <div className="glass-panel p-5 rounded-xl border border-allvino-outline-variant/30">
                <label className="block text-xs font-semibold uppercase tracking-wider text-allvino-primary mb-2.5">
                  Estilo Base do Catálogo
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleSelectTemplate(t)}
                      className={`py-2.5 px-2 rounded-lg text-xs font-bold transition flex flex-col items-center justify-center gap-1 border ${
                        selectedTemplate?.id === t.id
                          ? "bg-allvino-primary border-allvino-primary text-white"
                          : "bg-allvino-surface-container-high border-allvino-outline-variant text-allvino-text hover:bg-allvino-surface-container-highest"
                      }`}
                    >
                      <span>{t.nome}</span>
                      {t.isActive && (
                        <span className="px-1.5 py-0.5 rounded-full text-[8.5px] bg-allvino-secondary text-white font-extrabold tracking-wide">
                          ATIVO
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* LAYOUT PRESETS SELECTION */}
              <div className="glass-panel p-5 rounded-xl border border-allvino-outline-variant/30 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-allvino-primary">
                  📰 Estrutura / Preset do Layout do Produto
                </label>
                <p className="text-[10px] text-allvino-on-surface-variant leading-relaxed">
                  Escolha se o texto fica **ao lado da garrafa** (estilo revista), **no topo**, ou **embaixo**.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "side-right", title: "📰 Lado a Lado (Revista)", desc: "Garrafa na Esquerda, Texto na Direita" },
                    { id: "side-left", title: "📰 Lado a Lado Inverso", desc: "Garrafa na Direita, Texto na Esquerda" },
                    { id: "classic", title: "🍾 Clássico Vertical", desc: "Garrafa no Centro, Texto em Baixo" },
                    { id: "price-top", title: "🔝 Preço no Topo", desc: "Layout com Preço no Topo" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setProductLayoutPreset(p.id as any)}
                      className={`p-3 rounded-lg text-left transition border flex flex-col gap-1 ${
                        productLayoutPreset === p.id
                          ? "bg-allvino-primary text-white border-allvino-primary shadow-md"
                          : "bg-allvino-surface-container-low border-allvino-outline-variant hover:bg-allvino-surface-container-high"
                      }`}
                    >
                      <span className="text-xs font-bold">{p.title}</span>
                      <span className={`text-[9.5px] ${productLayoutPreset === p.id ? "text-white/80" : "text-allvino-on-surface-variant/70"}`}>
                        {p.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation Tabs for Categories */}
              <div className="flex rounded-xl bg-allvino-surface-container-low p-1 border border-allvino-outline-variant/30 text-xs font-semibold overflow-x-auto gap-1">
                {[
                  { id: "price", label: "🏷️ Preço B2B Livre", preview: "product" },
                  { id: "bottle", label: "🍾 Garrafa", preview: "product" },
                  { id: "text", label: "📝 Textos Vinho", preview: "product" },
                  { id: "cover", label: "📖 Capa", preview: "cover" },
                  { id: "general", label: "🎨 Geral & Fundo", preview: "product" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      setPreviewTab(tab.preview as any);
                    }}
                    className={`flex-1 py-2 px-2.5 rounded-lg whitespace-nowrap transition text-center ${
                      activeTab === tab.id
                        ? "bg-allvino-primary text-white font-bold shadow"
                        : "text-allvino-on-surface-variant hover:text-allvino-primary hover:bg-allvino-surface-container-high"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Styles form */}
              <form
                onSubmit={handleSave}
                className="glass-panel p-6 rounded-xl border border-allvino-outline-variant/30 space-y-5"
              >
                {/* Active toggle */}
                <div className="flex items-center justify-between pb-3 border-b border-allvino-outline-variant/20">
                  <h3 className="font-serif font-bold text-allvino-primary text-sm">
                    {activeTab === "price" && "🏷️ Posicionamento 100% Autônomo do Preço B2B"}
                    {activeTab === "bottle" && "Posicionamento & Escala da Garrafa"}
                    {activeTab === "text" && "Nome, Ficha Técnica & Descrição"}
                    {activeTab === "cover" && "Personalização Completa da Capa"}
                    {activeTab === "general" && "Cores Base & Texturas de Fundo"}
                  </h3>
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded border-allvino-outline-variant text-allvino-primary focus:ring-allvino-primary"
                    />
                    <span>Ativar Template</span>
                  </label>
                </div>

                {/* ── TAB 1: PRICE B2B FULL AUTONOMY ── */}
                {activeTab === "price" && (
                  <div className="space-y-4">
                    <p className="text-[11px] text-allvino-on-surface-variant leading-relaxed">
                      O Preço B2B possui **autonomia total**: posicione em qualquer coordenada X e Y da folha A4 (ao lado, acima, abaixo da garrafa ou no canto), com qualquer ângulo de rotação.
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] text-allvino-on-surface-variant font-semibold">
                            Posição Horizontal X (Livre)
                          </label>
                          <span className="text-[10px] font-bold text-allvino-primary">{productPriceXOffset}px</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="-300"
                            max="300"
                            value={productPriceXOffset}
                            onChange={(e) => setProductPriceXOffset(clamp(e.target.value, -350, 350))}
                            className="w-full accent-allvino-primary"
                          />
                          <input
                            type="number"
                            value={productPriceXOffset}
                            onChange={(e) => setProductPriceXOffset(clamp(e.target.value, -350, 350))}
                            className="w-14 text-[10px] p-1 rounded bg-allvino-surface-container-low border text-center font-bold"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] text-allvino-on-surface-variant font-semibold">
                            Posição Vertical Y (Livre)
                          </label>
                          <span className="text-[10px] font-bold text-allvino-primary">{productPriceYOffset}px</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="-350"
                            max="350"
                            value={productPriceYOffset}
                            onChange={(e) => setProductPriceYOffset(clamp(e.target.value, -450, 450))}
                            className="w-full accent-allvino-primary"
                          />
                          <input
                            type="number"
                            value={productPriceYOffset}
                            onChange={(e) => setProductPriceYOffset(clamp(e.target.value, -450, 450))}
                            className="w-14 text-[10px] p-1 rounded bg-allvino-surface-container-low border text-center font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[10px] font-semibold text-allvino-on-surface-variant mb-1">
                          Ângulo de Rotação do Preço (°)...
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="-180"
                            max="180"
                            value={productPriceAngle}
                            onChange={(e) => setProductPriceAngle(Number(e.target.value))}
                            className="w-full accent-allvino-primary"
                          />
                          <input
                            type="number"
                            value={productPriceAngle}
                            onChange={(e) => setProductPriceAngle(Number(e.target.value))}
                            className="w-14 text-[10px] p-1 rounded bg-allvino-surface-container-low border text-center font-bold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-allvino-on-surface-variant mb-1">
                          Alinhamento Interno
                        </label>
                        <div className="grid grid-cols-3 gap-1">
                          {[
                            { id: "left", label: "👈 Dir." },
                            { id: "center", label: "👇 Cent." },
                            { id: "right", label: "👉 Esq." },
                          ].map((side) => (
                            <button
                              key={side.id}
                              type="button"
                              onClick={() => setProductPriceSide(side.id as any)}
                              className={`py-1.5 text-[9px] font-bold rounded border text-center ${
                                productPriceSide === side.id
                                  ? "bg-allvino-primary text-white border-allvino-primary shadow"
                                  : "bg-allvino-surface-container-low border-allvino-outline-variant hover:bg-allvino-surface-container-high"
                              }`}
                            >
                              {side.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-allvino-outline-variant/20">
                      <p className="text-[11px] font-bold text-allvino-primary mb-2">
                        Tamanhos de Fonte dos Elementos de Preço
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[9px] text-allvino-on-surface-variant mb-1 font-medium">"Preço B2B"</label>
                          <input
                            type="number"
                            step="0.5"
                            value={productPriceLabelFontSize}
                            onChange={(e) => setProductPriceLabelFontSize(Number(e.target.value))}
                            className="w-full text-xs p-1.5 rounded bg-allvino-surface-container-low border text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-allvino-on-surface-variant mb-1 font-medium">"Caixa c/ 6"</label>
                          <input
                            type="number"
                            step="0.5"
                            value={productPriceInfoFontSize}
                            onChange={(e) => setProductPriceInfoFontSize(Number(e.target.value))}
                            className="w-full text-xs p-1.5 rounded bg-allvino-surface-container-low border text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-allvino-on-surface-variant mb-1 font-medium">Valor (R$)</label>
                          <input
                            type="number"
                            value={productPriceValueFontSize}
                            onChange={(e) => setProductPriceValueFontSize(Number(e.target.value))}
                            className="w-full text-xs p-1.5 rounded bg-allvino-surface-container-low border text-center font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-allvino-outline-variant/20">
                      <p className="text-[11px] font-bold text-allvino-primary mb-2">
                        Cores Individuais dos Elementos de Preço
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[9px] text-allvino-on-surface-variant mb-1 font-medium">Preço B2B</label>
                          <input
                            type="color"
                            value={resolvedProductPriceLabelColor}
                            onChange={(e) => setProductPriceLabelColor(e.target.value)}
                            className="w-full h-8 rounded border cursor-pointer bg-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-allvino-on-surface-variant mb-1 font-medium">Caixa c/ 6</label>
                          <input
                            type="color"
                            value={resolvedProductPriceInfoColor}
                            onChange={(e) => setProductPriceInfoColor(e.target.value)}
                            className="w-full h-8 rounded border cursor-pointer bg-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-allvino-on-surface-variant mb-1 font-medium">Valor R$</label>
                          <input
                            type="color"
                            value={resolvedProductPriceColor}
                            onChange={(e) => setProductPriceColor(e.target.value)}
                            className="w-full h-8 rounded border cursor-pointer bg-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB 2: BOTTLE POSITION & SIZE ── */}
                {activeTab === "bottle" && (
                  <div className="space-y-4">
                    <p className="text-[11px] text-allvino-on-surface-variant leading-relaxed">
                      Posicione a garrafa de vinho na folha de produto, ajustando a altura máxima e deslocamentos suaves.
                    </p>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] text-allvino-on-surface-variant font-semibold">
                          Altura Máxima da Garrafa
                        </label>
                        <span className="text-[10px] font-bold text-allvino-primary">{productImgHeight}px</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="250"
                          max="650"
                          value={productImgHeight}
                          onChange={(e) => setProductImgHeight(Number(e.target.value))}
                          className="w-full accent-allvino-primary"
                        />
                        <input
                          type="number"
                          value={productImgHeight}
                          onChange={(e) => setProductImgHeight(Number(e.target.value))}
                          className="w-16 text-[10px] p-1 rounded bg-allvino-surface-container-low border text-center"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] text-allvino-on-surface-variant font-semibold">
                            Posição Horizontal (X)
                          </label>
                          <span className="text-[10px] font-bold text-allvino-primary">{productImgXOffset}px</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="-150"
                            max="150"
                            value={productImgXOffset}
                            onChange={(e) => setProductImgXOffset(clamp(e.target.value))}
                            className="w-full accent-allvino-primary"
                          />
                          <input
                            type="number"
                            value={productImgXOffset}
                            onChange={(e) => setProductImgXOffset(clamp(e.target.value))}
                            className="w-14 text-[10px] p-1 rounded bg-allvino-surface-container-low border text-center"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] text-allvino-on-surface-variant font-semibold">
                            Posição Vertical (Y)
                          </label>
                          <span className="text-[10px] font-bold text-allvino-primary">{productImgYOffset}px</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="-150"
                            max="150"
                            value={productImgYOffset}
                            onChange={(e) => setProductImgYOffset(clamp(e.target.value))}
                            className="w-full accent-allvino-primary"
                          />
                          <input
                            type="number"
                            value={productImgYOffset}
                            onChange={(e) => setProductImgYOffset(clamp(e.target.value))}
                            className="w-14 text-[10px] p-1 rounded bg-allvino-surface-container-low border text-center"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] text-allvino-on-surface-variant font-semibold">
                          Ângulo de Rotação da Garrafa
                        </label>
                        <span className="text-[10px] font-bold text-allvino-primary">{productImgAngle}°</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="-45"
                          max="45"
                          value={productImgAngle}
                          onChange={(e) => setProductImgAngle(Number(e.target.value))}
                          className="w-full accent-allvino-primary"
                        />
                        <input
                          type="number"
                          value={productImgAngle}
                          onChange={(e) => setProductImgAngle(Number(e.target.value))}
                          className="w-16 text-[10px] p-1 rounded bg-allvino-surface-container-low border text-center"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB 3: WINE TEXTS (NAME, SPECS & DESC) ── */}
                {activeTab === "text" && (
                  <div className="space-y-4">
                    <p className="text-[11px] text-allvino-on-surface-variant leading-relaxed">
                      Ajuste tamanhos, ângulos e alinhamento do Nome do Vinho, Origem, Ficha Técnica e Notas de Degustação.
                    </p>

                    {/* Wine Name */}
                    <div className="space-y-2 pb-3 border-b border-allvino-outline-variant/20">
                      <p className="text-[11px] font-bold text-allvino-primary">1. Nome do Vinho</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[9px] text-allvino-on-surface-variant mb-1">Fonte (px)</label>
                          <input
                            type="number"
                            value={productNameFontSize}
                            onChange={(e) => setProductNameFontSize(Number(e.target.value))}
                            className="w-full text-xs p-1.5 rounded bg-allvino-surface-container-low border text-center font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-allvino-on-surface-variant mb-1">Posição X</label>
                          <input
                            type="number"
                            value={productNameXOffset}
                            onChange={(e) => setProductNameXOffset(clamp(e.target.value))}
                            className="w-full text-xs p-1.5 rounded bg-allvino-surface-container-low border text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-allvino-on-surface-variant mb-1">Posição Y</label>
                          <input
                            type="number"
                            value={productNameYOffset}
                            onChange={(e) => setProductNameYOffset(clamp(e.target.value))}
                            className="w-full text-xs p-1.5 rounded bg-allvino-surface-container-low border text-center"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Tasting Description */}
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold text-allvino-primary">2. Bloco de Notas de Degustação & Ângulo</p>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] text-allvino-on-surface-variant mb-1 font-semibold">Alinhamento do Texto</label>
                          <select
                            value={productDescAlign}
                            onChange={(e) => setProductDescAlign(e.target.value as any)}
                            className="w-full text-xs p-1.5 rounded bg-allvino-surface-container-low border font-semibold"
                          >
                            <option value="left">👈 Esquerda</option>
                            <option value="center">👇 Centralizado</option>
                            <option value="right">👉 Direita</option>
                            <option value="justify">↔️ Justificado</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] text-allvino-on-surface-variant mb-1 font-semibold">Ângulo do Bloco (°)</label>
                          <input
                            type="number"
                            value={productDescAngle}
                            onChange={(e) => setProductDescAngle(Number(e.target.value))}
                            className="w-full text-xs p-1.5 rounded bg-allvino-surface-container-low border text-center font-bold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <div>
                          <label className="block text-[9px] text-allvino-on-surface-variant mb-1">Fonte Desc (px)</label>
                          <input
                            type="number"
                            value={productDescFontSize}
                            onChange={(e) => setProductDescFontSize(Number(e.target.value))}
                            className="w-full text-xs p-1.5 rounded bg-allvino-surface-container-low border text-center font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-allvino-on-surface-variant mb-1">Posição X</label>
                          <input
                            type="number"
                            value={productDescXOffset}
                            onChange={(e) => setProductDescXOffset(clamp(e.target.value))}
                            className="w-full text-xs p-1.5 rounded bg-allvino-surface-container-low border text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-allvino-on-surface-variant mb-1">Posição Y</label>
                          <input
                            type="number"
                            value={productDescYOffset}
                            onChange={(e) => setProductDescYOffset(clamp(e.target.value, -100, 100))}
                            className="w-full text-xs p-1.5 rounded bg-allvino-surface-container-low border text-center font-bold"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <label className="block text-[9px] text-allvino-on-surface-variant mb-1">Largura Máx. (px)</label>
                          <input
                            type="number"
                            value={productTextMaxWidth}
                            onChange={(e) => setProductTextMaxWidth(Number(e.target.value))}
                            className="w-full text-xs p-1.5 rounded bg-allvino-surface-container-low border text-center font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-allvino-on-surface-variant mb-1">Cor das Notas</label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={resolvedProductDescColor}
                              onChange={(e) => setProductDescColor(e.target.value)}
                              className="w-7 h-7 rounded border cursor-pointer bg-transparent"
                            />
                            <input
                              type="text"
                              value={productDescColor}
                              onChange={(e) => setProductDescColor(e.target.value)}
                              placeholder="Auto"
                              className="w-full text-xs p-1 rounded bg-allvino-surface-container-low border"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB 4: COVER DESIGN ── */}
                {activeTab === "cover" && (
                  <div className="space-y-4">
                    <p className="text-[11px] text-allvino-on-surface-variant leading-relaxed">
                      Personalize completamente a Capa: Esquema da Logo, Posição X/Y do Título, Subtítulo e Rodapé.
                    </p>

                    {/* Logo Config */}
                    <div className="space-y-2 pb-3 border-b border-allvino-outline-variant/20">
                      <p className="text-[11px] font-bold text-allvino-primary">1. Logotipo Allvino</p>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { id: "auto", label: "⚡ Auto" },
                          { id: "black", label: "⚫ Preto" },
                          { id: "white", label: "⚪ Branco" },
                        ].map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => setCoverLogoVariant(v.id as any)}
                            className={`py-1.5 text-[10px] font-bold rounded border text-center ${
                              coverLogoVariant === v.id
                                ? "bg-allvino-primary text-white border-allvino-primary shadow"
                                : "bg-allvino-surface-container-low border-allvino-outline-variant"
                            }`}
                          >
                            {v.label}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <div>
                          <label className="block text-[9px] text-allvino-on-surface-variant mb-1">Altura</label>
                          <input
                            type="number"
                            value={coverLogoHeight}
                            onChange={(e) => setCoverLogoHeight(Number(e.target.value))}
                            className="w-full text-xs p-1.5 rounded bg-allvino-surface-container-low border text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-allvino-on-surface-variant mb-1">Posição X</label>
                          <input
                            type="number"
                            value={coverLogoXOffset}
                            onChange={(e) => setCoverLogoXOffset(clamp(e.target.value))}
                            className="w-full text-xs p-1.5 rounded bg-allvino-surface-container-low border text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-allvino-on-surface-variant mb-1">Posição Y</label>
                          <input
                            type="number"
                            value={coverLogoYOffset}
                            onChange={(e) => setCoverLogoYOffset(clamp(e.target.value))}
                            className="w-full text-xs p-1.5 rounded bg-allvino-surface-container-low border text-center"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Cover Title */}
                    <div className="space-y-2 pb-3 border-b border-allvino-outline-variant/20">
                      <p className="text-[11px] font-bold text-allvino-primary">2. Título Principal da Capa</p>
                      <input
                        type="text"
                        value={headerTitle}
                        onChange={(e) => setHeaderTitle(e.target.value)}
                        placeholder="CATÁLOGO DE VINHOS"
                        className="w-full text-xs p-2 rounded bg-allvino-surface-container-low border"
                      />
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <div>
                          <label className="block text-[9px] text-allvino-on-surface-variant mb-1">Fonte (px)</label>
                          <input
                            type="number"
                            value={coverTitleFontSize}
                            onChange={(e) => setCoverTitleFontSize(Number(e.target.value))}
                            className="w-full text-xs p-1.5 rounded bg-allvino-surface-container-low border text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-allvino-on-surface-variant mb-1">Posição X</label>
                          <input
                            type="number"
                            value={coverTitleXOffset}
                            onChange={(e) => setCoverTitleXOffset(clamp(e.target.value))}
                            className="w-full text-xs p-1.5 rounded bg-allvino-surface-container-low border text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-allvino-on-surface-variant mb-1">Posição Y</label>
                          <input
                            type="number"
                            value={coverTitleYOffset}
                            onChange={(e) => setCoverTitleYOffset(clamp(e.target.value))}
                            className="w-full text-xs p-1.5 rounded bg-allvino-surface-container-low border text-center"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB 5: GENERAL & BACKGROUND ── */}
                {activeTab === "general" && (
                  <div className="space-y-4">
                    <p className="text-[11px] text-allvino-on-surface-variant leading-relaxed">
                      Gerencie paleta de cores geral do PDF, tipografia e imagens de fundo do catálogo.
                    </p>

                    {/* Background Texture */}
                    <div className="space-y-2 pb-3 border-b border-allvino-outline-variant/20">
                      <p className="text-[11px] font-bold text-allvino-primary">Textura de Fundo do Produto</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e.target.files?.[0], setBackgroundImageUrl)}
                          className="w-full p-1.5 rounded bg-allvino-surface-container-low border text-[10px]"
                        />
                        <input
                          type="text"
                          value={backgroundImageUrl}
                          onChange={(e) => setBackgroundImageUrl(e.target.value)}
                          placeholder="Ou URL da Imagem"
                          className="w-full p-2 rounded bg-allvino-surface-container-low border text-xs"
                        />
                      </div>
                    </div>

                    {/* Base Colors */}
                    <div>
                      <p className="text-[11px] font-bold text-allvino-primary mb-2">Cores Globais do Sistema</p>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: "Cor Primária", val: primaryColor, set: setPrimaryColor },
                          { label: "Cor Secundária", val: secondaryColor, set: setSecondaryColor },
                          { label: "Cor Fundo PDF", val: backgroundColor, set: setBackgroundColor },
                          { label: "Cor Texto Base", val: textColor, set: setTextColor },
                        ].map((c) => (
                          <div key={c.label}>
                            <label className="block text-[9px] text-allvino-on-surface-variant mb-1">{c.label}</label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="color"
                                value={c.val}
                                onChange={(e) => c.set(e.target.value)}
                                className="w-8 h-8 rounded border cursor-pointer bg-transparent"
                              />
                              <input
                                type="text"
                                value={c.val}
                                onChange={(e) => c.set(e.target.value)}
                                className="w-full text-xs p-1 rounded bg-allvino-surface-container-low border text-center"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Save button */}
                <div className="pt-4 border-t border-allvino-outline-variant/20 flex gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-3 rounded-lg bg-allvino-primary hover:bg-allvino-primary-container disabled:opacity-50 text-white font-semibold text-sm transition duration-200 shadow-md"
                  >
                    {saving ? "Salvando..." : "Salvar Configurações"}
                  </button>
                </div>
              </form>
            </div>

            {/* ─── LIVE PREVIEW WITH REAL REGISTERED WINE SELECTOR ─── */}
            <div className="lg:col-span-7">
              <div className="sticky top-24">
                {/* Preview Controls & Real Wine Selector */}
                <div className="mb-3 space-y-2 px-1">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPreviewTab("cover")}
                        className={`px-3 py-1.5 rounded text-xs font-bold transition border ${
                          previewTab === "cover"
                            ? "bg-allvino-primary border-allvino-primary text-white"
                            : "bg-allvino-surface-container-high border-allvino-outline-variant text-allvino-text hover:border-allvino-primary"
                        }`}
                      >
                        Capa (Preview)
                      </button>
                      <button
                        onClick={() => setPreviewTab("product")}
                        className={`px-3 py-1.5 rounded text-xs font-bold transition border ${
                          previewTab === "product"
                            ? "bg-allvino-primary border-allvino-primary text-white"
                            : "bg-allvino-surface-container-high border-allvino-outline-variant text-allvino-text hover:border-allvino-primary"
                        }`}
                      >
                        Página de Produto
                      </button>
                    </div>
                    <span className="text-[10px] text-allvino-on-surface-variant font-medium">
                      Proporção A4 Padrão (210 × 297 mm)
                    </span>
                  </div>

                  {/* Real Registered Wine Selector for Preview */}
                  {previewTab === "product" && dbWines.length > 0 && (
                    <div className="flex items-center gap-2 bg-allvino-surface-container-low p-2 rounded-lg border border-allvino-outline-variant/30">
                      <span className="text-[10px] font-bold text-allvino-primary uppercase tracking-wider whitespace-nowrap">
                        🍷 Vinho em Exibição:
                      </span>
                      <select
                        value={selectedWineId}
                        onChange={(e) => setSelectedWineId(e.target.value)}
                        className="w-full text-xs font-semibold p-1.5 bg-white border border-allvino-outline-variant rounded focus:outline-none focus:border-allvino-primary"
                      >
                        {dbWines.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.name} ({w.paisOrigem} - {w.regiao})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* A4 Preview Container */}
                <div
                  className="w-full rounded-xl shadow-2xl border border-allvino-outline-variant/40 overflow-hidden transition-all duration-300 relative aspect-[1/1.414]"
                  style={{
                    backgroundColor:
                      previewTab === "cover" && hasCoverBg
                        ? "#000"
                        : backgroundColor,
                    backgroundImage:
                      previewTab === "cover" && hasCoverBg
                        ? `url(${coverImageUrl})`
                        : previewTab === "product" && backgroundImageUrl
                        ? `url(${backgroundImageUrl})`
                        : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    color: textColor,
                  }}
                >
                  {/* ── COVER PREVIEW ── */}
                  {previewTab === "cover" && (
                    <div className="h-full flex flex-col items-center justify-center relative">
                      {hasCoverBg && (
                        <div
                          className="absolute inset-0 z-0"
                          style={{
                            background:
                              "linear-gradient(180deg, rgba(0,0,0,.32) 0%, rgba(0,0,0,.08) 38%, rgba(0,0,0,.42) 100%)",
                          }}
                        />
                      )}
                      {!hasCoverBg && (
                        <>
                          <div
                            className="absolute top-8 left-8 right-8 h-px opacity-30"
                            style={{ background: secondaryColor }}
                          />
                          <div
                            className="absolute bottom-16 left-8 right-8 h-px opacity-30"
                            style={{ background: secondaryColor }}
                          />
                        </>
                      )}
                      <div
                        className="relative z-10 text-center px-12 transition-transform duration-150"
                        style={{
                          transform: `translateY(${clamp(coverVerticalOffset) * 0.4}px)`,
                        }}
                      >
                        <img
                          src={previewLogoSrc}
                          alt="Logo"
                          className="mx-auto mb-6 object-contain transition-all duration-150"
                          style={{
                            height: `${coverLogoHeight * 0.6}px`,
                            transform: `translate(${clamp(coverLogoXOffset) * 0.4}px, ${clamp(coverLogoYOffset) * 0.4}px) rotate(${coverLogoAngle}deg)`,
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                        <div
                          className="w-16 h-px mx-auto mb-6"
                          style={{
                            background: coverSubtitleColor || (hasCoverBg ? "rgba(255,255,255,0.35)" : secondaryColor),
                          }}
                        />
                        <h2
                          className="tracking-widest uppercase mb-3 transition-all duration-150"
                          style={{
                            color: resolvedCoverTitleColor,
                            fontFamily: previewFont,
                            fontSize: `${Math.round(coverTitleFontSize * 0.7)}px`,
                            fontWeight: 700,
                            transform: `translate(${clamp(coverTitleXOffset) * 0.4}px, ${clamp(coverTitleYOffset) * 0.4}px) rotate(${coverTitleAngle}deg)`,
                            textShadow: hasCoverBg
                              ? "0 2px 10px rgba(0,0,0,.25)"
                              : "none",
                          }}
                        >
                          {headerTitle || "CATÁLOGO DE VINHOS"}
                        </h2>
                        <p
                          className="tracking-[5px] uppercase transition-all duration-150"
                          style={{
                            color: resolvedCoverSubColor,
                            fontSize: `${Math.round(coverSubtitleFontSize * 0.7)}px`,
                            transform: `translate(${clamp(coverSubtitleXOffset) * 0.4}px, ${clamp(coverSubtitleYOffset) * 0.4}px) rotate(${coverSubtitleAngle}deg)`,
                          }}
                        >
                          {coverSubtitle || "CATÁLOGO EXCLUSIVO B2B"}
                        </p>
                      </div>
                      <div
                        className="absolute bottom-6 left-0 right-0 text-center transition-all"
                        style={{
                          color: coverFooterColor || (hasCoverBg ? "rgba(255,255,255,0.55)" : "#999"),
                          fontSize: `${Math.round(coverFooterFontSize * 0.75)}px`,
                          transform: `translateY(${clamp(coverFooterYOffset) * 0.4}px)`,
                        }}
                      >
                        {footerText || "Allvino Importadora de Vinhos B2B"}
                      </div>
                    </div>
                  )}

                  {/* ── PRODUCT PREVIEW ACCORDING TO PRESET ── */}
                  {previewTab === "product" && (
                    <div
                      className="h-full flex flex-col items-center justify-between px-8 relative overflow-hidden"
                      style={{ paddingTop: `${productPagePadding * 0.7}px`, paddingBottom: `${productPagePadding * 0.7}px` }}
                    >
                      {/* Product Header */}
                      <div
                        className="text-center w-full pt-2 flex-shrink-0 transition-transform duration-150"
                        style={{ transform: `translate(${clamp(productNameXOffset) * 0.4}px, ${clamp(productNameYOffset) * 0.4}px)` }}
                      >
                        <h2
                          className="font-bold mb-1 transition-all leading-tight"
                          style={{
                            color: resolvedProductNameColor,
                            fontFamily: previewFont,
                            fontSize: `${Math.round(productNameFontSize * 0.65)}px`,
                          }}
                        >
                          {previewWine.name}
                        </h2>
                        <p
                          className="uppercase tracking-[3px] font-semibold transition-all"
                          style={{
                            color: resolvedProductSpecsColor,
                            fontSize: `${Math.round(productSpecsFontSize * 0.8)}px`,
                            transform: `translateY(${clamp(productOriginYOffset) * 0.4}px)`,
                          }}
                        >
                          {previewWine.paisOrigem} · {previewWine.regiao}
                        </p>
                        <div
                          className="w-10 h-px mx-auto my-2"
                          style={{ background: resolvedProductSpecsColor }}
                        />
                      </div>

                      {/* ── SIDE-BY-SIDE MAGAZINE LAYOUT ── */}
                      {(productLayoutPreset === "side-right" || productLayoutPreset === "side-left") ? (
                        <div
                          className={`flex-1 w-full flex items-center justify-between gap-4 py-2 relative min-h-0 overflow-visible ${
                            productLayoutPreset === "side-left" ? "flex-row-reverse" : "flex-row"
                          }`}
                        >
                          {/* Bottle Column */}
                          <div
                            className="w-1/2 h-full flex items-center justify-center transition-transform duration-150"
                            style={{
                              transform: `translate(${clamp(productImgXOffset) * 0.4}px, ${clamp(productImgYOffset) * 0.4}px) rotate(${productImgAngle}deg)`,
                            }}
                          >
                            <img
                              src={previewWine.imagemUrl}
                              alt={previewWine.name}
                              className="object-contain h-full transition-all duration-150"
                              style={{
                                maxHeight: `${Math.round(productImgHeight * 0.45)}px`,
                                maxWidth: "100%",
                                filter: "drop-shadow(0 8px 20px rgba(0,0,0,.12))",
                              }}
                            />
                          </div>

                          {/* Content Column (Specs + Tasting Notes) */}
                          <div className="w-1/2 flex flex-col justify-center gap-3">
                            {/* Tasting Notes & Specs */}
                            <div
                              className="transition-transform duration-150"
                              style={{
                                transform: `translate(${clamp(productDescXOffset) * 0.4}px, ${clamp(productDescYOffset, -100, 100) * 0.4}px) rotate(${productDescAngle}deg)`,
                                textAlign: productDescAlign,
                              }}
                            >
                              <p
                                className="uppercase tracking-wider mb-1 font-semibold"
                                style={{
                                  color: resolvedProductSpecsColor,
                                  fontSize: `${Math.round(productSpecsFontSize * 0.75)}px`,
                                }}
                              >
                                {previewWine.vinicola} · {previewWine.uva} · Safra {previewWine.safra} · {previewWine.teorAlcoolico}% vol
                              </p>
                              <p
                                className="leading-relaxed transition-all"
                                style={{
                                  color: resolvedProductDescColor,
                                  fontWeight: 400,
                                  fontSize: `${Math.round(productDescFontSize * 0.68)}px`,
                                }}
                              >
                                {previewWineDesc}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* ── CLASSIC & PRICE-TOP LAYOUTS ── */
                        <>
                          <div className="flex-1 w-full flex items-center justify-center py-1 relative min-h-0 overflow-visible">
                            <div
                              className="flex items-center justify-center h-full transition-transform duration-150"
                              style={{
                                transform: `translate(${clamp(productImgXOffset) * 0.4}px, ${clamp(productImgYOffset) * 0.4}px) rotate(${productImgAngle}deg)`,
                              }}
                            >
                              <img
                                src={previewWine.imagemUrl}
                                alt={previewWine.name}
                                className="object-contain h-full transition-all duration-150"
                                style={{
                                  maxHeight: `${Math.round(productImgHeight * 0.45)}px`,
                                  maxWidth: `${Math.round(productImgHeight * 0.23)}px`,
                                  filter: "drop-shadow(0 8px 20px rgba(0,0,0,.12))",
                                }}
                              />
                            </div>
                          </div>

                          {/* Details: Specs & Tasting Description */}
                          <div
                            className="text-center w-full flex-shrink-0 my-1 transition-transform duration-150"
                            style={{
                              maxWidth: `${Math.round(productTextMaxWidth * 0.75)}px`,
                              transform: `translate(${clamp(productDescXOffset) * 0.4}px, ${clamp(productDescYOffset, -100, 100) * 0.4}px) rotate(${productDescAngle}deg)`,
                              textAlign: productDescAlign,
                            }}
                          >
                            <p
                              className="uppercase tracking-wider mb-1 transition-all"
                              style={{
                                color: resolvedProductSpecsColor,
                                fontSize: `${Math.round(productSpecsFontSize * 0.75)}px`,
                              }}
                            >
                              {previewWine.vinicola} · {previewWine.uva} · Safra {previewWine.safra} · {previewWine.teorAlcoolico}% vol
                            </p>
                            <p
                              className="leading-relaxed transition-all"
                              style={{
                                color: resolvedProductDescColor,
                                fontWeight: 400,
                                fontSize: `${Math.round(productDescFontSize * 0.7)}px`,
                              }}
                            >
                              {previewWineDesc}
                            </p>
                          </div>
                        </>
                      )}

                      {/* ── 100% AUTONOMOUS FREE PRICE ELEMENT OVERLAY ── */}
                      <div
                        className="absolute z-20 transition-all whitespace-nowrap"
                        style={{
                          left: `calc(50% + ${clamp(productPriceXOffset, -350, 350) * 0.4}px)`,
                          top: `calc(45% + ${clamp(productPriceYOffset, -450, 450) * 0.4}px)`,
                          transform: `translate(-50%, -50%) rotate(${productPriceAngle}deg)`,
                          textAlign: productPriceSide === "left" ? "right" : productPriceSide === "center" ? "center" : "left",
                        }}
                      >
                        <p
                          className="uppercase tracking-[1.5px] font-bold mb-0.5"
                          style={{ color: resolvedProductPriceLabelColor, fontSize: `${Math.round(productPriceLabelFontSize * 0.65)}px` }}
                        >
                          Preço Unitário B2B
                        </p>
                        <p
                          className="font-semibold mb-1"
                          style={{ color: resolvedProductPriceInfoColor, fontSize: `${Math.round(productPriceInfoFontSize * 0.65)}px` }}
                        >
                          Caixa c/ 6 garrafas
                        </p>
                        <div className={`flex items-baseline gap-1.5 ${productPriceSide === "center" ? "justify-center" : productPriceSide === "left" ? "justify-end" : "justify-start"}`}>
                          <span
                            className="font-extrabold"
                            style={{ color: resolvedProductPriceColor, fontSize: `${Math.round(productPriceValueFontSize * 0.65)}px` }}
                          >
                            R$ {(previewWine.precoPromocional || previewWine.precoOriginal).toFixed(2)}
                          </span>
                          {previewWine.precoPromocional && (
                            <span className="text-gray-400 line-through text-[9px]">
                              R$ {previewWine.precoOriginal.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Footer */}
                      <div
                        className="w-full border-t pt-2 pb-1 flex justify-between text-[6.5px] text-gray-300 flex-shrink-0"
                        style={{ borderColor: "#eee" }}
                      >
                        <span>
                          {footerText ||
                            "Allvino Importadora de Vinhos B2B"}
                        </span>
                        <span>Página 2</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
