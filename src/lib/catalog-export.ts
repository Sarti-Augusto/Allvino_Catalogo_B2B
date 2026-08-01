export const MAX_PDF_PRODUCTS = 200;

export const CATALOG_SORT_OPTIONS = [
  { value: "name-asc", label: "Nome (A - Z)" },
  { value: "name-desc", label: "Nome (Z - A)" },
  { value: "category-asc", label: "Tipo de vinho" },
  { value: "country-asc", label: "País de origem" },
  { value: "grape-asc", label: "Variedade de uva" },
  { value: "price-asc", label: "Preço crescente" },
  { value: "price-desc", label: "Preço decrescente" },
] as const;

export type CatalogSort = (typeof CATALOG_SORT_OPTIONS)[number]["value"];

export interface CatalogFilters {
  search?: string;
  grape?: string;
  country?: string;
  winery?: string;
  category?: string;
}

interface CatalogProductLike {
  name: string;
  vinicola: string;
  uva: string;
  paisOrigem: string;
  regiao: string;
  categoria: string;
  precoOriginal: number;
  precoPromocional: number | null;
}

const compareText = (left: string, right: string) =>
  left.localeCompare(right, "pt-BR", { numeric: true, sensitivity: "base" });

const effectivePrice = (product: CatalogProductLike) =>
  product.precoPromocional ?? product.precoOriginal;

export function normalizeCatalogSort(value: string | null | undefined): CatalogSort {
  return CATALOG_SORT_OPTIONS.some((option) => option.value === value)
    ? (value as CatalogSort)
    : "name-asc";
}

export function parseCatalogLimit(value: string | null): number | null {
  if (!value) return null;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return null;

  return Math.min(parsed, MAX_PDF_PRODUCTS);
}

export function filterCatalogProducts<T extends CatalogProductLike>(
  products: T[],
  filters: CatalogFilters,
): T[] {
  const search = filters.search?.trim().toLocaleLowerCase("pt-BR") || "";
  const grape = filters.grape?.trim().toLocaleLowerCase("pt-BR") || "";

  return products.filter((product) => {
    const matchesSearch =
      !search ||
      product.name.toLocaleLowerCase("pt-BR").includes(search) ||
      product.vinicola.toLocaleLowerCase("pt-BR").includes(search) ||
      product.regiao.toLocaleLowerCase("pt-BR").includes(search);
    const matchesGrape =
      !grape || product.uva.toLocaleLowerCase("pt-BR").includes(grape);
    const matchesCountry =
      !filters.country || product.paisOrigem === filters.country;
    const matchesWinery =
      !filters.winery || product.vinicola === filters.winery;
    const matchesCategory =
      !filters.category || (product.categoria || "Tinto") === filters.category;

    return (
      matchesSearch &&
      matchesGrape &&
      matchesCountry &&
      matchesWinery &&
      matchesCategory
    );
  });
}

export function sortCatalogProducts<T extends CatalogProductLike>(
  products: T[],
  sort: CatalogSort,
): T[] {
  return [...products].sort((left, right) => {
    let result = 0;

    if (sort === "name-desc") result = compareText(right.name, left.name);
    if (sort === "category-asc") {
      result = compareText(left.categoria || "Tinto", right.categoria || "Tinto");
    }
    if (sort === "country-asc") {
      result = compareText(left.paisOrigem, right.paisOrigem);
    }
    if (sort === "grape-asc") result = compareText(left.uva, right.uva);
    if (sort === "price-asc") result = effectivePrice(left) - effectivePrice(right);
    if (sort === "price-desc") result = effectivePrice(right) - effectivePrice(left);
    if (sort === "name-asc") result = compareText(left.name, right.name);

    return result || compareText(left.name, right.name);
  });
}
