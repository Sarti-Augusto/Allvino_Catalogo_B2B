const DEFAULT_BROWSERLESS_ENDPOINT = "wss://production-sfo.browserless.io";

export function resolveBrowserlessEndpoint(
  configuredValue: string | undefined
): string | undefined {
  const value = configuredValue?.trim();

  if (!value) return undefined;

  if (/^wss?:\/\//i.test(value)) {
    // Validate full WebSocket URLs early so Puppeteer never receives malformed input.
    new URL(value);
    return value;
  }

  if (/^https?:\/\//i.test(value)) {
    const url = new URL(value);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    return url.toString();
  }

  if (value.includes("://")) {
    throw new Error(
      "BROWSERLESS_CONNECT_URL deve ser um token ou uma URL HTTP/WebSocket válida."
    );
  }

  return `${DEFAULT_BROWSERLESS_ENDPOINT}?token=${encodeURIComponent(value)}`;
}

export function resolveBrowserlessPdfEndpoint(
  configuredValue: string | undefined
): string | undefined {
  const browserEndpoint = resolveBrowserlessEndpoint(configuredValue);

  if (!browserEndpoint) return undefined;

  const url = new URL(browserEndpoint);
  url.protocol = url.protocol === "wss:" ? "https:" : "http:";
  url.pathname = "/pdf";
  url.hash = "";

  return url.toString();
}
