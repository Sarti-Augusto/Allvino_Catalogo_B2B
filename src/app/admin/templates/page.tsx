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
  gridColumns: string;
  headerTitle: string;
  footerText: string;
}

interface Template {
  id: string;
  nome: string;
  htmlContent: string;
  cssStyles: string; // JSON string
  isActive: boolean;
}

// Sample wines for PDF Live Preview
const PREVIEW_WINES = [
  {
    name: "Château Margaux 2018",
    vinicola: "Maison Margaux",
    uva: "Cabernet Sauvignon, Merlot",
    safra: "2018",
    paisOrigem: "França",
    teorAlcoolico: 14,
    precoOriginal: 5200.0,
    precoPromocional: 4800.0,
    imagemUrl: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=300&auto=format&fit=crop",
    desc: "Um clássico de Bordeaux de altíssima elegância com taninos aveludados e final de boca extremamente persistente."
  },
  {
    name: "Alma Única Cabernet Franc",
    vinicola: "Alma Única",
    uva: "Cabernet Franc",
    safra: "2020",
    paisOrigem: "Brasil",
    teorAlcoolico: 13.8,
    precoOriginal: 195.0,
    precoPromocional: null,
    imagemUrl: "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=300&auto=format&fit=crop",
    desc: "Frutas vermelhas frescas combinadas a nuances de pimenta verde e especiarias doces originadas pelo carvalho francês."
  }
];

