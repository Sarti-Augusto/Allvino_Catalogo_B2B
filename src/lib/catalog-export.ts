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

export const CATALOG_EXPORT_SORT_FIELDS = [
  { value: "name", label: "Ordem alfabética" },
  { value: "price", label: "Preço" },
  { value: "country", label: "País" },
  { value: "grape", label: "Tipo de uva" },
  { value: "winery", label: "Vinícola" },
] as const;

export type CatalogSortField =
  (typeof CATALOG_EXPORT_SORT_FIELDS)[number]["value"];
export type CatalogSortDirection = "asc" | "desc";

export interface CatalogSortRule {
  field: CatalogSortField;
  direction: CatalogSortDirection;
}

export const DEFAULT_EXPORT_SORT_RULES: CatalogSortRule[] = [
  { field: "name", direction: "asc" },
];

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

export function catalogSortToRule(sort: CatalogSort): CatalogSortRule {
  if (sort === "price-asc" || sort === "price-desc") {
    return { field: "price", direction: sort.endsWith("desc") ? "desc" : "asc" };
  }
  if (sort === "country-asc") return { field: "country", direction: "asc" };
  if (sort === "grape-asc") return { field: "grape", direction: "asc" };
  if (sort === "name-desc") return { field: "name", direction: "desc" };

  return { field: "name", direction: "asc" };
}

export function normalizeCatalogSortRules(value: unknown): CatalogSortRule[] {
  const entries: unknown[] = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",").filter(Boolean)
      : [];
  const validFields = new Set<CatalogSortField>(
    CATALOG_EXPORT_SORT_FIELDS.map((option) => option.value),
  );
  const usedFields = new Set<CatalogSortField>();
  const rules: CatalogSortRule[] = [];

  for (const entry of entries) {
    let field: unknown;
    let direction: unknown;

    if (typeof entry === "string") {
      [field, direction] = entry.split(":");
    } else if (entry && typeof entry === "object") {
      field = (entry as Record<string, unknown>).field;
      direction = (entry as Record<string, unknown>).direction;
    }

    if (
      typeof field !== "string" ||
      !validFields.has(field as CatalogSortField) ||
      usedFields.has(field as CatalogSortField)
    ) {
      continue;
    }

    const normalizedField = field as CatalogSortField;
    rules.push({
      field: normalizedField,
      direction: direction === "desc" ? "desc" : "asc",
    });
    usedFields.add(normalizedField);

    if (rules.length === CATALOG_EXPORT_SORT_FIELDS.length) break;
  }

  return rules.length ? rules : [...DEFAULT_EXPORT_SORT_RULES];
}

export function serializeCatalogSortRules(rules: CatalogSortRule[]): string {
  return normalizeCatalogSortRules(rules)
    .map((rule) => `${rule.field}:${rule.direction}`)
    .join(",");
}

export function parseCatalogProductIds(value: unknown): string[] {
  const values = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [];

  return Array.from(
    new Set(
      values
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        // The catalog contains both UUIDs and legacy slugs such as `vinho-05`.
        // Keep the accepted alphabet intentionally narrow before using the IDs
        // in the database filter.
        .filter((item) => /^[A-Za-z0-9_-]{1,64}$/.test(item)),
    ),
  ).slice(0, MAX_PDF_PRODUCTS);
}

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

export function sortCatalogProductsByRules<T extends CatalogProductLike>(
  products: T[],
  rules: CatalogSortRule[],
): T[] {
  const normalizedRules = normalizeCatalogSortRules(rules);

  return [...products].sort((left, right) => {
    for (const rule of normalizedRules) {
      let result = 0;

      if (rule.field === "name") result = compareText(left.name, right.name);
      if (rule.field === "price") result = effectivePrice(left) - effectivePrice(right);
      if (rule.field === "country") {
        result = compareText(left.paisOrigem, right.paisOrigem);
      }
      if (rule.field === "grape") result = compareText(left.uva, right.uva);
      if (rule.field === "winery") result = compareText(left.vinicola, right.vinicola);

      if (result !== 0) return rule.direction === "desc" ? -result : result;
    }

    return compareText(left.name, right.name);
  });
}
