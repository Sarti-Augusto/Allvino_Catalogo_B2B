"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getCountryFlagUrl } from "@/lib/utils";
import { DraggablePreviewElement } from "@/components/admin/template-editor/draggable-preview-element";

type ProductLayoutPreset =
  | "classic"
  | "side-right"
  | "side-left"
  | "price-top"
  | "editorial-duo"
  | "commercial-grid"
  | "executive-table";

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
  showCoverLogo?: boolean;
  showCoverDivider?: boolean;
  showCoverTitle?: boolean;
  showCoverSubtitle?: boolean;
  showCoverFooter?: boolean;
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
  coverFooterXOffset?: number;
  coverFooterYOffset?: number;
  coverVerticalOffset?: number;

  // Layout Presets & Angles:
  productLayoutPreset?: ProductLayoutPreset;
  productDescAngle?: number;
  productDescAlign?: "left" | "center" | "right" | "justify";
  productPriceAngle?: number;

  // Product page fine-tuning:
  showProductName?: boolean;
  showProductOrigin?: boolean;
  showProductDivider?: boolean;
  showProductBottle?: boolean;
  showProductSpecs?: boolean;
  showProductDescription?: boolean;
  showProductPrice?: boolean;
  showProductFooter?: boolean;
  showProductBoxPrice?: boolean;
  showProductCategoryBadge?: boolean;
  showProductDiscountBadge?: boolean;
  showProductCountryFlag?: boolean;
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

  // Background Harmonization & Card Surface Controls
  productCardSurfaceMode?: "auto" | "transparent" | "tinted-glass" | "solid";
  productCardOpacity?: number;

  // Clean Editorial / Structural Lines & Custom Labels Controls
  showProductPageHeader?: boolean;
  showProductCardBorder?: boolean;
  showProductInternalLines?: boolean;
  showProductPillBorders?: boolean;
  showProductPriceLabel?: boolean;
  showProductPriceInfo?: boolean;
  productPriceLabelText?: string;
  productPriceInfoText?: string;
  productPageHeaderLeftText?: string;
  productPageHeaderRightText?: string;
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
  categoria?: string;
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
  categoria: "Tinto",
  imagemUrl:
    "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=300&auto=format&fit=crop",
  notasDegustacao: "Notas complexas de frutas negras, fumo de corda, cacau e couro. Corpo encorpado, taninos aveludados e final persistente.",
};

const SOMMELIER_COLOR_PALETTES = [
  {
    name: "Vinous Elegance (Design System)",
    primary: "#390009",
    secondary: "#735c00",
    background: "#fcf9f8",
    text: "#1c1b1b",
  },
  {
    name: "Clássico Allvino Bordeaux",
    primary: "#80282d",
    secondary: "#c5a880",
    background: "#ffffff",
    text: "#1f2937",
  },
  {
    name: "Reserva Noturna (Dark Gold)",
    primary: "#e9c349",
    secondary: "#c5a880",
    background: "#161314",
    text: "#f3f0ef",
  },
  {
    name: "Terroir Oliva & Ouro",
    primary: "#2d3a2e",
    secondary: "#b48d56",
    background: "#faf9f5",
    text: "#1f2421",
  },
];

const clamp = (val: any, min: number = -450, max: number = 450): number => {
  const num = typeof val === "number" ? val : parseFloat(val);
  if (isNaN(num)) return 0;
  return Math.max(min, Math.min(max, num));
};

const colorInputValue = (value: string, fallback: string) =>
  /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value) ? value : fallback;

