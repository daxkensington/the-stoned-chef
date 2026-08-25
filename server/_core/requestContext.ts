/**
 * requestContext — fleet-shared capture of the inbound request for fraud/police.
 * ZERO dependencies, ZERO I/O. Byte-identical in every storefront repo
 * (Mohawk `lib/`, Spirit Fire / NorthLucid / Boreal / GC / 7OH / Stoned Chef
 * `server/_core/`).
 *
 * Each site's adapter writes this snapshot onto the order (ipAddress column
 * and/or paymentMeta.requestContext) and onto login attempts. Do not store
 * PAN, CVV, passwords, or session secrets here.
 *
 * Trust model:
 *   - Cloudflare in front: `cf-connecting-ip` + `cf-ip*` geo. Vercel geo is
 *     the CF PoP and must not be used as a fallback (Spirit Fire 2026-07-25).
 *   - Vercel only: `x-vercel-forwarded-for` + `x-vercel-ip-*`.
 *   - Never key on the leftmost `x-forwarded-for` hop — a client can spoof it.
 *     The last hop is the one the platform appended.
 *
 * IPv6 privacy extensions rotate the host, so we also store `ipPrefix` (/64)
 * to join accounts on the same connection (Laganiere, Spirit Fire 2026).
 */

export const REQUEST_CONTEXT_META_KEY = "requestContext";

export type RequestEdge = "cloudflare" | "vercel" | "unknown";

export interface RequestContext {
  ip: string | null;
  ipPrefix: string | null;
  ipSource: string | null;
  userAgent: string | null;
  acceptLanguage: string | null;
  referer: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  timezone: string | null;
  ja4: string | null;
  secChUa: string | null;
  secChUaMobile: string | null;
  secChUaPlatform: string | null;
  vercelId: string | null;
  visitorSessionId: string | null;
  edge: RequestEdge;
  capturedAt: string;
}

type HeaderSource =
  | { get(name: string): string | null | undefined }
  | Record<string, string | string[] | undefined | null>
  | null
  | undefined;

function firstNonEmpty(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  const first = raw.split(",")[0]?.trim();
  return first || undefined;
}

function lastNonEmpty(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  const parts = raw
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  return parts[parts.length - 1];
}

function header(src: HeaderSource, name: string): string | undefined {
  if (!src) return undefined;
  const lower = name.toLowerCase();
  if (typeof (src as { get?: unknown }).get === "function") {
    const getter = src as { get(name: string): string | null | undefined };
    const v = getter.get(name) ?? getter.get(lower);
    return typeof v === "string" && v.trim() ? v.trim() : undefined;
  }
  const rec = src as Record<string, string | string[] | undefined | null>;
  const v = rec[name] ?? rec[lower];
  const raw = Array.isArray(v) ? v[0] : v;
  return typeof raw === "string" && raw.trim() ? raw.trim() : undefined;
}

function cap(value: string | undefined | null, max: number): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function decode(value: string | undefined | null): string | null {
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function cookieValue(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq < 1) continue;
    const key = part.slice(0, eq).trim();
    if (key !== name) continue;
    const val = part.slice(eq + 1).trim();
    return cap(val, 128);
  }
  return null;
}

/**
 * IPv6 /64 network prefix, or the whole IPv4 address.
 * Compressed (`::`) addresses fall back to the exact string rather than a
 * too-broad prefix.
 */
export function ipPrefix(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const trimmed = ip.trim();
  if (!trimmed) return null;
  if (trimmed.includes(":")) {
    if (trimmed.includes("::")) return trimmed.slice(0, 64);
    const hextets = trimmed.split(":");
    if (hextets.length < 4) return trimmed.slice(0, 64);
    return hextets.slice(0, 4).join(":");
  }
  return trimmed.slice(0, 64);
}

function pickIp(src: HeaderSource): { ip: string | null; source: string | null; edge: RequestEdge } {
  const cf = firstNonEmpty(header(src, "cf-connecting-ip"));
  if (cf) return { ip: cap(cf, 64), source: "cf-connecting-ip", edge: "cloudflare" };

  const vercel = firstNonEmpty(header(src, "x-vercel-forwarded-for"));
  if (vercel) return { ip: cap(vercel, 64), source: "x-vercel-forwarded-for", edge: "vercel" };

  const real = firstNonEmpty(header(src, "x-real-ip"));
  if (real) return { ip: cap(real, 64), source: "x-real-ip", edge: "unknown" };

  const xffLast = lastNonEmpty(header(src, "x-forwarded-for"));
  if (xffLast) return { ip: cap(xffLast, 64), source: "x-forwarded-for-last", edge: "unknown" };

  return { ip: null, source: null, edge: "unknown" };
}

