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

  // Style state
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
      setHeaderTitle(s.headerTitle || "ALLVINO - CATÁLOGO");
      setFooterText(s.footerText || "");
      setBackgroundImageUrl(s.backgroundImageUrl || "");
      setCoverImageUrl(s.coverImageUrl || "");
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

  // File upload helper — reads file and sets state to base64
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

  // Cover has background image?
  const hasCoverBg = !!coverImageUrl;

  // Resolved font for preview
  const previewFont =
    fontFamily === "Inter"
      ? "Inter, sans-serif"
      : fontFamily === "Cinzel"
      ? "Georgia, serif"
      : "Georgia, serif";

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
            Configure a capa, as cores, os fundos e a tipografia do catálogo
            impresso. O PDF será gerado com 1 produto por página.
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

                {/* ── COVER IMAGE ── */}
                <div className="space-y-3 pt-2 border-t border-allvino-outline-variant/10">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-allvino-primary">
                    Imagem de Capa do Catálogo
                  </h4>
                  <p className="text-[10px] text-allvino-on-surface-variant/70 leading-relaxed">
                    A imagem será usada como fundo fullscreen na primeira página
                    do PDF.
                    <br />
                    <strong>Dimensões recomendadas:</strong> 2480 × 3508 px (A4
                    a 300 dpi). Formatos: JPG ou PNG.
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
                        Ou Cole uma URL
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
                          Imagem de Capa
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
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {/* ── COLOR PICKERS ── */}
                <div className="space-y-4 pt-4 border-t border-allvino-outline-variant/10">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-allvino-primary">
                    Paleta de Cores do PDF
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
                    A textura será aplicada como fundo em cada página de produto
                    do catálogo.
                    <br />
                    <strong>Dimensões recomendadas:</strong> 2480 × 3508 px (A4
                    a 300 dpi). Formatos: JPG ou PNG.
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
                        Ou Cole uma URL
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
                        ✕
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
                        Título do Cabeçalho (Capa)
                      </label>
                      <input
                        type="text"
                        value={headerTitle}
                        onChange={(e) => setHeaderTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-allvino-surface-container-low border border-allvino-outline-variant text-allvino-text placeholder-allvino-on-surface-variant/50 focus:outline-none focus:border-allvino-primary text-xs"
                        placeholder="ALLVINO - CATÁLOGO B2B"
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
                      Capa
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
                    Proporção A4
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
                      <div className="relative z-10 text-center px-12">
                        <img
                          src="/logo.png"
                          alt="Logo"
                          className="mx-auto mb-8 object-contain"
                          style={{
                            height: "70px",
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
                            background: hasCoverBg
                              ? "rgba(255,255,255,0.35)"
                              : secondaryColor,
                          }}
                        />
                        <h2
                          className="text-xl tracking-widest uppercase mb-3"
                          style={{
                            color: hasCoverBg ? "#fff" : primaryColor,
                            fontFamily: previewFont,
                            fontWeight: 700,
                            textShadow: hasCoverBg
                              ? "0 2px 10px rgba(0,0,0,.25)"
                              : "none",
                          }}
                        >
                          {headerTitle || "ALLVINO - CATÁLOGO"}
                        </h2>
                        <p
                          className="text-[9px] tracking-[5px] uppercase"
                          style={{
                            color: hasCoverBg
                              ? "rgba(255,255,255,0.78)"
                              : secondaryColor,
                          }}
                        >
                          Catálogo Exclusivo B2B
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
