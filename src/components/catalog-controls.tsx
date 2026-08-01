"use client";

import {
  CATALOG_SORT_OPTIONS,
  CatalogSort,
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

interface ExportCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableCount: number;
  quantity: number;
  onQuantityChange: (value: number) => void;
  sort: CatalogSort;
  onSortChange: (value: CatalogSort) => void;
  onExport: () => void;
}

export function ExportCatalogModal({
  isOpen,
  onClose,
  availableCount,
  quantity,
  onQuantityChange,
  sort,
  onSortChange,
  onExport,
}: ExportCatalogModalProps) {
  if (!isOpen) return null;

  const maximum = Math.min(availableCount, MAX_PDF_PRODUCTS);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-catalog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-allvino-primary/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-white/30 bg-allvino-background p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
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
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-allvino-outline-variant px-3 py-2 text-xs font-bold text-allvino-primary"
          >
            Fechar
          </button>
        </div>

        <p className="mb-5 rounded-lg bg-allvino-surface-container-low p-3 text-xs leading-relaxed text-allvino-on-surface-variant">
          Há <strong>{availableCount}</strong> rótulos disponíveis com os filtros atuais.
          O PDF incluirá a capa e a quantidade de produtos escolhida abaixo.
        </p>

        <div className="space-y-5">
          <label>
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-allvino-primary">
              Quantidade de produtos
            </span>
            <input
              type="number"
              min={1}
              max={maximum}
              value={quantity}
              onChange={(event) => onQuantityChange(Number(event.target.value))}
              className={fieldClassName}
            />
            <span className="mt-1.5 block text-[11px] text-allvino-on-surface-variant">
              Máximo nesta exportação: {maximum} produtos.
            </span>
          </label>

          <label>
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-allvino-primary">
              Ordem das páginas
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

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-allvino-outline-variant px-5 py-3 text-sm font-bold text-allvino-primary transition hover:bg-allvino-surface-container-high"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={availableCount === 0 || quantity < 1 || quantity > maximum}
            onClick={onExport}
            className="rounded-lg bg-allvino-primary px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-allvino-primary-container disabled:cursor-not-allowed disabled:opacity-50"
          >
            Gerar catálogo PDF
          </button>
        </div>
      </div>
    </div>
  );
}
