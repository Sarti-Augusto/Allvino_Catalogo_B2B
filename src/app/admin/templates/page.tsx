"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DraggablePreviewElement } from "@/components/admin/template-editor/draggable-preview-element";

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
  productLayoutPreset?: "classic" | "side-right" | "side-left" | "price-top";
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

const colorInputValue = (value: string, fallback: string) =>
  /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value) ? value : fallback;

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
  const [footerText, setFooterText] = useState("");
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
  const [productLayoutPreset, setProductLayoutPreset] = useState<"classic" | "side-right" | "side-left" | "price-top">("classic");
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
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(0.72);
  const [selectedPreviewElement, setSelectedPreviewElement] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  useEffect(() => {
    fetchTemplates();
    fetchWines();
  }, []);

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

    setSelectedPreviewElement(null);
    setIsDirty(true);
    showToast("Posições e ângulos centralizados. Salve para aplicar.");
  };

  const applyTemplate = (template: Template) => {
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
      setShowProductName(s.showProductName !== false);
      setShowProductOrigin(s.showProductOrigin !== false);
      setShowProductDivider(s.showProductDivider !== false);
      setShowProductBottle(s.showProductBottle !== false);
      setShowProductSpecs(s.showProductSpecs !== false);
      setShowProductDescription(s.showProductDescription !== false);
      setShowProductPrice(s.showProductPrice !== false);
      setShowProductFooter(s.showProductFooter !== false);
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
  });

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
        setIsDirty(true);
        showToast(`${imageLabel} otimizada e pronta para salvar.`);
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
      ? "Inter, sans-serif"
      : fontFamily === "Cinzel"
      ? "Georgia, serif"
      : "Georgia, serif";

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
              Posicionamento 100% autônomo e livre para o Preço (qualquer coordenada X/Y e ângulo na folha A4).
            </p>
            <p className="text-allvino-on-surface-variant/80 text-[11px] mt-2">
              As medidas de posição, altura e fonte são em pixels do PDF A4. A prévia é redimensionada proporcionalmente para manter a mesma escala da exportação.
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
            <div className="order-last space-y-6 lg:order-none lg:col-span-5">
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
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-allvino-outline-variant/20 pt-3">
                  <span className="text-[10px] text-allvino-on-surface-variant">
                    {isDirty ? "Salve as alterações antes de duplicar." : "A cópia é criada como template inativo."}
                  </span>
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

              {/* LAYOUT PRESETS SELECTION */}
              <div className="glass-panel p-5 rounded-xl border border-allvino-outline-variant/30 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-allvino-primary">
                  📰 Estrutura / Preset do Layout do Produto
                </label>
                <p className="text-[10px] text-allvino-on-surface-variant leading-relaxed">
                  Escolha se o texto fica ao lado da garrafa, no topo ou embaixo.
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
                      onClick={() => {
                        setProductLayoutPreset(p.id as any);
                        setIsDirty(true);
                      }}
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
                      O Preço B2B pode ser ocultado e posicionado por deslocamento em pixels. Valores positivos movem para direita/baixo; negativos para esquerda/cima.
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      <VisibilityToggle label="Exibir preço B2B" checked={showProductPrice} onChange={setShowProductPrice} />
                    </div>

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

                    <div className="grid grid-cols-2 gap-2">
                      <VisibilityToggle label="Exibir nome do vinho" checked={showProductName} onChange={setShowProductName} />
                      <VisibilityToggle label="Exibir origem/região" checked={showProductOrigin} onChange={setShowProductOrigin} />
                      <VisibilityToggle label="Exibir linha divisória" checked={showProductDivider} onChange={setShowProductDivider} />
                      <VisibilityToggle label="Exibir ficha técnica" checked={showProductSpecs} onChange={setShowProductSpecs} />
                      <VisibilityToggle label="Exibir notas de degustação" checked={showProductDescription} onChange={setShowProductDescription} />
                    </div>

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
                    <div className="space-y-2 pb-3 border-b border-allvino-outline-variant/20">
                      <p className="text-[11px] font-bold text-allvino-primary">Imagem de Fundo da Capa</p>
                      <p className="text-[10px] text-allvino-on-surface-variant">
                        Anexe uma imagem nova ou informe uma URL HTTPS. A imagem será usada como fundo da capa do PDF.
                      </p>
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

                    <div className="grid grid-cols-2 gap-2">
                      <VisibilityToggle label="Exibir rodapé da página de produto" checked={showProductFooter} onChange={setShowProductFooter} />
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
                            <option value="Playfair Display">Playfair Display</option>
                            <option value="Inter">Inter</option>
                            <option value="Cinzel">Cinzel</option>
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

                    {/* Background Texture */}
                    <div className="space-y-2 pb-3 border-b border-allvino-outline-variant/20">
                      <p className="text-[11px] font-bold text-allvino-primary">Imagem de Fundo da Página de Produto</p>
                      <p className="text-[10px] text-allvino-on-surface-variant">
                        Anexe uma imagem nova ou informe uma URL HTTPS para o fundo de cada página de produto.
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
                    <div className="flex gap-2">
                      <button
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
                        Capa (Preview)
                      </button>
                      <button
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
                        Página de Produto
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-allvino-on-surface-variant font-medium">
                        A4 (210 × 297 mm)
                      </span>
                      <a
                        href="/api/export-pdf?limit=1"
                        target="_blank"
                        rel="noreferrer"
                        className="rounded border border-allvino-outline-variant bg-white px-2.5 py-1.5 text-[9px] font-bold text-allvino-primary hover:bg-allvino-surface-container-high"
                      >
                        Testar PDF publicado
                      </a>
                    </div>
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

                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-allvino-outline-variant/30 bg-white/80 p-2">
                    <div>
                      <p className="text-[10px] font-bold text-allvino-primary">
                        {selectedPreviewElement
                          ? `Selecionado: ${previewElementLabels[selectedPreviewElement]}`
                          : "Clique em um elemento da prévia para selecioná-lo"}
                      </p>
                      <p className="text-[9px] text-allvino-on-surface-variant">
                        Arraste livremente ou use as setas. Segure Shift para mover 10 px.
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
                  {selectedPreviewElement ? (
                    <div className="pointer-events-none absolute inset-0 z-30">
                      <div className="absolute bottom-0 left-1/2 top-0 border-l border-dashed border-allvino-secondary/70" />
                      <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-allvino-secondary/70" />
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
                            onSelect={setSelectedPreviewElement}
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
                            onSelect={setSelectedPreviewElement}
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
                              {headerTitle || "CATÁLOGO DE VINHOS"}
                            </h2>
                          </DraggablePreviewElement>
                        )}
                        {showCoverSubtitle && (
                          <DraggablePreviewElement
                            className="relative mx-auto w-fit"
                            elementId="cover-subtitle"
                            label="Subtítulo da capa"
                            onPositionChange={(x, y) => {
                              setCoverSubtitleXOffset(x);
                              setCoverSubtitleYOffset(y);
                              setIsDirty(true);
                            }}
                            onSelect={setSelectedPreviewElement}
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
                              {coverSubtitle || "CATÁLOGO EXCLUSIVO B2B"}
                            </p>
                          </DraggablePreviewElement>
                        )}
                      </div>
                      {showCoverFooter && (
                        <DraggablePreviewElement
                          className="absolute bottom-6 left-0 right-0 z-10 text-center"
                          elementId="cover-footer"
                          label="Rodapé da capa"
                          onPositionChange={(x, y) => {
                            setCoverFooterXOffset(x);
                            setCoverFooterYOffset(y);
                            setIsDirty(true);
                          }}
                          onSelect={setSelectedPreviewElement}
                          scale={previewScale}
                          selected={selectedPreviewElement === "cover-footer"}
                          style={{
                            color: coverFooterColor || (hasCoverBg ? "rgba(255,255,255,0.55)" : "#999"),
                            fontSize: `${Math.max(1, Math.round(coverFooterFontSize * previewScale))}px`,
                          }}
                          x={coverFooterXOffset}
                          y={coverFooterYOffset}
                        >
                          {footerText || "Allvino Importadora de Vinhos B2B"}
                        </DraggablePreviewElement>
                      )}
                    </div>
                  )}

                  {/* ── PRODUCT PREVIEW ACCORDING TO PRESET ── */}
                  {previewTab === "product" && (
                    <div
                      className="h-full flex flex-col items-center justify-between px-8 relative overflow-hidden"
                      style={{ paddingTop: `${productPagePadding * previewScale}px`, paddingBottom: `${productPagePadding * previewScale}px` }}
                    >
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
                        onSelect={setSelectedPreviewElement}
                        scale={previewScale}
                        selected={selectedPreviewElement === "product-header"}
                        x={productNameXOffset}
                        y={productNameYOffset}
                      >
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
                            onSelect={setSelectedPreviewElement}
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
                              onSelect={setSelectedPreviewElement}
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
                                onSelect={setSelectedPreviewElement}
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
                                  maxWidth: `${Math.round(productImgHeight * 0.23 * previewScale)}px`,
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
                            onSelect={setSelectedPreviewElement}
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
                          onSelect={setSelectedPreviewElement}
                          rotation={productPriceAngle}
                          scale={previewScale}
                          selected={selectedPreviewElement === "product-price"}
                          style={{
                            textAlign: productPriceSide === "left" ? "right" : productPriceSide === "center" ? "center" : "left",
                          }}
                          x={productPriceXOffset}
                          y={productPriceYOffset}
                        >
                          <p
                            className="uppercase tracking-[1.5px] font-bold mb-0.5"
                            style={{ color: resolvedProductPriceLabelColor, fontSize: `${Math.max(1, Math.round(productPriceLabelFontSize * previewScale))}px` }}
                          >
                            Preço Unitário B2B
                          </p>
                          <p
                            className="font-semibold mb-1"
                            style={{ color: resolvedProductPriceInfoColor, fontSize: `${Math.max(1, Math.round(productPriceInfoFontSize * previewScale))}px` }}
                          >
                            Caixa c/ 6 garrafas
                          </p>
                          <div className={`flex items-baseline gap-1.5 ${productPriceSide === "center" ? "justify-center" : productPriceSide === "left" ? "justify-end" : "justify-start"}`}>
                            <span
                              className="font-extrabold"
                              style={{ color: resolvedProductPriceColor, fontSize: `${Math.max(1, Math.round(productPriceValueFontSize * previewScale))}px` }}
                            >
                              R$ {(previewWine.precoPromocional ?? previewWine.precoOriginal).toFixed(2)}
                            </span>
                            {previewWine.precoPromocional !== null && previewWine.precoPromocional !== undefined && (
                              <span className="text-gray-400 line-through text-[9px]">
                                R$ {previewWine.precoOriginal.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </DraggablePreviewElement>
                      </div>)}

                      {/* Footer */}
                      {showProductFooter && (<div
                        className="w-full border-t pt-2 pb-1 flex justify-between text-[6.5px] text-gray-300 flex-shrink-0"
                        style={{ borderColor: "#eee" }}
                      >
                        <span>
                          {footerText ||
                            "Allvino Importadora de Vinhos B2B"}
                        </span>
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