const rgbToHex = (r: number, g: number, b: number): string => {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const hexToRgba = (hex: string, alpha: number): string => {
  const cleaned = hex.trim().replace(/^#/, "");
  const safeAlpha = Math.max(0, Math.min(1, Number(alpha.toFixed(3))));
  if (safeAlpha === 0) return "transparent";
  if (/^[0-9a-f]{3}$/i.test(cleaned)) {
    const r = parseInt(cleaned[0] + cleaned[0], 16);
    const g = parseInt(cleaned[1] + cleaned[1], 16);
    const b = parseInt(cleaned[2] + cleaned[2], 16);
    return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`;
  }
  if (/^[0-9a-f]{6}$/i.test(cleaned)) {
    const r = parseInt(cleaned.slice(0, 2), 16);
    const g = parseInt(cleaned.slice(2, 4), 16);
    const b = parseInt(cleaned.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`;
  }
  return `rgba(244, 239, 230, ${safeAlpha})`;
};

interface ExtractedImagePalette {
  dominantBgHex: string;
  suggestedPrimaryHex: string;
  suggestedSecondaryHex: string;
  suggestedTextHex: string;
  swatches: string[];
  isDarkBackground: boolean;
}

function extractPaletteFromLoadedImage(image: HTMLImageElement): ExtractedImagePalette | null {
  try {
    const sampleSize = 48;
    const canvas = document.createElement("canvas");
    canvas.width = sampleSize;
    canvas.height = sampleSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(image, 0, 0, sampleSize, sampleSize);
    const { data } = ctx.getImageData(0, 0, sampleSize, sampleSize);

    let rSum = 0;
    let gSum = 0;
    let bSum = 0;
    let count = 0;

    // Group pixels into 5 luminance/saturation buckets
    const buckets: Array<{ r: number; g: number; b: number; n: number }> = [
      { r: 0, g: 0, b: 0, n: 0 }, // Lightest paper/surface
      { r: 0, g: 0, b: 0, n: 0 }, // Mid-light warm tone
      { r: 0, g: 0, b: 0, n: 0 }, // Accent / Gold / Saturated mid
      { r: 0, g: 0, b: 0, n: 0 }, // Deep primary / Wine / Wood
      { r: 0, g: 0, b: 0, n: 0 }, // Darkest contrast
    ];

    for (let y = 0; y < sampleSize; y++) {
      for (let x = 0; x < sampleSize; x++) {
        const idx = (y * sampleSize + x) * 4;
        const a = data[idx + 3];
        if (a < 128) continue;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // Focus inner canvas area (where product cards sit) for dominant background
        if (x >= 8 && x <= 40 && y >= 8 && y <= 40) {
          rSum += r;
          gSum += g;
          bSum += b;
          count++;
        }

        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        const maxC = Math.max(r, g, b);
        const minC = Math.min(r, g, b);
        const sat = maxC === 0 ? 0 : (maxC - minC) / maxC;

        let bIdx = 0;
        if (lum > 205) bIdx = 0;
        else if (lum > 155 && sat < 0.35) bIdx = 1;
        else if (sat >= 0.25 && lum >= 75) bIdx = 2;
        else if (lum >= 45) bIdx = 3;
        else bIdx = 4;

        buckets[bIdx].r += r;
        buckets[bIdx].g += g;
        buckets[bIdx].b += b;
        buckets[bIdx].n += 1;
      }
    }

    if (count === 0) return null;

    const avgR = rSum / count;
    const avgG = gSum / count;
    const avgB = bSum / count;
    const avgLum = 0.299 * avgR + 0.587 * avgG + 0.114 * avgB;
    const isDarkBackground = avgLum < 115;

    // If inner background is light, prefer the dominant light paper bucket blended with average
    const paperBucket = isDarkBackground ? buckets[4] : buckets[0].n > 20 ? buckets[0] : buckets[1];
    const domR = paperBucket.n > 10 ? (paperBucket.r / paperBucket.n) * 0.65 + avgR * 0.35 : avgR;
    const domG = paperBucket.n > 10 ? (paperBucket.g / paperBucket.n) * 0.65 + avgG * 0.35 : avgG;
    const domB = paperBucket.n > 10 ? (paperBucket.b / paperBucket.n) * 0.65 + avgB * 0.35 : avgB;
    const dominantBgHex = rgbToHex(domR, domG, domB);

    const swatches = buckets
      .filter((b) => b.n > 0)
      .map((b) => rgbToHex(b.r / b.n, b.g / b.n, b.b / b.n));

    const uniqueSwatches = Array.from(new Set([dominantBgHex, ...swatches])).slice(0, 5);
    const accentHex =
      buckets[2].n > 5
        ? rgbToHex(buckets[2].r / buckets[2].n, buckets[2].g / buckets[2].n, buckets[2].b / buckets[2].n)
        : "#b48d56";
    const deepHex =
      buckets[3].n > 5
        ? rgbToHex(buckets[3].r / buckets[3].n, buckets[3].g / buckets[3].n, buckets[3].b / buckets[3].n)
        : "#58111a";

    return {
      dominantBgHex,
      suggestedPrimaryHex: isDarkBackground ? accentHex : deepHex,
      suggestedSecondaryHex: accentHex,
      suggestedTextHex: isDarkBackground ? "#f5f2eb" : "#221d1a",
      swatches: uniqueSwatches,
      isDarkBackground,
    };
  } catch {
    return null;
  }
}

function VisibilityToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 rounded-lg border border-allvino-outline-variant/40 bg-allvino-surface-container-low px-2.5 py-2 text-[10px] font-semibold cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-allvino-outline-variant text-allvino-primary focus:ring-allvino-primary"
      />
      <span>{label}</span>
    </label>
  );
}

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  
  // Registered Wines from database for real preview
  const [dbWines, setDbWines] = useState<Product[]>([]);
  const [selectedWineId, setSelectedWineId] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [testingPdf, setTestingPdf] = useState(false);

  const handleSignOut = async () => {
    await createClient().auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  };

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
  const [footerText, setFooterText] = useState("Allvino Importadora de Vinhos B2B");
  const [backgroundImageUrl, setBackgroundImageUrl] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");

  // Layout Presets & Angles
  const [showProductName, setShowProductName] = useState(true);
  const [showProductOrigin, setShowProductOrigin] = useState(true);
  const [showProductDivider, setShowProductDivider] = useState(true);
  const [showProductBottle, setShowProductBottle] = useState(true);
  const [showProductSpecs, setShowProductSpecs] = useState(true);
  const [showProductDescription, setShowProductDescription] = useState(true);
  const [showProductPrice, setShowProductPrice] = useState(true);
  const [showProductFooter, setShowProductFooter] = useState(true);
  const [showProductBoxPrice, setShowProductBoxPrice] = useState(true);
  const [showProductCategoryBadge, setShowProductCategoryBadge] = useState(true);
  const [showProductDiscountBadge, setShowProductDiscountBadge] = useState(true);
  const [showProductCountryFlag, setShowProductCountryFlag] = useState(true);
  const [productLayoutPreset, setProductLayoutPreset] = useState<ProductLayoutPreset>("classic");
  const [productDescAngle, setProductDescAngle] = useState(0);
  const [productDescAlign, setProductDescAlign] = useState<"left" | "center" | "right" | "justify">("center");
  const [productPriceAngle, setProductPriceAngle] = useState(0);

  // Cover Fine-Tuning State
  const [showCoverLogo, setShowCoverLogo] = useState(true);
  const [showCoverDivider, setShowCoverDivider] = useState(true);
  const [showCoverTitle, setShowCoverTitle] = useState(true);
  const [showCoverSubtitle, setShowCoverSubtitle] = useState(true);
  const [showCoverFooter, setShowCoverFooter] = useState(true);
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
  const [coverFooterXOffset, setCoverFooterXOffset] = useState(0);
  const [coverFooterYOffset, setCoverFooterYOffset] = useState(0);
  const [coverVerticalOffset, setCoverVerticalOffset] = useState(0);
  const [showSafetyGuides, setShowSafetyGuides] = useState(true);

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

  // Background Harmonization & Card Surface State
  const [productCardSurfaceMode, setProductCardSurfaceMode] = useState<
    "auto" | "transparent" | "tinted-glass" | "solid"
  >("auto");
  const [productCardOpacity, setProductCardOpacity] = useState<number>(18);
  const [extractedArtPalette, setExtractedArtPalette] = useState<ExtractedImagePalette | null>(null);

  // Clean Editorial / Structural Lines & Custom Labels State
  const [showProductPageHeader, setShowProductPageHeader] = useState(true);
  const [showProductCardBorder, setShowProductCardBorder] = useState(true);
  const [showProductInternalLines, setShowProductInternalLines] = useState(true);
  const [showProductPillBorders, setShowProductPillBorders] = useState(true);
  const [showProductPriceLabel, setShowProductPriceLabel] = useState(true);
  const [showProductPriceInfo, setShowProductPriceInfo] = useState(true);
  const [productPriceLabelText, setProductPriceLabelText] = useState("Preço Unitário B2B");
  const [productPriceInfoText, setProductPriceInfoText] = useState("");
  const [productPageHeaderLeftText, setProductPageHeaderLeftText] = useState("CATÁLOGO DE VINHOS");
  const [productPageHeaderRightText, setProductPageHeaderRightText] = useState("CATÁLOGO EXCLUSIVO B2B");

  // Preview tab ("cover" | "index" | "product")
  const [previewTab, setPreviewTab] = useState<"cover" | "index" | "product">("product");
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(0.72);
  const [selectedPreviewElement, setSelectedPreviewElement] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Undo / Redo History Stack
  const [historyStack, setHistoryStack] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const isApplyingHistoryRef = useRef(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  // Select preview element AND auto-sync the left sidebar tab
  const handleSelectPreviewElement = (elementId: string | null) => {
    setSelectedPreviewElement(elementId);
    if (!elementId) return;
    if (elementId.startsWith("cover-")) {
      setActiveTab("cover");
      setPreviewTab("cover");
    } else if (elementId === "product-bottle") {
      setActiveTab("bottle");
    } else if (elementId === "product-price") {
      setActiveTab("price");
    } else if (elementId === "product-header" || elementId === "product-description") {
      setActiveTab("text");
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchWines();
  }, []);

  // Automatically extract color palette from existing or newly loaded backgroundImageUrl
  useEffect(() => {
    if (!backgroundImageUrl) {
      setExtractedArtPalette(null);
      return;
    }

    let cancelled = false;
    const img = new Image();
    if (!backgroundImageUrl.startsWith("data:")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => {
      if (cancelled) return;
      const palette = extractPaletteFromLoadedImage(img);
      if (palette) {
        setExtractedArtPalette(palette);
      }
    };
    img.onerror = () => {
      if (!cancelled) setExtractedArtPalette(null);
    };
    img.src = backgroundImageUrl;

    return () => {
      cancelled = true;
    };
  }, [backgroundImageUrl]);

  useEffect(() => {
    const element = previewRef.current;
    if (!element || typeof ResizeObserver === "undefined") return;

    const updateScale = () => {
      const width = element.getBoundingClientRect().width;
      if (width > 0) setPreviewScale(width / 793.7);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isDirty) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [isDirty]);

  useEffect(() => {
    const visibleByElement: Record<string, boolean> = {
      "cover-logo": showCoverLogo,
      "cover-title": showCoverTitle,
      "cover-subtitle": showCoverSubtitle,
      "cover-footer": showCoverFooter,
      "product-header": showProductName || showProductOrigin || showProductDivider,
      "product-bottle": showProductBottle,
      "product-description": showProductSpecs || showProductDescription,
      "product-price": showProductPrice,
    };
    if (selectedPreviewElement && !visibleByElement[selectedPreviewElement]) {
      setSelectedPreviewElement(null);
    }
  }, [
    selectedPreviewElement,
    showCoverFooter,
    showCoverLogo,
    showCoverSubtitle,
    showCoverTitle,
    showProductBottle,
    showProductDescription,
    showProductDivider,
    showProductName,
    showProductOrigin,
    showProductPrice,
    showProductSpecs,
  ]);

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

  const fetchTemplates = async (preferredTemplateId?: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
        const preferred = preferredTemplateId
          ? data.find((t: Template) => t.id === preferredTemplateId)
          : undefined;
        const nextTemplate = preferred || data.find((t: Template) => t.isActive) || data[0];
        if (nextTemplate) {
          applyTemplate(nextTemplate);
          setIsDirty(false);
        }
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
    if (!window.confirm("Centralizar todos os elementos da capa e das páginas de produto?")) return;
    setCoverLogoXOffset(0);
    setCoverLogoYOffset(0);
    setCoverTitleXOffset(0);
    setCoverTitleYOffset(0);
    setCoverSubtitleXOffset(0);
    setCoverSubtitleYOffset(0);
    setCoverFooterXOffset(0);
    setCoverFooterYOffset(0);
    setCoverVerticalOffset(0);
    setCoverLogoAngle(0);
    setCoverTitleAngle(0);
    setCoverSubtitleAngle(0);

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

    setSelectedPreviewElement(null);
    setIsDirty(true);
    showToast("Posições e ângulos centralizados. Salve para aplicar.");
  };

  const applyStylesObject = (s: TemplateStyles) => {
    setPrimaryColor(s.primaryColor || "#80282d");
    setSecondaryColor(s.secondaryColor || "#c5a880");
    setBackgroundColor(s.backgroundColor || "#ffffff");
    setTextColor(s.textColor || "#1f2937");
    setFontFamily(s.fontFamily || "Playfair Display");
    setHeaderTitle(typeof s.headerTitle === "string" ? s.headerTitle : "CATÁLOGO DE VINHOS");
    setFooterText(typeof s.footerText === "string" ? s.footerText : "Allvino Importadora de Vinhos B2B");
    setBackgroundImageUrl(s.backgroundImageUrl || "");
    setCoverImageUrl(s.coverImageUrl || "");

    // Presets & Angles
    setShowProductName(s.showProductName !== false);
    setShowProductOrigin(s.showProductOrigin !== false);
    setShowProductDivider(s.showProductDivider !== false);
    setShowProductBottle(s.showProductBottle !== false);
    setShowProductSpecs(s.showProductSpecs !== false);
    setShowProductDescription(s.showProductDescription !== false);
    setShowProductPrice(s.showProductPrice !== false);
    setShowProductFooter(s.showProductFooter !== false);
    setShowProductBoxPrice(s.showProductBoxPrice !== false);
    setShowProductCategoryBadge(s.showProductCategoryBadge !== false);
    setShowProductDiscountBadge(s.showProductDiscountBadge !== false);
    setShowProductCountryFlag(s.showProductCountryFlag !== false);
    setShowProductPageHeader(s.showProductPageHeader !== false);
    setShowProductCardBorder(
      typeof s.showProductCardBorder === "boolean"
        ? s.showProductCardBorder
        : !s.backgroundImageUrl,
    );
    setShowProductInternalLines(s.showProductInternalLines !== false);
    setShowProductPillBorders(s.showProductPillBorders !== false);
    setShowProductPriceLabel(s.showProductPriceLabel !== false);
    setShowProductPriceInfo(s.showProductPriceInfo !== false);
    setProductPriceLabelText(
      typeof s.productPriceLabelText === "string" ? s.productPriceLabelText : "Preço Unitário B2B",
    );
    setProductPriceInfoText(typeof s.productPriceInfoText === "string" ? s.productPriceInfoText : "");
    const resolvedHeader = typeof s.headerTitle === "string" ? s.headerTitle : "CATÁLOGO DE VINHOS";
    const resolvedSub = typeof s.coverSubtitle === "string" ? s.coverSubtitle : "CATÁLOGO EXCLUSIVO B2B";
    setProductPageHeaderLeftText(
      typeof s.productPageHeaderLeftText === "string" ? s.productPageHeaderLeftText : resolvedHeader,
    );
    setProductPageHeaderRightText(
      typeof s.productPageHeaderRightText === "string" ? s.productPageHeaderRightText : resolvedSub,
    );
    setProductLayoutPreset(s.productLayoutPreset || "classic");
    setProductDescAngle(typeof s.productDescAngle === "number" ? s.productDescAngle : 0);
    setProductDescAlign(s.productDescAlign || "center");
    setProductPriceAngle(typeof s.productPriceAngle === "number" ? s.productPriceAngle : 0);

    // Cover
    setShowCoverLogo(s.showCoverLogo !== false);
    setShowCoverDivider(s.showCoverDivider !== false);
    setShowCoverTitle(s.showCoverTitle !== false);
    setShowCoverSubtitle(s.showCoverSubtitle !== false);
    setShowCoverFooter(s.showCoverFooter !== false);
    setCoverSubtitle(
      typeof s.coverSubtitle === "string" ? s.coverSubtitle : "CATÁLOGO EXCLUSIVO B2B",
    );
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
    setCoverFooterXOffset(clamp(s.coverFooterXOffset));
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

    // Background Harmonization & Card Surface
    setProductCardSurfaceMode(
      s.productCardSurfaceMode &&
        ["auto", "transparent", "tinted-glass", "solid"].includes(s.productCardSurfaceMode)
        ? s.productCardSurfaceMode
        : "auto",
    );
    setProductCardOpacity(
      typeof s.productCardOpacity === "number"
        ? clamp(s.productCardOpacity, 0, 100)
        : s.backgroundImageUrl
        ? 14
        : 88,
    );
  };

  const applyTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setNome(template.nome);
    setIsActive(template.isActive);
    try {
      const s: TemplateStyles = JSON.parse(template.cssStyles);
      isApplyingHistoryRef.current = true;
      applyStylesObject(s);
      setHistoryStack([JSON.stringify(s)]);
      setHistoryIndex(0);
      setTimeout(() => {
        isApplyingHistoryRef.current = false;
      }, 50);
    } catch {
      console.error("Erro ao interpretar estilos do template.");
    }
  };

  const handleSelectTemplate = (template: Template) => {
    if (template.id === selectedTemplate?.id) return;
    if (isDirty && !window.confirm("Existem alterações não salvas. Deseja descartá-las e trocar de template?")) {
      return;
    }
    applyTemplate(template);
    setSelectedPreviewElement(null);
    setIsDirty(false);
  };

  const discardUnsavedChanges = () => {
    if (!selectedTemplate || !isDirty) return;
    if (!window.confirm("Descartar todas as alterações feitas desde o último salvamento?")) return;
    applyTemplate(selectedTemplate);
    setSelectedPreviewElement(null);
    setIsDirty(false);
    showToast("Alterações não salvas descartadas.");
  };

  const getCurrentStyles = (): TemplateStyles => ({
    primaryColor,
    secondaryColor,
    backgroundColor,
    textColor,
    fontFamily,
    headerTitle,
    footerText,
    backgroundImageUrl,
    coverImageUrl,
    showProductName,
    showProductOrigin,
    showProductDivider,
    showProductBottle,
    showProductSpecs,
    showProductDescription,
    showProductPrice,
    showProductFooter,
    showProductBoxPrice,
    showProductCategoryBadge,
    showProductDiscountBadge,
    showProductCountryFlag,
    productLayoutPreset,
    productDescAngle,
    productDescAlign,
    productPriceAngle,
    coverSubtitle,
    showCoverLogo,
    showCoverDivider,
    showCoverTitle,
    showCoverSubtitle,
    showCoverFooter,
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
    coverFooterXOffset: clamp(coverFooterXOffset),
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
    productCardSurfaceMode,
    productCardOpacity: clamp(productCardOpacity, 0, 100),
    showProductPageHeader,
    showProductCardBorder,
    showProductInternalLines,
    showProductPillBorders,
    showProductPriceLabel,
    showProductPriceInfo,
    productPriceLabelText,
    productPriceInfoText,
    productPageHeaderLeftText,
    productPageHeaderRightText,
  });

  // Track changes in history stack for Undo/Redo (debounced)
  const serializedCurrentStyles = JSON.stringify(getCurrentStyles());
  useEffect(() => {
    if (loading || !selectedTemplate || isApplyingHistoryRef.current) return;
    const timer = window.setTimeout(() => {
      setHistoryStack((prev) => {
        const currentAtIdx = prev[historyIndex];
        if (currentAtIdx === serializedCurrentStyles) return prev;
        const next = prev.slice(0, historyIndex + 1);
        next.push(serializedCurrentStyles);
        const trimmed = next.length > 35 ? next.slice(next.length - 35) : next;
        setHistoryIndex(trimmed.length - 1);
        return trimmed;
      });
    }, 280);
    return () => window.clearTimeout(timer);
  }, [serializedCurrentStyles, loading, selectedTemplate, historyIndex]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex >= 0 && historyIndex < historyStack.length - 1;

  const handleUndo = () => {
    if (!canUndo) return;
    const targetIdx = historyIndex - 1;
    try {
      const snapshot = JSON.parse(historyStack[targetIdx]) as TemplateStyles;
      isApplyingHistoryRef.current = true;
      applyStylesObject(snapshot);
      setHistoryIndex(targetIdx);
      setIsDirty(true);
      window.setTimeout(() => {
        isApplyingHistoryRef.current = false;
      }, 60);
    } catch {
      // ignore invalid snapshot
    }
  };

  const handleRedo = () => {
    if (!canRedo) return;
    const targetIdx = historyIndex + 1;
    try {
      const snapshot = JSON.parse(historyStack[targetIdx]) as TemplateStyles;
      isApplyingHistoryRef.current = true;
      applyStylesObject(snapshot);
      setHistoryIndex(targetIdx);
      setIsDirty(true);
      window.setTimeout(() => {
        isApplyingHistoryRef.current = false;
      }, 60);
    } catch {
      // ignore invalid snapshot
    }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        if (event.shiftKey) {
          event.preventDefault();
          handleRedo();
        } else {
          event.preventDefault();
          handleUndo();
        }
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
        event.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate || selectedTemplate.isActive || deleting) return;
    if (!window.confirm(`Tem certeza que deseja excluir permanentemente o template "${selectedTemplate.nome}"?`)) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/templates/${selectedTemplate.id}`, {
        method: "DELETE",
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        showToast(body?.error || "Não foi possível excluir o template.", "error");
        return;
      }
      showToast("Template excluído com sucesso.");
      setIsDirty(false);
      await fetchTemplates();
    } catch {
      showToast("Erro de conexão ao excluir o template.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleTestDraftPdf = async () => {
    if (testingPdf) return;
    setTestingPdf(true);
    try {
      const limitCount =
        productLayoutPreset === "executive-table"
          ? 12
          : productLayoutPreset === "commercial-grid"
          ? 4
          : productLayoutPreset === "editorial-duo"
          ? 2
          : 2;
      const res = await fetch("/api/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          limit: limitCount,
          includeIndex: true,
          previewStyles: getCurrentStyles(),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        showToast(body?.error || "Não foi possível gerar o PDF de teste.", "error");
        return;
      }
      const pdfBlob = await res.blob();
      const blobUrl = URL.createObjectURL(pdfBlob);
      window.open(blobUrl, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
      showToast("PDF de teste gerado com os ajustes atuais da tela!");
    } catch {
      showToast("Falha ao gerar o PDF de teste.", "error");
    } finally {
      setTestingPdf(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;
    setSaving(true);

    const payload = {
      nome,
      isActive,
      cssStyles: JSON.stringify(getCurrentStyles()),
    };

    try {
      const res = await fetch(`/api/templates/${selectedTemplate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showToast("Template salvo com sucesso!");
        await fetchTemplates(selectedTemplate.id);
      } else {
        const errorBody = await res.json().catch(() => null);
        showToast(errorBody?.error || "Falha ao salvar o template.", "error");
      }
    } catch {
      showToast("Não foi possível conectar ao servidor para salvar o template.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = (
    file: File | undefined,
    setter: (val: string) => void,
    imageLabel: string,
    isProductPageBackground = false,
  ) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast(`Selecione um arquivo de imagem para ${imageLabel}.`, "error");
      return;
    }

    const maxFileSize = 8 * 1024 * 1024;
    if (file.size > maxFileSize) {
      showToast(`${imageLabel} deve ter no máximo 8 MB.`, "error");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      try {
        const maxWidth = 1600;
        const maxHeight = 2260;
        const ratio = Math.min(1, maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
        const context = canvas.getContext("2d");
        if (!context) throw new Error("CANVAS_UNAVAILABLE");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        setter(canvas.toDataURL("image/webp", 0.82));

        if (isProductPageBackground) {
          const extracted = extractPaletteFromLoadedImage(image);
          if (extracted) {
            setExtractedArtPalette(extracted);
            setBackgroundColor(extracted.dominantBgHex);
            setProductCardSurfaceMode("auto");
            setProductCardOpacity(14);
            setShowProductCardBorder(false);
            if (extracted.isDarkBackground) {
              setTextColor(extracted.suggestedTextHex);
            }
          }
          setIsDirty(true);
          showToast("Arte de fundo carregada e superfície dos cards harmonizada sem molduras duplas!");
        } else {
          setIsDirty(true);
          showToast(`${imageLabel} otimizada e pronta para salvar.`);
        }
      } catch {
        showToast(`Não foi possível processar ${imageLabel}.`, "error");
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      showToast(`Não foi possível carregar ${imageLabel}.`, "error");
    };
    image.src = objectUrl;
  };

  const handleHarmonizeWithArt = (includeAccentColors = false) => {
    if (!extractedArtPalette) return;
    setBackgroundColor(extractedArtPalette.dominantBgHex);
    setProductCardSurfaceMode("auto");
    setProductCardOpacity(14);
    if (includeAccentColors) {
      setPrimaryColor(extractedArtPalette.suggestedPrimaryHex);
      setSecondaryColor(extractedArtPalette.suggestedSecondaryHex);
      setTextColor(extractedArtPalette.suggestedTextHex);
      setProductNameColor("");
      setProductSpecsColor("");
      setProductDescColor("");
      setProductPriceColor("");
    }
    setIsDirty(true);
    showToast(
      includeAccentColors
        ? "Paleta completa e superfícies harmonizadas com a arte importada!"
        : "Cor de fundo e transparência dos cards harmonizadas com a arte!",
    );
  };

  const handleApplyCleanEditorialMode = () => {
    setShowProductPageHeader(false);
    setShowProductCardBorder(false);
    setShowProductInternalLines(false);
    setShowProductPillBorders(false);
    setShowProductDivider(false);
    setShowProductPriceLabel(false);
    setShowProductPriceInfo(false);
    if (backgroundImageUrl) {
      setProductCardSurfaceMode("transparent");
      setProductCardOpacity(0);
    }
    setIsDirty(true);
    showToast("✨ Modo Limpo Editorial aplicado: linhas estruturais e textos de atacado removidos!");
  };

  const handleRestoreStandardB2BMode = () => {
    setShowProductPageHeader(true);
    setShowProductCardBorder(!backgroundImageUrl);
    setShowProductInternalLines(true);
    setShowProductPillBorders(true);
    setShowProductDivider(true);
    setShowProductPriceLabel(true);
    setShowProductPriceInfo(true);
    if (!productPriceLabelText.trim()) {
      setProductPriceLabelText("Preço Unitário B2B");
    }
    setIsDirty(true);
    showToast("Estrutura comercial B2B restaurada.");
  };

  const handleDuplicateTemplate = async () => {
    if (!selectedTemplate || isDirty) return;
    const duplicateName = window.prompt("Nome da cópia:", `${selectedTemplate.nome} - Cópia`);
    if (duplicateName === null || !duplicateName.trim()) return;

    setDuplicating(true);
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceTemplateId: selectedTemplate.id,
          nome: duplicateName.trim(),
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        showToast(body?.error || "Falha ao duplicar o template.", "error");
        return;
      }
      await fetchTemplates(body.id);
      showToast("Template duplicado. A cópia foi aberta para edição.");
    } catch {
      showToast("Não foi possível conectar ao servidor para duplicar o template.", "error");
    } finally {
      setDuplicating(false);
    }
  };

  const handleExportConfiguration = () => {
    const fileContent = JSON.stringify(
      { version: 1, nome, styles: getCurrentStyles() },
      null,
      2,
    );
    const blobUrl = URL.createObjectURL(new Blob([fileContent], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = blobUrl;
    anchor.download = `${nome.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") || "template"}.json`;
    anchor.click();
    URL.revokeObjectURL(blobUrl);
  };

  const handleImportConfiguration = (file: File | undefined) => {
    if (!file || !selectedTemplate) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as {
          nome?: unknown;
          styles?: unknown;
        } & Record<string, unknown>;
        const importedStyles = parsed.styles ?? parsed;
        if (!importedStyles || typeof importedStyles !== "object" || Array.isArray(importedStyles)) {
          throw new Error("INVALID_TEMPLATE");
        }
        const persistedTemplate = selectedTemplate;
        applyTemplate({
          ...persistedTemplate,
          nome: typeof parsed.nome === "string" && parsed.nome.trim() ? parsed.nome.trim() : nome,
          cssStyles: JSON.stringify(importedStyles),
        });
        setSelectedTemplate(persistedTemplate);
        setIsDirty(true);
        showToast("Configuração importada. Revise a prévia e salve para aplicar.");
      } catch {
        showToast("O arquivo JSON não contém uma configuração de template válida.", "error");
      }
    };
    reader.onerror = () => showToast("Não foi possível ler o arquivo JSON.", "error");
    reader.readAsText(file);
  };

  const hasCoverBg = !!coverImageUrl;

  const previewFont =
    fontFamily === "Inter"
      ? "'Inter', sans-serif"
      : fontFamily === "Cinzel"
      ? "'Cinzel', Georgia, serif"
      : fontFamily === "Cormorant Garamond"
      ? "'Cormorant Garamond', Georgia, serif"
      : fontFamily === "Montserrat"
      ? "'Montserrat', sans-serif"
      : "'Playfair Display', Georgia, serif";

  const resolvedCoverTitleColor = coverTitleColor || (hasCoverBg ? "#ffffff" : primaryColor);
  const resolvedCoverSubColor = coverSubtitleColor || (hasCoverBg ? "rgba(255,255,255,0.78)" : secondaryColor);
  const coverTitlePickerColor = colorInputValue(resolvedCoverTitleColor, hasCoverBg ? "#ffffff" : primaryColor);
  const coverSubtitlePickerColor = colorInputValue(coverSubtitleColor, hasCoverBg ? "#ffffff" : secondaryColor);
  const coverFooterPickerColor = colorInputValue(coverFooterColor, hasCoverBg ? "#ffffff" : "#999999");

  const resolvedProductNameColor = productNameColor || primaryColor;
  const resolvedProductSpecsColor = productSpecsColor || secondaryColor;
  const resolvedProductDescColor = productDescColor || textColor;
  const resolvedProductPriceColor = productPriceColor || primaryColor;
  const resolvedProductPriceLabelColor = productPriceLabelColor || "#777777";
  const resolvedProductPriceInfoColor = productPriceInfoColor || secondaryColor;

  // Harmonized Surface Computation (never pull #ffffff when a background image exists)
  const hasProductBgImage = !!backgroundImageUrl;
  const isDefaultWhiteBg = backgroundColor.toLowerCase() === "#ffffff";
  const effectiveSurfaceHex =
    hasProductBgImage && isDefaultWhiteBg
      ? extractedArtPalette?.dominantBgHex || "#f4efe6"
      : backgroundColor;

  const resolvedCardAlpha =
    productCardSurfaceMode === "transparent"
      ? 0
      : productCardSurfaceMode === "tinted-glass"
      ? clamp(productCardOpacity, 0, 100) / 100
      : productCardSurfaceMode === "solid"
      ? clamp(productCardOpacity, 0, 100) / 100
      : hasProductBgImage
      ? clamp(productCardOpacity, 0, 100) / 100
      : 0.88;

  const cardSurfaceBgCSS = hexToRgba(effectiveSurfaceHex, resolvedCardAlpha);
  const cardSurfaceShadowCSS =
    resolvedCardAlpha <= 0.18 ? "none" : "0 4px 18px rgba(0,0,0,0.04)";
  const specGridBgCSS =
    resolvedCardAlpha === 0
      ? "transparent"
      : hexToRgba(effectiveSurfaceHex, Math.min(0.28, resolvedCardAlpha * 0.75));
  const metaBadgeBgCSS =
    resolvedCardAlpha === 0
      ? hexToRgba(effectiveSurfaceHex, 0.18)
      : hexToRgba(effectiveSurfaceHex, Math.min(0.55, Math.max(0.22, resolvedCardAlpha + 0.12)));
  const secondaryBorderSubtleCSS = hexToRgba(secondaryColor, 0.38);

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

  const previewElementLabels: Record<string, string> = {
    "cover-logo": "Logotipo",
    "cover-title": "Título da capa",
    "cover-subtitle": "Subtítulo da capa",
    "cover-footer": "Rodapé da capa",
    "product-header": "Cabeçalho do produto",
    "product-bottle": "Garrafa",
    "product-description": "Textos do produto",
    "product-price": "Preço B2B",
  };

  const moveSelectedElement = (deltaX: number, deltaY: number) => {
    if (!selectedPreviewElement) return;
    const move = (setter: (value: React.SetStateAction<number>) => void, delta: number) => {
      if (delta !== 0) setter((current) => clamp(current + delta, -450, 450));
    };

    switch (selectedPreviewElement) {
      case "cover-logo":
        move(setCoverLogoXOffset, deltaX);
        move(setCoverLogoYOffset, deltaY);
        break;
      case "cover-title":
        move(setCoverTitleXOffset, deltaX);
        move(setCoverTitleYOffset, deltaY);
        break;
      case "cover-subtitle":
        move(setCoverSubtitleXOffset, deltaX);
        move(setCoverSubtitleYOffset, deltaY);
        break;
      case "cover-footer":
        move(setCoverFooterXOffset, deltaX);
        move(setCoverFooterYOffset, deltaY);
        break;
      case "product-header":
        move(setProductNameXOffset, deltaX);
        move(setProductNameYOffset, deltaY);
        break;
      case "product-bottle":
        move(setProductImgXOffset, deltaX);
        move(setProductImgYOffset, deltaY);
        break;
      case "product-description":
        move(setProductDescXOffset, deltaX);
        if (deltaY !== 0) {
          setProductDescYOffset((current) => clamp(current + deltaY, -150, 150));
        }
        break;
      case "product-price":
        if (deltaX !== 0) {
          setProductPriceXOffset((current) => clamp(current + deltaX, -350, 350));
        }
        move(setProductPriceYOffset, deltaY);
        break;
    }
    setIsDirty(true);
  };

  const resetSelectedElement = () => {
    if (!selectedPreviewElement) return;
    const currentSelection = selectedPreviewElement;
    const resetPair = (
      setX: (value: number) => void,
      setY: (value: number) => void,
    ) => {
      setX(0);
      setY(0);
    };

    switch (currentSelection) {
      case "cover-logo": resetPair(setCoverLogoXOffset, setCoverLogoYOffset); break;
      case "cover-title": resetPair(setCoverTitleXOffset, setCoverTitleYOffset); break;
      case "cover-subtitle": resetPair(setCoverSubtitleXOffset, setCoverSubtitleYOffset); break;
      case "cover-footer": resetPair(setCoverFooterXOffset, setCoverFooterYOffset); break;
      case "product-header": resetPair(setProductNameXOffset, setProductNameYOffset); break;
      case "product-bottle": resetPair(setProductImgXOffset, setProductImgYOffset); break;
      case "product-description": resetPair(setProductDescXOffset, setProductDescYOffset); break;
      case "product-price": resetPair(setProductPriceXOffset, setProductPriceYOffset); break;
    }
    setIsDirty(true);
    showToast(`${previewElementLabels[currentSelection]} centralizado. Salve para aplicar.`);
  };

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
                onClick={handleSignOut}
                className="px-4 py-1.5 rounded bg-allvino-surface-container-high hover:bg-allvino-primary hover:text-white border border-allvino-outline-variant hover:border-allvino-primary transition text-xs font-semibold"
              >
                Sair
              </button>
            </div>
          </div>
          <div className="flex md:hidden space-x-2 pb-3 border-t border-allvino-outline-variant/20 pt-2">
            <Link
              href="/admin/dashboard"
              className="flex-1 text-center px-3 py-1.5 rounded-md text-xs font-semibold bg-allvino-surface-container-high text-allvino-on-surface-variant"
            >
              Vinhos
            </Link>
            <Link
              href="/admin/templates"
              className="flex-1 text-center px-3 py-1.5 rounded-md text-xs font-bold bg-allvino-primary text-white"
            >
              Editor de Templates
            </Link>
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

        {selectedTemplate ? (
          <div className="fixed bottom-4 left-4 right-4 z-50 flex items-center justify-between gap-3 rounded-xl border border-allvino-outline-variant/40 bg-white/95 px-4 py-3 shadow-2xl backdrop-blur md:left-auto md:right-6 md:w-[390px]">
            <div>
              <p className="text-xs font-bold text-allvino-primary">
                {isDirty ? "Alterações pendentes" : "Configurações salvas"}
              </p>
              <p className="text-[9px] text-allvino-on-surface-variant">
                {isActive ? "Será publicado como template ativo." : "Será mantido como rascunho inativo."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={saving || !isDirty}
                onClick={discardUnsavedChanges}
                className="rounded-lg border border-allvino-outline-variant px-3 py-2 text-[10px] font-bold text-allvino-primary transition hover:bg-allvino-surface-container-high disabled:opacity-40"
              >
                Descartar
              </button>
              <button
                type="submit"
                form="template-editor-form"
                disabled={saving || !isDirty}
                className="shrink-0 rounded-lg bg-allvino-primary px-4 py-2 text-xs font-bold text-white shadow transition hover:bg-allvino-primary-container disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        ) : null}

        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-serif text-allvino-primary">
              Editor Dinâmico de Templates PDF
            </h1>
            <p className="text-allvino-on-surface-variant text-sm mt-1">
              Layouts editoriais de 1, 2, 4 ou 12 produtos por página, com posicionamento livre e ímã de alinhamento.
            </p>
            <p className="text-allvino-on-surface-variant/80 text-[11px] mt-2">
              Clique em qualquer elemento na folha A4 para abrir seus controles automaticamente. Use Ctrl+Z / Ctrl+Y para desfazer ou refazer.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              disabled={!canUndo}
              onClick={handleUndo}
              title="Desfazer última alteração (Ctrl+Z)"
              className="px-3 py-2 bg-white hover:bg-allvino-surface-container-high border border-allvino-outline-variant text-allvino-primary rounded-lg text-xs font-bold transition shadow-sm disabled:opacity-40"
            >
              ↩ Desfazer
            </button>
            <button
              type="button"
              disabled={!canRedo}
              onClick={handleRedo}
              title="Refazer alteração (Ctrl+Y)"
              className="px-3 py-2 bg-white hover:bg-allvino-surface-container-high border border-allvino-outline-variant text-allvino-primary rounded-lg text-xs font-bold transition shadow-sm disabled:opacity-40"
            >
              ↪ Refazer
            </button>
            <button
              type="button"
              onClick={resetAllPositions}
              className="px-4 py-2 bg-allvino-surface-container-high hover:bg-allvino-secondary hover:text-white border border-allvino-outline-variant text-allvino-primary rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1.5"
            >
              <span>🔄</span>
              <span>Centralizar Elementos</span>
            </button>
          </div>
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
            <div className="order-last space-y-6 lg:order-none lg:col-span-5">
              {/* Template selection */}
              <div className="glass-panel p-5 rounded-xl border border-allvino-outline-variant/30">
                <label className="block text-xs font-semibold uppercase tracking-wider text-allvino-primary mb-2.5">
                  Estilo Base do Catálogo
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                      <span className="truncate max-w-full">{t.nome}</span>
                      {t.isActive && (
                        <span className="px-1.5 py-0.5 rounded-full text-[8.5px] bg-allvino-secondary text-white font-extrabold tracking-wide">
                          ATIVO
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-allvino-outline-variant/20 pt-3">
                  <span className="text-[10px] text-allvino-on-surface-variant">
                    {isDirty ? "Salve antes de duplicar." : "Gerencie cópias e variações de campanha."}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {selectedTemplate && !selectedTemplate.isActive && (
                      <button
                        type="button"
                        onClick={handleDeleteTemplate}
                        disabled={deleting}
                        className="shrink-0 rounded border border-red-200 bg-red-50 px-2.5 py-1.5 text-[10px] font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-40"
                      >
                        {deleting ? "Excluindo..." : "Excluir"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleDuplicateTemplate}
                      disabled={!selectedTemplate || isDirty || duplicating}
                      className="shrink-0 rounded border border-allvino-outline-variant px-3 py-1.5 text-[10px] font-bold text-allvino-primary transition hover:bg-allvino-surface-container-high disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {duplicating ? "Duplicando..." : "Duplicar template"}
                    </button>
                  </div>
                </div>
              </div>

              {/* LAYOUT PRESETS SELECTION */}
              <div className="glass-panel p-5 rounded-xl border border-allvino-outline-variant/30 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-allvino-primary">
                  📰 Estrutura & Densidade do Catálogo PDF
                </label>
                <p className="text-[10px] text-allvino-on-surface-variant leading-relaxed">
                  Escolha entre layouts de destaque (1 vinho por folha A4) ou layouts comerciais multi-produto (2, 4 ou 12 vinhos por folha).
                </p>
                <p className="text-[9.5px] font-bold uppercase tracking-wider text-allvino-secondary">
                  Destaque Sommelier (1 produto por página)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "side-right", title: "📰 Lado a Lado (Revista)", desc: "Garrafa à Esquerda, Texto à Direita" },
                    { id: "side-left", title: "📰 Lado a Lado Inverso", desc: "Garrafa à Direita, Texto à Esquerda" },
                    { id: "classic", title: "🍾 Clássico Vertical", desc: "Garrafa no Centro, Texto em Baixo" },
                    { id: "price-top", title: "🔝 Preço no Topo", desc: "Layout com Preço em Destaque no Topo" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setProductLayoutPreset(p.id as ProductLayoutPreset);
                        setPreviewTab("product");
                        setIsDirty(true);
                      }}
                      className={`p-2.5 rounded-lg text-left transition border flex flex-col gap-0.5 ${
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

                <p className="text-[9.5px] font-bold uppercase tracking-wider text-allvino-secondary pt-1">
                  Alta Densidade Comercial B2B (Multi-Produto)
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "editorial-duo", title: "📑 Duplo Editorial", desc: "2 vinhos / pág." },
                    { id: "commercial-grid", title: "🍱 Grade B2B 2×2", desc: "4 vinhos / pág." },
                    { id: "executive-table", title: "📊 Tabela Executiva", desc: "12 vinhos / pág." },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setProductLayoutPreset(p.id as ProductLayoutPreset);
                        setPreviewTab("product");
                        setSelectedPreviewElement(null);
                        setIsDirty(true);
                      }}
                      className={`p-2.5 rounded-lg text-left transition border flex flex-col gap-0.5 ${
                        productLayoutPreset === p.id
                          ? "bg-allvino-primary text-white border-allvino-primary shadow-md"
                          : "bg-allvino-surface-container-low border-allvino-outline-variant hover:bg-allvino-surface-container-high"
                      }`}
                    >
                      <span className="text-[11px] font-bold">{p.title}</span>
                      <span className={`text-[9px] ${productLayoutPreset === p.id ? "text-white/80" : "text-allvino-on-surface-variant/70"}`}>
                        {p.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation Tabs for Categories */}
              <div className="grid grid-cols-2 gap-1 rounded-xl border border-allvino-outline-variant/30 bg-allvino-surface-container-low p-1 text-xs font-semibold sm:grid-cols-5">
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
                      setSelectedPreviewElement(null);
                    }}
                    className={`min-h-10 rounded-lg px-2 py-2 text-center text-[10px] leading-tight transition ${
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
                id="template-editor-form"
                onSubmit={handleSave}
                onChangeCapture={() => setIsDirty(true)}
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
                    <span>Publicar ao salvar</span>
                  </label>
                </div>

                {/* ── TAB 1: PRICE B2B FULL AUTONOMY ── */}
                {activeTab === "price" && (
                  <div className="space-y-4">
                    <p className="text-[11px] text-allvino-on-surface-variant leading-relaxed">
                      Configure a exibição do preço unitário, cálculo automático da caixa com 6 garrafas, selo de desconto e posição livre na folha A4.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <VisibilityToggle label="Exibir bloco de preço" checked={showProductPrice} onChange={setShowProductPrice} />
                      <VisibilityToggle label="Selo de desconto (% OFF)" checked={showProductDiscountBadge} onChange={setShowProductDiscountBadge} />
                      <VisibilityToggle label='Exibir rótulo ("Preço Unitário...")' checked={showProductPriceLabel} onChange={setShowProductPriceLabel} />
                      <VisibilityToggle label='Exibir info secundária ("Caixa c/ 6")' checked={showProductPriceInfo} onChange={setShowProductPriceInfo} />
                      {showProductPriceInfo && (
                        <VisibilityToggle label="Calcular valor da Caixa c/ 6 (R$)" checked={showProductBoxPrice} onChange={setShowProductBoxPrice} />
                      )}
                    </div>

                    {/* Editable Price Labels (Remove or customize B2B wording) */}
                    {(showProductPriceLabel || showProductPriceInfo) && (
                      <div className="rounded-lg border border-allvino-outline-variant/40 bg-allvino-surface-container-low/70 p-3 space-y-2.5">
                        <p className="text-[10.5px] font-bold text-allvino-primary">
                          ✏️ Personalizar Textos do Preço (Opcional — Carta de Vinhos ou Atacado)
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {showProductPriceLabel && (
                            <div>
                              <label className="block text-[9px] text-allvino-on-surface-variant mb-1 font-semibold">
                                Rótulo superior do preço
                              </label>
                              <input
                                type="text"
                                value={productPriceLabelText}
                                onChange={(e) => setProductPriceLabelText(e.target.value)}
                                placeholder="Ex: Garrafa 750ml (ou apague)"
                                className="w-full text-xs p-1.5 rounded bg-white border"
                              />
                            </div>
                          )}
                          {showProductPriceInfo && (
                            <div>
                              <label className="block text-[9px] text-allvino-on-surface-variant mb-1 font-semibold">
                                Rótulo secundário (caixa/embalagem)
                              </label>
                              <input
                                type="text"
                                value={productPriceInfoText}
                                onChange={(e) => setProductPriceInfoText(e.target.value)}
                                placeholder={showProductBoxPrice ? "Padrão: Caixa c/ 6" : "Padrão: Caixa c/ 6 garrafas"}
                                className="w-full text-xs p-1.5 rounded bg-white border"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

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
                            min="-350"
                            max="350"
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
                            min="-450"
                            max="450"
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
                            { id: "left", label: "Direita →" },
                            { id: "center", label: "Centro" },
                            { id: "right", label: "← Esquerda" },
                          ].map((side) => (
                            <button
                              key={side.id}
                              type="button"
                              onClick={() => {
                                setProductPriceSide(side.id as any);
                                setIsDirty(true);
                              }}
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
                          <label className="block text-[9px] text-allvino-on-surface-variant mb-1 font-medium">Preço B2B</label>
                          <input
                            type="number"
                            step="0.5"
                            value={productPriceLabelFontSize}
                            onChange={(e) => setProductPriceLabelFontSize(Number(e.target.value))}
                            className="w-full text-xs p-1.5 rounded bg-allvino-surface-container-low border text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-allvino-on-surface-variant mb-1 font-medium">Caixa c/ 6</label>
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
                      Ajuste a altura máxima e os deslocamentos em pixels. O controle de visibilidade permite remover a garrafa sem alterar os demais elementos.
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      <VisibilityToggle label="Exibir garrafa" checked={showProductBottle} onChange={setShowProductBottle} />
                    </div>

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
                            min="-350"
                            max="350"
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
                            min="-350"
                            max="350"
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
                      Ajuste tamanho, posição e alinhamento dos textos da página. Use os controles de visibilidade para remover elementos padrão do template.
                    </p>

                    <div className="rounded-xl border border-amber-300/70 bg-amber-50/70 p-3 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-[11px] font-bold text-allvino-primary">
                            ✨ Estilo Limpo Editorial (Carta de Vinhos / Arte Própria)
                          </p>
                          <p className="text-[9.5px] text-allvino-on-surface-variant">
                            Remove cabeçalho repetido, molduras, fios internos e termos de atacado com 1 clique.
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={handleApplyCleanEditorialMode}
                            className="rounded-lg bg-allvino-primary px-2.5 py-1.5 text-[10px] font-bold text-white shadow-xs transition hover:bg-allvino-primary-container"
                          >
                            ✨ Aplicar Modo Limpo
                          </button>
                          <button
                            type="button"
                            onClick={handleRestoreStandardB2BMode}
                            className="rounded-lg border border-allvino-outline-variant bg-white px-2 py-1.5 text-[9.5px] font-bold text-allvino-primary transition hover:bg-allvino-surface-container-high"
                          >
                            Padrão B2B
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <VisibilityToggle label="Exibir nome do vinho" checked={showProductName} onChange={setShowProductName} />
                      <VisibilityToggle label="Exibir origem/região" checked={showProductOrigin} onChange={setShowProductOrigin} />
                      <VisibilityToggle label="Exibir bandeira do país" checked={showProductCountryFlag} onChange={setShowProductCountryFlag} />
                      <VisibilityToggle label="Exibir selo de categoria" checked={showProductCategoryBadge} onChange={setShowProductCategoryBadge} />
                      <VisibilityToggle label="Contorno nas pílulas (País/Tipo)" checked={showProductPillBorders} onChange={setShowProductPillBorders} />
                      <VisibilityToggle label="Exibir linha divisória curta" checked={showProductDivider} onChange={setShowProductDivider} />
                      <VisibilityToggle label="Exibir ficha técnica" checked={showProductSpecs} onChange={setShowProductSpecs} />
                      <VisibilityToggle label="Exibir notas de degustação" checked={showProductDescription} onChange={setShowProductDescription} />
                      <VisibilityToggle label="Cabeçalho superior na página" checked={showProductPageHeader} onChange={setShowProductPageHeader} />
                      <VisibilityToggle label="Linhas internas (ficha/preço/rodapé)" checked={showProductInternalLines} onChange={setShowProductInternalLines} />
                      <VisibilityToggle label="Moldura/borda nos cards" checked={showProductCardBorder} onChange={setShowProductCardBorder} />
                    </div>

                    {/* Optional Custom Running Header Texts when enabled */}
                    {showProductPageHeader && (
                      <div className="rounded-lg border border-allvino-outline-variant/40 bg-allvino-surface-container-low/70 p-3 space-y-2">
                        <p className="text-[10.5px] font-bold text-allvino-primary">
                          Cabeçalho Superior das Páginas Multi-Produto
                        </p>
                        <p className="text-[9.5px] text-allvino-on-surface-variant">
                          Personalize os textos exibidos no topo (ou desmarque &ldquo;Cabeçalho superior na página&rdquo; acima para removê-lo por completo).
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] text-allvino-on-surface-variant mb-1">Texto à esquerda</label>
                            <input
                              type="text"
                              value={productPageHeaderLeftText}
                              onChange={(e) => setProductPageHeaderLeftText(e.target.value)}
                              placeholder={headerTitle || "Ex: CARTA DE VINHOS"}
                              className="w-full text-xs p-1.5 rounded bg-white border"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] text-allvino-on-surface-variant mb-1">Texto à direita (ex: remover &ldquo;Exclusivo para Atacado&rdquo;)</label>
                            <input
                              type="text"
                              value={productPageHeaderRightText}
                              onChange={(e) => setProductPageHeaderRightText(e.target.value)}
                              placeholder={coverSubtitle || "Ex: SELEÇÃO RESERVA"}
                              className="w-full text-xs p-1.5 rounded bg-white border"
                            />
                          </div>
                        </div>
                      </div>
                    )}

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
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <label className="block text-[9px] text-allvino-on-surface-variant mb-1">Fonte origem (px)</label>
                          <input
                            type="number"
                            min="6"
                            max="60"
                            value={productSpecsFontSize}
                            onChange={(e) => setProductSpecsFontSize(Number(e.target.value))}
                            className="w-full text-xs p-1.5 rounded bg-allvino-surface-container-low border text-center font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-allvino-on-surface-variant mb-1">Deslocamento origem Y</label>
                          <input
                            type="number"
                            value={productOriginYOffset}
                            onChange={(e) => setProductOriginYOffset(clamp(e.target.value))}
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
                            onChange={(e) => setProductDescYOffset(clamp(e.target.value, -150, 150))}
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
                      Ajuste altura, tamanho e posição em pixels. Valores positivos movem para direita/baixo; negativos para esquerda/cima. Elementos podem ser ocultados sem apagar suas configurações.
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      <VisibilityToggle label="Exibir logotipo" checked={showCoverLogo} onChange={setShowCoverLogo} />
                      <VisibilityToggle label="Exibir divisor" checked={showCoverDivider} onChange={setShowCoverDivider} />
                      <VisibilityToggle label="Exibir título principal" checked={showCoverTitle} onChange={setShowCoverTitle} />
                      <VisibilityToggle label="Exibir subtítulo" checked={showCoverSubtitle} onChange={setShowCoverSubtitle} />
                      <VisibilityToggle label="Exibir rodapé" checked={showCoverFooter} onChange={setShowCoverFooter} />
                    </div>

                    {/* Cover Background */}
                    <div className="space-y-2.5 pb-3 border-b border-allvino-outline-variant/20">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold text-allvino-primary">Imagem de Fundo da Capa</p>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                          Proporção A4 (1:1.414)
                        </span>
                      </div>
                      <p className="text-[10px] text-allvino-on-surface-variant">
                        Anexe uma imagem nova ou informe uma URL HTTPS. A imagem será usada como fundo da capa do PDF.
                      </p>

                      {/* Guia visual de dimensões e margens */}
                      <div className="rounded-lg border border-allvino-outline-variant/50 bg-allvino-surface-container-low p-2.5 space-y-1.5 text-[10px] text-allvino-on-surface-variant">
                        <div className="flex items-center justify-between font-semibold text-allvino-primary">
                          <span>📐 Dimensão ideal: <strong>1200 × 1700 px</strong></span>
                          <span>(JPG / PNG / WebP)</span>
                        </div>
                        <p className="text-[9.5px] leading-relaxed">
                          • <strong>Proporção:</strong> A4 Retrato (210×297 mm). Artes fora desta proporção serão ajustadas automaticamente para preencher a folha.<br />
                          • <strong>Área de Segurança:</strong> Deixe ao menos <strong>50 a 70 px</strong> de respiro nas bordas para que textos ou ilustrações não sejam sobrepostos por logotipos ou rodapés.
                        </p>
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          aria-label="Anexar imagem de fundo da capa"
                          onChange={(e) =>
                            handleFileUpload(e.target.files?.[0], setCoverImageUrl, "a imagem da capa")
                          }
                          className="w-full rounded border bg-allvino-surface-container-low p-1.5 text-[10px]"
                        />
                        <input
                          type="url"
                          value={coverImageUrl.startsWith("data:") ? "" : coverImageUrl}
                          onChange={(e) => setCoverImageUrl(e.target.value)}
                          placeholder="Ou URL HTTPS da imagem"
                          className="w-full rounded border bg-allvino-surface-container-low p-2 text-xs"
                        />
                      </div>
                      {coverImageUrl && (
                        <div className="flex items-center justify-between gap-2 rounded bg-allvino-surface-container-low p-2 text-[10px] text-allvino-on-surface-variant">
                          <span className="truncate">
                            {coverImageUrl.startsWith("data:")
                              ? "Arquivo de capa carregado"
                              : coverImageUrl}
                          </span>
                          <button
                            type="button"
                            onClick={() => setCoverImageUrl("")}
                            className="shrink-0 rounded border border-allvino-outline-variant px-2 py-1 font-bold text-allvino-primary"
                          >
                            Remover
                          </button>
                        </div>
                      )}
                    </div>

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
                            onClick={() => {
                              setCoverLogoVariant(v.id as any);
                              setIsDirty(true);
                            }}
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
                      <div className="grid grid-cols-4 gap-2 pt-1">
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
                        <div>
                          <label className="block text-[9px] text-allvino-on-surface-variant mb-1">Ângulo (°)</label>
                          <input
                            type="number"
                            min="-180"
                            max="180"
                            value={coverLogoAngle}
                            onChange={(e) => setCoverLogoAngle(Number(e.target.value))}
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <div>
                          <label className="block text-[9px] text-allvino-on-surface-variant mb-1">
                            Cor do título
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              aria-label="Cor do título principal da capa"
                              value={coverTitlePickerColor}
                              onChange={(e) => setCoverTitleColor(e.target.value)}
                              className="w-8 h-8 rounded border cursor-pointer bg-transparent"
                            />
                            <input
                              type="text"
                              aria-label="Código hexadecimal da cor do título principal da capa"
                              value={coverTitleColor}
                              onChange={(e) => setCoverTitleColor(e.target.value)}
                              placeholder="Automática"
                              className="w-full text-xs p-1.5 rounded bg-allvino-surface-container-low border"
                            />
                          </div>
                          <p className="mt-1 text-[9px] text-allvino-on-surface-variant/70">
                            Deixe vazio para usar a cor automática conforme o fundo.
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 pt-1">
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
                        <div>
                          <label className="block text-[9px] text-allvino-on-surface-variant mb-1">Ângulo (°)</label>
                          <input
                            type="number"
                            min="-180"
                            max="180"
                            value={coverTitleAngle}
                            onChange={(e) => setCoverTitleAngle(Number(e.target.value))}
                            className="w-full text-xs p-1.5 rounded bg-allvino-surface-container-low border text-center"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Cover Subtitle */}
                    <div className="space-y-2 pb-3 border-b border-allvino-outline-variant/20">
                      <p className="text-[11px] font-bold text-allvino-primary">3. Subtítulo da Capa</p>
                      <input
                        type="text"
                        value={coverSubtitle}
                        onChange={(e) => setCoverSubtitle(e.target.value)}
                        placeholder="CATÁLOGO EXCLUSIVO B2B"
                        className="w-full text-xs p-2 rounded bg-allvino-surface-container-low border"
                      />
                      <div>
                        <label className="block text-[9px] text-allvino-on-surface-variant mb-1">
                          Cor do subtítulo
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            aria-label="Cor do subtítulo da capa"
                            value={coverSubtitlePickerColor}
                            onChange={(e) => setCoverSubtitleColor(e.target.value)}
                            className="w-8 h-8 rounded border cursor-pointer bg-transparent"
                          />
                          <input
                            type="text"
                            aria-label="Código hexadecimal da cor do subtítulo da capa"
                            value={coverSubtitleColor}
                            onChange={(e) => setCoverSubtitleColor(e.target.value)}
                            placeholder="Automática"
                            className="w-full text-xs p-1.5 rounded bg-allvino-surface-container-low border"
                          />
                        </div>
                        <p className="mt-1 text-[9px] text-allvino-on-surface-variant/70">
                          Deixe vazio para usar a cor automática conforme o fundo.
                        </p>
                      </div>
                      <div className="grid grid-cols-4 gap-2 pt-1">
                        <div>
                          <label className="block text-[9px] text-allvino-on-surface-variant mb-1">Fonte (px)</label>
                          <input
                            type="number"
                            min="6"
                            max="80"
                            value={coverSubtitleFontSize}
                            onChange={(e) => setCoverSubtitleFontSize(Number(e.target.value))}
                            className="w-full text-xs p-1.5 rounded bg-allvino-surface-container-low border text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-allvino-on-surface-variant mb-1">Posição X</label>
                          <input
                            type="number"
                            value={coverSubtitleXOffset}
                            onChange={(e) => setCoverSubtitleXOffset(clamp(e.target.value))}
                            className="w-full text-xs p-1.5 rounded bg-allvino-surface-container-low border text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-allvino-on-surface-variant mb-1">Posição Y</label>
                          <input
                            type="number"
                            value={coverSubtitleYOffset}
                            onChange={(e) => setCoverSubtitleYOffset(clamp(e.target.value))}
                            className="w-full text-xs p-1.5 rounded bg-allvino-surface-container-low border text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-allvino-on-surface-variant mb-1">Ângulo (°)</label>
                          <input
                            type="number"
                            min="-180"
                            max="180"
                            value={coverSubtitleAngle}
                            onChange={(e) => setCoverSubtitleAngle(Number(e.target.value))}
                            className="w-full text-xs p-1.5 rounded bg-allvino-surface-container-low border text-center"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Cover Footer */}
                    <div className="space-y-2 pb-3">
                      <p className="text-[11px] font-bold text-allvino-primary">4. Rodapé da Capa</p>
                      <input
                        type="text"
                        value={footerText}
                        onChange={(e) => setFooterText(e.target.value)}
                        placeholder="Allvino Importadora de Vinhos B2B"
                        className="w-full text-xs p-2 rounded bg-allvino-surface-container-low border"
                      />
                      <div>
                        <label className="block text-[9px] text-allvino-on-surface-variant mb-1">
                          Cor do rodapé
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            aria-label="Cor do rodapé da capa"
                            value={coverFooterPickerColor}
                            onChange={(e) => setCoverFooterColor(e.target.value)}
                            className="w-8 h-8 rounded border cursor-pointer bg-transparent"
                          />
                          <input
                            type="text"
                            aria-label="Código hexadecimal da cor do rodapé da capa"
                            value={coverFooterColor}
                            onChange={(e) => setCoverFooterColor(e.target.value)}
                            placeholder="Automática"
                            className="w-full text-xs p-1.5 rounded bg-allvino-surface-container-low border"
                          />
                        </div>
                        <p className="mt-1 text-[9px] text-allvino-on-surface-variant/70">
                          Deixe vazio para usar a cor automática conforme o fundo.
                        </p>
                      </div>
                      <div className="grid grid-cols-4 gap-2 pt-1">
                        <div>
                          <label className="block text-[9px] text-allvino-on-surface-variant mb-1">Fonte (px)</label>
                          <input
                            type="number"
                            min="6"
                            max="60"
                            value={coverFooterFontSize}
                            onChange={(e) => setCoverFooterFontSize(Number(e.target.value))}
                            className="w-full text-xs p-1.5 rounded bg-allvino-surface-container-low border text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-allvino-on-surface-variant mb-1">Posição X</label>
                          <input
                            type="number"
                            value={coverFooterXOffset}
                            onChange={(e) => setCoverFooterXOffset(clamp(e.target.value))}
                            className="w-full text-xs p-1.5 rounded bg-allvino-surface-container-low border text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-allvino-on-surface-variant mb-1">Posição Y</label>
                          <input
                            type="number"
                            value={coverFooterYOffset}
                            onChange={(e) => setCoverFooterYOffset(clamp(e.target.value))}
                            className="w-full text-xs p-1.5 rounded bg-allvino-surface-container-low border text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-allvino-on-surface-variant mb-1">Deslocamento geral Y</label>
                          <input
                            type="number"
                            value={coverVerticalOffset}
                            onChange={(e) => setCoverVerticalOffset(clamp(e.target.value))}
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
                      Gerencie paleta de cores geral do PDF, tipografia e a imagem de fundo da página de produto.
                    </p>

                    {/* Clean Lines & Borders Quick Controls */}
                    <div className="rounded-xl border border-amber-300/70 bg-amber-50/70 p-3 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-[11px] font-bold text-allvino-primary">
                            ✨ Limpeza de Linhas, Molduras & Textos Padrão
                          </p>
                          <p className="text-[9.5px] text-allvino-on-surface-variant">
                            Ideal para artes timbradas (ex: Cartas de Vinho): oculte linhas divisórias, bordas de cards e textos fixos de atacado.
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={handleApplyCleanEditorialMode}
                            className="rounded-lg bg-allvino-primary px-2.5 py-1.5 text-[10px] font-bold text-white shadow-xs transition hover:bg-allvino-primary-container"
                          >
                            ✨ Modo Limpo (Sem Linhas)
                          </button>
                          <button
                            type="button"
                            onClick={handleRestoreStandardB2BMode}
                            className="rounded-lg border border-allvino-outline-variant bg-white px-2 py-1.5 text-[9.5px] font-bold text-allvino-primary transition hover:bg-allvino-surface-container-high"
                          >
                            Restaurar Linhas
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-0.5">
                        <VisibilityToggle label="Cabeçalho superior e linha do topo" checked={showProductPageHeader} onChange={setShowProductPageHeader} />
                        <VisibilityToggle label="Moldura/borda externa nos cards" checked={showProductCardBorder} onChange={setShowProductCardBorder} />
                        <VisibilityToggle label="Linhas internas (ficha, preço e rodapé)" checked={showProductInternalLines} onChange={setShowProductInternalLines} />
                        <VisibilityToggle label="Contorno nas pílulas (País e Tipo)" checked={showProductPillBorders} onChange={setShowProductPillBorders} />
                        <VisibilityToggle label='Rótulo "Preço Unitário B2B"' checked={showProductPriceLabel} onChange={setShowProductPriceLabel} />
                        <VisibilityToggle label=' Subtítulo "Caixa c/ 6"' checked={showProductPriceInfo} onChange={setShowProductPriceInfo} />
                        <VisibilityToggle label="Exibir rodapé da página de produto" checked={showProductFooter} onChange={setShowProductFooter} />
                      </div>
                    </div>

                    <div className="space-y-2 pb-3 border-b border-allvino-outline-variant/20">
                      <p className="text-[11px] font-bold text-allvino-primary">Identificação e Tipografia</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] text-allvino-on-surface-variant mb-1">Nome do template</label>
                          <input
                            type="text"
                            required
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            className="w-full rounded border bg-allvino-surface-container-low p-2 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-allvino-on-surface-variant mb-1">Família tipográfica</label>
                          <select
                            value={fontFamily}
                            onChange={(e) => setFontFamily(e.target.value)}
                            className="w-full rounded border bg-allvino-surface-container-low p-2 text-xs"
                          >
                            <option value="Playfair Display">Playfair Display (Editorial Clássica)</option>
                            <option value="Cormorant Garamond">Cormorant Garamond (Alta Gastronomia)</option>
                            <option value="Cinzel">Cinzel (Reserva Imperial)</option>
                            <option value="Inter">Inter (Moderna & Limpa)</option>
                            <option value="Montserrat">Montserrat (Geométrica Contemporânea)</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleExportConfiguration}
                          className="rounded border border-allvino-outline-variant bg-white px-3 py-1.5 text-[10px] font-bold text-allvino-primary hover:bg-allvino-surface-container-high"
                        >
                          Exportar configuração
                        </button>
                        <label className="cursor-pointer rounded border border-allvino-outline-variant bg-white px-3 py-1.5 text-[10px] font-bold text-allvino-primary hover:bg-allvino-surface-container-high">
                          Importar configuração
                          <input
                            type="file"
                            accept="application/json,.json"
                            className="sr-only"
                            onChange={(e) => handleImportConfiguration(e.target.files?.[0])}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Curated Sommelier Color Palettes */}
                    <div className="space-y-2 pb-3 border-b border-allvino-outline-variant/20">
                      <p className="text-[11px] font-bold text-allvino-primary">Paletas Sommelier Curadas (1 Clique)</p>
                      <div className="grid grid-cols-2 gap-2">
                        {SOMMELIER_COLOR_PALETTES.map((palette) => (
                          <button
                            key={palette.name}
                            type="button"
                            onClick={() => {
                              setPrimaryColor(palette.primary);
                              setSecondaryColor(palette.secondary);
                              setBackgroundColor(palette.background);
                              setTextColor(palette.text);
                              setProductNameColor("");
                              setProductSpecsColor("");
                              setProductDescColor("");
                              setProductPriceColor("");
                              setIsDirty(true);
                              showToast(`Paleta "${palette.name}" aplicada.`);
                            }}
                            className="flex items-center gap-2 rounded-lg border border-allvino-outline-variant/40 bg-allvino-surface-container-low p-2 text-left transition hover:border-allvino-primary hover:bg-white"
                          >
                            <span className="flex shrink-0 -space-x-1">
                              <span className="h-4 w-4 rounded-full border border-white shadow-sm" style={{ background: palette.primary }} />
                              <span className="h-4 w-4 rounded-full border border-white shadow-sm" style={{ background: palette.secondary }} />
                              <span className="h-4 w-4 rounded-full border border-gray-300 shadow-sm" style={{ background: palette.background }} />
                            </span>
                            <span className="truncate text-[10px] font-bold text-allvino-text">{palette.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Background Texture */}
                    <div className="space-y-2.5 pb-3 border-b border-allvino-outline-variant/20">
                      <p className="text-[11px] font-bold text-allvino-primary">Imagem de Fundo da Página de Produto</p>
                      <p className="text-[10px] text-allvino-on-surface-variant">
                        Anexe uma imagem nova ou informe uma URL HTTPS. O sistema extrai automaticamente o tom dominante da arte para harmonizar os cards sem blocos brancos.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          aria-label="Anexar imagem de fundo da página de produto"
                          onChange={(e) =>
                            handleFileUpload(
                              e.target.files?.[0],
                              setBackgroundImageUrl,
                              "a imagem da página de produto",
                              true,
                            )
                          }
                          className="w-full p-1.5 rounded bg-allvino-surface-container-low border text-[10px]"
                        />
                        <input
                          type="url"
                          value={backgroundImageUrl.startsWith("data:") ? "" : backgroundImageUrl}
                          onChange={(e) => setBackgroundImageUrl(e.target.value)}
                          placeholder="Ou URL HTTPS da imagem"
                          className="w-full p-2 rounded bg-allvino-surface-container-low border text-xs"
                        />
                      </div>
                      {backgroundImageUrl && (
                        <div className="flex items-center justify-between gap-2 rounded bg-allvino-surface-container-low p-2 text-[10px] text-allvino-on-surface-variant">
                          <span className="truncate">
                            {backgroundImageUrl.startsWith("data:")
                              ? "Arquivo da página de produto carregado"
                              : backgroundImageUrl}
                          </span>
                          <button
                            type="button"
                            onClick={() => setBackgroundImageUrl("")}
                            className="shrink-0 rounded border border-allvino-outline-variant px-2 py-1 font-bold text-allvino-primary"
                          >
                            Remover
                          </button>
                        </div>
                      )}

                      {/* Extracted Palette from Uploaded Art */}
                      {extractedArtPalette && (
                        <div className="rounded-lg border border-allvino-secondary/50 bg-amber-50/60 p-3 space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="text-[10.5px] font-bold text-allvino-primary">
                                🎨 Paleta Extraída do Arquivo Importado
                              </p>
                              <p className="text-[9.5px] text-allvino-on-surface-variant">
                                Tom base detectado:{" "}
                                <strong className="uppercase">{extractedArtPalette.dominantBgHex}</strong> (substitui o branco padrão)
                              </p>
                            </div>
                            <span
                              className="h-6 w-6 rounded-full border border-black/20 shadow-inner shrink-0"
                              style={{ background: extractedArtPalette.dominantBgHex }}
                              title={`Tom dominante do fundo: ${extractedArtPalette.dominantBgHex}`}
                            />
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            {extractedArtPalette.swatches.map((hex) => (
                              <button
                                key={hex}
                                type="button"
                                onClick={() => {
                                  setBackgroundColor(hex);
                                  setIsDirty(true);
                                  showToast(`Tom ${hex} da arte aplicado ao fundo e superfície dos cards!`);
                                }}
                                title={`Clique para usar ${hex} como cor de superfície/fundo`}
                                className="flex items-center gap-1.5 rounded-full border border-allvino-outline-variant/60 bg-white px-2 py-1 text-[9px] font-bold text-allvino-text shadow-xs transition hover:border-allvino-primary"
                              >
                                <span
                                  className="h-3.5 w-3.5 rounded-full border border-black/15"
                                  style={{ background: hex }}
                                />
                                <span className="uppercase">{hex}</span>
                              </button>
                            ))}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-0.5">
                            <button
                              type="button"
                              onClick={() => handleHarmonizeWithArt(false)}
                              className="rounded-lg bg-allvino-primary px-2.5 py-1.5 text-[10px] font-bold text-white shadow-xs transition hover:bg-allvino-primary-container"
                            >
                              ✨ Harmonizar Fundo & Cards
                            </button>
                            <button
                              type="button"
                              onClick={() => handleHarmonizeWithArt(true)}
                              className="rounded-lg border border-allvino-primary bg-white px-2.5 py-1.5 text-[10px] font-bold text-allvino-primary transition hover:bg-allvino-surface-container-high"
                            >
                              🎨 Harmonizar Toda a Paleta
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card Surface Mode & Opacity Over Background */}
                    <div className="space-y-2.5 pb-3 border-b border-allvino-outline-variant/20">
                      <p className="text-[11px] font-bold text-allvino-primary">
                        🪟 Superfície e Transparência dos Cards sobre o Fundo
                      </p>
                      <p className="text-[10px] text-allvino-on-surface-variant leading-relaxed">
                        Evite retângulos brancos sobre a sua arte: escolha entre fundo 100% transparente ou velatura tonalizada com a cor extraída do fundo.
                      </p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          {
                            id: "auto",
                            title: "✨ Auto Harmonizado",
                            desc: "Velatura suave com o tom da arte",
                            defaultOpacity: hasProductBgImage ? 14 : 88,
                          },
                          {
                            id: "transparent",
                            title: "🌿 100% Transparente",
                            desc: "Sem fundo nos cards (arte livre)",
                            defaultOpacity: 0,
                          },
                          {
                            id: "tinted-glass",
                            title: "🥂 Velatura (Glass)",
                            desc: "Transparência tingida pelo fundo",
                            defaultOpacity: 24,
                          },
                          {
                            id: "solid",
                            title: "📄 Sólido Harmonizado",
                            desc: "Cor do fundo com alta cobertura",
                            defaultOpacity: 88,
                          },
                        ].map((mode) => (
                          <button
                            key={mode.id}
                            type="button"
                            onClick={() => {
                              setProductCardSurfaceMode(mode.id as any);
                              setProductCardOpacity(mode.defaultOpacity);
                              setIsDirty(true);
                            }}
                            className={`rounded-lg border p-2 text-left transition flex flex-col gap-0.5 ${
                              productCardSurfaceMode === mode.id
                                ? "bg-allvino-primary text-white border-allvino-primary shadow-sm"
                                : "bg-allvino-surface-container-low border-allvino-outline-variant hover:bg-allvino-surface-container-high"
                            }`}
                          >
                            <span className="text-[10.5px] font-bold">{mode.title}</span>
                            <span
                              className={`text-[8.5px] ${
                                productCardSurfaceMode === mode.id
                                  ? "text-white/80"
                                  : "text-allvino-on-surface-variant/75"
                              }`}
                            >
                              {mode.desc}
                            </span>
                          </button>
                        ))}
                      </div>

                      {productCardSurfaceMode !== "transparent" && (
                        <div className="pt-1">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-semibold text-allvino-on-surface-variant">
                              Opacidade da Superfície do Card (Tonalizada com {effectiveSurfaceHex.toUpperCase()})
                            </label>
                            <span className="text-[10px] font-bold text-allvino-primary">
                              {productCardOpacity}%
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={productCardOpacity}
                              onChange={(e) => {
                                const nextVal = clamp(e.target.value, 0, 100);
                                setProductCardOpacity(nextVal);
                                if (productCardSurfaceMode === "auto") {
                                  setProductCardSurfaceMode("tinted-glass");
                                }
                                setIsDirty(true);
                              }}
                              className="w-full accent-allvino-primary"
                            />
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={productCardOpacity}
                              onChange={(e) => {
                                const nextVal = clamp(e.target.value, 0, 100);
                                setProductCardOpacity(nextVal);
                                setIsDirty(true);
                              }}
                              className="w-14 rounded border bg-allvino-surface-container-low p-1 text-center text-[10px] font-bold"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 pb-3 border-b border-allvino-outline-variant/20">
                      <p className="text-[11px] font-bold text-allvino-primary">Layout da Página de Produto</p>
                      <p className="text-[10px] text-allvino-on-surface-variant">
                        Controle o respiro interno e a largura dos textos para evitar sobreposição entre elementos.
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] text-allvino-on-surface-variant mb-1">Margem interna (px)</label>
                          <input
                            type="number"
                            min="0"
                            max="120"
                            value={productPagePadding}
                            onChange={(e) => setProductPagePadding(clamp(e.target.value, 0, 120))}
                            className="w-full text-xs p-1.5 rounded bg-allvino-surface-container-low border text-center font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-allvino-on-surface-variant mb-1">Largura máxima dos textos (px)</label>
                          <input
                            type="number"
                            min="240"
                            max="760"
                            value={productTextMaxWidth}
                            onChange={(e) => setProductTextMaxWidth(clamp(e.target.value, 240, 760))}
                            className="w-full text-xs p-1.5 rounded bg-allvino-surface-container-low border text-center font-bold"
                          />
                        </div>
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
                    disabled={saving || !isDirty}
                    className="w-full py-3 rounded-lg bg-allvino-primary hover:bg-allvino-primary-container disabled:opacity-50 text-white font-semibold text-sm transition duration-200 shadow-md"
                  >
                    {saving ? "Salvando..." : isDirty ? "Salvar Configurações" : "Configurações Salvas"}
                  </button>
                </div>
              </form>
            </div>

            {/* ─── LIVE PREVIEW WITH REAL REGISTERED WINE SELECTOR ─── */}
            <div className="order-first lg:order-none lg:col-span-7">
              <div className="lg:sticky lg:top-24">
                {/* Preview Controls & Real Wine Selector */}
                <div className="mb-3 space-y-2 px-1">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewTab("cover");
                          setSelectedPreviewElement(null);
                        }}
                        className={`px-3 py-1.5 rounded text-xs font-bold transition border ${
                          previewTab === "cover"
                            ? "bg-allvino-primary border-allvino-primary text-white"
                            : "bg-allvino-surface-container-high border-allvino-outline-variant text-allvino-text hover:border-allvino-primary"
                        }`}
                      >
                        1. Capa
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewTab("index");
                          setSelectedPreviewElement(null);
                        }}
                        className={`px-3 py-1.5 rounded text-xs font-bold transition border ${
                          previewTab === "index"
                            ? "bg-allvino-primary border-allvino-primary text-white"
                            : "bg-allvino-surface-container-high border-allvino-outline-variant text-allvino-text hover:border-allvino-primary"
                        }`}
                      >
                        2. Sumário
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewTab("product");
                          setSelectedPreviewElement(null);
                        }}
                        className={`px-3 py-1.5 rounded text-xs font-bold transition border ${
                          previewTab === "product"
                            ? "bg-allvino-primary border-allvino-primary text-white"
                            : "bg-allvino-surface-container-high border-allvino-outline-variant text-allvino-text hover:border-allvino-primary"
                        }`}
                      >
                        3. Página de Produto
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-allvino-primary font-bold px-2 py-0.5 rounded bg-amber-50 border border-amber-200" title="Proporção 1:1.414 (1200×1700 px recomendado)">
                        A4 · 1200 × 1700 px
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowSafetyGuides((prev) => !prev)}
                        className={`rounded border px-2 py-1 text-[9px] font-bold transition ${
                          showSafetyGuides
                            ? "bg-allvino-primary text-white border-allvino-primary"
                            : "bg-white text-allvino-primary border-allvino-outline-variant hover:bg-allvino-surface-container-high"
                        }`}
                        title="Ativar/desativar visualização de margens de segurança (respiro de 50px)"
                      >
                        {showSafetyGuides ? "Guias (Ativas)" : "Mostrar Guias"}
                      </button>
                      <button
                        type="button"
                        onClick={handleTestDraftPdf}
                        disabled={testingPdf}
                        className="rounded border border-allvino-primary bg-allvino-primary/10 px-2.5 py-1 text-[9px] font-extrabold text-allvino-primary transition hover:bg-allvino-primary hover:text-white disabled:opacity-50"
                        title="Gerar um PDF real agora usando as configurações atuais da tela (mesmo sem publicar)"
                      >
                        {testingPdf ? "Gerando PDF..." : "🧪 Testar PDF (Rascunho Atual)"}
                      </button>
                    </div>
                  </div>

                  {/* Real Registered Wine Selector for Preview */}
                  {previewTab === "product" && dbWines.length > 0 && (
                    <div className="flex items-center gap-2 bg-allvino-surface-container-low p-2 rounded-lg border border-allvino-outline-variant/30">
                      <span className="text-[10px] font-bold text-allvino-primary uppercase tracking-wider whitespace-nowrap">
                        🍷 Vinho Principal:
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

                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-allvino-outline-variant/30 bg-white/80 p-2">
                    <div>
                      <p className="text-[10px] font-bold text-allvino-primary">
                        {selectedPreviewElement
                          ? `Selecionado: ${previewElementLabels[selectedPreviewElement]}`
                          : "Clique em um elemento da prévia para abrir sua aba e posicioná-lo"}
                      </p>
                      <p className="text-[9px] text-allvino-on-surface-variant">
                        Arraste com ímã central automático (segure Alt para livre) ou use as setas (Shift = 10 px).
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {[
                        { label: "←", dx: -1, dy: 0 },
                        { label: "↑", dx: 0, dy: -1 },
                        { label: "↓", dx: 0, dy: 1 },
                        { label: "→", dx: 1, dy: 0 },
                      ].map((move) => (
                        <button
                          key={move.label}
                          type="button"
                          aria-label={`Mover ${move.label}`}
                          disabled={!selectedPreviewElement}
                          onClick={() => moveSelectedElement(move.dx, move.dy)}
                          className="h-7 w-7 rounded border border-allvino-outline-variant bg-white text-xs font-bold text-allvino-primary hover:bg-allvino-surface-container-high disabled:opacity-30"
                        >
                          {move.label}
                        </button>
                      ))}
                      <button
                        type="button"
                        disabled={!selectedPreviewElement}
                        onClick={resetSelectedElement}
                        className="ml-1 rounded border border-allvino-outline-variant bg-white px-2 py-1.5 text-[9px] font-bold text-allvino-primary hover:bg-allvino-surface-container-high disabled:opacity-30"
                      >
                        Centralizar
                      </button>
                    </div>
                  </div>
                </div>

                {/* A4 Preview Container */}
                <div
                  ref={previewRef}
                  className="w-full rounded-xl shadow-2xl border border-allvino-outline-variant/40 overflow-hidden transition-all duration-300 relative aspect-[1/1.414]"
                  style={{
                    backgroundColor:
                      previewTab === "cover" && hasCoverBg
                        ? "#000"
                        : effectiveSurfaceHex,
                    backgroundImage:
                      previewTab === "cover" && hasCoverBg
                        ? `url(${coverImageUrl})`
                        : (previewTab === "product" || previewTab === "index") && backgroundImageUrl
                        ? `url(${backgroundImageUrl})`
                        : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    color: textColor,
                  }}
                >
                  {selectedPreviewElement ? (
                    <div className="pointer-events-none absolute inset-0 z-30">
                      <div className="absolute bottom-0 left-1/2 top-0 border-l border-dashed border-allvino-secondary/70" />
                      <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-allvino-secondary/70" />
                    </div>
                  ) : null}

                  {/* Guias visuais de Margem e Segurança A4 (50px / ~6%) */}
                  {showSafetyGuides ? (
                    <div className="pointer-events-none absolute inset-[5.5%] z-20 rounded border border-dashed border-amber-400/60">
                      <span className="absolute -top-2.5 left-2 px-1 text-[8px] font-bold uppercase tracking-wider text-amber-500 bg-black/40 rounded">
                        Área de Segurança (Margem 50px)
                      </span>
                    </div>
                  ) : null}

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
                      {!hasCoverBg && showCoverDivider && (
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
                          transform: `translateY(${clamp(coverVerticalOffset) * previewScale}px)`,
                        }}
                      >
                        {showCoverLogo && (
                          <DraggablePreviewElement
                            className="relative mx-auto mb-6 w-fit"
                            elementId="cover-logo"
                            label="Logotipo"
                            onPositionChange={(x, y) => {
                              setCoverLogoXOffset(x);
                              setCoverLogoYOffset(y);
                              setIsDirty(true);
                            }}
                            onSelect={handleSelectPreviewElement}
                            rotation={coverLogoAngle}
                            scale={previewScale}
                            selected={selectedPreviewElement === "cover-logo"}
                            x={coverLogoXOffset}
                            y={coverLogoYOffset}
                          >
                            <img
                              src={previewLogoSrc}
                              alt="Logo"
                              className="object-contain"
                              draggable={false}
                              style={{ height: `${Math.round(coverLogoHeight * previewScale)}px` }}
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          </DraggablePreviewElement>
                        )}
                        {showCoverDivider && (
                          <div
                            className="w-16 h-px mx-auto mb-6"
                            style={{
                              background: coverSubtitleColor || (hasCoverBg ? "rgba(255,255,255,0.35)" : secondaryColor),
                            }}
                          />
                        )}
                        {showCoverTitle && (
                          <DraggablePreviewElement
                            className="relative mx-auto mb-3 w-fit"
                            elementId="cover-title"
                            label="Título da capa"
                            onPositionChange={(x, y) => {
                              setCoverTitleXOffset(x);
                              setCoverTitleYOffset(y);
                              setIsDirty(true);
                            }}
                            onSelect={handleSelectPreviewElement}
                            rotation={coverTitleAngle}
                            scale={previewScale}
                            selected={selectedPreviewElement === "cover-title"}
                            x={coverTitleXOffset}
                            y={coverTitleYOffset}
                          >
                            <h2
                              className="tracking-widest uppercase"
                              style={{
                                color: resolvedCoverTitleColor,
                                fontFamily: previewFont,
                                fontSize: `${Math.max(1, Math.round(coverTitleFontSize * previewScale))}px`,
                                fontWeight: 700,
                                textShadow: hasCoverBg ? "0 2px 10px rgba(0,0,0,.25)" : "none",
                              }}
                            >
                              {headerTitle}
                            </h2>
                          </DraggablePreviewElement>
                        )}
                        {showCoverSubtitle && coverSubtitle && (
                          <DraggablePreviewElement
                            className="relative mx-auto w-fit"
                            elementId="cover-subtitle"
                            label="Subtítulo da capa"
                            onPositionChange={(x, y) => {
                              setCoverSubtitleXOffset(x);
                              setCoverSubtitleYOffset(y);
                              setIsDirty(true);
                            }}
                            onSelect={handleSelectPreviewElement}
                            rotation={coverSubtitleAngle}
                            scale={previewScale}
                            selected={selectedPreviewElement === "cover-subtitle"}
                            x={coverSubtitleXOffset}
                            y={coverSubtitleYOffset}
                          >
                            <p
                              className="tracking-[5px] uppercase"
                              style={{
                                color: resolvedCoverSubColor,
                                fontSize: `${Math.max(1, Math.round(coverSubtitleFontSize * previewScale))}px`,
                              }}
                            >
                              {coverSubtitle}
                            </p>
                          </DraggablePreviewElement>
                        )}
                      </div>
                      {showCoverFooter && footerText && (
                        <DraggablePreviewElement
                          className="absolute bottom-6 left-0 right-0 z-10 text-center"
                          elementId="cover-footer"
                          label="Rodapé da capa"
                          onPositionChange={(x, y) => {
                            setCoverFooterXOffset(x);
                            setCoverFooterYOffset(y);
                            setIsDirty(true);
                          }}
                          onSelect={handleSelectPreviewElement}
                          scale={previewScale}
                          selected={selectedPreviewElement === "cover-footer"}
                          style={{
                            color: coverFooterColor || (hasCoverBg ? "rgba(255,255,255,0.55)" : "#999"),
                            fontSize: `${Math.max(1, Math.round(coverFooterFontSize * previewScale))}px`,
                          }}
                          x={coverFooterXOffset}
                          y={coverFooterYOffset}
                        >
                          {footerText}
                        </DraggablePreviewElement>
                      )}
                    </div>
                  )}

                  {/* ── INDEX / SUMMARY PREVIEW ── */}
                  {previewTab === "index" && (
                    <div
                      className="h-full flex flex-col justify-between px-8 relative overflow-hidden"
                      style={{
                        paddingTop: `${productPagePadding * previewScale}px`,
                        paddingBottom: `${productPagePadding * previewScale}px`,
                      }}
                    >
                      <div>
                        <div className="text-center mb-4">
                          <h2
                            className="font-bold tracking-wider"
                            style={{
                              fontFamily: previewFont,
                              color: resolvedProductNameColor,
                              fontSize: `${Math.max(12, Math.round(24 * previewScale))}px`,
                            }}
                          >
                            SUMÁRIO DE RÓTULOS
                          </h2>
                          <p
                            className="uppercase tracking-[2px] font-semibold mt-0.5"
                            style={{
                              color: resolvedProductSpecsColor,
                              fontSize: `${Math.max(7, Math.round(10 * previewScale))}px`,
                            }}
                          >
                            {(dbWines.length || 1)} rótulos ativos · Índice interativo clicável no PDF
                          </p>
                          {showProductDivider && (
                            <div
                              className="w-10 h-px mx-auto mt-2"
                              style={{ background: resolvedProductSpecsColor }}
                            />
                          )}
                        </div>

                        <div className="space-y-1.5">
                          {(dbWines.length > 0 ? dbWines.slice(0, 12) : [DEFAULT_PREVIEW_WINE]).map((item, idx) => {
                            const itemsPerPage =
                              productLayoutPreset === "editorial-duo"
                                ? 2
                                : productLayoutPreset === "commercial-grid"
                                ? 4
                                : productLayoutPreset === "executive-table"
                                ? 12
                                : 1;
                            const targetPage = Math.floor(idx / itemsPerPage) + 3;
                            const unitVal = item.precoPromocional ?? item.precoOriginal;
                            return (
                              <div
                                key={item.id}
                                className={`flex items-baseline justify-between py-1 ${
                                  showProductInternalLines ? "border-b border-dashed border-black/15" : ""
                                }`}
                                style={{ fontSize: `${Math.max(7, Math.round(10.5 * previewScale))}px` }}
                              >
                                <div className="truncate pr-2">
                                  <span
                                    className="font-bold"
                                    style={{ fontFamily: previewFont, color: resolvedProductNameColor }}
                                  >
                                    {item.name}
                                  </span>
                                  {showProductCategoryBadge && (
                                    <span
                                      className={`ml-1.5 rounded font-extrabold uppercase ${
                                        showProductPillBorders ? "px-1 py-0.5" : "px-0"
                                      }`}
                                      style={{
                                        background: showProductPillBorders ? "rgba(128,40,45,0.08)" : "transparent",
                                        color: resolvedProductNameColor,
                                        fontSize: `${Math.max(6, Math.round(7.5 * previewScale))}px`,
                                      }}
                                    >
                                      {item.categoria || "Tinto"}
                                    </span>
                                  )}
                                  <span
                                    className="ml-1.5 uppercase tracking-wider"
                                    style={{
                                      color: resolvedProductSpecsColor,
                                      fontSize: `${Math.max(6, Math.round(8.5 * previewScale))}px`,
                                    }}
                                  >
                                    {item.vinicola} · {item.paisOrigem} · Safra {item.safra}
                                  </span>
                                </div>
                                <div className="shrink-0 whitespace-nowrap">
                                  {showProductPrice && (
                                    <span className="font-bold mr-2" style={{ color: resolvedProductPriceColor }}>
                                      R$ {unitVal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                    </span>
                                  )}
                                  <span className="font-bold" style={{ color: secondaryColor }}>
                                    Pág. {targetPage}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {showProductFooter && (
                        <div
                          className={`w-full pt-2 pb-1 flex justify-between text-[6.5px] flex-shrink-0 ${
                            showProductInternalLines ? "border-t" : ""
                          }`}
                          style={{ borderColor: secondaryBorderSubtleCSS, color: resolvedProductSpecsColor, opacity: 0.78 }}
                        >
                          <span>{footerText}</span>
                          <span>Página 2</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── PRODUCT PREVIEW ACCORDING TO PRESET ── */}
                  {previewTab === "product" && (
                    <div
                      className="h-full flex flex-col items-center justify-between px-8 relative overflow-hidden"
                      style={{ paddingTop: `${productPagePadding * previewScale}px`, paddingBottom: `${productPagePadding * previewScale}px` }}
                    >
                      {productLayoutPreset === "editorial-duo" ? (
                        /* ── PREVIEW: 2 PRODUCTS PER PAGE (EDITORIAL DUO) ── */
                        <>
                          {showProductPageHeader && (productPageHeaderLeftText.trim() || productPageHeaderRightText.trim()) && (
                            <div
                              className={`w-full flex items-baseline justify-between pb-1.5 mb-2 shrink-0 ${
                                showProductInternalLines ? "border-b" : ""
                              }`}
                              style={{ borderColor: secondaryColor }}
                            >
                              <span
                                className="font-bold tracking-widest uppercase"
                                style={{
                                  fontFamily: previewFont,
                                  color: resolvedProductNameColor,
                                  fontSize: `${Math.max(8, Math.round(12 * previewScale))}px`,
                                }}
                              >
                                {productPageHeaderLeftText}
                              </span>
                              <span
                                className="uppercase tracking-widest"
                                style={{
                                  color: resolvedProductSpecsColor,
                                  fontSize: `${Math.max(6, Math.round(8.5 * previewScale))}px`,
                                }}
                              >
                                {productPageHeaderRightText}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 w-full flex flex-col justify-between gap-3 py-1 min-h-0">
                            {[
                              previewWine,
                              dbWines.find((w) => w.id !== previewWine.id) || DEFAULT_PREVIEW_WINE,
                            ].map((wineItem, idx) => {
                              const unitPrice = wineItem.precoPromocional ?? wineItem.precoOriginal;
                              const boxTotal = unitPrice * 6;
                              const duoSecondaryLabel =
                                productPriceInfoText || (showProductBoxPrice ? "Caixa c/ 6" : "Embalagem");
                              const duoSecondaryVal = showProductBoxPrice
                                ? `R$ ${boxTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                                : productPriceInfoText
                                ? ""
                                : "6 un.";
                              return (
                                <div
                                  key={`${wineItem.id}-${idx}`}
                                  className={`flex-1 flex items-center gap-3 rounded-lg p-3 min-h-0 transition-colors ${
                                    showProductCardBorder ? "border" : ""
                                  }`}
                                  style={{
                                    backgroundColor: cardSurfaceBgCSS,
                                    borderColor: secondaryBorderSubtleCSS,
                                    boxShadow: cardSurfaceShadowCSS,
                                  }}
                                >
                                  {showProductBottle && (
                                    <div className="w-1/4 h-full flex items-center justify-center shrink-0">
                                      <img
                                        src={wineItem.imagemUrl}
                                        alt={wineItem.name}
                                        className="max-h-full max-w-full object-contain"
                                        style={{ filter: "drop-shadow(0 6px 12px rgba(0,0,0,.12))" }}
                                      />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                                    <div>
                                      <div className="flex flex-wrap items-center gap-1 mb-1">
                                        {showProductCountryFlag && (
                                          <span
                                            className={`inline-flex items-center gap-1 text-[7px] font-bold uppercase ${
                                              showProductPillBorders ? "rounded-full border px-1.5 py-0.5" : "px-0"
                                            }`}
                                            style={{
                                              backgroundColor: showProductPillBorders ? metaBadgeBgCSS : "transparent",
                                              borderColor: secondaryBorderSubtleCSS,
                                              color: textColor,
                                            }}
                                          >
                                            <img
                                              src={getCountryFlagUrl(wineItem.paisOrigem)}
                                              alt=""
                                              className="w-2.5 h-2 object-cover rounded-xs"
                                            />
                                            {wineItem.paisOrigem}
                                          </span>
                                        )}
                                        {!showProductPillBorders && showProductCountryFlag && showProductCategoryBadge && (
                                          <span className="text-[7px] opacity-70" style={{ color: secondaryColor }}>
                                            ·
                                          </span>
                                        )}
                                        {showProductCategoryBadge && (
                                          <span
                                            className={`text-[7px] font-bold uppercase ${
                                              showProductPillBorders ? "rounded-full border px-1.5 py-0.5" : "px-0"
                                            }`}
                                            style={{
                                              backgroundColor: showProductPillBorders ? metaBadgeBgCSS : "transparent",
                                              borderColor: secondaryColor,
                                              color: resolvedProductNameColor,
                                            }}
                                          >
                                            {wineItem.categoria || "Tinto"}
                                          </span>
                                        )}
                                      </div>
                                      {showProductName && (
                                        <h3
                                          className="font-bold leading-tight truncate"
                                          style={{
                                            fontFamily: previewFont,
                                            color: resolvedProductNameColor,
                                            fontSize: `${Math.max(10, Math.round(17 * previewScale))}px`,
                                          }}
                                        >
                                          {wineItem.name}
                                        </h3>
                                      )}
                                      {showProductOrigin && (
                                        <p
                                          className="uppercase tracking-wider font-semibold"
                                          style={{
                                            color: resolvedProductSpecsColor,
                                            fontSize: `${Math.max(6, Math.round(8.5 * previewScale))}px`,
                                          }}
                                        >
                                          {wineItem.vinicola} · {wineItem.regiao}
                                        </p>
                                      )}
                                      {showProductDivider && (
                                        <div
                                          className="w-8 h-px my-1.5"
                                          style={{ background: secondaryColor }}
                                        />
                                      )}
                                      {showProductSpecs && (
                                        showProductInternalLines ? (
                                          <div
                                            className="grid grid-cols-3 gap-1 my-1.5 py-1.5 px-1 border-y"
                                            style={{
                                              backgroundColor: specGridBgCSS,
                                              borderColor: secondaryBorderSubtleCSS,
                                            }}
                                          >
                                            <div>
                                              <span
                                                className="block text-[6px] font-bold uppercase opacity-85"
                                                style={{ color: resolvedProductSpecsColor }}
                                              >
                                                UVA
                                              </span>
                                              <span className="block truncate font-semibold text-[7.5px]">{wineItem.uva}</span>
                                            </div>
                                            <div>
                                              <span
                                                className="block text-[6px] font-bold uppercase opacity-85"
                                                style={{ color: resolvedProductSpecsColor }}
                                              >
                                                SAFRA
                                              </span>
                                              <span className="block font-semibold text-[7.5px]">{wineItem.safra}</span>
                                            </div>
                                            <div>
                                              <span
                                                className="block text-[6px] font-bold uppercase opacity-85"
                                                style={{ color: resolvedProductSpecsColor }}
                                              >
                                                TEOR ALC.
                                              </span>
                                              <span className="block font-semibold text-[7.5px]">{wineItem.teorAlcoolico}% vol</span>
                                            </div>
                                          </div>
                                        ) : (
                                          <p
                                            className="uppercase tracking-wider font-semibold my-1.5"
                                            style={{
                                              color: resolvedProductSpecsColor,
                                              fontSize: `${Math.max(6.5, Math.round(8.5 * previewScale))}px`,
                                            }}
                                          >
                                            {wineItem.uva} &nbsp;·&nbsp; Safra {wineItem.safra} &nbsp;·&nbsp; {wineItem.teorAlcoolico}% vol
                                          </p>
                                        )
                                      )}
                                      {showProductDescription && (
                                        <p
                                          className="line-clamp-3 leading-relaxed"
                                          style={{
                                            color: resolvedProductDescColor,
                                            fontSize: `${Math.max(7, Math.round(10 * previewScale))}px`,
                                          }}
                                        >
                                          {wineItem.notasDegustacao || previewWineDesc}
                                        </p>
                                      )}
                                    </div>
                                    {showProductPrice && (
                                      <div
                                        className={`flex items-end justify-between mt-1 ${
                                          showProductInternalLines ? "border-t pt-1.5" : "pt-0.5"
                                        }`}
                                        style={{ borderColor: secondaryBorderSubtleCSS }}
                                      >
                                        <div>
                                          {showProductPriceLabel && productPriceLabelText.trim() && (
                                            <span
                                              className="block uppercase font-bold tracking-wider"
                                              style={{
                                                color: resolvedProductPriceLabelColor,
                                                fontSize: `${Math.max(6, Math.round(7.5 * previewScale))}px`,
                                              }}
                                            >
                                              {productPriceLabelText}
                                            </span>
                                          )}
                                          <span
                                            className="font-extrabold"
                                            style={{
                                              color: resolvedProductPriceColor,
                                              fontSize: `${Math.max(9, Math.round(15 * previewScale))}px`,
                                            }}
                                          >
                                            R$ {unitPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                          </span>
                                        </div>
                                        {showProductPriceInfo && (
                                          <div className="text-right">
                                            {duoSecondaryLabel && (
                                              <span
                                                className="block uppercase font-bold"
                                                style={{
                                                  color: resolvedProductPriceInfoColor,
                                                  fontSize: `${Math.max(6, Math.round(7.5 * previewScale))}px`,
                                                }}
                                              >
                                                {duoSecondaryLabel}
                                              </span>
                                            )}
                                            {duoSecondaryVal && (
                                              <span
                                                className="font-extrabold"
                                                style={{
                                                  color: secondaryColor,
                                                  fontSize: `${Math.max(7, Math.round(10.5 * previewScale))}px`,
                                                }}
                                              >
                                                {duoSecondaryVal}
                                              </span>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      ) : productLayoutPreset === "commercial-grid" ? (
                        /* ── PREVIEW: 4 PRODUCTS PER PAGE (2x2 COMMERCIAL B2B GRID) ── */
                        <>
                          {showProductPageHeader && (productPageHeaderLeftText.trim() || productPageHeaderRightText.trim()) && (
                            <div
                              className={`w-full flex items-baseline justify-between pb-1.5 mb-2 shrink-0 ${
                                showProductInternalLines ? "border-b" : ""
                              }`}
                              style={{ borderColor: secondaryColor }}
                            >
                              <span
                                className="font-bold tracking-widest uppercase"
                                style={{
                                  fontFamily: previewFont,
                                  color: resolvedProductNameColor,
                                  fontSize: `${Math.max(8, Math.round(12 * previewScale))}px`,
                                }}
                              >
                                {productPageHeaderLeftText}
                              </span>
                              <span
                                className="uppercase tracking-widest"
                                style={{
                                  color: resolvedProductSpecsColor,
                                  fontSize: `${Math.max(6, Math.round(8.5 * previewScale))}px`,
                                }}
                              >
                                {productPageHeaderRightText}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 w-full grid grid-cols-2 grid-rows-2 gap-2.5 py-1 min-h-0">
                            {Array.from({ length: 4 }, (_, idx) => {
                              const sourceList = dbWines.length > 0 ? dbWines : [DEFAULT_PREVIEW_WINE];
                              const wineItem = idx === 0 ? previewWine : sourceList[idx % sourceList.length];
                              const unitPrice = wineItem.precoPromocional ?? wineItem.precoOriginal;
                              const boxTotal = unitPrice * 6;
                              const gridSecondaryLabel = productPriceInfoText || "Caixa c/ 6";
                              const gridSecondaryVal = showProductBoxPrice
                                ? `R$ ${boxTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                                : productPriceInfoText
                                ? ""
                                : "6 un.";
                              return (
                                <div
                                  key={`${wineItem.id}-${idx}`}
                                  className={`flex flex-col justify-between rounded-lg p-2.5 min-h-0 transition-colors ${
                                    showProductCardBorder ? "border" : ""
                                  }`}
                                  style={{
                                    backgroundColor: cardSurfaceBgCSS,
                                    borderColor: secondaryBorderSubtleCSS,
                                    boxShadow: cardSurfaceShadowCSS,
                                  }}
                                >
                                  <div
                                    className={`flex flex-col items-center pb-1.5 mb-1.5 ${
                                      showProductInternalLines ? "border-b" : ""
                                    }`}
                                    style={{ borderColor: secondaryBorderSubtleCSS }}
                                  >
                                    <div className="flex items-center gap-1 mb-1">
                                      {showProductCountryFlag && (
                                        <span
                                          className={`inline-flex items-center gap-1 text-[6.5px] font-bold uppercase ${
                                            showProductPillBorders ? "rounded-full border px-1.5 py-0.2" : "px-0"
                                          }`}
                                          style={{
                                            backgroundColor: showProductPillBorders ? metaBadgeBgCSS : "transparent",
                                            borderColor: secondaryBorderSubtleCSS,
                                            color: textColor,
                                          }}
                                        >
                                          <img
                                            src={getCountryFlagUrl(wineItem.paisOrigem)}
                                            alt=""
                                            className="w-2.5 h-1.5 object-cover"
                                          />
                                          {wineItem.paisOrigem}
                                        </span>
                                      )}
                                      {!showProductPillBorders && showProductCountryFlag && showProductCategoryBadge && (
                                        <span className="text-[6.5px] opacity-70" style={{ color: secondaryColor }}>
                                          ·
                                        </span>
                                      )}
                                      {showProductCategoryBadge && (
                                        <span
                                          className={`text-[6.5px] font-bold uppercase ${
                                            showProductPillBorders ? "rounded-full border px-1.5 py-0.2" : "px-0"
                                          }`}
                                          style={{
                                            backgroundColor: showProductPillBorders ? metaBadgeBgCSS : "transparent",
                                            borderColor: secondaryColor,
                                            color: resolvedProductNameColor,
                                          }}
                                        >
                                          {wineItem.categoria || "Tinto"}
                                        </span>
                                      )}
                                    </div>
                                    {showProductBottle && (
                                      <div className="h-20 w-full flex items-center justify-center">
                                        <img
                                          src={wineItem.imagemUrl}
                                          alt={wineItem.name}
                                          className="max-h-full max-w-full object-contain"
                                        />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-h-0">
                                    {showProductOrigin && (
                                      <p
                                        className="uppercase tracking-wider font-bold truncate"
                                        style={{
                                          color: resolvedProductSpecsColor,
                                          fontSize: `${Math.max(6, Math.round(7.5 * previewScale))}px`,
                                        }}
                                      >
                                        {wineItem.vinicola} · {wineItem.paisOrigem}
                                      </p>
                                    )}
                                    {showProductName && (
                                      <h4
                                        className="font-bold leading-tight truncate"
                                        style={{
                                          fontFamily: previewFont,
                                          color: resolvedProductNameColor,
                                          fontSize: `${Math.max(8, Math.round(12.5 * previewScale))}px`,
                                        }}
                                      >
                                        {wineItem.name}
                                      </h4>
                                    )}
                                    {showProductSpecs && (
                                      <p
                                        className="truncate font-semibold"
                                        style={{
                                          color: resolvedProductSpecsColor,
                                          fontSize: `${Math.max(6, Math.round(8 * previewScale))}px`,
                                        }}
                                      >
                                        {wineItem.uva} · Safra {wineItem.safra}
                                      </p>
                                    )}
                                    {showProductDescription && (
                                      <p
                                        className="line-clamp-2 mt-0.5 leading-snug"
                                        style={{
                                          color: resolvedProductDescColor,
                                          fontSize: `${Math.max(6, Math.round(8.5 * previewScale))}px`,
                                        }}
                                      >
                                        {wineItem.notasDegustacao || previewWineDesc}
                                      </p>
                                    )}
                                  </div>
                                  {showProductPrice && (
                                    <div
                                      className={`flex items-end justify-between mt-1 ${
                                        showProductInternalLines ? "border-t pt-1" : "pt-0.5"
                                      }`}
                                      style={{ borderColor: secondaryBorderSubtleCSS }}
                                    >
                                      <div>
                                        {showProductPriceLabel && productPriceLabelText.trim() && (
                                          <span
                                            className="block text-[6px] uppercase font-bold"
                                            style={{ color: resolvedProductPriceLabelColor }}
                                          >
                                            {productPriceLabelText}
                                          </span>
                                        )}
                                        <span
                                          className="font-extrabold"
                                          style={{
                                            color: resolvedProductPriceColor,
                                            fontSize: `${Math.max(8, Math.round(12 * previewScale))}px`,
                                          }}
                                        >
                                          R$ {unitPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                        </span>
                                      </div>
                                      {showProductPriceInfo && (
                                        <div className="text-right">
                                          <span
                                            className="block text-[6px] uppercase font-bold"
                                            style={{ color: resolvedProductPriceInfoColor }}
                                          >
                                            {gridSecondaryLabel}
                                          </span>
                                          {gridSecondaryVal && (
                                            <span
                                              className="font-bold"
                                              style={{
                                                color: secondaryColor,
                                                fontSize: `${Math.max(7, Math.round(9.5 * previewScale))}px`,
                                              }}
                                            >
                                              {gridSecondaryVal}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </>
                      ) : productLayoutPreset === "executive-table" ? (
                        /* ── PREVIEW: 12 PRODUCTS PER PAGE (EXECUTIVE B2B TABLE) ── */
                        <div className="w-full flex-1 flex flex-col justify-start">
                          {showProductPageHeader && (productPageHeaderLeftText.trim() || productPageHeaderRightText.trim()) && (
                            <div
                              className={`w-full flex items-baseline justify-between pb-1.5 mb-2 ${
                                showProductInternalLines ? "border-b" : ""
                              }`}
                              style={{ borderColor: secondaryColor }}
                            >
                              <span
                                className="font-bold tracking-widest uppercase"
                                style={{
                                  fontFamily: previewFont,
                                  color: resolvedProductNameColor,
                                  fontSize: `${Math.max(8, Math.round(12 * previewScale))}px`,
                                }}
                              >
                                {productPageHeaderLeftText}
                              </span>
                              <span
                                className="uppercase tracking-widest"
                                style={{
                                  color: resolvedProductSpecsColor,
                                  fontSize: `${Math.max(6, Math.round(8 * previewScale))}px`,
                                }}
                              >
                                {productPageHeaderRightText || "12 rótulos / página"}
                              </span>
                            </div>
                          )}
                          <div
                            className={`w-full rounded p-2 overflow-hidden transition-colors ${
                              showProductCardBorder ? "border" : ""
                            }`}
                            style={{
                              backgroundColor: cardSurfaceBgCSS,
                              borderColor: secondaryBorderSubtleCSS,
                              boxShadow: cardSurfaceShadowCSS,
                            }}
                          >
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr
                                  className={`uppercase text-[7px] font-extrabold ${
                                    showProductInternalLines ? "border-b" : ""
                                  }`}
                                  style={{ borderColor: secondaryColor, color: resolvedProductNameColor }}
                                >
                                  <th className="py-1 px-1">Rótulo & Vinícola</th>
                                  <th className="py-1 px-1">Tipo</th>
                                  <th className="py-1 px-1">País</th>
                                  <th className="py-1 px-1 text-center">Safra</th>
                                  {showProductPrice && (
                                    <>
                                      <th className="py-1 px-1 text-right">
                                        {showProductPriceLabel && productPriceLabelText.trim() ? productPriceLabelText : "Valor"}
                                      </th>
                                      {showProductPriceInfo && (
                                        <th className="py-1 px-1 text-right">{productPriceInfoText || "Caixa c/ 6"}</th>
                                      )}
                                    </>
                                  )}
                                </tr>
                              </thead>
                              <tbody className={`text-[7.5px] ${showProductInternalLines ? "divide-y divide-amber-200/30" : ""}`}>
                                {(dbWines.length > 0 ? dbWines.slice(0, 10) : [DEFAULT_PREVIEW_WINE]).map((w) => {
                                  const unit = w.precoPromocional ?? w.precoOriginal;
                                  return (
                                    <tr key={w.id}>
                                      <td className="py-1 px-1">
                                        <div
                                          className="font-bold truncate max-w-[140px]"
                                          style={{ fontFamily: previewFont, color: resolvedProductNameColor }}
                                        >
                                          {w.name}
                                        </div>
                                        <div className="text-[6.5px]" style={{ color: resolvedProductSpecsColor }}>
                                          {w.vinicola}
                                        </div>
                                      </td>
                                      <td className="py-1 px-1">{w.categoria || "Tinto"}</td>
                                      <td className="py-1 px-1">{w.paisOrigem}</td>
                                      <td className="py-1 px-1 text-center font-semibold">{w.safra}</td>
                                      {showProductPrice && (
                                        <>
                                          <td
                                            className="py-1 px-1 text-right font-extrabold"
                                            style={{ color: resolvedProductPriceColor }}
                                          >
                                            R$ {unit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                          </td>
                                          {showProductPriceInfo && (
                                            <td
                                              className="py-1 px-1 text-right font-bold"
                                              style={{ color: secondaryColor }}
                                            >
                                              {showProductBoxPrice
                                                ? `R$ ${(unit * 6).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                                                : productPriceInfoText || "6 un."}
                                            </td>
                                          )}
                                        </>
                                      )}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        /* ── 1 PRODUCT PER PAGE PREVIEW (CLASSIC, SIDE-RIGHT, SIDE-LEFT, PRICE-TOP) ── */
                        <>
                          {/* Product Header */}
                          <DraggablePreviewElement
                            className="relative w-full flex-shrink-0 pt-2 text-center"
                            elementId="product-header"
                            label="Cabeçalho do produto"
                            onPositionChange={(x, y) => {
                              setProductNameXOffset(x);
                              setProductNameYOffset(y);
                              setIsDirty(true);
                            }}
                            onSelect={handleSelectPreviewElement}
                            scale={previewScale}
                            selected={selectedPreviewElement === "product-header"}
                            x={productNameXOffset}
                            y={productNameYOffset}
                          >
                            {(showProductCountryFlag || showProductCategoryBadge || (showProductDiscountBadge && previewWine.precoPromocional)) && (
                              <div className="flex items-center justify-center gap-1.5 mb-1 flex-wrap">
                                {showProductCountryFlag && (
                                  <span
                                    className={`inline-flex items-center gap-1 text-[7.5px] font-bold uppercase tracking-wider ${
                                      showProductPillBorders ? "rounded-full border px-2 py-0.5" : "px-0"
                                    }`}
                                    style={{
                                      backgroundColor: showProductPillBorders ? metaBadgeBgCSS : "transparent",
                                      borderColor: secondaryBorderSubtleCSS,
                                      color: textColor,
                                    }}
                                  >
                                    <img
                                      src={getCountryFlagUrl(previewWine.paisOrigem)}
                                      alt=""
                                      className="w-3 h-2 object-cover rounded-xs"
                                    />
                                    {previewWine.paisOrigem}
                                  </span>
                                )}
                                {!showProductPillBorders && showProductCountryFlag && showProductCategoryBadge && (
                                  <span className="text-[8px] opacity-70" style={{ color: secondaryColor }}>
                                    ·
                                  </span>
                                )}
                                {showProductCategoryBadge && (
                                  <span
                                    className={`text-[7.5px] font-bold uppercase tracking-wider ${
                                      showProductPillBorders ? "rounded-full border px-2 py-0.5" : "px-0"
                                    }`}
                                    style={{
                                      backgroundColor: showProductPillBorders ? metaBadgeBgCSS : "transparent",
                                      borderColor: secondaryColor,
                                      color: resolvedProductNameColor,
                                    }}
                                  >
                                    {previewWine.categoria || "Tinto"}
                                  </span>
                                )}
                                {showProductDiscountBadge &&
                                  previewWine.precoPromocional &&
                                  previewWine.precoOriginal > previewWine.precoPromocional && (
                                    <span
                                      className="rounded-full px-2 py-0.5 text-[7.5px] font-extrabold uppercase text-white"
                                      style={{ background: primaryColor }}
                                    >
                                      -{Math.round((1 - previewWine.precoPromocional / previewWine.precoOriginal) * 100)}% OFF
                                    </span>
                                  )}
                              </div>
                            )}
                            {showProductName && (<h2
                              className="font-bold mb-1 transition-all leading-tight"
                              style={{
                                color: resolvedProductNameColor,
                                fontFamily: previewFont,
                                fontSize: `${Math.max(1, Math.round(productNameFontSize * previewScale))}px`,
                              }}
                            >
                              {previewWine.name}
                            </h2>)}
                            {showProductOrigin && (<p
                              className="uppercase tracking-[3px] font-semibold transition-all"
                              style={{
                                color: resolvedProductSpecsColor,
                                fontSize: `${Math.max(1, Math.round(productSpecsFontSize * previewScale))}px`,
                                transform: `translateY(${clamp(productOriginYOffset) * previewScale}px)`,
                              }}
                            >
                              {previewWine.paisOrigem} · {previewWine.regiao}
                            </p>)}
                            {showProductDivider && (<div
                              className="w-10 h-px mx-auto my-2"
                              style={{ background: resolvedProductSpecsColor }}
                            />)}
                          </DraggablePreviewElement>

                          {/* ── SIDE-BY-SIDE MAGAZINE LAYOUT ── */}
                          {(productLayoutPreset === "side-right" || productLayoutPreset === "side-left") ? (
                            <div
                              className={`flex-1 w-full flex items-center justify-between gap-4 py-2 relative min-h-0 overflow-visible ${
                                productLayoutPreset === "side-left" ? "flex-row-reverse" : "flex-row"
                              }`}
                            >
                              {/* Bottle Column */}
                              {showProductBottle && (<DraggablePreviewElement
                                className="relative flex h-full w-1/2 items-center justify-center"
                                elementId="product-bottle"
                                label="Garrafa"
                                onPositionChange={(x, y) => {
                                  setProductImgXOffset(x);
                                  setProductImgYOffset(y);
                                  setIsDirty(true);
                                }}
                                onSelect={handleSelectPreviewElement}
                                rotation={productImgAngle}
                                scale={previewScale}
                                selected={selectedPreviewElement === "product-bottle"}
                                x={productImgXOffset}
                                y={productImgYOffset}
                              >
                                <img
                                  src={previewWine.imagemUrl}
                                  alt={previewWine.name}
                                  draggable={false}
                                  className="object-contain h-full transition-all duration-150"
                                  style={{
                                    maxHeight: `${Math.round(productImgHeight * previewScale)}px`,
                                    maxWidth: "100%",
                                    filter: "drop-shadow(0 8px 20px rgba(0,0,0,.12))",
                                  }}
                                />
                              </DraggablePreviewElement>)}

                              {/* Content Column (Specs + Tasting Notes) */}
                              <div className={`${showProductBottle ? "w-1/2" : "w-full"} flex flex-col justify-center gap-3`}>
                                {/* Tasting Notes & Specs */}
                                <DraggablePreviewElement
                                  className="relative"
                                  elementId="product-description"
                                  label="Textos do produto"
                                  onPositionChange={(x, y) => {
                                    setProductDescXOffset(x);
                                    setProductDescYOffset(clamp(y, -150, 150));
                                    setIsDirty(true);
                                  }}
                                  onSelect={handleSelectPreviewElement}
                                  rotation={productDescAngle}
                                  scale={previewScale}
                                  selected={selectedPreviewElement === "product-description"}
                                  style={{
                                    textAlign: productDescAlign,
                                  }}
                                  x={productDescXOffset}
                                  y={productDescYOffset}
                                >
                                  {showProductSpecs && (<p
                                    className="uppercase tracking-wider mb-1 font-semibold"
                                    style={{
                                      color: resolvedProductSpecsColor,
                                      fontSize: `${Math.max(1, Math.round(productSpecsFontSize * previewScale))}px`,
                                    }}
                                  >
                                    {previewWine.vinicola} · {previewWine.uva} · Safra {previewWine.safra} · {previewWine.teorAlcoolico}% vol
                                  </p>)}
                                  {showProductDescription && (<p
                                    className="leading-relaxed transition-all"
                                    style={{
                                      color: resolvedProductDescColor,
                                      fontWeight: 400,
                                      fontSize: `${Math.max(1, Math.round(productDescFontSize * previewScale))}px`,
                                    }}
                                  >
                                    {previewWineDesc}
                                  </p>)}
                                </DraggablePreviewElement>
                              </div>
                            </div>
                          ) : (
                            /* ── CLASSIC & PRICE-TOP LAYOUTS ── */
                            <>
                              <div className="flex-1 w-full flex items-center justify-center py-1 relative min-h-0 overflow-visible">
                                {showProductBottle && (
                                  <DraggablePreviewElement
                                    className="relative flex h-full items-center justify-center"
                                    elementId="product-bottle"
                                    label="Garrafa"
                                    onPositionChange={(x, y) => {
                                      setProductImgXOffset(x);
                                      setProductImgYOffset(y);
                                      setIsDirty(true);
                                    }}
                                    onSelect={handleSelectPreviewElement}
                                    rotation={productImgAngle}
                                    scale={previewScale}
                                    selected={selectedPreviewElement === "product-bottle"}
                                    x={productImgXOffset}
                                    y={productImgYOffset}
                                  >
                                    <img
                                      src={previewWine.imagemUrl}
                                      alt={previewWine.name}
                                      draggable={false}
                                      className="object-contain h-full transition-all duration-150"
                                      style={{
                                        maxHeight: `${Math.round(productImgHeight * previewScale)}px`,
                                        maxWidth: `${Math.round(productImgHeight * 0.52 * previewScale)}px`,
                                        filter: "drop-shadow(0 8px 20px rgba(0,0,0,.12))",
                                      }}
                                    />
                                  </DraggablePreviewElement>
                                )}
                              </div>

                              {/* Details: Specs & Tasting Description */}
                              <DraggablePreviewElement
                                className="relative my-1 w-full flex-shrink-0 text-center"
                                elementId="product-description"
                                label="Textos do produto"
                                onPositionChange={(x, y) => {
                                  setProductDescXOffset(x);
                                  setProductDescYOffset(clamp(y, -150, 150));
                                  setIsDirty(true);
                                }}
                                onSelect={handleSelectPreviewElement}
                                rotation={productDescAngle}
                                scale={previewScale}
                                selected={selectedPreviewElement === "product-description"}
                                style={{
                                  maxWidth: `${Math.round(productTextMaxWidth * previewScale)}px`,
                                  textAlign: productDescAlign,
                                }}
                                x={productDescXOffset}
                                y={productDescYOffset}
                              >
                                {showProductSpecs && (<p
                                  className="uppercase tracking-wider mb-1 transition-all"
                                  style={{
                                    color: resolvedProductSpecsColor,
                                    fontSize: `${Math.max(1, Math.round(productSpecsFontSize * previewScale))}px`,
                                  }}
                                >
                                  {previewWine.vinicola} · {previewWine.uva} · Safra {previewWine.safra} · {previewWine.teorAlcoolico}% vol
                                </p>)}
                                {showProductDescription && (<p
                                  className="leading-relaxed transition-all"
                                  style={{
                                    color: resolvedProductDescColor,
                                    fontWeight: 400,
                                    fontSize: `${Math.max(1, Math.round(productDescFontSize * previewScale))}px`,
                                  }}
                                >
                                  {previewWineDesc}
                                </p>)}
                              </DraggablePreviewElement>
                            </>
                          )}

                          {/* ── 100% AUTONOMOUS FREE PRICE ELEMENT OVERLAY ── */}
                          {showProductPrice && (<div
                            className="absolute left-1/2 z-20 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap"
                            style={{
                              top: productLayoutPreset === "price-top" ? "18%" : "45%",
                            }}
                          >
                            <DraggablePreviewElement
                              className="relative"
                              elementId="product-price"
                              label="Preço B2B"
                              onPositionChange={(x, y) => {
                                setProductPriceXOffset(clamp(x, -350, 350));
                                setProductPriceYOffset(clamp(y, -450, 450));
                                setIsDirty(true);
                              }}
                              onSelect={handleSelectPreviewElement}
                              rotation={productPriceAngle}
                              scale={previewScale}
                              selected={selectedPreviewElement === "product-price"}
                              style={{
                                textAlign: productPriceSide === "left" ? "right" : productPriceSide === "center" ? "center" : "left",
                              }}
                              x={productPriceXOffset}
                              y={productPriceYOffset}
                            >
                              {showProductPriceLabel && productPriceLabelText.trim() && (
                                <p
                                  className="uppercase tracking-[1.5px] font-bold mb-0.5"
                                  style={{ color: resolvedProductPriceLabelColor, fontSize: `${Math.max(1, Math.round(productPriceLabelFontSize * previewScale))}px` }}
                                >
                                  {productPriceLabelText}
                                </p>
                              )}
                              {showProductPriceInfo && (
                                <p
                                  className="font-semibold mb-1"
                                  style={{ color: resolvedProductPriceInfoColor, fontSize: `${Math.max(1, Math.round(productPriceInfoFontSize * previewScale))}px` }}
                                >
                                  {showProductBoxPrice
                                    ? `${productPriceInfoText || "Caixa c/ 6"}: R$ ${((previewWine.precoPromocional ?? previewWine.precoOriginal) * 6).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                                    : productPriceInfoText || "Caixa c/ 6 garrafas"}
                                </p>
                              )}
                              <div className={`flex items-baseline gap-1.5 ${productPriceSide === "center" ? "justify-center" : productPriceSide === "left" ? "justify-end" : "justify-start"}`}>
                                <span
                                  className="font-extrabold"
                                  style={{ color: resolvedProductPriceColor, fontSize: `${Math.max(1, Math.round(productPriceValueFontSize * previewScale))}px` }}
                                >
                                  R$ {(previewWine.precoPromocional ?? previewWine.precoOriginal).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                </span>
                                {previewWine.precoPromocional !== null && previewWine.precoPromocional !== undefined && (
                                  <span className="text-gray-400 line-through text-[9px]">
                                    R$ {previewWine.precoOriginal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                  </span>
                                )}
                              </div>
                            </DraggablePreviewElement>
                          </div>)}
                        </>
                      )}

                      {/* Footer */}
                      {showProductFooter && (<div
                        className={`w-full pt-2 pb-1 flex justify-between text-[6.5px] flex-shrink-0 ${
                          showProductInternalLines ? "border-t" : ""
                        }`}
                        style={{ borderColor: secondaryBorderSubtleCSS, color: resolvedProductSpecsColor, opacity: 0.78 }}
                      >
                        <span>{footerText}</span>
                        <span>Página 2</span>
                      </div>)}
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