function pickGeo(src: HeaderSource, edge: RequestEdge): {
  country: string | null;
  region: string | null;
  city: string | null;
  timezone: string | null;
} {
  // Cloudflare geo is the visitor. Vercel geo behind Cloudflare is the PoP.
  if (edge === "cloudflare" || header(src, "cf-ipcountry")) {
    const country = cap(header(src, "cf-ipcountry")?.toUpperCase() ?? null, 8);
    const region =
      cap(header(src, "cf-region-code"), 16) || cap(header(src, "cf-region"), 64);
    const city = cap(decode(header(src, "cf-ipcity") ?? null), 128);
    return { country: country === "XX" || country === "T1" ? null : country, region, city, timezone: null };
  }
  return {
    country: cap(header(src, "x-vercel-ip-country")?.toUpperCase() ?? null, 8),
    region: cap(header(src, "x-vercel-ip-country-region"), 16),
    city: cap(decode(header(src, "x-vercel-ip-city") ?? null), 128),
    timezone: cap(decode(header(src, "x-vercel-ip-timezone") ?? null), 64),
  };
}

export function collectRequestContext(src: HeaderSource): RequestContext {
  const { ip, source, edge } = pickIp(src);
  const geo = pickGeo(src, edge);
  const cookie = header(src, "cookie");
  return {
    ip,
    ipPrefix: ipPrefix(ip),
    ipSource: source,
    userAgent: cap(header(src, "user-agent"), 512),
    acceptLanguage: cap(header(src, "accept-language"), 128),
    referer: cap(header(src, "referer") || header(src, "referrer"), 512),
    country: geo.country,
    region: geo.region,
    city: geo.city,
    timezone: geo.timezone,
    ja4: cap(header(src, "x-vercel-ja4-digest") || header(src, "x-ja4"), 128),
    secChUa: cap(header(src, "sec-ch-ua"), 256),
    secChUaMobile: cap(header(src, "sec-ch-ua-mobile"), 16),
    secChUaPlatform: cap(header(src, "sec-ch-ua-platform"), 64),
    vercelId: cap(header(src, "x-vercel-id"), 128),
    visitorSessionId:
      cookieValue(cookie, "mm-vsession") ||
      cookieValue(cookie, "sf-vsession") ||
      cookieValue(cookie, "nl-vsession") ||
      null,
    edge,
    capturedAt: new Date().toISOString(),
  };
}

/** Merge the snapshot into a namespaced paymentMeta JSON string. Preserves other keys. */
export function withRequestContextMeta(
  paymentMeta: string | null | undefined,
  ctx: RequestContext,
): string {
  let doc: Record<string, unknown> = {};
  if (paymentMeta) {
    try {
      const parsed = JSON.parse(paymentMeta);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        doc = parsed as Record<string, unknown>;
      }
    } catch {
      // malformed → start clean; never throw on our own column
    }
  }
  doc[REQUEST_CONTEXT_META_KEY] = ctx;
  return JSON.stringify(doc);
}

/** Same merge for JSON columns (Spirit Fire). */
export function withRequestContextObject(
  paymentMeta: unknown,
  ctx: RequestContext,
): Record<string, unknown> {
  const doc =
    paymentMeta && typeof paymentMeta === "object" && !Array.isArray(paymentMeta)
      ? { ...(paymentMeta as Record<string, unknown>) }
      : {};
  doc[REQUEST_CONTEXT_META_KEY] = ctx;
  return doc;
}

/** Order-row columns for stores that persist a dedicated snapshot. */
export function sessionColumns(ctx: RequestContext): {
  ipAddress: string | null;
  userAgent: string | null;
  sessionContext: string;
} {
  return {
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
    sessionContext: JSON.stringify(ctx),
  };
}

export function isMissingColumnError(err: unknown): boolean {
  const m = String((err as { message?: string })?.message || err);
  return /unknown column|column .* does not exist|no such column|undefined column/i.test(m);
}
