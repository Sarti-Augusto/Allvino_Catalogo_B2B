"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
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

const PRESET_IMAGES = [
  { label: "Tinto", url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=300&auto=format&fit=crop" },
  { label: "Branco / Rosé", url: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=300&auto=format&fit=crop" },
  { label: "Rosé Premium", url: "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=300&auto=format&fit=crop" },
  { label: "Espumante", url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=300&auto=format&fit=crop" }
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [vinicola, setVinicola] = useState("");
  const [uva, setUva] = useState("");
  const [teorAlcoolico, setTeorAlcoolico] = useState("13.5");
  const [safra, setSafra] = useState("2022");
  const [paisOrigem, setPaisOrigem] = useState("Brasil");
  const [regiao, setRegiao] = useState("Bento Gonçalves");
  const [notasDegustacao, setNotasDegustacao] = useState("");
  const [precoOriginal, setPrecoOriginal] = useState("120");
  const [precoPromocional, setPrecoPromocional] = useState("");
  const [estoque, setEstoque] = useState("50");
  const [status, setStatus] = useState("true");
  const [imagemUrl, setImagemUrl] = useState(PRESET_IMAGES[0].url);

  // Notification Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/wines");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      } else {
        showToast("Erro ao buscar vinhos do servidor.", "error");
      }
    } catch (err) {
      showToast("Falha de conexão com a API.", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setName("");
    setVinicola("");
    setUva("");
    setTeorAlcoolico("13.5");
    setSafra("2022");
    setPaisOrigem("Brasil");
    setRegiao("Bento Gonçalves");
    setNotasDegustacao("");
    setPrecoOriginal("120");
    setPrecoPromocional("");
    setEstoque("50");
    setStatus("true");
    setImagemUrl(PRESET_IMAGES[0].url);
    setShowModal(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setVinicola(product.vinicola);
    setUva(product.uva);
    setTeorAlcoolico(String(product.teorAlcoolico));
    setSafra(product.safra);
    setPaisOrigem(product.paisOrigem);
    setRegiao(product.regiao);
    setNotasDegustacao(product.notasDegustacao);
    setPrecoOriginal(String(product.precoOriginal));
    setPrecoPromocional(product.precoPromocional ? String(product.precoPromocional) : "");
    setEstoque(String(product.estoque));
    setStatus(String(product.status));
    setImagemUrl(product.imagemUrl);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name,
      vinicola,
      uva,
      teorAlcoolico,
      safra,
      paisOrigem,
      regiao,
      notasDegustacao,
      precoOriginal,
      precoPromocional: precoPromocional || null,
      status: status === "true",
      imagemUrl,
      estoque,
    };

    try {
      const url = editingProduct ? `/api/wines/${editingProduct.id}` : "/api/wines";
      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast(editingProduct ? "Vinho atualizado com sucesso!" : "Vinho cadastrado com sucesso!");
        setShowModal(false);
        fetchProducts();
      } else {
        const errorData = await res.json();
        showToast(errorData.error || "Erro ao salvar alterações.", "error");
      }
    } catch (err) {
      showToast("Erro na requisição. Tente novamente.", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este vinho?")) return;

    try {
      const res = await fetch(`/api/wines/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Vinho excluído do catálogo.");
        fetchProducts();
      } else {
        showToast("Falha ao excluir o vinho.", "error");
      }
    } catch (err) {
      showToast("Erro ao processar exclusão.", "error");
    }
  };

  // KPIs
  const totalWines = products.length;
  const activeWines = products.filter((p) => p.status).length;
  const outOfStock = products.filter((p) => p.estoque === 0).length;
  const avgPrice = products.length
    ? products.reduce((acc, curr) => acc + curr.precoOriginal, 0) / products.length
    : 0;

  // Filter products by search
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.vinicola.toLowerCase().includes(search.toLowerCase()) ||
      p.uva.toLowerCase().includes(search.toLowerCase()) ||
      p.paisOrigem.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-allvino-dark-950 text-white font-sans pb-12">
      {/* Navigation Header */}
      <nav className="border-b border-allvino-dark-800 bg-allvino-dark-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <span className="text-xl font-bold font-serif text-allvino-gold-400 tracking-wider">
                ALLVINO ADMIN
              </span>
              <div className="hidden md:flex space-x-4">
                <Link
                  href="/admin/dashboard"
                  className="px-3 py-2 rounded-md text-sm font-medium bg-allvino-wine-900/40 text-allvino-gold-400 border border-allvino-wine-800/30"
                >
                  Vinhos
                </Link>
                <Link
                  href="/admin/templates"
                  className="px-3 py-2 rounded-md text-sm font-medium text-allvino-dark-200 hover:text-allvino-gold-400 transition"
                >
                  Editor de Templates
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/"
                target="_blank"
                className="text-xs text-allvino-dark-300 hover:text-allvino-gold-400 transition mr-2"
              >
                Ver Vitrine Pública
              </a>
              <button
                onClick={() => signOut({ callbackUrl: "/admin/login" })}
                className="px-4 py-1.5 rounded bg-allvino-dark-800 hover:bg-allvino-wine-800 border border-allvino-dark-700 hover:border-allvino-wine-600 transition text-xs font-semibold"
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
              ? "bg-emerald-950/90 border-emerald-500/30 text-emerald-200" 
              : "bg-red-950/90 border-red-500/30 text-red-200"
          }`}>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Dashboard Title & Quick Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold font-serif text-allvino-gold-400">
              Gerenciamento de Catálogo
            </h1>
            <p className="text-allvino-dark-300 text-sm mt-1">
              Olá, {session?.user?.name || "Administrador"}. Controle os vinhos expostos na vitrine e exportados no PDF.
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-2.5 rounded-lg bg-allvino-wine-800 hover:bg-allvino-wine-700 text-white font-semibold text-sm shadow-md transition duration-200 flex items-center gap-2 border border-allvino-wine-600/35"
          >
            + Adicionar Vinho
          </button>
        </div>

        {/* KPI Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="glass-panel p-6 rounded-xl relative overflow-hidden">
            <p className="text-xs font-semibold tracking-wider text-allvino-dark-300 uppercase">Total de Rótulos</p>
            <p className="text-3xl font-extrabold text-white mt-2">{totalWines}</p>
            <div className="absolute top-0 right-0 w-24 h-24 bg-allvino-gold-400/5 rounded-full filter blur-md"></div>
          </div>
          <div className="glass-panel p-6 rounded-xl relative overflow-hidden">
            <p className="text-xs font-semibold tracking-wider text-allvino-dark-300 uppercase">Rótulos Ativos</p>
            <p className="text-3xl font-extrabold text-allvino-gold-400 mt-2">{activeWines}</p>
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full filter blur-md"></div>
          </div>
          <div className="glass-panel p-6 rounded-xl relative overflow-hidden">
            <p className="text-xs font-semibold tracking-wider text-allvino-dark-300 uppercase">Fora de Estoque</p>
            <p className="text-3xl font-extrabold text-allvino-wine-500 mt-2">{outOfStock}</p>
            <div className="absolute top-0 right-0 w-24 h-24 bg-allvino-wine-800/5 rounded-full filter blur-md"></div>
          </div>
          <div className="glass-panel p-6 rounded-xl relative overflow-hidden">
            <p className="text-xs font-semibold tracking-wider text-allvino-dark-300 uppercase">Preço Médio B2B</p>
            <p className="text-3xl font-extrabold text-white mt-2">
              R$ {avgPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="absolute top-0 right-0 w-24 h-24 bg-allvino-gold-400/5 rounded-full filter blur-md"></div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <input
              type="text"
              placeholder="Buscar por nome, vinícola, uva ou país..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 rounded-lg bg-allvino-dark-900 border border-allvino-dark-800 text-white placeholder-allvino-dark-500 focus:outline-none focus:border-allvino-gold-400/60 transition text-sm"
            />
          </div>
          <div className="text-xs text-allvino-dark-300">
            Exibindo <span className="text-allvino-gold-400 font-semibold">{filteredProducts.length}</span> de {totalWines} rótulos.
          </div>
        </div>

        {/* Table View */}
        <div className="glass-panel rounded-xl overflow-hidden shadow-xl border border-allvino-dark-800">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-20 text-center text-allvino-dark-300 space-y-3">
                <div className="w-10 h-10 border-4 border-allvino-wine-800 border-t-allvino-gold-400 rounded-full animate-spin mx-auto"></div>
                <p className="text-xs tracking-wider">Carregando catálogo...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-20 text-center text-allvino-dark-300">
                <p className="text-sm">Nenhum vinho encontrado com os filtros aplicados.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-allvino-dark-800 text-xs font-semibold uppercase tracking-wider text-allvino-gold-400 bg-allvino-dark-900/40">
                    <th className="py-4 px-6">Vinho</th>
                    <th className="py-4 px-6">Uva / Blend</th>
                    <th className="py-4 px-6">Estoque</th>
                    <th className="py-4 px-6">Preço</th>
                    <th className="py-4 px-6 text-center">Status</th>
                    <th className="py-4 px-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-allvino-dark-850 text-sm">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-allvino-dark-900/30 transition duration-150">
                      <td className="py-4 px-6 flex items-center space-x-4">
                        <div className="w-12 h-14 bg-white rounded-md p-1 border border-allvino-dark-700 flex items-center justify-center flex-shrink-0">
                          <img
                            src={product.imagemUrl}
                            alt={product.name}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-white">{product.name}</p>
                          <p className="text-xs text-allvino-dark-300">
                            {product.vinicola} • {product.paisOrigem} ({product.regiao}) • Safra {product.safra}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-allvino-dark-200">
                        {product.uva}
                        <p className="text-xs text-allvino-dark-400 mt-0.5">{product.teorAlcoolico}% vol</p>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`font-semibold ${product.estoque === 0 ? "text-allvino-wine-500" : "text-white"}`}>
                          {product.estoque} un
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {product.precoPromocional ? (
                          <div className="space-y-0.5">
                            <span className="text-allvino-wine-400 font-bold block">
                              R$ {product.precoPromocional.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-xs text-allvino-dark-400 line-through">
                              R$ {product.precoOriginal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-white font-semibold">
                            R$ {product.precoOriginal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          product.status 
                            ? "bg-emerald-950/60 border border-emerald-500/20 text-emerald-400" 
                            : "bg-allvino-dark-800 border border-allvino-dark-700 text-allvino-dark-300"
                        }`}>
                          {product.status ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(product)}
                          className="px-3 py-1.5 rounded bg-allvino-dark-800 hover:bg-allvino-gold-400 border border-allvino-dark-700 hover:border-allvino-gold-500 text-allvino-dark-200 hover:text-allvino-dark-950 font-medium text-xs transition"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="px-3 py-1.5 rounded bg-allvino-dark-850 hover:bg-allvino-wine-900 border border-allvino-dark-800 hover:border-allvino-wine-700 text-allvino-wine-500 hover:text-white font-medium text-xs transition"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* CRUD Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-allvino-dark-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-3xl glass-panel rounded-2xl p-6 md:p-8 shadow-2xl relative border border-allvino-gold-400/25 max-h-[90vh] overflow-y-auto mt-10">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-allvino-dark-300 hover:text-white text-xl"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold font-serif text-allvino-gold-400 mb-6">
              {editingProduct ? "Editar Vinho" : "Adicionar Novo Vinho"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-allvino-gold-400 mb-1">
                    Nome do Vinho *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-allvino-dark-900 border border-allvino-dark-800 text-white placeholder-allvino-dark-500 focus:outline-none focus:border-allvino-gold-400/60 transition text-sm"
                    placeholder="Château Margaux"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-allvino-gold-400 mb-1">
                    Vinícola *
                  </label>
                  <input
                    type="text"
                    required
                    value={vinicola}
                    onChange={(e) => setVinicola(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-allvino-dark-900 border border-allvino-dark-800 text-white placeholder-allvino-dark-500 focus:outline-none focus:border-allvino-gold-400/60 transition text-sm"
                    placeholder="Maison Margaux"
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-allvino-gold-400 mb-1">
                    Uva / Blend *
                  </label>
                  <input
                    type="text"
                    required
                    value={uva}
                    onChange={(e) => setUva(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-allvino-dark-900 border border-allvino-dark-800 text-white placeholder-allvino-dark-500 focus:outline-none focus:border-allvino-gold-400/60 transition text-sm"
                    placeholder="Cabernet Sauvignon, Merlot"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-allvino-gold-400 mb-1">
                    Teor Alcoólico (%) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={teorAlcoolico}
                    onChange={(e) => setTeorAlcoolico(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-allvino-dark-900 border border-allvino-dark-800 text-white focus:outline-none focus:border-allvino-gold-400/60 transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-allvino-gold-400 mb-1">
                    Safra *
                  </label>
                  <input
                    type="text"
                    required
                    value={safra}
                    onChange={(e) => setSafra(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-allvino-dark-900 border border-allvino-dark-800 text-white focus:outline-none focus:border-allvino-gold-400/60 transition text-sm"
                    placeholder="2018"
                  />
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-allvino-gold-400 mb-1">
                    País de Origem *
                  </label>
                  <input
                    type="text"
                    required
                    value={paisOrigem}
                    onChange={(e) => setPaisOrigem(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-allvino-dark-900 border border-allvino-dark-800 text-white focus:outline-none focus:border-allvino-gold-400/60 transition text-sm"
                    placeholder="França"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-allvino-gold-400 mb-1">
                    Região *
                  </label>
                  <input
                    type="text"
                    required
                    value={regiao}
                    onChange={(e) => setRegiao(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-allvino-dark-900 border border-allvino-dark-800 text-white focus:outline-none focus:border-allvino-gold-400/60 transition text-sm"
                    placeholder="Bordeaux"
                  />
                </div>
              </div>

              {/* Row 4 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-allvino-gold-400 mb-1">
                    Preço Original (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={precoOriginal}
                    onChange={(e) => setPrecoOriginal(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-allvino-dark-900 border border-allvino-dark-800 text-white focus:outline-none focus:border-allvino-gold-400/60 transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-allvino-gold-400 mb-1">
                    Preço Promocional (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={precoPromocional}
                    onChange={(e) => setPrecoPromocional(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-allvino-dark-900 border border-allvino-dark-800 text-white focus:outline-none focus:border-allvino-gold-400/60 transition text-sm"
                    placeholder="Deixe em branco se não houver"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-allvino-gold-400 mb-1">
                    Estoque (unidades) *
                  </label>
                  <input
                    type="number"
                    required
                    value={estoque}
                    onChange={(e) => setEstoque(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-allvino-dark-900 border border-allvino-dark-800 text-white focus:outline-none focus:border-allvino-gold-400/60 transition text-sm"
                  />
                </div>
              </div>

              {/* Status & Preset Image Selector */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-allvino-gold-400 mb-1">
                    Status do Produto
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-allvino-dark-900 border border-allvino-dark-800 text-white focus:outline-none focus:border-allvino-gold-400/60 transition text-sm"
                  >
                    <option value="true">Ativo (visível no catálogo)</option>
                    <option value="false">Inativo (oculto)</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-allvino-gold-400 mb-1">
                    Imagem do Vinho (Selecione um Preset ou Cole a URL)
                  </label>
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap gap-2">
                      {PRESET_IMAGES.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setImagemUrl(preset.url)}
                          className={`px-3 py-1.5 rounded text-xs font-medium border transition ${
                            imagemUrl === preset.url
                              ? "bg-allvino-gold-400 border-allvino-gold-500 text-allvino-dark-950 font-bold"
                              : "bg-allvino-dark-900 border-allvino-dark-800 text-allvino-dark-200 hover:border-allvino-dark-700"
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={imagemUrl}
                      onChange={(e) => setImagemUrl(e.target.value)}
                      className="w-full px-4 py-2 rounded bg-allvino-dark-900 border border-allvino-dark-800 text-white text-xs focus:outline-none focus:border-allvino-gold-400/60 transition"
                      placeholder="https://exemplo.com/sua-imagem.jpg"
                    />
                  </div>
                </div>
              </div>

              {/* Tasting Notes */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-allvino-gold-400 mb-1">
                  Notas de Degustação / Ficha Técnica
                </label>
                <textarea
                  value={notasDegustacao}
                  onChange={(e) => setNotasDegustacao(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-allvino-dark-900 border border-allvino-dark-800 text-white placeholder-allvino-dark-500 focus:outline-none focus:border-allvino-gold-400/60 transition text-sm h-24 resize-none"
                  placeholder="Descreva as qualidades organolépticas, cor, aroma, sabor e harmonização..."
                />
              </div>

              {/* Submit & Cancel */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-allvino-dark-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-lg bg-allvino-dark-800 hover:bg-allvino-dark-750 text-allvino-dark-200 text-sm font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg bg-allvino-wine-800 hover:bg-allvino-wine-700 text-white text-sm font-semibold transition shadow-md"
                >
                  {editingProduct ? "Salvar Alterações" : "Cadastrar Vinho"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
