"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
  const [sortBy, setSortBy] = useState("name-asc");

  // Dynamic filter options extracted from fetched data
  const [uvaOptions, setUvaOptions] = useState<string[]>([]);
  const [paisOptions, setPaisOptions] = useState<string[]>([]);
  const [vinicolaOptions, setVinicolaOptions] = useState<string[]>([]);

  useEffect(() => {
    fetchWines();
  }, []);

  const fetchWines = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/wines");
      if (res.ok) {
        const data: Product[] = await res.json();
        // Public store only shows active wines
        const activeWines = data.filter((w) => w.status);
        setWines(activeWines);

        // Extract unique options for filters
        const grapes = Array.from(new Set(activeWines.map((w) => w.uva.split(",")[0].trim()))).sort();
        const countries = Array.from(new Set(activeWines.map((w) => w.paisOrigem))).sort();
        const wineries = Array.from(new Set(activeWines.map((w) => w.vinicola))).sort();

        setUvaOptions(grapes);
        setPaisOptions(countries);
        setVinicolaOptions(wineries);
      }
    } catch (error) {
      console.error("Erro ao carregar vitrine de vinhos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter & Sort Logic
  const filteredWines = wines
    .filter((wine) => {
      const matchesSearch =
        wine.name.toLowerCase().includes(search.toLowerCase()) ||
        wine.vinicola.toLowerCase().includes(search.toLowerCase()) ||
        wine.regiao.toLowerCase().includes(search.toLowerCase());

      const matchesUva = selectedUva ? wine.uva.toLowerCase().includes(selectedUva.toLowerCase()) : true;
      const matchesPais = selectedPais ? wine.paisOrigem === selectedPais : true;
      const matchesVinicola = selectedVinicola ? wine.vinicola === selectedVinicola : true;

      return matchesSearch && matchesUva && matchesPais && matchesVinicola;
    })
    .sort((a, b) => {
      const priceA = a.precoPromocional ?? a.precoOriginal;
      const priceB = b.precoPromocional ?? b.precoOriginal;

      if (sortBy === "price-asc") return priceA - priceB;
      if (sortBy === "price-desc") return priceB - priceA;
      if (sortBy === "name-desc") return b.name.localeCompare(a.name);
      return a.name.localeCompare(b.name); // name-asc (default)
    });

  return (
    <div className="min-h-screen bg-allvino-background text-allvino-text font-sans pb-16">
      
      {/* Editorial Hero Header */}
      <header className="border-b border-allvino-outline-variant/30 bg-allvino-surface-container-low/40 py-12 relative overflow-hidden">
        {/* Soft layout blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-allvino-primary-container rounded-full mix-blend-multiply filter blur-3xl opacity-5"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-allvino-secondary-container rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-4">
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
            <Link
              href="/admin/login"
              className="px-6 py-3 font-semibold rounded border border-allvino-primary text-allvino-primary hover:bg-allvino-primary hover:text-white transition duration-300 text-sm"
            >
              Acesso Restrito
            </Link>
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
              {(search || selectedUva || selectedPais || selectedVinicola) && (
                <button
                  onClick={() => {
                    setSearch("");
                    setSelectedUva("");
                    setSelectedPais("");
                    setSelectedVinicola("");
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
                  }}
                  className="mt-4 px-4 py-2 bg-allvino-primary text-white rounded text-xs font-semibold"
                >
                  Ver Todos os Vinhos
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredWines.map((wine) => (
                  <div
                    key={wine.id}
                    className="bg-white rounded-xl shadow-md border border-allvino-outline-variant/30 flex flex-col justify-between overflow-hidden group hover:shadow-lg hover:border-allvino-secondary/40 transition duration-300"
                  >
                    
                    {/* Visual Card Top Block */}
                    <div className="p-5 flex-grow space-y-4">
                      
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
                      </div>

                      {/* Technical specifications */}
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-allvino-secondary">
                          {wine.paisOrigem} ({wine.regiao})
                        </div>
                        <h3 className="text-lg font-serif font-bold text-allvino-primary leading-snug line-clamp-1">
                          {wine.name}
                        </h3>
                        <p className="text-xs text-allvino-on-surface-variant font-light">
                          {wine.vinicola} • {wine.uva} • {wine.teorAlcoolico}% ABV
                        </p>
                      </div>

                      {/* Tasting description */}
                      <p className="text-xs text-allvino-text/80 line-clamp-3 leading-relaxed font-light">
                        {wine.notasDegustacao}
                      </p>
                    </div>

                    {/* Pricing and inventory footer block */}
                    <div className="px-5 py-4 bg-allvino-surface-container-low/30 border-t border-allvino-outline-variant/20 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-allvino-on-surface-variant block">
                          Preço Caixa B2B
                        </span>
                        {wine.precoPromocional ? (
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
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          wine.estoque === 0
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        }`}>
                          {wine.estoque === 0 ? "Esgotado" : `${wine.estoque} un`}
                        </span>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
}
