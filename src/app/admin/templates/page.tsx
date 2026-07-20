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
  coverLogoYOffset?: number;
  coverTitleColor?: string;
  coverTitleAngle?: number;
  coverTitleYOffset?: number;
  coverSubtitleColor?: string;
  coverSubtitleAngle?: number;
  coverSubtitleYOffset?: number;
  coverVerticalOffset?: number;
}

interface Template {
  id: string;
  nome: string;
  htmlContent: string;
  cssStyles: string;
  isActive: boolean;
}

const PREVIEW_WINE = {
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
  desc: "Notas complexas de frutas negras, fumo de corda, cacau e couro. Corpo encorpado, taninos aveludados e final persistente.",
};

export default function TemplatesPage() {
  const { data: session } = useSession();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // General Style state
  const [nome, setNome] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [primaryColor, setPrimaryColor] = useState("#80282d");
  const [secondaryColor, setSecondaryColor] = useState("#c5a880");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [textColor, setTextColor] = useState("#1f2937");
  const [fontFamily, setFontFamily] = useState("Playfair Display");
  const [headerTitle, setHeaderTitle] = useState("");
  const [footerText, setFooterText] = useState("");
  const [backgroundImageUrl, setBackgroundImageUrl] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");

  // Cover Fine-Tuning State
  const [coverSubtitle, setCoverSubtitle] = useState("CATÁLOGO EXCLUSIVO B2B");
  const [coverLogoHeight, setCoverLogoHeight] = useState(110);
  const [coverLogoAngle, setCoverLogoAngle] = useState(0);
  const [coverLogoYOffset, setCoverLogoYOffset] = useState(0);

  const [coverTitleColor, setCoverTitleColor] = useState("");
  const [coverTitleAngle, setCoverTitleAngle] = useState(0);
  const [coverTitleYOffset, setCoverTitleYOffset] = useState(0);

  const [coverSubtitleColor, setCoverSubtitleColor] = useState("");
  const [coverSubtitleAngle, setCoverSubtitleAngle] = useState(0);
  const [coverSubtitleYOffset, setCoverSubtitleYOffset] = useState(0);

  const [coverVerticalOffset, setCoverVerticalOffset] = useState(0);

  // Preview tab
  const [previewTab, setPreviewTab] = useState<"cover" | "product">("cover");

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  useEffect(() => {
    fetchTemplates();
  }, []);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 4000);
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

      setCoverSubtitle(s.coverSubtitle || "CATÁLOGO EXCLUSIVO B2B");
      setCoverLogoHeight(typeof s.coverLogoHeight === "number" ? s.coverLogoHeight : 110);
      setCoverLogoAngle(typeof s.coverLogoAngle === "number" ? s.coverLogoAngle : 0);
      setCoverLogoYOffset(typeof s.coverLogoYOffset === "number" ? s.coverLogoYOffset : 0);

      setCoverTitleColor(s.coverTitleColor || "");
      setCoverTitleAngle(typeof s.coverTitleAngle === "number" ? s.coverTitleAngle : 0);
      setCoverTitleYOffset(typeof s.coverTitleYOffset === "number" ? s.coverTitleYOffset : 0);

      setCoverSubtitleColor(s.coverSubtitleColor || "");
      setCoverSubtitleAngle(typeof s.coverSubtitleAngle === "number" ? s.coverSubtitleAngle : 0);
      setCoverSubtitleYOffset(typeof s.coverSubtitleYOffset === "number" ? s.coverSubtitleYOffset : 0);

      setCoverVerticalOffset(typeof s.coverVerticalOffset === "number" ? s.coverVerticalOffset : 0);
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
        coverSubtitle,
        coverLogoHeight,
        coverLogoAngle,
        coverLogoYOffset,
        coverTitleColor,
        coverTitleAngle,
        coverTitleYOffset,
        coverSubtitleColor,
        coverSubtitleAngle,
        coverSubtitleYOffset,
        coverVerticalOffset,
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
    } catch {
      showToast("Erro ao processar requisição.", "error");
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

  // Resolved colors for cover preview
  const resolvedCoverTitleColor = coverTitleColor || (hasCoverBg ? "#ffffff" : primaryColor);
  const resolvedCoverSubColor = coverSubtitleColor || (hasCoverBg ? "rgba(255,255,255,0.78)" : secondaryColor);

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

        <div className="mb-8">
          <h1 className="text-3xl font-bold font-serif text-allvino-primary">
            Editor de Templates PDF
          </h1>
          <p className="text-allvino-on-surface-variant text-sm mt-1">
            Personalize o layout da capa (logo, títulos, rotações, alturas e cores) e das páginas internas do catálogo.
          </p>
        </div>

        {loading ? (
          <div className="py-20 text-center text-allvino-on-surface-variant space-y-3">
            <div className="w-10 h-10 border-4 border-allvino-primary border-t-allvino-secondary rounded-full animate-spin mx-auto"></div>
            <p className="text-xs tracking-wider">
              Carregando painel de design...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* ─── DESIGN CONTROLS ─── */}
            <div className="lg:col-span-5 space-y-6">
              {/* Template selection */}
              <div className="glass-panel p-6 rounded-xl border border-allvino-outline-variant/30">
                <label className="block text-xs font-semibold uppercase tracking-wider text-allvino-primary mb-3">
                  Selecione um Estilo Base
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleSelectTemplate(t)}
                      className={`py-3 px-2 rounded-lg text-xs font-bold transition flex flex-col items-center justify-center gap-1.5 border ${
                        selectedTemplate?.id === t.id
                          ? "bg-allvino-primary border-allvino-primary text-white"
                          : "bg-allvino-surface-container-high border border-allvino-outline-variant text-allvino-text hover:bg-allvino-surface-container-highest"
                      }`}
                    >
                      <span>{t.nome}</span>
                      {t.isActive && (
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-allvino-secondary text-white font-extrabold tracking-wide">
                          ATIVO
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Styles form */}
              <form
                onSubmit={handleSave}
                className="glass-panel p-6 rounded-xl border border-allvino-outline-variant/30 space-y-6"
              >
                {/* Active toggle */}
                <div className="flex items-center justify-between pb-3 border-b border-allvino-outline-variant/20">
                  <h3 className="font-serif font-bold text-allvino-primary">
                    Configurações de Estilo
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

                {/* ── COVER IMAGE & TEXT ADJUSTMENTS ── */}
                <div className="space-y-4 pt-2 border-t border-allvino-outline-variant/10">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-allvino-primary">
                    Imagem de Capa do Catálogo
                  </h4>
                  <p className="text-[10px] text-allvino-on-surface-variant/70 leading-relaxed">
                    <strong>Dimensões recomendadas:</strong> 2480 × 3508 px (A4 a 300 dpi).
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-allvino-on-surface-variant mb-1">
                        Enviar Arquivo
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleFileUpload(e.target.files?.[0], setCoverImageUrl)
                        }
                        className="w-full px-2 py-1.5 rounded bg-allvino-surface-container-low border border-allvino-outline-variant text-allvino-text text-[10px]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-allvino-on-surface-variant mb-1">
                        Ou URL da Capa
                      </label>
                      <input
                        type="text"
                        value={coverImageUrl}
                        onChange={(e) => setCoverImageUrl(e.target.value)}
                        className="w-full px-3 py-2 rounded bg-allvino-surface-container-low border border-allvino-outline-variant text-allvino-text text-[10px] placeholder-allvino-on-surface-variant/50 focus:outline-none focus:border-allvino-primary"
                        placeholder="https://exemplo.com/capa.jpg"
                      />
                    </div>
                  </div>
                  {coverImageUrl && (
                    <div className="flex items-center space-x-3 bg-allvino-surface-container-low/40 p-2 rounded-lg border border-allvino-outline-variant/30">
                      <div className="w-14 h-20 bg-white border border-allvino-outline-variant/40 rounded overflow-hidden flex-shrink-0">
                        <img
                          src={coverImageUrl}
                          alt="Preview capa"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-[10px] text-allvino-on-surface-variant flex-1 min-w-0">
                        <p className="font-semibold text-allvino-primary">
                          Imagem de Capa Carregada
                        </p>
                        <p className="font-light truncate">
                          {coverImageUrl.startsWith("data:")
                            ? "Arquivo local (Base64)"
                            : coverImageUrl}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCoverImageUrl("")}
                        className="text-[10px] text-red-500 hover:text-red-700 font-bold flex-shrink-0"
                      >
                        ✕ Removar
                      </button>
                    </div>
                  )}
                </div>

                {/* ── COVER FINE-TUNING PANEL ── */}
                <div className="space-y-4 pt-4 border-t border-allvino-outline-variant/20 bg-allvino-surface-container-low/30 p-4 rounded-xl border">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-allvino-primary flex items-center justify-between">
                    <span>Ajustes da Capa (Logo, Títulos e Cores)</span>
                    <span className="text-[9px] text-allvino-secondary bg-allvino-secondary/10 px-2 py-0.5 rounded font-bold">
                      Harmonia Visual
                    </span>
                  </h4>

                  {/* LOGO FINE-TUNING */}
                  <div className="space-y-3 pt-2 border-t border-allvino-outline-variant/20">
                    <p className="text-[11px] font-bold text-allvino-primary">
                      1. Logotipo Allvino
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] text-allvino-on-surface-variant mb-1">
                          Altura da Logo ({coverLogoHeight}px)
                        </label>
                        <input
                          type="range"
                          min="40"
                          max="250"
                          value={coverLogoHeight}
                          onChange={(e) => setCoverLogoHeight(Number(e.target.value))}
                          className="w-full accent-allvino-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-allvino-on-surface-variant mb-1">
                          Ângulo ({coverLogoAngle}°)
                        </label>
                        <input
                          type="range"
                          min="-180"
                          max="180"
                          value={coverLogoAngle}
                          onChange={(e) => setCoverLogoAngle(Number(e.target.value))}
                          className="w-full accent-allvino-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-allvino-on-surface-variant mb-1">
                          Posição Y ({coverLogoYOffset}px)
                        </label>
                        <input
                          type="range"
                          min="-150"
                          max="150"
                          value={coverLogoYOffset}
                          onChange={(e) => setCoverLogoYOffset(Number(e.target.value))}
                          className="w-full accent-allvino-primary"
                        />
                      </div>
                    </div>
                  </div>

                  {/* TITLE FINE-TUNING */}
                  <div className="space-y-3 pt-3 border-t border-allvino-outline-variant/20">
                    <p className="text-[11px] font-bold text-allvino-primary">
                      2. Título da Capa ("{headerTitle || "CATÁLOGO DE VINHOS"}")
                    </p>
                    <div>
                      <label className="block text-[10px] text-allvino-on-surface-variant mb-1">
                        Cor do Título na Capa
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={resolvedCoverTitleColor}
                          onChange={(e) => setCoverTitleColor(e.target.value)}
                          className="w-8 h-8 border border-allvino-outline-variant rounded cursor-pointer bg-transparent"
                        />
                        <input
                          type="text"
                          value={coverTitleColor}
                          onChange={(e) => setCoverTitleColor(e.target.value)}
                          placeholder="Ex: #ffffff (Padrão Auto)"
                          className="w-full text-[10px] p-2 rounded bg-allvino-surface-container-low border border-allvino-outline-variant"
                        />
                        {coverTitleColor && (
                          <button
                            type="button"
                            onClick={() => setCoverTitleColor("")}
                            className="text-[9px] text-allvino-secondary underline"
                          >
                            Resetar
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-allvino-on-surface-variant mb-1">
                          Ângulo do Título ({coverTitleAngle}°)
                        </label>
                        <input
                          type="range"
                          min="-45"
                          max="45"
                          value={coverTitleAngle}
                          onChange={(e) => setCoverTitleAngle(Number(e.target.value))}
                          className="w-full accent-allvino-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-allvino-on-surface-variant mb-1">
                          Posição Y ({coverTitleYOffset}px)
                        </label>
                        <input
                          type="range"
                          min="-100"
                          max="100"
                          value={coverTitleYOffset}
                          onChange={(e) => setCoverTitleYOffset(Number(e.target.value))}
                          className="w-full accent-allvino-primary"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SUBTITLE FINE-TUNING */}
                  <div className="space-y-3 pt-3 border-t border-allvino-outline-variant/20">
                    <p className="text-[11px] font-bold text-allvino-primary">
                      3. Subtítulo da Capa
                    </p>
                    <div>
                      <label className="block text-[10px] text-allvino-on-surface-variant mb-1">
                        Texto do Subtítulo
                      </label>
                      <input
                        type="text"
                        value={coverSubtitle}
                        onChange={(e) => setCoverSubtitle(e.target.value)}
                        placeholder="Catálogo Exclusivo B2B"
                        className="w-full text-xs p-2 rounded bg-allvino-surface-container-low border border-allvino-outline-variant"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-allvino-on-surface-variant mb-1">
                        Cor do Subtítulo na Capa
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={resolvedCoverSubColor.startsWith("rgba") ? "#c5a880" : resolvedCoverSubColor}
                          onChange={(e) => setCoverSubtitleColor(e.target.value)}
                          className="w-8 h-8 border border-allvino-outline-variant rounded cursor-pointer bg-transparent"
                        />
                        <input
                          type="text"
                          value={coverSubtitleColor}
                          onChange={(e) => setCoverSubtitleColor(e.target.value)}
                          placeholder="Ex: #c5a880 (Padrão Auto)"
                          className="w-full text-[10px] p-2 rounded bg-allvino-surface-container-low border border-allvino-outline-variant"
                        />
                        {coverSubtitleColor && (
                          <button
                            type="button"
                            onClick={() => setCoverSubtitleColor("")}
                            className="text-[9px] text-allvino-secondary underline"
                          >
                            Resetar
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-allvino-on-surface-variant mb-1">
                          Ângulo do Subtítulo ({coverSubtitleAngle}°)
                        </label>
                        <input
                          type="range"
                          min="-45"
                          max="45"
                          value={coverSubtitleAngle}
                          onChange={(e) => setCoverSubtitleAngle(Number(e.target.value))}
                          className="w-full accent-allvino-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-allvino-on-surface-variant mb-1">
                          Posição Y ({coverSubtitleYOffset}px)
                        </label>
                        <input
                          type="range"
                          min="-100"
                          max="100"
                          value={coverSubtitleYOffset}
                          onChange={(e) => setCoverSubtitleYOffset(Number(e.target.value))}
                          className="w-full accent-allvino-primary"
                        />
                      </div>
                    </div>
                  </div>

                  {/* OVERALL VERTICAL OFFSET */}
                  <div className="pt-3 border-t border-allvino-outline-variant/20">
                    <label className="block text-[10px] text-allvino-on-surface-variant mb-1">
                      Posição Vertical Geral do Bloco de Capa ({coverVerticalOffset}px)
                    </label>
                    <input
                      type="range"
                      min="-150"
                      max="150"
                      value={coverVerticalOffset}
                      onChange={(e) => setCoverVerticalOffset(Number(e.target.value))}
                      className="w-full accent-allvino-primary"
                    />
                  </div>
                </div>

                {/* ── COLOR PICKERS ── */}
                <div className="space-y-4 pt-4 border-t border-allvino-outline-variant/10">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-allvino-primary">
                    Paleta Geral do PDF (Páginas de Produto)
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      {
                        label: "Cor Primária",
                        val: primaryColor,
                        set: setPrimaryColor,
                      },
                      {
                        label: "Cor Secundária",
                        val: secondaryColor,
                        set: setSecondaryColor,
                      },
                      {
                        label: "Cor do Fundo",
                        val: backgroundColor,
                        set: setBackgroundColor,
                      },
                      {
                        label: "Cor do Texto",
                        val: textColor,
                        set: setTextColor,
                      },
                    ].map((c) => (
                      <div key={c.label}>
                        <label className="block text-xs text-allvino-on-surface-variant mb-1.5">
                          {c.label}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={c.val}
                            onChange={(e) => c.set(e.target.value)}
                            className="w-10 h-10 border border-allvino-outline-variant rounded-md cursor-pointer bg-transparent"
                          />
                          <input
                            type="text"
                            value={c.val}
                            onChange={(e) => c.set(e.target.value)}
                            className="w-full text-xs p-2.5 rounded bg-allvino-surface-container-low border border-allvino-outline-variant text-center"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── BACKGROUND TEXTURE ── */}
                <div className="space-y-3 pt-4 border-t border-allvino-outline-variant/10">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-allvino-primary">
                    Textura de Fundo (Páginas de Produto)
                  </h4>
                  <p className="text-[10px] text-allvino-on-surface-variant/70 leading-relaxed">
                    <strong>Dimensões recomendadas:</strong> 2480 × 3508 px (A4 a 300 dpi).
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-allvino-on-surface-variant mb-1">
                        Enviar Arquivo
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleFileUpload(
                            e.target.files?.[0],
                            setBackgroundImageUrl
                          )
                        }
                        className="w-full px-2 py-1.5 rounded bg-allvino-surface-container-low border border-allvino-outline-variant text-allvino-text text-[10px]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-allvino-on-surface-variant mb-1">
                        Ou URL da Textura
                      </label>
                      <input
                        type="text"
                        value={backgroundImageUrl}
                        onChange={(e) => setBackgroundImageUrl(e.target.value)}
                        className="w-full px-3 py-2 rounded bg-allvino-surface-container-low border border-allvino-outline-variant text-allvino-text text-[10px] placeholder-allvino-on-surface-variant/50 focus:outline-none focus:border-allvino-primary"
                        placeholder="https://exemplo.com/textura.jpg"
                      />
                    </div>
                  </div>
                  {backgroundImageUrl && (
                    <div className="flex items-center space-x-3 bg-allvino-surface-container-low/40 p-2 rounded-lg border border-allvino-outline-variant/30">
                      <div className="w-14 h-20 bg-white border border-allvino-outline-variant/40 rounded overflow-hidden flex-shrink-0">
                        <img
                          src={backgroundImageUrl}
                          alt="Preview fundo"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-[10px] text-allvino-on-surface-variant flex-1 min-w-0">
                        <p className="font-semibold text-allvino-primary">
                          Textura de Fundo
                        </p>
                        <p className="font-light truncate">
                          {backgroundImageUrl.startsWith("data:")
                            ? "Arquivo local (Base64)"
                            : backgroundImageUrl}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBackgroundImageUrl("")}
                        className="text-[10px] text-red-500 hover:text-red-700 font-bold flex-shrink-0"
                      >
                        ✕ Remover
                      </button>
                    </div>
                  )}
                </div>

                {/* ── TYPOGRAPHY ── */}
                <div className="space-y-4 pt-4 border-t border-allvino-outline-variant/10">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-allvino-primary">
                    Tipografia
                  </h4>
                  <div>
                    <label className="block text-xs text-allvino-on-surface-variant mb-1.5">
                      Fonte dos Títulos
                    </label>
                    <select
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                      className="w-full text-xs p-2.5 bg-allvino-surface-container-low border border-allvino-outline-variant rounded-md focus:outline-none focus:border-allvino-primary"
                    >
                      <option value="Playfair Display">
                        Playfair Display (Serif)
                      </option>
                      <option value="Inter">Inter (Sans)</option>
                      <option value="Cinzel">Cinzel (Vintage)</option>
                    </select>
                  </div>
                </div>

                {/* ── EDITORIAL TEXTS ── */}
                <div className="space-y-4 pt-4 border-t border-allvino-outline-variant/10">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-allvino-primary">
                    Textos Editoriais
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-allvino-on-surface-variant mb-1">
                        Título Principal (Capa)
                      </label>
                      <input
                        type="text"
                        value={headerTitle}
                        onChange={(e) => setHeaderTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-allvino-surface-container-low border border-allvino-outline-variant text-allvino-text placeholder-allvino-on-surface-variant/50 focus:outline-none focus:border-allvino-primary text-xs"
                        placeholder="CATÁLOGO DE VINHOS"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-allvino-on-surface-variant mb-1">
                        Texto do Rodapé
                      </label>
                      <input
                        type="text"
                        value={footerText}
                        onChange={(e) => setFooterText(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-allvino-surface-container-low border border-allvino-outline-variant text-allvino-text placeholder-allvino-on-surface-variant/50 focus:outline-none focus:border-allvino-primary text-xs"
                        placeholder="Allvino Importadora B2B - contato@allvino.com.br"
                      />
                    </div>
                  </div>
                </div>

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

            {/* ─── LIVE PREVIEW ─── */}
            <div className="lg:col-span-7">
              <div className="sticky top-24">
                {/* Tab selector */}
                <div className="mb-3 flex justify-between items-center px-1">
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
                  <span className="text-[10px] text-allvino-on-surface-variant">
                    Proporção A4 Padrão
                  </span>
                </div>

                {/* A4 Preview */}
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
                      {/* Overlay for cover with image */}
                      {hasCoverBg && (
                        <div
                          className="absolute inset-0 z-0"
                          style={{
                            background:
                              "linear-gradient(180deg, rgba(0,0,0,.32) 0%, rgba(0,0,0,.08) 38%, rgba(0,0,0,.42) 100%)",
                          }}
                        />
                      )}
                      {/* Decorative borders for plain cover */}
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
                          transform: `translateY(${coverVerticalOffset * 0.5}px)`,
                        }}
                      >
                        <img
                          src="/logo.png"
                          alt="Logo"
                          className="mx-auto mb-6 object-contain transition-all duration-150"
                          style={{
                            height: `${coverLogoHeight * 0.6}px`,
                            transform: `translateY(${coverLogoYOffset * 0.5}px) rotate(${coverLogoAngle}deg)`,
                            filter: hasCoverBg
                              ? "brightness(0) invert(1)"
                              : "none",
                            opacity: hasCoverBg ? 0.92 : 1,
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
                          className="text-xl tracking-widest uppercase mb-3 transition-all duration-150"
                          style={{
                            color: resolvedCoverTitleColor,
                            fontFamily: previewFont,
                            fontWeight: 700,
                            transform: `translateY(${coverTitleYOffset * 0.5}px) rotate(${coverTitleAngle}deg)`,
                            textShadow: hasCoverBg
                              ? "0 2px 10px rgba(0,0,0,.25)"
                              : "none",
                          }}
                        >
                          {headerTitle || "CATÁLOGO DE VINHOS"}
                        </h2>
                        <p
                          className="text-[9px] tracking-[5px] uppercase transition-all duration-150"
                          style={{
                            color: resolvedCoverSubColor,
                            transform: `translateY(${coverSubtitleYOffset * 0.5}px) rotate(${coverSubtitleAngle}deg)`,
                          }}
                        >
                          {coverSubtitle || "CATÁLOGO EXCLUSIVO B2B"}
                        </p>
                      </div>
                      <div
                        className="absolute bottom-6 left-0 right-0 text-center text-[8px]"
                        style={{
                          color: hasCoverBg
                            ? "rgba(255,255,255,0.55)"
                            : "#999",
                        }}
                      >
                        {footerText || "Allvino Importadora de Vinhos B2B"}
                      </div>
                    </div>
                  )}

                  {/* ── PRODUCT PREVIEW ── */}
                  {previewTab === "product" && (
                    <div className="h-full flex flex-col items-center px-10 py-8 relative">
                      {/* Product header */}
                      <div className="text-center w-full pt-2">
                        <h2
                          className="text-lg font-bold mb-1.5"
                          style={{
                            color: primaryColor,
                            fontFamily: previewFont,
                          }}
                        >
                          {PREVIEW_WINE.name}
                        </h2>
                        <p
                          className="text-[8px] uppercase tracking-[3px] font-semibold"
                          style={{ color: secondaryColor }}
                        >
                          {PREVIEW_WINE.paisOrigem} ·{" "}
                          {PREVIEW_WINE.regiao}
                        </p>
                        <div
                          className="w-10 h-px mx-auto my-4"
                          style={{ background: secondaryColor }}
                        />
                      </div>

                      {/* Bottle image */}
                      <div className="flex-1 flex items-center justify-center py-2">
                        <img
                          src={PREVIEW_WINE.imagemUrl}
                          alt={PREVIEW_WINE.name}
                          className="object-contain"
                          style={{
                            maxHeight: "200px",
                            maxWidth: "100px",
                            filter:
                              "drop-shadow(0 6px 16px rgba(0,0,0,.10))",
                          }}
                        />
                      </div>

                      {/* Details */}
                      <div className="text-center w-full max-w-sm">
                        <p className="text-[7px] text-gray-400 uppercase tracking-wider mb-2">
                          {PREVIEW_WINE.vinicola} · {PREVIEW_WINE.uva} ·
                          Safra {PREVIEW_WINE.safra} ·{" "}
                          {PREVIEW_WINE.teorAlcoolico}% vol
                        </p>
                        <p
                          className="text-[8px] leading-relaxed mb-4"
                          style={{
                            color: textColor,
                            fontWeight: 300,
                          }}
                        >
                          {PREVIEW_WINE.desc}
                        </p>
                        <div
                          className="border-t pt-3"
                          style={{ borderColor: "#e4e4e4" }}
                        >
                          <p className="text-[6px] uppercase tracking-[3px] text-gray-400 mb-0.5">
                            Preço Unitário B2B
                          </p>
                          <p
                            className="text-[7px] font-semibold mb-1.5"
                            style={{ color: secondaryColor }}
                          >
                            Caixa c/ 6 garrafas
                          </p>
                          <div className="flex items-baseline justify-center gap-2">
                            <span
                              className="text-base font-bold"
                              style={{ color: primaryColor }}
                            >
                              R${" "}
                              {PREVIEW_WINE.precoPromocional?.toFixed(2)}
                            </span>
                            <span className="text-[9px] text-gray-400 line-through">
                              R$ {PREVIEW_WINE.precoOriginal.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div
                        className="absolute bottom-4 left-10 right-10 border-t pt-2 flex justify-between text-[6px] text-gray-300"
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
