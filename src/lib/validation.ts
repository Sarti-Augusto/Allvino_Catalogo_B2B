export const DEFAULT_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=300&auto=format&fit=crop";

export function requiredText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized ? normalized : null;
}

export function optionalText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return value.trim();
}

export function parseFiniteNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== "string") return null;

  const normalized = value.trim().replace(",", ".");
  if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) return null;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseNonNegativeNumber(value: unknown): number | null {
  const parsed = parseFiniteNumber(value);
  return parsed !== null && parsed >= 0 ? parsed : null;
}

export function parseNonNegativeInteger(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isSafeInteger(value) && value >= 0 ? value : null;
  }

  if (typeof value !== "string" || !/^\d+$/.test(value.trim())) return null;

  const parsed = Number(value.trim());
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export function parseBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

export function isSafeImageSource(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false;

  const source = value.trim();
  if (/^data:image\/(?:png|jpe?g|webp);base64,[A-Za-z0-9+/=\s]+$/i.test(source)) {
    return true;
  }

  try {
    return new URL(source).protocol === "https:";
  } catch {
    return false;
  }
}
