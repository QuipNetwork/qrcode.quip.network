// SPDX-License-Identifier: AGPL-3.0-or-later

// A scheme only counts if it is followed by "//" (https://, ftp://, ...) or
// is a known scheme that has no slashes (mailto:, tel:, ...). Otherwise
// "quip.network:8080/x" and "localhost:5173" would read as schemes, because
// a bare host or host:port also matches "letters, digits, dots before a colon".
const SCHEME_WITH_SLASHES = /^[a-z][a-z0-9+.-]*:\/\//i;
const SCHEME_PREFIX = /^([a-z][a-z0-9+.-]*):/i;
const OPAQUE_SCHEMES = new Set(["mailto", "tel", "sms", "geo", "bitcoin", "ethereum"]);
const PREFIX = "qrcode_quip";
const MAX_SLUG = 60;
const QUIP_SUFFIX = ".quip.network";

function hasScheme(text: string): boolean {
  if (SCHEME_WITH_SLASHES.test(text)) return true;
  const match = SCHEME_PREFIX.exec(text);
  return match !== null && OPAQUE_SCHEMES.has(match[1]!.toLowerCase());
}

/**
 * Trims the input. Adds https:// to a bare domain such as "quip.network/qvrf",
 * because phone cameras treat a code without a scheme as plain text. Leaves
 * an email-shaped address such as "hi@quip.network" unchanged.
 */
export function normalizeInput(raw: string): string {
  const text = raw.trim();
  const looksLikeEmail = text.includes("@") && !text.includes("/");
  const looksLikeBareDomain =
    !hasScheme(text) && !looksLikeEmail && !/\s/.test(text) && text.includes(".");
  return looksLikeBareDomain ? `https://${text}` : text;
}

function hostParts(hostname: string): string[] {
  const host = hostname.replace(/^www\./, "");
  if (host === "quip.network") return [];
  if (host.endsWith(QUIP_SUFFIX)) return [host.slice(0, -QUIP_SUFFIX.length)];
  return host.split(".").slice(0, -1);
}

/** Builds the download name, for example qrcode_quip_links.png. */
export function filenameFor(data: string): string {
  let parts: string[];
  try {
    const url = new URL(data);
    parts = [...hostParts(url.hostname), ...url.pathname.split("/")];
  } catch {
    parts = [data];
  }
  const slug = parts
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG)
    .replace(/-+$/, "");
  return `${PREFIX}_${slug || "home"}.png`;
}
