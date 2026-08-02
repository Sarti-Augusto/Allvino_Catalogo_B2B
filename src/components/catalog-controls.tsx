"use client";

import { useEffect, useMemo, useState } from "react";

import {
  CATALOG_EXPORT_SORT_FIELDS,
  CATALOG_SORT_OPTIONS,
  CatalogSort,
  CatalogSortField,
  CatalogSortRule,
  MAX_PDF_PRODUCTS,
} from "@/lib/catalog-export";

interface FloatingCatalogFiltersProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onClear: () => void;
  activeFilterCount: number;
  resultCount: number;
  totalCount: number;
  search: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  categoryOptions: string[];
  selectedGrape: string;
  onGrapeChange: (value: string) => void;
  grapeOptions: string[];
  selectedCountry: string;
  onCountryChange: (value: string) => void;
  countryOptions: string[];
  selectedWinery: string;
  onWineryChange: (value: string) => void;
  wineryOptions: string[];
  sort: CatalogSort;
  onSortChange: (value: CatalogSort) => void;
}

const fieldClassName =
  "w-full rounded-lg border border-allvino-outline-variant bg-white px-3 py-2.5 text-sm text-allvino-text focus:border-allvino-primary focus:outline-none focus:ring-2 focus:ring-allvino-primary/10";

