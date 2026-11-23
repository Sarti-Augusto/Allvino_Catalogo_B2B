"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ExportCatalogModal } from "@/components/catalog-controls";
import { CatalogSortRule, MAX_PDF_PRODUCTS } from "@/lib/catalog-export";

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

type AdminStatusFilter = "all" | "active" | "inactive" | "promo" | "low-stock";
type AdminSortOption = "recent" | "name-asc" | "price-asc" | "price-desc" | "stock-asc";

const PRESET_IMAGES = [
  { label: "Tinto", url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=300&auto=format&fit=crop" },
  { label: "Branco / Rosé", url: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=300&auto=format&fit=crop" },
  { label: "Rosé Premium", url: "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=300&auto=format&fit=crop" },
  { label: "Espumante", url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=300&auto=format&fit=crop" }
];

const DEFAULT_CATEGORIES = ["Tinto", "Branco", "Rosé", "Espumante", "Fortificado", "Laranja"];

export default function DashboardPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AdminStatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<AdminSortOption>("recent");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Custom categories list
  const [categoriesList, setCategoriesList] = useState<string[]>(DEFAULT_CATEGORIES);

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
  const [status, setStatus] = useState("true");
  const [imagemUrl, setImagemUrl] = useState(PRESET_IMAGES[0].url);
  const [categoria, setCategoria] = useState("Tinto");
  const [estoque, setEstoque] = useState("50");
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Inline Quick Edit State (Price & Stock)
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [inlinePrecoOriginal, setInlinePrecoOriginal] = useState("");
  const [inlinePrecoPromo, setInlinePrecoPromo] = useState("");
  const [inlineEstoque, setInlineEstoque] = useState("");
  const [inlineSaving, setInlineSaving] = useState(false);

  // Bulk Selection & Actions State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Direct PDF Export Modal from Admin
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [selectedExportProductIds, setSelectedExportProductIds] = useState<string[]>([]);
  const [exportSortRules, setExportSortRules] = useState<CatalogSortRule[]>([
    { field: "name", direction: "asc" },
  ]);
  const [exportHidePrices, setExportHidePrices] = useState(false);
  const [exportIncludeIndex, setExportIncludeIndex] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  // Notification Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });
  }, []);

  const handleSignOut = async () => {
    await createClient().auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  };

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

        // Merge seeded unique categories with defaults
        const uniqueCats = Array.from(new Set(data.map((p: Product) => p.categoria).filter(Boolean))) as string[];
        const merged = Array.from(new Set([...DEFAULT_CATEGORIES, ...uniqueCats]));
        setCategoriesList(merged);
      } else {
        showToast("Erro ao buscar vinhos do servidor.", "error");
      }
    } catch {
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
    setStatus("true");
    setImagemUrl(PRESET_IMAGES[0].url);
    setCategoria("Tinto");
    setEstoque("50");
    setShowNewCategoryInput(false);
    setNewCategoryName("");
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
    setPrecoPromocional(
      product.precoPromocional !== null && product.precoPromocional !== undefined
        ? String(product.precoPromocional)
        : "",
    );
    setStatus(String(product.status));
    setImagemUrl(product.imagemUrl);
    setCategoria(product.categoria || "Tinto");
    setEstoque(String(product.estoque ?? 50));
    setShowNewCategoryInput(false);
    setNewCategoryName("");
    setShowModal(true);
  };

  const handleDuplicateProduct = (product: Product) => {
    setEditingProduct(null);
    setName(`${product.name} (Nova Safra)`);
    setVinicola(product.vinicola);
    setUva(product.uva);
    setTeorAlcoolico(String(product.teorAlcoolico));
    setSafra(product.safra);
    setPaisOrigem(product.paisOrigem);
    setRegiao(product.regiao);
    setNotasDegustacao(product.notasDegustacao);
    setPrecoOriginal(String(product.precoOriginal));
    setPrecoPromocional(
      product.precoPromocional !== null && product.precoPromocional !== undefined
        ? String(product.precoPromocional)
        : "",
    );
    setStatus("true");
    setImagemUrl(product.imagemUrl);
    setCategoria(product.categoria || "Tinto");
    setEstoque(String(product.estoque ?? 50));
    setShowNewCategoryInput(false);
    setNewCategoryName("");
    setShowModal(true);
    showToast(`Dados de "${product.name}" clonados. Revise e clique em Cadastrar Vinho.`);
  };

  const startInlineEdit = (product: Product) => {
    setInlineEditId(product.id);
    setInlinePrecoOriginal(String(product.precoOriginal));
    setInlinePrecoPromo(
      product.precoPromocional !== null && product.precoPromocional !== undefined
        ? String(product.precoPromocional)
        : "",
    );
    setInlineEstoque(String(product.estoque ?? 0));
  };

  const saveInlineEdit = async (productId: string) => {
    if (inlineSaving) return;
    setInlineSaving(true);
    try {
      const payload = {
        precoOriginal: inlinePrecoOriginal,
        precoPromocional: inlinePrecoPromo.trim() ? inlinePrecoPromo.trim() : null,
        estoque: inlineEstoque.trim() ? Number(inlineEstoque) : 0,
      };
      const res = await fetch(`/api/wines/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data) {
        setProducts((prev) => prev.map((p) => (p.id === productId ? data : p)));
        setInlineEditId(null);
        showToast("Preço e estoque atualizados rapidamente!");
      } else {
        showToast(data?.error || "Valores inválidos para preço ou estoque.", "error");
      }
    } catch {
      showToast("Erro de conexão ao salvar edição rápida.", "error");
    } finally {
      setInlineSaving(false);
    }
  };

  const handleConfirmAddCategory = () => {
    const formatted = newCategoryName.trim();
    if (!formatted) return;
    if (!categoriesList.includes(formatted)) {
      setCategoriesList([...categoriesList, formatted]);
    }
    setCategoria(formatted);
    setNewCategoryName("");
    setShowNewCategoryInput(false);
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
      precoPromocional: precoPromocional.trim() || null,
      status: status === "true",
      imagemUrl,
      categoria,
      estoque: estoque.trim() ? Number(estoque) : 0,
    };

    try {
      const url = editingProduct ? `/api/wines/${editingProduct.id}` : "/api/wines";
      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let responseData: any = {};
      try {
        responseData = await res.json();
      } catch {
        // Ignora falha de parse se a resposta for HTML de erro do servidor
      }

      if (res.ok) {
        showToast(editingProduct ? "Vinho atualizado com sucesso!" : "Vinho cadastrado com sucesso!");
        setShowModal(false);
        fetchProducts();
      } else {
        showToast(
          responseData.error || `Erro (${res.status}): Não foi possível salvar o vinho.`,
          "error"
        );
      }
    } catch (err) {
      console.error("Erro na requisição:", err);
      showToast("Erro na requisição. Verifique sua conexão e tente novamente.", "error");
    }
  };

  const handleToggleStatus = async (product: Product) => {
    if (togglingId === product.id) return;
    setTogglingId(product.id);
    try {
      const res = await fetch(`/api/wines/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: !product.status }),
      });
      if (res.ok) {
        setProducts((current) =>
          current.map((p) => (p.id === product.id ? { ...p, status: !p.status } : p)),
        );
        showToast(
          !product.status
            ? `"${product.name}" ativado na vitrine.`
            : `"${product.name}" ocultado da vitrine.`,
        );
      } else {
        showToast("Não foi possível alterar o status.", "error");
      }
    } catch {
      showToast("Erro de conexão ao alterar status.", "error");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/wines/${id}`, { method: "DELETE" });
      if (res.ok) {
        setConfirmDeleteId(null);
        setSelectedIds((prev) => prev.filter((item) => item !== id));
        showToast("Vinho excluído do catálogo.");
        fetchProducts();
      } else {
        showToast("Falha ao excluir o vinho.", "error");
      }
    } catch {
      showToast("Erro ao processar exclusão.", "error");
    }
  };

  const handleBulkStatusChange = async (targetStatus: boolean) => {
    if (selectedIds.length === 0 || bulkLoading) return;
    setBulkLoading(true);
    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`/api/wines/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: targetStatus }),
          }),
        ),
      );
      await fetchProducts();
      showToast(
        `${selectedIds.length} rótulo(s) ${targetStatus ? "ativado(s)" : "ocultado(s)"} com sucesso!`,
      );
      setSelectedIds([]);
    } catch {
      showToast("Erro ao aplicar ação em lote.", "error");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkApplyDiscount = async () => {
    if (selectedIds.length === 0 || bulkLoading) return;
    const raw = window.prompt(
      "Informe o percentual de desconto promocional sobre o preço original (ex: 10 para 10% OFF, ou 0 para remover promoção):",
      "10",
    );
    if (raw === null) return;
    const pct = Number(raw.replace(",", "."));
    if (!Number.isFinite(pct) || pct < 0 || pct >= 95) {
      showToast("Informe um percentual válido entre 0 e 90.", "error");
      return;
    }

    setBulkLoading(true);
    try {
      const selectedSet = new Set(selectedIds);
      const targets = products.filter((p) => selectedSet.has(p.id));
      await Promise.all(
        targets.map((product) => {
          const nextPromo =
            pct === 0
              ? null
              : Math.max(0.01, Math.round(product.precoOriginal * (1 - pct / 100) * 100) / 100);
          return fetch(`/api/wines/${product.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ precoPromocional: nextPromo }),
          });
        }),
      );
      await fetchProducts();
      showToast(
        pct === 0
          ? `Promoção removida de ${targets.length} rótulo(s).`
          : `Desconto de ${pct}% aplicado a ${targets.length} rótulo(s)!`,
      );
      setSelectedIds([]);
    } catch {
      showToast("Erro ao atualizar preços promocionais em lote.", "error");
    } finally {
      setBulkLoading(false);
    }
  };

  // KPIs
  const totalWines = products.length;
  const activeWines = products.filter((p) => p.status).length;
  const inactiveWines = products.filter((p) => !p.status).length;
  const promoWines = products.filter(
    (p) => p.precoPromocional !== null && p.precoPromocional !== undefined,
  ).length;
  const lowStockWines = products.filter((p) => (p.estoque ?? 0) < 10).length;
  const uniqueCategoriesCount = categoriesList.length;
  const avgPrice = products.length
    ? products.reduce((acc, curr) => acc + (curr.precoPromocional ?? curr.precoOriginal), 0) / products.length
    : 0;

  // Filter and sort products
  const filteredProducts = products
    .filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.vinicola.toLowerCase().includes(search.toLowerCase()) ||
        p.uva.toLowerCase().includes(search.toLowerCase()) ||
        p.paisOrigem.toLowerCase().includes(search.toLowerCase()) ||
        (p.categoria || "").toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;
      if (categoryFilter && (p.categoria || "Tinto") !== categoryFilter) return false;
      if (statusFilter === "active" && !p.status) return false;
      if (statusFilter === "inactive" && p.status) return false;
      if (statusFilter === "promo" && (p.precoPromocional === null || p.precoPromocional === undefined)) {
        return false;
      }
      if (statusFilter === "low-stock" && (p.estoque ?? 0) >= 10) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "name-asc") return a.name.localeCompare(b.name, "pt-BR");
      if (sortBy === "price-asc") {
        return (a.precoPromocional ?? a.precoOriginal) - (b.precoPromocional ?? b.precoOriginal);
      }
      if (sortBy === "price-desc") {
        return (b.precoPromocional ?? b.precoOriginal) - (a.precoPromocional ?? a.precoOriginal);
      }
      if (sortBy === "stock-asc") return (a.estoque ?? 0) - (b.estoque ?? 0);
      return 0;
    });

  const allFilteredSelected =
    filteredProducts.length > 0 && filteredProducts.every((p) => selectedIds.includes(p.id));

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      const filteredSet = new Set(filteredProducts.map((p) => p.id));
      setSelectedIds((prev) => prev.filter((id) => !filteredSet.has(id)));
    } else {
      const next = new Set(selectedIds);
      filteredProducts.forEach((p) => next.add(p.id));
      setSelectedIds(Array.from(next));
    }
  };

  const openAdminExportModal = (useSelectedOnly: boolean) => {
    const activePool = products.filter((p) => p.status);
    const chosenIds = useSelectedOnly
      ? selectedIds.filter((id) => activePool.some((p) => p.id === id))
      : filteredProducts.filter((p) => p.status).map((p) => p.id);

    setSelectedExportProductIds(
      (chosenIds.length > 0 ? chosenIds : activePool.map((p) => p.id)).slice(0, MAX_PDF_PRODUCTS),
    );
    setExportError("");
    setIsExportOpen(true);
  };

  const handleExportAdminCatalog = async () => {
    if (selectedExportProductIds.length === 0 || isExporting) return;
    setIsExporting(true);
    setExportError("");

    try {
      const response = await fetch("/api/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedProductIds: selectedExportProductIds,
          sortRules: exportSortRules,
          hidePrices: exportHidePrices,
          includeIndex: exportIncludeIndex,
        }),
      });

      if (!response.ok) {
        const details = await response.json().catch(() => null);
        throw new Error(details?.error || "Não foi possível gerar o catálogo PDF.");
      }

      const pdfBlob = await response.blob();
      const downloadUrl = URL.createObjectURL(pdfBlob);
      const downloadLink = document.createElement("a");
      downloadLink.href = downloadUrl;
      downloadLink.download = "catalogo-allvino-b2b.pdf";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
      setIsExportOpen(false);
      showToast("Catálogo PDF exportado com sucesso!");
    } catch (error) {
      setExportError(
        error instanceof Error ? error.message : "Não foi possível gerar o catálogo PDF.",
      );
    } finally {
      setIsExporting(false);
    }
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
                  className="px-3 py-2 rounded-md text-sm font-medium bg-allvino-primary text-white border border-allvino-primary-container"
                >
                  Vinhos
                </Link>
                <Link
                  href="/admin/templates"
                  className="px-3 py-2 rounded-md text-sm font-medium text-allvino-on-surface-variant hover:text-allvino-primary transition"
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
              className="flex-1 text-center px-3 py-1.5 rounded-md text-xs font-bold bg-allvino-primary text-white"
            >
              Vinhos
            </Link>
            <Link
              href="/admin/templates"
              className="flex-1 text-center px-3 py-1.5 rounded-md text-xs font-semibold bg-allvino-surface-container-high text-allvino-on-surface-variant"
            >
              Editor de Templates
            </Link>
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

        {/* Dashboard Title & Quick Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold font-serif text-allvino-primary">
              Gerenciamento de Catálogo
            </h1>
            <p className="text-allvino-on-surface-variant text-sm mt-1">
              Olá, {userEmail || "Administrador"}. Edite preços inline, aplique promoções em lote e exporte catálogos PDF personalizados.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => openAdminExportModal(false)}
              disabled={loading || activeWines === 0}
              className="px-4 py-2.5 rounded-lg bg-white hover:bg-allvino-surface-container-high text-allvino-primary font-bold text-sm shadow-sm transition border border-allvino-secondary flex items-center gap-2 disabled:opacity-50"
            >
              📥 Exportar PDF
            </button>
            <button
              onClick={handleOpenCreateModal}
              className="px-5 py-2.5 rounded-lg bg-allvino-primary hover:bg-allvino-primary-container text-white font-semibold text-sm shadow-md transition duration-200 flex items-center gap-2 border border-allvino-primary"
            >
              + Adicionar Vinho
            </button>
          </div>
        </div>

        {/* KPI Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="glass-panel p-6 rounded-xl relative overflow-hidden">
            <p className="text-xs font-semibold tracking-wider text-allvino-on-surface-variant uppercase">Total de Rótulos</p>
            <p className="text-3xl font-extrabold text-allvino-text mt-2">{totalWines}</p>
            <p className="text-[11px] text-allvino-on-surface-variant mt-1">
              {promoWines} em oferta promocional · {lowStockWines} com estoque &lt; 10
            </p>
            <div className="absolute top-0 right-0 w-24 h-24 bg-allvino-secondary/5 rounded-full filter blur-md"></div>
          </div>
          <div className="glass-panel p-6 rounded-xl relative overflow-hidden">
            <p className="text-xs font-semibold tracking-wider text-allvino-on-surface-variant uppercase">Rótulos Ativos / Categorias</p>
            <p className="text-3xl font-extrabold text-allvino-primary mt-2">
              {activeWines} <span className="text-sm text-allvino-on-surface-variant font-normal">ativos em</span> {uniqueCategoriesCount} <span className="text-sm text-allvino-on-surface-variant font-normal">categorias</span>
            </p>
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full filter blur-md"></div>
          </div>
          <div className="glass-panel p-6 rounded-xl relative overflow-hidden">
            <p className="text-xs font-semibold tracking-wider text-allvino-on-surface-variant uppercase">Preço Médio B2B</p>
            <p className="text-3xl font-extrabold text-allvino-text mt-2">
              R$ {avgPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="absolute top-0 right-0 w-24 h-24 bg-allvino-secondary/5 rounded-full filter blur-md"></div>
          </div>
        </div>

        {/* Status Quick Filter Pills */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {[
            { id: "all", label: `Todos (${totalWines})` },
            { id: "active", label: `● Ativos (${activeWines})` },
            { id: "inactive", label: `○ Inativos (${inactiveWines})` },
            { id: "promo", label: `🏷️ Em Oferta (${promoWines})` },
            { id: "low-stock", label: `⚠️ Estoque Baixo (${lowStockWines})` },
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setStatusFilter(pill.id as AdminStatusFilter)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition border ${
                statusFilter === pill.id
                  ? "bg-allvino-primary text-white border-allvino-primary shadow-sm"
                  : "bg-white text-allvino-on-surface-variant border-allvino-outline-variant/50 hover:border-allvino-primary"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Filter, Category, Sort and Search Bar */}
        <div className="mb-5 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="flex flex-1 flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1 sm:max-w-md">
              <input
                type="text"
                placeholder="Buscar por nome, vinícola, uva, país ou categoria..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 rounded-lg bg-allvino-surface-container-low border border-allvino-outline-variant text-allvino-text placeholder-allvino-on-surface-variant/60 focus:outline-none focus:border-allvino-primary/60 transition text-sm"
              />
            </div>
            <select
              aria-label="Filtrar por categoria"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg bg-allvino-surface-container-low border border-allvino-outline-variant px-3 py-2.5 text-xs font-semibold text-allvino-text focus:outline-none focus:border-allvino-primary"
            >
              <option value="">Todas as categorias</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <select
              aria-label="Ordenar listagem"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as AdminSortOption)}
              className="rounded-lg bg-allvino-surface-container-low border border-allvino-outline-variant px-3 py-2.5 text-xs font-semibold text-allvino-text focus:outline-none focus:border-allvino-primary"
            >
              <option value="recent">Ordenar: Mais recentes</option>
              <option value="name-asc">Ordenar: Nome (A - Z)</option>
              <option value="price-asc">Ordenar: Menor preço B2B</option>
              <option value="price-desc">Ordenar: Maior preço B2B</option>
              <option value="stock-asc">Ordenar: Menor estoque</option>
            </select>
          </div>
          <div className="text-xs text-allvino-on-surface-variant self-end lg:self-auto">
            Exibindo <span className="text-allvino-primary font-semibold">{filteredProducts.length}</span> de {totalWines} rótulos.
          </div>
        </div>

        {/* Bulk Actions Bar when rows are selected */}
        {selectedIds.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-allvino-primary/30 bg-allvino-primary/5 px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-allvino-primary px-2.5 py-0.5 text-xs font-extrabold text-white">
                {selectedIds.length}
              </span>
              <span className="text-xs font-bold text-allvino-primary">
                rótulo(s) selecionado(s) para ação em lote
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={bulkLoading}
                onClick={() => handleBulkStatusChange(true)}
                className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-50"
              >
                ● Ativar selecionados
              </button>
              <button
                type="button"
                disabled={bulkLoading}
                onClick={() => handleBulkStatusChange(false)}
                className="rounded-lg border border-allvino-outline-variant bg-white px-3 py-1.5 text-xs font-bold text-allvino-text transition hover:bg-allvino-surface-container-high disabled:opacity-50"
              >
                ○ Inativar selecionados
              </button>
              <button
                type="button"
                disabled={bulkLoading}
                onClick={handleBulkApplyDiscount}
                className="rounded-lg border border-allvino-secondary bg-amber-50 px-3 py-1.5 text-xs font-bold text-allvino-primary transition hover:bg-amber-100 disabled:opacity-50"
              >
                🏷️ Aplicar desconto %
              </button>
              <button
                type="button"
                disabled={bulkLoading}
                onClick={() => openAdminExportModal(true)}
                className="rounded-lg bg-allvino-primary px-3 py-1.5 text-xs font-bold text-white transition hover:bg-allvino-primary-container disabled:opacity-50"
              >
                📥 Gerar PDF dos selecionados
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="px-2 py-1 text-xs font-semibold text-allvino-on-surface-variant hover:text-allvino-primary"
              >
                Limpar seleção
              </button>
            </div>
          </div>
        )}

        {/* Table View */}
        <div className="glass-panel rounded-xl overflow-hidden shadow-xl border border-allvino-outline-variant/40">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-20 text-center text-allvino-on-surface-variant space-y-3">
                <div className="w-10 h-10 border-4 border-allvino-primary border-t-allvino-secondary rounded-full animate-spin mx-auto"></div>
                <p className="text-xs tracking-wider">Carregando catálogo...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-20 text-center text-allvino-on-surface-variant">
                <p className="text-sm">Nenhum vinho encontrado com os filtros aplicados.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-allvino-outline-variant/40 text-xs font-semibold uppercase tracking-wider text-allvino-primary bg-allvino-surface-container-low/40">
                    <th className="py-4 pl-5 pr-2 w-10">
                      <input
                        type="checkbox"
                        aria-label="Selecionar todos os vinhos filtrados"
                        checked={allFilteredSelected}
                        onChange={toggleSelectAllFiltered}
                        className="h-4 w-4 rounded accent-allvino-primary cursor-pointer"
                      />
                    </th>
                    <th className="py-4 px-4">Vinho</th>
                    <th className="py-4 px-4">Categoria</th>
                    <th className="py-4 px-4">Uva / Blend</th>
                    <th className="py-4 px-4">Preço B2B & Estoque</th>
                    <th className="py-4 px-4 text-center">Status</th>
                    <th className="py-4 px-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-allvino-outline-variant/20 text-sm">
                  {filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className={`hover:bg-allvino-surface-container-lowest/50 transition duration-150 ${
                        selectedIds.includes(product.id) ? "bg-allvino-primary/[0.03]" : ""
                      }`}
                    >
                      <td className="py-4 pl-5 pr-2 align-middle">
                        <input
                          type="checkbox"
                          aria-label={`Selecionar ${product.name}`}
                          checked={selectedIds.includes(product.id)}
                          onChange={() => toggleSelectOne(product.id)}
                          className="h-4 w-4 rounded accent-allvino-primary cursor-pointer"
                        />
                      </td>
                      <td className="py-4 px-4 flex items-center space-x-3.5">
                        <div className="w-12 h-14 bg-white rounded-md p-1 border border-allvino-outline-variant/50 flex items-center justify-center flex-shrink-0">
                          <img
                            src={product.imagemUrl}
                            alt={product.name}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-allvino-text">{product.name}</p>
                          <p className="text-xs text-allvino-on-surface-variant">
                            {product.vinicola} • {product.paisOrigem} ({product.regiao}) • Safra {product.safra}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-allvino-surface-container-high border border-allvino-outline-variant text-allvino-text">
                          {product.categoria || "Tinto"}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-allvino-text">
                        {product.uva}
                        <p className="text-xs text-allvino-on-surface-variant mt-0.5">{product.teorAlcoolico}% vol</p>
                      </td>
                      <td className="py-4 px-4">
                        {inlineEditId === product.id ? (
                          <div className="space-y-1.5 rounded-lg border border-allvino-primary/30 bg-white p-2 shadow-sm max-w-[210px]">
                            <div className="grid grid-cols-2 gap-1.5">
                              <div>
                                <label className="block text-[9px] font-bold uppercase text-allvino-on-surface-variant">
                                  Original (R$)
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={inlinePrecoOriginal}
                                  onChange={(e) => setInlinePrecoOriginal(e.target.value)}
                                  className="w-full rounded border px-1.5 py-1 text-xs font-bold"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold uppercase text-allvino-primary">
                                  Promo (R$)
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder="Sem promo"
                                  value={inlinePrecoPromo}
                                  onChange={(e) => setInlinePrecoPromo(e.target.value)}
                                  className="w-full rounded border px-1.5 py-1 text-xs font-bold text-allvino-primary"
                                />
                              </div>
                            </div>
                            <div className="flex items-end justify-between gap-1.5">
                              <div className="w-20">
                                <label className="block text-[9px] font-bold uppercase text-allvino-on-surface-variant">
                                  Estoque (un.)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={inlineEstoque}
                                  onChange={(e) => setInlineEstoque(e.target.value)}
                                  className="w-full rounded border px-1.5 py-1 text-xs font-semibold"
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  disabled={inlineSaving}
                                  onClick={() => saveInlineEdit(product.id)}
                                  className="rounded bg-allvino-primary px-2.5 py-1 text-[10px] font-bold text-white hover:bg-allvino-primary-container disabled:opacity-50"
                                >
                                  {inlineSaving ? "..." : "✓ Salvar"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setInlineEditId(null)}
                                  className="rounded border border-allvino-outline-variant px-2 py-1 text-[10px] font-bold text-allvino-on-surface-variant"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="group relative">
                            {product.precoPromocional !== null && product.precoPromocional !== undefined ? (
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-allvino-primary font-bold">
                                    R$ {product.precoPromocional.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                  </span>
                                  <span className="rounded bg-allvino-primary/10 px-1.5 py-0.2 text-[9px] font-extrabold text-allvino-primary">
                                    -{Math.round((1 - product.precoPromocional / product.precoOriginal) * 100)}%
                                  </span>
                                </div>
                                <span className="text-xs text-allvino-on-surface-variant line-through block">
                                  R$ {product.precoOriginal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            ) : (
                              <span className="text-allvino-text font-semibold block">
                                R$ {product.precoOriginal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              </span>
                            )}
                            <div className="flex items-center gap-2 mt-0.5">
                              <span
                                className={`text-[11px] ${
                                  (product.estoque ?? 0) < 10
                                    ? "text-amber-700 font-bold"
                                    : "text-allvino-on-surface-variant"
                                }`}
                              >
                                Estoque: <strong>{product.estoque ?? 0}</strong> un.
                              </span>
                              <button
                                type="button"
                                onClick={() => startInlineEdit(product)}
                                title="Edição rápida de preço e estoque"
                                className="rounded border border-allvino-outline-variant/60 bg-white px-1.5 py-0.5 text-[9.5px] font-bold text-allvino-primary opacity-80 transition hover:border-allvino-primary hover:opacity-100"
                              >
                                ✏️ Rápido
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          type="button"
                          disabled={togglingId === product.id}
                          onClick={() => handleToggleStatus(product)}
                          title="Clique para alternar entre Ativo e Inativo"
                          className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer disabled:opacity-50 ${
                            product.status 
                              ? "bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100" 
                              : "bg-allvino-surface-container-high border border-allvino-outline-variant text-allvino-on-surface-variant hover:bg-allvino-surface-container-highest"
                          }`}
                        >
                          {product.status ? "● Ativo" : "○ Inativo"}
                        </button>
                      </td>
                      <td className="py-4 px-6 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(product)}
                          className="px-2.5 py-1.5 rounded bg-allvino-surface-container-high hover:bg-allvino-secondary border border-allvino-outline-variant hover:border-allvino-secondary text-allvino-text hover:text-white font-medium text-xs transition"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicateProduct(product)}
                          title="Clonar dados deste vinho para cadastrar nova safra ou variação"
                          className="px-2.5 py-1.5 rounded bg-white hover:bg-allvino-surface-container-high border border-allvino-outline-variant text-allvino-primary font-semibold text-xs transition"
                        >
                          Duplicar
                        </button>
                        {confirmDeleteId === product.id ? (
                          <span className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDelete(product.id)}
                              className="px-2.5 py-1.5 rounded bg-red-700 text-white font-bold text-xs transition hover:bg-red-800"
                            >
                              Confirmar
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1.5 rounded border border-allvino-outline-variant text-allvino-on-surface-variant text-xs"
                            >
                              ✕
                            </button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(product.id)}
                            className="px-2.5 py-1.5 rounded bg-allvino-surface-container-high hover:bg-allvino-primary border border-allvino-outline-variant hover:border-allvino-primary text-allvino-primary hover:text-white font-medium text-xs transition"
                          >
                            Excluir
                          </button>
                        )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-allvino-text/25 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-3xl glass-panel rounded-2xl p-6 md:p-8 shadow-2xl relative border border-allvino-outline-variant/45 max-h-[90vh] overflow-y-auto mt-10 text-allvino-text">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-allvino-on-surface-variant hover:text-allvino-primary text-xl"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold font-serif text-allvino-primary mb-6">
              {editingProduct ? "Editar Vinho" : "Adicionar Novo Vinho"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-allvino-primary mb-1">
                    Nome do Vinho *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-allvino-surface-container-low border border-allvino-outline-variant text-allvino-text placeholder-allvino-on-surface-variant focus:outline-none focus:border-allvino-primary/60 transition text-sm"
                    placeholder="Château Margaux"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-allvino-primary mb-1">
                    Vinícola *
                  </label>
                  <input
                    type="text"
                    required
                    value={vinicola}
                    onChange={(e) => setVinicola(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-allvino-surface-container-low border border-allvino-outline-variant text-allvino-text placeholder-allvino-on-surface-variant focus:outline-none focus:border-allvino-primary/60 transition text-sm"
                    placeholder="Maison Margaux"
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-allvino-primary mb-1">
                    Uva / Blend *
                  </label>
                  <input
                    type="text"
                    required
                    value={uva}
                    onChange={(e) => setUva(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-allvino-surface-container-low border border-allvino-outline-variant text-allvino-text placeholder-allvino-on-surface-variant focus:outline-none focus:border-allvino-primary/60 transition text-sm"
                    placeholder="Cabernet Sauvignon, Merlot"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-allvino-primary mb-1">
                    Teor Alcoólico (%) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={teorAlcoolico}
                    onChange={(e) => setTeorAlcoolico(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-allvino-surface-container-low border border-allvino-outline-variant text-allvino-text focus:outline-none focus:border-allvino-primary/60 transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-allvino-primary mb-1">
                    Safra *
                  </label>
                  <input
                    type="text"
                    required
                    value={safra}
                    onChange={(e) => setSafra(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-allvino-surface-container-low border border-allvino-outline-variant text-allvino-text focus:outline-none focus:border-allvino-primary/60 transition text-sm"
                    placeholder="2018"
                  />
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-allvino-primary mb-1">
                    País de Origem *
                  </label>
                  <input
                    type="text"
                    required
                    value={paisOrigem}
                    onChange={(e) => setPaisOrigem(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-allvino-surface-container-low border border-allvino-outline-variant text-allvino-text focus:outline-none focus:border-allvino-primary/60 transition text-sm"
                    placeholder="França"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-allvino-primary mb-1">
                    Região *
                  </label>
                  <input
                    type="text"
                    required
                    value={regiao}
                    onChange={(e) => setRegiao(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-allvino-surface-container-low border border-allvino-outline-variant text-allvino-text focus:outline-none focus:border-allvino-primary/60 transition text-sm"
                    placeholder="Bordeaux"
                  />
                </div>
              </div>

              {/* Row 4 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-allvino-primary mb-1">
                    Preço Original (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={precoOriginal}
                    onChange={(e) => setPrecoOriginal(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-allvino-surface-container-low border border-allvino-outline-variant text-allvino-text focus:outline-none focus:border-allvino-primary/60 transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-allvino-primary mb-1">
                    Preço Promocional (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={precoPromocional}
                    onChange={(e) => setPrecoPromocional(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-allvino-surface-container-low border border-allvino-outline-variant text-allvino-text focus:outline-none focus:border-allvino-primary/60 transition text-sm"
                    placeholder="Menor que o preço original"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-allvino-primary mb-1">
                    Estoque Disponível (un.)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={estoque}
                    onChange={(e) => setEstoque(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-allvino-surface-container-low border border-allvino-outline-variant text-allvino-text focus:outline-none focus:border-allvino-primary/60 transition text-sm"
                  />
                </div>
              </div>

              {/* Status, Categoria, Image presets */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-allvino-primary mb-1">
                    Status do Produto
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-allvino-surface-container-low border border-allvino-outline-variant text-allvino-text focus:outline-none focus:border-allvino-primary/60 transition text-sm"
                  >
                    <option value="true">Ativo (visível no catálogo)</option>
                    <option value="false">Inativo (oculto)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-allvino-primary mb-1">
                    Categoria do Vinho
                  </label>
                  <div className="flex gap-1.5">
                    <select
                      value={categoria}
                      onChange={(e) => setCategoria(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-allvino-surface-container-low border border-allvino-outline-variant text-allvino-text focus:outline-none focus:border-allvino-primary/60 transition text-sm"
                    >
                      {categoriesList.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowNewCategoryInput((prev) => !prev)}
                      className="px-2.5 rounded bg-allvino-surface-container-high border border-allvino-outline-variant text-allvino-primary hover:bg-allvino-primary hover:text-white font-bold text-sm transition"
                      title="Nova Categoria"
                    >
                      +
                    </button>
                  </div>
                  {showNewCategoryInput && (
                    <div className="mt-2 flex gap-1.5">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Ex: Frisante"
                        className="w-full rounded border border-allvino-outline-variant bg-white px-2.5 py-1.5 text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleConfirmAddCategory}
                        className="rounded bg-allvino-primary px-2.5 py-1.5 text-xs font-bold text-white"
                      >
                        OK
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-allvino-primary mb-1">
                    Presets de Imagem
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_IMAGES.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setImagemUrl(preset.url)}
                        className={`px-2.5 py-1.5 rounded text-[10px] font-medium border transition ${
                          imagemUrl === preset.url
                            ? "bg-allvino-primary border-allvino-primary text-white font-bold"
                            : "bg-allvino-surface-container-high border border-allvino-outline-variant text-allvino-text hover:border-allvino-outline-variant/80"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Image URL custom input & Guideline note */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-allvino-primary mb-1">
                      Enviar Arquivo de Imagem
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const img = new Image();
                            img.onload = () => {
                              const maxW = 600;
                              const maxH = 1200;
                              let width = img.width;
                              let height = img.height;

                              if (width > maxW || height > maxH) {
                                const ratio = Math.min(maxW / width, maxH / height);
                                width = Math.round(width * ratio);
                                height = Math.round(height * ratio);
                              }

                              const canvas = document.createElement("canvas");
                              canvas.width = width;
                              canvas.height = height;
                              const ctx = canvas.getContext("2d");
                              if (ctx) {
                                ctx.drawImage(img, 0, 0, width, height);
                                setImagemUrl(canvas.toDataURL("image/webp", 0.85));
                              } else if (typeof event.target?.result === "string") {
                                setImagemUrl(event.target.result);
                              }
                            };
                            img.src = event.target?.result as string;
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full px-3 py-2 rounded bg-allvino-surface-container-low border border-allvino-outline-variant text-allvino-text text-xs focus:outline-none focus:border-allvino-primary/60 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-allvino-primary mb-1">
                      Ou URL da Imagem do Vinho
                    </label>
                    <input
                      type="text"
                      value={imagemUrl}
                      onChange={(e) => setImagemUrl(e.target.value)}
                      className="w-full px-4 py-2.5 rounded bg-allvino-surface-container-low border border-allvino-outline-variant text-allvino-text text-xs focus:outline-none focus:border-allvino-primary/60 transition"
                      placeholder="https://exemplo.com/sua-imagem.jpg"
                    />
                  </div>
                </div>
                
                {imagemUrl && (
                  <div className="flex items-center space-x-3 bg-allvino-surface-container-low/40 p-2.5 rounded-lg border border-allvino-outline-variant/30">
                    <div className="w-12 h-16 bg-white border border-allvino-outline-variant/40 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                      <img src={imagemUrl} alt="Preview" className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="text-[10px] text-allvino-on-surface-variant">
                      <p className="font-semibold text-allvino-primary">Visualização da Garrafa</p>
                      <p className="font-light line-clamp-1 max-w-md">{imagemUrl.startsWith("data:") ? "Arquivo de imagem carregado localmente (Base64)" : imagemUrl}</p>
                    </div>
                  </div>
                )}
                
                <p className="text-[10px] text-allvino-on-surface-variant/80 mt-1 font-light">
                  💡 **Dimensão Recomendada:** Para manter a consistência visual no catálogo digital e PDF, utilize imagens em formato **vertical** de garrafa com **fundo transparente (PNG)**, dimensões sugeridas de **300x700px**.
                </p>
              </div>

              {/* Tasting Notes */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-allvino-primary mb-1">
                  Notas de Degustação / Ficha Técnica
                </label>
                <textarea
                  value={notasDegustacao}
                  onChange={(e) => setNotasDegustacao(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-allvino-surface-container-low border border-allvino-outline-variant text-allvino-text placeholder-allvino-on-surface-variant focus:outline-none focus:border-allvino-primary/60 transition text-sm h-24 resize-none"
                  placeholder="Descreva as qualidades organolépticas, cor, aroma, sabor e harmonização..."
                />
              </div>

              {/* Submit & Cancel */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-allvino-outline-variant/30">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-lg bg-allvino-surface-container-high hover:bg-allvino-surface-container-highest text-allvino-text text-sm font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg bg-allvino-primary hover:bg-allvino-primary-container text-white text-sm font-semibold transition shadow-md"
                >
                  {editingProduct ? "Salvar Alterações" : "Cadastrar Vinho"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ExportCatalogModal
        isOpen={isExportOpen}
        onClose={() => {
          if (!isExporting) setIsExportOpen(false);
        }}
        products={products.filter((p) => p.status)}
        selectedProductIds={selectedExportProductIds}
        onProductSelectionChange={setSelectedExportProductIds}
        sortRules={exportSortRules}
        onSortRulesChange={setExportSortRules}
        hidePrices={exportHidePrices}
        onHidePricesChange={setExportHidePrices}
        includeIndex={exportIncludeIndex}
        onIncludeIndexChange={setExportIncludeIndex}
        onExport={handleExportAdminCatalog}
        isExporting={isExporting}
        error={exportError}
      />
    </div>
  );
}
