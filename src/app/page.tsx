"use client";

import { useEffect, useState } from "react";
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

export default function Home() {
  const [wines, setWines] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState("");
  const [selectedUva, setSelectedUva] = useState("");
  const [selectedPais, setSelectedPais] = useState("");
  const [selectedVinicola, setSelectedVinicola] = useState("");
  const [selectedCategoria, setSelectedCategoria] = useState("");
  const [sortBy, setSortBy] = useState("name-asc");

  // Dynamic filter options
  const [uvaOptions, setUvaOptions] = useState<string[]>([]);
  const [paisOptions, setPaisOptions] = useState<string[]>([]);
  const [vinicolaOptions, setVinicolaOptions] = useState<string[]>([]);
  const [categoriaOptions, setCategoriaOptions] = useState<string[]>([]);

  useEffect(() => {
    fetchWines();
  }, []);

  const fetchWines = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/wines");
      if (res.ok) {
        const data: Product[] = await res.json();
        const activeWines = data.filter((w) => w.status);
        setWines(activeWines);

        // Extract unique options
        const grapes = Array.from(new Set(activeWines.map((w) => w.uva.split(",")[0].trim()))).sort();
        const countries = Array.from(new Set(activeWines.map((w) => w.paisOrigem))).sort();
        const wineries = Array.from(new Set(activeWines.map((w) => w.vinicola))).sort();
        const categories = Array.from(new Set(activeWines.map((w) => w.categoria || "Tinto"))).sort();

        setUvaOptions(grapes);
        setPaisOptions(countries);
        setVinicolaOptions(wineries);
        setCategoriaOptions(categories);
      }
    } catch (error) {
      console.error("Erro ao carregar vitrine de vinhos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter & Sort
  const filteredWines = wines
    .filter((wine) => {
      const matchesSearch =
        wine.name.toLowerCase().includes(search.toLowerCase()) ||
        wine.vinicola.toLowerCase().includes(search.toLowerCase()) ||
        wine.regiao.toLowerCase().includes(search.toLowerCase());

      const matchesUva = selectedUva ? wine.uva.toLowerCase().includes(selectedUva.toLowerCase()) : true;
      const matchesPais = selectedPais ? wine.paisOrigem === selectedPais : true;
      const matchesVinicola = selectedVinicola ? wine.vinicola === selectedVinicola : true;
      const matchesCategoria = selectedCategoria ? (wine.categoria || "Tinto") === selectedCategoria : true;

      return matchesSearch && matchesUva && matchesPais && matchesVinicola && matchesCategoria;
    })
    .sort((a, b) => {
      const priceA = a.precoPromocional ?? a.precoOriginal;
      const priceB = b.precoPromocional ?? b.precoOriginal;

      if (sortBy === "price-asc") return priceA - priceB;
      if (sortBy === "price-desc") return priceB - priceA;
      if (sortBy === "name-desc") return b.name.localeCompare(a.name);
      return a.name.localeCompare(b.name);
    });

  // Global sharing URLs
  const shareText = "Confira o catálogo de vinhos corporativo B2B da Allvino!";
  const globalWhatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + (typeof window !== "undefined" ? window.location.href : ""))}`;
  const instagramUrl = "https://instagram.com/allvinob2b"; // Link placeholder do perfil Allvino

  return (
    <div className="min-h-screen bg-allvino-background text-allvino-text font-sans pb-16">
      
      {/* Navigation Header */}
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
          <div className="flex items-center space-x-4">
            {/* Share Buttons */}
            <span className="hidden sm:inline text-xs text-allvino-on-surface-variant">Compartilhar site:</span>
            <a
              href={globalWhatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded bg-[#25D366] hover:bg-[#20ba5a] text-white text-[10px] font-bold tracking-wide transition shadow"
            >
              WhatsApp
            </a>
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white text-[10px] font-bold tracking-wide transition shadow"
            >
              Instagram
            </a>
            <Link
              href="/admin/login"
              className="px-3 py-1.5 rounded bg-allvino-surface-container-high hover:bg-allvino-primary hover:text-white border border-allvino-outline-variant transition text-[10px] font-bold"
            >
              Admin
            </Link>
          </div>
        </div>
      </nav>

      {/* Editorial Hero Header */}
      <header className="border-b border-allvino-outline-variant/30 bg-allvino-surface-container-low/40 py-12 relative overflow-hidden">
        {/* Soft layout blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-allvino-primary-container rounded-full mix-blend-multiply filter blur-3xl opacity-5"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-allvino-secondary-container rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-4">
          <div className="flex justify-center mb-2">
            <img
              src="/logo.png"
              alt="Allvino Logo"
              className="h-24 w-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-allvino-secondary">
            Allvino B2B Importadora
          </p>
          <h1 className="text-4xl sm:text-5xl font-extrabold font-serif text-allvino-primary tracking-tight">
            Catálogo de Seleções
          </h1>
          <p className="text-sm text-allvino-on-surface-variant max-w-xl mx-auto font-light leading-relaxed">
            Consulte nosso portfólio completo de rótulos internacionais ativos. Exporte a listagem atualizada e customizada para download em PDF sommelier a qualquer momento.
          </p>
          
          <div className="flex gap-4 justify-center pt-2">
            <a
              href="/api/export-pdf"
              className="px-6 py-3 font-semibold rounded bg-allvino-primary text-white hover:bg-allvino-primary-container transition duration-300 text-sm shadow-md flex items-center gap-2 border border-allvino-primary"
            >
              📥 Baixar Catálogo PDF
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        
        {/* Filter and Wine Grid Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Filtering Sidebar */}
          <aside className="lg:col-span-3 space-y-6">
            <div className="glass-panel p-6 rounded-xl border border-allvino-outline-variant/30 space-y-5">
              <h2 className="font-serif font-bold text-lg text-allvino-primary border-b border-allvino-outline-variant/20 pb-2">
                Filtros e Busca
              </h2>

              {/* Text Search */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-allvino-primary mb-1.5">
                  Buscar Vinho
                </label>
                <input
                  type="text"
                  placeholder="Nome, vinícola ou região..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-allvino-surface-container-low border border-allvino-outline-variant text-allvino-text placeholder-allvino-on-surface-variant/50 focus:outline-none focus:border-allvino-primary text-xs"
                />
              </div>

              {/* Category Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-allvino-primary mb-1.5">
                  Categoria
                </label>
                <select
                  value={selectedCategoria}
                  onChange={(e) => setSelectedCategoria(e.target.value)}
                  className="w-full text-xs p-2.5 bg-allvino-surface-container-low border border-allvino-outline-variant rounded-md focus:outline-none focus:border-allvino-primary"
                >
                  <option value="">Todas as Categorias</option>
                  {categoriaOptions.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Grape selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-allvino-primary mb-1.5">
                  Variedade de Uva
                </label>
                <select
                  value={selectedUva}
                  onChange={(e) => setSelectedUva(e.target.value)}
                  className="w-full text-xs p-2.5 bg-allvino-surface-container-low border border-allvino-outline-variant rounded-md focus:outline-none focus:border-allvino-primary"
                >
                  <option value="">Todas as Uvas</option>
                  {uvaOptions.map((uva) => (
                    <option key={uva} value={uva}>
                      {uva}
                    </option>
                  ))}
                </select>
              </div>

              {/* Country Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-allvino-primary mb-1.5">
                  País de Origem
                </label>
                <select
                  value={selectedPais}
                  onChange={(e) => setSelectedPais(e.target.value)}
                  className="w-full text-xs p-2.5 bg-allvino-surface-container-low border border-allvino-outline-variant rounded-md focus:outline-none focus:border-allvino-primary"
                >
                  <option value="">Todos os Países</option>
                  {paisOptions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* Winery Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-allvino-primary mb-1.5">
                  Vinícola
                </label>
                <select
                  value={selectedVinicola}
                  onChange={(e) => setSelectedVinicola(e.target.value)}
                  className="w-full text-xs p-2.5 bg-allvino-surface-container-low border border-allvino-outline-variant rounded-md focus:outline-none focus:border-allvino-primary"
                >
                  <option value="">Todas as Vinícolas</option>
                  {vinicolaOptions.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sorting Options */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-allvino-primary mb-1.5">
                  Ordenar por
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full text-xs p-2.5 bg-allvino-surface-container-low border border-allvino-outline-variant rounded-md focus:outline-none focus:border-allvino-primary"
                >
                  <option value="name-asc">Nome (A - Z)</option>
                  <option value="name-desc">Nome (Z - A)</option>
                  <option value="price-asc">Menor Preço B2B</option>
                  <option value="price-desc">Maior Preço B2B</option>
                </select>
              </div>

              {/* Clean filters */}
              {(search || selectedUva || selectedPais || selectedVinicola || selectedCategoria) && (
                <button
                  onClick={() => {
                    setSearch("");
                    setSelectedUva("");
                    setSelectedPais("");
                    setSelectedVinicola("");
                    setSelectedCategoria("");
                  }}
                  className="w-full py-2 bg-allvino-surface-container-high hover:bg-allvino-primary hover:text-white rounded border border-allvino-outline-variant transition text-xs font-bold text-center"
                >
                  Limpar Filtros
                </button>
              )}
            </div>
          </aside>

          {/* Wine Cards Grid Area */}
          <div className="lg:col-span-9">
            {loading ? (
              <div className="py-24 text-center text-allvino-on-surface-variant space-y-4">
                <div className="w-12 h-12 border-4 border-allvino-primary border-t-allvino-secondary rounded-full animate-spin mx-auto"></div>
                <p className="text-sm font-light tracking-wide">Carregando catálogo corporativo...</p>
              </div>
            ) : filteredWines.length === 0 ? (
              <div className="py-24 text-center text-allvino-on-surface-variant glass-panel rounded-xl border border-allvino-outline-variant/30">
                <p className="text-base font-light">Nenhum rótulo atende aos filtros aplicados.</p>
                <button
                  onClick={() => {
                    setSearch("");
                    setSelectedUva("");
                    setSelectedPais("");
                    setSelectedVinicola("");
                    setSelectedCategoria("");
                  }}
                  className="mt-4 px-4 py-2 bg-allvino-primary text-white rounded text-xs font-semibold"
                >
                  Ver Todos os Vinhos
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredWines.map((wine) => (
                  <Link
                    href={`/product/${wine.id}`}
                    key={wine.id}
                    className="bg-white rounded-xl shadow-md border border-allvino-outline-variant/30 flex flex-col justify-between overflow-hidden group hover:shadow-lg hover:border-allvino-secondary/40 transition duration-300 cursor-pointer"
                  >
                    
                    {/* Visual Card Top Block */}
                    <div className="p-5 flex-grow space-y-4 relative">
                      
                      {/* Wine Image Wrapper */}
                      <div className="w-full h-48 bg-allvino-surface-container-low/40 rounded-lg p-2 flex items-center justify-center border border-allvino-outline-variant/10 overflow-hidden relative">
                        <img
                          src={wine.imagemUrl}
                          alt={wine.name}
                          className="max-h-full max-w-full object-contain transform group-hover:scale-105 transition duration-500"
                        />
                        {/* Vintage badge floating */}
                        <div className="absolute top-2 right-2 px-2.5 py-1 rounded bg-allvino-primary text-white text-[10px] font-bold tracking-wider">
                          Safra {wine.safra}
                        </div>
                        {/* Country Flag overlay beside bottle */}
                        <div className="absolute bottom-2 left-2 flex items-center space-x-1 bg-white/95 border border-allvino-outline-variant/20 rounded px-1.5 py-0.5 shadow-sm">
                          <img
                            src={getCountryFlagUrl(wine.paisOrigem)}
                            alt={wine.paisOrigem}
                            className="w-4 h-2.5 object-cover rounded-sm"
                          />
                          <span className="text-[9px] font-bold text-allvino-secondary uppercase">
                            {wine.paisOrigem}
                          </span>
                        </div>
                      </div>

                      {/* Technical specifications */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-allvino-secondary">
                            {wine.vinicola}
                          </div>
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-allvino-primary/10 text-allvino-primary">
                            {wine.categoria || "Tinto"}
                          </span>
                        </div>
                        <h3 className="text-base font-serif font-bold text-allvino-primary leading-snug line-clamp-1 group-hover:text-allvino-secondary transition">
                          {wine.name}
                        </h3>
                        <p className="text-xs text-allvino-on-surface-variant font-light">
                          {wine.uva} • {wine.teorAlcoolico}% ABV
                        </p>
                      </div>

                      {/* Tasting description */}
                      <p className="text-xs text-allvino-text/80 line-clamp-3 leading-relaxed font-light">
                        {wine.notasDegustacao}
                      </p>
                    </div>

                    {/* Pricing and details footer block */}
                    <div className="px-5 py-4 bg-allvino-surface-container-low/30 border-t border-allvino-outline-variant/20 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-allvino-on-surface-variant block">
                          Preço Unitário B2B
                        </span>
                        <span className="text-[9px] text-allvino-secondary block font-semibold mb-0.5">
                          (Caixa c/ 6 garrafas)
                        </span>
                        {wine.precoPromocional !== null && wine.precoPromocional !== undefined ? (
                          <div className="flex items-baseline gap-2">
                            <span className="text-lg font-black text-allvino-primary">
                              R$ {wine.precoPromocional.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-xs text-allvino-on-surface-variant line-through">
                              R$ {wine.precoOriginal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-lg font-bold text-allvino-text">
                            R$ {wine.precoOriginal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-allvino-primary font-bold group-hover:text-allvino-secondary transition flex items-center gap-0.5">
                          Ver Detalhes →
                        </span>
                      </div>
                    </div>

                  </Link>
                ))}
              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
}