export default function TemplatesPage() {
  const { data: session } = useSession();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [nome, setNome] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [primaryColor, setPrimaryColor] = useState("#80282d");
  const [secondaryColor, setSecondaryColor] = useState("#c5a880");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [textColor, setTextColor] = useState("#1f2937");
  const [fontFamily, setFontFamily] = useState("Playfair Display");
  const [gridColumns, setGridColumns] = useState("2");
  const [headerTitle, setHeaderTitle] = useState("");
  const [footerText, setFooterText] = useState("");

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  useEffect(() => {
    fetchTemplates();
  }, []);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
        // Set the active template or the first one as selected
        const active = data.find((t: Template) => t.isActive) || data[0];
        if (active) {
          handleSelectTemplate(active);
        }
      } else {
        showToast("Erro ao buscar templates no banco.", "error");
      }
    } catch (err) {
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
      const styles: TemplateStyles = JSON.parse(template.cssStyles);
      setPrimaryColor(styles.primaryColor || "#80282d");
      setSecondaryColor(styles.secondaryColor || "#c5a880");
      setBackgroundColor(styles.backgroundColor || "#ffffff");
      setTextColor(styles.textColor || "#1f2937");
      setFontFamily(styles.fontFamily || "Playfair Display");
      setGridColumns(styles.gridColumns || "2");
      setHeaderTitle(styles.headerTitle || "ALLVINO - CATÁLOGO");
      setFooterText(styles.footerText || "");
    } catch (err) {
      console.error("Erro ao fazer parse das propriedades de estilo:", err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    setSaving(true);
    const stylesPayload: TemplateStyles = {
      primaryColor,
      secondaryColor,
      backgroundColor,
      textColor,
      fontFamily,
      gridColumns,
      headerTitle,
      footerText,
    };

    const payload = {
      nome,
      isActive,
      cssStyles: JSON.stringify(stylesPayload),
    };

    try {
      const res = await fetch(`/api/templates/${selectedTemplate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast("Configurações do template salvas com sucesso!");
        // Refresh templates data
        fetchTemplates();
      } else {
        showToast("Falha ao salvar modificações.", "error");
      }
    } catch (err) {
      showToast("Erro ao processar requisição.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-allvino-background text-allvino-text font-sans pb-12">
      {/* Navigation Header */}
      <nav className="border-b border-allvino-outline-variant/30 bg-allvino-surface-container-low/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <span className="text-xl font-bold font-serif text-allvino-primary tracking-wider">
                ALLVINO ADMIN
              </span>
              <div className="hidden md:flex space-x-4">
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

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Toast Notification */}
        {toastMessage && (
          <div className={`fixed bottom-5 right-5 z-50 px-6 py-3.5 rounded-lg shadow-2xl border flex items-center space-x-2 text-sm font-medium transition-all ${
            toastType === "success" 
              ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
              : "bg-red-50 border-red-200 text-red-800"
          }`}>
            <span>{toastMessage}</span>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold font-serif text-allvino-primary">
            Editor de Templates PDF
          </h1>
          <p className="text-allvino-on-surface-variant text-sm mt-1">
            Personalize a identidade visual, cores, cabeçalhos e rodapés do catálogo impresso.
          </p>
        </div>

        {loading ? (
          <div className="py-20 text-center text-allvino-on-surface-variant space-y-3">
            <div className="w-10 h-10 border-4 border-allvino-primary border-t-allvino-secondary rounded-full animate-spin mx-auto"></div>
            <p className="text-xs tracking-wider">Carregando painel de design...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Design Controls Column */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Template Selection Widget */}
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

              {/* Styles Form */}
              <form onSubmit={handleSave} className="glass-panel p-6 rounded-xl border border-allvino-outline-variant/30 space-y-6">
                
                {/* Header Configuration */}
                <div className="flex items-center justify-between pb-3 border-b border-allvino-outline-variant/20">
                  <h3 className="font-serif font-bold text-allvino-primary">Configurações de Estilo</h3>
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

                {/* Color Pickers Grid */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-allvino-primary">
                    Paleta de Cores do PDF
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-allvino-on-surface-variant mb-1.5">Cor Primária</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="w-10 h-10 border border-allvino-outline-variant rounded-md cursor-pointer bg-transparent"
                        />
                        <input
                          type="text"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="w-full text-xs p-2.5 rounded bg-allvino-surface-container-low border border-allvino-outline-variant text-center"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-allvino-on-surface-variant mb-1.5">Cor Secundária</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={secondaryColor}
                          onChange={(e) => setSecondaryColor(e.target.value)}
                          className="w-10 h-10 border border-allvino-outline-variant rounded-md cursor-pointer bg-transparent"
                        />
                        <input
                          type="text"
                          value={secondaryColor}
                          onChange={(e) => setSecondaryColor(e.target.value)}
                          className="w-full text-xs p-2.5 rounded bg-allvino-surface-container-low border border-allvino-outline-variant text-center"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-allvino-on-surface-variant mb-1.5">Cor do Fundo</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          className="w-10 h-10 border border-allvino-outline-variant rounded-md cursor-pointer bg-transparent"
                        />
                        <input
                          type="text"
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          className="w-full text-xs p-2.5 rounded bg-allvino-surface-container-low border border-allvino-outline-variant text-center"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-allvino-on-surface-variant mb-1.5">Cor do Texto</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                          className="w-10 h-10 border border-allvino-outline-variant rounded-md cursor-pointer bg-transparent"
                        />
                        <input
                          type="text"
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                          className="w-full text-xs p-2.5 rounded bg-allvino-surface-container-low border border-allvino-outline-variant text-center"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Typography and Layout Scale */}
                <div className="space-y-4 pt-4 border-t border-allvino-outline-variant/10">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-allvino-primary">
                    Tipografia e Grade
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-allvino-on-surface-variant mb-1.5">Fonte dos Títulos</label>
                      <select
                        value={fontFamily}
                        onChange={(e) => setFontFamily(e.target.value)}
                        className="w-full text-xs p-2.5 bg-allvino-surface-container-low border border-allvino-outline-variant rounded-md focus:outline-none focus:border-allvino-primary"
                      >
                        <option value="Playfair Display">Playfair Display (Serif)</option>
                        <option value="Inter">Inter (Sans)</option>
                        <option value="Cinzel">Cinzel (Vintage)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-allvino-on-surface-variant mb-1.5">Grade (Colunas)</label>
                      <select
                        value={gridColumns}
                        onChange={(e) => setGridColumns(e.target.value)}
                        className="w-full text-xs p-2.5 bg-allvino-surface-container-low border border-allvino-outline-variant rounded-md focus:outline-none focus:border-allvino-primary"
                      >
                        <option value="1">1 Coluna (Foco nos Detalhes)</option>
                        <option value="2">2 Colunas (Compacto/Padrão)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Headers and Footers text values */}
                <div className="space-y-4 pt-4 border-t border-allvino-outline-variant/10">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-allvino-primary">
                    Textos Editoriais
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-allvino-on-surface-variant mb-1">Título do Cabeçalho</label>
                      <input
                        type="text"
                        value={headerTitle}
                        onChange={(e) => setHeaderTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-allvino-surface-container-low border border-allvino-outline-variant text-allvino-text placeholder-allvino-on-surface-variant/50 focus:outline-none focus:border-allvino-primary text-xs"
                        placeholder="ALLVINO - CATÁLOGO B2B"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-allvino-on-surface-variant mb-1">Texto do Rodapé</label>
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

                {/* Action buttons */}
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

            {/* Live Mockup Column */}
            <div className="lg:col-span-7">
              <div className="sticky top-24">
                <div className="mb-3 flex justify-between items-center px-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-allvino-primary">
                    Visualização Prévia (Página PDF)
                  </span>
                  <span className="text-[10px] text-allvino-on-surface-variant">
                    Proporção de página A4 padrão
                  </span>
                </div>

                {/* Simulated A4 Container */}
                <div 
                  className="w-full rounded-xl shadow-2xl border border-allvino-outline-variant/40 overflow-hidden transition-all duration-300 relative aspect-[1/1.414]"
                  style={{
                    backgroundColor: backgroundColor,
                    color: textColor,
                  }}
                >
                  <div className="p-10 h-full flex flex-col justify-between">
                    
                    {/* Catalog Header */}
                    <div>
                      <div className="pb-3 text-center" style={{ borderBottom: `2px solid ${secondaryColor}` }}>
                        <h2 
                          className="text-2xl tracking-wider uppercase m-0"
                          style={{ 
                            color: primaryColor,
                            fontFamily: fontFamily === "Playfair Display" || fontFamily === "Cinzel" ? "Georgia, serif" : "Inter, sans-serif",
                            fontWeight: 700 
                          }}
                        >
                          {headerTitle || "ALLVINO - CATÁLOGO"}
                        </h2>
                        <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">
                          Tabela de Preços Exclusiva B2B
                        </p>
                      </div>

                      {/* Dynamic Wine Grid */}
                      <div 
                        className={`grid gap-6 mt-8 ${
                          gridColumns === "1" ? "grid-cols-1" : "grid-cols-2"
                        }`}
                      >
                        {PREVIEW_WINES.map((wine, idx) => (
                          <div 
                            key={idx}
                            className="p-4 rounded border border-gray-200 bg-white shadow-sm flex gap-4 transition duration-300"
                          >
                            <div className="w-12 h-28 bg-gray-50 p-1 flex-shrink-0 flex items-center justify-center border border-gray-100 rounded">
                              <img 
                                src={wine.imagemUrl} 
                                alt={wine.name}
                                className="max-h-full object-contain"
                              />
                            </div>
                            <div className="flex flex-col justify-between flex-grow">
                              <div>
                                <h3 
                                  className="text-sm font-bold m-0"
                                  style={{ 
                                    color: primaryColor,
                                    fontFamily: fontFamily === "Playfair Display" || fontFamily === "Cinzel" ? "Georgia, serif" : "Inter, sans-serif"
                                  }}
                                >
                                  {wine.name}
                                </h3>
                                <p className="text-[9px] text-gray-400 mt-0.5">
                                  {wine.vinicola} • {wine.paisOrigem}
                                </p>
                                <p className="text-[9px] text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                                  {wine.desc}
                                </p>
                              </div>
                              <div className="mt-2 pt-2 border-t border-gray-100 flex items-baseline gap-2">
                                {wine.precoPromocional ? (
                                  <>
                                    <span className="text-xs font-black" style={{ color: primaryColor }}>
                                      R$ {wine.precoPromocional.toFixed(2)}
                                    </span>
                                    <span className="text-[9px] text-gray-400 line-through">
                                      R$ {wine.precoOriginal.toFixed(2)}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-xs font-bold text-gray-800">
                                    R$ {wine.precoOriginal.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Catalog Footer */}
                    <div className="pt-3 text-center text-[10px] text-gray-400" style={{ borderTop: `1px solid ${secondaryColor}33` }}>
                      {footerText || "Allvino Importadora de Vinhos B2B"}
                    </div>

                  </div>
                </div>

              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