export function FloatingCatalogFilters({
  isOpen,
  onToggle,
  onClose,
  onClear,
  activeFilterCount,
  resultCount,
  totalCount,
  search,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categoryOptions,
  selectedGrape,
  onGrapeChange,
  grapeOptions,
  selectedCountry,
  onCountryChange,
  countryOptions,
  selectedWinery,
  onWineryChange,
  wineryOptions,
  sort,
  onSortChange,
}: FloatingCatalogFiltersProps) {
  return (
    <div className="relative z-30 mb-8">
      {isOpen && (
        <button
          type="button"
          aria-label="Fechar filtros"
          className="fixed inset-0 z-20 cursor-default bg-allvino-primary/5 backdrop-blur-[1px]"
          onClick={onClose}
        />
      )}

      <div className="relative z-30 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-allvino-outline-variant/30 bg-white/90 p-3 shadow-sm backdrop-blur-md">
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls="catalog-filter-panel"
          onClick={onToggle}
          className="inline-flex items-center gap-2 rounded-lg bg-allvino-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-allvino-primary-container"
        >
          <span aria-hidden="true">☰</span>
          Filtros
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-allvino-primary">
              {activeFilterCount}
            </span>
          )}
        </button>

        <p className="text-xs text-allvino-on-surface-variant sm:text-sm">
          Exibindo <strong className="text-allvino-primary">{resultCount}</strong> de{" "}
          {totalCount} rótulos
        </p>
      </div>

      {isOpen && (
        <section
          id="catalog-filter-panel"
          aria-label="Filtros do catálogo"
          className="absolute left-0 right-0 z-40 mt-3 rounded-2xl border border-allvino-outline-variant/40 bg-allvino-background p-5 shadow-2xl sm:right-auto sm:w-[min(760px,calc(100vw-3rem))]"
        >
          <div className="mb-5 flex items-center justify-between border-b border-allvino-outline-variant/30 pb-3">
            <div>
              <h2 className="font-serif text-xl font-bold text-allvino-primary">
                Filtrar catálogo
              </h2>
              <p className="mt-1 text-xs text-allvino-on-surface-variant">
                Os filtros também serão aplicados à exportação em PDF.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-allvino-outline-variant px-3 py-2 text-xs font-bold text-allvino-primary transition hover:bg-allvino-surface-container-high"
            >
              Fechar
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="sm:col-span-2 lg:col-span-3">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-allvino-primary">
                Buscar vinho
              </span>
              <input
                type="search"
                placeholder="Nome, vinícola ou região..."
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                className={fieldClassName}
              />
            </label>

            <FilterSelect
              label="Tipo"
              value={selectedCategory}
              onChange={onCategoryChange}
              emptyLabel="Todos os tipos"
              options={categoryOptions}
            />
            <FilterSelect
              label="Uva"
              value={selectedGrape}
              onChange={onGrapeChange}
              emptyLabel="Todas as uvas"
              options={grapeOptions}
            />
            <FilterSelect
              label="País"
              value={selectedCountry}
              onChange={onCountryChange}
              emptyLabel="Todos os países"
              options={countryOptions}
            />
            <FilterSelect
              label="Vinícola"
              value={selectedWinery}
              onChange={onWineryChange}
              emptyLabel="Todas as vinícolas"
              options={wineryOptions}
            />

            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-allvino-primary">
                Ordenar vitrine por
              </span>
              <select
                value={sort}
                onChange={(event) => onSortChange(event.target.value as CatalogSort)}
                className={fieldClassName}
              >
                {CATALOG_SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-5 flex justify-end gap-3 border-t border-allvino-outline-variant/30 pt-4">
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={onClear}
                className="rounded-lg border border-allvino-outline-variant px-4 py-2.5 text-xs font-bold text-allvino-primary transition hover:bg-allvino-surface-container-high"
              >
                Limpar filtros
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-allvino-primary px-5 py-2.5 text-xs font-bold text-white transition hover:bg-allvino-primary-container"
            >
              Ver {resultCount} rótulos
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  emptyLabel: string;
  options: string[];
}

function FilterSelect({
  label,
  value,
  onChange,
  emptyLabel,
  options,
}: FilterSelectProps) {
  return (
    <label>
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-allvino-primary">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClassName}
      >
        <option value="">{emptyLabel}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

interface ExportCatalogProduct {
  id: string;
  name: string;
  vinicola: string;
  uva: string;
  paisOrigem: string;
  precoOriginal: number;
  precoPromocional: number | null;
}

interface ExportCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ExportCatalogProduct[];
  selectedProductIds: string[];
  onProductSelectionChange: (ids: string[]) => void;
  sortRules: CatalogSortRule[];
  onSortRulesChange: (rules: CatalogSortRule[]) => void;
  onExport: () => void;
  isExporting: boolean;
  error: string;
}

export function ExportCatalogModal({
  isOpen,
  onClose,
  products,
  selectedProductIds,
  onProductSelectionChange,
  sortRules,
  onSortRulesChange,
  onExport,
  isExporting,
  error,
}: ExportCatalogModalProps) {
  const [productSearch, setProductSearch] = useState("");
  const visibleProducts = useMemo(() => {
    const normalizedSearch = productSearch.trim().toLocaleLowerCase("pt-BR");
    if (!normalizedSearch) return products;

    return products.filter((product) =>
      [product.name, product.vinicola, product.uva, product.paisOrigem].some(
        (value) => value.toLocaleLowerCase("pt-BR").includes(normalizedSearch),
      ),
    );
  }, [productSearch, products]);
  const selectedIds = useMemo(
    () => new Set(selectedProductIds),
    [selectedProductIds],
  );
  const allVisibleSelected =
    visibleProducts.length > 0 &&
    visibleProducts.every((product) => selectedIds.has(product.id));

  useEffect(() => {
    if (isOpen) setProductSearch("");
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleProduct = (productId: string) => {
    const nextIds = new Set(selectedProductIds);
    if (nextIds.has(productId)) {
      nextIds.delete(productId);
    } else if (nextIds.size < MAX_PDF_PRODUCTS) {
      nextIds.add(productId);
    }
    onProductSelectionChange(Array.from(nextIds));
  };

  const toggleVisibleProducts = () => {
    const nextIds = new Set(selectedProductIds);

    if (allVisibleSelected) {
      visibleProducts.forEach((product) => nextIds.delete(product.id));
    } else {
      visibleProducts.forEach((product) => {
        if (nextIds.size < MAX_PDF_PRODUCTS) nextIds.add(product.id);
      });
    }

    onProductSelectionChange(Array.from(nextIds));
  };

  const updateSortRule = (index: number, nextRule: CatalogSortRule) => {
    onSortRulesChange(
      sortRules.map((rule, ruleIndex) => (ruleIndex === index ? nextRule : rule)),
    );
  };

  const moveSortRule = (index: number, direction: -1 | 1) => {
    const destination = index + direction;
    if (destination < 0 || destination >= sortRules.length) return;

    const nextRules = [...sortRules];
    [nextRules[index], nextRules[destination]] = [
      nextRules[destination],
      nextRules[index],
    ];
    onSortRulesChange(nextRules);
  };

  const addSortRule = () => {
    const usedFields = new Set(sortRules.map((rule) => rule.field));
    const nextField = CATALOG_EXPORT_SORT_FIELDS.find(
      (option) => !usedFields.has(option.value),
    )?.value;

    if (nextField) {
      onSortRulesChange([...sortRules, { field: nextField, direction: "asc" }]);
    }
  };

  const directionLabel = (field: CatalogSortField, direction: "asc" | "desc") => {
    if (field === "price") {
      return direction === "asc" ? "Menor para maior" : "Maior para menor";
    }
    return direction === "asc" ? "A - Z" : "Z - A";
  };

  const hasMoreProductsThanLimit = products.length > MAX_PDF_PRODUCTS;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-catalog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-allvino-primary/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-6xl flex-col rounded-2xl border border-white/30 bg-allvino-background p-5 shadow-2xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-allvino-secondary">
              Catálogo personalizado
            </p>
            <h2
              id="export-catalog-title"
              className="mt-1 font-serif text-2xl font-bold text-allvino-primary"
            >
              Exportar PDF
            </h2>
            <p className="mt-1 text-xs text-allvino-on-surface-variant">
              Escolha os rótulos e combine os critérios na prioridade desejada.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="rounded-lg border border-allvino-outline-variant px-3 py-2 text-xs font-bold text-allvino-primary"
          >
            Fechar
          </button>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3 rounded-xl bg-allvino-surface-container-low p-3 text-xs text-allvino-on-surface-variant sm:grid-cols-3">
          <p>
            Disponíveis: <strong className="text-allvino-primary">{products.length}</strong>
          </p>
          <p>
            Selecionados: {" "}
            <strong className="text-allvino-primary">{selectedProductIds.length}</strong>
          </p>
          <p className="col-span-2 sm:col-span-1">
            Critérios: <strong className="text-allvino-primary">{sortRules.length}</strong>
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
            <section aria-labelledby="product-selection-title">
              <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h3
                    id="product-selection-title"
                    className="text-sm font-black uppercase tracking-wider text-allvino-primary"
                  >
                    1. Produtos do PDF
                  </h3>
                  <p className="mt-1 text-[11px] text-allvino-on-surface-variant">
                    A quantidade exportada será exatamente a quantidade selecionada.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={toggleVisibleProducts}
                    className="rounded-lg border border-allvino-outline-variant px-3 py-2 text-[11px] font-bold text-allvino-primary transition hover:bg-allvino-surface-container-high"
                  >
                    {allVisibleSelected ? "Desmarcar exibidos" : "Selecionar exibidos"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onProductSelectionChange([])}
                    className="rounded-lg border border-allvino-outline-variant px-3 py-2 text-[11px] font-bold text-allvino-primary transition hover:bg-allvino-surface-container-high"
                  >
                    Limpar
                  </button>
                </div>
              </div>

              <input
                type="search"
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
                placeholder="Buscar nome, vinícola, uva ou país..."
                className={`${fieldClassName} mb-3`}
              />

              {hasMoreProductsThanLimit && (
                <p className="mb-3 rounded-lg bg-amber-50 p-2 text-[11px] text-amber-900">
                  Por segurança, cada PDF aceita até {MAX_PDF_PRODUCTS} produtos.
                </p>
              )}

              <div className="max-h-[360px] space-y-2 overflow-y-auto rounded-xl border border-allvino-outline-variant/40 bg-white p-2">
                {visibleProducts.length === 0 ? (
                  <p className="p-6 text-center text-xs text-allvino-on-surface-variant">
                    Nenhum rótulo encontrado nesta busca.
                  </p>
                ) : (
                  visibleProducts.map((product) => {
                    const effectivePrice =
                      product.precoPromocional ?? product.precoOriginal;
                    return (
                      <label
                        key={product.id}
                        className="flex cursor-pointer items-start gap-3 rounded-lg border border-transparent p-3 transition hover:border-allvino-secondary/30 hover:bg-allvino-surface-container-low"
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.has(product.id)}
                          disabled={
                            !selectedIds.has(product.id) &&
                            selectedIds.size >= MAX_PDF_PRODUCTS
                          }
                          onChange={() => toggleProduct(product.id)}
                          className="mt-1 h-4 w-4 accent-allvino-primary disabled:cursor-not-allowed"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold text-allvino-primary">
                            {product.name}
                          </span>
                          <span className="mt-0.5 block truncate text-[11px] text-allvino-on-surface-variant">
                            {product.vinicola} · {product.uva} · {product.paisOrigem}
                          </span>
                        </span>
                        <span className="whitespace-nowrap text-xs font-black text-allvino-primary">
                          {effectivePrice.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </section>

            <section aria-labelledby="sort-rules-title">
              <h3
                id="sort-rules-title"
                className="text-sm font-black uppercase tracking-wider text-allvino-primary"
              >
                2. Ordem dinâmica
              </h3>
              <p className="mt-1 text-[11px] leading-relaxed text-allvino-on-surface-variant">
                O primeiro critério tem maior prioridade. Em caso de empate, o PDF usa
                o critério seguinte.
              </p>

              <div className="mt-4 space-y-3">
                {sortRules.map((rule, index) => (
                  <div
                    key={`${rule.field}-${index}`}
                    className="rounded-xl border border-allvino-outline-variant/40 bg-white p-3"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-allvino-secondary">
                        {index === 0 ? "Critério 1 · Principal" : `Critério ${index + 1}`}
                      </span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          aria-label={`Aumentar prioridade do critério ${index + 1}`}
                          disabled={index === 0}
                          onClick={() => moveSortRule(index, -1)}
                          className="h-7 w-7 rounded border border-allvino-outline-variant text-xs font-bold text-allvino-primary disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          aria-label={`Diminuir prioridade do critério ${index + 1}`}
                          disabled={index === sortRules.length - 1}
                          onClick={() => moveSortRule(index, 1)}
                          className="h-7 w-7 rounded border border-allvino-outline-variant text-xs font-bold text-allvino-primary disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          aria-label={`Remover critério ${index + 1}`}
                          disabled={sortRules.length === 1}
                          onClick={() =>
                            onSortRulesChange(
                              sortRules.filter((_, ruleIndex) => ruleIndex !== index),
                            )
                          }
                          className="h-7 rounded border border-allvino-outline-variant px-2 text-[10px] font-bold text-allvino-primary disabled:opacity-30"
                        >
                          Remover
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                      <select
                        aria-label={`Campo do critério ${index + 1}`}
                        value={rule.field}
                        onChange={(event) =>
                          updateSortRule(index, {
                            field: event.target.value as CatalogSortField,
                            direction: "asc",
                          })
                        }
                        className={fieldClassName}
                      >
                        {CATALOG_EXPORT_SORT_FIELDS.map((option) => (
                          <option
                            key={option.value}
                            value={option.value}
                            disabled={sortRules.some(
                              (currentRule, ruleIndex) =>
                                ruleIndex !== index && currentRule.field === option.value,
                            )}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <select
                        aria-label={`Direção do critério ${index + 1}`}
                        value={rule.direction}
                        onChange={(event) =>
                          updateSortRule(index, {
                            ...rule,
                            direction: event.target.value as "asc" | "desc",
                          })
                        }
                        className={fieldClassName}
                      >
                        <option value="asc">{directionLabel(rule.field, "asc")}</option>
                        <option value="desc">{directionLabel(rule.field, "desc")}</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              {sortRules.length < CATALOG_EXPORT_SORT_FIELDS.length && (
                <button
                  type="button"
                  onClick={addSortRule}
                  className="mt-3 w-full rounded-lg border border-dashed border-allvino-secondary px-4 py-2.5 text-xs font-bold text-allvino-primary transition hover:bg-allvino-surface-container-low"
                >
                  + Adicionar critério de desempate
                </button>
              )}
            </section>
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-700">
            {error}
          </p>
        )}

        <div className="mt-5 flex flex-col-reverse gap-3 border-t border-allvino-outline-variant/30 pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="rounded-lg border border-allvino-outline-variant px-5 py-3 text-sm font-bold text-allvino-primary transition hover:bg-allvino-surface-container-high"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={selectedProductIds.length === 0 || isExporting}
            onClick={onExport}
            className="rounded-lg bg-allvino-primary px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-allvino-primary-container disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isExporting
              ? "Gerando catálogo..."
              : `Gerar PDF com ${selectedProductIds.length} produto${selectedProductIds.length === 1 ? "" : "s"}`}
          </button>
        </div>
      </div>
    </div>
  );
}
