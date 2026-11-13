const LOCAL_BACKEND_ORIGIN = "http://localhost:5000";

export const BACKEND_API_URL_ERROR =
  "Backend service URL is missing or invalid. Set BOOKING_API_URL to the backend origin.";

export function getBackendApiUrl(path: string): URL | null {
  const configuredOrigin = process.env.BOOKING_API_URL?.trim();
  const origin =
    configuredOrigin ||
    (process.env.NODE_ENV === "production" ? "" : LOCAL_BACKEND_ORIGIN);
  if (!origin) return null;

  try {
    const base = new URL(origin);
    if (
      !["http:", "https:"].includes(base.protocol) ||
      base.username ||
      base.password ||
      base.pathname !== "/" ||
      base.search ||
      base.hash
    ) {
      return null;
    }

    if (process.env.NODE_ENV === "production") {
      const hostname = base.hostname.toLowerCase().replace(/^\[|\]$/g, "");
      if (
        base.protocol !== "https:" ||
        hostname === "localhost" ||
        hostname.endsWith(".localhost") ||
        /^127\./.test(hostname) ||
        hostname === "::1" ||
        hostname === "0.0.0.0"
      ) {
        return null;
      }
    }

    return new URL(path, base.origin);
  } catch {
    return null;
  }
}
